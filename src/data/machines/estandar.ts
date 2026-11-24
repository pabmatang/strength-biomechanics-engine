// ==========================================
// CHΔNCE MACHINE CATALOG - MÁQUINAS ESTÁNDAR (SIN MARCA)
// ==========================================

import { type CatalogMachineEntry } from '../machineCatalog';
import { classifyMachineResistanceProfile } from '../../utils/machinePhysicsEngine';

export const ESTANDAR_MACHINES: CatalogMachineEntry[] = [
  // 1. Estándar — Press Pecho en Máquina (Placas / Discos)
  {
    id: 'standard_chest_press',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Press Pecho en Máquina (Placas / Discos)',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'circular_cam_constant',
      pathType: 'linear_fixed',
      peakZone: 'uniform',
      resistanceCurveDescription: 'Máquina de placas estándar guiada con tensión equilibrada en todo el recorrido articular.',
      curveWeights: { stretch: 0.334, mid: 0.333, shortened: 0.333 },
      curveLabel: 'Uniforme · Tensión Constante'
    },
    imageUrl: '/machines/standard_chest_press.png'
  },

  // 2. Estándar — Press Inclinado en Máquina
  {
    id: 'standard_incline_press',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Press Inclinado en Máquina',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Palanca convergente de 30° con mayor momento resistente cerca del bloqueo superior.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Convergente'
    },
    imageUrl: '/machines/standard_incline_press.png'
  },

  // 3. Estándar — Peck Deck / Aperturas en Máquina
  {
    id: 'standard_pec_deck',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Peck Deck / Aperturas en Máquina',
    canonicalExerciseType: 'pec_deck',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Aperturas guiadas con leva circular; momento máximo cuando los brazos quedan perpendiculares al torso.',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Pico a 90°'
    },
    imageUrl: '/machines/standard_pec_deck.png'
  },

  // 4. Estándar — Remo Sentado en Máquina (Apoyo al Pecho)
  {
    id: 'standard_seated_row',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Remo Sentado en Máquina (Apoyo al Pecho)',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'circular_cam_constant',
      pathType: 'linear_fixed',
      peakZone: 'mid',
      resistanceCurveDescription: 'Tracción horizontal guiada con soporte esternal para aislar dorsal y retractores escapulares.',
      curveWeights: { stretch: 0.25, mid: 0.40, shortened: 0.35 },
      curveLabel: 'Campana · Rango Medio'
    },
    imageUrl: '/machines/standard_seated_row.png'
  },

  // 5. Estándar — Jalón al Pecho en Máquina
  {
    id: 'standard_lat_pulldown',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Jalón al Pecho en Máquina',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'circular_cam_constant',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Tracción vertical guiada por cable o palancas; mayor tensión con los brazos en máxima elevación.',
      curveWeights: { stretch: 0.40, mid: 0.35, shortened: 0.25 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/standard_lat_pulldown.png'
  },

  // 6. Estándar — Press de Hombro en Máquina
  {
    id: 'standard_shoulder_press',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Press de Hombro en Máquina',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'circular_cam_constant',
      pathType: 'linear_fixed',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Empuje vertical guiado con curva ligeramente ascendente hacia el bloqueo de codos.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Bloqueo'
    },
    imageUrl: '/machines/standard_shoulder_press.png'
  },

  // 7. Estándar — Elevaciones Laterales en Máquina
  {
    id: 'standard_lateral_raise',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Elevaciones Laterales en Máquina',
    canonicalExerciseType: 'lateral_raise',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Brazo de palanca con leva diseñada para exigir máxima tensión en abducción a 90°.',
      curveWeights: { stretch: 0.20, mid: 0.35, shortened: 0.45 },
      curveLabel: 'Ascendente · Acortamiento Deltoides'
    },
    imageUrl: '/machines/standard_lateral_raise.png'
  },

  // 8. Estándar — Prensa de Piernas Inclinada 45°
  {
    id: 'standard_leg_press_45',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Prensa de Piernas Inclinada 45°',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Trineo lineal a 45°; máxima demanda de fuerza en flexión profunda de rodilla y cadera.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/standard_leg_press_45.png'
  },

  // 9. Estándar — Sentadilla Hack (Hack Squat 45°)
  {
    id: 'standard_hack_squat',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Sentadilla Hack (Hack Squat 45°)',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Plataforma guiada con apoyo lumbar completo; máximo momento flexor de rodilla en el punto de inversión.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/standard_hack_squat.png'
  },

  // 10. Estándar — Extensión de Cuádriceps en Máquina
  {
    id: 'standard_leg_extension',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Extensión de Cuádriceps en Máquina',
    canonicalExerciseType: 'leg_extension',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Aislamiento de cuádriceps en cadena abierta con leva orientada a pico en extensión terminal.',
      curveWeights: { stretch: 0.20, mid: 0.35, shortened: 0.45 },
      curveLabel: 'Ascendente · Bloqueo Cuádriceps'
    },
    imageUrl: '/machines/standard_leg_extension.png'
  },

  // 11. Estándar — Curl Femoral Sentado en Máquina
  {
    id: 'standard_seated_leg_curl',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Curl Femoral Sentado en Máquina',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'circular_arc',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Cadera flexionada a 90° que elonga los isquiosurales; máxima sobrecarga en posición estirada.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/standard_seated_leg_curl.png'
  },

  // 12. Estándar — Curl Femoral Tumbado en Máquina
  {
    id: 'standard_lying_leg_curl',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Curl Femoral Tumbado en Máquina',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Posición prona con leva circular; momento máximo a 90° de flexión de rodilla.',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Rango Medio 90°'
    },
    imageUrl: '/machines/standard_lying_leg_curl.png'
  },

  // 13. Estándar — Máquina de Abductores (Abrir Piernas)
  {
    id: 'standard_abductor_machine',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Máquina de Abductores (Abrir Piernas)',
    canonicalExerciseType: 'abductor_machine',
    muscleGroupLabel: 'Abductores',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Aislamiento de glúteo medio y tensor de la fascia lata con mayor resistencia en abducción total.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Acortamiento Glúteo Medio'
    },
    imageUrl: '/machines/standard_abductor_machine.png'
  },

  // 14. Estándar — Máquina de Aductores (Cerrar Piernas)
  {
    id: 'standard_adductor_machine',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Máquina de Aductores (Cerrar Piernas)',
    canonicalExerciseType: 'adductor_machine',
    muscleGroupLabel: 'Aductores',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Aducción guiada de cadera con pico de contracción al juntar las rodillas.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Contracción Aductores'
    },
    imageUrl: '/machines/standard_adductor_machine.png'
  },

  // 15. Estándar — Hip Thrust en Máquina (Cinturón / Almohadilla)
  {
    id: 'standard_hip_thrust_machine',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Hip Thrust en Máquina (Cinturón / Almohadilla)',
    canonicalExerciseType: 'hip_thrust',
    muscleGroupLabel: 'Glúteo',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Palanca de extensión de cadera que sitúa el pico absoluto de tensión en el bloqueo pélvico superior.',
      curveWeights: { stretch: 0.15, mid: 0.30, shortened: 0.55 },
      curveLabel: 'Ascendente Pico · Bloqueo Glúteo'
    },
    imageUrl: '/machines/standard_hip_thrust_machine.png'
  },

  // 16. Estándar — Gemelo Sentado en Máquina (Sóleo a Discos)
  {
    id: 'standard_seated_calf',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Gemelo Sentado en Máquina (Sóleo a Discos)',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Rodillas flexionadas a 90° para desactivar gastrocnemio y sobrecargar sóleo en máxima dorsiflexión.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Sóleo Estirado'
    },
    imageUrl: '/machines/standard_seated_calf.png'
  },

  // 17. Estándar — Gemelo de Pie en Máquina (Placas / Hombros)
  {
    id: 'standard_standing_calf',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Gemelo de Pie en Máquina (Placas / Hombros)',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'circular_cam_constant',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Rodillas extendidas para enfatizar gastrocnemio medial y lateral con parada en estiramiento.',
      curveWeights: { stretch: 0.40, mid: 0.35, shortened: 0.25 },
      curveLabel: 'Descendente · Estiramiento Gastrocnemio'
    },
    imageUrl: '/machines/standard_standing_calf.png'
  },
  // 18. Estándar — Máquina Multipower / Smith
  {
    id: 'standard_smith_machine',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Máquina Multipower / Smith',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'circular_cam_constant',
      pathType: 'linear_fixed',
      peakZone: 'mid',
      resistanceCurveDescription: 'Barra guiada multipower comercial para sentadilla, press y zancada con trayectoria lineal constante.',
      curveWeights: { stretch: 0.33, mid: 0.34, shortened: 0.33 },
      curveLabel: 'Constante Lineal'
    },
    imageUrl: '/machines/standard_smith_machine.png'
  },

  // 19. Estándar — Dominadas y Fondos Asistidos
  {
    id: 'standard_assisted_dip_chin',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Dominadas y Fondos Asistidos',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Torre de placas con almohadilla de rodillas contrapesada para dominadas y fondos con descarga en estiramiento.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Máxima Asistencia en Estiramiento'
    },
    imageUrl: '/machines/standard_assisted_dip_chin.png'
  }
];
