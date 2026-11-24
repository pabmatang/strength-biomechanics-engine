// ==========================================
// CHΔNCE MACHINE CATALOG - PRECOR
// ==========================================

import { type CatalogMachineEntry } from '../machineCatalog';

export const PRECOR_MACHINES: CatalogMachineEntry[] = [
  // 1. Precor Discovery — Converging Chest Press
  {
    id: 'precor_discovery_chest_press',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Converging Chest Press',
    canonicalExerciseType: 'chest_press_machine',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'convergent',
      peakZone: 'mid',
      curveWeights: { stretch: 0.35, mid: 0.45, shortened: 0.20 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Prensa pectoral convergente con brazos independientes y movimiento natural hacia la línea media.'
    },
    imageUrl: '/machines/precor_discovery_chest_press.png'
  },

  // 2. Precor Discovery — Incline Press a Discos
  {
    id: 'precor_discovery_incline_press',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Incline Press a Discos',
    canonicalExerciseType: 'incline_press',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent',
      peakZone: 'mid',
      curveWeights: { stretch: 0.35, mid: 0.45, shortened: 0.20 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Press inclinado a discos DPL0541 con palancas convergentes que protegen la articulación glenohumeral.'
    },
    imageUrl: '/machines/precor_discovery_incline_press.png'
  },

  // 3. Precor Discovery — Rear Delt / Pec Fly
  {
    id: 'precor_discovery_pec_fly',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Rear Delt / Pec Fly',
    canonicalExerciseType: 'pec_deck',
    muscleGroupLabel: 'Pectoral',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Contractora dual para pectoral y deltoides posterior con brazos flotantes autoajustables.'
    },
    imageUrl: '/machines/precor_discovery_pec_fly.png'
  },

  // 4. Precor Discovery — Converging Shoulder Press
  {
    id: 'precor_discovery_shoulder_press',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Converging Shoulder Press',
    canonicalExerciseType: 'shoulder_press_machine',
    muscleGroupLabel: 'Hombros',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'convergent',
      peakZone: 'mid',
      curveWeights: { stretch: 0.35, mid: 0.45, shortened: 0.20 },
      curveLabel: 'Campana · Máximo Momento Medio',
      resistanceCurveDescription: 'Press de hombros convergente con empuje ergonómico y reducción de estrés acromial en rango superior.'
    },
    imageUrl: '/machines/precor_discovery_shoulder_press.png'
  },

  // 5. Precor Discovery — Diverging Lat Pulldown
  {
    id: 'precor_discovery_lat_pulldown',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Diverging Lat Pulldown',
    canonicalExerciseType: 'lat_pulldown',
    muscleGroupLabel: 'Dorsales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'divergent',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.30, mid: 0.35, shortened: 0.35 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Jalón dorsal divergente con movimiento independiente que optimiza la línea de tracción escapular.'
    },
    imageUrl: '/machines/precor_discovery_lat_pulldown.png'
  },

  // 6. Precor Discovery — Seated Row
  {
    id: 'precor_discovery_seated_row',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Seated Row',
    canonicalExerciseType: 'seated_row',
    muscleGroupLabel: 'Espalda Alta',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'divergent',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.30, mid: 0.35, shortened: 0.35 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Remo sentado con apoyo torácico ajustable y agarres independientes para retracción escapular completa.'
    },
    imageUrl: '/machines/precor_discovery_seated_row.png'
  },

  // 7. Precor Discovery — Angled Leg Press 45° a Discos
  {
    id: 'precor_discovery_leg_press',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Angled Leg Press 45° a Discos',
    canonicalExerciseType: 'leg_press',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'plate_loaded',
      pivotBehavior: 'linear_neutral',
      pathType: 'linear_fixed',
      peakZone: 'stretched',
      curveWeights: { stretch: 0.45, mid: 0.35, shortened: 0.20 },
      curveLabel: 'Descendente · Foco Estiramiento',
      resistanceCurveDescription: 'Prensa inclinada a 45° DPL0601 sobre rieles de precisión con sobrecarga continua en flexión profunda.'
    },
    imageUrl: '/machines/precor_discovery_leg_press.png'
  },

  // 8. Precor Discovery — Leg Extension
  {
    id: 'precor_discovery_leg_extension',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Leg Extension',
    canonicalExerciseType: 'leg_extension',
    muscleGroupLabel: 'Cuádriceps',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.25, mid: 0.35, shortened: 0.40 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Extensión de piernas con leva excéntrica y rodillo autoalineable para tensión máxima en extensión completa.'
    },
    imageUrl: '/machines/precor_discovery_leg_extension.png'
  },

  // 9. Precor Discovery — Seated Leg Curl
  {
    id: 'precor_discovery_seated_leg_curl',
    brand: 'Precor',
    line: 'Discovery Series',
    modelName: 'Precor Discovery - Seated Leg Curl',
    canonicalExerciseType: 'seated_leg_curl',
    muscleGroupLabel: 'Isquiosurales',
    profile: {
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop',
      pathType: 'circular_arc',
      peakZone: 'shortened',
      curveWeights: { stretch: 0.30, mid: 0.35, shortened: 0.35 },
      curveLabel: 'Ascendente · Foco Acortamiento',
      resistanceCurveDescription: 'Curl femoral sentado con ángulo de cadera preestablecido y leva excéntrica que mantiene tensión hasta la flexión total.'
    },
    imageUrl: '/machines/precor_discovery_seated_leg_curl.png'
  }
];
