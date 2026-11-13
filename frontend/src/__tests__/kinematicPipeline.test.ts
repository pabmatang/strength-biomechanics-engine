import { describe, it, expect } from 'vitest';
import {
  calculateMedian,
  euclideanDistance2D,
  enforceBoneLength,
  calculateAngleDegrees,
  buildSamplingTimeline,
  computeAthleteRoi,
  remapPointFromRoi,
  determineDominantSide,
  extractUnilateralJoints,
  calibrateBoneLengthsPx,
  applyKinematicBoneLocking,
  Point,
  JointName,
  MP_POSE_LANDMARKS
} from '../utils/kinematicPipeline';

describe('kinematicPipeline - Reglas Técnicas y Cinemática Pura', () => {
  describe('Matemática Básica y Medianas', () => {
    it('calcula la mediana correctamente para arrays impares y pares', () => {
      expect(calculateMedian([10, 20, 30])).toBe(20);
      expect(calculateMedian([50, 10, 30, 20])).toBe(25);
      expect(calculateMedian([100])).toBe(100);
      expect(calculateMedian([])).toBe(0);
    });

    it('calcula la distancia euclidiana en 2D', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 3, y: 4 };
      expect(euclideanDistance2D(p1, p2)).toBe(5);
    });

    it('calcula ángulos articulares en grados de forma exacta', () => {
      // Ángulo recto de 90 grados
      const a: Point = { x: 0, y: 10 };
      const b: Point = { x: 0, y: 0 };
      const c: Point = { x: 10, y: 0 };
      const angle90 = calculateAngleDegrees(a, b, c);
      expect(Math.round(angle90)).toBe(90);

      // 180 grados (línea recta)
      const straightA: Point = { x: 0, y: -10 };
      const straightB: Point = { x: 0, y: 0 };
      const straightC: Point = { x: 0, y: 10 };
      expect(Math.round(calculateAngleDegrees(straightA, straightB, straightC))).toBe(180);
    });
  });

  describe('Regla 1: Configuración del Muestreo Temporal (Offset 2s, max 20s, 15 FPS)', () => {
    it('omite los primeros 2 segundos muertos y muestrea a 15 FPS hasta 20s', () => {
      const videoDuration = 45.0; // vídeo de 45 segundos
      const timeline = buildSamplingTimeline(videoDuration, {
        startOffsetSec: 2.0,
        maxAnalysisDurationSec: 20.0,
        targetSampleFps: 15
      });

      expect(timeline.startTimeSec).toBe(2.0);
      expect(timeline.endTimeSec).toBe(22.0); // 2.0 + 20.0
      expect(timeline.durationSec).toBe(20.0);
      expect(timeline.stepSec).toBeCloseTo(1 / 15, 4);

      // Aproximadamente 300 fotogramas (20s * 15 FPS)
      expect(timeline.timestampsSec.length).toBeGreaterThanOrEqual(299);
      expect(timeline.timestampsSec.length).toBeLessThanOrEqual(301);
      expect(timeline.timestampsSec[0]).toBe(2.0);
    });

    it('gestiona vídeos cortos menores de 2 segundos adecuadamente', () => {
      const shortVideo = 1.5;
      const timeline = buildSamplingTimeline(shortVideo);
      expect(timeline.startTimeSec).toBeLessThan(1.5);
      expect(timeline.endTimeSec).toBe(1.5);
      expect(timeline.timestampsSec.length).toBeGreaterThan(0);
    });
  });

  describe('Regla 2: Recorte Dinámico (ROI Crop con 25% de margen)', () => {
    it('calcula el bounding box del atleta añadiendo un margen del 25% por lado', () => {
      const videoWidth = 1920;
      const videoHeight = 1080;

      // Atleta centrado entre x: 0.4 - 0.6 (ancho 0.2), y: 0.2 - 0.8 (alto 0.6)
      const landmarks: Point[] = [
        { x: 0.4, y: 0.2, visibility: 0.9 },
        { x: 0.6, y: 0.8, visibility: 0.9 }
      ];

      const roi = computeAthleteRoi(landmarks, videoWidth, videoHeight, 0.25);

      // Margen ancho: 0.2 * 0.25 = 0.05 -> minX: 0.35, maxX: 0.65
      expect(roi.minX).toBeCloseTo(0.35, 3);
      expect(roi.maxX).toBeCloseTo(0.65, 3);

      // Margen alto: 0.6 * 0.25 = 0.15 -> minY: 0.05, maxY: 0.95
      expect(roi.minY).toBeCloseTo(0.05, 3);
      expect(roi.maxY).toBeCloseTo(0.95, 3);

      expect(roi.pixelRect.x).toBe(Math.round(0.35 * videoWidth));
      expect(roi.pixelRect.y).toBe(Math.round(0.05 * videoHeight));
    });

    it('reconvierte coordenadas normalizadas del ROI al sistema global del vídeo', () => {
      const videoWidth = 1000;
      const videoHeight = 1000;

      const landmarks: Point[] = [
        { x: 0.2, y: 0.2, visibility: 0.95 },
        { x: 0.6, y: 0.6, visibility: 0.95 }
      ];
      // Margen = 0.4 * 0.25 = 0.1 -> minX: 0.1, maxX: 0.7 (width = 0.6)
      const roi = computeAthleteRoi(landmarks, videoWidth, videoHeight, 0.25);

      // Punto en el centro exacto del ROI (0.5, 0.5)
      const pointInRoi: Point = { x: 0.5, y: 0.5, visibility: 0.9 };
      const remapped = remapPointFromRoi(pointInRoi, roi, videoWidth, videoHeight);

      // Global Norm X = 0.1 + 0.5 * 0.6 = 0.4
      expect(remapped.globalNormalized.x).toBeCloseTo(0.4, 3);
      expect(remapped.globalPixels.x).toBeCloseTo(400, 1);
    });
  });

  describe('Regla 3: Bloqueo Unilateral (Side-Locking)', () => {
    it('selecciona el lado derecho cuando su visibilidad acumulada es mayor', () => {
      // Simular 15 frames donde el lado derecho tiene visibilidad 0.95 y el izquierdo 0.20
      const frames: Point[][] = [];
      for (let i = 0; i < 15; i++) {
        const frameLms: Point[] = Array(33).fill({ x: 0, y: 0, visibility: 0 });

        // Lado derecho (12, 14, 16, 24, 26, 28)
        [12, 14, 16, 24, 26, 28].forEach(idx => {
          frameLms[idx] = { x: 0.5, y: 0.5, visibility: 0.95 };
        });

        // Lado izquierdo (11, 13, 15, 23, 25, 27)
        [11, 13, 15, 23, 25, 27].forEach(idx => {
          frameLms[idx] = { x: 0.3, y: 0.3, visibility: 0.15 };
        });

        frames.push(frameLms);
      }

      const dominant = determineDominantSide(frames);
      expect(dominant).toBe('right');
    });

    it('extrae las articulaciones maestras del lado bloqueado', () => {
      const landmarks: Point[] = Array(33).fill({ x: 0, y: 0, visibility: 0 });
      landmarks[MP_POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 100, y: 100, visibility: 0.95 };
      landmarks[MP_POSE_LANDMARKS.RIGHT_ELBOW] = { x: 100, y: 150, visibility: 0.90 };
      landmarks[MP_POSE_LANDMARKS.RIGHT_WRIST] = { x: 100, y: 200, visibility: 0.88 };
      landmarks[MP_POSE_LANDMARKS.RIGHT_HIP] = { x: 120, y: 250, visibility: 0.92 };
      landmarks[MP_POSE_LANDMARKS.RIGHT_KNEE] = { x: 120, y: 350, visibility: 0.91 };
      landmarks[MP_POSE_LANDMARKS.RIGHT_ANKLE] = { x: 120, y: 450, visibility: 0.89 };

      const joints = extractUnilateralJoints(landmarks, 'right');
      expect(joints.shoulder.x).toBe(100);
      expect(joints.elbow.y).toBe(150);
      expect(joints.knee.y).toBe(350);
    });
  });

  describe('Regla 4: Calibración y Bloqueo de Longitud Ósea (Fórmula Obligatoria)', () => {
    it('enforceBoneLength mantiene el ángulo vectorial y fuerza la distancia exacta', () => {
      const anchor: Point = { x: 100, y: 100 };
      const rawTarget: Point = { x: 130, y: 140 }; // dx = 30, dy = 40, dist = 50

      const fixedLength = 80; // Queremos forzar longitud exacta de 80 px
      const result = enforceBoneLength(anchor, rawTarget, fixedLength);

      const actualDist = Math.hypot(result.x - anchor.x, result.y - anchor.y);
      expect(actualDist).toBeCloseTo(80, 4);

      // La dirección unitaria debe ser idéntica: dx/dist = 30/50 = 0.6, dy/dist = 40/50 = 0.8
      // result.x = 100 + 0.6 * 80 = 148
      // result.y = 100 + 0.8 * 80 = 164
      expect(result.x).toBeCloseTo(148, 4);
      expect(result.y).toBeCloseTo(164, 4);
    });

    it('calibra la mediana de longitud ósea en píxeles filtrando visibility > 0.85', () => {
      const frames: Record<JointName, Point>[] = [
        // Frame 1: visibilidad alta (0.9), L_humero = 100, L_antebrazo = 80, L_femur = 140, L_tibia = 130
        {
          shoulder: { x: 0, y: 0, visibility: 0.9 },
          elbow: { x: 0, y: 100, visibility: 0.9 },
          wrist: { x: 0, y: 180, visibility: 0.9 },
          hip: { x: 50, y: 200, visibility: 0.9 },
          knee: { x: 50, y: 340, visibility: 0.9 },
          ankle: { x: 50, y: 470, visibility: 0.9 },
        },
        // Frame 2: visibilidad alta (0.92), L_humero = 104, L_antebrazo = 82, L_femur = 142, L_tibia = 132
        {
          shoulder: { x: 0, y: 0, visibility: 0.92 },
          elbow: { x: 0, y: 104, visibility: 0.92 },
          wrist: { x: 0, y: 186, visibility: 0.92 },
          hip: { x: 50, y: 200, visibility: 0.92 },
          knee: { x: 50, y: 342, visibility: 0.92 },
          ankle: { x: 50, y: 474, visibility: 0.92 },
        },
        // Frame 3: visibilidad baja (0.5), distancias aberrantes que deben ignorarse
        {
          shoulder: { x: 0, y: 0, visibility: 0.5 },
          elbow: { x: 0, y: 200, visibility: 0.5 },
          wrist: { x: 0, y: 400, visibility: 0.5 },
          hip: { x: 50, y: 200, visibility: 0.5 },
          knee: { x: 50, y: 600, visibility: 0.5 },
          ankle: { x: 50, y: 900, visibility: 0.5 },
        },
        // Frame 4: visibilidad alta (0.95), L_humero = 102, L_antebrazo = 81, L_femur = 141, L_tibia = 131
        {
          shoulder: { x: 0, y: 0, visibility: 0.95 },
          elbow: { x: 0, y: 102, visibility: 0.95 },
          wrist: { x: 0, y: 183, visibility: 0.95 },
          hip: { x: 50, y: 200, visibility: 0.95 },
          knee: { x: 50, y: 341, visibility: 0.95 },
          ankle: { x: 50, y: 472, visibility: 0.95 },
        }
      ];

      const lengths = calibrateBoneLengthsPx(frames, 0.85);

      // Mediana de [100, 102, 104] = 102
      expect(lengths.L_humero).toBe(102);
      // Mediana de [80, 81, 82] = 81
      expect(lengths.L_antebrazo).toBe(81);
      // Mediana de [140, 141, 142] = 141
      expect(lengths.L_femur).toBe(141);
      // Mediana de [130, 131, 132] = 131
      expect(lengths.L_tibia).toBe(131);
    });

    it('aplica el bloqueo óseo en cadena (proximal -> distal) garantizando distancias idénticas', () => {
      const rawJoints: Record<JointName, Point> = {
        shoulder: { x: 100, y: 100 },
        elbow: { x: 100, y: 175 }, // raw dist = 75
        wrist: { x: 160, y: 175 }, // raw dist = 60
        hip: { x: 100, y: 300 },
        knee: { x: 150, y: 400 },  // raw dist = sqrt(50^2 + 100^2) = 111.8
        ankle: { x: 150, y: 530 }, // raw dist = 130
      };

      const fixedLengths = {
        L_humero: 110,
        L_antebrazo: 90,
        L_femur: 150,
        L_tibia: 140
      };

      const locked = applyKinematicBoneLocking(rawJoints, fixedLengths);

      // Comprobar hombro -> codo
      const humerusDist = euclideanDistance2D(locked.shoulder, locked.elbow);
      expect(humerusDist).toBeCloseTo(110, 4);

      // Comprobar codo -> muñeca
      const forearmDist = euclideanDistance2D(locked.elbow, locked.wrist);
      expect(forearmDist).toBeCloseTo(90, 4);

      // Comprobar cadera -> rodilla
      const femurDist = euclideanDistance2D(locked.hip, locked.knee);
      expect(femurDist).toBeCloseTo(150, 4);

      // Comprobar rodilla -> tobillo
      const tibiaDist = euclideanDistance2D(locked.knee, locked.ankle);
      expect(tibiaDist).toBeCloseTo(140, 4);
    });
  });
});
