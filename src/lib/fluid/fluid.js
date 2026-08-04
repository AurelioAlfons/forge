/*
MIT License

Copyright (c) 2017 Pavel Dobryakov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// Vendored from fluid/js/script.js. Wrapped as a module so React owns the
// lifecycle: takes a canvas, returns its own teardown. Solver untouched.

export function initFluid(canvas, options = {}) {

  resizeCanvas();

  const config = {
    SIM_RESOLUTION: options.tuning?.simResolution ?? 128,
    DYE_RESOLUTION: options.tuning?.dyeResolution ?? 1024,

    DENSITY_DISSIPATION: options.tuning?.densityDissipation ?? 1,
    VELOCITY_DISSIPATION: options.tuning?.velocityDissipation ?? 0.2,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: options.tuning?.curl ?? 30,
    SPLAT_RADIUS: options.tuning?.splatRadius ?? 0.1,
    SPLAT_FORCE: options.tuning?.splatForce ?? 6000,

    SHADING: true,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 10,

    PAUSED: false,
    BACK_COLOR: { r: 0, g: 0, b: 0 },

    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0,
    BLOOM_THRESHOLD: 0.75,
    BLOOM_SOFT_KNEE: 0.7,
  };

  // our tweak => the site tells us which section you're in and we recolor the fluid.
  // palette comes in from fluid-theme.ts now, so the colors live in one typed
  // place instead of being buried in here. null = the original random rainbow.
  let backColorTarget = { ...config.BACK_COLOR };
  let themePalette = options.palette ?? null;

  // listens for the theme message. portfolio posted this from a parent page into
  // an iframe — here we're not in one, so it's just window.postMessage to self.
  function onThemeMessage(event) {
    const data = event.data;
    if (!data || data.type !== "fluid-theme") return;

    if (data.backColor) backColorTarget = data.backColor;
    themePalette = Array.isArray(data.palette) ? data.palette : null;
  }

  window.addEventListener("message", onThemeMessage);

  let idleMode = true;
  let idleTimeout;
  let rafId;
  let idleSplatInterval;
  let lastMove = -1;
  let pointers = [];
  let splatStack = [];

  pointers.push(new pointerPrototype());

  const { gl, ext } = getWebGLContext(canvas);

  if (isMobile()) config.DYE_RESOLUTION = 512;

  if (!ext.supportLinearFiltering) {
    config.DYE_RESOLUTION = 512;
    config.SHADING = false;
    config.BLOOM = false;
  }

  function pointerPrototype() {
    this.id = -1;
    this.texcoordX = 0;
    this.texcoordY = 0;
    this.prevTexcoordX = 0;
    this.prevTexcoordY = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.down = false;
    this.moved = false;
    this.color = generateColor();
  }

  function getWebGLContext(canvas) {
    const params = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };

    let gl = canvas.getContext("webgl2", params);
    const isWebGL2 = !!gl;

    if (!isWebGL2) {
      gl =
        canvas.getContext("webgl", params) ||
        canvas.getContext("experimental-webgl", params);
    }

    let halfFloat;
    let supportLinearFiltering;

    if (isWebGL2) {
      gl.getExtension("EXT_color_buffer_float");
      supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
    } else {
      halfFloat = gl.getExtension("OES_texture_half_float");
      supportLinearFiltering = gl.getExtension("OES_texture_half_float_linear");
    }

    gl.clearColor(0.0, 0.0, 0.0, options.transparent ? 0.0 : 1.0);

    const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;

    let formatRGBA;
    let formatRG;
    let formatR;

    if (isWebGL2) {
      formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    } else {
      formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }

    return {
      gl,
      ext: {
        formatRGBA,
        formatRG,
        formatR,
        halfFloatTexType,
        supportLinearFiltering,
      },
    };
  }

  function getSupportedFormat(gl, internalFormat, format, type) {
    if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
      switch (internalFormat) {
        case gl.R16F:
          return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
        case gl.RG16F:
          return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
        default:
          return null;
      }
    }

    return { internalFormat, format };
  }

  function supportRenderTextureFormat(gl, internalFormat, format, type) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );

    return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  }

  function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
  }

  class Program {
    constructor(vertexShader, fragmentShader) {
      this.uniforms = {};
      this.program = createProgram(vertexShader, fragmentShader);
      this.uniforms = getUniforms(this.program);
    }

    bind() {
      gl.useProgram(this.program);
    }
  }

  class Material {
    constructor(vertexShader, fragmentShaderSource) {
      this.vertexShader = vertexShader;
      this.fragmentShaderSource = fragmentShaderSource;
      this.programs = [];
      this.activeProgram = null;
      this.uniforms = [];
    }

    setKeywords(keywords) {
      let hash = 0;
      for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);

      let program = this.programs[hash];
      if (program == null) {
        let fragmentShader = compileShader(
          gl.FRAGMENT_SHADER,
          this.fragmentShaderSource,
          keywords,
        );
        program = createProgram(this.vertexShader, fragmentShader);
        this.programs[hash] = program;
      }

      if (program === this.activeProgram) return;

      this.uniforms = getUniforms(program);
      this.activeProgram = program;
    }

    bind() {
      gl.useProgram(this.activeProgram);
    }
  }

  function createProgram(vertexShader, fragmentShader) {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw gl.getProgramInfoLog(program);
    return program;
  }

  function getUniforms(program) {
    let uniforms = [];
    let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

    for (let i = 0; i < uniformCount; i++) {
      let uniformName = gl.getActiveUniform(program, i).name;
      uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }

    return uniforms;
  }

  function compileShader(type, source, keywords) {
    source = addKeywords(source, keywords);

    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw gl.getShaderInfoLog(shader);
    return shader;
  }

  function addKeywords(source, keywords) {
    if (keywords == null) return source;

    let keywordsString = "";
    keywords.forEach((keyword) => {
      keywordsString += "#define " + keyword + "\n";
    });

    return keywordsString + source;
  }

  const baseVertexShader = compileShader(
    gl.VERTEX_SHADER,
    `
      precision highp float;

      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;

      void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `,
  );

  const blurVertexShader = compileShader(
    gl.VERTEX_SHADER,
    `
      precision highp float;

      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      uniform vec2 texelSize;

      void main () {
        vUv = aPosition * 0.5 + 0.5;
        float offset = 1.33333333;
        vL = vUv - texelSize * offset;
        vR = vUv + texelSize * offset;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `,
  );

  const blurShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;

      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      uniform sampler2D uTexture;

      void main () {
        vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
        sum += texture2D(uTexture, vL) * 0.35294117;
        sum += texture2D(uTexture, vR) * 0.35294117;
        gl_FragColor = sum;
      }
    `,
  );

  const copyShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;

      varying highp vec2 vUv;
      uniform sampler2D uTexture;

      void main () {
        gl_FragColor = texture2D(uTexture, vUv);
      }
    `,
  );

  const clearShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;

      varying highp vec2 vUv;
      uniform sampler2D uTexture;
      uniform float value;

      void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
      }
    `,
  );

  const colorShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      uniform vec4 color;

      void main () {
        gl_FragColor = color;
      }
    `,
  );

  const displayShaderSource = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform sampler2D uBloom;
    uniform vec2 texelSize;

    vec3 linearToGamma (vec3 color) {
      color = max(color, vec3(0));
      return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
    }

    void main () {
      vec3 c = texture2D(uTexture, vUv).rgb;

      #ifdef SHADING
        vec3 lc = texture2D(uTexture, vL).rgb;
        vec3 rc = texture2D(uTexture, vR).rgb;
        vec3 tc = texture2D(uTexture, vT).rgb;
        vec3 bc = texture2D(uTexture, vB).rgb;

        float dx = length(rc) - length(lc);
        float dy = length(tc) - length(bc);

        vec3 n = normalize(vec3(dx, dy, length(texelSize)));
        vec3 l = vec3(0.0, 0.0, 1.0);

        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
        c *= diffuse;
      #endif

      #ifdef BLOOM
        vec3 bloom = texture2D(uBloom, vUv).rgb;
        bloom = linearToGamma(bloom);
        c += bloom;
      #endif

      float a = max(c.r, max(c.g, c.b));
      gl_FragColor = vec4(c, a);
    }
  `;

  const bloomPrefilterShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;

      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform vec3 curve;
      uniform float threshold;

      void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        float br = max(c.r, max(c.g, c.b));
        float rq = clamp(br - curve.x, 0.0, curve.y);
        rq = curve.z * rq * rq;
        c *= max(rq, br - threshold) / max(br, 0.0001);
        gl_FragColor = vec4(c, 0.0);
      }
    `,
  );

  const bloomBlurShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;

      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uTexture;

      void main () {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture, vL);
        sum += texture2D(uTexture, vR);
        sum += texture2D(uTexture, vT);
        sum += texture2D(uTexture, vB);
        sum *= 0.25;
        gl_FragColor = sum;
      }
    `,
  );

  const bloomFinalShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;

      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uTexture;
      uniform float intensity;

      void main () {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture, vL);
        sum += texture2D(uTexture, vR);
        sum += texture2D(uTexture, vT);
        sum += texture2D(uTexture, vB);
        sum *= 0.25;
        gl_FragColor = sum * intensity;
      }
    `,
  );

  const splatShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision highp float;
      precision highp sampler2D;

      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;

      void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `,
  );

  const advectionShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision highp float;
      precision highp sampler2D;

      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform vec2 dyeTexelSize;
      uniform float dt;
      uniform float dissipation;

      vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;
        vec2 iuv = floor(st);
        vec2 fuv = fract(st);

        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
      }

      void main () {
      #ifdef MANUAL_FILTERING
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        vec4 result = bilerp(uSource, coord, dyeTexelSize);
      #else
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        vec4 result = texture2D(uSource, coord);
      #endif
        float decay = 1.0 + dissipation * dt;
        gl_FragColor = result / decay;
      }
    `,
    ext.supportLinearFiltering ? null : ["MANUAL_FILTERING"],
  );

  const divergenceShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;

      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;

      void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;

        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }

        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `,
  );

  const curlShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;

      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;

      void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `,
  );

  const vorticityShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision highp float;
      precision highp sampler2D;

      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;

      void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;

        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;

        vec2 vel = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
      }
    `,
  );

  const pressureShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;

      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;

      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `,
  );

  const gradientSubtractShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;

      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;

      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `,
  );

  const blit = (() => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      gl.STATIC_DRAW,
    );

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      gl.STATIC_DRAW,
    );

    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    return (destination) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
  })();

  let dye;
  let velocity;
  let divergence;
  let curl;
  let pressure;
  let bloom;
  let bloomFramebuffers = [];

  const blurProgram = new Program(blurVertexShader, blurShader);
  const copyProgram = new Program(baseVertexShader, copyShader);
  const clearProgram = new Program(baseVertexShader, clearShader);
  const colorProgram = new Program(baseVertexShader, colorShader);
  const bloomPrefilterProgram = new Program(
    baseVertexShader,
    bloomPrefilterShader,
  );
  const bloomBlurProgram = new Program(baseVertexShader, bloomBlurShader);
  const bloomFinalProgram = new Program(baseVertexShader, bloomFinalShader);
  const splatProgram = new Program(baseVertexShader, splatShader);
  const advectionProgram = new Program(baseVertexShader, advectionShader);
  const divergenceProgram = new Program(baseVertexShader, divergenceShader);
  const curlProgram = new Program(baseVertexShader, curlShader);
  const vorticityProgram = new Program(baseVertexShader, vorticityShader);
  const pressureProgram = new Program(baseVertexShader, pressureShader);
  const gradientSubtractProgram = new Program(
    baseVertexShader,
    gradientSubtractShader,
  );

  const displayMaterial = new Material(baseVertexShader, displayShaderSource);

  function initFramebuffers() {
    let simRes = getResolution(config.SIM_RESOLUTION);
    let dyeRes = getResolution(config.DYE_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const rg = ext.formatRG;
    const r = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    if (dye == null) {
      dye = createDoubleFBO(
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering,
      );
    } else {
      dye = resizeDoubleFBO(
        dye,
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering,
      );
    }

    if (velocity == null) {
      velocity = createDoubleFBO(
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering,
      );
    } else {
      velocity = resizeDoubleFBO(
        velocity,
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering,
      );
    }

    divergence = createFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST,
    );
    curl = createFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST,
    );
    pressure = createDoubleFBO(
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST,
    );

    initBloomFramebuffers();
  }

  function initBloomFramebuffers() {
    let res = getResolution(config.BLOOM_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    bloom = createFBO(
      res.width,
      res.height,
      rgba.internalFormat,
      rgba.format,
      texType,
      filtering,
    );
    bloomFramebuffers.length = 0;

    for (let i = 0; i < config.BLOOM_ITERATIONS; i++) {
      let width = res.width >> (i + 1);
      let height = res.height >> (i + 1);

      if (width < 2 || height < 2) break;

      let fbo = createFBO(
        width,
        height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering,
      );
      bloomFramebuffers.push(fbo);
    }
  }

  function createFBO(w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0);

    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let texelSizeX = 1.0 / w;
    let texelSizeY = 1.0 / h;

    return {
      texture,
      fbo,
      width: w,
      height: h,
      texelSizeX,
      texelSizeY,
      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      },
    };
  }

  function createDoubleFBO(w, h, internalFormat, format, type, param) {
    let fbo1 = createFBO(w, h, internalFormat, format, type, param);
    let fbo2 = createFBO(w, h, internalFormat, format, type, param);

    return {
      width: w,
      height: h,
      texelSizeX: fbo1.texelSizeX,
      texelSizeY: fbo1.texelSizeY,
      get read() {
        return fbo1;
      },
      set read(value) {
        fbo1 = value;
      },
      get write() {
        return fbo2;
      },
      set write(value) {
        fbo2 = value;
      },
      swap() {
        let temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      },
    };
  }

  function resizeFBO(target, w, h, internalFormat, format, type, param) {
    let newFBO = createFBO(w, h, internalFormat, format, type, param);

    copyProgram.bind();
    gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
    blit(newFBO.fbo);

    return newFBO;
  }

  function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
    if (target.width === w && target.height === h) return target;

    target.read = resizeFBO(
      target.read,
      w,
      h,
      internalFormat,
      format,
      type,
      param,
    );
    target.write = createFBO(w, h, internalFormat, format, type, param);
    target.width = w;
    target.height = h;
    target.texelSizeX = 1.0 / w;
    target.texelSizeY = 1.0 / h;

    return target;
  }

  function updateKeywords() {
    let displayKeywords = [];
    if (config.SHADING) displayKeywords.push("SHADING");
    if (config.BLOOM) displayKeywords.push("BLOOM");
    displayMaterial.setKeywords(displayKeywords);
  }

  updateKeywords();
  initFramebuffers();
  if (options.initialSplats !== 0) multipleSplats(options.initialSplats ?? 8);

  let lastUpdateTime = Date.now();
  let colorUpdateTimer = 0.0;
  update();

  function update() {
    const dt = calcDeltaTime();

    if (resizeCanvas()) initFramebuffers();
    updateColors(dt);
    updateBackColor(dt);
    applyInputs();

    if (!config.PAUSED) step(dt);

    render(null);
    rafId = requestAnimationFrame(update);
  }

  function calcDeltaTime() {
    let now = Date.now();
    let dt = (now - lastUpdateTime) / 1000;
    dt = Math.min(dt, 0.016666);
    lastUpdateTime = now;
    return dt;
  }

  function resizeCanvas() {
    let width = scaleByPixelRatio(canvas.clientWidth);
    let height = scaleByPixelRatio(canvas.clientHeight);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }

    return false;
  }

  function updateColors(dt) {
    if (!config.COLORFUL) return;

    colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;

    if (colorUpdateTimer >= 1) {
      colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
      pointers.forEach((p) => {
        p.color = generateColor();
      });
    }
  }

  // our tweak => ease the background toward the section's color instead of snapping
  function updateBackColor(dt) {
    const ease = Math.min(dt * 1.5, 1);
    config.BACK_COLOR.r += (backColorTarget.r - config.BACK_COLOR.r) * ease;
    config.BACK_COLOR.g += (backColorTarget.g - config.BACK_COLOR.g) * ease;
    config.BACK_COLOR.b += (backColorTarget.b - config.BACK_COLOR.b) * ease;
  }

  function applyInputs() {
    if (splatStack.length > 0) multipleSplats(splatStack.pop());

    pointers.forEach((p) => {
      if (p.moved) {
        p.moved = false;
        splatPointer(p);
      }
    });
  }

  function step(dt) {
    gl.disable(gl.BLEND);
    gl.viewport(0, 0, velocity.width, velocity.height);

    curlProgram.bind();
    gl.uniform2f(
      curlProgram.uniforms.texelSize,
      velocity.texelSizeX,
      velocity.texelSizeY,
    );
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(curl.fbo);

    vorticityProgram.bind();
    gl.uniform2f(
      vorticityProgram.uniforms.texelSize,
      velocity.texelSizeX,
      velocity.texelSizeY,
    );
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
    gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    blit(velocity.write.fbo);
    velocity.swap();

    divergenceProgram.bind();
    gl.uniform2f(
      divergenceProgram.uniforms.texelSize,
      velocity.texelSizeX,
      velocity.texelSizeY,
    );
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence.fbo);

    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
    blit(pressure.write.fbo);
    pressure.swap();

    pressureProgram.bind();
    gl.uniform2f(
      pressureProgram.uniforms.texelSize,
      velocity.texelSizeX,
      velocity.texelSizeY,
    );
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));

    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
      blit(pressure.write.fbo);
      pressure.swap();
    }

    gradientSubtractProgram.bind();
    gl.uniform2f(
      gradientSubtractProgram.uniforms.texelSize,
      velocity.texelSizeX,
      velocity.texelSizeY,
    );
    gl.uniform1i(
      gradientSubtractProgram.uniforms.uPressure,
      pressure.read.attach(0),
    );
    gl.uniform1i(
      gradientSubtractProgram.uniforms.uVelocity,
      velocity.read.attach(1),
    );
    blit(velocity.write.fbo);
    velocity.swap();

    advectionProgram.bind();
    gl.uniform2f(
      advectionProgram.uniforms.texelSize,
      velocity.texelSizeX,
      velocity.texelSizeY,
    );

    if (!ext.supportLinearFiltering) {
      gl.uniform2f(
        advectionProgram.uniforms.dyeTexelSize,
        velocity.texelSizeX,
        velocity.texelSizeY,
      );
    }

    let velocityId = velocity.read.attach(0);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(
      advectionProgram.uniforms.dissipation,
      config.VELOCITY_DISSIPATION,
    );
    blit(velocity.write.fbo);
    velocity.swap();

    gl.viewport(0, 0, dye.width, dye.height);

    if (!ext.supportLinearFiltering) {
      gl.uniform2f(
        advectionProgram.uniforms.dyeTexelSize,
        dye.texelSizeX,
        dye.texelSizeY,
      );
    }

    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
    gl.uniform1f(
      advectionProgram.uniforms.dissipation,
      config.DENSITY_DISSIPATION,
    );
    blit(dye.write.fbo);
    dye.swap();
  }

  function render(target) {
    if (config.BLOOM) applyBloom(dye.read, bloom);

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    let width = target == null ? gl.drawingBufferWidth : target.width;
    let height = target == null ? gl.drawingBufferHeight : target.height;

    gl.viewport(0, 0, width, height);

    let fbo = target == null ? null : target.fbo;
    if (options.transparent) gl.clear(gl.COLOR_BUFFER_BIT);
    else drawColor(fbo, normalizeColor(config.BACK_COLOR));
    drawDisplay(fbo, width, height);
  }

  function drawColor(fbo, color) {
    colorProgram.bind();
    gl.uniform4f(colorProgram.uniforms.color, color.r, color.g, color.b, 1);
    blit(fbo);
  }

  function drawDisplay(fbo, width, height) {
    displayMaterial.bind();

    if (config.SHADING) {
      gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height);
    }

    gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));

    if (config.BLOOM) {
      gl.uniform1i(displayMaterial.uniforms.uBloom, bloom.attach(1));
    }

    blit(fbo);
  }

  function applyBloom(source, destination) {
    if (bloomFramebuffers.length < 2) return;

    let last = destination;

    gl.disable(gl.BLEND);
    bloomPrefilterProgram.bind();

    let knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
    let curve0 = config.BLOOM_THRESHOLD - knee;
    let curve1 = knee * 2;
    let curve2 = 0.25 / knee;

    gl.uniform3f(bloomPrefilterProgram.uniforms.curve, curve0, curve1, curve2);
    gl.uniform1f(
      bloomPrefilterProgram.uniforms.threshold,
      config.BLOOM_THRESHOLD,
    );
    gl.uniform1i(bloomPrefilterProgram.uniforms.uTexture, source.attach(0));
    gl.viewport(0, 0, last.width, last.height);
    blit(last.fbo);

    bloomBlurProgram.bind();

    for (let i = 0; i < bloomFramebuffers.length; i++) {
      let dest = bloomFramebuffers[i];
      gl.uniform2f(
        bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY,
      );
      gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
      gl.viewport(0, 0, dest.width, dest.height);
      blit(dest.fbo);
      last = dest;
    }

    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);

    for (let i = bloomFramebuffers.length - 2; i >= 0; i--) {
      let baseTex = bloomFramebuffers[i];
      gl.uniform2f(
        bloomBlurProgram.uniforms.texelSize,
        last.texelSizeX,
        last.texelSizeY,
      );
      gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
      gl.viewport(0, 0, baseTex.width, baseTex.height);
      blit(baseTex.fbo);
      last = baseTex;
    }

    gl.disable(gl.BLEND);
    bloomFinalProgram.bind();
    gl.uniform2f(
      bloomFinalProgram.uniforms.texelSize,
      last.texelSizeX,
      last.texelSizeY,
    );
    gl.uniform1i(bloomFinalProgram.uniforms.uTexture, last.attach(0));
    gl.uniform1f(bloomFinalProgram.uniforms.intensity, config.BLOOM_INTENSITY);
    gl.viewport(0, 0, destination.width, destination.height);
    blit(destination.fbo);
  }

  function splatPointer(pointer) {
    // pulled fresh every splat so the caller can ease it — multiplying the force
    // instead of skipping the splat keeps the pointer tracking, so coming off the
    // pc doesn't fling a splat from a stale coordinate
    const influence = options.getPointerInfluence
      ? options.getPointerInfluence()
      : 1;

    let dx = pointer.deltaX * config.SPLAT_FORCE * influence;
    let dy = pointer.deltaY * config.SPLAT_FORCE * influence;
    splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
  }

  function multipleSplats(amount) {
    for (let i = 0; i < amount; i++) {
      const color = generateColor();

      color.r = Math.min(color.r * 1.2, 0.75);
      color.g = Math.min(color.g * 1.2, 0.75);
      color.b = Math.min(color.b * 1.2, 0.75);

      const x = Math.random();
      const y = Math.random();
      const dx = 1000 * (Math.random() - 0.5);
      const dy = 1000 * (Math.random() - 0.5);

      splat(x, y, dx, dy, color);
    }
  }

  function splat(x, y, dx, dy, color) {
    gl.viewport(0, 0, velocity.width, velocity.height);
    splatProgram.bind();
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
    gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(splatProgram.uniforms.point, x, y);
    gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
    gl.uniform1f(
      splatProgram.uniforms.radius,
      correctRadius(config.SPLAT_RADIUS / 100.0),
    );
    blit(velocity.write.fbo);
    velocity.swap();

    gl.viewport(0, 0, dye.width, dye.height);
    gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
    gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
    blit(dye.write.fbo);
    dye.swap();
  }

  function correctRadius(radius) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1) radius *= aspectRatio;
    return radius;
  }

  function checkLastMove() {
    const currentMove = window.performance.now();

    if (currentMove - lastMove > 18) {
      lastMove = currentMove;
      return true;
    }

    return false;
  }

  function onMouseMove(e) {
    if (
      options.ignoreSelector &&
      e
        .composedPath()
        .some(
          (target) =>
            target instanceof Element &&
            target.matches(options.ignoreSelector),
        )
    ) {
      updatePointerUpData(pointers[0]);
      return;
    }

    idleMode = false;
    clearTimeout(idleTimeout);

    idleTimeout = setTimeout(() => {
      idleMode = true;
    }, 2000);

    if (!checkLastMove()) return;

    const posX = scaleByPixelRatio(e.clientX);
    const posY = scaleByPixelRatio(e.clientY);
    const pointer = pointers[0];

    if (!pointer.down) {
      updatePointerDownData(pointer, -1, posX, posY);
    }

    updatePointerMoveData(pointer, posX, posY);
  }

  function onMouseLeave() {
    updatePointerUpData(pointers[0]);
  }

  window.addEventListener("mousemove", onMouseMove);
  // mouseleave on the window fires when the cursor actually leaves the page
  window.addEventListener("mouseleave", onMouseLeave);

  // Touch devices don't get continuous mousemove-style tracking (that would
  // require preventDefault() on touchmove, which blocks page scrolling).
  // Instead, each tap fires a one-off splash at that point.
  function onTouchStart(e) {
    const touch = e.touches[0];
    if (!touch) return;

    idleMode = false;
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      idleMode = true;
    }, 2000);

    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / rect.width;
    const y = 1.0 - (touch.clientY - rect.top) / rect.height;
    const dx = (Math.random() - 0.5) * 1000;
    const dy = (Math.random() - 0.5) * 1000;

    splat(x, y, dx, dy, generateColor());
  }

  // on window like the mouse handlers => canvas has pointer-events off, so it
  // never sees the touch either. passive, so taps and scrolling stay normal.
  window.addEventListener("touchstart", onTouchStart, { passive: true });

  if (options.idleSplats !== false) idleSplatInterval = setInterval(() => {
    if (!idleMode) return;

    for (let i = 0; i < 2; i++) {
      const color = generateColor();

      color.r = Math.min(color.r * 1.2, 0.75);
      color.g = Math.min(color.g * 1.2, 0.75);
      color.b = Math.min(color.b * 1.2, 0.75);

      const x = Math.random();
      const y = Math.random();
      const dx = (Math.random() - 0.5) * 500;
      const dy = (Math.random() - 0.5) * 500;

      splat(x, y, dx, dy, color);
    }
  }, 450);

  function updatePointerDownData(pointer, id, posX, posY) {
    pointer.id = id;
    pointer.down = true;
    pointer.moved = false;
    pointer.texcoordX = posX / canvas.width;
    pointer.texcoordY = 1.0 - posY / canvas.height;
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.deltaX = 0;
    pointer.deltaY = 0;
    pointer.color = generateColor();
  }

  function updatePointerMoveData(pointer, posX, posY) {
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.texcoordX = posX / canvas.width;
    pointer.texcoordY = 1.0 - posY / canvas.height;
    pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
    pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
    pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
  }

  function updatePointerUpData(pointer) {
    pointer.down = false;
  }

  function correctDeltaX(delta) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio < 1) delta *= aspectRatio;
    return delta;
  }

  function correctDeltaY(delta) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1) delta /= aspectRatio;
    return delta;
  }

  // our tweak => splat colors come from the section's palette if one is set,
  // otherwise it's the classic random rainbow
  function generateColor() {
    let c;

    if (themePalette && themePalette.length > 0) {
      const p = themePalette[Math.floor(Math.random() * themePalette.length)];
      c = HSVtoRGB(p.h, p.s, p.v);
    } else {
      c = HSVtoRGB(Math.random(), 1.0, 0.7);
    }

    c.r = Math.min(c.r, 0.75);
    c.g = Math.min(c.g, 0.75);
    c.b = Math.min(c.b, 0.75);

    return c;
  }

  function HSVtoRGB(h, s, v) {
    let r, g, b, i, f, p, q, t;

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }

    return { r, g, b };
  }

  function normalizeColor(input) {
    return {
      r: input.r / 255,
      g: input.g / 255,
      b: input.b / 255,
    };
  }

  function wrap(value, min, max) {
    let range = max - min;
    if (range === 0) return min;
    return ((value - min) % range) + min;
  }

  function getResolution(resolution) {
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;

    let min = Math.round(resolution);
    let max = Math.round(resolution * aspectRatio);

    if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
      return { width: max, height: min };
    }

    return { width: min, height: max };
  }

  function scaleByPixelRatio(input) {
    let pixelRatio = window.devicePixelRatio || 1;
    return Math.floor(input * pixelRatio);
  }

  function hashCode(s) {
    if (s.length === 0) return 0;

    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }

    return hash;
  }

  // everything this thing started, stopped. react strictmode double-mounts in
  // dev, so a half-finished teardown means two sims running at once.
  return function teardown(releaseContext = true) {
    cancelAnimationFrame(rafId);
    clearInterval(idleSplatInterval);
    clearTimeout(idleTimeout);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseleave", onMouseLeave);
    window.removeEventListener("message", onThemeMessage);
    window.removeEventListener("touchstart", onTouchStart);
    if (releaseContext) gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
