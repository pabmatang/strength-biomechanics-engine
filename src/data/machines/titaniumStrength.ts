// ==========================================
// CHΔNCE MACHINE CATALOG - TITANIUM STRENGTH
// ==========================================

import { type CatalogMachineEntry } from '../machineCatalog';

export const TITANIUM_STRENGTH_MACHINES: CatalogMachineEntry[] = [
  // 1. Titanium Strength - Converging Chest Press a Discos
  {
    id: 'titanium_black_chest_press',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Converging Chest Press a Discos',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Palanca convergente a discos que incrementa el brazo de momento hacia el bloqueo final, enfatizando la contracción en acortamiento del pectoral.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente Suavizado (Convergente)'
    },
    imageUrl: '/machines/titanium_black_chest_press.png'
  },

  // 2. Titanium Strength - Incline Chest Press a Discos
  {
    id: 'titanium_black_incline_press',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Incline Chest Press a Discos',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Empuje inclinado convergente donde los brazos de palanca aumentan el torque efectivo hacia la extensión completa, demandando máxima tensión clavicular.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente Suavizado (Convergente)'
    },
    imageUrl: '/machines/titanium_black_incline_press.png'
  },

  // 3. Titanium Strength - Converging Shoulder Press a Discos
  {
    id: 'titanium_black_shoulder_press',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Converging Shoulder Press a Discos',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Empuje vertical convergente con palancas articuladas que maximizan el torque en la fase superior del empuje sobre el deltoides anterior.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente Suavizado (Convergente)'
    },
    imageUrl: '/machines/titanium_black_shoulder_press.png'
  },

  // 4. Titanium Strength - Standing Lateral Raise a Discos
  {
    id: 'titanium_black_standing_lateral_raise',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Standing Lateral Raise a Discos',
    canonicalExerciseType: 'lateral_raise',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Elevación lateral en bipedestación con arco circular donde los brazos de palanca rotan hacia la horizontal, alcanzando el pico de resistencia a 90° de abducción.',
      curveWeights: { stretch: 0.15, mid: 0.35, shortened: 0.50 },
      curveLabel: 'Ascendente (Pico en Acortamiento)'
    },
    imageUrl: '/machines/titanium_black_standing_lateral_raise.png'
  },

  // 5. Titanium Strength - Iso-Lateral Lat Pulldown a Discos
  {
    id: 'titanium_black_lat_pulldown',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Iso-Lateral Lat Pulldown a Discos',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'divergent',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Jalón iso-lateral divergente donde el momento de fuerza es mayor al inicio en estiramiento completo y decrece mecánicamente al aproximarse a la máxima contracción.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente (Pico en Estiramiento)'
    },
    imageUrl: '/machines/titanium_black_lat_pulldown.png'
  },

  // 6. Titanium Strength - Iso-Lateral Low Row a Discos
  {
    id: 'titanium_black_low_row',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Iso-Lateral Low Row a Discos',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Dorsales',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'divergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Remo bajo iso-lateral divergente con palanca ascendente hacia la horizontal, incrementando progresivamente el torque hacia el final de la retracción.',
      curveWeights: { stretch: 0.20, mid: 0.35, shortened: 0.45 },
      curveLabel: 'Ascendente (Pico en Acortamiento)'
    },
    imageUrl: '/machines/titanium_black_low_row.png'
  },

  // 7. Titanium Strength - Iso-Lateral High Row a Discos
  {
    id: 'titanium_black_high_row',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Iso-Lateral High Row a Discos',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'divergent',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Remo alto iso-lateral divergente con ángulo descendente que concentra el mayor momento de carga en elongación articular y alivia la tensión en retracción profunda.',
      curveWeights: { stretch: 0.40, mid: 0.35, shortened: 0.25 },
      curveLabel: 'Descendente (Pico en Estiramiento)'
    },
    imageUrl: '/machines/titanium_black_high_row.png'
  },

  // 8. Titanium Strength - Chest Supported T-Bar Row
  {
    id: 'titanium_black_t_bar_row',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Chest Supported T-Bar Row',
    canonicalExerciseType: 't_bar_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Remo en punta apoyado en pecho con palanca fija pivotante; brazo de momento máximo en el estiramiento inicial que descarga sensiblemente en acortamiento.',
      curveWeights: { stretch: 0.50, mid: 0.35, shortened: 0.15 },
      curveLabel: 'Descendente Acentuado (Pico en Estiramiento)'
    },
    imageUrl: '/machines/titanium_black_t_bar_row.png'
  },

  // 9. Titanium Strength - Pendulum Squat
  {
    id: 'titanium_black_pendulum_squat',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Pendulum Squat',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'circular_arc',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Sentadilla en péndulo con arco curvo contrapesado; torque masivo en máxima flexión de rodilla (estiramiento profundo del cuádriceps) y descarga mecánica hacia el bloqueo articular.',
      curveWeights: { stretch: 0.50, mid: 0.35, shortened: 0.15 },
      curveLabel: 'Descendente Acentuado (Pico en Estiramiento)'
    },
    imageUrl: '/machines/titanium_black_pendulum_squat.png'
  },

  // 10. Titanium Strength - Linear Hack Squat 45°
  {
    id: 'titanium_black_hack_squat',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Linear Hack Squat 45°',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Desplazamiento sobre riel a 45°; resistencia constante del carro donde la flexión articular profunda incrementa la exigencia sobre el cuádriceps en estiramiento.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente en Articulación / Lineal Fijo'
    },
    imageUrl: '/machines/titanium_black_hack_squat.png'
  },

  // 11. Titanium Strength - 45° Linear Leg Press
  {
    id: 'titanium_black_leg_press_45',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - 45° Linear Leg Press',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Prensa lineal a 45° con trineo sobre rodamientos; perfil con máxima demanda articular en flexión de rodilla al inicio de la fase concéntrica.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente en Articulación / Lineal Fijo'
    },
    imageUrl: '/machines/titanium_black_leg_press_45.png'
  },

  // 12. Titanium Strength - Iso-Lateral Leg Extension a Discos
  {
    id: 'titanium_black_leg_extension',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Iso-Lateral Leg Extension a Discos',
    canonicalExerciseType: 'leg_extension',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Extensión de cuádriceps iso-lateral a discos; el brazo de palanca se abre perpendicular a la gravedad en extensión completa, generando el pico en acortamiento.',
      curveWeights: { stretch: 0.20, mid: 0.35, shortened: 0.45 },
      curveLabel: 'Ascendente (Pico en Acortamiento)'
    },
    imageUrl: '/machines/titanium_black_leg_extension.png'
  },

  // 13. Titanium Strength - Glute Builder / Hip Thrust a Discos
  {
    id: 'titanium_black_hip_thrust',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Glute Builder / Hip Thrust a Discos',
    canonicalExerciseType: 'hip_thrust',
    muscleGroupLabel: 'Glúteo',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Hip Thrust con palanca rotatoria y carga a discos; el brazo de momento alcanza su máxima perpendicularidad con la gravedad en la extensión pélvica terminal.',
      curveWeights: { stretch: 0.15, mid: 0.35, shortened: 0.50 },
      curveLabel: 'Ascendente (Pico en Acortamiento)'
    },
    imageUrl: '/machines/titanium_black_hip_thrust.png'
  },

  // 14. Titanium Strength - Seated Leg Curl / Leg Extension (Black Series BS-S1)
  {
    id: 'titanium_black_seated_leg_curl',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Seated Leg Curl (Black Series)',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Torre de placas con leva excéntrica para curl femoral; máxima demanda en estiramiento inicial de la cadena posterior.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Sobrecarga en Estiramiento'
    },
    imageUrl: '/machines/titanium_black_seated_leg_curl.png'
  },

  // 15. Titanium Strength - Iso-Lateral Pec Fly a Discos (Black Series BS-PL10)
  {
    id: 'titanium_black_pec_fly',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Pec Fly (Black Series)',
    canonicalExerciseType: 'pec_deck',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Aperturas en máquina a discos con brazos convergentes; resistencia centrada en el rango medio de aducción horizontal pectoral.',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Pico en Rango Medio'
    },
    imageUrl: '/machines/titanium_black_pec_fly.png'
  },

  // 16. Titanium Strength - Biceps Curl a Discos (Black Series BS-PL22)
  {
    id: 'titanium_black_biceps_curl',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Biceps Curl (Black Series)',
    canonicalExerciseType: 'biceps_curl',
    muscleGroupLabel: 'Bíceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Curl de bíceps en banco Scott a discos con palanca articulada; pico de torque en el rango medio de flexión del codo.',
      curveWeights: { stretch: 0.25, mid: 0.45, shortened: 0.30 },
      curveLabel: 'Campana · Pico en Rango Medio'
    },
    imageUrl: '/machines/titanium_black_biceps_curl.png'
  },

  // 17. Titanium Strength - Seated Triceps Dip a Discos (Black Series BS-PL12)
  {
    id: 'titanium_black_triceps_dip',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Triceps Dip (Black Series)',
    canonicalExerciseType: 'triceps_extension',
    muscleGroupLabel: 'Tríceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Fondos sentado en palanca a discos; incrementa el brazo de momento hacia la extensión completa del codo enfatizando el tríceps.',
      curveWeights: { stretch: 0.20, mid: 0.35, shortened: 0.45 },
      curveLabel: 'Ascendente (Pico en Acortamiento)'
    },
    imageUrl: '/machines/titanium_black_triceps_dip.png'
  },

  // 18. Titanium Strength - Belt Squat a Discos (Black / Elite Series)
  {
    id: 'titanium_black_belt_squat',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Belt Squat (Black Series)',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Sentadilla con cinturón a discos sin carga axial espinal; máxima demanda sobre cuádriceps y glúteos en flexión profunda.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/titanium_black_belt_squat.png'
  },

  // 19. Titanium Strength - Dual Abductor / Adductor (Black Series)
  {
    id: 'titanium_black_abductor_adductor',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Abductor / Adductor (Black Series)',
    canonicalExerciseType: 'abductor_machine',
    muscleGroupLabel: 'Abductores',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Estación dual selectorizada de abducción y aducción de cadera con leva optimizada para tensión uniforme en todo el arco.',
      curveWeights: { stretch: 0.30, mid: 0.40, shortened: 0.30 },
      curveLabel: 'Campana · Tensión Continua'
    },
    imageUrl: '/machines/titanium_black_abductor_adductor.png'
  },

  // 20. Titanium Strength - Seated Calf Raise a Discos (Black Series BS-PL24)
  {
    id: 'titanium_black_seated_calf',
    brand: 'Titanium Strength',
    line: 'Black Series',
    modelName: 'Titanium Strength - Seated Calf (Black Series)',
    canonicalExerciseType: 'calf_raise',
    muscleGroupLabel: 'Gemelos',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Elevación de talones sentado a discos con rodilla a 90°; máximo brazo de momento en dorsiflexión profunda aislando el sóleo.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Sóleo Estirado'
    },
    imageUrl: '/machines/titanium_black_seated_calf.png'
  }
];
