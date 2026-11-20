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
  // 1. Technogym Pure Strength — Chest Press (Convergente)
  {
    id: 'technogym_pure_chest_press',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Press Plano de Discos',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Pure Strength Chest Press'
    }),
    imageUrl: '/machines/technogym_pure_chest_press.jpg'
  },

  // 2. Technogym Pure Strength — Incline Chest Press
  {
    id: 'technogym_pure_incline_press',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Press Inclinado de Discos',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Pure Strength Incline Press'
    }),
    imageUrl: '/machines/technogym_pure_incline_chest.jpg'
  },

  // 3. Technogym Pure Strength — Low Row (Divergente)
  {
    id: 'technogym_pure_low_row',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Remo Bajo de Discos',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Pure Strength Low Row'
    }),
    imageUrl: '/machines/technogym_pure_low_row.jpg'
  },

  // 4. Technogym Pure Strength — Pulldown (Divergente)
  {
    id: 'technogym_pure_pulldown',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Jalón de Discos',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Espalda',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Pure Strength Pulldown'
    }),
    imageUrl: '/machines/technogym_pure_pulldown.jpg'
  },

  // 5. Hammer Strength — Iso-Lateral Horizontal Bench Press
  {
    id: 'hammer_iso_chest_press',
    brand: 'Hammer Strength',
    line: 'Iso-Lateral',
    modelName: 'Iso-Lateral Horizontal Bench Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'convergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Iso-Lateral Bench Press'
    }),
    imageUrl: '/machines/hammer_iso_wide_chest.png'
  },

  // 6. Hammer Strength — Iso-Lateral Incline Press
  {
    id: 'hammer_iso_incline_press',
    brand: 'Hammer Strength',
    line: 'Iso-Lateral',
    modelName: 'Iso-Lateral Incline Press',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'convergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Iso-Lateral Incline Press'
    }),
    imageUrl: '/machines/hammer_iso_incline_press.png'
  },

  // 7. Hammer Strength — Iso-Lateral D.Y. Row
  {
    id: 'hammer_iso_dy_row',
    brand: 'Hammer Strength',
    line: 'Iso-Lateral',
    modelName: 'Iso-Lateral D.Y. Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Iso-Lateral D.Y. Row'
    }),
    imageUrl: '/machines/hammer_iso_dy_row.png'
  },

  // 8. Hammer Strength — Iso-Lateral High Row
  {
    id: 'hammer_iso_high_row',
    brand: 'Hammer Strength',
    line: 'Iso-Lateral',
    modelName: 'Iso-Lateral High Row',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Espalda',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Iso-Lateral High Row'
    }),
    imageUrl: '/machines/hammer_front_pulldown.png'
  },

  // 9. Hammer Strength — Iso-Lateral Front Pulldown
  {
    id: 'hammer_iso_pulldown',
    brand: 'Hammer Strength',
    line: 'Iso-Lateral',
    modelName: 'Iso-Lateral Front Pulldown',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Espalda',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Iso-Lateral Front Pulldown'
    }),
    imageUrl: '/machines/hammer_iso_front_lat_pulldown.png'
  },

  // 10. Panatta — Super Incline Chest Press
  {
    id: 'panatta_super_incline_press',
    brand: 'Panatta',
    line: 'Free Weight Special',
    modelName: 'Super Incline Chest Press',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Super Incline Press'
    }),
    imageUrl: '/machines/panatta_incline_chest.jpg'
  },

  // 11. Panatta — Super Horizontal Bench Press
  {
    id: 'panatta_super_horizontal_bench',
    brand: 'Panatta',
    line: 'Free Weight Special',
    modelName: 'Super Horizontal Bench Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Super Horizontal Bench'
    }),
    imageUrl: '/machines/panatta_incline_chest.png'
  },

  // 12. Panatta — Super High Row
  {
    id: 'panatta_super_high_row',
    brand: 'Panatta',
    line: 'Free Weight Special',
    modelName: 'Super High Row',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Espalda',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Super High Row'
    }),
    imageUrl: '/machines/panatta_super_high_row.jpg'
  },

  // 13. Nautilus — Nitro Chest Press
  {
    id: 'nautilus_nitro_chest_press',
    brand: 'Nautilus',
    line: 'Nitro',
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
    imageUrl: '/machines/technogym_selection_chest_press.png'
  },

  // 14. Nautilus — Leg Extension (Leva Excéntrica)
  {
    id: 'nautilus_leg_extension',
    brand: 'Nautilus',
    line: 'Inspiration',
    modelName: 'Leg Extension (Leva Excéntrica)',
    canonicalExerciseType: 'leg_extension',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Nautilus',
      machineModelGuess: 'Leg Extension'
    }),
    imageUrl: '/machines/technogym_selection_leg_extension.jpg'
  },

  // 15. Technogym Pure Strength — Linear Leg Press 45°
  {
    id: 'technogym_pure_leg_press',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Linear Leg Press 45°',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Pure Strength Leg Press'
    }),
    imageUrl: '/machines/technogym_pure_leg_press.jpg'
  },

  // 16. Technogym Pure Strength — Pure Hip Thrust
  {
    id: 'technogym_pure_hip_thrust',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Pure Hip Thrust',
    canonicalExerciseType: 'hip_thrust',
    muscleGroupLabel: 'Glúteo',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Pure Hip Thrust'
    }),
    imageUrl: '/machines/technogym_pure_hip_thrust.jpg'
  },

  // 17. Matrix — Lateral Raise (Ultra Series)
  {
    id: 'matrix_lateral_raise',
    brand: 'Matrix',
    line: 'Ultra Series',
    modelName: 'Lateral Raise',
    canonicalExerciseType: 'lateral_raise',
    muscleGroupLabel: 'Hombro',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Matrix',
      machineModelGuess: 'Ultra Lateral Raise'
    }),
    imageUrl: '/machines/matrix_ultra_lateral_raise.jpg'
  },

  // 18. Cybex — Eagle NX Row
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

  // 19. Hammer Strength — Iso-Lateral Shoulder Press
  {
    id: 'hammer_iso_shoulder_press',
    brand: 'Hammer Strength',
    line: 'Iso-Lateral',
    modelName: 'Iso-Lateral Shoulder Press',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Hombro',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'convergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Iso-Lateral Shoulder Press'
    }),
    imageUrl: '/machines/hammer_incline_press.png'
  },

  // 20. Technogym Pure Strength — Biceps Curl
  {
    id: 'technogym_pure_biceps_curl',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Biceps Curl',
    canonicalExerciseType: 'biceps_curl',
    muscleGroupLabel: 'Bíceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Pure Biceps Curl'
    }),
    imageUrl: '/machines/technogym_pure_biceps_curl.jpg'
  },

  // 21. Technogym Selection 900 — Lat Machine
  {
    id: 'technogym_selection_lat_machine',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Lat Machine',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Espalda',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'circular_cam_constant',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Selection Lat Machine'
    }),
    imageUrl: '/machines/technogym_selection_lat_machine.jpg'
  },

  // 22. Gym80 — Sygnum Dual Chest Press
  {
    id: 'gym80_sygnum_chest_press',
    brand: 'Gym80',
    line: 'Sygnum Dual',
    modelName: 'Chest Press Dual',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Gym80',
      machineModelGuess: 'Sygnum Dual Chest Press'
    }),
    imageUrl: '/machines/matrix_chest_press.jpg'
  },

  // 23. Technogym Pure Strength — Shoulder Press
  {
    id: 'technogym_pure_shoulder_press',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Press de Hombro de Discos',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Hombro',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Pure Shoulder Press'
    }),
    imageUrl: '/machines/technogym_pure_shoulder_press.jpg'
  },

  // 24. Hammer Strength — Iso-Lateral Decline Press
  {
    id: 'hammer_iso_decline_press',
    brand: 'Hammer Strength',
    line: 'Iso-Lateral',
    modelName: 'Iso-Lateral Decline Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Iso-Lateral Decline Press'
    }),
    imageUrl: '/machines/hammer_iso_decline_press.png'
  },

  // 25. Technogym Pure Strength — T-Bar Row
  {
    id: 'technogym_pure_t_bar_row',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'T-Bar Row de Discos',
    canonicalExerciseType: 't_bar_row',
    muscleGroupLabel: 'Espalda',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'convergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Pure T-Bar Row'
    }),
    imageUrl: '/machines/technogym_pure_t_bar_row.png'
  },

  // 26. Technogym Pure Strength — Row (Remo Dorian)
  {
    id: 'technogym_pure_row_dorian',
    brand: 'Technogym',
    line: 'Pure Strength',
    modelName: 'Row (Remo Dorian)',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Pure Row Dorian'
    }),
    imageUrl: '/machines/technogym_pure_row_dorian.jpg'
  },

  // 27. Panatta — Standing Multi Flight
  {
    id: 'panatta_standing_multi_flight',
    brand: 'Panatta',
    line: 'Free Weight Special',
    modelName: 'Standing Multi Flight',
    canonicalExerciseType: 'lateral_raise',
    muscleGroupLabel: 'Hombro',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Standing Multi Flight'
    }),
    imageUrl: '/machines/technogym_pure_lateral_raise.jpg'
  },

  // 28. Matrix — Converging Chest Press
  {
    id: 'matrix_converging_chest_press',
    brand: 'Matrix',
    line: 'Ultra Series',
    modelName: 'Converging Chest Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Matrix',
      machineModelGuess: 'Ultra Converging Chest Press'
    }),
    imageUrl: '/machines/matrix_ultra_converging_chest.jpg'
  },

  // 29. Technogym Selection 900 — Leg Extension
  {
    id: 'technogym_selection_leg_extension',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Leg Extension',
    canonicalExerciseType: 'leg_extension',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Selection Leg Extension'
    }),
    imageUrl: '/machines/technogym_selection_leg_extension.jpg'
  },

  // 30. Technogym Selection 900 — Seated Leg Curl
  {
    id: 'technogym_selection_leg_curl',
    brand: 'Technogym',
    line: 'Selection 900',
    modelName: 'Seated Leg Curl',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquios',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'circular_arc',
      machineBrandGuess: 'Technogym',
      machineModelGuess: 'Selection Seated Leg Curl'
    }),
    imageUrl: '/machines/technogym_selection_leg_curl.jpg'
  },
  // ==========================================
  // 31-47. MÁQUINAS ESTÁNDAR (Gimnasio Sin Marca / Barrial)
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
