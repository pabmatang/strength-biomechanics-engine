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
    canonicalExerciseType: 'biceps_curl',
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
    canonicalExerciseType: 'triceps_extension',
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
  },

  // 11. Nautilus — Pec Fly
  {
    id: 'nautilus_nitro_pec_fly',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Pec Fly',
    canonicalExerciseType: 'pec_deck',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Contractora de pectoral con transmisión por leva Nautilus para tensión constante hasta la aducción completa.'
    },
    imageUrl: '/machines/nautilus_nitro_pec_fly.png'
  },

  // 12. Nautilus — Leg Press
  {
    id: 'nautilus_nitro_leg_press',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Leg Press',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'mid',
      curveWeights: { stretch: 0.40, mid: 0.40, shortened: 0.20 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Prensa horizontal selectorizada con sistema de cuatro barras y leva compensadora.'
    },
    imageUrl: '/machines/nautilus_nitro_leg_press.png'
  },

  // 13. Nautilus — Prone Leg Curl
  {
    id: 'nautilus_nitro_prone_leg_curl',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Prone Leg Curl',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Curl femoral prono con leva excéntrica que reduce la carga en el punto muerto superior.'
    },
    imageUrl: '/machines/nautilus_nitro_prone_leg_curl.png'
  },

  // 14. Nautilus — Abdominal Crunch
  {
    id: 'nautilus_nitro_abdominal_crunch',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Abdominal Crunch',
    canonicalExerciseType: 'abdominal_crunch',
    muscleGroupLabel: 'Abdomen',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Abdominal Crunch clásico con agarre superior y leva de resistencia creciente en flexión espinal.'
    },
    imageUrl: '/machines/nautilus_nitro_abdominal_crunch.png'
  },

  // 15. Nautilus — Abductor
  {
    id: 'nautilus_nitro_abductor',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Abductor',
    canonicalExerciseType: 'abductor_machine',
    muscleGroupLabel: 'Abductores',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Máquina de abducción con ajuste de rango y leva progresiva para glúteo medio.'
    },
    imageUrl: '/machines/nautilus_nitro_abductor.png'
  },

  // 16. Nautilus — Adductor
  {
    id: 'nautilus_nitro_adductor',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Adductor',
    canonicalExerciseType: 'adductor_machine',
    muscleGroupLabel: 'Aductores',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.35, mid: 0.40, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Máquina de aducción con soporte femoral ergonómico y leva compensada.'
    },
    imageUrl: '/machines/nautilus_nitro_adductor.png'
  },

  // 17. Nautilus — Glute Drive (Hip Thrust)
  {
    id: 'nautilus_glute_drive',
    brand: 'Nautilus',
    line: 'Leverage',
    modelName: 'Nautilus - Glute Drive (Hip Thrust)',
    canonicalExerciseType: 'hip_thrust',
    muscleGroupLabel: 'Glúteo',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Hip thrust guiado a discos con cinturón pélvico y banco pivotante para pico de tensión en extensión de cadera.'
    },
    imageUrl: '/machines/nautilus_glute_drive.png'
  },

  // 18. Nautilus Nitro Plus — Pullover
  {
    id: 'nautilus_nitro_pullover',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Pullover',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.35, mid: 0.40, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Pullover clásico Nautilus con arco de 250° y apoyo en codos que aísla el dorsal ancho sin fatiga de bíceps.'
    },
    imageUrl: '/machines/nautilus_nitro_pullover.png'
  },

  // 19. Nautilus Nitro Plus — Lower Back / Back Extension
  {
    id: 'nautilus_nitro_lower_back',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Lower Back / Back Extension',
    canonicalExerciseType: 'back_extension',
    muscleGroupLabel: 'Lumbares',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Extensión lumbar con mecanismo de cuatro barras que sigue el eje natural de la columna vertebral.'
    },
    imageUrl: '/machines/nautilus_nitro_lower_back.png'
  },

  // 20. Nautilus Nitro Plus — Rotary Torso
  {
    id: 'nautilus_nitro_rotary_torso',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Rotary Torso',
    canonicalExerciseType: 'abdominal_crunch',
    muscleGroupLabel: 'Abdomen',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Rotación de torso sentado con estabilización superior patentada y leva de resistencia variable para oblicuos.'
    },
    imageUrl: '/machines/nautilus_nitro_rotary_torso.png'
  },

  // 21. Nautilus Nitro Plus — Standing Calf
  {
    id: 'nautilus_nitro_standing_calf',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nautilus Nitro Plus - Standing Calf',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      curveWeights: { stretch: 0.40, mid: 0.35, shortened: 0.25 },
      curveLabel: 'Descendente · Foco Estiramiento',
      resistanceCurveDescription: 'Elevación de talones de pie con plataforma curva para máxima dorsiflexión y activación del gastrocnemio.'
    },
    imageUrl: '/machines/nautilus_nitro_standing_calf.png'
  }
];
