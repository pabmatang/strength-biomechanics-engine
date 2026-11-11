import { PoseLandmarkSmoother } from './oneEuroFilter';
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

// 1. Temporal Trim & Sampling Constants
export const START_OFFSET_SEC = 1.5;
export const MAX_ANALYSIS_DURATION_SEC = 24.0;
export const TARGET_SAMPLE_FPS = 15;
export const MIN_LANDMARK_VISIBILITY = 0.65;
export const MIN_CONFIDENCE_THRESHOLD = 0.6;
export const DEFAULT_INFERENCE_MAX_WIDTH = 640;
export const DEFAULT_INFERENCE_MAX_HEIGHT = 480;

export interface TrimmedAnalysisWindow {
  startTime: number;
  endTime: number;
  step: number;
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
  /** True when recovered by forearm projection or temporal interpolation */
  occludedRecovered?: boolean;
  /** True when analytically projected via forearm geometry (do not overwrite with linear interp) */
  projectedByKinematics?: boolean;
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
  avgForearmLeftSamples: number;
  avgForearmRight: number | null;
  avgForearmRightSamples: number;
  avgUpperArmLeft: number | null;
  avgUpperArmRight: number | null;
  lastForearmDirLeft: { ux: number; uy: number } | null;
  lastForearmDirRight: { ux: number; uy: number } | null;
  lastUpperArmDirLeft: { ux: number; uy: number } | null;
  lastUpperArmDirRight: { ux: number; uy: number } | null;
  lastValidKeypoints: Record<string, SerializablePoint2D>;
}

export function createOcclusionTrackerState(): OcclusionTrackerState {
  return {
    avgForearmLeft: null,
    avgForearmLeftSamples: 0,
    avgForearmRight: null,
    avgForearmRightSamples: 0,
    avgUpperArmLeft: null,
    avgUpperArmRight: null,
    lastForearmDirLeft: null,
    lastForearmDirRight: null,
    lastUpperArmDirLeft: null,
    lastUpperArmDirRight: null,
    lastValidKeypoints: {}
  };
}

/**
 * Computes the trimmed time window [startTime .. endTime] and step size at 15 FPS:
 * covers up to 24s full-clip (preserving 0.0s start on <= 25.5s videos so users never miss opening reps,
 * and skipping 1.5s dead setup on longer videos).
 */
export function computeTrimmedAnalysisWindow(
  durationSec: number,
  config: Pick<KinematicEngineConfig, 'startOffsetSec' | 'maxAnalysisDurationSec' | 'targetSampleFps'> = {}
): TrimmedAnalysisWindow {
  const maxDur = config.maxAnalysisDurationSec ?? MAX_ANALYSIS_DURATION_SEC;
  const offset = config.startOffsetSec ?? START_OFFSET_SEC;
  const fps = Math.max(1, config.targetSampleFps ?? TARGET_SAMPLE_FPS);
  const step = 1 / fps;

  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    return { startTime: 0, endTime: 0, step, totalFrames: 0 };
  }

  const startTime =
    config.startOffsetSec === undefined && durationSec <= maxDur + 1.5
      ? 0
      : Math.min(offset, durationSec * 0.1);
  const endTime = Math.min(startTime + maxDur, durationSec);
  const effectiveDuration = Math.max(0, endTime - startTime);
  const totalFrames = Math.max(1, Math.floor(effectiveDuration * fps) + 1);

  return { startTime, endTime, step, totalFrames };
}

/**
 * Computes downscaled canvas dimensions preserving video aspect ratio (capped at <= 640x480).
 */
export function computeInferenceDimensions(
  videoWidth: number,
  videoHeight: number,
  maxWidth: number = DEFAULT_INFERENCE_MAX_WIDTH,
  maxHeight: number = DEFAULT_INFERENCE_MAX_HEIGHT
): { width: number; height: number } {
  if (videoWidth <= 0 || videoHeight <= 0) {
    return { width: maxWidth, height: maxHeight };
  }
  const scale = Math.min(1, maxWidth / videoWidth, maxHeight / videoHeight);
  return {
    width: Math.max(2, Math.round(videoWidth * scale)),
    height: Math.max(2, Math.round(videoHeight * scale))
  };
}

function isConfident(pt?: Keypoint2D | SerializablePoint2D, threshold: number = MIN_LANDMARK_VISIBILITY): boolean {
  if (!pt) return false;
  if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return false;
  if (pt.x < 0 || pt.x > 1 || pt.y < 0 || pt.y > 1) {
    return (pt.visibility ?? 0) >= threshold && pt.x > -0.1 && pt.x < 1.1 && pt.y > -0.1 && pt.y < 1.1;
  }
  const vis = pt.visibility ?? 1.0;
  return vis >= threshold;
}

function projectWristFromForearmOrHumerus(
  shoulder: SerializablePoint2D,
  elbow: SerializablePoint2D,
  forearmLength: number,
  preferredForearmDir: { ux: number; uy: number } | null
): SerializablePoint2D {
  let ux: number;
  let uy: number;
  if (preferredForearmDir) {
    ux = preferredForearmDir.ux;
    uy = preferredForearmDir.uy;
  } else {
    const dx = elbow.x - shoulder.x;
    const dy = elbow.y - shoulder.y;
    const norm = Math.hypot(dx, dy);
    if (norm < 1e-4) {
      return { x: elbow.x, y: Math.min(0.99, elbow.y + forearmLength), visibility: 0.72, occludedRecovered: true, projectedByKinematics: true };
    }
    ux = dx / norm;
    uy = dy / norm;
  }
  return {
    x: Math.max(0.01, Math.min(0.99, elbow.x + forearmLength * ux)),
    y: Math.max(0.01, Math.min(0.99, elbow.y + forearmLength * uy)),
    z: elbow.z,
    visibility: 0.72,
    occludedRecovered: true,
    projectedByKinematics: true
  };
}

/**
 * Computes a padded bounding ROI around detected athlete landmarks so wide-angle gym videos
 * allocate maximum pixel resolution onto the working joints (elbow, wrist, hand grip)
 * and crop out background passersby.
 */
export function computeAthleteBoundingRoi(
  landmarks: Array<{ x: number; y: number; visibility?: number }>
): NormalizedVideoRoi | null {
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  let validCount = 0;

  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (!lm || (lm.visibility ?? 0) < 0.35) continue;
    if (lm.x < 0 || lm.x > 1 || lm.y < 0 || lm.y > 1) continue;
    if (lm.x < minX) minX = lm.x;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.y > maxY) maxY = lm.y;
    validCount += 1;
  }

  if (validCount < 8) return null;
  const spanW = maxX - minX;
  const spanH = maxY - minY;
  if (spanW < 0.08 || spanH < 0.12) return null;

  // Generous anatomical margin so concentric bar path & arms never leave the crop
  const padX = Math.max(0.14, spanW * 0.45);
  const padY = Math.max(0.14, spanH * 0.35);
  const x0 = Math.max(0, minX - padX);
  const y0 = Math.max(0, minY - padY);
  const x1 = Math.min(1, maxX + padX);
  const y1 = Math.min(1, maxY + padY);
  const w = Math.max(0.25, x1 - x0);
  const h = Math.max(0.28, y1 - y0);

  if (w > 0.82 && h > 0.85) return null;
  return { x: x0, y: y0, w, h };
}

/**
 * Single-frame Hampel / velocity spike rejection for offline sequences:
 * eliminates isolated MediaPipe jumps (e.g. elbow/wrist snapping to dark shirt/machine for 1 frame)
 * before zero-phase smoothing while preserving legitimate fast joint paths.
 */
export function applyTemporalSpikeRejection(
  sequence: Array<Record<string, SerializablePoint2D>>
): Array<Record<string, SerializablePoint2D>> {
  const n = sequence.length;
  if (n < 3) return sequence;

  const trackedKeys = [
    'left_shoulder', 'right_shoulder',
    'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist',
    'left_hand_grip', 'right_hand_grip',
    'left_hip', 'right_hip',
    'left_knee', 'right_knee',
    'left_ankle', 'right_ankle'
  ];

  // Snapshot original points so rejections use clean unmutated neighbors
  const out = sequence.map(frame => ({ ...frame }));

  for (const key of trackedKeys) {
    for (let i = 1; i < n - 1; i++) {
      const prev = sequence[i - 1][key];
      const curr = sequence[i][key];
      const next = sequence[i + 1][key];
      if (!prev || !curr || !next) continue;

      const neighborDist = Math.hypot(next.x - prev.x, next.y - prev.y);
      const midX = (prev.x + next.x) * 0.5;
      const midY = (prev.y + next.y) * 0.5;
      const dev = Math.hypot(curr.x - midX, curr.y - midY);

      if (neighborDist < 0.065 && dev > Math.max(0.022, neighborDist * 1.35)) {
        out[i][key] = {
          ...curr,
          x: midX,
          y: midY
        };
      }
    }
  }

  // Clamp hand_grip within physical fist radius (<= 0.095 norm) of its paired wrist
  for (let i = 0; i < n; i++) {
    for (const side of ['left', 'right'] as const) {
      const wr = out[i][`${side}_wrist`];
      const grip = out[i][`${side}_hand_grip`];
      if (!wr || !grip) continue;
      const dx = grip.x - wr.x;
      const dy = grip.y - wr.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.095) {
        const s = 0.095 / dist;
        out[i][`${side}_hand_grip`] = {
          ...grip,
          x: wr.x + dx * s,
          y: wr.y + dy * s
        };
      }
    }
  }

  return out;
}

/**
 * Occlusion handling & confidence fallback:
 * 1) Never uses raw extrapolated coordinates when visibility < 0.65 (or confidence < 0.6).
 * 2) When wrist/hand is occluded (e.g. dips/machines/plates) and shoulder + elbow are confident,
 *    projects P_hand = P_elbow + L_forearm * unit(P_elbow - P_shoulder) using running forearm length.
 * 3) Falls back to last valid landmark coordinate when no direct geometric projection is available.
 */
export function applyOcclusionAndConfidenceFallback(
  rawKeypoints: Record<string, Keypoint2D>,
  state: OcclusionTrackerState,
  minVisibility: number = MIN_LANDMARK_VISIBILITY
): Record<string, SerializablePoint2D> {
  const cleanThreshold = Math.max(MIN_CONFIDENCE_THRESHOLD, minVisibility);
  const out: Record<string, SerializablePoint2D> = {};

  // Update running forearm lengths for left & right whenever both elbow and wrist are confident
  const updateSideForearm = (side: 'left' | 'right') => {
    const sh = rawKeypoints[`${side}_shoulder`];
    const el = rawKeypoints[`${side}_elbow`];
    const wr = rawKeypoints[`${side}_wrist`];

    if (isConfident(el, cleanThreshold) && isConfident(wr, cleanThreshold)) {
      const dx = wr.x - el.x;
      const dy = wr.y - el.y;
      const len = Math.hypot(dx, dy);
      if (len >= 0.03 && len <= 0.45) {
        const dir = { ux: dx / len, uy: dy / len };
        if (side === 'left') {
          state.avgForearmLeftSamples += 1;
          state.avgForearmLeft = state.avgForearmLeft === null
            ? len
            : state.avgForearmLeft + (len - state.avgForearmLeft) / state.avgForearmLeftSamples;
          state.lastForearmDirLeft = dir;
        } else {
          state.avgForearmRightSamples += 1;
          state.avgForearmRight = state.avgForearmRight === null
            ? len
            : state.avgForearmRight + (len - state.avgForearmRight) / state.avgForearmRightSamples;
          state.lastForearmDirRight = dir;
        }
      }
    }

    if (isConfident(sh, cleanThreshold) && isConfident(el, cleanThreshold)) {
      const udx = el.x - sh.x;
      const udy = el.y - sh.y;
      const uLen = Math.hypot(udx, udy);
      if (uLen >= 0.03 && uLen <= 0.45) {
        const uDir = { ux: udx / uLen, uy: udy / uLen };
        if (side === 'left') {
          state.avgUpperArmLeft = state.avgUpperArmLeft === null ? uLen : state.avgUpperArmLeft * 0.8 + uLen * 0.2;
          state.lastUpperArmDirLeft = uDir;
        } else {
          state.avgUpperArmRight = state.avgUpperArmRight === null ? uLen : state.avgUpperArmRight * 0.8 + uLen * 0.2;
          state.lastUpperArmDirRight = uDir;
        }
      }
    }

    // Track last valid keypoints for reliable non-occluded landmarks
    for (const part of ['shoulder', 'elbow', 'wrist', 'hand_grip', 'hip', 'knee', 'ankle', 'ear']) {
      const k = `${side}_${part}`;
      const pt = rawKeypoints[k];
      if (isConfident(pt, cleanThreshold)) {
        state.lastValidKeypoints[k] = {
          x: pt.x,
          y: pt.y,
          z: pt.z,
          visibility: pt.visibility
        };
      }
    }
    const nosePt = rawKeypoints['nose'];
    if (nosePt && isConfident(nosePt, cleanThreshold)) {
      state.lastValidKeypoints['nose'] = { x: nosePt.x, y: nosePt.y, z: nosePt.z, visibility: nosePt.visibility };
    }

    // Also update resolved shoulder distance as fallback prior when forearm average hasn't been seen yet
    const armPrior = sh && el && isConfident(sh, cleanThreshold) && isConfident(el, cleanThreshold)
      ? Math.hypot(el.x - sh.x, el.y - sh.y) * 0.85
      : 0.14;

    return side === 'left'
      ? (state.avgForearmLeft ?? armPrior)
      : (state.avgForearmRight ?? armPrior);
  };

  const leftForearmLen = updateSideForearm('left');
  const rightForearmLen = updateSideForearm('right');

  // Filter all keypoints cleanly
  for (const [key, pt] of Object.entries(rawKeypoints)) {
    if (!pt) continue;
    if (isConfident(pt, cleanThreshold)) {
      const valid: SerializablePoint2D = {
        x: pt.x,
        y: pt.y,
        z: pt.z,
        visibility: pt.visibility
      };
      out[key] = valid;
      state.lastValidKeypoints[key] = valid;
    } else if (state.lastValidKeypoints[key]) {
      out[key] = {
        ...state.lastValidKeypoints[key],
        visibility: pt.visibility,
        occludedRecovered: true
      };
    } else {
      out[key] = {
        x: pt.x,
        y: pt.y,
        z: pt.z,
        visibility: pt.visibility,
        occludedRecovered: true
      };
    }
  }

  // Apply analytical inverse projection for occluded elbows & hands/wrists per side
  for (const side of ['left', 'right'] as const) {
    const shKey = `${side}_shoulder`;
    const elKey = `${side}_elbow`;
    const wrKey = `${side}_wrist`;
    const gripKey = `${side}_hand_grip`;
    const forearmLen = side === 'left' ? leftForearmLen : rightForearmLen;
    const upperArmLen = (side === 'left' ? state.avgUpperArmLeft : state.avgUpperArmRight) ?? 0.16;
    const prefForearmDir = side === 'left' ? state.lastForearmDirLeft : state.lastForearmDirRight;
    const prefUpperDir = side === 'left' ? state.lastUpperArmDirLeft : state.lastUpperArmDirRight;

    const rawElbow = rawKeypoints[elKey];
    const elbowOccluded = !isConfident(rawElbow, cleanThreshold);
    const sh = out[shKey];

    // If elbow is temporarily occluded in dark sleeve/machine while shoulder & upper-arm vector are known,
    // stabilize elbow position kinematically along the learned humerus vector
    if (elbowOccluded && isConfident(sh, cleanThreshold) && prefUpperDir) {
      const projectedElbow: SerializablePoint2D = {
        x: Math.max(0.01, Math.min(0.99, sh.x + upperArmLen * prefUpperDir.ux)),
        y: Math.max(0.01, Math.min(0.99, sh.y + upperArmLen * prefUpperDir.uy)),
        z: sh.z,
        visibility: 0.70,
        occludedRecovered: true,
        projectedByKinematics: true
      };
      out[elKey] = projectedElbow;
      state.lastValidKeypoints[elKey] = projectedElbow;
    }

    const rawWrist = rawKeypoints[wrKey];
    const wristOccluded = !isConfident(rawWrist, cleanThreshold);
    const el = out[elKey];

    if (wristOccluded && sh && el && isConfident(el, Math.min(0.55, cleanThreshold))) {
      const projected = projectWristFromForearmOrHumerus(sh, el, forearmLen, prefForearmDir);
      out[wrKey] = projected;
      const gDir = prefForearmDir ?? {
        ux: Math.hypot(projected.x - el.x, projected.y - el.y) > 1e-4 ? (projected.x - el.x) / Math.max(1e-4, forearmLen) : 0,
        uy: Math.hypot(projected.x - el.x, projected.y - el.y) > 1e-4 ? (projected.y - el.y) / Math.max(1e-4, forearmLen) : 1
      };
      const projectedGrip: SerializablePoint2D = {
        ...projected,
        x: Math.max(0.01, Math.min(0.99, projected.x + forearmLen * 0.12 * gDir.ux)),
        y: Math.max(0.01, Math.min(0.99, projected.y + forearmLen * 0.12 * gDir.uy))
      };
      out[gripKey] = projectedGrip;
      state.lastValidKeypoints[wrKey] = projected;
      state.lastValidKeypoints[gripKey] = projectedGrip;
    } else if (!wristOccluded && !isConfident(rawKeypoints[gripKey], Math.min(0.45, cleanThreshold))) {
      out[gripKey] = out[wrKey];
    }
  }

  return out;
}

/**
 * Post-pass temporal linear interpolation across any occluded frame spans between
 * two valid confident frames (visibility >= 0.65), avoiding jumps to (0,0) or center.
 */
export function interpolateOccludedSpans(
  sequence: Array<Record<string, SerializablePoint2D>>,
  minVisibility: number = MIN_LANDMARK_VISIBILITY
): Array<Record<string, SerializablePoint2D>> {
  const n = sequence.length;
  if (n <= 1) return sequence;

  const cleanThreshold = Math.max(MIN_CONFIDENCE_THRESHOLD, minVisibility);
  const allKeys = new Set<string>();
  for (const frame of sequence) {
    for (const k of Object.keys(frame)) allKeys.add(k);
  }

  for (const key of allKeys) {
    // Find confident anchor indices (or analytical kinematic projections)
    const anchors: number[] = [];
    for (let i = 0; i < n; i++) {
      const pt = sequence[i][key];
      if (pt && (pt.projectedByKinematics === true || (!pt.occludedRecovered && (pt.visibility ?? 0) >= cleanThreshold))) {
        anchors.push(i);
      }
    }

    if (anchors.length === 0) continue;

    // Backfill leading occluded frames before first valid anchor
    const firstAnchor = anchors[0];
    for (let i = 0; i < firstAnchor; i++) {
      if (sequence[i][key]) {
        sequence[i][key] = { ...sequence[firstAnchor][key], occludedRecovered: true };
      }
    }

    // Linearly interpolate internal gaps between consecutive anchors
    for (let a = 0; a < anchors.length - 1; a++) {
      const idxA = anchors[a];
      const idxB = anchors[a + 1];
      if (idxB - idxA <= 1) continue;
      const ptA = sequence[idxA][key];
      const ptB = sequence[idxB][key];
      const span = idxB - idxA;
      for (let i = idxA + 1; i < idxB; i++) {
        const t = (i - idxA) / span;
        sequence[i][key] = {
          x: ptA.x + (ptB.x - ptA.x) * t,
          y: ptA.y + (ptB.y - ptA.y) * t,
          z: ptA.z !== undefined && ptB.z !== undefined ? ptA.z + (ptB.z - ptA.z) * t : ptA.z,
          visibility: Math.max(ptA.visibility ?? 0.65, ptB.visibility ?? 0.65),
          occludedRecovered: true
        };
      }
    }

    // Forward-fill trailing occluded frames after last valid anchor
    const lastAnchor = anchors[anchors.length - 1];
    for (let i = lastAnchor + 1; i < n; i++) {
      if (sequence[i][key]) {
        sequence[i][key] = { ...sequence[lastAnchor][key], occludedRecovered: true };
      }
    }
  }

  return sequence;
}

function yieldToMainThread(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

function waitForMetadata(video: HTMLVideoElement, signal?: AbortSignal): Promise<number> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Kinematic analysis aborted', 'AbortError'));
      return;
    }
    if (Number.isFinite(video.duration) && video.duration > 0 && video.readyState >= 1) {
      resolve(video.duration);
      return;
    }

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
      signal?.removeEventListener('abort', onAbort);
    };
    const onLoaded = () => {
      cleanup();
      resolve(video.duration || 0);
    };
    const onError = () => {
      cleanup();
      reject(new Error('No se pudo cargar el vídeo para el análisis cinemático.'));
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException('Kinematic analysis aborted', 'AbortError'));
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
    signal?.addEventListener('abort', onAbort);
  });
}

function seekMonotonic(video: HTMLVideoElement, targetSec: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Kinematic analysis aborted', 'AbortError'));
      return;
    }
    if (Math.abs(video.currentTime - targetSec) < 0.004) {
      resolve();
      return;
    }

    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve();
      }
    }, 240);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener('seeked', onSeeked);
      signal?.removeEventListener('abort', onAbort);
    };
    const onSeeked = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new DOMException('Kinematic analysis aborted', 'AbortError'));
    };

    video.addEventListener('seeked', onSeeked);
    signal?.addEventListener('abort', onAbort);
    video.currentTime = targetSec;
  });
}

function mapTargetBias(targetMuscle: TargetMuscle): 'quads' | 'glutes' | 'hamstrings' | 'lats' {
  if (targetMuscle === 'glutes_max') return 'glutes';
  if (targetMuscle === 'quadriceps') return 'quads';
  if (targetMuscle === 'hamstrings') return 'hamstrings';
  return 'lats';
}

function computePrimaryJointAngle(
  keypoints: Record<string, Keypoint2D>,
  primaryJoint: 'hip' | 'knee' | 'elbow' | 'shoulder'
): number {
  if (primaryJoint === 'elbow') {
    return calculateJointAngle(keypoints['shoulder'], keypoints['elbow'], keypoints['wrist']);
  }
  if (primaryJoint === 'hip') {
    return calculateJointAngle(keypoints['shoulder'], keypoints['hip'], keypoints['knee']);
  }
  if (primaryJoint === 'shoulder') {
    return calculateJointAngle(keypoints['elbow'], keypoints['shoulder'], keypoints['hip']);
  }
  return calculateJointAngle(keypoints['hip'], keypoints['knee'], keypoints['ankle']);
}

/**
 * Decoupled, portable Kinematic Analysis Engine.
 * Produces pure JSON-serializable FrameKinematics[] tracks from video streams or Files,
 * decoupled from React UI so it can be moved directly to Web Workers, Capacitor, or React Native.
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
      maxInferenceWidth: config.maxInferenceWidth ?? 480,
      maxInferenceHeight: config.maxInferenceHeight ?? 360,
      minVisibility: config.minVisibility ?? MIN_LANDMARK_VISIBILITY,
      minConfidence: config.minConfidence ?? MIN_CONFIDENCE_THRESHOLD,
      poseQuality: config.poseQuality ?? 'full'
    };
  }

  /**
   * Allocates and reuses a single downscaled offscreen buffer (<= 640x480) to avoid tensor/canvas churn.
   */
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

    if (!this.inferenceCanvas || !this.inferenceCtx) {
      throw new Error('2D inference surface unavailable in current runtime.');
    }

    if (this.inferenceCanvas.width !== width) this.inferenceCanvas.width = width;
    if (this.inferenceCanvas.height !== height) this.inferenceCanvas.height = height;

    return { canvas: this.inferenceCanvas, ctx: this.inferenceCtx };
  }

  public getCachedSampleCount(): number {
    return this.cachedRawSamples.length;
  }

  public clearCache(): void {
    this.cachedRawSamples = [];
    this.cachedWindow = null;
    this.cachedDurationSec = 0;
  }

  /**
   * Public contract: extracts pose telemetry within the smart trimmed window (2.5s offset, max 12s @ 15fps)
   * and returns pure JSON-serializable FrameKinematics[].
   */
  public async processClip(
    videoSource: HTMLVideoElement | File,
    options: KinematicClipOptions = {}
  ): Promise<FrameKinematics[]> {
    const detailed = await this.processClipDetailed(videoSource, options);
    return detailed.frames;
  }

  /**
   * Full extraction returning frames + audited reps + window bounds + timing stats.
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

    // Maintain a single persistent PoseLandmarker instance across all iterations
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
    // Attach off-screen in DOM so Chromium decodes via hardware rVFC at full throughput without background throttling
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
          durationSec,
          dominantSide: 'right',
          elapsedMs: Math.round(performance.now() - t0),
          frames: [],
          auditedReps: [],
          majorityFramingWarning: null
        };
      }

      const vidW = workerVideo.videoWidth || 640;
      const vidH = workerVideo.videoHeight || 480;

      // Optional zoomed ROI crop when viewport zoom > 1.05; otherwise locks automatically onto athlete bounds after frame 0
      let roi: NormalizedVideoRoi = { x: 0, y: 0, w: 1, h: 1 };
      let autoAthleteRoiLocked = (options.zoom ?? 1) > 1.05;
      if (autoAthleteRoiLocked && options.viewportSize && options.panOffset) {
        roi = computeZoomedVideoRoi(
          options.viewportSize.width,
          options.viewportSize.height,
          vidW,
          vidH,
          options.zoom ?? 1,
          options.panOffset
        );
      }

      let srcX = 0;
      let srcY = 0;
      let srcW = vidW;
      let srcH = vidH;
      let dims = { width: 480, height: 360 };
      let surface!: OffscreenCanvas | HTMLCanvasElement;
      let ctx!: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

      const applyInferenceRegion = (nextRoi: NormalizedVideoRoi, maxEdge: number) => {
        roi = nextRoi;
        srcX = Math.max(0, Math.min(vidW - 2, Math.round(roi.x * vidW)));
        srcY = Math.max(0, Math.min(vidH - 2, Math.round(roi.y * vidH)));
        srcW = Math.max(2, Math.min(vidW - srcX, Math.round(roi.w * vidW)));
        srcH = Math.max(2, Math.min(vidH - srcY, Math.round(roi.h * vidH)));
        dims = computeInferenceDimensions(srcW, srcH, maxEdge, maxEdge);
        const surf = this.ensureInferenceSurface(dims.width, dims.height);
        surface = surf.canvas;
        ctx = surf.ctx;
      };

      applyInferenceRegion(
        roi,
        autoAthleteRoiLocked ? 540 : Math.max(this.config.maxInferenceWidth, this.config.maxInferenceHeight)
      );

      const rawSamples: RawClipPoseSample[] = [];
      workerVideo.pause();

      type VfcVideo = HTMLVideoElement & {
        requestVideoFrameCallback?: (cb: (now: number, meta: { mediaTime: number }) => void) => number;
        cancelVideoFrameCallback?: (id: number) => void;
      };
      const vfcVideo = workerVideo as VfcVideo;
      const effectiveSpanSec = Math.max(0.1, windowSpec.endTime - windowSpec.startTime);

      // Fast sequential hardware-decoded pass via requestVideoFrameCallback @ 2.4x (0 mid-stream H.264 seeks)
      let nextSampleTimeSec = windowSpec.startTime;
      if (typeof vfcVideo.requestVideoFrameCallback === 'function') {
        await seekMonotonic(workerVideo, windowSpec.startTime, options.signal);

        const seqCompleted = await new Promise<boolean>((resolve, reject) => {
          let settled = false;
          let vfcId: number | null = null;
          let watchdogId: number | null = null;

          const cleanupSeq = () => {
            if (watchdogId !== null) window.clearTimeout(watchdogId);
            if (vfcId !== null && vfcVideo.cancelVideoFrameCallback) {
              vfcVideo.cancelVideoFrameCallback(vfcId);
            }
            options.signal?.removeEventListener('abort', onSeqAbort);
            workerVideo.pause();
          };

          const finishSeq = (ok: boolean) => {
            if (settled) return;
            settled = true;
            cleanupSeq();
            resolve(ok);
          };

          const onSeqAbort = () => {
            if (settled) return;
            settled = true;
            cleanupSeq();
            reject(new DOMException('Kinematic analysis aborted', 'AbortError'));
          };

          const resetWatchdog = () => {
            if (watchdogId !== null) window.clearTimeout(watchdogId);
            watchdogId = window.setTimeout(() => {
              finishSeq(false);
            }, 650);
          };

          options.signal?.addEventListener('abort', onSeqAbort);

          const onFrame = (_now: number, meta: { mediaTime: number }) => {
            if (settled) return;
            resetWatchdog();
            const mediaTime = meta?.mediaTime ?? workerVideo.currentTime;

            if (mediaTime + 0.01 < nextSampleTimeSec && mediaTime < windowSpec.endTime - 0.015) {
              vfcId = vfcVideo.requestVideoFrameCallback!(onFrame);
              return;
            }

            ctx.drawImage(workerVideo, srcX, srcY, srcW, srcH, 0, 0, dims.width, dims.height);
            const infStart = performance.now();
            const detection = landmarker.detectForVideo(surface as unknown as HTMLVideoElement, getMonotonicPoseTimestamp());
            const infMs = performance.now() - infStart;
            const lm = detection?.landmarks?.[0];

            // Adapt speed downward slightly on slower GPUs so 15fps sampling remains dense
            if (infMs > 28 && workerVideo.playbackRate > 1.5) {
              workerVideo.playbackRate = 1.5;
            }

            if (lm && lm.length >= 33) {
              const remapped = remapLandmarksFromRoi(lm, roi);
              rawSamples.push({
                frameIndex: rawSamples.length,
                timestampSec: mediaTime,
                rawLandmarks: remapped.map(p => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility }))
              });
              if (!autoAthleteRoiLocked) {
                autoAthleteRoiLocked = true;
                const athleteRoi = computeAthleteBoundingRoi(remapped);
                if (athleteRoi) {
                  applyInferenceRegion(athleteRoi, 540);
                }
              }
            }

            nextSampleTimeSec = Math.max(nextSampleTimeSec + windowSpec.step, mediaTime + windowSpec.step * 0.85);
            const approxFrame = Math.min(
              windowSpec.totalFrames,
              Math.max(1, Math.round(((mediaTime - windowSpec.startTime) / effectiveSpanSec) * windowSpec.totalFrames))
            );
            if (options.onProgress) {
              options.onProgress({
                currentFrame: approxFrame,
                totalFrames: windowSpec.totalFrames,
                percent: Math.min(100, Math.round((approxFrame / windowSpec.totalFrames) * 100)),
                elapsedMs: Math.round(performance.now() - t0)
              });
            }

            if (mediaTime >= windowSpec.endTime - 0.015 || workerVideo.ended || rawSamples.length >= windowSpec.totalFrames) {
              finishSeq(true);
              return;
            }
            vfcId = vfcVideo.requestVideoFrameCallback!(onFrame);
          };

          try {
            workerVideo.playbackRate = 3.2;
          } catch {
            // Keep default rate if unsupported
          }

          resetWatchdog();
          vfcId = vfcVideo.requestVideoFrameCallback!(onFrame);
          workerVideo.play().catch(() => {
            finishSeq(false);
          });
        });

        if (seqCompleted && rawSamples.length >= Math.max(5, Math.floor(windowSpec.totalFrames * 0.45))) {
          if (options.onProgress) {
            options.onProgress({
              currentFrame: windowSpec.totalFrames,
              totalFrames: windowSpec.totalFrames,
              percent: 100,
              elapsedMs: Math.round(performance.now() - t0)
            });
          }
          nextSampleTimeSec = windowSpec.endTime + 1; // Skip seek fallback
        }
      }

      // Deterministic seek fallback (only runs when sequential rVFC is unavailable or stalled)
      if (nextSampleTimeSec <= windowSpec.endTime - 0.01) {
        const lastTime = rawSamples.length > 0 ? rawSamples[rawSamples.length - 1].timestampSec : -1;
        for (let i = 0; i < windowSpec.totalFrames; i++) {
          if (options.signal?.aborted) {
            throw new DOMException('Kinematic analysis aborted', 'AbortError');
          }

          const targetSec = Math.min(Math.max(0, durationSec - 0.005), windowSpec.startTime + i * windowSpec.step);
          if (targetSec <= lastTime + windowSpec.step * 0.4) continue;

          await seekMonotonic(workerVideo, targetSec, options.signal);

          // Downscaled blit into single reused OffscreenCanvas
          ctx.drawImage(workerVideo, srcX, srcY, srcW, srcH, 0, 0, dims.width, dims.height);

          const monotonicTs = getMonotonicPoseTimestamp();
          const detection = landmarker.detectForVideo(surface as unknown as HTMLVideoElement, monotonicTs);
          const lm = detection?.landmarks?.[0];

          if (lm && lm.length >= 33) {
            const remapped = remapLandmarksFromRoi(lm, roi);
            rawSamples.push({
              frameIndex: rawSamples.length,
              timestampSec: targetSec,
              rawLandmarks: remapped.map(p => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility }))
            });
            if (!autoAthleteRoiLocked) {
              autoAthleteRoiLocked = true;
              const athleteRoi = computeAthleteBoundingRoi(remapped);
              if (athleteRoi) {
                applyInferenceRegion(athleteRoi, 540);
              }
            }
          }

          if (options.onProgress && (i === windowSpec.totalFrames - 1 || i % 3 === 0)) {
            options.onProgress({
              currentFrame: i + 1,
              totalFrames: windowSpec.totalFrames,
              percent: Math.round(((i + 1) / windowSpec.totalFrames) * 100),
              elapsedMs: Math.round(performance.now() - t0)
            });
          }

          // Lightweight main-thread yield every 6 frames for responsive UI without 24ms idle stalls
          if (i % 6 === 5) {
            await yieldToMainThread();
          }
        }
      }

      this.cachedRawSamples = rawSamples;
      this.cachedWindow = windowSpec;
      this.cachedDurationSec = durationSec;

      return this.buildKinematicsFromSamples(rawSamples, {
        pattern,
        loadType,
        targetMuscle,
        fps: this.config.targetSampleFps,
        startTimeSec: windowSpec.startTime,
        endTimeSec: windowSpec.endTime,
        durationSec,
        elapsedMs: Math.round(performance.now() - t0)
      });
    } finally {
      workerVideo.pause();
      workerVideo.removeAttribute('src');
      workerVideo.load();
      workerVideo.remove();
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    }
  }

  /**
   * Re-computes FrameKinematics[] instantaneously from cached raw pose landmarks
   * when switching exercises, muscle targets, or load types without re-decoding video.
   */
  public recomputeFromCache(
    pattern: ExercisePatternSpec,
    loadType: LoadType,
    targetMuscle: TargetMuscle
  ): ClipKinematicsResult | null {
    if (this.cachedRawSamples.length === 0 || !this.cachedWindow) {
      return null;
    }
    const t0 = performance.now();
    return this.buildKinematicsFromSamples(this.cachedRawSamples, {
      pattern,
      loadType,
      targetMuscle,
      fps: this.config.targetSampleFps,
      startTimeSec: this.cachedWindow.startTime,
      endTimeSec: this.cachedWindow.endTime,
      durationSec: this.cachedDurationSec,
      elapsedMs: Math.round(performance.now() - t0)
    });
  }

  /**
   * Pure deterministic pipeline transforming raw landmark samples into smoothed, occlusion-recovered,
   * FSM-audited FrameKinematics[]. Runnable directly in unit tests & workers without DOM/video.
   */
  public buildKinematicsFromSamples(
    rawSamples: RawClipPoseSample[],
    params: {
      pattern: ExercisePatternSpec;
      loadType: LoadType;
      targetMuscle: TargetMuscle;
      fps?: number;
      startTimeSec?: number;
      endTimeSec?: number;
      durationSec?: number;
      elapsedMs?: number;
    }
  ): ClipKinematicsResult {
    const fps = params.fps ?? this.config.targetSampleFps;
    if (rawSamples.length === 0) {
      return {
        version: '2.0',
        fps,
        startTimeSec: params.startTimeSec ?? 0,
        endTimeSec: params.endTimeSec ?? 0,
        durationSec: params.durationSec ?? 0,
        dominantSide: 'right',
        elapsedMs: params.elapsedMs ?? 0,
        frames: [],
        auditedReps: [],
        majorityFramingWarning: null
      };
    }

    const { pattern, loadType, targetMuscle } = params;
    const analysisRegion: 'upper' | 'lower' =
      pattern.primaryJoint === 'elbow' || pattern.primaryJoint === 'shoulder' ? 'upper' : 'lower';

    // Pass 1: Global dominant side lock across the whole clip
    let leftTotalScore = 0;
    let rightTotalScore = 0;
    for (const sample of rawSamples) {
      const ext = extractPoseDataFromLandmarks(sample.rawLandmarks, undefined, analysisRegion);
      if (ext?.sideScores) {
        leftTotalScore += ext.sideScores.left;
        rightTotalScore += ext.sideScores.right;
      }
    }
    const globalDominantSide: 'left' | 'right' = rightTotalScore >= leftTotalScore ? 'right' : 'left';

    // Pass 2: Occlusion recovery & confidence filtering (forearm projection + carry-forward + span interpolation)
    const occlusionState = createOcclusionTrackerState();
    const recoveredSequence: Array<Record<string, SerializablePoint2D>> = [];
    let badFramingCount = 0;
    let lastBadWarning: string | null = null;

    for (const sample of rawSamples) {
      const ext = extractPoseDataFromLandmarks(sample.rawLandmarks, globalDominantSide, analysisRegion);
      const rawKp = ext ? ext.keypoints : {};
      const cleaned = applyOcclusionAndConfidenceFallback(rawKp, occlusionState, this.config.minVisibility);
      recoveredSequence.push(cleaned);

      const q = assessFramingQuality(cleaned, pattern.id);
      if (!q.isValid) {
        badFramingCount += 1;
        lastBadWarning = q.message;
      }
    }

    const interpolatedSequence = interpolateOccludedSpans(recoveredSequence, this.config.minVisibility);
    const despikedSequence = applyTemporalSpikeRejection(interpolatedSequence);
    const majorityFramingWarning =
      badFramingCount > rawSamples.length * 0.6 ? lastBadWarning : null;

    // Pass 3: Zero-phase bidirectional smoothing (high precision stability with 0ms phase lag)
    const n = despikedSequence.length;
    const stepMs = 1000 / Math.max(1, fps);
    const filterParams = { minCutoff: 0.72, beta: 1.8, dCutoff: 1.0, deadzone: 0.0022 };
    const forwardSmoother = new PoseLandmarkSmoother(filterParams);
    const backwardSmoother = new PoseLandmarkSmoother(filterParams);

    const forwardPass: Array<Record<string, SerializablePoint2D>> = new Array(n);
    for (let i = 0; i < n; i++) {
      forwardPass[i] = forwardSmoother.smoothLandmarks(despikedSequence[i], (i + 1) * stepMs);
    }

    const backwardPass: Array<Record<string, SerializablePoint2D>> = new Array(n);
    for (let rev = 0; rev < n; rev++) {
      const idx = n - 1 - rev;
      backwardPass[idx] = backwardSmoother.smoothLandmarks(despikedSequence[idx], (rev + 1) * stepMs);
    }

    // Pass 4: Chronological FSM & Biomechanical Evaluation into serializable FrameKinematics[]
    const fsm = new BiomechanicalFSM({
      trackingMode: pattern.trackingMode,
      lockoutThreshold: pattern.standingThreshold,
      inflectionThreshold: pattern.inflectionThreshold,
      hysteresisAngleBand: 8,
      velocityThresholdDegPerSec: 15,
      minPhaseDurationMs: 120,
      bounceThresholdMs: 160,
      minRepExcursionDeg: 35
    });

    const resistanceParam: ResistanceSourceType =
      loadType === 'gravity' ? 'gravity' : loadType === 'cable' ? 'cable_mid' : 'machine';
    const targetBias = mapTargetBias(targetMuscle);
    const footTracker: FootStabilityState = {};

    let smoothedTibial = 14;
    let lastValidAngle = 0;
    let lastValidTimeMs = 0;
    const auditedReps: RepetitionBiomechanicalAudit[] = [];
    const frames: FrameKinematics[] = [];

    for (let i = 0; i < n; i++) {
      const fw = forwardPass[i];
      const bw = backwardPass[i];
      const merged: Record<string, SerializablePoint2D> = {};

      for (const [k, fPt] of Object.entries(fw)) {
        const bPt = bw[k];
        merged[k] = bPt
          ? {
              x: (fPt.x + bPt.x) * 0.5,
              y: (fPt.y + bPt.y) * 0.5,
              z: fPt.z !== undefined && bPt.z !== undefined ? (fPt.z + bPt.z) * 0.5 : fPt.z,
              visibility: fPt.visibility,
              occludedRecovered: despikedSequence[i][k]?.occludedRecovered,
              projectedByKinematics: despikedSequence[i][k]?.projectedByKinematics
            }
          : fPt;
      }

      // Bind working side aliases strictly to globalDominantSide
      merged['hip'] = globalDominantSide === 'right' ? (merged['right_hip'] || merged['hip']) : (merged['left_hip'] || merged['hip']);
      merged['knee'] = globalDominantSide === 'right' ? (merged['right_knee'] || merged['knee']) : (merged['left_knee'] || merged['knee']);
      merged['ankle'] = globalDominantSide === 'right' ? (merged['right_ankle'] || merged['ankle']) : (merged['left_ankle'] || merged['ankle']);
      merged['shoulder'] = globalDominantSide === 'right' ? (merged['right_shoulder'] || merged['shoulder']) : (merged['left_shoulder'] || merged['shoulder']);
      merged['elbow'] = globalDominantSide === 'right' ? (merged['right_elbow'] || merged['elbow']) : (merged['left_elbow'] || merged['elbow']);
      merged['wrist'] = globalDominantSide === 'right' ? (merged['right_wrist'] || merged['wrist']) : (merged['left_wrist'] || merged['wrist']);
      merged['hand_grip'] = globalDominantSide === 'right'
        ? (merged['right_hand_grip'] || merged['hand_grip'] || merged['wrist'])
        : (merged['left_hand_grip'] || merged['hand_grip'] || merged['wrist']);

      const tsSec = rawSamples[i].timestampSec;
      const tsMs = tsSec * 1000;

      let primaryAngle = computePrimaryJointAngle(merged, pattern.primaryJoint);
      if (lastValidAngle > 0 && tsMs > lastValidTimeMs) {
        const dtSec = Math.max((tsMs - lastValidTimeMs) / 1000, 0.01);
        const maxDelta = 380 * dtSec;
        const diff = primaryAngle - lastValidAngle;
        if (Math.abs(diff) > maxDelta) {
          primaryAngle = lastValidAngle + Math.sign(diff) * maxDelta;
        }
      }
      lastValidAngle = primaryAngle;
      lastValidTimeMs = tsMs;

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
        framingWarning: majorityFramingWarning
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
      majorityFramingWarning
    };
  }
}

/**
 * O(log N) binary lookup + linear keypoint interpolation between adjacent 15 FPS keyframes
 * for smooth 60 Hz overlay playback.
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
  const interpKp: Record<string, SerializablePoint2D> = {};

  for (const [key, ptA] of Object.entries(fA.keypoints)) {
    const ptB = fB.keypoints[key];
    if (!ptA) continue;
    interpKp[key] = ptB
      ? {
          x: ptA.x + (ptB.x - ptA.x) * alpha,
          y: ptA.y + (ptB.y - ptA.y) * alpha,
          z: ptA.z !== undefined && ptB.z !== undefined ? ptA.z + (ptB.z - ptA.z) * alpha : ptA.z,
          visibility: ptA.visibility,
          occludedRecovered: ptA.occludedRecovered || ptB.occludedRecovered
        }
      : ptA;
  }

  const base = alpha < 0.5 ? fA : fB;
  return {
    ...base,
    timestampSec: timeSec,
    primaryAngleDeg: Math.round(fA.primaryAngleDeg + (fB.primaryAngleDeg - fA.primaryAngleDeg) * alpha),
    elbowAngleDeg: Math.round(fA.elbowAngleDeg + (fB.elbowAngleDeg - fA.elbowAngleDeg) * alpha),
    kneeAngleDeg: Math.round(fA.kneeAngleDeg + (fB.kneeAngleDeg - fA.kneeAngleDeg) * alpha),
    hipAngleDeg: Math.round(fA.hipAngleDeg + (fB.hipAngleDeg - fA.hipAngleDeg) * alpha),
    keypoints: interpKp
  };
}
