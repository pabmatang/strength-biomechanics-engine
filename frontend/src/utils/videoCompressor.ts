/**
 * High-Speed Client-Side Video Compressor & Range Trimmer
 * 
 * - Supports custom Range Trimming { startTime, endTime } up to 30.0 seconds.
 * - Downsamples to max 480px width (preserving aspect ratio with even pixel bounds).
 * - Transcodes at 15 FPS and 800 kbps via MediaRecorder (MP4 AVC1 / WebM VP8).
 * - Emergency secondary compression pass to 360p / 12 FPS / 500 kbps if video > 12 MB.
 * - Memory-safe asynchronous Base64 conversion via FileReader.readAsDataURL.
 * - Fast bypass if original video already weighs < 1.2 MB and duration <= 30s.
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

/**
 * Internal single-pass Canvas + MediaRecorder compressor.
 */
function runCanvasCompression(
  file: File | Blob,
  maxWidth: number,
  targetFps: number,
  bitrate: number,
  maxDurationSec: number,
  range?: VideoRange
): Promise<Blob | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
    return Promise.resolve(null);
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

    // Safety timeout: generous timeout for up to 30s videos (80s max)
    const timeoutDuration = Math.max(60_000, Math.round(maxDurationSec * 2500));
    const timeoutTimer = setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeoutDuration);

    video.onerror = () => {
      clearTimeout(timeoutTimer);
      cleanup();
      resolve(null);
    };

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration;
        if (!duration || !isFinite(duration) || duration <= 0) {
          clearTimeout(timeoutTimer);
          cleanup();
          return resolve(null);
        }

        // Determine exact window
        let startTime = 0.0;
        let endTime = duration;

        if (range) {
          startTime = Math.max(0, range.startTime);
          endTime = Math.min(duration, Math.min(range.endTime, startTime + maxDurationSec));
        } else if (duration > maxDurationSec) {
          startTime = 0.0;
          endTime = Math.min(duration, maxDurationSec);
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
          return resolve(null);
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
          return resolve(null);
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
            resolve(null);
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

            if (video.currentTime >= endTime || video.ended) {
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
        resolve(null);
      }
    };
  });
}

/**
 * Prepares and compresses video client-side before Base64 serialization or dispatch.
 * Enforces emergency 360p / 12 FPS downscale if file > 12 MB to avoid V8 "Invalid string length".
 */
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
    bitrate = 800_000,
    maxDurationSec = 30.0,
    range
  } = options;

  // Fallback for non-browser / test / SSR environments
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
    return file;
  }

  // Direct bypass ONLY if video is already tiny (< 1.2 MB) AND no range trimming requested
  if (!range && file.size <= 1.2 * 1024 * 1024) {
    console.info(`[Compressor] Bypass: archivo ligero (${(file.size / 1024).toFixed(0)} KB) y sin recorte.`);
    return file;
  }

  // 1. Primary Compression Pass (480p / 15 FPS / 800 kbps)
  let compressedBlob = await runCanvasCompression(file, maxWidth, targetFps, bitrate, maxDurationSec, range);

  // 2. Emergency Secondary Pass (360p / 12 FPS / 500 kbps) if primary pass failed or result > 12 MB
  const maxSafeSizeBytes = 12 * 1024 * 1024; // 12 MB safe threshold for V8 Base64 strings
  const needsEmergencyCompression = !compressedBlob || (compressedBlob.size > maxSafeSizeBytes);

  if (needsEmergencyCompression && file.size > maxSafeSizeBytes) {
    console.warn(`[Compressor] Archivo > 12MB (${((compressedBlob?.size || file.size) / (1024 * 1024)).toFixed(1)}MB). Ejecutando compresión de emergencia 360p/12FPS...`);
    const emergencyBlob = await runCanvasCompression(file, 360, 12, 500_000, maxDurationSec, range);
    if (emergencyBlob) {
      compressedBlob = emergencyBlob;
    }
  }

  return compressedBlob || file;
}

/**
 * Asynchronous, memory-safe Blob to Base64 converter.
 * Strips Data URL scheme prefix (e.g. "data:video/mp4;base64,") so clean Base64 is returned.
 * Uses native FileReader.readAsDataURL without call-stack or String.fromCharCode limitations.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const commaIdx = res.indexOf(",");
      resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
