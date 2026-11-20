// ==========================================
// CHΔNCE MACHINE CATALOG - PANATTA
// ==========================================

import { type CatalogMachineEntry } from '../machineCatalog';
import { classifyMachineResistanceProfile } from '../../utils/machinePhysicsEngine';

export const PANATTA_MACHINES: CatalogMachineEntry[] = [
  // 1. Panatta — Panatta - Super Hack Squat 45°
  {
    id: 'panatta_super_hack_squat',
    brand: 'Panatta',
    line: 'Free Weight Special (1FW087)',
    modelName: 'Panatta - Super Hack Squat 45°',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta - Super Hack Squat 45°'
    }),
    imageUrl: '/machines/panatta_super_hack_squat.png'
  },

  // 2. Panatta — Panatta - Super High Row
  {
    id: 'panatta_super_high_row',
    brand: 'Panatta',
    line: 'Free Weight Special (1FW003)',
    modelName: 'Panatta - Super High Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta - Super High Row'
    }),
    imageUrl: '/machines/panatta_super_high_row.png'
  },

  // 3. Panatta — Panatta - Free Weight Incline Chest Press
  {
    id: 'panatta_incline_chest',
    brand: 'Panatta',
    line: 'Free Weight (1FW039)',
    modelName: 'Panatta - Free Weight Incline Chest Press',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta - Free Weight Incline Chest Press'
    }),
    imageUrl: '/machines/panatta_incline_chest.png'
  },

  // 4. Panatta — Panatta - Super Leg Press Bridge 45°
  {
    id: 'panatta_super_leg_press_bridge',
    brand: 'Panatta',
    line: 'Free Weight Special (1FW085)',
    modelName: 'Panatta - Super Leg Press Bridge 45°',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta - Super Leg Press Bridge 45°'
    }),
    imageUrl: '/machines/panatta_super_leg_press_bridge.png'
  },

  // 5. Panatta — Panatta - Viking Press & Standing Calf (Hombros & Gemelos)
  {
    id: 'panatta_viking_press_calf',
    brand: 'Panatta',
    line: 'Free Weight Special (1FW029)',
    modelName: 'Panatta - Viking Press & Standing Calf (Hombros & Gemelos)',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Hombros',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta - Viking Press & Standing Calf (Hombros & Gemelos)'
    }),
    imageUrl: '/machines/panatta_viking_press_calf.png'
  },

  // 6. Panatta — Panatta Freeweight - Lying Leg Curl (Femoral Tumbado a Discos)
  {
    id: 'panatta_freeweight_lying_leg_curl',
    brand: 'Panatta',
    line: 'Freeweight HP (Carga de discos)',
    modelName: 'Panatta Freeweight - Lying Leg Curl (Femoral Tumbado a Discos)',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Freeweight - Lying Leg Curl (Femoral Tumbado a Discos)'
    }),
    imageUrl: null
  },

  // 7. Panatta — Panatta Monolith - Standing Abductor (Abducción de Glúteo de Pie)
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
    imageUrl: null
  },

  // 8. Panatta — Panatta Super Scott - Preacher Biceps Curl (Banco Scott a Discos)
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
    imageUrl: null
  },

  // 9. Panatta — Panatta Monolith - Seated Triceps Dip (Fondos Guiados Convergentes)
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
    imageUrl: null
  },

  // 10. Panatta — Panatta Freeweight - Circular Glute Kickback (Patada de Glúteo a Discos)
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
    imageUrl: null
  },

  // 11. Panatta — Panatta Freeweight - 45° Hyperextension / Roman Chair (Banco Lumbar y Glúteo)
  {
    id: 'panatta_45_hyperextension_bench',
    brand: 'Panatta',
    line: 'Freeweight Pro',
    modelName: 'Panatta Freeweight - 45° Hyperextension / Roman Chair (Banco Lumbar y Glúteo)',
    canonicalExerciseType: 'back_extension',
    muscleGroupLabel: 'Lumbares',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Freeweight - 45° Hyperextension / Roman Chair (Banco Lumbar y Glúteo)'
    }),
    imageUrl: null
  },

  // 12. Panatta — Panatta Freeweight - Super T-Bar Row Pectoral Support
  {
    id: 'panatta_super_t_bar_row',
    brand: 'Panatta',
    line: 'Super Freeweight HP',
    modelName: 'Panatta Freeweight - Super T-Bar Row Pectoral Support',
    canonicalExerciseType: 't_bar_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Freeweight - Super T-Bar Row Pectoral Support'
    }),
    imageUrl: null
  },

  // 13. Panatta — Panatta Freeweight - Super Rowing a Discos (Remo Sentado Convergente)
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
    imageUrl: null
  },

  // 14. Panatta — Panatta Freeweight - Belt Squat a Discos (Sentadilla con Cinturón)
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
    imageUrl: null
  },

  // 15. Panatta — Panatta Super Freeweight - Pendulum Squat (Sentadilla Péndulo)
  {
    id: 'panatta_super_pendulum_squat',
    brand: 'Panatta',
    line: 'Super Freeweight HP',
    modelName: 'Panatta Super Freeweight - Pendulum Squat (Sentadilla Péndulo)',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Super Freeweight - Pendulum Squat (Sentadilla Péndulo)'
    }),
    imageUrl: null
  },

  // 16. Panatta — Panatta Freeweight - Super Pullover a Discos
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
    imageUrl: null
  },

  // 17. Panatta — Panatta Monolith - Standing Leg Curl Unilateral
  {
    id: 'panatta_standing_unilateral_leg_curl',
    brand: 'Panatta',
    line: 'Monolith Plate & Pin',
    modelName: 'Panatta Monolith - Standing Leg Curl Unilateral',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Monolith - Standing Leg Curl Unilateral'
    }),
    imageUrl: null
  }
];
