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
    imageUrl: '/machines/matrix_versa_calf_extension.png'
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
    imageUrl: '/machines/matrix_ultra_converging_chest.png'
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
    imageUrl: '/machines/matrix_ultra_diverging_lat_pulldown.png'
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
    imageUrl: '/machines/matrix_ultra_seated_row.png'
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
    imageUrl: '/machines/matrix_ultra_leg_extension.png'
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
    imageUrl: '/machines/matrix_ultra_standing_glute_kick.png'
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
    imageUrl: '/machines/matrix_ultra_arm_curl.png'
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
    imageUrl: '/machines/matrix_ultra_rotary_torso.png'
  },

  // 10. Matrix — Matrix Ultra - Converging Shoulder Press
  {
    id: 'matrix_ultra_converging_shoulder_press',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S23)',
    modelName: 'Matrix Ultra - Converging Shoulder Press',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Palancas convergentes independientes de trayectoria guiada; mayor demanda biomecánica hacia el bloqueo articular superior.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Convergente'
    },
    imageUrl: '/machines/matrix_ultra_converging_shoulder_press.png'
  },

  // 11. Matrix — Matrix Ultra - Pec Fly / Rear Delt
  {
    id: 'matrix_ultra_pec_fly',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S22)',
    modelName: 'Matrix Ultra - Pec Fly / Rear Delt',
    canonicalExerciseType: 'pec_deck',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Leva optimizada con doble brazo articulado; pico máximo de tensión en el plano medio con los brazos a 90° respecto al torso.',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Pico a 90°'
    },
    imageUrl: '/machines/matrix_ultra_pec_fly.png'
  },

  // 12. Matrix — Matrix Ultra - Seated Leg Curl
  {
    id: 'matrix_ultra_seated_leg_curl',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S72)',
    modelName: 'Matrix Ultra - Seated Leg Curl',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'circular_arc',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Flexión de rodilla sentado con cadera flexionada; máxima sobrecarga en posición de elongación isquiosural con descarga en flexión profunda.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/matrix_ultra_seated_leg_curl.png'
  },

  // 13. Matrix — Matrix Ultra - Prone Leg Curl
  {
    id: 'matrix_ultra_prone_leg_curl',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S73)',
    modelName: 'Matrix Ultra - Prone Leg Curl',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Banco prono angulado con leva excéntrica; mayor brazo de momento en rango medio protegiendo la inserción distal en hiperextensión.',
      curveWeights: { stretch: 0.30, mid: 0.45, shortened: 0.25 },
      curveLabel: 'Campana · Rango Medio'
    },
    imageUrl: '/machines/matrix_ultra_prone_leg_curl.png'
  },

  // 14. Matrix — Matrix Ultra - Leg Press (Placas)
  {
    id: 'matrix_ultra_leg_press',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S70)',
    modelName: 'Matrix Ultra - Leg Press (Placas)',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Prensa horizontal guiada por torre de placas con trineo suave; máxima demanda en flexión profunda de rodillas.',
      curveWeights: { stretch: 0.40, mid: 0.35, shortened: 0.25 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/matrix_ultra_leg_press.png'
  },

  // 15. Matrix — Matrix Ultra - Seated Triceps Press / Dip
  {
    id: 'matrix_ultra_triceps_press',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S42)',
    modelName: 'Matrix Ultra - Seated Triceps Press / Dip',
    canonicalExerciseType: 'triceps_extension',
    muscleGroupLabel: 'Tríceps',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'linear_fixed',
      peakZone: 'mid',
      resistanceCurveDescription: 'Fondo sentado asistido en torre con agarres paralelos; máxima sobrecarga mecánica en el rango medio del empuje.',
      curveWeights: { stretch: 0.25, mid: 0.45, shortened: 0.30 },
      curveLabel: 'Campana · Rango Medio'
    },
    imageUrl: '/machines/matrix_ultra_triceps_press.png'
  },

  // 16. Matrix — Matrix Ultra - Abdominal Crunch
  {
    id: 'matrix_ultra_abdominal_crunch',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S51)',
    modelName: 'Matrix Ultra - Abdominal Crunch',
    canonicalExerciseType: 'abdominal_crunch',
    muscleGroupLabel: 'Abdomen',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'mid',
      resistanceCurveDescription: 'Flexión de tronco guiada con soporte ergonómico para espalda y rodillas; pico de par resistente en flexión media abdominal.',
      curveWeights: { stretch: 0.25, mid: 0.50, shortened: 0.25 },
      curveLabel: 'Campana · Rango Medio'
    },
    imageUrl: '/machines/matrix_ultra_abdominal_crunch.png'
  },

  // 17. Matrix — Matrix Ultra - Hip Abductor
  {
    id: 'matrix_ultra_hip_abductor',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S75)',
    modelName: 'Matrix Ultra - Hip Abductor',
    canonicalExerciseType: 'abductor_machine',
    muscleGroupLabel: 'Abductores',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Abducción de cadera en posición sentada; brazo de momento creciente que maximiza la contracción del glúteo medio en apertura completa.',
      curveWeights: { stretch: 0.20, mid: 0.35, shortened: 0.45 },
      curveLabel: 'Ascendente · Pico Acortamiento'
    },
    imageUrl: '/machines/matrix_ultra_hip_abductor.png'
  },

  // 18. Matrix — Matrix Ultra - Hip Adductor
  {
    id: 'matrix_ultra_hip_adductor',
    brand: 'Matrix',
    line: 'Ultra Series (G7-S74)',
    modelName: 'Matrix Ultra - Hip Adductor',
    canonicalExerciseType: 'adductor_machine',
    muscleGroupLabel: 'Aductores',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Aducción femoral guiada con rodilleras acolchadas; resistencia progresiva con pico en el cierre y máxima aproximación de piernas.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Máxima Aducción'
    },
    imageUrl: '/machines/matrix_ultra_hip_adductor.png'
  },

  // 19. Matrix — Matrix Magnum - 45° Leg Press a Discos
  {
    id: 'matrix_magnum_leg_press_45',
    brand: 'Matrix',
    line: 'Magnum Series (MG-PL70)',
    modelName: 'Matrix Magnum - 45° Leg Press a Discos',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Prensa inclinada a 45° a discos sobre raíles lineales; carga gravitatoria máxima en flexión profunda de cadera y rodilla.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/matrix_magnum_leg_press_45.png'
  },

  // 20. Matrix — Matrix Magnum - Hack Squat a Discos
  {
    id: 'matrix_magnum_hack_squat',
    brand: 'Matrix',
    line: 'Magnum Series (MG-PL71)',
    modelName: 'Matrix Magnum - Hack Squat a Discos',
    canonicalExerciseType: 'squat',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      resistanceCurveDescription: 'Sentadilla hack a 45° a discos con respaldo y hombreras acolchadas; máximo brazo de palanca sobre cuádriceps en la paralela inferior.',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento'
    },
    imageUrl: '/machines/matrix_magnum_hack_squat.png'
  },

  // 21. Matrix — Matrix Magnum - Converging Incline Press a Discos
  {
    id: 'matrix_magnum_incline_press',
    brand: 'Matrix',
    line: 'Magnum Series (MG-PL14)',
    modelName: 'Matrix Magnum - Converging Incline Press a Discos',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      peakZone: 'shortened',
      resistanceCurveDescription: 'Press inclinado a discos con palancas independientes y convergencia natural; máxima sobrecarga del haz clavicular hacia el bloqueo superior.',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Convergente'
    },
    imageUrl: '/machines/matrix_magnum_incline_press.png'
  }
];
