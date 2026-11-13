import { describe, it, expect } from 'vitest';
import {
  calculateMedian,
  euclideanDistance2D,
  calculateAngleDegrees,
  buildSamplingTimeline,
  computeAthleteRoi,
  remapPointFromRoi,
  determineDominantSide,
  extractUnilateralJoints,
  interpolateLowVisibilityLandmarks,
  zeroPhaseSmooth,
  smoothJointsTrajectoryZeroPhase,
  detectRepetitionsFromAngleSignal,
  assignRepetitionPhasesAndCounts,
  drawKinematicFrameOverlay,
  Point,
  JointName,
  MP_POSE_LANDMARKS,
  ProcessedKinematicFrame
} from '../utils/kinematicPipeline';

describe('kinematicPipeline - Pipeline Refactorizado para Alta Velocidad y Precisión', () => {
  describe('Matemática Básica y Funciones Puras', () => {
    it('calcula la mediana correctamente', () => {
      expect(calculateMedian([10, 20, 30])).toBe(20);
      expect(calculateMedian([50, 10, 30, 20])).toBe(25);
      expect(calculateMedian([])).toBe(0);
    });

    it('calcula la distancia euclidiana en 2D', () => {
      expect(euclideanDistance2D({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });

    it('calcula ángulos articulares en grados de forma exacta', () => {
      const a: Point = { x: 0, y: 10 };
      const b: Point = { x: 0, y: 0 };
      const c: Point = { x: 10, y: 0 };
      expect(Math.round(calculateAngleDegrees(a, b, c))).toBe(90);
    });
  });

  describe('Bug 1: Configuración del Modelo y Muestreo Rápido', () => {
    it('omite los primeros 2 segundos muertos y muestrea hasta la ventana máxima', () => {
      const timeline = buildSamplingTimeline(30.0, {
        startOffsetSec: 2.0,
        maxAnalysisDurationSec: 20.0,
        targetSampleFps: 15
      });

      expect(timeline.startTimeSec).toBe(2.0);
      expect(timeline.endTimeSec).toBe(22.0);
      expect(timeline.durationSec).toBe(20.0);
      expect(timeline.stepSec).toBeCloseTo(1 / 15, 4);
      expect(timeline.timestampsSec.length).toBeGreaterThanOrEqual(299);
    });

    it('soporta ventana fallback de 12 FPS y 12 segundos', () => {
      const fallbackTimeline = buildSamplingTimeline(45.0, {
        startOffsetSec: 2.0,
        maxAnalysisDurationSec: 12.0,
        targetSampleFps: 12
      });

      expect(fallbackTimeline.durationSec).toBe(12.0);
      expect(fallbackTimeline.stepSec).toBeCloseTo(1 / 12, 4);
      expect(fallbackTimeline.timestampsSec.length).toBeLessThanOrEqual(145);
    });
  });

  describe('Bug 2: Eliminación de Deformación Ósea, Interpolación y Suavizado de Fase Cero', () => {
    it('interpola linealmente articulaciones con baja visibilidad (< 0.5)', () => {
      const frames: Array<Record<JointName, Point>> = [
        // Frame 0: visible en x = 100, y = 200
        {
          shoulder: { x: 100, y: 200, visibility: 0.9 },
          elbow: { x: 100, y: 300, visibility: 0.9 },
          wrist: { x: 100, y: 400, visibility: 0.9 },
          hip: { x: 50, y: 200, visibility: 0.9 },
          knee: { x: 50, y: 300, visibility: 0.9 },
          ankle: { x: 50, y: 400, visibility: 0.9 }
        },
        // Frame 1: ocluido (visibilidad 0.1)
        {
          shoulder: { x: 0, y: 0, visibility: 0.1 },
          elbow: { x: 100, y: 305, visibility: 0.9 },
          wrist: { x: 100, y: 405, visibility: 0.9 },
          hip: { x: 50, y: 200, visibility: 0.9 },
          knee: { x: 50, y: 300, visibility: 0.9 },
          ankle: { x: 50, y: 400, visibility: 0.9 }
        },
        // Frame 2: visible de nuevo en x = 120, y = 220
        {
          shoulder: { x: 120, y: 220, visibility: 0.95 },
          elbow: { x: 100, y: 310, visibility: 0.9 },
          wrist: { x: 100, y: 410, visibility: 0.9 },
          hip: { x: 50, y: 200, visibility: 0.9 },
          knee: { x: 50, y: 300, visibility: 0.9 },
          ankle: { x: 50, y: 400, visibility: 0.9 }
        }
      ];

      const interpolated = interpolateLowVisibilityLandmarks(frames, 0.5);

      // Frame 1 debe ser exactamente el promedio entre Frame 0 y Frame 2 (x = 110, y = 210)
      expect(interpolated[1].shoulder.x).toBeCloseTo(110, 2);
      expect(interpolated[1].shoulder.y).toBeCloseTo(210, 2);
      expect(interpolated[1].shoulder.visibility).toBeGreaterThan(0.5);
    });

    it('zeroPhaseSmooth elimina el ruido de alta frecuencia sin desfase temporal', () => {
      // Señal constante con ruido alternado +/- 5
      const noisySignal = [100, 105, 95, 104, 96, 105, 95, 100];
      const smoothed = zeroPhaseSmooth(noisySignal, 0.4);

      expect(smoothed.length).toBe(noisySignal.length);
      // El pico o centro debe mantenerse centrado cerca de 100 sin retraso
      for (const val of smoothed) {
        expect(val).toBeGreaterThan(97);
        expect(val).toBeLessThan(103);
      }
    });

    it('smoothJointsTrajectoryZeroPhase procesa la trayectoria completa de articulaciones', () => {
      const frames: Array<Record<JointName, Point>> = Array.from({ length: 10 }, (_, i) => ({
        shoulder: { x: 100 + (i % 2 === 0 ? 3 : -3), y: 200 },
        elbow: { x: 100, y: 300 },
        wrist: { x: 100, y: 400 },
        hip: { x: 50, y: 200 },
        knee: { x: 50, y: 300 },
        ankle: { x: 50, y: 400 }
      }));

      const smoothed = smoothJointsTrajectoryZeroPhase(frames, 0.35);
      expect(smoothed.length).toBe(10);
      expect(smoothed[4].shoulder.x).toBeCloseTo(100, 0);
    });
  });

  describe('Bug 3: Detector de Repeticiones por Picos y Valles sobre Array Completo', () => {
    it('detecta repeticiones con bajada >= 25° y subida >= 20° y separación >= 12 frames', () => {
      // Simular un ejercicio de 45 frames con 2 repeticiones claras:
      // Rep 1: Inicia en 160°, baja a 85° (drop = 75°), sube a 155° (rise = 70°)
      // Rep 2: Inicia en 155°, baja a 80° (drop = 75°), sube a 160° (rise = 80°)
      const angles: number[] = [
        // Lockout inicial
        160, 160, 160,
        // Rep 1 excéntrica
        150, 135, 115, 100, 90, 85, // Valle 1 en índice 8
        // Rep 1 concéntrica
        95, 110, 130, 145, 155,
        // Lockout intermedio
        155, 155, 155, 155,
        // Rep 2 excéntrica
        140, 120, 100, 85, 80, // Valle 2 en índice 21
        // Rep 2 concéntrica
        90, 105, 125, 145, 160,
        // Lockout final
        160, 160, 160
      ];

      const reps = detectRepetitionsFromAngleSignal(angles, 25, 20, 12);

      expect(reps.length).toBe(2);
      expect(reps[0].repNumber).toBe(1);
      expect(reps[0].bottomAngle).toBe(85);
      expect(reps[0].bottomIndex).toBe(8);
      expect(reps[0].romDeg).toBeGreaterThanOrEqual(70);

      expect(reps[1].repNumber).toBe(2);
      expect(reps[1].bottomAngle).toBe(80);
      expect(reps[1].bottomIndex).toBe(22);
    });

    it('ignora oscilaciones espurias menores de 25 grados', () => {
      // Pequeño balanceo de 10°
      const noisyHolding = [150, 145, 140, 145, 150, 148, 142, 148, 150];
      const reps = detectRepetitionsFromAngleSignal(noisyHolding, 25, 20, 12);
      expect(reps.length).toBe(0);
    });

    it('asigna fases y repCount acumulativo asegurando que el contador nunca quede en 0', () => {
      const angles = [
        160, 150, 130, 90, // rep 1 excéntrica hasta fondo en 3
        110, 130, 160,     // rep 1 concéntrica hasta 6
        160, 140, 85,      // rep 2 excéntrica hasta fondo en 9
        110, 140, 160      // rep 2 concéntrica hasta 12
      ];

      const reps = detectRepetitionsFromAngleSignal(angles, 25, 20, 5); // separación 5 para este test corto
      expect(reps.length).toBe(2);

      const assignments = assignRepetitionPhasesAndCounts(angles.length, reps);
      expect(assignments.length).toBe(angles.length);

      // En el fondo de la primera repetición, la fase debe ser 'Fondo' y repCount = 1
      expect(assignments[3].phase).toBe('Fondo');
      expect(assignments[3].repCount).toBe(1);

      // En la fase concéntrica de rep 1
      expect(assignments[4].phase).toBe('Concéntrica');
      expect(assignments[4].repCount).toBe(1);

      // En el fondo de rep 2, repCount = 2
      expect(assignments[9].phase).toBe('Fondo');
      expect(assignments[9].repCount).toBe(2);
    });
  });

  describe('Bug 4: Renderizado Limpio en Canvas y Offsets Anti-Solapamiento', () => {
    it('dibuja sin errores con líneas de 3px y panel HUD', () => {
      // Mock de CanvasRenderingContext2D
      const calls: string[] = [];
      const mockCtx = {
        save: () => calls.push('save'),
        restore: () => calls.push('restore'),
        beginPath: () => calls.push('beginPath'),
        moveTo: () => calls.push('moveTo'),
        lineTo: () => calls.push('lineTo'),
        arc: () => calls.push('arc'),
        fill: () => calls.push('fill'),
        stroke: () => calls.push('stroke'),
        roundRect: () => calls.push('roundRect'),
        measureText: () => ({ width: 40 }),
        fillText: () => calls.push('fillText'),
        strokeStyle: '',
        fillStyle: '',
        lineWidth: 0,
        font: '',
        textAlign: '',
        textBaseline: ''
      } as unknown as CanvasRenderingContext2D;

      const dummyFrame: ProcessedKinematicFrame = {
        frameIndex: 0,
        timestampSec: 2.0,
        lockedSide: 'right',
        joints: {
          shoulder: { x: 100, y: 100 },
          elbow: { x: 100, y: 180 },
          wrist: { x: 100, y: 260 },
          hip: { x: 120, y: 300 },
          knee: { x: 120, y: 420 },
          ankle: { x: 120, y: 540 }
        },
        normalizedJoints: {
          shoulder: { x: 0.1, y: 0.1 },
          elbow: { x: 0.1, y: 0.18 },
          wrist: { x: 0.1, y: 0.26 },
          hip: { x: 0.12, y: 0.3 },
          knee: { x: 0.12, y: 0.42 },
          ankle: { x: 0.12, y: 0.54 }
        },
        rawJointsPx: {
          shoulder: { x: 100, y: 100 },
          elbow: { x: 100, y: 180 },
          wrist: { x: 100, y: 260 },
          hip: { x: 120, y: 300 },
          knee: { x: 120, y: 420 },
          ankle: { x: 120, y: 540 }
        },
        anglesDeg: {
          elbow: 90,
          knee: 88,
          shoulder: 45,
          hip: 120
        },
        mainAngle: 88,
        phase: 'Fondo',
        repCount: 1,
        roi: {
          minX: 0, minY: 0, maxX: 1, maxY: 1, width: 1, height: 1,
          pixelRect: { x: 0, y: 0, width: 640, height: 480 }
        },
        visibility: { shoulder: 1, elbow: 1, wrist: 1, hip: 1, knee: 1, ankle: 1 }
      };

      drawKinematicFrameOverlay(mockCtx, dummyFrame, 640, 480, { showAnglesInCorner: true });
      expect(calls).toContain('save');
      expect(calls).toContain('restore');
      expect(calls).toContain('roundRect'); // Panel HUD en esquina
    });
  });

  describe('Regla 2 & 3: ROI Crop y Bloqueo Unilateral', () => {
    it('agrega un margen de 25% por lado en el bounding box', () => {
      const landmarks: Point[] = [
        { x: 0.4, y: 0.2, visibility: 0.9 },
        { x: 0.6, y: 0.8, visibility: 0.9 }
      ];
      const roi = computeAthleteRoi(landmarks, 1000, 1000, 0.25);
      expect(roi.minX).toBeCloseTo(0.35, 3);
      expect(roi.maxX).toBeCloseTo(0.65, 3);
      expect(roi.minY).toBeCloseTo(0.05, 3);
      expect(roi.maxY).toBeCloseTo(0.95, 3);
    });

    it('selecciona el lado con mayor visibilidad en primeros 15 frames', () => {
      const frames: Point[][] = [];
      for (let i = 0; i < 15; i++) {
        const frameLms: Point[] = Array(33).fill({ x: 0, y: 0, visibility: 0 });
        [12, 14, 16, 24, 26, 28].forEach(idx => {
          frameLms[idx] = { x: 0.5, y: 0.5, visibility: 0.9 };
        });
        [11, 13, 15, 23, 25, 27].forEach(idx => {
          frameLms[idx] = { x: 0.3, y: 0.3, visibility: 0.2 };
        });
        frames.push(frameLms);
      }
      expect(determineDominantSide(frames)).toBe('right');
    });
  });
});
