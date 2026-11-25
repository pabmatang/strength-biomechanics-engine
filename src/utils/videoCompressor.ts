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

import * as MP4Box from 'mp4box';
import { Muxer as Mp4Muxer, ArrayBufferTarget } from 'mp4-muxer';

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
  onProgress?: (pct: number) => void;
}

/**
 * Minimal zero-dependency WebM (EBML + VP8) muxer for WebCodecs VideoEncoder chunks.
 * Produces a valid seekable WebM Blob with exact millisecond PTS timestamps.
 */
function encodeEbmlVint(val: number): Uint8Array {
  if (val < 0x7f) return new Uint8Array([0x80 | val]);
  if (val < 0x3fff) return new Uint8Array([0x40 | (val >> 8), val & 0xff]);
  if (val < 0x1fffff) return new Uint8Array([0x20 | (val >> 16), (val >> 8) & 0xff, val & 0xff]);
  return new Uint8Array([0x10 | (val >> 24), (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff]);
}

function ebmlEl(idBytes: number[], payload: Uint8Array): Uint8Array {
  const vint = encodeEbmlVint(payload.length);
  const out = new Uint8Array(idBytes.length + vint.length + payload.length);
  out.set(idBytes, 0);
  out.set(vint, idBytes.length);
  out.set(payload, idBytes.length + vint.length);
  return out;
}

function ebmlUint(idBytes: number[], val: number): Uint8Array {
  const bytes: number[] = [];
  let v = Math.max(0, Math.floor(val));
  do {
    bytes.unshift(v & 0xff);
    v = Math.floor(v / 256);
  } while (v > 0);
  return ebmlEl(idBytes, new Uint8Array(bytes));
}

function ebmlStr(idBytes: number[], str: string): Uint8Array {
  return ebmlEl(idBytes, new TextEncoder().encode(str));
}

function ebmlFloat64(idBytes: number[], val: number): Uint8Array {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setFloat64(0, val, false);
  return ebmlEl(idBytes, new Uint8Array(buf));
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((acc, p) => acc + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function buildWebmFromVp8Chunks(
  chunks: Array<{ data: Uint8Array; timestampMs: number; key: boolean }>,
  width: number,
  height: number,
  durationMs: number
): Blob {
  const ebmlHeader = ebmlEl([0x1a, 0x45, 0xdf, 0xa3], concatBytes([
    ebmlUint([0x42, 0x86], 1),
    ebmlUint([0x42, 0xf7], 1),
    ebmlUint([0x42, 0xf2], 4),
    ebmlUint([0x42, 0xf3], 8),
    ebmlStr([0x42, 0x82], 'webm'),
    ebmlUint([0x42, 0x87], 2),
    ebmlUint([0x42, 0x85], 2),
  ]));

  const segInfo = ebmlEl([0x15, 0x49, 0xa9, 0x66], concatBytes([
    ebmlUint([0x2a, 0xd7, 0xb1], 1_000_000), // TimecodeScale = 1ms
    ebmlStr([0x4d, 0x80], 'MIA-WebCodecs'),
    ebmlStr([0x57, 0x41], 'MIA-WebCodecs'),
    ebmlFloat64([0x44, 0x89], Math.max(1, durationMs)),
  ]));

  const videoInfo = ebmlEl([0xe0], concatBytes([
    ebmlUint([0xb0], width),
    ebmlUint([0xba], height),
  ]));
  const trackEntry = ebmlEl([0xae], concatBytes([
    ebmlUint([0xd7], 1),
    ebmlUint([0x73, 0xc5], 1),
    ebmlUint([0x83], 1), // video
    ebmlStr([0x86], 'V_VP8'),
    videoInfo,
  ]));
  const tracks = ebmlEl([0x16, 0x54, 0xae, 0x6b], trackEntry);

  const clusters: Uint8Array[] = [];
  let clusterTimecode = 0;
  let clusterBlocks: Uint8Array[] = [];

  const flushCluster = () => {
    if (clusterBlocks.length === 0) return;
    clusters.push(ebmlEl([0x1f, 0x43, 0xb6, 0x75], concatBytes([
      ebmlUint([0xe7], clusterTimecode),
      ...clusterBlocks,
    ])));
    clusterBlocks = [];
  };

  for (const ch of chunks) {
    if (clusterBlocks.length === 0 || (ch.key && ch.timestampMs - clusterTimecode >= 2000) || (ch.timestampMs - clusterTimecode >= 30000)) {
      flushCluster();
      clusterTimecode = Math.max(0, Math.round(ch.timestampMs));
    }
    const relMs = Math.max(-32768, Math.min(32767, Math.round(ch.timestampMs - clusterTimecode)));
    const blockHeader = new Uint8Array([
      0x81, // track 1 VINT
      (relMs >> 8) & 0xff,
      relMs & 0xff,
      ch.key ? 0x80 : 0x00,
    ]);
    const simpleBlock = ebmlEl([0xa3], concatBytes([blockHeader, ch.data]));
    clusterBlocks.push(simpleBlock);
  }
  flushCluster();

  const segment = ebmlEl([0x18, 0x53, 0x80, 0x67], concatBytes([segInfo, tracks, ...clusters]));
  return new Blob([concatBytes([ebmlHeader, segment]) as unknown as BlobPart], { type: 'video/webm;codecs=vp8' });
}

/**
 * Hardware-accelerated WebCodecs VideoEncoder path (no 1x wall-clock wait).
 * Steps through [startTime, endTime] at targetFps and encodes exact 1:1 PTS frames.
 */
async function runWebCodecsCompression(
  file: File | Blob,
  maxWidth: number,
  targetFps: number,
  bitrate: number,
  maxDurationSec: number,
  range?: VideoRange,
  onProgress?: (pct: number) => void
): Promise<Blob | null> {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof VideoEncoder !== 'function' ||
    typeof VideoFrame !== 'function'
  ) {
    return null;
  }

  const tStart = performance.now();
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('metadata timeout')), 8000);
      video.onloadedmetadata = () => { clearTimeout(timer); resolve(); };
      video.onerror = () => { clearTimeout(timer); reject(new Error('video load error')); };
    });

    const nativeW = video.videoWidth || 640;
    const nativeH = video.videoHeight || 480;
    const rawDuration = video.duration || 0;
    const scale = nativeW > maxWidth ? maxWidth / nativeW : 1;
    let targetW = Math.round(nativeW * scale);
    let targetH = Math.round(nativeH * scale);
    targetW = targetW % 2 === 0 ? targetW : targetW - 1;
    targetH = targetH % 2 === 0 ? targetH : targetH - 1;
    if (targetW < 2 || targetH < 2) return null;

    const support = await VideoEncoder.isConfigSupported({
      codec: 'vp8',
      width: targetW,
      height: targetH,
      bitrate,
      framerate: targetFps,
    });
    if (!support.supported) return null;

    const startTime = Math.max(0, range?.startTime ?? 0);
    const requestedEnd = range?.endTime ?? Math.min(rawDuration, startTime + maxDurationSec);
    const endTime = Math.min(rawDuration > 0 ? rawDuration : requestedEnd, startTime + maxDurationSec, requestedEnd);
    const clipDurationSec = Math.max(0.5, endTime - startTime);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return null;

    const encodedChunks: Array<{ data: Uint8Array; timestampMs: number; key: boolean }> = [];
    let encoderError = false;
    const encoder = new VideoEncoder({
      output: (chunk) => {
        const buf = new Uint8Array(chunk.byteLength);
        chunk.copyTo(buf);
        encodedChunks.push({
          data: buf,
          timestampMs: chunk.timestamp / 1000,
          key: chunk.type === 'key',
        });
      },
      error: () => { encoderError = true; },
    });

    encoder.configure({
      codec: 'vp8',
      width: targetW,
      height: targetH,
      bitrate,
      framerate: targetFps,
    });

    const stepSec = 1.0 / targetFps;
    const totalSteps = Math.max(2, Math.floor(clipDurationSec * targetFps) + 1);
    for (let idx = 0; idx < totalSteps; idx++) {
      if (encoderError) break;
      const relSec = Math.min(clipDurationSec, idx * stepSec);
      const seekSec = Math.min(endTime, startTime + relSec);

      await new Promise<void>((resolve) => {
        if (Math.abs(video.currentTime - seekSec) < 0.008) {
          resolve();
          return;
        }
        const tSeek = setTimeout(() => { video.onseeked = null; resolve(); }, 1500);
        video.onseeked = () => { clearTimeout(tSeek); video.onseeked = null; resolve(); };
        video.currentTime = seekSec;
      });

      ctx.drawImage(video, 0, 0, targetW, targetH);
      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(relSec * 1_000_000),
        duration: Math.round(stepSec * 1_000_000),
      });
      encoder.encode(frame, { keyFrame: idx % Math.max(15, targetFps * 2) === 0 });
      frame.close();

      if (onProgress && idx % 5 === 0) {
        onProgress(Math.min(98, Math.max(1, Math.round((idx / totalSteps) * 100))));
      }
    }

    await encoder.flush();
    encoder.close();
    if (encoderError || encodedChunks.length < 2) return null;

    const webmBlob = buildWebmFromVp8Chunks(encodedChunks, targetW, targetH, clipDurationSec * 1000);
    const compressSec = Number(((performance.now() - tStart) / 1000).toFixed(3));
    (webmBlob as any).__speedFactor = 1.0;
    (webmBlob as any).__expectedDurationSec = clipDurationSec;
    (webmBlob as any).__compressDurationSec = compressSec;
    (webmBlob as any).__trimmedClientSide = true;
    console.info(`[Compressor WebCodecs] ${encodedChunks.length} frames @ ${targetFps}fps en ${compressSec}s -> ${(webmBlob.size / (1024 * 1024)).toFixed(2)} MB`);
    return webmBlob;
  } catch {
    return null;
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Internal single-pass Canvas + MediaRecorder compressor (fallback).
 */
function runCanvasCompression(
  file: File | Blob,
  maxWidth: number,
  targetFps: number,
  bitrate: number,
  maxDurationSec: number,
  range?: VideoRange,
  onProgress?: (pct: number) => void
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

    // Dynamic timeout proportional to clip duration (with 6s initial stall guard)
    let timeoutTimer: ReturnType<typeof setTimeout>;
    let stallTimer: ReturnType<typeof setInterval> | null = null;
    const origCleanup = cleanup;
    const fullCleanup = () => {
      if (stallTimer) {
        clearInterval(stallTimer);
        stallTimer = null;
      }
      origCleanup();
    };

    const setSafetyTimeout = (ms: number) => {
      clearTimeout(timeoutTimer);
      timeoutTimer = setTimeout(() => {
        fullCleanup();
        resolve(null);
      }, ms);
    };

    // Initial metadata load timeout (15s for large 4K60 MOVs)
    timeoutTimer = setTimeout(() => {
      fullCleanup();
      resolve(null);
    }, 15_000);

    video.onerror = () => {
      clearTimeout(timeoutTimer);
      fullCleanup();
      resolve(null);
    };

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration;
        if (!duration || !isFinite(duration) || duration <= 0) {
          clearTimeout(timeoutTimer);
          fullCleanup();
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

        const clipDurationSec = Math.max(1, endTime - startTime);
        setSafetyTimeout(Math.max(20_000, Math.ceil(clipDurationSec * 1500) + 15_000));

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
          fullCleanup();
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

        const speedFactor = 1.0;
        const stream = canvas.captureStream(Math.min(30, Math.max(15, targetFps)));
        let recorder: MediaRecorder;
        try {
          recorder = chosenMime
            ? new MediaRecorder(stream, { mimeType: chosenMime, videoBitsPerSecond: bitrate })
            : new MediaRecorder(stream, { videoBitsPerSecond: bitrate });
        } catch {
          clearTimeout(timeoutTimer);
          fullCleanup();
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
          fullCleanup();
          if (recordedChunks.length > 0) {
            const finalMime = recorder.mimeType || chosenMime || 'video/webm';
            const compressedBlob = new Blob(recordedChunks, { type: finalMime });

            const origMb = (file.size / (1024 * 1024)).toFixed(2);
            const compMb = (compressedBlob.size / (1024 * 1024)).toFixed(2);
            const savingPct = Math.max(0, Math.round((1 - compressedBlob.size / file.size) * 100));
            console.info(`[Compressor] Original: ${origMb} MB -> Comprimido: ${compMb} MB (${savingPct}% ahorro, ${speedFactor}x) | Rango: ${startTime.toFixed(1)}s -> ${endTime.toFixed(1)}s`);

            (compressedBlob as any).__speedFactor = 1.0;
            (compressedBlob as any).__expectedDurationSec = clipDurationSec;
            (compressedBlob as any).__trimmedClientSide = true;
            resolve(compressedBlob);
          } else {
            resolve(null);
          }
        };

        // Start recording routine
        const startRecording = () => {
          if (cleanupDone || recorder.state === 'recording') return;
          recorder.start(100);

          let lastVideoTime = video.currentTime;
          let lastProgressAt = performance.now();
          stallTimer = setInterval(() => {
            if (cleanupDone) return;
            if (Math.abs(video.currentTime - lastVideoTime) > 0.01) {
              lastVideoTime = video.currentTime;
              lastProgressAt = performance.now();
              if (onProgress && clipDurationSec > 0) {
                const pct = Math.min(99, Math.max(1, Math.round(((video.currentTime - startTime) / clipDurationSec) * 100)));
                onProgress(pct);
              }
            } else if (performance.now() - lastProgressAt > 12_000) {
              clearTimeout(timeoutTimer);
              fullCleanup();
              resolve(null);
            }
          }, 1000);

          const effectiveFps = targetFps * speedFactor;
          const frameIntervalMs = 1000 / effectiveFps;
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

          video.playbackRate = speedFactor;
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
        fullCleanup();
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
    maxWidth = 420,
    targetFps = 15,
    bitrate = 600_000,
    maxDurationSec = 40.0,
    range,
    onProgress
  } = options;

  // Fallback for non-browser / test / SSR environments
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
    return file;
  }

  // Direct bypass if file is within safe upload limit (<= 25 MB): Python/PyAV on GPU trims and decodes natively
  if (file.size <= 25 * 1024 * 1024) {
    console.info(`[Compressor] Bypass: archivo dentro de límite seguro (${(file.size / (1024 * 1024)).toFixed(1)} MB). Envío directo a GPU.`);
    return file;
  }

/**
 * Zero-seek sequential MP4Box + WebCodecs (VideoDecoder -> 15fps -> VideoEncoder H.264 -> mp4-muxer)
 * with a strict 10-second watchdog. Aborts cleanly if codec (e.g. HEVC) is unsupported or slow.
 */
async function runMp4BoxWebCodecsCompression(
  file: File | Blob,
  maxWidth: number,
  targetFps: number,
  bitrate: number,
  maxDurationSec: number,
  range?: VideoRange,
  onProgress?: (pct: number) => void,
  watchdogMs: number = 10_000
): Promise<Blob | null> {
  if (
    typeof window === 'undefined' ||
    typeof VideoDecoder !== 'function' ||
    typeof VideoEncoder !== 'function' ||
    typeof VideoFrame !== 'function'
  ) {
    return null;
  }

  const tStart = performance.now();
  let aborted = false;
  let decoder: VideoDecoder | null = null;
  let encoder: VideoEncoder | null = null;
  let watchdogTimer: ReturnType<typeof setTimeout> | null = null;

  const cleanupCodecs = () => {
    if (watchdogTimer) { clearTimeout(watchdogTimer); watchdogTimer = null; }
    try { if (decoder && decoder.state !== 'closed') decoder.close(); } catch {}
    try { if (encoder && encoder.state !== 'closed') encoder.close(); } catch {}
  };

  try {
    const workPromise = (async (): Promise<Blob | null> => {
      const startTime = Math.max(0, range?.startTime ?? 0);
      const endTime = Math.max(startTime + 0.5, range?.endTime ?? (startTime + maxDurationSec));
      const clipDurationSec = Math.min(maxDurationSec, endTime - startTime);
      const clampedEnd = startTime + clipDurationSec;

      const mp4boxfile = (MP4Box as any).createFile();
      let videoTrack: any = null;
      let description: Uint8Array | undefined;

      const readyTrack = await new Promise<any>((resolve) => {
        mp4boxfile.onReady = (info: any) => {
          const vt = info?.videoTracks?.[0];
          resolve(vt || null);
        };
        mp4boxfile.onError = () => resolve(null);

        // Read first 4 MB to parse moov/track metadata
        const headSlice = file.slice(0, Math.min(file.size, 4 * 1024 * 1024));
        headSlice.arrayBuffer().then((buf) => {
          if (aborted) return;
          (buf as any).fileStart = 0;
          mp4boxfile.appendBuffer(buf);
          // If moov is at the end of file, read tail 4 MB
          if (!videoTrack && file.size > 4 * 1024 * 1024) {
            const tailStart = Math.max(4 * 1024 * 1024, file.size - 4 * 1024 * 1024);
            file.slice(tailStart).arrayBuffer().then((tbuf) => {
              if (aborted) return;
              (tbuf as any).fileStart = tailStart;
              mp4boxfile.appendBuffer(tbuf);
            }).catch(() => resolve(null));
          }
        }).catch(() => resolve(null));
        setTimeout(() => resolve(null), 2500);
      });

      videoTrack = readyTrack;
      if (!videoTrack || aborted) return null;

      // Extract avcC / hvcC description box if available
      try {
        const trak = mp4boxfile.getTrackById(videoTrack.id);
        for (const entry of trak?.mdia?.minf?.stbl?.stsd?.entries || []) {
          const box = entry.avcC || entry.hvcC || entry.vpcC;
          if (box && (MP4Box as any).DataStream) {
            const ds = new (MP4Box as any).DataStream(undefined, 0, (MP4Box as any).DataStream.BIG_ENDIAN);
            box.write(ds);
            description = new Uint8Array(ds.buffer, 8);
            break;
          }
        }
      } catch {}

      const decConfig: VideoDecoderConfig = {
        codec: videoTrack.codec,
        codedWidth: videoTrack.video?.width,
        codedHeight: videoTrack.video?.height,
        description,
      };
      const decSupport = await VideoDecoder.isConfigSupported(decConfig);
      if (!decSupport.supported || aborted) return null;

      const nativeW = videoTrack.video?.width || 640;
      const nativeH = videoTrack.video?.height || 480;
      const scale = nativeW > maxWidth ? maxWidth / nativeW : 1;
      let targetW = Math.round(nativeW * scale);
      let targetH = Math.round(nativeH * scale);
      targetW = targetW % 2 === 0 ? targetW : targetW - 1;
      targetH = targetH % 2 === 0 ? targetH : targetH - 1;
      if (targetW < 2 || targetH < 2) return null;

      const encConfig: VideoEncoderConfig = {
        codec: 'avc1.42001f',
        width: targetW,
        height: targetH,
        bitrate,
        framerate: targetFps,
      };
      const encSupport = await VideoEncoder.isConfigSupported(encConfig);
      if (!encSupport.supported || aborted) return null;

      const muxer = new Mp4Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'avc', width: targetW, height: targetH },
        fastStart: 'in-memory',
      });

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return null;

      let encodedCount = 0;
      let nextSampleTargetUs = 0;
      const stepUs = Math.round(1_000_000 / targetFps);
      const startUs = Math.round(startTime * 1_000_000);
      const endUs = Math.round(clampedEnd * 1_000_000);

      encoder = new VideoEncoder({
        output: (chunk, meta) => {
          muxer.addVideoChunk(chunk, meta);
          encodedCount++;
        },
        error: () => { aborted = true; },
      });
      encoder.configure(encConfig);

      decoder = new VideoDecoder({
        output: (frame) => {
          try {
            if (aborted) { frame.close(); return; }
            const tsUs = frame.timestamp;
            if (tsUs >= startUs && tsUs <= endUs) {
              const relUs = tsUs - startUs;
              if (relUs >= nextSampleTargetUs) {
                ctx.drawImage(frame, 0, 0, targetW, targetH);
                const outFrame = new VideoFrame(canvas, {
                  timestamp: nextSampleTargetUs,
                  duration: stepUs,
                });
                encoder?.encode(outFrame, { keyFrame: encodedCount % (targetFps * 2) === 0 });
                outFrame.close();
                nextSampleTargetUs += stepUs;
                if (onProgress && clipDurationSec > 0) {
                  const pct = Math.min(98, Math.max(5, Math.round((relUs / (clipDurationSec * 1_000_000)) * 100)));
                  onProgress(pct);
                }
              }
            }
          } finally {
            frame.close();
          }
        },
        error: () => { aborted = true; },
      });
      decoder.configure(decConfig);

      await new Promise<void>((resolve) => {
        mp4boxfile.onSamples = (_id: number, _user: any, samples: any[]) => {
          if (aborted) { resolve(); return; }
          for (const s of samples) {
            const sTsUs = Math.round((s.cts / s.timescale) * 1_000_000);
            if (sTsUs > endUs + 500_000) break;
            if (sTsUs >= Math.max(0, startUs - 2_000_000)) {
              try {
                decoder?.decode(new EncodedVideoChunk({
                  type: s.is_sync ? 'key' : 'delta',
                  timestamp: sTsUs,
                  duration: Math.round((s.duration / s.timescale) * 1_000_000),
                  data: s.data,
                }));
              } catch {}
            }
          }
        };
        mp4boxfile.setExtractionOptions(videoTrack.id, null, { nbSamples: 60 });
        mp4boxfile.start();

        // Stream 4 MB chunks sequentially
        (async () => {
          const chunkSize = 4 * 1024 * 1024;
          for (let off = 0; off < file.size && !aborted; off += chunkSize) {
            const slice = file.slice(off, Math.min(file.size, off + chunkSize));
            const buf = await slice.arrayBuffer();
            if (aborted) break;
            (buf as any).fileStart = off;
            mp4boxfile.appendBuffer(buf);
          }
          mp4boxfile.flush();
          resolve();
        })().catch(() => resolve());
      });

      if (aborted) return null;
      await decoder.flush();
      await encoder.flush();
      muxer.finalize();

      if (encodedCount < 2) return null;
      const outBuf = (muxer.target as ArrayBufferTarget).buffer;
      const outBlob = new Blob([outBuf], { type: 'video/mp4' });
      const compressSec = Number(((performance.now() - tStart) / 1000).toFixed(3));
      (outBlob as any).__speedFactor = 1.0;
      (outBlob as any).__expectedDurationSec = clipDurationSec;
      (outBlob as any).__compressDurationSec = compressSec;
      (outBlob as any).__trimmedClientSide = true;
      console.info(`[Compressor MP4Box+WebCodecs] ${encodedCount} frames @ ${targetFps}fps en ${compressSec}s -> ${(outBlob.size / (1024 * 1024)).toFixed(2)} MB`);
      return outBlob;
    })();

    const watchdogPromise = new Promise<null>((resolve) => {
      watchdogTimer = setTimeout(() => {
        aborted = true;
        console.warn(`[Compressor Watchdog] Superados ${watchdogMs / 1000}s; abortando compresión local y usando subida directa con recorte en servidor.`);
        resolve(null);
      }, watchdogMs);
    });

    return await Promise.race([workPromise, watchdogPromise]);
  } catch {
    return null;
  } finally {
    aborted = true;
    cleanupCodecs();
  }
}

  // 1. Fast Sequential MP4Box + WebCodecs Pass (duration + 15s watchdog; no <video> seek loops)
  const tCompressStart = performance.now();
  const clipDurEst = range ? Math.max(1.0, range.endTime - range.startTime) : maxDurationSec;
  const dynamicWatchdogMs = Math.max(15_000, Math.round((clipDurEst + 15.0) * 1000));
  let compressedBlob = await runMp4BoxWebCodecsCompression(file, maxWidth, targetFps, bitrate, maxDurationSec, range, onProgress, dynamicWatchdogMs);
  if (!compressedBlob) {
    // Smooth continuous MediaRecorder fallback (never upload 238 MB raw 4K over 4G/5G)
    console.info('[Compressor] MP4Box+WebCodecs no disponible para este códec; usando compresión continua MediaRecorder 480p@15fps.');
    compressedBlob = await runCanvasCompression(file, maxWidth, targetFps, bitrate, maxDurationSec, range, onProgress);
  }

  // 2. Emergency Secondary Pass (360p / 12 FPS / 500 kbps) if result still > 15 MB
  const maxSafeSizeBytes = 15 * 1024 * 1024;
  if ((!compressedBlob || compressedBlob.size > maxSafeSizeBytes) && file.size > maxSafeSizeBytes) {
    const emergencyBlob = await runCanvasCompression(file, 360, 12, 500_000, maxDurationSec, range, onProgress);
    if (emergencyBlob) {
      compressedBlob = emergencyBlob;
    }
  }

  if (compressedBlob && !(compressedBlob as any).__compressDurationSec) {
    (compressedBlob as any).__compressDurationSec = Number(((performance.now() - tCompressStart) / 1000).toFixed(3));
  }

  return compressedBlob || file;
}

/**
 * Pure helper to clamp player seek/playback strictly inside [trimStart, trimEnd].
 */
export function clampPlayerTimeToTrim(
  targetTime: number,
  trimStart: number,
  trimEnd: number,
  enforceBounds: boolean = true
): number {
  if (!enforceBounds || trimEnd <= trimStart) {
    return Math.max(0, targetTime);
  }
  return Math.max(trimStart, Math.min(trimEnd - 0.02, targetTime));
}

/**
 * Pure helper for sliding-window trim range calculation (mouse & touch).
 * Preserves window duration `span` within [0, totalDuration] up to `maxWindowSec`.
 */
export function computeSlidingTrimWindow(
  anchorSec: number,
  spanSec: number,
  totalDuration: number,
  maxWindowSec: number = 40.0
): { start: number; end: number } {
  const safeTotal = Math.max(0.5, totalDuration);
  const clampedSpan = Math.max(0.5, Math.min(spanSec, maxWindowSec, safeTotal));
  const rawStart = Math.max(0, Math.min(safeTotal - clampedSpan, anchorSec));
  const start = Math.round(rawStart * 10) / 10;
  const end = Math.min(safeTotal, Math.round((start + clampedSpan) * 10) / 10);
  return { start, end };
}

/**
 * Encapsulated trim + compression entry point.
 * Keeps a clean seam to plug in a native Capacitor MediaCodec / AVAssetExportSession
 * trimmer later without modifying callers.
 */
export async function trimAndCompressVideo(
  file: File,
  startSec: number,
  endSec: number,
  options: Omit<VideoCompressionOptions, 'range'> = {}
): Promise<Blob> {
  return prepareVideoForAnalysis(file, {
    ...options,
    maxDurationSec: options.maxDurationSec ?? 40.0,
    range: { startTime: Math.max(0, startSec), endTime: Math.max(startSec + 0.5, endSec) },
  });
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
