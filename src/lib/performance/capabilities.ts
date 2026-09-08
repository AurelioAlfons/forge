export type Capabilities = {
  width: number;
  coarsePointer: boolean;
  reducedMotion: boolean;
  deviceMemory: number | null;
  cores: number | null;
  saveData: boolean;
  webgl: boolean;
};

// the server's shell needs no hardware guess and starts with every effect off.
export const shellCapabilities: Capabilities = {
  width: 0,
  coarsePointer: true,
  reducedMotion: false,
  deviceMemory: null,
  cores: null,
  saveData: false,
  webgl: false,
};

let webglSupport: boolean | undefined;

export function readCapabilities(): Capabilities {
  const device = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const width = window.innerWidth;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const deviceMemory = device.deviceMemory ?? null;
  const cores = device.hardwareConcurrency || null;
  const saveData = device.connection?.saveData ?? false;
  // phones never need a webgl probe just to show a poster.
  if (
    webglSupport === undefined &&
    width >= 640 &&
    !reducedMotion &&
    !saveData
  ) {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      webglSupport = Boolean(gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webglSupport = false;
    }
  }
  return {
    width,
    coarsePointer: matchMedia("(pointer: coarse)").matches,
    reducedMotion,
    deviceMemory,
    cores,
    saveData,
    webgl: webglSupport ?? false,
  };
}
