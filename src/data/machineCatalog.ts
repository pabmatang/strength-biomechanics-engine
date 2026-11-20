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
  | 'Genérica';

export interface CatalogMachineEntry {
  id: string; // ej. 'technogym_pure_chest_press'
  brand: MachineCatalogBrand;
  line?: string; // ej. 'Pure Strength', 'Iso-Lateral', 'Monolith'
  modelName: string; // ej. 'Press Plano de Discos'
  canonicalExerciseType: string; // ID exacto para backend/main.py
  muscleGroupLabel: string; // ej. 'Pectoral', 'Espalda', 'Cuádriceps', 'Glúteo'
  profile: MachineResistanceProfile;
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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
    })
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

export function getMachineById(id: string): CatalogMachineEntry | undefined {
  if (!id) return undefined;
  return getAllCatalogMachines().find(m => m.id === id);
}

export function searchCatalogMachines(query: string = '', brand?: string): CatalogMachineEntry[] {
  const all = getAllCatalogMachines();
  const q = query.toLowerCase().trim();
  const b = brand?.toLowerCase().trim();

  return all.filter(m => {
    if (b && b !== 'todas' && m.brand.toLowerCase() !== b) {
      return false;
    }
    if (!q) return true;
    const matchName = m.modelName.toLowerCase().includes(q);
    const matchBrand = m.brand.toLowerCase().includes(q);
    const matchLine = (m.line || '').toLowerCase().includes(q);
    const matchGroup = m.muscleGroupLabel.toLowerCase().includes(q);
    const matchCanon = m.canonicalExerciseType.toLowerCase().includes(q);
    return matchName || matchBrand || matchLine || matchGroup || matchCanon;
  });
}
