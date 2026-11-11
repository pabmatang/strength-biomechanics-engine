import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ClipKinematicsResult,
  FrameKinematics,
  KinematicAnalysisEngine,
  KinematicClipOptions,
  KinematicEngineConfig,
  KinematicProgressUpdate,
  lookupFrameKinematicsAtTime
} from '../utils/kinematicAnalysisEngine';
import { ExercisePatternSpec, LoadType, TargetMuscle } from '../utils/biomechanicsEngine';

export type KinematicAnalysisStatus = 'idle' | 'analyzing' | 'ready' | 'cancelled' | 'error';

export interface UseKinematicAnalysisReturn {
  status: KinematicAnalysisStatus;
  progress: KinematicProgressUpdate;
  clipResult: ClipKinematicsResult | null;
  frames: FrameKinematics[];
  error: string | null;
  analyzeClip: (
    videoSource: HTMLVideoElement | File,
    options?: Omit<KinematicClipOptions, 'onProgress' | 'signal'>
  ) => Promise<ClipKinematicsResult | null>;
  recomputeForPattern: (
    pattern: ExercisePatternSpec,
    loadType: LoadType,
    targetMuscle: TargetMuscle
  ) => ClipKinematicsResult | null;
  cancel: () => void;
  reset: () => void;
  getFrameAtTime: (timeSec: number) => FrameKinematics | null;
}

const INITIAL_PROGRESS: KinematicProgressUpdate = {
  currentFrame: 0,
  totalFrames: 0,
  percent: 0,
  elapsedMs: 0
};

/**
 * Decoupled React hook orchestrating KinematicAnalysisEngine execution, progress tracking,
 * abort lifecycle, instant pattern recomputation, and O(log N) playback frame synchronization.
 */
export function useKinematicAnalysis(
  engineConfig?: KinematicEngineConfig
): UseKinematicAnalysisReturn {
  const engineRef = useRef<KinematicAnalysisEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new KinematicAnalysisEngine(engineConfig);
  }

  const abortRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<KinematicAnalysisStatus>('idle');
  const [progress, setProgress] = useState<KinematicProgressUpdate>(INITIAL_PROGRESS);
  const [clipResult, setClipResult] = useState<ClipKinematicsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStatus(prev => (prev === 'analyzing' ? 'cancelled' : prev));
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    engineRef.current?.clearCache();
    setStatus('idle');
    setProgress(INITIAL_PROGRESS);
    setClipResult(null);
    setError(null);
  }, []);

  const analyzeClip = useCallback(
    async (
      videoSource: HTMLVideoElement | File,
      options: Omit<KinematicClipOptions, 'onProgress' | 'signal'> = {}
    ): Promise<ClipKinematicsResult | null> => {
      if (!engineRef.current) return null;

      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('analyzing');
      setProgress(INITIAL_PROGRESS);
      setError(null);

      try {
        const result = await engineRef.current.processClipDetailed(videoSource, {
          ...options,
          signal: controller.signal,
          onProgress: (p) => {
            if (!controller.signal.aborted) {
              setProgress(p);
            }
          }
        });

        if (controller.signal.aborted) return null;
        setClipResult(result);
        setStatus('ready');
        return result;
      } catch (err: any) {
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          setStatus('cancelled');
          return null;
        }
        const message = err?.message || 'Error procesando la cinemática del vídeo.';
        setError(message);
        setStatus('error');
        return null;
      }
    },
    []
  );

  const recomputeForPattern = useCallback(
    (
      pattern: ExercisePatternSpec,
      loadType: LoadType,
      targetMuscle: TargetMuscle
    ): ClipKinematicsResult | null => {
      if (!engineRef.current) return null;
      const updated = engineRef.current.recomputeFromCache(pattern, loadType, targetMuscle);
      if (updated) {
        setClipResult(updated);
      }
      return updated;
    },
    []
  );

  const getFrameAtTime = useCallback(
    (timeSec: number): FrameKinematics | null => {
      if (!clipResult || clipResult.frames.length === 0) return null;
      return lookupFrameKinematicsAtTime(clipResult.frames, timeSec);
    },
    [clipResult]
  );

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  return {
    status,
    progress,
    clipResult,
    frames: clipResult?.frames ?? [],
    error,
    analyzeClip,
    recomputeForPattern,
    cancel,
    reset,
    getFrameAtTime
  };
}
