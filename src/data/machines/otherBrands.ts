// ==========================================
// CHΔNCE MACHINE CATALOG - OTRAS MARCAS COMERCIALES (BOOTY BUILDER, CYBEX, ELEIKO, GYM80)
// ==========================================

import { type CatalogMachineEntry } from '../machineCatalog';
import { classifyMachineResistanceProfile } from '../../utils/machinePhysicsEngine';

export const OTHER_BRANDS_MACHINES: CatalogMachineEntry[] = [
  // 1. Eleiko — Eleiko - Prestera Half Rack con Banco Regulable
  {
    id: 'eleiko_prestera_half_rack',
    brand: 'Eleiko',
    line: 'Prestera Strength System',
    modelName: 'Eleiko - Prestera Half Rack con Banco Regulable',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'free_weight',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Eleiko',
      machineModelGuess: 'Eleiko - Prestera Half Rack con Banco Regulable'
    }),
    imageUrl: '/machines/eleiko_prestera_half_rack.png'
  },

  // 2. Eleiko — Eleiko - Prestera Power Rack
  {
    id: 'eleiko_power_rack',
    brand: 'Eleiko',
    line: 'Prestera Strength',
    modelName: 'Eleiko - Prestera Power Rack',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'free_weight',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Eleiko',
      machineModelGuess: 'Eleiko - Prestera Power Rack'
    }),
    imageUrl: '/machines/eleiko_power_rack.png'
  },

  // 3. Eleiko — Eleiko - Olympic Flat Bench Press
  {
    id: 'eleiko_olympic_bench',
    brand: 'Eleiko',
    line: 'Powerlifting / IPF Certified',
    modelName: 'Eleiko - Olympic Flat Bench Press',
    canonicalExerciseType: 'bench_press',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'free_weight',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Press de banca con barra olímpica: máximo momento en estiramiento sobre el pecho.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/eleiko_olympic_bench.png'
  },

  // 4. Booty Builder — Booty Builder - Platinum Hip Thrust (Empuje de Cadera Guiado)
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
    imageUrl: '/machines/booty_builder_platinum.png'
  },

  // 5. Booty Builder — Booty Builder - Standing Abductor (Abductor de Pie 45°)
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
    imageUrl: '/machines/booty_builder_standing_abductor.png'
  },

  // 6. Gym80 — Gym80 - Pure Kraft Shrug Machine a Discos (Encogimientos)
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
    imageUrl: '/machines/gym80_pure_kraft_shrug_machine.png'
  },

  // 7. Gym80 — Gym80 - Pure Kraft Seated Calf Raise a Discos
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
    imageUrl: '/machines/gym80_pure_kraft_seated_calf.png'
  },

  // 8. Cybex — Eagle NX Row
  {
    id: 'cybex_eagle_row',
    brand: 'Cybex',
    line: 'Eagle NX',
    modelName: 'Eagle NX Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'divergent',
      machineBrandGuess: 'Cybex',
      machineModelGuess: 'Eagle NX Row'
    }),
    imageUrl: '/machines/cybex_eagle_row.png'
  }
];
