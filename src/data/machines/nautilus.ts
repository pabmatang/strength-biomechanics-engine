// ==========================================
// CHΔNCE MACHINE CATALOG - NAUTILUS
// ==========================================

import { type CatalogMachineEntry } from '../machineCatalog';
import { classifyMachineResistanceProfile } from '../../utils/machinePhysicsEngine';

export const NAUTILUS_MACHINES: CatalogMachineEntry[] = [
  // 1. Nautilus — Nitro Chest Press
  {
    id: 'nautilus_nitro_chest_press',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Chest Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'convergent',
      machineBrandGuess: 'Nautilus',
      machineModelGuess: 'Nautilus Nitro Plus - Chest Press'
    }),
    imageUrl: '/machines/nautilus_nitro_chest_press.png'
  },

  // 2. Nautilus — Leg Extension (Leva Excéntrica)
  {
    id: 'nautilus_leg_extension',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Leg Extension',
    canonicalExerciseType: 'leg_extension',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Nautilus',
      machineModelGuess: 'Nautilus Nitro Plus - Leg Extension'
    }),
    imageUrl: '/machines/nautilus_leg_extension.png'
  },

  // 3. Nautilus — Lat Pulldown
  {
    id: 'nautilus_nitro_pulldown',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Lat Pulldown',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'divergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Leva excéntrica Nautilus: optimiza el perfil de fuerza manteniendo tensión pico en la contracción dorsal.',
      curveWeights: { stretch: 0.30, mid: 0.35, shortened: 0.35 },
      curveLabel: 'Ascendente · Foco Acortamiento'
    },
    imageUrl: '/machines/nautilus_nitro_pulldown.png'
  },

  // 4. Nautilus — Compound Row
  {
    id: 'nautilus_nitro_compound_row',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Compound Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'convergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Remo compuesto con apoyo esternal y leva compensada para máxima retracción escapular.',
      curveWeights: { stretch: 0.30, mid: 0.35, shortened: 0.35 },
      curveLabel: 'Ascendente · Foco Acortamiento'
    },
    imageUrl: '/machines/nautilus_nitro_compound_row.png'
  },

  // 5. Nautilus — Incline Press
  {
    id: 'nautilus_nitro_incline_press',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Incline Press',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'convergent',
      peakZone: 'mid',
      resistanceCurveDescription: 'Press inclinado con trayectoria convergente y reducción de carga en bloqueo para protección articular.',
      curveWeights: { stretch: 0.35, mid: 0.45, shortened: 0.20 },
      curveLabel: 'Campana · Máximo Momento Medio'
    },
    imageUrl: '/machines/nautilus_nitro_incline_press.png'
  },

  // 6. Nautilus — Overhead Press
  {
    id: 'nautilus_nitro_overhead_press',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Overhead Press',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'convergent',
      peakZone: 'mid',
      resistanceCurveDescription: 'Press militar guiado con agarre neutro y leva excéntrica que iguala la curva de fuerza del deltoides.',
      curveWeights: { stretch: 0.35, mid: 0.45, shortened: 0.20 },
      curveLabel: 'Campana · Máximo Momento Medio'
    },
    imageUrl: '/machines/nautilus_nitro_overhead_press.png'
  },

  // 7. Nautilus — Lateral Raise
  {
    id: 'nautilus_nitro_lateral_raise',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Lateral Raise',
    canonicalExerciseType: 'lateral_raise',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Elevación lateral sentado con almohadillas en codos: aísla el deltoides medio sin interferencia de trapecios.',
      curveWeights: { stretch: 0.25, mid: 0.50, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio'
    },
    imageUrl: '/machines/nautilus_nitro_lateral_raise.png'
  },

  // 8. Nautilus — Seated Leg Curl
  {
    id: 'nautilus_nitro_seated_leg_curl',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Seated Leg Curl',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Flexión de rodilla sentado con cadera flexionada: máximo estiramiento proximal y pico de tensión en contracción.',
      curveWeights: { stretch: 0.30, mid: 0.35, shortened: 0.35 },
      curveLabel: 'Ascendente · Foco Acortamiento'
    },
    imageUrl: '/machines/nautilus_nitro_seated_leg_curl.png'
  },

  // 9. Nautilus — Biceps Curl
  {
    id: 'nautilus_nitro_biceps_curl',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Biceps Curl',
    canonicalExerciseType: 'biceps_curl_machine',
    muscleGroupLabel: 'Bíceps',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Banco Scott integrado con eje de pivote alineado y leva excéntrica que iguala el brazo de momento flexor.',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio'
    },
    imageUrl: '/machines/nautilus_nitro_biceps_curl.png'
  },

  // 10. Nautilus — Triceps Extension
  {
    id: 'nautilus_nitro_triceps_extension',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Triceps Extension',
    canonicalExerciseType: 'triceps_press',
    muscleGroupLabel: 'Tríceps',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Extensión de tríceps sentado con apoyo de codos y leva excéntrica para máxima sobrecarga en bloqueo.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento'
    },
    imageUrl: '/machines/nautilus_nitro_triceps_extension.png'
  }
];
