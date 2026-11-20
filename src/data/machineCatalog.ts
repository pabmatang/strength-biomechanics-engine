// ==========================================
// CHΔNCE MASTER MACHINE CATALOG
// Verified Biomechanical Resistance Profiles by Brand & Model
// ==========================================

import {
  type MachineResistanceProfile,
  classifyMachineResistanceProfile
} from '../utils/machinePhysicsEngine';

export type MachineCatalogBrand =
  | 'Technogym'
  | 'Hammer Strength'
  | 'Panatta'
  | 'Nautilus'
  | 'Cybex'
  | 'Matrix'
  | 'Gym80'
  | 'Life Fitness'
  | 'Booty Builder'
  | 'Eleiko'
  | 'Estándar'
  | 'Genérica';

export interface CatalogMachineEntry {
  id: string; // ej. 'technogym_pure_chest_press'
  brand: MachineCatalogBrand;
  line?: string; // ej. 'Pure Strength', 'Iso-Lateral', 'Monolith'
  modelName: string; // ej. 'Press Plano de Discos'
  canonicalExerciseType: string; // ID exacto para backend/main.py
  muscleGroupLabel: string; // ej. 'Pectoral', 'Espalda', 'Cuádriceps', 'Glúteo'
  profile: MachineResistanceProfile;
  imageUrl?: string;
}

export const MACHINE_CATALOG: CatalogMachineEntry[] = [
  // 1. Technogym — Technogym Pure Strength - Pulldown
  {
    id: 'technogym_pure_pulldown',
    brand: 'Technogym',
    line: 'Pure Strength (Palancas convergentes)',
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
    muscleGroupLabel: 'Espalda Alta / Media',
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
    line: 'Pure Strength (Palancas convergentes)',
    modelName: 'Technogym Pure Strength - Row (Remo Dorian / Remo Horizontal a Discos)',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta / Media',
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
    muscleGroupLabel: 'Espalda Alta / Media',
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
    muscleGroupLabel: 'Espalda Baja / Lumbares',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Deadlift (Peso Muerto a Discos)'
    }),
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
    muscleGroupLabel: 'Espalda Alta / Media',
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
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Hack Squat'
    }),
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
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Belt Squat (Sentadilla con Cinturón a Discos)'
    }),
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
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Prensa de Piernas a Discos 45° (Pure Leg Press)'
    }),
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
    muscleGroupLabel: 'Isquios / Femoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection - Seated Leg Curl'
    }),
    imageUrl: '/machines/technogym_selection_leg_curl.png'
  },

  // 25. Hammer Strength — Hammer Strength - Kneeling Leg Curl (Femoral Tumbado / Unilateral)
  {
    id: 'hammer_kneeling_leg_curl',
    brand: 'Hammer Strength',
    line: 'Plate Loaded',
    modelName: 'Hammer Strength - Kneeling Leg Curl (Femoral Tumbado / Unilateral)',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquios / Femoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Kneeling Leg Curl (Femoral Tumbado / Unilateral)'
    }),
    imageUrl: '/machines/hammer_kneeling_leg_curl.png'
  },

  // 26. Hammer Strength — Hammer Strength - Glute Drive (Hip Thrust de Discos)
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

  // 27. Life Fitness — Life Fitness Signature - Back Extension (Espalda Baja / Lumbares)
  {
    id: 'lifefitness_back_extension',
    brand: 'Life Fitness',
    line: 'Signature Series',
    modelName: 'Life Fitness Signature - Back Extension (Espalda Baja / Lumbares)',
    canonicalExerciseType: 'back_extension',
    muscleGroupLabel: 'Espalda Baja / Lumbares',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Life Fitness',
      machineModelGuess: 'Life Fitness Signature - Back Extension (Espalda Baja / Lumbares)'
    }),
    imageUrl: '/machines/lifefitness_back_extension.png'
  },

  // 28. Hammer Strength — Hammer Strength Select - Back Extension (Extensión Lumbar en Torre)
  {
    id: 'hammer_back_extension',
    brand: 'Hammer Strength',
    line: 'Hammer Strength Select',
    modelName: 'Hammer Strength Select - Back Extension (Extensión Lumbar en Torre)',
    canonicalExerciseType: 'back_extension',
    muscleGroupLabel: 'Espalda Baja / Lumbares',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength Select - Back Extension (Extensión Lumbar en Torre)'
    }),
    imageUrl: '/machines/hammer_back_extension.png'
  },

  // 29. Hammer Strength — Hammer Strength - Plate-Loaded Seated Calf (Gemelos Sentado a Discos)
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

  // 30. Matrix — Matrix Versa - Calf Extension (Gemelos en Prensa de Placas)
  {
    id: 'matrix_versa_calf_extension',
    brand: 'Matrix',
    line: 'Versa Series',
    modelName: 'Matrix Versa - Calf Extension (Gemelos en Prensa de Placas)',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Gemelos',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Matrix',
      machineModelGuess: 'Matrix Versa - Calf Extension (Gemelos en Prensa de Placas)'
    }),
    imageUrl: '/machines/matrix_calf_extension.jpg'
  },

  // 31. Technogym — Technogym Selection - Total Abdominal Crunch
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

  // 32. Technogym — Technogym Selection 900 - Arm Curl (Predicador Bíceps)
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

  // 33. Hammer Strength — Hammer Strength - Plate-Loaded Seated Biceps (Banco Scott Discos)
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

  // 34. Life Fitness — Life Fitness Insignia - Seated Triceps Extension
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

  // 35. Hammer Strength — Hammer Strength - Seated Dip (Fondos Tríceps en Palanca)
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

  // 36. Technogym — Technogym Pure Strength - Shoulder Press
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

  // 37. Hammer Strength — Hammer Strength - Iso-Lateral Front Lat Pulldown
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

  // 38. Hammer Strength — Hammer Strength - Iso-Lateral DY Row
  {
    id: 'hammer_iso_dy_row',
    brand: 'Hammer Strength',
    line: 'Plate Loaded (Dorian Yates Style)',
    modelName: 'Hammer Strength - Iso-Lateral DY Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta / Media',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Iso-Lateral DY Row'
    }),
    imageUrl: '/machines/hammer_iso_dy_row.png'
  },

  // 39. Hammer Strength — Hammer Strength - Iso-Lateral Low Row
  {
    id: 'hammer_iso_low_row',
    brand: 'Hammer Strength',
    line: 'Plate Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral Low Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta / Media',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Iso-Lateral Low Row'
    }),
    imageUrl: '/machines/hammer_iso_low_row.png'
  },

  // 40. Hammer Strength — Hammer Strength - Iso-Lateral Bench Press
  {
    id: 'hammer_iso_wide_chest',
    brand: 'Hammer Strength',
    line: 'Plate Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral Bench Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Iso-Lateral Bench Press'
    }),
    imageUrl: '/machines/hammer_iso_wide_chest.png'
  },

  // 41. Hammer Strength — Hammer Strength - Iso-Lateral Incline Press
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

  // 42. Hammer Strength — Hammer Strength - Iso-Lateral Decline Press
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

  // 43. Hammer Strength — Hammer Strength - Linear Hack Squat (Sentadilla Hack a Discos)
  {
    id: 'hammer_linear_hack_squat',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Linear',
    modelName: 'Hammer Strength - Linear Hack Squat (Sentadilla Hack a Discos)',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Linear Hack Squat (Sentadilla Hack a Discos)'
    }),
    imageUrl: '/machines/hammer_linear_hack_squat.png'
  },

  // 44. Hammer Strength — Hammer Strength - Plate-Loaded V-Squat (Sentadilla V)
  {
    id: 'hammer_plate_loaded_v_squat',
    brand: 'Hammer Strength',
    line: 'Plate Loaded Series',
    modelName: 'Hammer Strength - Plate-Loaded V-Squat (Sentadilla V)',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Plate-Loaded V-Squat (Sentadilla V)'
    }),
    imageUrl: '/machines/hammer_plate_loaded_v_squat.png'
  },

  // 45. Hammer Strength — Hammer Strength - Iso-Lateral Leg Extension (Discos)
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

  // 46. Matrix — Matrix Ultra - Converging Chest Press
  {
    id: 'matrix_ultra_converging_chest',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S13)',
    modelName: 'Matrix Ultra - Converging Chest Press',
    canonicalExerciseType: 'machine_exercise',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Matrix',
      machineModelGuess: 'Matrix Ultra - Converging Chest Press'
    }),
    imageUrl: '/machines/matrix_ultra_converging_chest.jpg'
  },

  // 47. Matrix — Matrix Ultra - Diverging Lat Pulldown
  {
    id: 'matrix_ultra_diverging_lat_pulldown',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S33)',
    modelName: 'Matrix Ultra - Diverging Lat Pulldown',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'divergent',
      machineBrandGuess: 'Matrix',
      machineModelGuess: 'Matrix Ultra - Diverging Lat Pulldown'
    }),
    imageUrl: '/machines/matrix_ultra_diverging_lat_pulldown.jpg'
  },

  // 48. Matrix — Matrix Ultra - Diverging Seated Row
  {
    id: 'matrix_ultra_seated_row',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S34)',
    modelName: 'Matrix Ultra - Diverging Seated Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta / Media',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Matrix',
      machineModelGuess: 'Matrix Ultra - Diverging Seated Row'
    }),
    imageUrl: '/machines/matrix_ultra_seated_row.jpg'
  },

  // 49. Matrix — Matrix Ultra - Leg Extension
  {
    id: 'matrix_ultra_leg_extension',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S71)',
    modelName: 'Matrix Ultra - Leg Extension',
    canonicalExerciseType: 'leg_extension',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Matrix',
      machineModelGuess: 'Matrix Ultra - Leg Extension'
    }),
    imageUrl: '/machines/matrix_ultra_leg_extension.jpg'
  },

  // 50. Panatta — Panatta - Super Hack Squat 45°
  {
    id: 'panatta_super_hack_squat',
    brand: 'Panatta',
    line: 'Free Weight Special (1FW087)',
    modelName: 'Panatta - Super Hack Squat 45°',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta - Super Hack Squat 45°'
    }),
    imageUrl: '/machines/panatta_super_hack_squat.png'
  },

  // 51. Panatta — Panatta - Super High Row
  {
    id: 'panatta_super_high_row',
    brand: 'Panatta',
    line: 'Free Weight Special (1FW003)',
    modelName: 'Panatta - Super High Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta / Media',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta - Super High Row'
    }),
    imageUrl: '/machines/panatta_super_high_row.png'
  },

  // 52. Panatta — Panatta - Free Weight Incline Chest Press
  {
    id: 'panatta_incline_chest',
    brand: 'Panatta',
    line: 'Free Weight (1FW039)',
    modelName: 'Panatta - Free Weight Incline Chest Press',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta - Free Weight Incline Chest Press'
    }),
    imageUrl: '/machines/panatta_incline_chest.png'
  },

  // 53. Panatta — Panatta - Super Leg Press Bridge 45°
  {
    id: 'panatta_super_leg_press_bridge',
    brand: 'Panatta',
    line: 'Free Weight Special (1FW085)',
    modelName: 'Panatta - Super Leg Press Bridge 45°',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta - Super Leg Press Bridge 45°'
    }),
    imageUrl: '/machines/panatta_super_leg_press_bridge.png'
  },

  // 54. Panatta — Panatta - Viking Press & Standing Calf (Hombros & Gemelos)
  {
    id: 'panatta_viking_press_calf',
    brand: 'Panatta',
    line: 'Free Weight Special (1FW029)',
    modelName: 'Panatta - Viking Press & Standing Calf (Hombros & Gemelos)',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Hombros',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta - Viking Press & Standing Calf (Hombros & Gemelos)'
    }),
    imageUrl: '/machines/panatta_viking_press_calf.png'
  },

  // 55. Eleiko — Eleiko - Prestera Half Rack con Banco Regulable
  {
    id: 'eleiko_prestera_half_rack',
    brand: 'Eleiko',
    line: 'Prestera Strength System',
    modelName: 'Eleiko - Prestera Half Rack con Banco Regulable',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Eleiko',
      machineModelGuess: 'Eleiko - Prestera Half Rack con Banco Regulable'
    }),
    imageUrl: '/machines/eleiko_prestera_half_rack.png'
  },

  // 56. Eleiko — Eleiko - Prestera Power Rack
  {
    id: 'eleiko_power_rack',
    brand: 'Eleiko',
    line: 'Prestera Strength',
    modelName: 'Eleiko - Prestera Power Rack',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Eleiko',
      machineModelGuess: 'Eleiko - Prestera Power Rack'
    }),
    imageUrl: '/machines/eleiko_power_rack.png'
  },

  // 57. Eleiko — Eleiko - Olympic Flat Bench Press
  {
    id: 'eleiko_olympic_bench',
    brand: 'Eleiko',
    line: 'Powerlifting / IPF Certified',
    modelName: 'Eleiko - Olympic Flat Bench Press',
    canonicalExerciseType: 'machine_exercise',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Eleiko',
      machineModelGuess: 'Eleiko - Olympic Flat Bench Press'
    }),
    imageUrl: '/machines/eleiko_olympic_bench.png'
  },

  // 58. Technogym — Technogym Selection - Prone Leg Curl (Femoral Tumbado)
  {
    id: 'technogym_selection_prone_leg_curl',
    brand: 'Technogym',
    line: 'Selection 900 (Torre de placas)',
    modelName: 'Technogym Selection - Prone Leg Curl (Femoral Tumbado)',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquios / Femoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection - Prone Leg Curl (Femoral Tumbado)'
    }),
    imageUrl: '/machines/technogym_selection_prone_leg_curl.png'
  },

  // 59. Technogym — Technogym Pure Strength - Standing Leg Curl (Femoral de Pie a Discos)
  {
    id: 'technogym_pure_standing_leg_curl',
    brand: 'Technogym',
    line: 'Pure Strength (Discos)',
    modelName: 'Technogym Pure Strength - Standing Leg Curl (Femoral de Pie a Discos)',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquios / Femoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Standing Leg Curl (Femoral de Pie a Discos)'
    }),
    imageUrl: '/machines/technogym_pure_standing_leg_curl.png'
  },

  // 60. Panatta — Panatta Freeweight - Lying Leg Curl (Femoral Tumbado a Discos)
  {
    id: 'panatta_freeweight_lying_leg_curl',
    brand: 'Panatta',
    line: 'Freeweight HP (Carga de discos)',
    modelName: 'Panatta Freeweight - Lying Leg Curl (Femoral Tumbado a Discos)',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquios / Femoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Freeweight - Lying Leg Curl (Femoral Tumbado a Discos)'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=800&q=80'
  },

  // 61. Panatta — Panatta Monolith - Standing Abductor (Abducción de Glúteo de Pie)
  {
    id: 'panatta_monolith_standing_abductor',
    brand: 'Panatta',
    line: 'Monolith Selection',
    modelName: 'Panatta Monolith - Standing Abductor (Abducción de Glúteo de Pie)',
    canonicalExerciseType: 'abductor_machine',
    muscleGroupLabel: 'Glúteo',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Monolith - Standing Abductor (Abducción de Glúteo de Pie)'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  },

  // 62. Matrix — Matrix Ultra - Standing Glute & Abductor
  {
    id: 'matrix_ultra_standing_glute_kick',
    brand: 'Matrix',
    line: 'Ultra Series',
    modelName: 'Matrix Ultra - Standing Glute & Abductor',
    canonicalExerciseType: 'glute_kickback',
    muscleGroupLabel: 'Glúteo',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Matrix',
      machineModelGuess: 'Matrix Ultra - Standing Glute & Abductor'
    }),
    imageUrl: '/machines/technogym_pure_standing_glute.png'
  },

  // 63. Hammer Strength — Hammer Strength - Standing Calf Raise (Gemelos de Pie a Discos)
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

  // 64. Hammer Strength — Hammer Strength - Super Horizontal Calf (PL-SHC a Discos)
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

  // 65. Technogym — Technogym Selection - Standing Calf (Gemelos en Torre)
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

  // 66. Panatta — Panatta Super Scott - Preacher Biceps Curl (Banco Scott a Discos)
  {
    id: 'panatta_super_preacher_curl',
    brand: 'Panatta',
    line: 'Super Freeweight HP',
    modelName: 'Panatta Super Scott - Preacher Biceps Curl (Banco Scott a Discos)',
    canonicalExerciseType: 'biceps_curl',
    muscleGroupLabel: 'Bíceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Super Scott - Preacher Biceps Curl (Banco Scott a Discos)'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80'
  },

  // 67. Matrix — Matrix Ultra - Arm Biceps Curl (Palanca Guiada Independiente)
  {
    id: 'matrix_ultra_arm_curl',
    brand: 'Matrix',
    line: 'Ultra Series',
    modelName: 'Matrix Ultra - Arm Biceps Curl (Palanca Guiada Independiente)',
    canonicalExerciseType: 'biceps_curl',
    muscleGroupLabel: 'Bíceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Matrix',
      machineModelGuess: 'Matrix Ultra - Arm Biceps Curl (Palanca Guiada Independiente)'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80'
  },

  // 68. Technogym — Technogym Selection 900 - Seated Triceps Press (Tríceps Sentado de Placas / Seated Dip)
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

  // 69. Panatta — Panatta Monolith - Seated Triceps Dip (Fondos Guiados Convergentes)
  {
    id: 'panatta_monolith_triceps_dip',
    brand: 'Panatta',
    line: 'Monolith Selection',
    modelName: 'Panatta Monolith - Seated Triceps Dip (Fondos Guiados Convergentes)',
    canonicalExerciseType: 'triceps_extension',
    muscleGroupLabel: 'Tríceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'convergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Monolith - Seated Triceps Dip (Fondos Guiados Convergentes)'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  },

  // 70. Technogym — Technogym Pure Strength - Standing Glute Kickback
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

  // 71. Panatta — Panatta Freeweight - Circular Glute Kickback (Patada de Glúteo a Discos)
  {
    id: 'panatta_circular_glute_kickback',
    brand: 'Panatta',
    line: 'Freeweight HP',
    modelName: 'Panatta Freeweight - Circular Glute Kickback (Patada de Glúteo a Discos)',
    canonicalExerciseType: 'glute_kickback',
    muscleGroupLabel: 'Glúteo',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Freeweight - Circular Glute Kickback (Patada de Glúteo a Discos)'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  },

  // 72. Technogym — Technogym Pure Strength - Lateral Raise (Elevaciones Laterales en Máquina)
  {
    id: 'technogym_pure_lateral_raise',
    brand: 'Technogym',
    line: 'Pure Strength (Palancas convergentes)',
    modelName: 'Technogym Pure Strength - Lateral Raise (Elevaciones Laterales en Máquina)',
    canonicalExerciseType: 'lateral_raise',
    muscleGroupLabel: 'Hombros',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Pure Strength - Lateral Raise (Elevaciones Laterales en Máquina)'
    }),
    imageUrl: '/machines/technogym_pure_lateral_raise.png'
  },

  // 73. Matrix — Matrix Ultra - Lateral Raise (Deltoides Lateral Guiado en Torre)
  {
    id: 'matrix_ultra_lateral_raise',
    brand: 'Matrix',
    line: 'Ultra Series',
    modelName: 'Matrix Ultra - Lateral Raise (Deltoides Lateral Guiado en Torre)',
    canonicalExerciseType: 'lateral_raise',
    muscleGroupLabel: 'Hombros',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Matrix',
      machineModelGuess: 'Matrix Ultra - Lateral Raise (Deltoides Lateral Guiado en Torre)'
    }),
    imageUrl: '/machines/matrix_ultra_lateral_raise.png'
  },

  // 74. Panatta — Panatta Freeweight - 45° Hyperextension / Roman Chair (Banco Lumbar y Glúteo)
  {
    id: 'panatta_45_hyperextension_bench',
    brand: 'Panatta',
    line: 'Freeweight Pro',
    modelName: 'Panatta Freeweight - 45° Hyperextension / Roman Chair (Banco Lumbar y Glúteo)',
    canonicalExerciseType: 'back_extension',
    muscleGroupLabel: 'Espalda Baja / Lumbares',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Freeweight - 45° Hyperextension / Roman Chair (Banco Lumbar y Glúteo)'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80'
  },

  // 75. Technogym — Technogym Selection - Lower Back (Extensión Lumbar en Torre)
  {
    id: 'technogym_selection_lower_back',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Technogym Selection - Lower Back (Extensión Lumbar en Torre)',
    canonicalExerciseType: 'back_extension',
    muscleGroupLabel: 'Espalda Baja / Lumbares',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection - Lower Back (Extensión Lumbar en Torre)'
    }),
    imageUrl: '/machines/technogym_selection_lower_back.png'
  },

  // 76. Hammer Strength — Hammer Strength - Chest Supported T-Bar Row (Remo en T con Apoyo)
  {
    id: 'hammer_chest_supported_t_bar_row',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Ground Base',
    modelName: 'Hammer Strength - Chest Supported T-Bar Row (Remo en T con Apoyo)',
    canonicalExerciseType: 't_bar_row',
    muscleGroupLabel: 'Espalda Alta / Media',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Chest Supported T-Bar Row (Remo en T con Apoyo)'
    }),
    imageUrl: '/machines/hammer_chest_supported_t_bar_row.png'
  },

  // 77. Panatta — Panatta Freeweight - Super T-Bar Row Pectoral Support
  {
    id: 'panatta_super_t_bar_row',
    brand: 'Panatta',
    line: 'Super Freeweight HP',
    modelName: 'Panatta Freeweight - Super T-Bar Row Pectoral Support',
    canonicalExerciseType: 't_bar_row',
    muscleGroupLabel: 'Espalda Alta / Media',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Freeweight - Super T-Bar Row Pectoral Support'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'
  },

  // 78. Hammer Strength — Hammer Strength - Iso-Lateral Seated Row (Remo Sentado a Discos)
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
    imageUrl: '/machines/hammer_iso_low_row.png'
  },

  // 79. Panatta — Panatta Freeweight - Super Rowing a Discos (Remo Sentado Convergente)
  {
    id: 'panatta_super_rowing_plate',
    brand: 'Panatta',
    line: 'Super Freeweight HP',
    modelName: 'Panatta Freeweight - Super Rowing a Discos (Remo Sentado Convergente)',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Dorsales',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Freeweight - Super Rowing a Discos (Remo Sentado Convergente)'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80'
  },

  // 80. Technogym — Technogym Selection 900 - Low Row (Remo Bajo en Torre de Placas)
  {
    id: 'technogym_selection_low_row',
    brand: 'Technogym',
    line: 'Selection 900 (Torre de placas)',
    modelName: 'Technogym Selection 900 - Low Row (Remo Bajo en Torre de Placas)',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta / Media',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Technogym Selection 900 - Low Row (Remo Bajo en Torre de Placas)'
    }),
    imageUrl: '/machines/technogym_selection_low_row.png'
  },

  // 81. Technogym — Technogym Selection 900 - Seated Cable Row (Polea Baja de Remo)
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

  // 82. Hammer Strength — Hammer Strength - 45° Linear Plate-Loaded Leg Press (Prensa 45° a Discos)
  {
    id: 'hammer_plate_loaded_leg_press_45',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Linear',
    modelName: 'Hammer Strength - 45° Linear Plate-Loaded Leg Press (Prensa 45° a Discos)',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - 45° Linear Plate-Loaded Leg Press (Prensa 45° a Discos)'
    }),
    imageUrl: '/machines/hammer_plate_loaded_leg_press_45.png'
  },

  // 83. Panatta — Panatta Freeweight - Belt Squat a Discos (Sentadilla con Cinturón)
  {
    id: 'panatta_super_belt_squat',
    brand: 'Panatta',
    line: 'Super Freeweight HP',
    modelName: 'Panatta Freeweight - Belt Squat a Discos (Sentadilla con Cinturón)',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Freeweight - Belt Squat a Discos (Sentadilla con Cinturón)'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80'
  },

  // 84. Hammer Strength — Hammer Strength - Iso-Lateral Horizontal Bench Press a Discos
  {
    id: 'hammer_iso_bench_press_plate',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral Horizontal Bench Press a Discos',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Iso-Lateral Horizontal Bench Press a Discos'
    }),
    imageUrl: '/machines/hammer_iso_wide_chest.png'
  },

  // 85. Panatta — Panatta Super Freeweight - Pendulum Squat (Sentadilla Péndulo)
  {
    id: 'panatta_super_pendulum_squat',
    brand: 'Panatta',
    line: 'Super Freeweight HP',
    modelName: 'Panatta Super Freeweight - Pendulum Squat (Sentadilla Péndulo)',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Super Freeweight - Pendulum Squat (Sentadilla Péndulo)'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80'
  },

  // 86. Matrix — Matrix Ultra - Rotary Torso (Rotación de Torso y Oblicuos)
  {
    id: 'matrix_ultra_rotary_torso',
    brand: 'Matrix',
    line: 'Ultra Series',
    modelName: 'Matrix Ultra - Rotary Torso (Rotación de Torso y Oblicuos)',
    canonicalExerciseType: 'abdominal_crunch',
    muscleGroupLabel: 'Abdomen',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Matrix',
      machineModelGuess: 'Matrix Ultra - Rotary Torso (Rotación de Torso y Oblicuos)'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  },

  // 87. Technogym — Technogym Selection - Shoulder Press (Press Militar en Torre)
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

  // 88. Hammer Strength — Hammer Strength - Iso-Lateral Incline Press (Press Inclinado Palancas)
  {
    id: 'hammer_iso_incline_chest_press',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral Incline Press (Press Inclinado Palancas)',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Iso-Lateral Incline Press (Press Inclinado Palancas)'
    }),
    imageUrl: '/machines/hammer_iso_incline_press.png'
  },

  // 89. Life Fitness — Cinta Inclinada (Incline Treadmill Walk)
  {
    id: 'cardio_incline_treadmill',
    brand: 'Life Fitness',
    line: 'Elevation Series',
    modelName: 'Cinta Inclinada (Incline Treadmill Walk)',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Cardio',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Life Fitness',
      machineModelGuess: 'Cinta Inclinada (Incline Treadmill Walk)'
    }),
    imageUrl: '/machines/cardio_incline_treadmill.png'
  },

  // 90. Life Fitness — Bicicleta Estática / Spinning
  {
    id: 'cardio_stationary_bike',
    brand: 'Life Fitness',
    line: 'Integrity Series',
    modelName: 'Bicicleta Estática / Spinning',
    canonicalExerciseType: 'cardio',
    muscleGroupLabel: 'Cardio',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Life Fitness',
      machineModelGuess: 'Bicicleta Estática / Spinning'
    }),
    imageUrl: '/machines/cardio_bike.png'
  },

  // 91. Panatta — Panatta Freeweight - Super Pullover a Discos
  {
    id: 'panatta_super_pullover_machine',
    brand: 'Panatta',
    line: 'Super Freeweight Special',
    modelName: 'Panatta Freeweight - Super Pullover a Discos',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'divergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Freeweight - Super Pullover a Discos'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80'
  },

  // 92. Panatta — Panatta Monolith - Standing Leg Curl Unilateral
  {
    id: 'panatta_standing_unilateral_leg_curl',
    brand: 'Panatta',
    line: 'Monolith Plate & Pin',
    modelName: 'Panatta Monolith - Standing Leg Curl Unilateral',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquios / Femoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Monolith - Standing Leg Curl Unilateral'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=800&q=80'
  },

  // 93. Booty Builder — Booty Builder - Platinum Hip Thrust (Empuje de Cadera Guiado)
  {
    id: 'booty_builder_platinum',
    brand: 'Booty Builder',
    line: 'Platinum Commercial',
    modelName: 'Booty Builder - Platinum Hip Thrust (Empuje de Cadera Guiado)',
    canonicalExerciseType: 'hip_thrust',
    muscleGroupLabel: 'Glúteo',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Booty Builder',
      machineModelGuess: 'Booty Builder - Platinum Hip Thrust (Empuje de Cadera Guiado)'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80'
  },

  // 94. Booty Builder — Booty Builder - Standing Abductor (Abductor de Pie 45°)
  {
    id: 'booty_builder_standing_abductor',
    brand: 'Booty Builder',
    line: 'Standing Station',
    modelName: 'Booty Builder - Standing Abductor (Abductor de Pie 45°)',
    canonicalExerciseType: 'abductor_machine',
    muscleGroupLabel: 'Abductores',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Booty Builder',
      machineModelGuess: 'Booty Builder - Standing Abductor (Abductor de Pie 45°)'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80'
  },

  // 95. Technogym — Technogym Pure Strength - Biceps Curl a Discos
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

  // 96. Technogym — Technogym - Dual Adjustable Pulley (DAP / Polea Doble)
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

  // 97. Hammer Strength — Hammer Strength - Iso-Lateral Decline Press a Discos
  {
    id: 'hammer_iso_decline_press_plate',
    brand: 'Hammer Strength',
    line: 'Plate-Loaded Iso-Lateral',
    modelName: 'Hammer Strength - Iso-Lateral Decline Press a Discos',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Iso-Lateral Decline Press a Discos'
    }),
    imageUrl: '/machines/hammer_iso_decline_press.png'
  },

  // 98. Hammer Strength — Hammer Strength - Tibia Dorsi Flexion a Discos
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
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  },

  // 99. Gym80 — Gym80 - Pure Kraft Shrug Machine a Discos (Encogimientos)
  {
    id: 'gym80_pure_kraft_shrug_machine',
    brand: 'Gym80',
    line: 'Pure Kraft Plate-Loaded',
    modelName: 'Gym80 - Pure Kraft Shrug Machine a Discos (Encogimientos)',
    canonicalExerciseType: 'shrugs',
    muscleGroupLabel: 'Trapecio',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Gym80',
      machineModelGuess: 'Gym80 - Pure Kraft Shrug Machine a Discos (Encogimientos)'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'
  },

  // 100. Gym80 — Gym80 - Pure Kraft Seated Calf Raise a Discos
  {
    id: 'gym80_pure_kraft_seated_calf',
    brand: 'Gym80',
    line: 'Pure Kraft',
    modelName: 'Gym80 - Pure Kraft Seated Calf Raise a Discos',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Gym80',
      machineModelGuess: 'Gym80 - Pure Kraft Seated Calf Raise a Discos'
    }),
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  },

  // 101. Nautilus — Nitro Chest Press
  {
    id: 'nautilus_nitro_chest_press',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Nitro Chest Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'convergent',
      machineBrandGuess: 'Nautilus',
      machineModelGuess: 'Nitro Chest Press'
    }),
    imageUrl: '/machines/matrix_chest_press.jpg'
  },

  // 102. Nautilus — Leg Extension (Leva Excéntrica)
  {
    id: 'nautilus_leg_extension',
    brand: 'Nautilus',
    line: 'Nitro Plus',
    modelName: 'Leg Extension (Leva Excéntrica)',
    canonicalExerciseType: 'leg_extension',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Nautilus',
      machineModelGuess: 'Leg Extension (Leva Excéntrica)'
    }),
    imageUrl: '/machines/matrix_leg_extension.jpg'
  },

  // 103. Cybex — Eagle NX Row
  {
    id: 'cybex_eagle_row',
    brand: 'Cybex',
    line: 'Eagle NX',
    modelName: 'Eagle NX Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'divergent',
      machineBrandGuess: 'Cybex',
      machineModelGuess: 'Eagle NX Row'
    }),
    imageUrl: '/machines/matrix_ultra_seated_row.jpg'
  },

  // ==========================================
  // MÁQUINAS ESTÁNDAR (Gimnasio Sin Marca / Barrial)
  // ==========================================
{
    id: 'standard_chest_press',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Press Pecho en Máquina (Placas / Discos)',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    imageUrl: '/machines/technogym_selection_chest_press.png',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'circular_cam_constant',
      pathType: 'linear_fixed',
      peakZone: 'uniform',
      resistanceCurveDescription: 'Máquina de placas estándar guiada con tensión equilibrada en todo el recorrido articular.',
      curveWeights: { stretch: 0.334, mid: 0.333, shortened: 0.333 },
      curveLabel: 'Uniforme · Tensión Constante'
    }
  },
  {
    id: 'standard_incline_press',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Press Inclinado en Máquina',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    imageUrl: '/machines/panatta_incline_chest.jpg',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Palanca convergente de 30° con mayor momento resistente cerca del bloqueo superior.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Convergente'
    }
  },
  {
    id: 'standard_pec_deck',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Peck Deck / Aperturas en Máquina',
    canonicalExerciseType: 'pec_deck',
    muscleGroupLabel: 'Pectoral',
    imageUrl: '/machines/technogym_selection_pec_deck.jpg',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Aperturas guiadas con leva circular; momento máximo cuando los brazos quedan perpendiculares al torso.',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Pico a 90°'
    }
  },
  {
    id: 'standard_seated_row',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Remo Sentado en Máquina (Apoyo al Pecho)',
    canonicalExerciseType: 'row_machine',
    muscleGroupLabel: 'Espalda',
    imageUrl: '/machines/technogym_selection_low_row.jpg',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'circular_cam_constant',
      pathType: 'linear_fixed',
      peakZone: 'mid',
      resistanceCurveDescription: 'Tracción horizontal guiada con soporte esternal para aislar dorsal y retractores escapulares.',
      curveWeights: { stretch: 0.25, mid: 0.40, shortened: 0.35 },
      curveLabel: 'Campana · Rango Medio'
    }
  },
  {
    id: 'standard_lat_pulldown',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Jalón al Pecho en Máquina',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Espalda',
    imageUrl: '/machines/matrix_lat_pulldown.jpg',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'circular_cam_constant',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Tracción vertical guiada por cable o palancas; mayor tensión con los brazos en máxima elevación.',
      curveWeights: { stretch: 0.40, mid: 0.35, shortened: 0.25 },
      curveLabel: 'Descendente · Foco Estiramiento'
    }
  },
  {
    id: 'standard_shoulder_press',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Press de Hombro en Máquina',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Deltoides',
    imageUrl: '/machines/technogym_selection_shoulder_press.jpg',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'circular_cam_constant',
      pathType: 'linear_fixed',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Empuje vertical guiado con curva ligeramente ascendente hacia el bloqueo de codos.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Bloqueo'
    }
  },
  {
    id: 'standard_lateral_raise',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Elevaciones Laterales en Máquina',
    canonicalExerciseType: 'lateral_raise',
    muscleGroupLabel: 'Deltoides',
    imageUrl: '/machines/technogym_selection_lateral_raise.jpg',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Brazo de palanca con leva diseñada para exigir máxima tensión en abducción a 90°.',
      curveWeights: { stretch: 0.20, mid: 0.35, shortened: 0.45 },
      curveLabel: 'Ascendente · Acortamiento Deltoides'
    }
  },
  {
    id: 'standard_leg_press_45',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Prensa de Piernas Inclinada 45°',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    imageUrl: '/machines/hammer_plate_loaded_leg_press_45.png',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Trineo lineal a 45°; máxima demanda de fuerza en flexión profunda de rodilla y cadera.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    }
  },
  {
    id: 'standard_hack_squat',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Sentadilla Hack (Hack Squat 45°)',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    imageUrl: '/machines/hammer_linear_hack_squat.png',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Plataforma guiada con apoyo lumbar completo; máximo momento flexor de rodilla en el punto de inversión.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    }
  },
  {
    id: 'standard_leg_extension',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Extensión de Cuádriceps en Máquina',
    canonicalExerciseType: 'leg_extension',
    muscleGroupLabel: 'Cuádriceps',
    imageUrl: '/machines/matrix_leg_extension.jpg',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Aislamiento de cuádriceps en cadena abierta con leva orientada a pico en extensión terminal.',
      curveWeights: { stretch: 0.20, mid: 0.35, shortened: 0.45 },
      curveLabel: 'Ascendente · Bloqueo Cuádriceps'
    }
  },
  {
    id: 'standard_seated_leg_curl',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Curl Femoral Sentado en Máquina',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquios',
    imageUrl: '/machines/technogym_selection_leg_curl.jpg',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'circular_arc',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Cadera flexionada a 90° que elonga los isquiosurales; máxima sobrecarga en posición estirada.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    }
  },
  {
    id: 'standard_lying_leg_curl',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Curl Femoral Tumbado en Máquina',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquios',
    imageUrl: '/machines/technogym_selection_prone_leg_curl.jpg',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Posición prona con leva circular; momento máximo a 90° de flexión de rodilla.',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Rango Medio 90°'
    }
  },
  {
    id: 'standard_abductor_machine',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Máquina de Abductores (Abrir Piernas)',
    canonicalExerciseType: 'abductor_machine',
    muscleGroupLabel: 'Glúteo',
    imageUrl: '/machines/technogym_selection_abductor.jpg',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Aislamiento de glúteo medio y tensor de la fascia lata con mayor resistencia en abducción total.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Acortamiento Glúteo Medio'
    }
  },
  {
    id: 'standard_adductor_machine',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Máquina de Aductores (Cerrar Piernas)',
    canonicalExerciseType: 'adductor_machine',
    muscleGroupLabel: 'Aductores',
    imageUrl: '/machines/technogym_selection_adductor.jpg',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Aducción guiada de cadera con pico de contracción al juntar las rodillas.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Contracción Aductores'
    }
  },
  {
    id: 'standard_hip_thrust_machine',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Hip Thrust en Máquina (Cinturón / Almohadilla)',
    canonicalExerciseType: 'hip_thrust',
    muscleGroupLabel: 'Glúteo',
    imageUrl: '/machines/technogym_selection_hip_thrust.png',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Palanca de extensión de cadera que sitúa el pico absoluto de tensión en el bloqueo pélvico superior.',
      curveWeights: { stretch: 0.15, mid: 0.30, shortened: 0.55 },
      curveLabel: 'Ascendente Pico · Bloqueo Glúteo'
    }
  },
  {
    id: 'standard_seated_calf',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Gemelo Sentado en Máquina (Sóleo a Discos)',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    imageUrl: '/machines/hammer_seated_calf_raise.jpg',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Rodillas flexionadas a 90° para desactivar gastrocnemio y sobrecargar sóleo en máxima dorsiflexión.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Sóleo Estirado'
    }
  },
  {
    id: 'standard_standing_calf',
    brand: 'Estándar',
    line: 'Gimnasio Estándar',
    modelName: 'Gemelo de Pie en Máquina (Placas / Hombros)',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    imageUrl: '/machines/technogym_selection_standing_calf.jpg',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'circular_cam_constant',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Rodillas extendidas para enfatizar gastrocnemio medial y lateral con parada en estiramiento.',
      curveWeights: { stretch: 0.40, mid: 0.35, shortened: 0.25 },
      curveLabel: 'Descendente · Estiramiento Gastrocnemio'
    }
  }
];

export function getCustomMachines(): CatalogMachineEntry[] {
  try {
    const raw = localStorage.getItem('mia_custom_machines_catalog');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      id: item.id || `custom_${Date.now()}`,
      brand: (item.brand as MachineCatalogBrand) || 'Genérica',
      modelName: item.name || 'Máquina Personalizada',
      line: 'Personalizada',
      canonicalExerciseType: item.canonicalExerciseType || 'chest_press_machine',
      muscleGroupLabel: item.muscleGroupLabel || 'Musculación',
      profile: item.profile || classifyMachineResistanceProfile({
        loadType: 'plate_loaded',
        pivotBehavior: 'opens_to_horizontal_gain'
      })
    }));
  } catch (e) {
    return [];
  }
}

export function getAllCatalogMachines(): CatalogMachineEntry[] {
  return [...MACHINE_CATALOG, ...getCustomMachines()];
}

export function searchCatalogMachines(query: string = '', brand?: string): CatalogMachineEntry[] {
  let list = getAllCatalogMachines();
  if (brand && brand !== 'Todas') {
    const bLower = brand.toLowerCase();
    list = list.filter(m => m.brand.toLowerCase() === bLower);
  }
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter(m =>
      m.modelName.toLowerCase().includes(q) ||
      m.brand.toLowerCase().includes(q) ||
      m.canonicalExerciseType.toLowerCase().includes(q) ||
      m.muscleGroupLabel.toLowerCase().includes(q) ||
      (m.line && m.line.toLowerCase().includes(q))
    );
  }
  return list;
}

export function getMachineById(id: string): CatalogMachineEntry | undefined {
  if (!id) return undefined;
  return getAllCatalogMachines().find(m => m.id === id);
}

export function resolveCatalogMachine(exercise?: {
  id?: string;
  exercise_template_id?: string;
  title?: string;
  name?: string;
  brand?: string;
  catalog_machine_id?: string;
  muscle_group?: string;
}): CatalogMachineEntry | undefined {
  if (!exercise) return undefined;

  // 1. Explicit catalog_machine_id
  if (exercise.catalog_machine_id) {
    const found = getMachineById(exercise.catalog_machine_id);
    if (found) return found;
  }

  // 2. Direct ID or exercise_template_id match
  const rawId = (exercise.exercise_template_id || exercise.id || '').toLowerCase().trim();
  if (rawId) {
    const found = getMachineById(rawId);
    if (found) return found;
  }

  // 3. Search in all catalog machines
  const all = getAllCatalogMachines();
  const directMatch = all.find(m => m.id.toLowerCase() === rawId);
  if (directMatch) return directMatch;

  // 4. Heuristic semantic match by Brand + Model Name
  const title = (exercise.title || exercise.name || '').toLowerCase();
  const brand = (exercise.brand || '').toLowerCase();

  // Technogym
  if (brand.includes('technogym') || title.includes('technogym')) {
    if (title.includes('chest') || title.includes('pecho') || rawId.includes('chest_press')) {
      if (title.includes('inclin')) return getMachineById('technogym_pure_incline_press');
      return getMachineById('technogym_pure_chest_press');
    }
    if (title.includes('shoulder') || title.includes('hombro')) return getMachineById('technogym_pure_shoulder_press');
    if (title.includes('low row') || title.includes('remo bajo')) return getMachineById('technogym_pure_low_row');
    if (title.includes('dorian') || title.includes('row')) return getMachineById('technogym_pure_row_dorian') || getMachineById('technogym_pure_low_row');
    if (title.includes('t-bar') || title.includes('t_bar')) return getMachineById('technogym_pure_t_bar_row');
    if (title.includes('pulldown') || title.includes('jalon') || title.includes('jalón')) return getMachineById('technogym_pure_pulldown');
    if (title.includes('leg press') || title.includes('prensa')) return getMachineById('technogym_pure_leg_press');
    if (title.includes('hip thrust')) return getMachineById('technogym_pure_hip_thrust');
    if (title.includes('biceps') || title.includes('curl')) return getMachineById('technogym_pure_biceps_curl');
    if (title.includes('extension') || title.includes('extensión')) return getMachineById('technogym_selection_leg_extension');
    if (title.includes('curl') && (title.includes('femoral') || title.includes('leg'))) return getMachineById('technogym_selection_leg_curl');
  }

  // Hammer Strength
  if (brand.includes('hammer') || title.includes('hammer')) {
    if (title.includes('inclin')) return getMachineById('hammer_iso_incline_press');
    if (title.includes('declin')) return getMachineById('hammer_iso_decline_press');
    if (title.includes('chest') || title.includes('bench') || title.includes('pecho')) return getMachineById('hammer_iso_chest_press');
    if (title.includes('shoulder') || title.includes('hombro')) return getMachineById('hammer_iso_shoulder_press');
    if (title.includes('dy row')) return getMachineById('hammer_iso_dy_row');
    if (title.includes('high row')) return getMachineById('hammer_iso_high_row');
    if (title.includes('pulldown') || title.includes('jalon')) return getMachineById('hammer_iso_pulldown');
    if (title.includes('leg press') || title.includes('prensa')) return getMachineById('technogym_pure_leg_press');
  }

  // Panatta
  if (brand.includes('panatta') || title.includes('panatta')) {
    if (title.includes('inclin')) return getMachineById('panatta_super_incline_press');
    if (title.includes('horizontal') || title.includes('bench')) return getMachineById('panatta_super_horizontal_bench');
    if (title.includes('high row') || title.includes('remo')) return getMachineById('panatta_super_high_row');
    if (title.includes('flight') || title.includes('lateral')) return getMachineById('panatta_standing_multi_flight');
  }

  // Nautilus
  if (brand.includes('nautilus') || title.includes('nautilus')) {
    if (title.includes('chest') || title.includes('press')) return getMachineById('nautilus_nitro_chest_press');
    if (title.includes('extension') || title.includes('extensión')) return getMachineById('nautilus_leg_extension');
  }

  // Matrix
  if (brand.includes('matrix') || title.includes('matrix')) {
    if (title.includes('lateral') || title.includes('hombro')) return getMachineById('matrix_lateral_raise');
    if (title.includes('chest') || title.includes('press')) return getMachineById('matrix_converging_chest_press');
  }

  // Cybex
  if (brand.includes('cybex') || title.includes('cybex')) {
    if (title.includes('row') || title.includes('remo')) return getMachineById('cybex_eagle_row');
  }

  // Gym80
  if (brand.includes('gym80') || title.includes('gym80')) {
    if (title.includes('chest') || title.includes('press')) return getMachineById('gym80_sygnum_chest_press');
  }

  return undefined;
}

export function getDefaultProfileForExerciseType(exerciseTypeOrId: string): MachineResistanceProfile {
  const id = (exerciseTypeOrId || '').toLowerCase().trim();

  // RDL / Peso Muerto Rumano -> 55/30/15 Estiramiento
  if (id.includes('rdl') || id.includes('deadlift')) {
    return {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Máximo brazo de momento en flexión profunda de cadera; disminuye al extenderse.',
      curveWeights: { stretch: 0.55, mid: 0.30, shortened: 0.15 },
      curveLabel: 'Descendente · Pico en Estiramiento'
    };
  }

  // Hip Thrust / Glute Bridge -> 15/30/55 Acortamiento
  if (id.includes('thrust') || id.includes('bridge') || id.includes('kickback') || id.includes('abduction')) {
    return {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'La resistencia es máxima en extensión completa de cadera.',
      curveWeights: { stretch: 0.15, mid: 0.30, shortened: 0.55 },
      curveLabel: 'Ascendente · Pico en Acortamiento'
    };
  }

  // Extensión de Cuádriceps -> 15/35/50 Acortamiento
  if (id.includes('leg_extension') || id.includes('extension_cuadriceps')) {
    return {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'La palanca de la espinilla se vuelve perpendicular a la gravedad en extensión completa.',
      curveWeights: { stretch: 0.15, mid: 0.35, shortened: 0.50 },
      curveLabel: 'Ascendente · Pico en Acortamiento'
    };
  }

  // Curl Femoral Sentado -> 50/35/15 Estiramiento
  if (id.includes('seated_leg_curl') || id.includes('curl_femoral_sentado')) {
    return {
      loadType: 'selectorized_stack',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'circular_arc',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Cadera flexionada a 90° genera máximo estiramiento e insuficiencia pasiva en elongación.',
      curveWeights: { stretch: 0.50, mid: 0.35, shortened: 0.15 },
      curveLabel: 'Descendente · Pico en Estiramiento'
    };
  }

  // Curl Femoral Tumbado -> 25/50/25 Campana
  if (id.includes('lying_leg_curl')) {
    return {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Leva excéntrica con par máximo en 90° de flexión de rodilla.',
      curveWeights: { stretch: 0.25, mid: 0.50, shortened: 0.25 },
      curveLabel: 'Campana · Pico a 90°'
    };
  }

  // Sentadilla / Hack / Prensa -> 45/35/20 Estiramiento-Media
  if (id.includes('squat') || (id.includes('press') && id.includes('leg')) || id.includes('hack')) {
    return {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Máximo brazo de momento en cadera y rodilla en el punto de máxima flexión.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Estiramiento y Media'
    };
  }

  // Press Convergente genérico -> 25/35/40
  if (id.includes('chest_press_machine') || id.includes('machine_chest_press') || id.includes('converg')) {
    return {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Palanca convergente que refuerza el estiramiento y mantiene el pico en aducción final.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente suavizado · Convergente'
    };
  }

  // Press Banca Barra -> 45/35/20
  if (id.includes('bench_press') || id.includes('incline_press') || id.includes('dips')) {
    return {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Máxima exigencia de torque en hombro y codo con la barra en el pecho; se aligera al bloquear.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Pico en Estiramiento'
    };
  }

  // Cruces / Peck Deck -> 30/40/30
  if (id.includes('pec_deck') || id.includes('cable_fly') || id.includes('fly')) {
    return {
      loadType: 'cable_pulley',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Arco circular con brazo de palanca estable y máxima activación en el punto medio del recorrido.',
      curveWeights: { stretch: 0.30, mid: 0.40, shortened: 0.30 },
      curveLabel: 'Campana · Pico en Punto Medio'
    };
  }

  // Remo en Barra / Mancuerna -> 20/35/45
  if (id.includes('barbell_row') || id.includes('dumbbell_row') || id.includes('t_bar_row')) {
    return {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Brazo de momento de la carga aumenta conforme la tracción se aproxima al torso.',
      curveWeights: { stretch: 0.20, mid: 0.35, shortened: 0.45 },
      curveLabel: 'Ascendente · Pico en Acortamiento'
    };
  }

  // Jalón al Pecho -> 40/35/25
  if (id.includes('lat_pulldown') || id.includes('pullup') || id.includes('pullover')) {
    return {
      loadType: 'cable_pulley',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'La línea del cable crea máxima tracción con brazos elevados en estiramiento dorsal completo.',
      curveWeights: { stretch: 0.40, mid: 0.35, shortened: 0.25 },
      curveLabel: 'Descendente suave · Estiramiento'
    };
  }

  // Remo en Máquina / Sentado -> 25/40/35
  if (id.includes('seated_row') || id.includes('machine_row') || id.includes('cable_row')) {
    return {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'divergent',
      peakZone: 'mid',
      resistanceCurveDescription: 'Resistencia repartida con pico óptimo en fase media y retracción escapular.',
      curveWeights: { stretch: 0.25, mid: 0.40, shortened: 0.35 },
      curveLabel: 'Campana / Acortamiento'
    };
  }

  // Elevaciones Laterales Mancuerna -> 15/35/50
  if (id.includes('lateral_raise') && !id.includes('cable')) {
    return {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Brazo de palanca horizontal máximo a 90° de abducción; nulo en posición colgada.',
      curveWeights: { stretch: 0.15, mid: 0.35, shortened: 0.50 },
      curveLabel: 'Ascendente · Pico en Acortamiento'
    };
  }

  // Elevaciones Laterales Polea -> 33/34/33
  if (id.includes('cable_lateral_raise')) {
    return {
      loadType: 'cable_pulley',
      pivotBehavior: 'circular_cam_constant',
      pathType: 'circular_arc',
      peakZone: 'uniform',
      resistanceCurveDescription: 'Polea baja cruzada que mantiene el cable perpendicular en todo el rango.',
      curveWeights: { stretch: 0.334, mid: 0.333, shortened: 0.333 },
      curveLabel: 'Uniforme · Tensión Constante'
    };
  }

  // Curl Bíceps Barra / Mancuerna -> 25/50/25
  if (id.includes('biceps_curl') || id.includes('hammer_curl') || id.includes('preacher_curl')) {
    return {
      loadType: 'plate_loaded',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Brazo de momento máximo con antebrazo a 90° respecto al suelo; decae arriba y abajo.',
      curveWeights: { stretch: 0.25, mid: 0.50, shortened: 0.25 },
      curveLabel: 'Campana · Pico a 90°'
    };
  }

  // Extensión Tríceps Polea -> 25/40/35
  if (id.includes('triceps') || id.includes('face_pull')) {
    return {
      loadType: 'cable_pulley',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Polea con ángulo ideal en la mitad del empuje hacia el bloqueo articular.',
      curveWeights: { stretch: 0.25, mid: 0.40, shortened: 0.35 },
      curveLabel: 'Campana / Acortamiento'
    };
  }

  // Default fallback -> 33/34/33 Uniform
  return {
    loadType: 'selectorized_stack',
    pivotBehavior: 'circular_cam_constant',
    pathType: 'linear_fixed',
    peakZone: 'uniform',
    resistanceCurveDescription: 'Tensión constante distribuida en todo el rango de movimiento.',
    curveWeights: { stretch: 0.334, mid: 0.333, shortened: 0.333 },
    curveLabel: 'Uniforme · Tensión Constante'
  };
}
