// ==========================================
// CHΔNCE MACHINE CATALOG - HAMMER STRENGTH
// ==========================================

import { type CatalogMachineEntry } from '../machineCatalog';
import { classifyMachineResistanceProfile } from '../../utils/machinePhysicsEngine';

export const HAMMER_STRENGTH_MACHINES: CatalogMachineEntry[] = [
  // 1. Hammer Strength — Hammer Strength - Kneeling Leg Curl (Femoral Tumbado / Unilateral)
  {
    id: 'hammer_kneeling_leg_curl',
    brand: 'Hammer Strength',
    line: 'Plate Loaded',
    modelName: 'Hammer Strength - Kneeling Leg Curl (Femoral Tumbado / Unilateral)',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Kneeling Leg Curl (Femoral Tumbado / Unilateral)'
    }),
    imageUrl: '/machines/hammer_kneeling_leg_curl.png'
  },

  // 2. Hammer Strength — Hammer Strength - Glute Drive (Hip Thrust de Discos)
  {
    id: 'hammer_glute_drive',
    brand: 'Hammer Strength',
    line: 'Plate Loaded',
    modelName: 'Hammer Strength - Glute Drive (Hip Thrust de Discos)',
    canonicalExerciseType: 'hip_thrust',
    muscleGroupLabel: 'Glúteo',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Glute Drive (Hip Thrust de Discos)'
    }),
    imageUrl: '/machines/hammer_glute_drive.png'
  },

  // 3. Hammer Strength — Hammer Strength Select - Back Extension (Extensión Lumbar en Torre)
  {
    id: 'hammer_back_extension',
    brand: 'Hammer Strength',
    line: 'Hammer Strength Select',
    modelName: 'Hammer Strength Select - Back Extension (Extensión Lumbar en Torre)',
    canonicalExerciseType: 'back_extension',
    muscleGroupLabel: 'Lumbares',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength Select - Back Extension (Extensión Lumbar en Torre)'
    }),
    imageUrl: '/machines/hammer_back_extension.png'
  },

  // 4. Hammer Strength — Hammer Strength - Plate-Loaded Seated Calf (Gemelos Sentado a Discos)
  {
    id: 'hammer_seated_calf_raise',
    brand: 'Hammer Strength',
    line: 'Plate Loaded',
    modelName: 'Hammer Strength - Plate-Loaded Seated Calf (Gemelos Sentado a Discos)',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Plate-Loaded Seated Calf (Gemelos Sentado a Discos)'
    }),
    imageUrl: '/machines/hammer_seated_calf_raise.png'
  },

  // 5. Hammer Strength — Hammer Strength - Plate-Loaded Seated Biceps (Banco Scott Discos)
  {
    id: 'hammer_seated_biceps_curl',
    brand: 'Hammer Strength',
    line: 'Plate Loaded',
    modelName: 'Hammer Strength - Plate-Loaded Seated Biceps (Banco Scott Discos)',
    canonicalExerciseType: 'biceps_curl',
    muscleGroupLabel: 'Bíceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Plate-Loaded Seated Biceps (Banco Scott Discos)'
    }),
    imageUrl: '/machines/hammer_seated_biceps_curl.png'
  },

  // 6. Hammer Strength — Hammer Strength - Seated Dip (Fondos Tríceps en Palanca)
  {
    id: 'hammer_seated_dip_triceps',
    brand: 'Hammer Strength',
    line: 'Plate Loaded',
    modelName: 'Hammer Strength - Seated Dip (Fondos Tríceps en Palanca)',
    canonicalExerciseType: 'triceps_extension',
    muscleGroupLabel: 'Tríceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Seated Dip (Fondos Tríceps en Palanca)'
    }),
    imageUrl: '/machines/hammer_seated_dip_triceps.png'
  },

  // 7. Hammer Strength — Hammer Strength - Iso-Lateral Front Lat Pulldown
  {
    id: 'hammer_iso_front_lat_pulldown',
    brand: 'Hammer Strength',
    line: 'Plate Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral Front Lat Pulldown',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'divergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Iso-Lateral Front Lat Pulldown'
    }),
    imageUrl: '/machines/hammer_iso_front_lat_pulldown.png'
  },

  // 8. Hammer Strength — Hammer Strength - Iso-Lateral DY Row
  {
    id: 'hammer_iso_dy_row',
    brand: 'Hammer Strength',
    line: 'Plate Loaded (Dorian Yates Style)',
    modelName: 'Hammer Strength - Iso-Lateral DY Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Iso-Lateral DY Row'
    }),
    imageUrl: '/machines/hammer_iso_dy_row.png'
  },

  // 9. Hammer Strength — Hammer Strength - Iso-Lateral Low Row
  {
    id: 'hammer_iso_low_row',
    brand: 'Hammer Strength',
    line: 'Plate Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral Low Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Iso-Lateral Low Row'
    }),
    imageUrl: '/machines/hammer_iso_low_row.png'
  },

  // 10. Hammer Strength — Iso-Lateral Horizontal Bench Press
  {
    id: 'hammer_iso_wide_chest',
    brand: 'Hammer Strength',
    line: 'Plate Loaded Iso-Lateral',
    modelName: 'Iso-Lateral Horizontal Bench Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Iso-Lateral Horizontal Bench Press'
    }),
    imageUrl: '/machines/hammer_iso_wide_chest.png'
  },

  // 11. Hammer Strength — Hammer Strength - Iso-Lateral Incline Press
  {
    id: 'hammer_iso_incline_press',
    brand: 'Hammer Strength',
    line: 'Plate Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral Incline Press',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Iso-Lateral Incline Press'
    }),
    imageUrl: '/machines/hammer_iso_incline_press.png'
  },

  // 12. Hammer Strength — Hammer Strength - Iso-Lateral Decline Press
  {
    id: 'hammer_iso_decline_press',
    brand: 'Hammer Strength',
    line: 'Plate Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral Decline Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Iso-Lateral Decline Press'
    }),
    imageUrl: '/machines/hammer_iso_decline_press.png'
  },

  // 13. Hammer Strength — Hammer Strength - Linear Hack Squat (Sentadilla Hack a Discos)
  {
    id: 'hammer_linear_hack_squat',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Linear',
    modelName: 'Hammer Strength - Linear Hack Squat (Sentadilla Hack a Discos)',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Guiado lineal en carro inclinado con sobrecarga en flexión profunda de rodilla y foco en estiramiento.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/hammer_linear_hack_squat.png'
  },

  // 14. Hammer Strength — Hammer Strength - Plate-Loaded V-Squat (Sentadilla V)
  {
    id: 'hammer_plate_loaded_v_squat',
    brand: 'Hammer Strength',
    line: 'Plate Loaded Series',
    modelName: 'Hammer Strength - Plate-Loaded V-Squat (Sentadilla V)',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Sentadilla en V guiada; mayor brazo de resistencia en flexión y estiramiento profundo.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/hammer_plate_loaded_v_squat.png'
  },

  // 15. Hammer Strength — Hammer Strength - Iso-Lateral Leg Extension (Discos)
  {
    id: 'hammer_iso_leg_extension',
    brand: 'Hammer Strength',
    line: 'Plate Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral Leg Extension (Discos)',
    canonicalExerciseType: 'leg_extension',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Iso-Lateral Leg Extension (Discos)'
    }),
    imageUrl: '/machines/hammer_iso_leg_extension.png'
  },

  // 16. Hammer Strength — Hammer Strength - Standing Calf Raise (Gemelos de Pie a Discos)
  {
    id: 'hammer_standing_calf_raise',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Ground Base',
    modelName: 'Hammer Strength - Standing Calf Raise (Gemelos de Pie a Discos)',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Standing Calf Raise (Gemelos de Pie a Discos)'
    }),
    imageUrl: '/machines/hammer_standing_calf_raise.png'
  },

  // 17. Hammer Strength — Hammer Strength - Super Horizontal Calf (PL-SHC a Discos)
  {
    id: 'hammer_super_horizontal_calf',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Linear',
    modelName: 'Hammer Strength - Super Horizontal Calf (PL-SHC a Discos)',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Super Horizontal Calf (PL-SHC a Discos)'
    }),
    imageUrl: '/machines/hammer_super_horizontal_calf.png'
  },

  // 18. Hammer Strength — Hammer Strength - Chest Supported T-Bar Row (Remo en T con Apoyo)
  {
    id: 'hammer_chest_supported_t_bar_row',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Ground Base',
    modelName: 'Hammer Strength - Chest Supported T-Bar Row (Remo en T con Apoyo)',
    canonicalExerciseType: 't_bar_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Chest Supported T-Bar Row (Remo en T con Apoyo)'
    }),
    imageUrl: '/machines/hammer_chest_supported_t_bar_row.png'
  },

  // 19. Hammer Strength — Hammer Strength - Iso-Lateral Seated Row (Remo Sentado a Discos)
  {
    id: 'hammer_plate_loaded_seated_row',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Ground Base',
    modelName: 'Hammer Strength - Iso-Lateral Seated Row (Remo Sentado a Discos)',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Dorsales',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Iso-Lateral Seated Row (Remo Sentado a Discos)'
    }),
    imageUrl: null
  },

  // 20. Hammer Strength — Hammer Strength - 45° Linear Plate-Loaded Leg Press (Prensa 45° a Discos)
  {
    id: 'hammer_plate_loaded_leg_press_45',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Linear',
    modelName: 'Hammer Strength - 45° Linear Plate-Loaded Leg Press (Prensa 45° a Discos)',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Prensa lineal de discos a 45°; máxima demanda en flexión profunda de rodilla decreciendo hacia la extensión.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/hammer_plate_loaded_leg_press_45.png'
  },

  // 21. Hammer Strength — Hammer Strength - Tibia Dorsi Flexion a Discos
  {
    id: 'hammer_tibia_dorsi_flexion',
    brand: 'Hammer Strength',
    line: 'Ground Base Plate-Loaded',
    modelName: 'Hammer Strength - Tibia Dorsi Flexion a Discos',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Tibia Dorsi Flexion a Discos'
    }),
    imageUrl: null
  },

  // 22. Hammer Strength — Hammer Strength - Iso-Lateral High Row
  {
    id: 'hammer_iso_high_row',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral High Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'divergent',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Palanca divergente iso-lateral con tracción alta; pico de tensión máxima en estiramiento y caída progresiva hacia la contracción escapular.',
      curveWeights: { stretch: 0.40, mid: 0.35, shortened: 0.25 },
      curveLabel: 'Descendente · Pico en Estiramiento'
    },
    imageUrl: null
  },

  // 23. Hammer Strength — Hammer Strength - Iso-Lateral Shoulder Press
  {
    id: 'hammer_iso_shoulder_press',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral Shoulder Press',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Palanca convergente iso-lateral para deltoides; resistencia creciente hacia la extensión terminal y bloqueo overhead.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Pico en Acortamiento'
    },
    imageUrl: null
  },

  // 24. Hammer Strength — Hammer Strength - Iso-Lateral Super Incline Press
  {
    id: 'hammer_iso_super_incline_press',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral Super Incline Press',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Ángulo super inclinado (~60°) con trayectoria convergente enfocada en porción clavicular; máxima sobrecarga en la fase final de empuje.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Clavicular'
    },
    imageUrl: null
  },

  // 25. Hammer Strength — Hammer Strength - Iso-Lateral Wide Pulldown
  {
    id: 'hammer_iso_wide_pulldown',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral Wide Pulldown',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'divergent',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Palancas divergentes de arco amplio con tracción vertical; tensión máxima en elongación lats con descarga en compresión costal.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Pico en Estiramiento'
    },
    imageUrl: null
  },

  // 26. Hammer Strength — Hammer Strength - Plate-Loaded Belt Squat
  {
    id: 'hammer_plate_loaded_belt_squat',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded',
    modelName: 'Hammer Strength - Plate-Loaded Belt Squat',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Cinturón de tracción pélvica con descarga axial espinal; máxima resistencia en flexión profunda de rodilla con descompresión en extensión.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Sobrecarga en Estiramiento'
    },
    imageUrl: null
  },

  // 27. Hammer Strength — Hammer Strength - Plate-Loaded Pendulum Squat
  {
    id: 'hammer_plate_loaded_pendulum_squat',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded',
    modelName: 'Hammer Strength - Plate-Loaded Pendulum Squat',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'circular_arc',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Péndulo con arco de movimiento circular y contrapeso regulable; máxima demanda en flexión profunda con alivio en bloqueo articular.',
      curveWeights: { stretch: 0.50, mid: 0.35, shortened: 0.15 },
      curveLabel: 'Descendente · Péndulo Profundo'
    },
    imageUrl: null
  },

  // 28. Hammer Strength — Hammer Strength - Iso-Lateral Lateral Raise
  {
    id: 'hammer_iso_lateral_raise',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral Lateral Raise',
    canonicalExerciseType: 'lateral_raise',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Elevación lateral en arco circular; el brazo de palanca se aproxima a la horizontal a 90° de abducción, generando máxima resistencia en acortamiento.',
      curveWeights: { stretch: 0.15, mid: 0.35, shortened: 0.50 },
      curveLabel: 'Ascendente · Pico en Acortamiento'
    },
    imageUrl: null
  },

  // 29. Hammer Strength — Hammer Strength Select - Pec Fly / Rear Delt
  {
    id: 'hammer_select_pec_fly',
    brand: 'Hammer Strength',
    line: 'Hammer Strength Select',
    modelName: 'Hammer Strength Select - Pec Fly / Rear Delt',
    canonicalExerciseType: 'pec_deck',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Torre de placas con leva excéntrica de doble función; resistencia optimizada en el rango medio de aducción horizontal para alineación con longitud-tensión pectoral.',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Pico en Rango Medio'
    },
    imageUrl: null
  },

  // 30. Hammer Strength — Hammer Strength Select - Seated Leg Curl
  {
    id: 'hammer_select_seated_leg_curl',
    brand: 'Hammer Strength',
    line: 'Hammer Strength Select',
    modelName: 'Hammer Strength Select - Seated Leg Curl',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Leva excéntrica biomecánica con máxima sobrecarga en posición elongada (cadera a 90°, rodilla extendida) y descompresión progresiva en flexión profunda.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Sobrecarga en Estiramiento'
    },
    imageUrl: null
  },

  // 31. Hammer Strength — Hammer Strength Select - Abdominal Crunch
  {
    id: 'hammer_select_ab_crunch',
    brand: 'Hammer Strength',
    line: 'Hammer Strength Select',
    modelName: 'Hammer Strength Select - Abdominal Crunch',
    canonicalExerciseType: 'abdominal_crunch',
    muscleGroupLabel: 'Abdomen',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Torre de placas con eje de flexión toraco-lumbar guiado; curva en campana con pico máximo en rango medio de flexión espinal.',
      curveWeights: { stretch: 0.25, mid: 0.50, shortened: 0.25 },
      curveLabel: 'Campana · Pico en Rango Medio'
    },
    imageUrl: null
  }
];
