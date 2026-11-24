// ==========================================
// CHΔNCE MACHINE CATALOG - LIFE FITNESS
// ==========================================

import { type CatalogMachineEntry } from '../machineCatalog';
import { classifyMachineResistanceProfile } from '../../utils/machinePhysicsEngine';

export const LIFE_FITNESS_MACHINES: CatalogMachineEntry[] = [
  // 1. Life Fitness — Life Fitness Signature - Back Extension (Espalda Baja / Lumbares)
  {
    id: 'lifefitness_back_extension',
    brand: 'Life Fitness',
    line: 'Signature Series',
    modelName: 'Life Fitness Signature - Back Extension (Espalda Baja / Lumbares)',
    canonicalExerciseType: 'back_extension',
    muscleGroupLabel: 'Lumbares',
    profile: classifyMachineResistanceProfile({
      loadType: 'free_weight',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Life Fitness',
      machineModelGuess: 'Life Fitness Signature - Back Extension (Espalda Baja / Lumbares)'
    }),
    imageUrl: '/machines/lifefitness_back_extension.png'
  },

  // 2. Life Fitness — Life Fitness Insignia - Seated Triceps Extension
  {
    id: 'lifefitness_insignia_triceps_extension',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Seated Triceps Extension',
    canonicalExerciseType: 'triceps_extension',
    muscleGroupLabel: 'Tríceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Life Fitness',
      machineModelGuess: 'Life Fitness Insignia - Seated Triceps Extension'
    }),
    imageUrl: '/machines/lifefitness_insignia_triceps_extension.png'
  },

  // 3. Life Fitness — Cinta Inclinada (Incline Treadmill Walk)
  {
    id: 'cardio_incline_treadmill',
    brand: 'Life Fitness',
    line: 'Elevation Series',
    modelName: 'Cinta Inclinada (Incline Treadmill Walk)',
    canonicalExerciseType: 'cardio',
    muscleGroupLabel: 'Cardio',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'uniform',
      resistanceCurveDescription: 'Cinta de correr con inclinación: resistencia continua y uniforme.',
      curveWeights: { stretch: 0.334, mid: 0.333, shortened: 0.333 },
      curveLabel: 'Uniforme · Tensión Constante'
    },
    imageUrl: '/machines/cardio_incline_treadmill.png'
  },

  // 4. Life Fitness — Bicicleta Estática / Spinning
  {
    id: 'cardio_stationary_bike',
    brand: 'Life Fitness',
    line: 'Integrity Series',
    modelName: 'Bicicleta Estática / Spinning',
    canonicalExerciseType: 'cardio',
    muscleGroupLabel: 'Cardio',
    profile: classifyMachineResistanceProfile({
      loadType: 'free_weight',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Life Fitness',
      machineModelGuess: 'Bicicleta Estática / Spinning'
    }),
    imageUrl: '/machines/cardio_bike.png'
  }
];
