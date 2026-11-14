/**
 * High-Speed Client-Side Video Compressor & Range Trimmer
 * 
 * - Supports custom Range Trimming { startTime, endTime } up to 30.0 seconds.
 * - Downsamples to max 480px width (preserving aspect ratio with even pixel bounds).
 * - Transcodes at 15 FPS and 900 kbps via MediaRecorder (MP4 AVC1 / WebM VP8).
 * - Fast bypass if original video already weighs < 1.2 MB and duration <= 30s.
 * - Detailed telemetry console.info of compression savings.
 */

export interface VideoRange {
  startTime: number;
  endTime: number;
}

export interface VideoCompressionOptions {
  maxWidth?: number;
  targetFps?: number;
  bitrate?: number;
  maxDurationSec?: number;
  range?: VideoRange;
}

export async function prepareVideoForAnalysis(
  file: File | Blob,
  rangeOrOptions?: VideoRange | VideoCompressionOptions
): Promise<Blob> {
  // Parse polymorphic options
  let options: VideoCompressionOptions = {};
  if (rangeOrOptions) {
    if ('startTime' in rangeOrOptions && 'endTime' in rangeOrOptions) {
      options = { range: rangeOrOptions as VideoRange };
    } else {
      options = rangeOrOptions as VideoCompressionOptions;
    }
  }

  const {
    maxWidth = 480,
    targetFps = 15,
    bitrate = 900_000,
    maxDurationSec = 30.0,
    range
  } = options;

  // Fallback for non-browser / test / SSR environments
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
    return file;
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.autoplay = false;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    let cleanupDone = false;
    const cleanup = () => {
      if (cleanupDone) return;
      cleanupDone = true;
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
        URL.revokeObjectURL(objectUrl);
      } catch {
        // Safe disposal
      }
    };

    // Safety timeout: if compression hangs, fallback to original file
    const timeoutTimer = setTimeout(() => {
      cleanup();
      resolve(file);
    }, 35_000);

    video.onerror = () => {
      clearTimeout(timeoutTimer);
      cleanup();
      resolve(file);
    };

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration;
        if (!duration || !isFinite(duration) || duration <= 0) {
          clearTimeout(timeoutTimer);
          cleanup();
          return resolve(file);
        }

        // Direct bypass if file already lightweight (< 1.2 MB) and <= 30s with no custom range
        if (!range && duration <= maxDurationSec && file.size < 1.2 * 1024 * 1024) {
          clearTimeout(timeoutTimer);
          cleanup();
          console.info(`[Compressor] Bypass activo: archivo ligero (${(file.size / (1024 * 1024)).toFixed(2)} MB, ${duration.toFixed(1)}s).`);
          return resolve(file);
        }

        // Determine exact window
        let startTime = 0;
        let endTime = duration;

        if (range) {
          startTime = Math.max(0, range.startTime);
          endTime = Math.min(duration, Math.min(range.endTime, startTime + maxDurationSec));
        } else if (duration > maxDurationSec) {
          // Automatic 30s window starting after initial setup
          startTime = 1.0;
          endTime = Math.min(duration, startTime + maxDurationSec);
        }

        // Calculate aspect-ratio bounds (must be even for H.264 / VP8 codecs)
        const srcW = video.videoWidth || 640;
        const srcH = video.videoHeight || 480;
        let targetW = srcW;
        let targetH = srcH;

        if (srcW > maxWidth) {
          const scale = maxWidth / srcW;
          targetW = maxWidth;
          targetH = Math.round(srcH * scale);
        }

        targetW = targetW % 2 === 0 ? targetW : targetW - 1;
        targetH = targetH % 2 === 0 ? targetH : targetH - 1;

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { alpha: false });

        if (!ctx || typeof canvas.captureStream !== 'function') {
          clearTimeout(timeoutTimer);
          cleanup();
          return resolve(file);
        }

        // Preferred container codecs: MP4 AVC1 preferred, falling back to WebM VP8
        const preferredMimes = [
          'video/mp4;codecs=avc1',
          'video/mp4',
          'video/webm;codecs=vp8',
          'video/webm'
        ];
        const chosenMime = preferredMimes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

        const stream = canvas.captureStream(targetFps);
        let recorder: MediaRecorder;
        try {
          recorder = chosenMime
            ? new MediaRecorder(stream, { mimeType: chosenMime, videoBitsPerSecond: bitrate })
            : new MediaRecorder(stream, { videoBitsPerSecond: bitrate });
        } catch {
          clearTimeout(timeoutTimer);
          cleanup();
          return resolve(file);
        }

        const recordedChunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          clearTimeout(timeoutTimer);
          cleanup();
          if (recordedChunks.length > 0) {
            const finalMime = recorder.mimeType || chosenMime || 'video/webm';
            const compressedBlob = new Blob(recordedChunks, { type: finalMime });

            const origMb = (file.size / (1024 * 1024)).toFixed(2);
            const compMb = (compressedBlob.size / (1024 * 1024)).toFixed(2);
            const savingPct = Math.max(0, Math.round((1 - compressedBlob.size / file.size) * 100));
            console.info(`[Compressor] Original: ${origMb} MB -> Comprimido: ${compMb} MB (${savingPct}% ahorro) | Rango: ${startTime.toFixed(1)}s -> ${endTime.toFixed(1)}s`);

            resolve(compressedBlob);
          } else {
            resolve(file);
          }
        };

        // Start recording routine
        const startRecording = () => {
          if (cleanupDone || recorder.state === 'recording') return;
          recorder.start(100);

          const frameIntervalMs = 1000 / targetFps;
          let lastFrameTime = performance.now();

          const renderLoop = () => {
            if (cleanupDone) return;

            const now = performance.now();
            if (now - lastFrameTime >= frameIntervalMs) {
              lastFrameTime = now;
              ctx.drawImage(video, 0, 0, targetW, targetH);
            }

            if (video.currentTime >= endTime || video.ended || video.paused) {
              if (recorder.state === 'recording') {
                recorder.stop();
              }
              return;
            }

            requestAnimationFrame(renderLoop);
          };

          video.play()
            .then(() => {
              requestAnimationFrame(renderLoop);
            })
            .catch(() => {
              if (recorder.state === 'recording') {
                recorder.stop();
              }
            });
        };

        // Seek or immediate start if already at startTime
        if (Math.abs(video.currentTime - startTime) < 0.05) {
          startRecording();
        } else {
          video.onseeked = () => {
            video.onseeked = null;
            startRecording();
          };
          video.currentTime = startTime;
        }
      } catch {
        clearTimeout(timeoutTimer);
        cleanup();
        resolve(file);
      }
    };
  });
}
