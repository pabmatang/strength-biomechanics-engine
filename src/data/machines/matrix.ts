// ==========================================
// CHΔNCE MACHINE CATALOG - MATRIX
// ==========================================

import { type CatalogMachineEntry } from '../machineCatalog';
import { classifyMachineResistanceProfile } from '../../utils/machinePhysicsEngine';

export const MATRIX_MACHINES: CatalogMachineEntry[] = [
  // 1. Matrix — Matrix Versa - Calf Extension (Gemelos en Prensa de Placas)
  {
    id: 'matrix_versa_calf_extension',
    brand: 'Matrix',
    line: 'Versa Series',
    modelName: 'Matrix Versa - Calf Extension (Gemelos en Prensa de Placas)',
    canonicalExerciseType: 'calf_raise',
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

  // 2. Matrix — Matrix Ultra - Converging Chest Press
  {
    id: 'matrix_ultra_converging_chest',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S13)',
    modelName: 'Matrix Ultra - Converging Chest Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Matrix',
      machineModelGuess: 'Ultra Converging Chest Press'
    }),
    imageUrl: '/machines/matrix_ultra_converging_chest.jpg'
  },

  // 3. Matrix — Matrix Ultra - Diverging Lat Pulldown
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

  // 4. Matrix — Matrix Ultra - Diverging Seated Row
  {
    id: 'matrix_ultra_seated_row',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S34)',
    modelName: 'Matrix Ultra - Diverging Seated Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Matrix',
      machineModelGuess: 'Matrix Ultra - Diverging Seated Row'
    }),
    imageUrl: '/machines/matrix_ultra_seated_row.jpg'
  },

  // 5. Matrix — Matrix Ultra - Leg Extension
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

  // 6. Matrix — Matrix Ultra - Standing Glute & Abductor
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
    imageUrl: null
  },

  // 7. Matrix — Matrix Ultra - Arm Biceps Curl (Palanca Guiada Independiente)
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
    imageUrl: null
  },

  // 8. Matrix — Matrix Ultra - Lateral Raise (Deltoides Lateral Guiado en Torre)
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

  // 9. Matrix — Matrix Ultra - Rotary Torso (Rotación de Torso y Oblicuos)
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
    imageUrl: null
  }
];
