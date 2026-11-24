// ==========================================
// CHΔNCE MASTER MACHINE CATALOG
// Verified Biomechanical Resistance Profiles by Brand & Model
// Modularized Architecture by Manufacturer
// ==========================================

import {
  type MachineResistanceProfile,
  classifyMachineResistanceProfile
} from '../utils/machinePhysicsEngine';

export type NormalizedMuscleGroup =
  | 'Pectoral'
  | 'Dorsales'
  | 'Espalda Alta'
  | 'Lumbares'
  | 'Hombros'
  | 'Trapecio'
  | 'Bíceps'
  | 'Tríceps'
  | 'Cuádriceps'
  | 'Isquiosurales'
  | 'Glúteo'
  | 'Aductores'
  | 'Abductores'
  | 'Gemelos'
  | 'Abdomen'
  | 'Cardio';

export type MachineCatalogBrand =
  | 'Technogym'
  | 'Hammer Strength'
  | 'Titanium Strength'
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

export type MachineLaterality = 'bilateral' | 'iso_lateral' | 'unilateral';

export interface CatalogMachineEntry {
  id: string; // ej. 'technogym_pure_chest_press'
  brand: MachineCatalogBrand;
  line?: string; // ej. 'Pure Strength', 'Iso-Lateral', 'Monolith'
  modelName: string; // ej. 'Press Plano de Discos'
  canonicalExerciseType: string; // ID exacto para backend/main.py
  muscleGroupLabel: NormalizedMuscleGroup;
  profile: MachineResistanceProfile;
  imageUrl?: string | null;
  laterality?: MachineLaterality;
  setupCue?: string;
  aliases?: string[];
}

import {
  TECHNOGYM_MACHINES,
  HAMMER_STRENGTH_MACHINES,
  TITANIUM_STRENGTH_MACHINES,
  MATRIX_MACHINES,
  PANATTA_MACHINES,
  ESTANDAR_MACHINES,
  LIFE_FITNESS_MACHINES,
  OTHER_BRANDS_MACHINES,
  ALL_MODULAR_MACHINES
} from './machines/index';

export {
  TECHNOGYM_MACHINES,
  HAMMER_STRENGTH_MACHINES,
  TITANIUM_STRENGTH_MACHINES,
  MATRIX_MACHINES,
  PANATTA_MACHINES,
  ESTANDAR_MACHINES,
  LIFE_FITNESS_MACHINES,
  OTHER_BRANDS_MACHINES,
  ALL_MODULAR_MACHINES
};

export const MACHINE_CATALOG: CatalogMachineEntry[] = ALL_MODULAR_MACHINES;

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
      muscleGroupLabel: (item.muscleGroupLabel as NormalizedMuscleGroup) || 'Pectoral',
      profile: item.profile || classifyMachineResistanceProfile({
        loadType: 'plate_loaded',
        pivotBehavior: 'opens_to_horizontal_gain'
      })
    }));
  } catch (e) {
    return [];
  }
}

export function enrichMachineEntry(m: CatalogMachineEntry): CatalogMachineEntry {
  const idLower = m.id.toLowerCase();
  const nameLower = m.modelName.toLowerCase();
  const lineLower = (m.line || '').toLowerCase();
  const exType = m.canonicalExerciseType.toLowerCase();

  // Infiere laterality si no existe
  let laterality = m.laterality;
  if (!laterality) {
    if (
      idLower.includes('unilateral') ||
      idLower.includes('single') ||
      nameLower.includes('unilateral') ||
      idLower.includes('standing_glute') ||
      idLower.includes('standing_abductor') ||
      idLower.includes('standing_leg_curl') ||
      nameLower.includes('de pie')
    ) {
      laterality = 'unilateral';
    } else if (
      idLower.includes('iso') ||
      nameLower.includes('iso-lateral') ||
      nameLower.includes('isolateral') ||
      lineLower.includes('pure strength') ||
      lineLower.includes('black series') ||
      lineLower.includes('freeweight') ||
      lineLower.includes('magnum') ||
      nameLower.includes('convergente') ||
      nameLower.includes('divergente')
    ) {
      laterality = 'iso_lateral';
    } else {
      laterality = 'bilateral';
    }
  }

  // Infiere setupCue si no existe
  let setupCue = m.setupCue;
  if (!setupCue) {
    if (exType.includes('leg_press')) {
      setupCue = 'Ajusta el respaldo para permitir flexión completa sin despegue sacro; pies al ancho de cadera.';
    } else if (exType.includes('squat')) {
      setupCue = 'Coloca los hombros firmes bajo las almohadillas y los pies adelantados para máxima flexión de rodilla.';
    } else if (exType.includes('incline_press')) {
      setupCue = 'Ajusta la altura del asiento para alinear las empuñaduras con la parte clavicular del pectoral.';
    } else if (exType.includes('chest_press')) {
      setupCue = 'Ajusta el asiento para que los agarres queden a la altura del esternón medio.';
    } else if (exType.includes('t_bar')) {
      setupCue = 'Coloca los pies anclados y apoya el pecho firme sin arquear la zona lumbar.';
    } else if (exType.includes('row') || exType.includes('remo')) {
      setupCue = 'Ajusta el apoyo torácico para permitir elongación completa sin encorvar la zona lumbar.';
    } else if (exType.includes('lat_pulldown') || exType.includes('pulldown') || exType.includes('pullup')) {
      setupCue = 'Fija el rodillo sobre los muslos para anclar la pelvis; inicia el tirón deprimiendo escápulas.';
    } else if (exType.includes('shoulder')) {
      setupCue = 'Regula el asiento para que los agarres inicien a la altura de las clavículas.';
    } else if (exType.includes('lateral_raise')) {
      setupCue = 'Alinea el eje de rotación de la máquina con el centro de la articulación glenohumeral.';
    } else if (exType.includes('seated_leg_curl')) {
      setupCue = 'Alinea el eje del rodillo con la articulación de la rodilla y ajusta la almohadilla superior sobre los muslos.';
    } else if (exType.includes('leg_extension')) {
      setupCue = 'Alinea el eje de giro con los cóndilos femorales y coloca el rodillo sobre el empeine.';
    } else if (exType.includes('hip_thrust')) {
      setupCue = 'Coloca la almohadilla o cinturón sobre la pelvis y apoya las escápulas firmemente en el respaldo.';
    } else if (exType.includes('calf')) {
      setupCue = 'Apoya los metatarsos en el borde para máximo rango excéntrico sin doblar rodillas.';
    } else if (exType.includes('pec_deck') || exType.includes('fly')) {
      setupCue = 'Ajusta el asiento de modo que los codos y muñecas queden a la altura de los pezones.';
    } else if (exType.includes('biceps') || exType.includes('curl')) {
      setupCue = 'Apoya los codos planos en la almohadilla del predicador alineando el eje articular con los codos.';
    } else if (exType.includes('abductor')) {
      setupCue = 'Espalda pegada al respaldo; empuja desde las rodillas y controla la fase excéntrica.';
    } else if (exType.includes('adductor')) {
      setupCue = 'Inicia desde una apertura cómoda sin dolor inguinal; cierra de forma fluida.';
    } else if (exType.includes('deadlift')) {
      setupCue = 'Bloquea la columna neutra y empuja el suelo con las piernas manteniendo el torso compacto.';
    } else {
      setupCue = 'Ajusta la posición del asiento para alinear tus articulaciones con el eje de palanca de la máquina.';
    }
  }

  // Infiere aliases si no existen
  let aliases = m.aliases;
  if (!aliases || aliases.length === 0) {
    const defaultAliases: string[] = [];
    if (exType.includes('leg_press')) {
      defaultAliases.push('prensa', 'leg press', 'prensa 45', 'prensa de piernas');
    } else if (exType.includes('squat')) {
      defaultAliases.push('sentadilla', 'hack', 'hack squat', 'sentadilla hack', 'pendulum');
    } else if (exType.includes('incline_press')) {
      defaultAliases.push('press inclinado', 'incline press', 'pecho superior', 'inclinado');
    } else if (exType.includes('chest_press')) {
      defaultAliases.push('press banca', 'press pecho', 'press plano', 'chest press', 'pecho');
    } else if (exType.includes('t_bar')) {
      defaultAliases.push('remo en t', 't-bar', 't bar', 'remo punta', 'barra t');
    } else if (exType.includes('row') || exType.includes('remo')) {
      defaultAliases.push('remo', 'remo sentado', 'remo gironda', 'row', 'remo polea', 'remo apoyo');
    } else if (exType.includes('pulldown') || exType.includes('lat')) {
      defaultAliases.push('jalon', 'jalón', 'polea alta', 'lat pulldown', 'traccion dorsal');
    } else if (exType.includes('shoulder')) {
      defaultAliases.push('press militar', 'press hombro', 'shoulder press', 'deltoides');
    } else if (exType.includes('lateral_raise')) {
      defaultAliases.push('elevaciones laterales', 'vuelos', 'laterales', 'pajaros', 'deltoides lateral');
    } else if (exType.includes('seated_leg_curl') || exType.includes('leg_curl')) {
      defaultAliases.push('curl femoral', 'femoral sentado', 'femoral tumbado', 'leg curl', 'isquios');
    } else if (exType.includes('leg_extension')) {
      defaultAliases.push('extension cuadriceps', 'extensiones', 'leg extension', 'cuadriceps');
    } else if (exType.includes('hip_thrust')) {
      defaultAliases.push('hip thrust', 'empuje cadera', 'gluteo', 'glute drive', 'puente');
    } else if (exType.includes('pec_deck') || exType.includes('fly')) {
      defaultAliases.push('contractora', 'aperturas', 'pec deck', 'peck deck', 'pec fly', 'mariposa');
    } else if (exType.includes('calf')) {
      defaultAliases.push('gemelos', 'elevacion talones', 'calf raise', 'soleo', 'pantorrilla');
    } else if (exType.includes('abductor')) {
      defaultAliases.push('abductores', 'abductor', 'abrir piernas', 'gluteo medio');
    } else if (exType.includes('adductor')) {
      defaultAliases.push('aductores', 'adductor', 'cerrar piernas', 'entrepierna');
    } else if (exType.includes('biceps') || exType.includes('curl')) {
      defaultAliases.push('biceps', 'curl predicador', 'scott', 'arm curl');
    } else if (exType.includes('deadlift')) {
      defaultAliases.push('peso muerto', 'deadlift', 'bisagra cadera');
    }
    aliases = defaultAliases;
  }

  return {
    ...m,
    laterality,
    setupCue,
    aliases
  };
}

export function getAllCatalogMachines(): CatalogMachineEntry[] {
  return [...MACHINE_CATALOG, ...getCustomMachines()].map(enrichMachineEntry);
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
      (m.line && m.line.toLowerCase().includes(q)) ||
      (m.aliases && m.aliases.some(alias => alias.toLowerCase().includes(q)))
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

  // Remo en T / Remo en Punta -> 50/35/15 (Descendente · Pico en Estiramiento)
  if (id.includes('t_bar_row') || id.includes('t_bar') || id.includes('remo_punta') || id.includes('barra_t')) {
    return {
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'circular_arc',
      peakZone: 'stretched',
      resistanceCurveDescription: 'La barra pivota desde el suelo: máximo brazo de momento en estiramiento abajo, reduciéndose al verticalizarse cerca del torso.',
      curveWeights: { stretch: 0.50, mid: 0.35, shortened: 0.15 },
      curveLabel: 'Descendente · Pico en Estiramiento'
    };
  }

  // Remo en Barra / Mancuerna -> 20/35/45
  if (id.includes('barbell_row') || id.includes('dumbbell_row')) {
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
