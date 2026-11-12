import { PoseLandmarkSmoother, OneEuroFilter } from './oneEuroFilter';
import { BiomechanicalFSM, FsmPhase } from './biomechanicalFSM';
import {
  Keypoint2D,
  PoseModelQuality,
  calculateJointAngle,
  computeZoomedVideoRoi,
  extractPoseDataFromLandmarks,
  getMonotonicPoseTimestamp,
  getPoseLandmarker,
  NormalizedVideoRoi,
  remapLandmarksFromRoi
} from './videoPoseEstimator';
import {
  EXERCISE_PATTERNS,
  assessFramingQuality,
  auditCompletedRepetition,
  BiomechanicalTelemetryFrame,
  calculateTibialAngle,
  evaluateBiomechanicalFrame,
  ExercisePatternSpec,
  FootStabilityState,
  LoadType,
  RepetitionBiomechanicalAudit,
  ResistanceSourceType,
  TargetMuscle
} from './biomechanicsEngine';

// 1. Temporal Analysis & Sampling Parameters (Configurable, up to 30s @ 15fps as requested)
export const START_OFFSET_SEC = 0.0;
export const MAX_ANALYSIS_DURATION_SEC = 30.0;
export const TARGET_SAMPLE_FPS = 15;
export const MIN_LANDMARK_VISIBILITY = 0.60;
export const MIN_CONFIDENCE_THRESHOLD = 0.55;
export const DEFAULT_INFERENCE_MAX_WIDTH = 640;
export const DEFAULT_INFERENCE_MAX_HEIGHT = 480;

export interface TrimmedAnalysisWindow {
  startTime: number;
  endTime: number;
  duration: number;
  step: number;
  stepSec: number;
  totalFrames: number;
}

export interface KinematicEngineConfig {
  startOffsetSec?: number;
  maxAnalysisDurationSec?: number;
  targetSampleFps?: number;
  maxInferenceWidth?: number;
  maxInferenceHeight?: number;
  minVisibility?: number;
  minConfidence?: number;
  poseQuality?: PoseModelQuality;
}

export interface SerializablePoint2D {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  occludedRecovered?: boolean;
}

export interface FrameKinematics {
  frameIndex: number;
  timestampSec: number;
  primaryAngleDeg: number;
  elbowAngleDeg: number;
  kneeAngleDeg: number;
  hipAngleDeg: number;
  spinalAngleDeg: number;
  tibialAngleDeg: number;
  phase: FsmPhase;
  completedRepsCount: number;
  dominantSide: 'left' | 'right';
  keypoints: Record<string, SerializablePoint2D>;
  momentArms: {
    hip: number;
    knee: number;
    shoulder: number;
    elbow: number;
    hipOverKneeRatio: number;
  };
  muscleBias: string;
  muscleBiasLabel: string;
  telemetry: BiomechanicalTelemetryFrame;
  framingWarning: string | null;
}

export interface ClipKinematicsResult {
  version: '2.0';
  fps: number;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  dominantSide: 'left' | 'right';
  elapsedMs: number;
  frames: FrameKinematics[];
  auditedReps: RepetitionBiomechanicalAudit[];
  majorityFramingWarning: string | null;
}

export interface RawClipPoseSample {
  frameIndex: number;
  timestampSec: number;
  rawLandmarks: Array<{ x: number; y: number; z: number; visibility?: number }>;
}

export interface KinematicProgressUpdate {
  currentFrame: number;
  totalFrames: number;
  percent: number;
  elapsedMs: number;
}

export interface KinematicClipOptions {
  pattern?: ExercisePatternSpec;
  loadType?: LoadType;
  targetMuscle?: TargetMuscle;
  poseQuality?: PoseModelQuality;
  zoom?: number;
  panOffset?: { x: number; y: number };
  viewportSize?: { width: number; height: number };
  onProgress?: (progress: KinematicProgressUpdate) => void;
  signal?: AbortSignal;
}

export interface OcclusionTrackerState {
  avgForearmLeft: number | null;
  avgForearmRight: number | null;
  lastValidKeypoints: Record<string, SerializablePoint2D>;
}

export function createOcclusionTrackerState(): OcclusionTrackerState {
  return {
    avgForearmLeft: null,
    avgForearmRight: null,
    lastValidKeypoints: {}
  };
}

/**
 * Computes analysis time window: covers from 0.0s up to 30.0s at 15 FPS
 */
export function computeTrimmedAnalysisWindow(
  durationSec: number,
  configOrMaxSec: Pick<KinematicEngineConfig, 'startOffsetSec' | 'maxAnalysisDurationSec' | 'targetSampleFps'> | number = {},
  fpsOverride?: number
): TrimmedAnalysisWindow {
  const config = typeof configOrMaxSec === 'number'
    ? { maxAnalysisDurationSec: configOrMaxSec, targetSampleFps: fpsOverride }
    : configOrMaxSec;

  const maxDur = config.maxAnalysisDurationSec ?? MAX_ANALYSIS_DURATION_SEC;
  const fps = Math.max(5, Math.min(60, config.targetSampleFps ?? TARGET_SAMPLE_FPS));
  const step = 1.0 / fps;

  if (!Number.isFinite(durationSec) || durationSec <= 0.05) {
    return { startTime: 0, endTime: 0, duration: 0, step, stepSec: step, totalFrames: 0 };
  }

  const startTime = 0.0;
  const endTime = Math.min(durationSec, maxDur);
  const effectiveSpan = Math.max(0, endTime - startTime);
  const totalFrames = Math.max(1, Math.round(effectiveSpan * fps));

  return { startTime, endTime, duration: effectiveSpan, step, stepSec: step, totalFrames };
}

/**
 * Robust non-blocking monotonic seek on an auxiliary offscreen HTMLVideoElement
 */
async function seekMonotonic(
  video: HTMLVideoElement,
  targetTimeSec: number,
  signal?: AbortSignal
): Promise<void> {
  if (signal?.aborted) {
    throw new DOMException('Aborted before seek', 'AbortError');
  }

  const clamped = Math.max(0, Math.min(video.duration || targetTimeSec, targetTimeSec));
  if (Math.abs(video.currentTime - clamped) < 0.008) {
    return;
  }

  return new Promise<void>((resolve, reject) => {
    let timeoutId: any = null;

    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      if (timeoutId) clearTimeout(timeoutId);
    };

    const onSeeked = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      resolve(); // Fallback cleanly rather than hanging
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException('Aborted during seek', 'AbortError'));
    };

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }

    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });

    // 800ms safety timeout in case browser drops seeked event
    timeoutId = setTimeout(() => {
      cleanup();
      resolve();
    }, 800);

    video.currentTime = clamped;
  });
}

/**
 * Waits for auxiliary video metadata (duration & dimensions)
 */
async function waitForMetadata(video: HTMLVideoElement, signal?: AbortSignal): Promise<number> {
  if (video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0) {
    return video.duration;
  }

  return new Promise<number>((resolve, reject) => {
    let timeoutId: any = null;

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
      if (timeoutId) clearTimeout(timeoutId);
    };

    const onLoaded = () => {
      cleanup();
      resolve(video.duration || 1.0);
    };

    const onError = () => {
      cleanup();
      resolve(video.duration || 1.0);
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException('Aborted waiting metadata', 'AbortError'));
    };

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }

    video.addEventListener('loadedmetadata', onLoaded, { once: true });
    video.addEventListener('error', onError, { once: true });

    timeoutId = setTimeout(() => {
      cleanup();
      resolve(video.duration || 1.0);
    }, 4000);
  });
}

function yieldToMainThread(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Core Offline Frame-by-Frame Kinematic Analysis Engine
 */
export class KinematicAnalysisEngine {
  private readonly config: Required<KinematicEngineConfig>;
  private inferenceCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private inferenceCtx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;
  private cachedRawSamples: RawClipPoseSample[] = [];
  private cachedWindow: TrimmedAnalysisWindow | null = null;
  private cachedDurationSec = 0;

  constructor(config: KinematicEngineConfig = {}) {
    this.config = {
      startOffsetSec: config.startOffsetSec ?? START_OFFSET_SEC,
      maxAnalysisDurationSec: config.maxAnalysisDurationSec ?? MAX_ANALYSIS_DURATION_SEC,
      targetSampleFps: config.targetSampleFps ?? TARGET_SAMPLE_FPS,
      maxInferenceWidth: config.maxInferenceWidth ?? DEFAULT_INFERENCE_MAX_WIDTH,
      maxInferenceHeight: config.maxInferenceHeight ?? DEFAULT_INFERENCE_MAX_HEIGHT,
      minVisibility: config.minVisibility ?? MIN_LANDMARK_VISIBILITY,
      minConfidence: config.minConfidence ?? MIN_CONFIDENCE_THRESHOLD,
      poseQuality: config.poseQuality ?? 'full'
    };
  }

  private ensureInferenceSurface(width: number, height: number): {
    canvas: OffscreenCanvas | HTMLCanvasElement;
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  } {
    if (!this.inferenceCanvas || !this.inferenceCtx) {
      if (typeof OffscreenCanvas !== 'undefined') {
        const oc = new OffscreenCanvas(width, height);
        const ctx = oc.getContext('2d', { willReadFrequently: false });
        if (ctx) {
          this.inferenceCanvas = oc;
          this.inferenceCtx = ctx;
        }
      }
      if (!this.inferenceCanvas && typeof document !== 'undefined') {
        const hc = document.createElement('canvas');
        hc.width = width;
        hc.height = height;
        const ctx = hc.getContext('2d', { willReadFrequently: false });
        if (ctx) {
          this.inferenceCanvas = hc;
          this.inferenceCtx = ctx;
        }
      }
    }
    if (this.inferenceCanvas && (this.inferenceCanvas.width !== width || this.inferenceCanvas.height !== height)) {
      this.inferenceCanvas.width = width;
      this.inferenceCanvas.height = height;
    }
    return { canvas: this.inferenceCanvas!, ctx: this.inferenceCtx! };
  }

  public clearCache(): void {
    this.cachedRawSamples = [];
    this.cachedWindow = null;
    this.cachedDurationSec = 0;
  }

  public getCachedRawSamples(): RawClipPoseSample[] {
    return this.cachedRawSamples;
  }

  /**
   * Main entry point: extracts frame-by-frame landmarks offline at 15 FPS up to 30 seconds
   */
  public async processClipDetailed(
    videoSource: HTMLVideoElement | File,
    options: KinematicClipOptions = {}
  ): Promise<ClipKinematicsResult> {
    const t0 = performance.now();
    const pattern = options.pattern ?? EXERCISE_PATTERNS[0];
    const loadType = options.loadType ?? pattern.loadType;
    const targetMuscle = options.targetMuscle ?? pattern.targetMuscle;
    const poseQuality = options.poseQuality ?? this.config.poseQuality;

    const landmarker = await getPoseLandmarker(poseQuality);
    if (!landmarker) {
      throw new Error('No se pudo inicializar el detector MediaPipe Pose.');
    }

    let createdObjectUrl: string | null = null;
    const workerVideo = typeof document !== 'undefined' ? document.createElement('video') : null;
    if (!workerVideo) {
      throw new Error('HTMLVideoElement requerido para decodificar vídeo en navegador.');
    }

    workerVideo.muted = true;
    workerVideo.playsInline = true;
    workerVideo.preload = 'auto';
    workerVideo.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0.001;pointer-events:none;';
    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(workerVideo);
    }

    if (typeof File !== 'undefined' && videoSource instanceof File) {
      createdObjectUrl = URL.createObjectURL(videoSource);
      workerVideo.src = createdObjectUrl;
    } else {
      const el = videoSource as HTMLVideoElement;
      workerVideo.src = el.currentSrc || el.src;
    }

    try {
      const durationSec = await waitForMetadata(workerVideo, options.signal);
      const windowSpec = computeTrimmedAnalysisWindow(durationSec, this.config);

      if (windowSpec.totalFrames === 0) {
        return {
          version: '2.0',
          fps: this.config.targetSampleFps,
          startTimeSec: 0,
          endTimeSec: 0,
          durationSec: 0,
          dominantSide: 'right',
          elapsedMs: Math.round(performance.now() - t0),
          frames: [],
          auditedReps: [],
          majorityFramingWarning: null
        };
      }

      const vw = workerVideo.videoWidth || 640;
      const vh = workerVideo.videoHeight || 360;

      // Fit inside 640x480 max bounds while preserving aspect ratio
      const maxW = this.config.maxInferenceWidth;
      const maxH = this.config.maxInferenceHeight;
      const scale = Math.min(1.0, maxW / vw, maxH / vh);
      const dims = {
        width: Math.max(160, Math.round(vw * scale)),
        height: Math.max(120, Math.round(vh * scale))
      };

      const { canvas: surface, ctx } = this.ensureInferenceSurface(dims.width, dims.height);
      const rawSamples: RawClipPoseSample[] = [];

      for (let i = 0; i < windowSpec.totalFrames; i++) {
        if (options.signal?.aborted) {
          throw new DOMException('Kinematic analysis aborted', 'AbortError');
        }

        const targetSec = Math.min(Math.max(0, durationSec - 0.005), windowSpec.startTime + i * windowSpec.step);
        await seekMonotonic(workerVideo, targetSec, options.signal);

        // Blit full video frame directly onto inference canvas
        ctx.drawImage(workerVideo, 0, 0, vw, vh, 0, 0, dims.width, dims.height);

        const monotonicTs = getMonotonicPoseTimestamp();
        const detection = landmarker.detectForVideo(surface as unknown as HTMLVideoElement, monotonicTs);
        const lm = detection?.landmarks?.[0];

        if (lm && lm.length >= 33) {
          rawSamples.push({
            frameIndex: rawSamples.length,
            timestampSec: targetSec,
            rawLandmarks: lm.map(p => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility }))
          });
        }

        if (options.onProgress && (i === windowSpec.totalFrames - 1 || i % 4 === 0)) {
          options.onProgress({
            currentFrame: i + 1,
            totalFrames: windowSpec.totalFrames,
            percent: Math.round(((i + 1) / windowSpec.totalFrames) * 100),
            elapsedMs: Math.round(performance.now() - t0)
          });
        }

        // Yield every 4 frames so the browser remains fully interactive
        if (i % 4 === 3) {
          await yieldToMainThread();
        }
      }

      this.cachedRawSamples = rawSamples;
      this.cachedWindow = windowSpec;
      this.cachedDurationSec = durationSec;

      return this.recomputeFromSamples(rawSamples, pattern, loadType, targetMuscle, {
        fps: this.config.targetSampleFps,
        startTimeSec: windowSpec.startTime,
        endTimeSec: windowSpec.endTime,
        durationSec,
        elapsedMs: Math.round(performance.now() - t0)
      });
    } finally {
      if (workerVideo && workerVideo.parentNode) {
        workerVideo.parentNode.removeChild(workerVideo);
      }
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    }
  }

  public recomputeFromCache(
    pattern: ExercisePatternSpec,
    loadType: LoadType = pattern.loadType,
    targetMuscle: TargetMuscle = pattern.targetMuscle
  ): ClipKinematicsResult | null {
    if (!this.cachedRawSamples || this.cachedRawSamples.length === 0) return null;
    return this.recomputeFromSamples(
      this.cachedRawSamples,
      pattern,
      loadType,
      targetMuscle,
      {
        fps: this.config.targetSampleFps,
        startTimeSec: this.cachedWindow?.startTime ?? 0,
        endTimeSec: this.cachedWindow?.endTime ?? this.cachedDurationSec,
        durationSec: this.cachedDurationSec,
        elapsedMs: 2
      }
    );
  }

  private recomputeFromSamples(
    rawSamples: RawClipPoseSample[],
    pattern: ExercisePatternSpec,
    loadType: LoadType,
    targetMuscle: TargetMuscle,
    params: { fps: number; startTimeSec?: number; endTimeSec?: number; durationSec?: number; elapsedMs?: number }
  ): ClipKinematicsResult {
    const fps = params.fps;
    const n = rawSamples.length;

    if (n === 0) {
      return {
        version: '2.0',
        fps,
        startTimeSec: 0,
        endTimeSec: 0,
        durationSec: 0,
        dominantSide: 'right',
        elapsedMs: params.elapsedMs ?? 0,
        frames: [],
        auditedReps: [],
        majorityFramingWarning: null
      };
    }

    // Determine global dominant working side across the clip
    let rightVisScore = 0;
    let leftVisScore = 0;
    for (let i = 0; i < n; i++) {
      const lm = rawSamples[i].rawLandmarks;
      rightVisScore += (lm[12]?.visibility ?? 0) + (lm[14]?.visibility ?? 0) + (lm[24]?.visibility ?? 0) + (lm[26]?.visibility ?? 0);
      leftVisScore += (lm[11]?.visibility ?? 0) + (lm[13]?.visibility ?? 0) + (lm[23]?.visibility ?? 0) + (lm[25]?.visibility ?? 0);
    }
    const globalDominantSide: 'left' | 'right' = rightVisScore >= leftVisScore ? 'right' : 'left';

    const poseSmoother = new PoseLandmarkSmoother({
      minCutoff: 1.0,
      beta: 5.5,
      dCutoff: 1.0,
      deadzone: 0.003
    });

    const fsm = new BiomechanicalFSM({
      trackingMode: pattern.trackingMode,
      lockoutThreshold: pattern.standingThreshold,
      inflectionThreshold: pattern.inflectionThreshold
    });

    const resistanceParam: ResistanceSourceType =
      loadType === 'gravity' ? 'gravity' :
      loadType === 'cable' ? 'cable_mid' :
      'machine';

    const targetBias: 'quads' | 'glutes' | 'hamstrings' | 'lats' | 'biceps' | 'triceps' | 'upper_back' =
      targetMuscle === 'glutes_max' ? 'glutes' :
      targetMuscle === 'quadriceps' ? 'quads' :
      targetMuscle === 'hamstrings' ? 'hamstrings' :
      targetMuscle === 'lats' ? 'lats' :
      targetMuscle === 'upper_back' ? 'upper_back' :
      targetMuscle === 'biceps' ? 'biceps' :
      targetMuscle === 'triceps' ? 'triceps' :
      'quads';

    const frames: FrameKinematics[] = [];
    const auditedReps: RepetitionBiomechanicalAudit[] = [];
    const footTracker: FootStabilityState = {};
    let smoothedTibial = 14;

    for (let i = 0; i < n; i++) {
      const tsSec = rawSamples[i].timestampSec;
      const tsMs = Math.round(tsSec * 1000);

      const extracted = extractPoseDataFromLandmarks(rawSamples[i].rawLandmarks, globalDominantSide);
      if (!extracted) continue;

      const smoothed = poseSmoother.smoothLandmarks(extracted.keypoints, tsMs);
      const merged: Record<string, Keypoint2D> = { ...extracted.keypoints, ...smoothed };

      // Compute primary joint angle
      let primaryAngle = 90;
      if (pattern.primaryJoint === 'hip') {
        primaryAngle = calculateJointAngle(merged['shoulder'], merged['hip'], merged['knee']);
      } else if (pattern.primaryJoint === 'knee') {
        primaryAngle = calculateJointAngle(merged['hip'], merged['knee'], merged['ankle']);
      } else if (pattern.primaryJoint === 'elbow') {
        primaryAngle = calculateJointAngle(merged['shoulder'], merged['elbow'], merged['wrist']);
      } else if (pattern.primaryJoint === 'shoulder') {
        primaryAngle = calculateJointAngle(merged['hip'], merged['shoulder'], merged['elbow']);
      }

      const completedRep = fsm.update(primaryAngle, tsMs);
      const phase = fsm.getPhase();
      const angVelocity = fsm.getSmoothedVelocity();

      if (completedRep) {
        auditedReps.push(
          auditCompletedRepetition(completedRep, fsm.getCompletedReps(), pattern.name, targetBias)
        );
      }

      const rawTibial = merged['ankle'] && merged['knee'] ? calculateTibialAngle(merged['ankle'], merged['knee']) : 14;
      smoothedTibial = Math.round((0.84 * smoothedTibial + 0.16 * rawTibial) * 10) / 10;

      const telemetry = evaluateBiomechanicalFrame(
        merged,
        pattern.id,
        phase,
        primaryAngle,
        angVelocity,
        resistanceParam,
        targetBias,
        tsMs,
        smoothedTibial,
        footTracker
      );

      const elbowAngleDeg = Math.round(calculateJointAngle(merged['shoulder'], merged['elbow'], merged['wrist']));
      const kneeAngleDeg = Math.round(calculateJointAngle(merged['hip'], merged['knee'], merged['ankle']));
      const hipAngleDeg = Math.round(calculateJointAngle(merged['shoulder'], merged['hip'], merged['knee']));

      frames.push({
        frameIndex: rawSamples[i].frameIndex,
        timestampSec: tsSec,
        primaryAngleDeg: Math.round(primaryAngle),
        elbowAngleDeg,
        kneeAngleDeg,
        hipAngleDeg,
        spinalAngleDeg: Math.round(telemetry.technique.spinalAngleDegrees * 10) / 10,
        tibialAngleDeg: telemetry.biomechanics.tibialAngleDegrees,
        phase,
        completedRepsCount: auditedReps.length,
        dominantSide: globalDominantSide,
        keypoints: merged,
        momentArms: {
          hip: telemetry.biomechanics.momentArms.hip,
          knee: telemetry.biomechanics.momentArms.knee,
          shoulder: telemetry.biomechanics.momentArms.shoulder ?? 0,
          elbow: telemetry.biomechanics.momentArms.elbow ?? 0,
          hipOverKneeRatio: telemetry.biomechanics.momentArms.hipOverKneeRatio
        },
        muscleBias: telemetry.biomechanics.muscleBias,
        muscleBiasLabel: telemetry.biomechanics.muscleBiasLabel,
        telemetry,
        framingWarning: null
      });
    }

    return {
      version: '2.0',
      fps,
      startTimeSec: params.startTimeSec ?? rawSamples[0].timestampSec,
      endTimeSec: params.endTimeSec ?? rawSamples[n - 1].timestampSec,
      durationSec: params.durationSec ?? rawSamples[n - 1].timestampSec,
      dominantSide: globalDominantSide,
      elapsedMs: params.elapsedMs ?? 0,
      frames,
      auditedReps,
      majorityFramingWarning: null
    };
  }
}

/**
 * Fast O(log N) binary lookup with linear keypoint interpolation between adjacent 15 FPS keyframes
 */
export function lookupFrameKinematicsAtTime(
  frames: FrameKinematics[],
  timeSec: number
): FrameKinematics | null {
  if (!frames || frames.length === 0) return null;
  if (timeSec <= frames[0].timestampSec) return frames[0];
  const lastIdx = frames.length - 1;
  if (timeSec >= frames[lastIdx].timestampSec) return frames[lastIdx];

  let lo = 0;
  let hi = lastIdx;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (frames[mid].timestampSec <= timeSec) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  const idxA = Math.max(0, hi);
  const idxB = Math.min(lastIdx, idxA + 1);
  const fA = frames[idxA];
  const fB = frames[idxB];
  const span = fB.timestampSec - fA.timestampSec;

  if (idxA === idxB || span <= 1e-4) return fA;

  const alpha = Math.max(0, Math.min(1, (timeSec - fA.timestampSec) / span));
  const base = alpha < 0.5 ? fA : fB;

  if (!fA.keypoints || !fB.keypoints) {
    return { ...base, timestampSec: timeSec };
  }

  const interpKp: Record<string, SerializablePoint2D> = {};

  for (const [key, ptA] of Object.entries(fA.keypoints)) {
    const ptB = fB.keypoints[key];
    if (!ptA) continue;
    interpKp[key] = ptB
      ? {
          x: ptA.x + (ptB.x - ptA.x) * alpha,
          y: ptA.y + (ptB.y - ptA.y) * alpha,
          z: ptA.z !== undefined && ptB.z !== undefined ? ptA.z + (ptB.z - ptA.z) * alpha : ptA.z,
          visibility: ptA.visibility
        }
      : ptA;
  }

  return {
    ...base,
    timestampSec: timeSec,
    primaryAngleDeg: Math.round((fA.primaryAngleDeg ?? 0) + ((fB.primaryAngleDeg ?? 0) - (fA.primaryAngleDeg ?? 0)) * alpha),
    elbowAngleDeg: Math.round((fA.elbowAngleDeg ?? 0) + ((fB.elbowAngleDeg ?? 0) - (fA.elbowAngleDeg ?? 0)) * alpha),
    kneeAngleDeg: Math.round((fA.kneeAngleDeg ?? 0) + ((fB.kneeAngleDeg ?? 0) - (fA.kneeAngleDeg ?? 0)) * alpha),
    hipAngleDeg: Math.round((fA.hipAngleDeg ?? 0) + ((fB.hipAngleDeg ?? 0) - (fA.hipAngleDeg ?? 0)) * alpha),
    keypoints: interpKp
  };
}
