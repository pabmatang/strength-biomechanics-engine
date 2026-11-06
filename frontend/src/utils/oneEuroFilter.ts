/**
 * OneEuroFilter (1€ Filter) & Pose Landmark Smoother
 *
 * Implements the 1€ Filter algorithm (Casiez, Roussel, Vogel - ACM CHI 2012).
 * Adaptive low-pass filter specifically designed for noisy human motion tracking:
 * - High smoothing at low velocities (eliminates jitter and high-frequency tremor).
 * - Low latency / negligible phase lag at high velocities (dynamic cutoff frequency).
 *
 * Guaranteed: No biomechanical calculation should ever be performed on raw keypoints.
 */

export interface OneEuroParams {
  minCutoff: number; // Minimum cutoff frequency in Hz (typically 0.8 - 1.5 Hz)
  beta: number;      // Speed coefficient (typically 0.005 - 0.02)
  dCutoff: number;   // Cutoff frequency for derivative filtering (typically 1.0 Hz)
}

export const DEFAULT_ONE_EURO_PARAMS: OneEuroParams = {
  minCutoff: 1.0,
  beta: 0.008,
  dCutoff: 1.0
};

/**
 * Basic 1st-order Low-Pass Filter
 */
class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  constructor(private alpha: number = 0.5) {}

  public filter(value: number, alpha: number): number {
    this.alpha = alpha;
    if (this.s === null) {
      this.s = value;
    } else {
      this.s = alpha * value + (1.0 - alpha) * this.s;
    }
    this.y = value;
    return this.s;
  }

  public filterWithAlpha(value: number): number {
    return this.filter(value, this.alpha);
  }

  public hasLastRawValue(): boolean {
    return this.y !== null;
  }

  public lastRawValue(): number {
    return this.y ?? 0;
  }

  public lastFilteredValue(): number {
    return this.s ?? 0;
  }

  public reset(): void {
    this.y = null;
    this.s = null;
  }
}

/**
 * 1D OneEuroFilter implementation
 */
export class OneEuroFilter {
  private xFilt: LowPassFilter;
  private dxFilt: LowPassFilter;
  private lastTime: number | null = null;

  constructor(
    private minCutoff: number = DEFAULT_ONE_EURO_PARAMS.minCutoff,
    private beta: number = DEFAULT_ONE_EURO_PARAMS.beta,
    private dCutoff: number = DEFAULT_ONE_EURO_PARAMS.dCutoff
  ) {
    this.xFilt = new LowPassFilter();
    this.dxFilt = new LowPassFilter();
  }

  private calculateAlpha(rate: number, cutoff: number): number {
    const tau = 1.0 / (2.0 * Math.PI * cutoff);
    const te = 1.0 / Math.max(rate, 1e-5);
    return 1.0 / (1.0 + tau / te);
  }

  /**
   * Filters a new raw scalar measurement at timestamp `timestampMs` (in milliseconds or seconds).
   */
  public filter(value: number, timestampMs: number): number {
    if (this.lastTime === null || timestampMs <= this.lastTime) {
      this.lastTime = timestampMs;
      return this.xFilt.filter(value, 1.0);
    }

    // Time delta in seconds
    const dt = Math.max((timestampMs - this.lastTime) / 1000.0, 1e-4);
    this.lastTime = timestampMs;
    const rate = 1.0 / dt;

    // Estimate derivative
    const dx = this.xFilt.hasLastRawValue()
      ? (value - this.xFilt.lastFilteredValue()) / dt
      : 0.0;

    const edx = this.dxFilt.filter(dx, this.calculateAlpha(rate, this.dCutoff));

    // Dynamic cutoff based on filtered derivative speed
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    // Filter value with dynamic alpha
    return this.xFilt.filter(value, this.calculateAlpha(rate, cutoff));
  }

  public reset(): void {
    this.xFilt.reset();
    this.dxFilt.reset();
    this.lastTime = null;
  }
}

/**
 * 2D Point representation
 */
export interface Point2D {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * 2D Coordinate OneEuroFilter for a single landmark
 */
export class OneEuroFilter2D {
  private xFilter: OneEuroFilter;
  private yFilter: OneEuroFilter;
  private zFilter: OneEuroFilter;

  constructor(params: OneEuroParams = DEFAULT_ONE_EURO_PARAMS) {
    this.xFilter = new OneEuroFilter(params.minCutoff, params.beta, params.dCutoff);
    this.yFilter = new OneEuroFilter(params.minCutoff, params.beta, params.dCutoff);
    this.zFilter = new OneEuroFilter(params.minCutoff, params.beta, params.dCutoff);
  }

  public filter(pt: Point2D, timestampMs: number): Point2D {
    return {
      x: this.xFilter.filter(pt.x, timestampMs),
      y: this.yFilter.filter(pt.y, timestampMs),
      z: pt.z !== undefined ? this.zFilter.filter(pt.z, timestampMs) : undefined,
      visibility: pt.visibility
    };
  }

  public reset(): void {
    this.xFilter.reset();
    this.yFilter.reset();
    this.zFilter.reset();
  }
}

/**
 * Full Body 33-Landmark Pose Smoother
 * Keeps persistent filters for each landmark to prevent memory reallocations.
 */
export class PoseLandmarkSmoother {
  private landmarkFilters: Map<string, OneEuroFilter2D> = new Map();

  constructor(private params: OneEuroParams = DEFAULT_ONE_EURO_PARAMS) {}

  public smoothLandmarks<T extends Record<string, Point2D>>(
    keypoints: T,
    timestampMs: number
  ): T {
    const smoothed: Record<string, Point2D> = {};

    for (const [name, pt] of Object.entries(keypoints)) {
      if (!pt) continue;

      let filter = this.landmarkFilters.get(name);
      if (!filter) {
        filter = new OneEuroFilter2D(this.params);
        this.landmarkFilters.set(name, filter);
      }

      smoothed[name] = filter.filter(pt, timestampMs);
    }

    return smoothed as T;
  }

  public reset(): void {
    this.landmarkFilters.forEach(f => f.reset());
    this.landmarkFilters.clear();
  }
}
