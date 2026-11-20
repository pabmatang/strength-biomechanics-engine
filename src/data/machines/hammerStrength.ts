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
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Linear Hack Squat (Sentadilla Hack a Discos)'
    }),
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
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Hammer Strength - Plate-Loaded V-Squat (Sentadilla V)'
    }),
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
    imageUrl: '/machines/hammer_iso_low_row.png'
  },

  // 20. Hammer Strength — Hammer Strength - 45° Linear Plate-Loaded Leg Press (Prensa 45° a Discos)
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
  }
];
