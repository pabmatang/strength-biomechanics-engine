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
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Guiado lineal en carro 45°; pico de carga en la máxima flexión de rodilla con foco en estiramiento.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
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
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'divergent',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Tracción alta convergente/divergente con palanca inclinada; máxima tensión en fase de estiramiento dorsal.',
      curveWeights: { stretch: 0.40, mid: 0.35, shortened: 0.25 },
      curveLabel: 'Descendente · Pico en Estiramiento'
    },
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
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Prensa lineal a 45° con carro sobre puente; máxima tensión en elongación profunda.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
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
    imageUrl: '/machines/panatta_freeweight_lying_leg_curl.png'
  },

  // 7. Panatta — Panatta Monolith - Standing Abductor (Abducción de Glúteo de Pie)
  {
    id: 'panatta_monolith_standing_abductor',
    brand: 'Panatta',
    line: 'Monolith Selection',
    modelName: 'Panatta Monolith - Standing Abductor (Abducción de Glúteo de Pie)',
    canonicalExerciseType: 'abductor_machine',
    muscleGroupLabel: 'Abductores',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Monolith - Standing Abductor (Abducción de Glúteo de Pie)'
    }),
    imageUrl: '/machines/panatta_monolith_standing_abductor.png'
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
    imageUrl: '/machines/panatta_super_preacher_curl.png'
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
    imageUrl: '/machines/panatta_monolith_triceps_dip.png'
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
    imageUrl: '/machines/panatta_circular_glute_kickback.png'
  },

  // 11. Panatta — Panatta Freeweight - 45° Hyperextension / Roman Chair (Banco Lumbar y Glúteo)
  {
    id: 'panatta_45_hyperextension_bench',
    brand: 'Panatta',
    line: 'Freeweight Pro',
    modelName: 'Panatta Freeweight - 45° Hyperextension / Roman Chair (Banco Lumbar y Glúteo)',
    canonicalExerciseType: 'back_extension',
    muscleGroupLabel: 'Lumbares',
    profile: {
      loadType: 'free_weight',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'uniform',
      resistanceCurveDescription: 'Banco a 45° para hiperextensión lumbar y glúteo con autocarga / peso libre.',
      curveWeights: { stretch: 0.334, mid: 0.333, shortened: 0.333 },
      curveLabel: 'Perfil Uniforme'
    },
    imageUrl: '/machines/panatta_45_hyperextension_bench.png'
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
    imageUrl: '/machines/panatta_super_t_bar_row.png'
  },

  // 13. Panatta — Panatta Freeweight - Super Rowing a Discos (Remo Sentado Divergente)
  {
    id: 'panatta_super_rowing_plate',
    brand: 'Panatta',
    line: 'Super Freeweight HP',
    modelName: 'Panatta Freeweight - Super Rowing a Discos (Remo Sentado Divergente)',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Dorsales',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Freeweight - Super Rowing a Discos (Remo Sentado Divergente)'
    }),
    imageUrl: '/machines/panatta_super_rowing_plate.png'
  },

  // 14. Panatta — Panatta Freeweight - Belt Squat a Discos (Sentadilla con Cinturón)
  {
    id: 'panatta_super_belt_squat',
    brand: 'Panatta',
    line: 'Super Freeweight HP',
    modelName: 'Panatta Freeweight - Belt Squat a Discos (Sentadilla con Cinturón)',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Sentadilla con cinturón a discos; máxima demanda en flexión profunda con foco en estiramiento.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/panatta_super_belt_squat.png'
  },

  // 15. Panatta — Panatta Super Freeweight - Pendulum Squat (Sentadilla Péndulo)
  {
    id: 'panatta_super_pendulum_squat',
    brand: 'Panatta',
    line: 'Super Freeweight HP',
    modelName: 'Panatta Super Freeweight - Pendulum Squat (Sentadilla Péndulo)',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'circular_arc',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Sentadilla en péndulo con arco curvo contrapesado; máxima demanda en flexión profunda con descarga hacia la extensión.',
      curveWeights: { stretch: 0.50, mid: 0.35, shortened: 0.15 },
      curveLabel: 'Descendente · Péndulo Profundo'
    },
    imageUrl: '/machines/panatta_super_pendulum_squat.png'
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
    imageUrl: '/machines/panatta_super_pullover_machine.png'
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
    imageUrl: '/machines/panatta_standing_unilateral_leg_curl.png'
  },

  // 18. Panatta — Panatta FreeWeight Special - Super Vertical Chest Press (1FW036)
  {
    id: 'panatta_super_chest_press',
    brand: 'Panatta',
    line: 'Free Weight Special (1FW036)',
    modelName: 'Panatta FreeWeight Special - Super Chest Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta FreeWeight Special - Super Chest Press'
    }),
    imageUrl: '/machines/panatta_super_chest_press.png'
  },

  // 19. Panatta — Panatta FreeWeight Special - Super Lat Machine Convergent (1FW001)
  {
    id: 'panatta_super_lat_convergent',
    brand: 'Panatta',
    line: 'Free Weight Special (1FW001)',
    modelName: 'Panatta FreeWeight Special - Super Lat Machine Convergent',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'divergent',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta FreeWeight Special - Super Lat Machine Convergent'
    }),
    imageUrl: '/machines/panatta_super_lat_convergent.png'
  },

  // 20. Panatta — Panatta FreeWeight Special - Lateral Deltoids (1FW027)
  {
    id: 'panatta_super_lateral_deltoid',
    brand: 'Panatta',
    line: 'Free Weight Special (1FW027)',
    modelName: 'Panatta FreeWeight Special - Lateral Deltoid',
    canonicalExerciseType: 'lateral_raise',
    muscleGroupLabel: 'Hombros',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta FreeWeight Special - Lateral Deltoid'
    }),
    imageUrl: '/machines/panatta_super_lateral_deltoid.png'
  },

  // 21. Panatta — Panatta FreeWeight Special - Super Peck Back (1FW117)
  {
    id: 'panatta_super_pec_deck',
    brand: 'Panatta',
    line: 'Free Weight Special (1FW117)',
    modelName: 'Panatta FreeWeight Special - Super Pec Deck / Peck Back',
    canonicalExerciseType: 'pec_deck',
    muscleGroupLabel: 'Pectoral',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta FreeWeight Special - Super Pec Deck / Peck Back'
    }),
    imageUrl: '/machines/panatta_super_pec_deck.png'
  },

  // 22. Panatta — Panatta Monolith - Leg Extension (1MTH081)
  {
    id: 'panatta_monolith_leg_extension',
    brand: 'Panatta',
    line: 'Monolith Selection (1MTH081)',
    modelName: 'Panatta Monolith - Leg Extension',
    canonicalExerciseType: 'leg_extension',
    muscleGroupLabel: 'Cuádriceps',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Monolith - Leg Extension'
    }),
    imageUrl: '/machines/panatta_monolith_leg_extension.png'
  },

  // 23. Panatta — Panatta Monolith - Seated Leg Curling (1MTH083)
  {
    id: 'panatta_monolith_seated_leg_curl',
    brand: 'Panatta',
    line: 'Monolith Selection (1MTH083)',
    modelName: 'Panatta Monolith - Seated Leg Curl',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Monolith - Seated Leg Curl'
    }),
    imageUrl: '/machines/panatta_monolith_seated_leg_curl.png'
  },

  // 24. Panatta — Panatta Monolith - Adductor Machine (1MTH087)
  {
    id: 'panatta_monolith_adductor',
    brand: 'Panatta',
    line: 'Monolith Selection (1MTH087)',
    modelName: 'Panatta Monolith - Adductor',
    canonicalExerciseType: 'adductor_machine',
    muscleGroupLabel: 'Aductores',
    profile: classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta Monolith - Adductor'
    }),
    imageUrl: '/machines/panatta_monolith_adductor.png'
  },

  // 25. Panatta — Panatta FreeWeight Special - Super Standing Calf Hack (1FW092)
  {
    id: 'panatta_super_standing_calf',
    brand: 'Panatta',
    line: 'Free Weight Special (1FW092)',
    modelName: 'Panatta FreeWeight Special - Super Standing Calf',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    profile: classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      machineBrandGuess: 'Panatta',
      machineModelGuess: 'Panatta FreeWeight Special - Super Standing Calf'
    }),
    imageUrl: '/machines/panatta_super_standing_calf.png'
  }
];
