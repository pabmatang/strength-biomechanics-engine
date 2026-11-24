// ==========================================
// CHΔNCE MACHINE CATALOG - TECHNOGYM
// ==========================================

import { type CatalogMachineEntry } from '../machineCatalog';
import { classifyMachineResistanceProfile } from '../../utils/machinePhysicsEngine';

export const TECHNOGYM_MACHINES: CatalogMachineEntry[] = [
  // 1. Technogym — Technogym Pure Strength - Pulldown
  {
    id: 'technogym_pure_pulldown',
    brand: 'Technogym',
    line: 'Pure Strength (Palancas divergentes)',
    modelName: 'Technogym Pure Strength - Pulldown',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'divergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Pulldown'
    }),
    imageUrl: '/machines/technogym_pure_pulldown.png'
  },

  // 2. Technogym — Technogym Pure Strength - Low Row
  {
    id: 'technogym_pure_low_row',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Technogym Pure Strength - Low Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Low Row'
    }),
    imageUrl: '/machines/technogym_pure_low_row.png'
  },

  // 3. Technogym — Technogym Pure Strength - Row (Remo Dorian / Remo Horizontal a Discos)
  {
    id: 'technogym_pure_row_dorian',
    brand: 'Technogym',
    line: 'Pure Strength (Palancas divergentes)',
    modelName: 'Technogym Pure Strength - Row (Remo Dorian / Remo Horizontal a Discos)',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Row (Remo Dorian / Remo Horizontal a Discos)'
    }),
    imageUrl: '/machines/technogym_pure_row_dorian.png'
  },

  // 4. Technogym — Technogym Pure Strength - T-Bar Row (Remo en T a Discos)
  {
    id: 'technogym_pure_t_bar_row',
    brand: 'Technogym',
    line: 'Pure Strength (Discos Olímpicos)',
    modelName: 'Technogym Pure Strength - T-Bar Row (Remo en T a Discos)',
    canonicalExerciseType: 't_bar_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - T-Bar Row (Remo en T a Discos)'
    }),
    imageUrl: '/machines/technogym_pure_t_bar_row.png'
  },

  // 5. Technogym — Technogym Pure Strength - Deadlift (Peso Muerto a Discos)
  {
    id: 'technogym_pure_deadlift',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Technogym Pure Strength - Deadlift (Peso Muerto a Discos)',
    canonicalExerciseType: 'deadlift',
    muscleGroupLabel: 'Lumbares',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'La palanca pivota desde el suelo creando máximo brazo de momento en la posición inicial de flexión de cadera profunda, descargando al bloquear arriba.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/technogym_pure_deadlift.png'
  },

  // 6. Technogym — Technogym Selection - Lat Machine
  {
    id: 'technogym_selection_lat_machine',
    brand: 'Technogym',
    line: 'Selection 900 (Torre de placas)',
    modelName: 'Technogym Selection - Lat Machine',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'divergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection - Lat Machine'
    }),
    imageUrl: '/machines/technogym_selection_lat_machine.png'
  },

  // 7. Technogym — Technogym Selection 900 - Seated Wide Row (Remo Sentado Abierto de Placas)
  {
    id: 'technogym_selection_wide_row',
    brand: 'Technogym',
    line: 'Selection 900 (Torre de placas)',
    modelName: 'Technogym Selection 900 - Seated Wide Row (Remo Sentado Abierto de Placas)',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection 900 - Seated Wide Row (Remo Sentado Abierto de Placas)'
    }),
    imageUrl: '/machines/technogym_selection_wide_row.png'
  },

  // 8. Technogym — Technogym Pure Strength - Chest Press
  {
    id: 'technogym_pure_chest_press',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Technogym Pure Strength - Chest Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Chest Press'
    }),
    imageUrl: '/machines/technogym_pure_chest_press.png'
  },

  // 9. Technogym — Technogym Selection 900 - Chest Press (Press de Pecho de Placas)
  {
    id: 'technogym_selection_chest_press',
    brand: 'Technogym',
    line: 'Selection 900 (Torre de placas)',
    modelName: 'Technogym Selection 900 - Chest Press (Press de Pecho de Placas)',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection 900 - Chest Press (Press de Pecho de Placas)'
    }),
    imageUrl: '/machines/technogym_selection_chest_press.png'
  },

  // 10. Technogym — Technogym Pure Strength - Incline Chest Press
  {
    id: 'technogym_pure_incline_chest',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Technogym Pure Strength - Incline Chest Press',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Incline Chest Press'
    }),
    imageUrl: '/machines/technogym_pure_incline_chest.png'
  },

  // 11. Technogym — Technogym Pure Strength - Wide Chest Press
  {
    id: 'technogym_pure_wide_chest',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Technogym Pure Strength - Wide Chest Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Wide Chest Press'
    }),
    imageUrl: '/machines/technogym_pure_wide_chest.png'
  },

  // 12. Technogym — Technogym Selection - Pectoral & Reverse Fly (Pec Deck & Pájaros)
  {
    id: 'technogym_selection_pec_deck_reverse_fly',
    brand: 'Technogym',
    line: 'Selection 700 / 900 Dual',
    modelName: 'Technogym Selection - Pectoral & Reverse Fly (Pec Deck & Pájaros)',
    canonicalExerciseType: 'pec_deck',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection - Pectoral & Reverse Fly (Pec Deck & Pájaros)'
    }),
    imageUrl: '/machines/technogym_selection_pec_deck_reverse_fly.png'
  },

  // 13. Technogym — Technogym Pure Strength - Hip Thrust
  {
    id: 'technogym_pure_hip_thrust',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Technogym Pure Strength - Hip Thrust',
    canonicalExerciseType: 'hip_thrust',
    muscleGroupLabel: 'Glúteo',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Hip Thrust'
    }),
    imageUrl: '/machines/technogym_pure_hip_thrust.png'
  },

  // 14. Technogym — Technogym Selection 900 / Biostrength - Hip Thrust (Empuje de Cadera / Glúteo de Placas)
  {
    id: 'technogym_selection_hip_thrust',
    brand: 'Technogym',
    line: 'Selection 900 / Biostrength',
    modelName: 'Technogym Selection 900 / Biostrength - Hip Thrust (Empuje de Cadera / Glúteo de Placas)',
    canonicalExerciseType: 'hip_thrust',
    muscleGroupLabel: 'Glúteo',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection 900 / Biostrength - Hip Thrust (Empuje de Cadera / Glúteo de Placas)'
    }),
    imageUrl: '/machines/technogym_selection_hip_thrust.png'
  },

  // 15. Technogym — Technogym Selection - Adductor (Aductores / Cerrar Piernas)
  {
    id: 'technogym_selection_adductor',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection - Adductor (Aductores / Cerrar Piernas)',
    canonicalExerciseType: 'adductor_machine',
    muscleGroupLabel: 'Aductores',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection - Adductor (Aductores / Cerrar Piernas)'
    }),
    imageUrl: '/machines/technogym_selection_adductor.png'
  },

  // 16. Technogym — Technogym Selection - Abductor (Abductores / Abrir Piernas / Glúteo Medio)
  {
    id: 'technogym_selection_abductor',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection - Abductor (Abductores / Abrir Piernas / Glúteo Medio)',
    canonicalExerciseType: 'abductor_machine',
    muscleGroupLabel: 'Abductores',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection - Abductor (Abductores / Abrir Piernas / Glúteo Medio)'
    }),
    imageUrl: '/machines/technogym_selection_abductor.png'
  },

  // 17. Technogym — Technogym Pure Strength - Standing Abductor (Abductor de Pie a Discos)
  {
    id: 'technogym_pure_standing_abductor',
    brand: 'Technogym',
    line: 'Pure Strength (Discos)',
    modelName: 'Technogym Pure Strength - Standing Abductor (Abductor de Pie a Discos)',
    canonicalExerciseType: 'abductor_machine',
    muscleGroupLabel: 'Abductores',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Standing Abductor (Abductor de Pie a Discos)'
    }),
    imageUrl: '/machines/technogym_pure_standing_abductor.png'
  },

  // 18. Technogym — Technogym Pure Strength - Hack Squat
  {
    id: 'technogym_pure_hack_squat',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Technogym Pure Strength - Hack Squat',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Guiado lineal en plano inclinado con máxima demanda en flexión profunda de rodilla y foco en estiramiento.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/technogym_pure_hack_squat.png'
  },

  // 19. Technogym — Technogym Pure Strength - Belt Squat (Sentadilla con Cinturón a Discos)
  {
    id: 'technogym_pure_belt_squat',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Technogym Pure Strength - Belt Squat (Sentadilla con Cinturón a Discos)',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Sentadilla con cinturón a discos; máxima demanda en flexión profunda con foco en elongación de cuádriceps.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/technogym_pure_belt_squat.png'
  },

  // 20. Technogym — Technogym Selection 900 - Multi Hip (Glúteo, Aductores y Abductores de Placas)
  {
    id: 'technogym_selection_multi_hip',
    brand: 'Technogym',
    line: 'Selection 900 (Torre de placas)',
    modelName: 'Technogym Selection 900 - Multi Hip (Glúteo, Aductores y Abductores de Placas)',
    canonicalExerciseType: 'abductor_machine',
    muscleGroupLabel: 'Glúteo',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection 900 - Multi Hip (Glúteo, Aductores y Abductores de Placas)'
    }),
    imageUrl: '/machines/technogym_selection_multi_hip.png'
  },

  // 21. Technogym — Technogym Pure Strength - Prensa de Piernas a Discos 45° (Pure Leg Press)
  {
    id: 'technogym_pure_leg_press',
    brand: 'Technogym',
    line: 'Pure Strength (Discos)',
    modelName: 'Technogym Pure Strength - Prensa de Piernas a Discos 45° (Pure Leg Press)',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Prensa de discos a 45° con plano inclinado lineal; máxima carga en la fase de flexión profunda de rodillas.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/technogym_pure_leg_press.png'
  },

  // 22. Technogym — Technogym Selection 900 - Leg Press (Prensa Horizontal de Placas)
  {
    id: 'technogym_selection_leg_press',
    brand: 'Technogym',
    line: 'Selection 900 (Torre de placas)',
    modelName: 'Technogym Selection 900 - Leg Press (Prensa Horizontal de Placas)',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection 900 - Leg Press (Prensa Horizontal de Placas)'
    }),
    imageUrl: '/machines/technogym_selection_leg_press.png'
  },

  // 23. Technogym — Technogym Selection - Leg Extension
  {
    id: 'technogym_selection_leg_extension',
    brand: 'Technogym',
    line: 'Selection 900 / Biostrength',
    modelName: 'Technogym Selection - Leg Extension',
    canonicalExerciseType: 'leg_extension',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection - Leg Extension'
    }),
    imageUrl: '/machines/technogym_selection_leg_extension.png'
  },

  // 24. Technogym — Technogym Selection - Seated Leg Curl
  {
    id: 'technogym_selection_leg_curl',
    brand: 'Technogym',
    line: 'Selection 900 / Biostrength',
    modelName: 'Technogym Selection - Seated Leg Curl',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'circular_arc',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Curl femoral sentado con flexión de cadera: máxima elongación de isquiosurales y pico de tensión en estiramiento.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/technogym_selection_leg_curl.png'
  },

  // 25. Technogym — Technogym Selection - Total Abdominal Crunch
  {
    id: 'technogym_selection_abdominal_crunch',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection - Total Abdominal Crunch',
    canonicalExerciseType: 'abdominal_crunch',
    muscleGroupLabel: 'Abdomen',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection - Total Abdominal Crunch'
    }),
    imageUrl: '/machines/technogym_selection_abdominal_crunch.png'
  },

  // 26. Technogym — Technogym Selection 900 - Arm Curl (Predicador Bíceps)
  {
    id: 'technogym_selection_arm_curl',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection 900 - Arm Curl (Predicador Bíceps)',
    canonicalExerciseType: 'biceps_curl',
    muscleGroupLabel: 'Bíceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection 900 - Arm Curl (Predicador Bíceps)'
    }),
    imageUrl: '/machines/technogym_selection_arm_curl.png'
  },

  // 27. Technogym — Technogym Pure Strength - Shoulder Press
  {
    id: 'technogym_pure_shoulder_press',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Technogym Pure Strength - Shoulder Press',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Hombros',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Shoulder Press'
    }),
    imageUrl: '/machines/technogym_pure_shoulder_press.png'
  },

  // 28. Technogym — Technogym Selection - Prone Leg Curl (Femoral Tumbado)
  {
    id: 'technogym_selection_prone_leg_curl',
    brand: 'Technogym',
    line: 'Selection 900 (Torre de placas)',
    modelName: 'Technogym Selection - Prone Leg Curl (Femoral Tumbado)',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection - Prone Leg Curl (Femoral Tumbado)'
    }),
    imageUrl: '/machines/technogym_selection_prone_leg_curl.png'
  },

  // 29. Technogym — Technogym Pure Strength - Standing Leg Curl (Femoral de Pie a Discos)
  {
    id: 'technogym_pure_standing_leg_curl',
    brand: 'Technogym',
    line: 'Pure Strength (Discos)',
    modelName: 'Technogym Pure Strength - Standing Leg Curl (Femoral de Pie a Discos)',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Standing Leg Curl (Femoral de Pie a Discos)'
    }),
    imageUrl: '/machines/technogym_pure_standing_leg_curl.png'
  },

  // 30. Technogym — Technogym Selection - Standing Calf (Gemelos en Torre)
  {
    id: 'technogym_selection_standing_calf',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection - Standing Calf (Gemelos en Torre)',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection - Standing Calf (Gemelos en Torre)'
    }),
    imageUrl: '/machines/technogym_selection_standing_calf.png'
  },

  // 31. Technogym — Technogym Selection 900 - Seated Triceps Press (Tríceps Sentado de Placas / Seated Dip)
  {
    id: 'technogym_selection_seated_dip',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection 900 - Seated Triceps Press (Tríceps Sentado de Placas / Seated Dip)',
    canonicalExerciseType: 'triceps_extension',
    muscleGroupLabel: 'Tríceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection 900 - Seated Triceps Press (Tríceps Sentado de Placas / Seated Dip)'
    }),
    imageUrl: '/machines/technogym_selection_seated_dip.png'
  },

  // 32. Technogym — Technogym Pure Strength - Standing Glute Kickback
  {
    id: 'technogym_pure_standing_glute',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Technogym Pure Strength - Standing Glute Kickback',
    canonicalExerciseType: 'glute_kickback',
    muscleGroupLabel: 'Glúteo',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Standing Glute Kickback'
    }),
    imageUrl: '/machines/technogym_pure_standing_glute.png'
  },

  // 34. Technogym — Technogym Selection - Lower Back (Extensión Lumbar en Torre)
  {
    id: 'technogym_selection_lower_back',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection - Lower Back (Extensión Lumbar en Torre)',
    canonicalExerciseType: 'back_extension',
    muscleGroupLabel: 'Lumbares',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection - Lower Back (Extensión Lumbar en Torre)'
    }),
    imageUrl: '/machines/technogym_selection_lower_back.png'
  },

  // 35. Technogym — Technogym Selection 900 - Low Row (Remo Bajo en Torre de Placas)
  {
    id: 'technogym_selection_low_row',
    brand: 'Technogym',
    line: 'Selection 900 (Torre de placas)',
    modelName: 'Technogym Selection 900 - Low Row (Remo Bajo en Torre de Placas)',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection 900 - Low Row (Remo Bajo en Torre de Placas)'
    }),
    imageUrl: '/machines/technogym_selection_low_row.png'
  },

  // 36. Technogym — Technogym Selection 900 - Seated Cable Row (Polea Baja de Remo)
  {
    id: 'technogym_selection_pulley',
    brand: 'Technogym',
    line: 'Selection 900 (Torre de placas)',
    modelName: 'Technogym Selection 900 - Seated Cable Row (Polea Baja de Remo)',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Dorsales',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection 900 - Seated Cable Row (Polea Baja de Remo)'
    }),
    imageUrl: '/machines/technogym_selection_pulley.png'
  },

  // 37. Technogym — Technogym Selection - Shoulder Press (Press Militar en Torre)
  {
    id: 'technogym_selection_shoulder_press',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection - Shoulder Press (Press Militar en Torre)',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Hombros',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection - Shoulder Press (Press Militar en Torre)'
    }),
    imageUrl: '/machines/technogym_selection_shoulder_press.png'
  },

  // 38. Technogym — Technogym Pure Strength - Biceps Curl a Discos
  {
    id: 'technogym_pure_biceps_curl',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Technogym Pure Strength - Biceps Curl a Discos',
    canonicalExerciseType: 'biceps_curl',
    muscleGroupLabel: 'Bíceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Biceps Curl a Discos'
    }),
    imageUrl: '/machines/technogym_pure_biceps_curl.png'
  },

  // 39. Technogym — Technogym - Dual Adjustable Pulley (DAP / Polea Doble)
  {
    id: 'technogym_cable_crossover_dap',
    brand: 'Technogym',
    line: 'Selection Cable DAP',
    modelName: 'Technogym - Dual Adjustable Pulley (DAP / Polea Doble)',
    canonicalExerciseType: 'cable_crossover',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'cable_pulley',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym - Dual Adjustable Pulley (DAP / Polea Doble)'
    }),
    imageUrl: '/machines/technogym_cable_crossover_dap.png'
  },

  // 41. Technogym — Technogym Pure Strength - Seated Calf a Discos
  {
    id: 'technogym_pure_seated_calf',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Technogym Pure Strength - Seated Calf a Discos',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'circular_arc',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Palanca de gemelo sentado a discos con rodilla a 90°, sobrecargando sóleo en máxima dorsiflexión.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Sóleo Estirado'
    },
    imageUrl: '/machines/technogym_pure_seated_calf.png'
  },

  // 42. Technogym — Technogym Selection 900 - Glute (Patada de Glúteo)
  {
    id: 'technogym_selection_glute',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection 900 - Glute (Patada de Glúteo)',
    canonicalExerciseType: 'glute_kickback',
    muscleGroupLabel: 'Glúteo',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Extensión de cadera en torre de placas con leva que maximiza la resistencia en contracción pico de glúteo.',
      curveWeights: { stretch: 0.20, mid: 0.35, shortened: 0.45 },
      curveLabel: 'Ascendente · Pico Contracción'
    },
    imageUrl: '/machines/technogym_selection_glute.png'
  },

  // 43. Technogym — Technogym Selection 900 - Arm Extension (Tríceps)
  {
    id: 'technogym_selection_arm_extension',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection 900 - Arm Extension (Tríceps)',
    canonicalExerciseType: 'triceps_extension',
    muscleGroupLabel: 'Tríceps',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Extensión de codo en placas con leva biomecánica que sitúa la mayor carga a 90° de flexión.',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Pico Rango Medio'
    },
    imageUrl: '/machines/technogym_selection_arm_extension.png'
  },

  // 44. Technogym — Technogym Selection 900 - Rotary Torso (Oblicuos)
  {
    id: 'technogym_selection_rotary_torso',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection 900 - Rotary Torso (Oblicuos)',
    canonicalExerciseType: 'abdominal_crunch',
    muscleGroupLabel: 'Abdomen',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Rotación de tronco guiada por placas con resistencia simétrica y pico de tensión en el sector intermedio de giro.',
      curveWeights: { stretch: 0.25, mid: 0.50, shortened: 0.25 },
      curveLabel: 'Campana · Rotación Media'
    },
    imageUrl: '/machines/technogym_selection_rotary_torso.png'
  },

  // 45. Technogym — Technogym Selection 900 - Upper Back (Remo Alto)
  {
    id: 'technogym_selection_upper_back',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection 900 - Upper Back (Remo Alto)',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Remo alto divergente en placas que enfatiza retractores escapulares y deltoides posterior con pico en contracción.',
      curveWeights: { stretch: 0.20, mid: 0.40, shortened: 0.40 },
      curveLabel: 'Ascendente · Pico Acortamiento'
    },
    imageUrl: '/machines/technogym_selection_upper_back.png'
  },

  // 46. Technogym — Technogym Selection 900 - Vertical Traction (Jalón)
  {
    id: 'technogym_selection_vertical_traction',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection 900 - Vertical Traction (Jalón)',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'divergent',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Jalón vertical divergente en placas con sobrecarga biomecánica en máxima elongación del dorsal ancho.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/technogym_selection_vertical_traction.png'
  },

  // 47. Technogym — Technogym Selection 900 - Delts Machine (Laterales)
  {
    id: 'technogym_selection_delts_machine',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection 900 - Delts Machine (Laterales)',
    canonicalExerciseType: 'lateral_raise',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Elevaciones laterales guiadas por placas con leva adaptada para coincidir con la máxima palanca a 90° de abducción.',
      curveWeights: { stretch: 0.20, mid: 0.35, shortened: 0.45 },
      curveLabel: 'Ascendente · Pico Abducción'
    },
    imageUrl: '/machines/technogym_selection_delts_machine.png'
  },

  // 48. Technogym — Technogym Selection 900 - Chest Incline (Placas)
  {
    id: 'technogym_selection_chest_incline',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection 900 - Chest Incline (Placas)',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Press inclinado de placas con trayectoria convergente hacia el haz clavicular con máxima resistencia en extensión.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Convergente'
    },
    imageUrl: '/machines/technogym_selection_chest_incline.png'
  },
  // 49. Technogym — Multipower Smith Machine
  {
    id: 'technogym_multipower_smith',
    brand: 'Technogym',
    line: 'Multipower',
    modelName: 'Technogym Multipower Smith Machine',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'circular_cam_constant',
      pathType: 'linear_fixed',
      peakZone: 'mid',
      resistanceCurveDescription: 'Barra guiada sobre raíles verticales lineales con contrapeso equilibrado y fricción ultra reducida.',
      curveWeights: { stretch: 0.33, mid: 0.34, shortened: 0.33 },
      curveLabel: 'Constante Lineal'
    },
    imageUrl: '/machines/technogym_multipower_smith.png'
  },

  // 50. Technogym — Selection 900 Chin & Dip Asistido
  {
    id: 'technogym_selection_chin_dip',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection 900 - Chin & Dip Asistido',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Plataforma asistida contrapesada para dominadas y fondos en paralelas con asistencia progresiva en estiramiento.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Máxima Asistencia en Estiramiento'
    },
    imageUrl: '/machines/technogym_selection_chin_dip.png'
  }
];
