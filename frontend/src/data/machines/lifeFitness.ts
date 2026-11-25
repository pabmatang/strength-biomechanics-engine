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
  },

  // 5. Life Fitness Insignia — Chest Press
  {
    id: 'lifefitness_insignia_chest_press',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Chest Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'convergent',
      peakZone: 'mid',
      curveWeights: { stretch: 0.35, mid: 0.45, shortened: 0.20 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Prensa de pecho Insignia con trayectoria convergente independiente y perfil biomecánico equilibrado.'
    },
    imageUrl: '/machines/lifefitness_insignia_chest_press.png'
  },

  // 6. Life Fitness Insignia — Pectoral Fly / Rear Deltoid
  {
    id: 'lifefitness_insignia_pectoral_fly',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Pectoral Fly / Rear Deltoid',
    canonicalExerciseType: 'pec_deck',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Aperturas contractora con brazos articulados y doble rango de ajuste para tensión continua en aducción.'
    },
    imageUrl: '/machines/lifefitness_insignia_pectoral_fly.png'
  },

  // 7. Life Fitness Insignia — Shoulder Press
  {
    id: 'lifefitness_insignia_shoulder_press',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Shoulder Press',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'convergent',
      peakZone: 'mid',
      curveWeights: { stretch: 0.35, mid: 0.45, shortened: 0.20 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Press de hombros convergente con empuñaduras multidireccionales para un patrón natural de empuje vertical.'
    },
    imageUrl: '/machines/lifefitness_insignia_shoulder_press.png'
  },

  // 8. Life Fitness Insignia — Lat Pulldown
  {
    id: 'lifefitness_insignia_lat_pulldown',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Pulldown',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'divergent',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.30, mid: 0.35, shortened: 0.35 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Jalón al pecho divergente independiente con agarres anatómicos ergonómicos.'
    },
    imageUrl: '/machines/lifefitness_insignia_lat_pulldown.png'
  },

  // 9. Life Fitness Insignia — Seated Row
  {
    id: 'lifefitness_insignia_seated_row',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'divergent',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.30, mid: 0.35, shortened: 0.35 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Remo sentado con apoyo torácico ajustable y agarres independientes multiposición.'
    },
    imageUrl: '/machines/lifefitness_insignia_seated_row.png'
  },

  // 10. Life Fitness Insignia — Leg Press
  {
    id: 'lifefitness_insignia_leg_press',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Leg Press',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'mid',
      curveWeights: { stretch: 0.40, mid: 0.40, shortened: 0.20 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Prensa de piernas horizontal asistida por levas con respaldo ergonómico de 4 posiciones.'
    },
    imageUrl: '/machines/lifefitness_insignia_leg_press.png'
  },

  // 11. Life Fitness Insignia — Leg Extension
  {
    id: 'lifefitness_insignia_leg_extension',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Leg Extension',
    canonicalExerciseType: 'leg_extension',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Extensión de cuádriceps con rodillo autoajustable y leva optimizada para proteger el tendón rotuliano.'
    },
    imageUrl: '/machines/lifefitness_insignia_leg_extension.png'
  },

  // 12. Life Fitness Insignia — Seated Leg Curl
  {
    id: 'lifefitness_insignia_seated_leg_curl',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Seated Leg Curl',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.30, mid: 0.35, shortened: 0.35 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Curl femoral sentado con cojín fijador superior y leva excéntrica de máxima activación en flexión.'
    },
    imageUrl: '/machines/lifefitness_insignia_seated_leg_curl.png'
  },

  // 13. Life Fitness Insignia — Hip Abduction
  {
    id: 'lifefitness_insignia_hip_abduction',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Hip Abduction',
    canonicalExerciseType: 'abductor_machine',
    muscleGroupLabel: 'Abductores',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Abducción de cadera sentado con soporte lumbar ergonómico y leva de tensión creciente en apertura máxima.'
    },
    imageUrl: '/machines/lifefitness_insignia_hip_abduction.png'
  },

  // 14. Life Fitness Insignia — Hip Adduction
  {
    id: 'lifefitness_insignia_hip_adduction',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Hip Adduction',
    canonicalExerciseType: 'adductor_machine',
    muscleGroupLabel: 'Aductores',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.35, mid: 0.40, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Aducción de cadera con rango de inicio ajustable y carga suave en estiramiento proximal.'
    },
    imageUrl: '/machines/lifefitness_insignia_hip_adduction.png'
  },

  // 15. Life Fitness Insignia — Prone Leg Curl
  {
    id: 'lifefitness_insignia_prone_leg_curl',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Prone Leg Curl',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Curl femoral tumbado con banco angulado para reducir la lordosis lumbar y maximizar la tensión isquiosural.'
    },
    imageUrl: '/machines/lifefitness_insignia_prone_leg_curl.png'
  },

  // 16. Life Fitness Insignia — Biceps Curl
  {
    id: 'lifefitness_insignia_biceps_curl',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Biceps Curl',
    canonicalExerciseType: 'biceps_curl',
    muscleGroupLabel: 'Bíceps',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Curl de bíceps en pupitre con agarres rotatorios independientes y eje de pivote alineado al codo.'
    },
    imageUrl: '/machines/lifefitness_insignia_biceps_curl.png'
  },

  // 17. Life Fitness Insignia — Abdominal
  {
    id: 'lifefitness_insignia_abdominal',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Abdominal',
    canonicalExerciseType: 'abdominal_crunch',
    muscleGroupLabel: 'Abdomen',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Crunch abdominal selectorizado con punto de giro lumbar que aísla el recto abdominal sin flexor de cadera.'
    },
    imageUrl: '/machines/lifefitness_insignia_abdominal.png'
  },

  // 18. Life Fitness Insignia — Calf Extension
  {
    id: 'lifefitness_insignia_calf_extension',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Calf Extension',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento',
      resistanceCurveDescription: 'Extensión de gemelos sentado con rodillas extendidas para carga directa del gastrocnemio.'
    },
    imageUrl: '/machines/lifefitness_insignia_calf_extension.png'
  },

  // 19. Life Fitness Insignia — Glute
  {
    id: 'lifefitness_insignia_glute',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Glute',
    canonicalExerciseType: 'glute_kickback',
    muscleGroupLabel: 'Glúteo',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Extensión de cadera unilateral de pie con apoyo pectoral para máxima contracción del glúteo mayor.'
    },
    imageUrl: '/machines/lifefitness_insignia_glute.png'
  },

  // 20. Life Fitness Insignia — Lateral Raise
  {
    id: 'lifefitness_insignia_lateral_raise',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Lateral Raise',
    canonicalExerciseType: 'lateral_raise',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.20, mid: 0.35, shortened: 0.45 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Elevaciones laterales en máquina con brazos articulados independientes y pivote alineado al hombro para aislar el deltoides medio.'
    },
    imageUrl: '/machines/lifefitness_insignia_lateral_raise.png'
  },

  // 21. Life Fitness Insignia — Torso Rotation
  {
    id: 'lifefitness_insignia_torso_rotation',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Torso Rotation',
    canonicalExerciseType: 'abdominal_crunch',
    muscleGroupLabel: 'Abdomen',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Rotación de torso selectorizada con fijación de rodillas y respaldo estabilizador para trabajar oblicuos internos y externos.'
    },
    imageUrl: '/machines/lifefitness_insignia_torso_rotation.png'
  },

  // 22. Life Fitness Insignia — Assist Dip / Chin
  {
    id: 'lifefitness_insignia_assist_dip_chin',
    brand: 'Life Fitness',
    line: 'Insignia Series',
    modelName: 'Life Fitness Insignia - Assist Dip / Chin',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'uniform',
      curveWeights: { stretch: 0.334, mid: 0.333, shortened: 0.333 },
      curveLabel: 'Uniforme · Asistencia Constante',
      resistanceCurveDescription: 'Estación de dominadas y fondos asistidos por torre de placas con plataforma abatible y agarres multiposición.'
    },
    imageUrl: '/machines/lifefitness_insignia_assist_dip_chin.png'
  },

  // 23. Life Fitness Signature — Plate-Loaded Incline Press
  {
    id: 'lifefitness_signature_incline_press',
    brand: 'Life Fitness',
    line: 'Signature Series',
    modelName: 'Life Fitness Signature - Plate-Loaded Incline Press',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Convergente',
      resistanceCurveDescription: 'Press inclinado a discos con brazos convergentes independientes para enfatizar el haz clavicular del pectoral mayor.'
    },
    imageUrl: '/machines/lifefitness_signature_incline_press.png'
  },

  // 24. Life Fitness Signature — Plate-Loaded Linear Leg Press 45°
  {
    id: 'lifefitness_signature_leg_press_45',
    brand: 'Life Fitness',
    line: 'Signature Series',
    modelName: 'Life Fitness Signature - Plate-Loaded Linear Leg Press 45°',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento',
      resistanceCurveDescription: 'Prensa lineal a 45° a discos sobre carro de rodamientos lineales; máxima demanda en flexión profunda de rodilla y cadera.'
    },
    imageUrl: '/machines/lifefitness_signature_leg_press_45.png'
  },

  // 25. Life Fitness Signature — Dual Adjustable Pulley (CMDAP)
  {
    id: 'lifefitness_signature_dap',
    brand: 'Life Fitness',
    line: 'Signature Series',
    modelName: 'Life Fitness Signature - Dual Adjustable Pulley (CMDAP)',
    canonicalExerciseType: 'cable_crossover',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'uniform',
      curveWeights: { stretch: 0.334, mid: 0.333, shortened: 0.333 },
      curveLabel: 'Uniforme · Tensión Constante',
      resistanceCurveDescription: 'Doble polea regulable en altura con relación de cable 4:1 para cruces, empujes y tracciones en cualquier plano.'
    },
    imageUrl: '/machines/lifefitness_signature_dap.png'
  }
];
