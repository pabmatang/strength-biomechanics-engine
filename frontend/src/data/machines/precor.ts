// ==========================================
// CHΔNCE MACHINE CATALOG - PRECOR
// ==========================================

import { type CatalogMachineEntry } from '../machineCatalog';

export const PRECOR_MACHINES: CatalogMachineEntry[] = [
  // 1. Precor Discovery — Converging Chest Press
  {
    id: 'precor_discovery_chest_press',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Converging Chest Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'convergent',
      peakZone: 'mid',
      curveWeights: { stretch: 0.35, mid: 0.45, shortened: 0.20 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Prensa pectoral convergente con brazos independientes y movimiento natural hacia la línea media.'
    },
    imageUrl: '/machines/precor_discovery_chest_press.png'
  },

  // 2. Precor Discovery — Incline Press a Discos
  {
    id: 'precor_discovery_incline_press',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Incline Press a Discos',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      peakZone: 'mid',
      curveWeights: { stretch: 0.35, mid: 0.45, shortened: 0.20 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Press inclinado a discos DPL0541 con palancas convergentes que protegen la articulación glenohumeral.'
    },
    imageUrl: '/machines/precor_discovery_incline_press.png'
  },

  // 3. Precor Discovery — Rear Delt / Pec Fly
  {
    id: 'precor_discovery_pec_fly',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Rear Delt / Pec Fly',
    canonicalExerciseType: 'pec_deck',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Contractora dual para pectoral y deltoides posterior con brazos flotantes autoajustables.'
    },
    imageUrl: '/machines/precor_discovery_pec_fly.png'
  },

  // 4. Precor Discovery — Converging Shoulder Press
  {
    id: 'precor_discovery_shoulder_press',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Converging Shoulder Press',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'convergent',
      peakZone: 'mid',
      curveWeights: { stretch: 0.35, mid: 0.45, shortened: 0.20 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Press de hombros convergente con empuje ergonómico y reducción de estrés acromial en rango superior.'
    },
    imageUrl: '/machines/precor_discovery_shoulder_press.png'
  },

  // 5. Precor Discovery — Diverging Lat Pulldown
  {
    id: 'precor_discovery_lat_pulldown',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Diverging Lat Pulldown',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'divergent',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.30, mid: 0.35, shortened: 0.35 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Jalón dorsal divergente con movimiento independiente que optimiza la línea de tracción escapular.'
    },
    imageUrl: '/machines/precor_discovery_lat_pulldown.png'
  },

  // 6. Precor Discovery — Seated Row
  {
    id: 'precor_discovery_seated_row',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Seated Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'divergent',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.30, mid: 0.35, shortened: 0.35 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Remo sentado con apoyo torácico ajustable y agarres independientes para retracción escapular completa.'
    },
    imageUrl: '/machines/precor_discovery_seated_row.png'
  },

  // 7. Precor Discovery — Angled Leg Press 45° a Discos
  {
    id: 'precor_discovery_leg_press',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Angled Leg Press 45° a Discos',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento',
      resistanceCurveDescription: 'Prensa inclinada a 45° DPL0601 sobre rieles de precisión con sobrecarga continua en flexión profunda.'
    },
    imageUrl: '/machines/precor_discovery_leg_press.png'
  },

  // 8. Precor Discovery — Leg Extension
  {
    id: 'precor_discovery_leg_extension',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Leg Extension',
    canonicalExerciseType: 'leg_extension',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Extensión de piernas con leva excéntrica y rodillo autoalineable para tensión máxima en extensión completa.'
    },
    imageUrl: '/machines/precor_discovery_leg_extension.png'
  },

  // 9. Precor Discovery — Seated Leg Curl
  {
    id: 'precor_discovery_seated_leg_curl',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Seated Leg Curl',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.30, mid: 0.35, shortened: 0.35 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Curl femoral sentado con ángulo de cadera preestablecido y leva excéntrica que mantiene tensión hasta la flexión total.'
    },
    imageUrl: '/machines/precor_discovery_seated_leg_curl.png'
  },

  // 10. Precor Discovery — Hack Squat a Discos
  {
    id: 'precor_discovery_hack_squat',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Hack Squat a Discos',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento',
      resistanceCurveDescription: 'Sentadilla Hack guiada a discos con plataforma amplia y máxima demanda de cuádriceps en flexión profunda.'
    },
    imageUrl: '/machines/precor_discovery_hack_squat.png'
  },

  // 11. Precor Discovery — Hip Abductor
  {
    id: 'precor_discovery_hip_abductor',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Hip Abductor',
    canonicalExerciseType: 'abductor_machine',
    muscleGroupLabel: 'Abductores',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Abductor de cadera con respaldo reclinable y leva progresiva en fase de apertura.'
    },
    imageUrl: '/machines/precor_discovery_hip_abductor.png'
  },

  // 12. Precor Discovery — Hip Adductor
  {
    id: 'precor_discovery_hip_adductor',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Hip Adductor',
    canonicalExerciseType: 'adductor_machine',
    muscleGroupLabel: 'Aductores',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.35, mid: 0.40, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Aductor de cadera con ajuste inicial de apertura y resistencia controlada en cierre.'
    },
    imageUrl: '/machines/precor_discovery_hip_adductor.png'
  },

  // 13. Precor Discovery — Prone Leg Curl
  {
    id: 'precor_discovery_prone_leg_curl',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Prone Leg Curl',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Curl femoral tumbado con banco en V para estabilizar la pelvis durante la flexión de rodilla.'
    },
    imageUrl: '/machines/precor_discovery_prone_leg_curl.png'
  },

  // 14. Precor Discovery — Biceps Curl
  {
    id: 'precor_discovery_biceps_curl',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Biceps Curl',
    canonicalExerciseType: 'biceps_curl',
    muscleGroupLabel: 'Bíceps',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Curl de bíceps con brazos independientes y empuñaduras ergonómicas autoalineables.'
    },
    imageUrl: '/machines/precor_discovery_biceps_curl.png'
  },

  // 15. Precor Discovery — Triceps Extension
  {
    id: 'precor_discovery_triceps_extension',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Triceps Extension',
    canonicalExerciseType: 'triceps_extension',
    muscleGroupLabel: 'Tríceps',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Extensión de tríceps sentado con apoyo de brazos inclinado y tensión máxima en extensión.'
    },
    imageUrl: '/machines/precor_discovery_triceps_extension.png'
  },

  // 16. Precor Discovery — Abdominal Crunch
  {
    id: 'precor_discovery_abdominal_crunch',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Abdominal Crunch',
    canonicalExerciseType: 'abdominal_crunch',
    muscleGroupLabel: 'Abdomen',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Crunch abdominal con pivote anatómico lumbar para flexión torácica pura.'
    },
    imageUrl: '/machines/precor_discovery_abdominal_crunch.png'
  },

  // 17. Precor Discovery / Vitality — Lateral Raise
  {
    id: 'precor_discovery_lateral_raise',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery / Vitality - Lateral Raise',
    canonicalExerciseType: 'lateral_raise',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.25, mid: 0.50, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Elevación lateral sentado con brazos independientes y leva excéntrica para aislamiento del deltoides medio.'
    },
    imageUrl: '/machines/precor_discovery_lateral_raise.png'
  },

  // 18. Precor Discovery — Glute Extension
  {
    id: 'precor_discovery_glute_extension',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Glute Extension',
    canonicalExerciseType: 'glute_kickback',
    muscleGroupLabel: 'Glúteo',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Extensión de glúteo de pie con brazo largo de movimiento para máxima extensión de cadera.'
    },
    imageUrl: '/machines/precor_discovery_glute_extension.png'
  },

  // 19. Precor Discovery — Back Extension
  {
    id: 'precor_discovery_back_extension',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Back Extension',
    canonicalExerciseType: 'back_extension',
    muscleGroupLabel: 'Lumbares',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Extensión lumbar sentado con respaldo contorneado y plataforma fija para estabilización pélvica.'
    },
    imageUrl: '/machines/precor_discovery_back_extension.png'
  },

  // 20. Precor Discovery — Rotary Torso
  {
    id: 'precor_discovery_rotary_torso',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Rotary Torso',
    canonicalExerciseType: 'abdominal_crunch',
    muscleGroupLabel: 'Abdomen',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Rotación de torso sentado con estabilización de rodillas y ajuste bilateral para oblicuos.'
    },
    imageUrl: '/machines/precor_discovery_rotary_torso.png'
  },

  // 21. Precor Discovery — Dip / Chin Assist
  {
    id: 'precor_discovery_chin_dip_assist',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Dip / Chin Assist',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'mid',
      curveWeights: { stretch: 0.35, mid: 0.35, shortened: 0.30 },
      curveLabel: 'Plana · Asistencia Constante',
      resistanceCurveDescription: 'Estación asistida de dominadas y fondos con contrapeso constante mediante columna selectorizada.'
    },
    imageUrl: '/machines/precor_discovery_chin_dip_assist.png'
  },

  // 22. Precor Discovery — Seated Calf Raise
  {
    id: 'precor_discovery_seated_calf',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Seated Calf Raise',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      curveWeights: { stretch: 0.40, mid: 0.35, shortened: 0.25 },
      curveLabel: 'Descendente · Foco Estiramiento',
      resistanceCurveDescription: 'Extensión de gemelos sentado con plataforma curva y soporte lumbar para máxima flexión plantar.'
    },
    imageUrl: '/machines/precor_discovery_seated_calf.png'
  },

  // 23. Precor Discovery / FTS Glide — Dual Adjustable Pulley (DAP)
  {
    id: 'precor_discovery_dap',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery / FTS Glide - Dual Adjustable Pulley (DAP)',
    canonicalExerciseType: 'cable_crossover',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'free_cable',
      peakZone: 'mid',
      curveWeights: { stretch: 0.33, mid: 0.34, shortened: 0.33 },
      curveLabel: 'Plana · Tensión Constante de Polea',
      resistanceCurveDescription: 'Doble polea ajustable funcional con recorrido fluido y tensión constante en cualquier ángulo de tracción o cruce.'
    },
    imageUrl: '/machines/precor_discovery_dap.png'
  }
];
