import { PoseLandmarkSmoother } from './oneEuroFilter';
import { BiomechanicalFSM, FsmPhase } from './biomechanicalFSM';
import {
  Keypoint2D,
  calculateJointAngle,
  extractPoseDataFromLandmarks,
  getMonotonicPoseTimestamp
} from './videoPoseEstimator';
import {
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

export interface RawOfflinePoseSample {
  frameIndex: number;
  timeSec: number;
  timestampMs: number;
  rawLandmarks: Array<{ x: number; y: number; z: number; visibility?: number }>;
}

export interface ProcessedOfflineFrame {
  frameIndex: number;
  timeSec: number;
  primaryAngle: number;
  smoothedKeypoints: Record<string, Keypoint2D>;
  telemetry: BiomechanicalTelemetryFrame;
  phase: FsmPhase;
  completedRepsCount: number;
  framingWarning: string | null;
}

export interface OfflineKinematicsResult {
  fps: number;
  durationSec: number;
  dominantSide: 'left' | 'right';
  frames: ProcessedOfflineFrame[];
  auditedReps: RepetitionBiomechanicalAudit[];
  majorityFramingWarning: string | null;
}

export interface OfflineExtractionProgress {
  currentFrame: number;
  totalFrames: number;
  percent: number;
}

export interface OfflineExtractionResult {
  fps: number;
  durationSec: number;
  samples: RawOfflinePoseSample[];
}

function waitForVideoMetadata(video: HTMLVideoElement, signal?: AbortSignal): Promise<number> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Offline extraction aborted', 'AbortError'));
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
      reject(new Error('No se pudo cargar el vídeo para el preprocesado offline.'));
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException('Offline extraction aborted', 'AbortError'));
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
    signal?.addEventListener('abort', onAbort);
  });
}

function seekVideoFrame(video: HTMLVideoElement, targetSec: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Offline extraction aborted', 'AbortError'));
      return;
    }
    if (Math.abs(video.currentTime - targetSec) < 0.002) {
      resolve();
      return;
    }

    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve();
      }
    }, 350);

    const cleanup = () => {
      window.clearTimeout(timer);
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
      reject(new DOMException('Offline extraction aborted', 'AbortError'));
    };

    video.addEventListener('seeked', onSeeked);
    signal?.addEventListener('abort', onAbort);
    video.currentTime = targetSec;
  });
}

/**
 * Step 1 of decoupled offline analysis:
 * Scans the entire video frame-by-frame (default 30 fps) using a dedicated offscreen <video>
 * so MediaPipe infers every frame cleanly without frame-drop, speed distortion, or UI stutter.
 */
export async function extractVideoLandmarksOffline(
  videoUrl: string,
  poseModel: { detectForVideo: (video: HTMLVideoElement, timestampMs: number) => { landmarks?: Array<Array<{ x: number; y: number; z: number; visibility?: number }>> } },
  options: {
    fps?: number;
    onProgress?: (progress: OfflineExtractionProgress) => void;
    signal?: AbortSignal;
  } = {}
): Promise<OfflineExtractionResult> {
  const offscreenVideo = document.createElement('video');
  offscreenVideo.muted = true;
  offscreenVideo.playsInline = true;
  offscreenVideo.preload = 'auto';
  offscreenVideo.src = videoUrl;

  try {
    const durationSec = await waitForVideoMetadata(offscreenVideo, options.signal);
    if (!Number.isFinite(durationSec) || durationSec <= 0) {
      return { fps: options.fps ?? 30, durationSec: 0, samples: [] };
    }

    // Target 30 fps for standard workout clips; gracefully cap sample rate on very long >45s clips
    const requestedFps = options.fps ?? 30;
    const fps = durationSec > 45
      ? Math.max(15, Math.min(requestedFps, Math.floor(1350 / durationSec)))
      : requestedFps;

    const totalFrames = Math.max(1, Math.floor(durationSec * fps));
    const samples: RawOfflinePoseSample[] = [];
    offscreenVideo.pause();

    for (let i = 0; i < totalFrames; i++) {
      if (options.signal?.aborted) {
        throw new DOMException('Offline extraction aborted', 'AbortError');
      }

      const targetSec = Math.min(Math.max(0, durationSec - 0.005), i / fps);
      await seekVideoFrame(offscreenVideo, targetSec, options.signal);

      const monotonicTs = getMonotonicPoseTimestamp();
      const results = poseModel.detectForVideo(offscreenVideo, monotonicTs);
      const lm = results?.landmarks?.[0];

      if (lm && lm.length >= 33) {
        samples.push({
          frameIndex: i,
          timeSec: i / fps,
          timestampMs: monotonicTs,
          rawLandmarks: lm.map(p => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility }))
        });
      }

      if (options.onProgress && (i === totalFrames - 1 || i % 3 === 0)) {
        options.onProgress({
          currentFrame: i + 1,
          totalFrames,
          percent: Math.round(((i + 1) / totalFrames) * 100)
        });
      }

      // Yield briefly to browser UI loop so progress UI & Cancel stay 100% responsive
      if (i % 4 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }

    return { fps, durationSec, samples };
  } finally {
    offscreenVideo.pause();
    offscreenVideo.removeAttribute('src');
    offscreenVideo.load();
  }
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

function applyZeroPhaseSmoothing(
  rawFrames: Array<Record<string, Keypoint2D>>,
  stepMs: number
): Array<Record<string, Keypoint2D>> {
  const n = rawFrames.length;
  if (n === 0) return [];

  const filterParams = { minCutoff: 0.72, beta: 0.006, dCutoff: 1.0 };
  const forwardSmoother = new PoseLandmarkSmoother(filterParams);
  const backwardSmoother = new PoseLandmarkSmoother(filterParams);

  const forwardPass: Array<Record<string, Keypoint2D>> = new Array(n);
  for (let i = 0; i < n; i++) {
    forwardPass[i] = forwardSmoother.smoothLandmarks(rawFrames[i], (i + 1) * stepMs);
  }

  const backwardPass: Array<Record<string, Keypoint2D>> = new Array(n);
  for (let rev = 0; rev < n; rev++) {
    const idx = n - 1 - rev;
    backwardPass[idx] = backwardSmoother.smoothLandmarks(rawFrames[idx], (rev + 1) * stepMs);
  }

  // Combine forward and reverse passes (filtfilt zero-phase smoothing -> 0 lag + ultra-low jitter)
  const blended: Array<Record<string, Keypoint2D>> = new Array(n);
  for (let i = 0; i < n; i++) {
    const fw = forwardPass[i];
    const bw = backwardPass[i];
    const merged: Record<string, Keypoint2D> = {};

    for (const [key, fPt] of Object.entries(fw)) {
      const bPt = bw[key];
      if (!fPt) continue;
      merged[key] = bPt
        ? {
            x: (fPt.x + bPt.x) * 0.5,
            y: (fPt.y + bPt.y) * 0.5,
            z: fPt.z !== undefined && bPt.z !== undefined ? (fPt.z + bPt.z) * 0.5 : fPt.z,
            visibility: fPt.visibility,
            name: fPt.name
          }
        : fPt;
    }
    blended[i] = merged;
  }

  return blended;
}

/**
 * Step 2 of decoupled offline analysis:
 * Given cached per-frame raw landmarks, computes a zero-phase smoothed kinematic track,
 * locks the globally cleanest side across the entire video, runs FSM rep auditing chronologically,
 * and caches full telemetry frames for instant playback & seeking at any speed.
 */
export function buildOfflineKinematicsTrack(
  samples: RawOfflinePoseSample[],
  selectedPattern: ExercisePatternSpec,
  loadType: LoadType,
  targetMuscle: TargetMuscle,
  fps: number = 30
): OfflineKinematicsResult {
  if (samples.length === 0) {
    return {
      fps,
      durationSec: 0,
      dominantSide: 'right',
      frames: [],
      auditedReps: [],
      majorityFramingWarning: null
    };
  }

  const analysisRegion: 'upper' | 'lower' =
    selectedPattern.primaryJoint === 'elbow' || selectedPattern.primaryJoint === 'shoulder'
      ? 'upper'
      : 'lower';

  // Pass 1: Determine globally clearest dominant side across ALL samples
  let leftTotalScore = 0;
  let rightTotalScore = 0;
  for (const s of samples) {
    const ext = extractPoseDataFromLandmarks(s.rawLandmarks, undefined, analysisRegion);
    if (ext?.sideScores) {
      leftTotalScore += ext.sideScores.left;
      rightTotalScore += ext.sideScores.right;
    }
  }
  const globalDominantSide: 'left' | 'right' = rightTotalScore >= leftTotalScore ? 'right' : 'left';

  // Pass 2: Extract locked-side keypoints & apply zero-phase bidirectional smoothing
  const rawKeypointFrames: Array<Record<string, Keypoint2D>> = [];
  let badFramingCount = 0;
  let lastBadWarning: string | null = null;

  for (const s of samples) {
    const extracted = extractPoseDataFromLandmarks(s.rawLandmarks, globalDominantSide, analysisRegion);
    const kp = extracted ? extracted.keypoints : {};
    if (extracted) {
      const q = assessFramingQuality(kp, selectedPattern.id);
      if (!q.isValid) {
        badFramingCount += 1;
        lastBadWarning = q.message;
      }
    }
    rawKeypointFrames.push(kp);
  }

  const stepMs = 1000 / Math.max(1, fps);
  const smoothedFrames = applyZeroPhaseSmoothing(rawKeypointFrames, stepMs);
  const majorityFramingWarning =
    badFramingCount > samples.length * 0.60 ? lastBadWarning : null;

  // Pass 3: Alias active working-side joints, stabilize tibial angle, and audit chronological FSM
  const fsm = new BiomechanicalFSM({
    trackingMode: selectedPattern.trackingMode,
    lockoutThreshold: selectedPattern.standingThreshold,
    inflectionThreshold: selectedPattern.inflectionThreshold,
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

  let smoothedTibialAngle = 14;
  let lastValidAngle = 0;
  let lastValidTimeMs = 0;
  const auditedReps: RepetitionBiomechanicalAudit[] = [];
  const processedFrames: ProcessedOfflineFrame[] = [];

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const kp = { ...smoothedFrames[i] };

    kp['hip'] = globalDominantSide === 'right' ? (kp['right_hip'] || kp['hip']) : (kp['left_hip'] || kp['hip']);
    kp['knee'] = globalDominantSide === 'right' ? (kp['right_knee'] || kp['knee']) : (kp['left_knee'] || kp['knee']);
    kp['ankle'] = globalDominantSide === 'right' ? (kp['right_ankle'] || kp['ankle']) : (kp['left_ankle'] || kp['ankle']);
    kp['shoulder'] = globalDominantSide === 'right' ? (kp['right_shoulder'] || kp['shoulder']) : (kp['left_shoulder'] || kp['shoulder']);
    kp['elbow'] = globalDominantSide === 'right' ? (kp['right_elbow'] || kp['elbow']) : (kp['left_elbow'] || kp['elbow']);
    kp['wrist'] = globalDominantSide === 'right' ? (kp['right_wrist'] || kp['wrist']) : (kp['left_wrist'] || kp['wrist']);
    kp['hand_grip'] = globalDominantSide === 'right'
      ? (kp['right_hand_grip'] || kp['hand_grip'] || kp['wrist'])
      : (kp['left_hand_grip'] || kp['hand_grip'] || kp['wrist']);

    const frameTimeMs = Math.max(0, sample.timeSec * 1000);
    let jointAngle = computePrimaryJointAngle(kp, selectedPattern.primaryJoint);
    if (lastValidAngle > 0 && frameTimeMs > lastValidTimeMs) {
      const dtSec = Math.max((frameTimeMs - lastValidTimeMs) / 1000, 0.01);
      const maxDelta = 380 * dtSec;
      const diff = jointAngle - lastValidAngle;
      if (Math.abs(diff) > maxDelta) {
        jointAngle = lastValidAngle + Math.sign(diff) * maxDelta;
      }
    }
    lastValidAngle = jointAngle;
    lastValidTimeMs = frameTimeMs;

    const completedRep = fsm.update(jointAngle, frameTimeMs);
    const phase = fsm.getPhase();
    const angVelocity = fsm.getSmoothedVelocity();

    if (completedRep) {
      const audit = auditCompletedRepetition(
        completedRep,
        fsm.getCompletedReps(),
        selectedPattern.name,
        targetBias
      );
      auditedReps.push(audit);
    }

    const rawTibial = kp['ankle'] && kp['knee'] ? calculateTibialAngle(kp['ankle'], kp['knee']) : 14;
    smoothedTibialAngle = Math.round((0.86 * smoothedTibialAngle + 0.14 * rawTibial) * 10) / 10;

    const telemetry = evaluateBiomechanicalFrame(
      kp,
      selectedPattern.id,
      phase,
      jointAngle,
      angVelocity,
      resistanceParam,
      targetBias,
      frameTimeMs,
      smoothedTibialAngle,
      footTracker
    );

    processedFrames.push({
      frameIndex: sample.frameIndex,
      timeSec: sample.timeSec,
      primaryAngle: Math.round(jointAngle),
      smoothedKeypoints: kp,
      telemetry,
      phase,
      completedRepsCount: auditedReps.length,
      framingWarning: majorityFramingWarning
    });
  }

  return {
    fps,
    durationSec: samples[samples.length - 1].timeSec,
    dominantSide: globalDominantSide,
    frames: processedFrames,
    auditedReps,
    majorityFramingWarning
  };
}

/**
 * Step 3 of decoupled offline analysis:
 * Performs O(log N) binary lookup + linear keypoint interpolation between adjacent cached frames,
 * providing 60fps silky-smooth overlays during 0.25x / 0.5x / 1x playback and instant timeline scrubbing.
 */
export function lookupOfflineFrameAtTime(
  frames: ProcessedOfflineFrame[],
  timeSec: number
): ProcessedOfflineFrame | null {
  if (!frames || frames.length === 0) return null;
  if (timeSec <= frames[0].timeSec) return frames[0];
  const lastIdx = frames.length - 1;
  if (timeSec >= frames[lastIdx].timeSec) return frames[lastIdx];

  // Binary search for greatest index <= timeSec
  let lo = 0;
  let hi = lastIdx;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (frames[mid].timeSec <= timeSec) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  const idxA = Math.max(0, hi);
  const idxB = Math.min(lastIdx, idxA + 1);
  const frameA = frames[idxA];
  const frameB = frames[idxB];
  const span = frameB.timeSec - frameA.timeSec;

  if (idxA === idxB || span <= 1e-4) return frameA;

  const alpha = Math.max(0, Math.min(1, (timeSec - frameA.timeSec) / span));
  const interpKeypoints: Record<string, Keypoint2D> = {};

  for (const [key, ptA] of Object.entries(frameA.smoothedKeypoints)) {
    const ptB = frameB.smoothedKeypoints[key];
    if (!ptA) continue;
    interpKeypoints[key] = ptB
      ? {
          x: ptA.x + (ptB.x - ptA.x) * alpha,
          y: ptA.y + (ptB.y - ptA.y) * alpha,
          z: ptA.z !== undefined && ptB.z !== undefined ? ptA.z + (ptB.z - ptA.z) * alpha : ptA.z,
          visibility: ptA.visibility,
          name: ptA.name
        }
      : ptA;
  }

  const baseFrame = alpha < 0.5 ? frameA : frameB;
  return {
    ...baseFrame,
    timeSec,
    primaryAngle: Math.round(frameA.primaryAngle + (frameB.primaryAngle - frameA.primaryAngle) * alpha),
    smoothedKeypoints: interpKeypoints
  };
}
