export type DecodedFrame = {
  image: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

type LoaderOptions = {
  count: number;
  path: (index: number) => string;
  stride: number;
  workers: number;
  maxDecoded: number;
  decode?: typeof decodeFrame;
};

async function decodeFrame(
  url: string,
  signal: AbortSignal,
): Promise<DecodedFrame> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Frame request failed: ${response.status}`);
  const blob = await response.blob();
  if (typeof createImageBitmap === "function") {
    const image = await createImageBitmap(blob);
    return {
      image,
      width: image.width,
      height: image.height,
      release: () => image.close(),
    };
  }
  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = "async";
  image.src = objectUrl;
  try {
    await image.decode();
    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => {
        image.src = "";
        URL.revokeObjectURL(objectUrl);
      },
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

// loading lives outside react so scrubbing only changes priorities, not renders.
export class FrameLoader {
  readonly frames = new Map<number, DecodedFrame>();
  readonly failures = new Set<number>();
  readonly attempts = new Map<number, number>();
  readonly indices: number[];
  revision = 0;
  private target = 0;
  private pending = new Set<number>();
  private seen = new Set<number>();
  private active = new Map<number, AbortController>();
  private disposed = false;
  private started = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private idleId: number | undefined;

  constructor(private options: LoaderOptions) {
    this.indices = Array.from({ length: options.count }, (_, i) => i).filter(
      (i) =>
        i % options.stride === 0 ||
        i === options.count - 1 ||
        i === options.count / 2 - 1 ||
        i === options.count / 2,
    );
  }

  seed(index: number, image: HTMLImageElement) {
    if (!image.naturalWidth) return;
    this.frames.set(index, {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => {},
    });
    this.seen.add(index);
    this.revision += 1;
  }

  start() {
    this.started = true;
    this.request(this.target);
    this.scheduleIdle();
  }

  request(index: number) {
    if (this.disposed) return;
    this.target = Math.min(this.options.count - 1, Math.max(0, index));
    // drop stale wishes when a direct anchor jumps across the whole sequence.
    this.pending.clear();
    for (const candidate of this.indices) {
      if (
        Math.abs(candidate - this.target) <= this.options.stride * 3 &&
        !this.frames.has(candidate) &&
        !this.active.has(candidate) &&
        !this.failures.has(candidate)
      ) {
        this.pending.add(candidate);
      }
    }
    this.pump();
  }

  nearest(index: number) {
    let nearest: { index: number; frame: DecodedFrame } | undefined;
    for (const [candidate, frame] of this.frames) {
      if (
        !nearest ||
        Math.abs(candidate - index) < Math.abs(nearest.index - index)
      )
        nearest = { index: candidate, frame };
    }
    return nearest;
  }

  get decodedBytes() {
    return [...this.frames.values()].reduce(
      (total, frame) => total + frame.width * frame.height * 4,
      0,
    );
  }

  private pump() {
    if (this.disposed || !this.started) return;
    while (this.active.size < this.options.workers && this.pending.size) {
      const index = [...this.pending].sort(
        (a, b) => Math.abs(a - this.target) - Math.abs(b - this.target),
      )[0];
      this.pending.delete(index);
      void this.load(index);
    }
  }

  private async load(index: number) {
    const controller = new AbortController();
    this.active.set(index, controller);
    this.seen.add(index);
    try {
      let frame: DecodedFrame | undefined;
      // a failed request gets one retry; progress never depends on frame zero.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        this.attempts.set(index, (this.attempts.get(index) ?? 0) + 1);
        try {
          frame = await (this.options.decode ?? decodeFrame)(
            this.options.path(index),
            controller.signal,
          );
          break;
        } catch {
          if (controller.signal.aborted) return;
        }
      }
      if (!frame) {
        this.failures.add(index);
        return;
      }
      if (this.disposed) {
        frame.release();
        return;
      }
      this.frames.set(index, frame);
      // keep the active neighbourhood and release distant decoded bitmaps first.
      const farthest = [...this.frames.keys()]
        .filter((i) => i !== 0)
        .sort((a, b) => Math.abs(b - this.target) - Math.abs(a - this.target));
      while (this.frames.size > this.options.maxDecoded && farthest.length) {
        const evicted = farthest.shift()!;
        this.frames.get(evicted)?.release();
        this.frames.delete(evicted);
      }
      this.revision += 1;
    } finally {
      this.active.delete(index);
      this.pump();
      this.scheduleIdle();
    }
  }

  private scheduleIdle() {
    if (this.disposed || this.timer !== undefined || this.idleId !== undefined)
      return;
    // the rest arrives a frame at a time, away from first paint and interaction.
    this.timer = setTimeout(() => {
      this.timer = undefined;
      const fill = () => {
        this.idleId = undefined;
        if (this.disposed) return;
        if (!this.pending.size && !this.active.size) {
          const index = this.indices.find((i) => !this.seen.has(i));
          if (index !== undefined) this.pending.add(index);
        }
        this.pump();
      };
      if (typeof requestIdleCallback === "function")
        this.idleId = requestIdleCallback(fill, { timeout: 1000 });
      else fill();
    }, 500);
  }

  dispose() {
    this.disposed = true;
    clearTimeout(this.timer);
    if (this.idleId !== undefined) cancelIdleCallback(this.idleId);
    for (const controller of this.active.values()) controller.abort();
    for (const frame of this.frames.values()) frame.release();
    this.frames.clear();
    this.pending.clear();
  }
}
