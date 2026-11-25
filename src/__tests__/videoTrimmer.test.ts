import { describe, it, expect } from 'vitest';
import { computeSlidingTrimWindow, clampPlayerTimeToTrim } from '../utils/videoCompressor';
import { MAX_ANALYSIS_CLIP_SECONDS } from '../components/VideoPoseAnalysisModal';

describe('40s Sliding-Window Video Trimmer', () => {
  it('sets MAX_ANALYSIS_CLIP_SECONDS to 40s', () => {
    expect(MAX_ANALYSIS_CLIP_SECONDS).toBe(40.0);
  });

  it('slides window across a 75s video while preserving exact span', () => {
    const { start, end } = computeSlidingTrimWindow(12.34, 25.0, 75.0, MAX_ANALYSIS_CLIP_SECONDS);
    expect(start).toBe(12.3);
    expect(end).toBe(37.3);
    expect(end - start).toBeCloseTo(25.0, 1);
  });

  it('clamps sliding window at video boundaries without shrinking span', () => {
    const atStart = computeSlidingTrimWindow(-5.0, 35.0, 60.0, MAX_ANALYSIS_CLIP_SECONDS);
    expect(atStart).toEqual({ start: 0, end: 35.0 });

    const atEnd = computeSlidingTrimWindow(50.0, 35.0, 60.0, MAX_ANALYSIS_CLIP_SECONDS);
    expect(atEnd).toEqual({ start: 25.0, end: 60.0 });
  });

  it('caps span at MAX_ANALYSIS_CLIP_SECONDS (40s)', () => {
    const capped = computeSlidingTrimWindow(10.0, 55.0, 90.0, MAX_ANALYSIS_CLIP_SECONDS);
    expect(capped.end - capped.start).toBe(40.0);
  });

  it('strictly bounds result player inside [startSec, endSec] without seeking outside trim', () => {
    expect(clampPlayerTimeToTrim(3.0, 10.0, 28.0, true)).toBe(10.0);
    expect(clampPlayerTimeToTrim(35.0, 10.0, 28.0, true)).toBeCloseTo(27.98, 2);
    expect(clampPlayerTimeToTrim(16.4, 10.0, 28.0, true)).toBe(16.4);
  });
});
