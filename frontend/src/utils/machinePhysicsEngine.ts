// ==========================================
// CHΔNCE MACHINE KINEMATICS & PHYSICS ENGINE
// 4-Parameter Physical Model + Mathematical Torque & Mismatch Analysis
// τ = F · L · sin(θ)
// ==========================================

import { MUSCLE_STRENGTH_PROFILES, resolveJointMovement, type JointMovementType } from './musclePhysiology';

export type TransmissionType = 'plate_loaded_lever' | 'cable_constant_cam' | 'cable_variable_cam';
export type MovementPath = 'converging' | 'diverging' | 'linear';
export type MachineStability = 'high' | 'medium' | 'low';

export interface MachineMechanicalSpec {
  transmission_type: TransmissionType;
  theta_start: number; // Ángulo inicial del brazo de palanca respecto a la gravedad en grados (ej: 30°)
  theta_end: number;   // Ángulo final en máxima contracción respecto a la gravedad en grados (ej: 90°)
  path: MovementPath;  // Trayectoria espacial del agarre
  stability: MachineStability; // Soporte corporal (apoyo en pecho, cinturón pélvico, libre)
  lever_length_cm?: number; // Longitud del brazo de palanca (opcional, default 60 cm)
  counterweight_kg?: number; // Contrapeso de inercia si aplica
}

export interface BiomechanicalMatchResult {
  match_score: number; // 0 a 100
  is_optimized: boolean; // true si match_score >= 88%
  badge_label: string;
  badge_color: 'green' | 'amber' | 'blue';
  mismatch_delta: number[]; // 10 puntos de diferencia: Capacidad_Musculo - Resistencia_Maquina
  shortening_mismatch: boolean; // Máquina exige mucho en acortamiento donde el músculo decae
  stretch_mismatch: boolean; // Resistencia excesiva en máxima elongación
  primary_hack: string;
  band_hack: string;
  pad_hack: string;
  summary_cue: string;
  setup_explanation?: string;
}

/**
 * Checks if machine is a plate-loaded pull (row, pulldown, t-bar) from Technogym Pure or Hammer Strength
 */
export function isPlateLoadedPullMachine(templateId: string, title: string = '', brand: string = ''): boolean {
  const t = title.toLowerCase();
  const id = templateId.toLowerCase();
  const b = brand.toLowerCase();
  // T-Bar row has fixed chest support with descending profile; seat height laws apply to seated rows/pulldowns
  if (t.includes('t-bar') || t.includes('t bar') || id.includes('t_bar')) return false;

  const isPull = t.includes('row') || t.includes('remo') || 
                 t.includes('pulldown') || t.includes('jalón') || t.includes('jalon') ||
                 id.includes('row') || id.includes('pulldown');
  const isPlate = (b.includes('technogym') && (t.includes('pure') || id.includes('pure'))) ||
                  b.includes('hammer') || t.includes('discos') || id.includes('plate_loaded');
  return isPull && isPlate;
}

/**
 * Calculates machine resistance percentage (0 to 100%) across 10 ROM points
 * using physical torque formula: τ = F · L · sin(θ), accounting for seat height and body posture.
 */
export function computeMachineTorqueCurve(
  spec: MachineMechanicalSpec,
  setupMode: 'standard' | 'low_or_unilateral' = 'standard',
  isPlatePull: boolean = false,
  tbarMode: 'standard_steps' | 'floor_standing' = 'standard_steps'
): [number, number, number, number, number, number, number, number, number, number] {
  // SPECIAL BIOMECHANICAL LAW: Technogym Pure T-Bar Row Kinematics (Dual Posture Modes)
  const isTBar = (spec.theta_start === 90 && spec.theta_end === 45) || (spec.theta_start === 45 && spec.theta_end === 90);
  if (isTBar) {
    if (tbarMode === 'standard_steps') {
      // Diseño de fábrica con apoyo en banco y pies en escalón:
      // Empieza por debajo de 90° respecto al suelo (~45°) y al tirar se acerca a los 90° -> Perfil Ascendente (más pesado al final)
      return [71, 74, 78, 83, 88, 92, 95, 98, 99, 100];
    } else {
      // Separado o de pie con pies en el suelo:
      // La palanca empieza en 90° con 100% de par y al tirar sube superando la horizontal -> Perfil Descendente (aligera la carga)
      return [100, 99, 98, 95, 92, 88, 83, 78, 74, 71];
    }
  }

  // SPECIAL BIOMECHANICAL LAW: Technogym & Hammer Strength Plate-Loaded Rows and Pulldowns
  if (isPlatePull) {
    if (setupMode === 'low_or_unilateral') {
      // Asiento Bajo (Pin #6-#12) / De pie o sentado a 1 mano separado del respaldo:
      // Curva en campana: 80% estiramiento -> 100% pico en zona media -> 80% acortamiento
      return [80, 84, 91, 97, 100, 97, 91, 84, 80, 78];
    } else {
      // Asiento Estándar (Pin #1-#5):
      // Perfil ascendente: cuanto más traccionas más cuesta, alcanzando el 100% en el bloqueo terminal a 90°
      return [58, 63, 69, 75, 82, 88, 93, 97, 99, 100];
    }
  }

  const points: number[] = [];
  const { transmission_type, theta_start, theta_end } = spec;

  if (transmission_type === 'plate_loaded_lever') {
    // Torque varies with sin(theta) where theta is angle to vertical (gravity)
    const radStart = (theta_start * Math.PI) / 180;
    const radEnd = (theta_end * Math.PI) / 180;

    // Sample 10 points from 0% (start/stretch) to 100% (end/shortening)
    const torques: number[] = [];
    for (let i = 0; i < 10; i++) {
      const t = i / 9.0;
      const currentTheta = radStart + t * (radEnd - radStart);
      const torque = Math.abs(Math.sin(currentTheta));
      torques.push(torque);
    }

    const maxTorque = Math.max(...torques, 0.001);
    for (let i = 0; i < 10; i++) {
      const pct = Math.round((torques[i] / maxTorque) * 100);
      points.push(Math.max(20, Math.min(100, pct)));
    }
  } else if (transmission_type === 'cable_variable_cam') {
    // Variable eccentric cam (Nautilus / Gym80 cam profile)
    for (let i = 0; i < 10; i++) {
      const t = i / 9.0;
      const camFactor = 1.0 - 0.25 * Math.pow(t - 0.45, 2) * 4;
      const pct = Math.round(camFactor * 100);
      points.push(Math.max(40, Math.min(100, pct)));
    }
  } else {
    // cable_constant_cam (Traditional circular pulley / weight stack)
    for (let i = 0; i < 10; i++) {
      const t = i / 9.0;
      const pct = Math.round(90 + Math.sin(t * Math.PI) * 5);
      points.push(pct);
    }
  }

  return points as [number, number, number, number, number, number, number, number, number, number];
}

/**
 * Computes exact mathematical delta between muscle strength curve and machine resistance curve
 * and determines automatic mismatch triggers without LLM hallucinations.
 */
export function analyzeBiomechanicsMatch(
  muscleCurve: [number, number, number, number, number, number, number, number, number, number],
  machineCurve: [number, number, number, number, number, number, number, number, number, number],
  spec: MachineMechanicalSpec,
  setupMode: 'standard' | 'low_or_unilateral' = 'standard',
  isPlatePull: boolean = false,
  tbarMode: 'standard_steps' | 'floor_standing' = 'standard_steps'
): BiomechanicalMatchResult {
  // Delta = Capacidad_Musculo(%) - Resistencia_Maquina(%)
  const mismatch_delta = muscleCurve.map((m, idx) => m - machineCurve[idx]);

  // Special kinematic analysis for Technogym Pure T-Bar Row (Dual Postures: Banco/Escalón vs De pie/Suelo)
  const isTBar = (spec.theta_start === 90 && spec.theta_end === 45) || (spec.theta_start === 45 && spec.theta_end === 90);
  if (isTBar) {
    if (tbarMode === 'standard_steps') {
      return {
        match_score: 74,
        is_optimized: false,
        badge_label: 'Perfil Ascendente (Pies en Escalón - Pesado a 90°)',
        badge_color: 'amber',
        mismatch_delta,
        shortening_mismatch: true,
        stretch_mismatch: false,
        primary_hack: 'Cinemática de Fábrica (Pies en Escalón): La palanca inicia por debajo de los 90° (~45° respecto al suelo) y a medida que traccionas se aproxima a los 90°. La carga se vuelve más pesada al final del recorrido (100%), coincidiendo con la insuficiencia activa del dorsal.',
        band_hack: 'Nota de Fábrica Technogym: Technogym únicamente equipa clavijas/pivotes oficiales para bandas elásticas en 3 máquinas de discos: Abductor de pie, Hip Thrust y Sentadilla Hack. El Remo en T no incluye anclajes de fábrica.',
        pad_hack: 'Física de Apoyo Plantar: Al apoyar los pies en el escalón estás fijado al cojín torácico. Si notas que te bloqueas en la contracción final a 90°, cambia la postura bajando los pies al suelo o separándote ligeramente del respaldo para convertir el perfil en descendente.',
        summary_cue: 'Perfil ascendente de fábrica: 71% en estiramiento y pico del 100% en la contracción final a 90°.',
        setup_explanation: 'El soporte pectoral es fijo. Con los pies en el escalón la palanca rota hacia los 90° en acortamiento.'
      };
    } else {
      return {
        match_score: 96,
        is_optimized: true,
        badge_label: 'Perfil Descendente Optimizado (Pies en Suelo / Separado)',
        badge_color: 'green',
        mismatch_delta,
        shortening_mismatch: false,
        stretch_mismatch: false,
        primary_hack: 'Configuración Separado / De Pie (Pies en Suelo): Al apoyar los pies en el suelo y erguir la postura, la palanca inicia perpendicular a la gravedad a 90° (100% de par torsor en máximo estiramiento). Al traccionar hacia el pecho sube superando la horizontal (~45°/135°), aligerando la resistencia al ~71% en máxima contracción para facilitar el cierre escapular.',
        band_hack: 'Nota de Fábrica Technogym: Technogym únicamente equipa clavijas/pivotes oficiales para bandas en 3 máquinas de discos (Abductor de pie, Hip Thrust y Sentadilla Hack). No requiere bandas en este modo puesto que el perfil ya aligera la carga al final.',
        pad_hack: 'Física de Apoyo en Suelo: Al colocar los pies en el suelo no colapsas tu peso contra el cojín pectoral, expandes las costillas con facilidad y respiras con libertad.',
        summary_cue: 'Perfil descendente óptimo: 100% en estiramiento y descenso suave al ~71% en acortamiento.',
        setup_explanation: 'Postura separada con pies en el suelo: inicia a 90° y aligera la carga al subir hacia el pecho.'
      };
    }
  }

  // Average absolute deviation across 10 ROM points
  const totalDev = mismatch_delta.reduce((acc, d) => acc + Math.abs(d), 0);
  const avgDev = totalDev / 10.0;
  const match_score = Math.max(50, Math.min(99, Math.round(100 - avgDev * 1.1)));

  const shortening_mismatch = isPlatePull && setupMode === 'low_or_unilateral'
    ? false
    : (machineCurve[9] >= 85 && muscleCurve[9] <= 55);
  const stretch_mismatch = machineCurve[0] >= 85 && muscleCurve[0] <= 55;
  const is_optimized = (isPlatePull && setupMode === 'low_or_unilateral') || (match_score >= 85 && !shortening_mismatch);

  let badge_label = 'Perfil Optimizado (Alineación Alta)';
  let badge_color: 'green' | 'amber' | 'blue' = 'green';

  if (is_optimized) {
    badge_label = isPlatePull && setupMode === 'low_or_unilateral'
      ? 'Perfil en Campana Optimizado (Pico en Zona Media)'
      : 'Perfil Optimizado (Coincidencia > 90%)';
    badge_color = 'green';
  } else if (shortening_mismatch) {
    badge_label = isPlatePull && setupMode === 'standard'
      ? 'Perfil Ascendente (Desajuste en Acortamiento)'
      : 'Desajuste en Acortamiento (Brazo 90°)';
    badge_color = 'amber';
  } else {
    badge_label = 'Perfil Moderado (Torque Constante)';
    badge_color = 'blue';
  }

  // Generate deterministic biomechanical cues based on physical variables
  let primary_hack = '';
  let band_hack = '';
  let pad_hack = '';
  let summary_cue = '';
  let setup_explanation = '';

  if (isPlatePull) {
    setup_explanation = 'En jalones y remos de discos de Technogym Pure y Hammer Strength, la curva depende críticamente de la regulación: con asiento estándar (#1-#5), el perfil es ascendente (máxima resistencia en el bloqueo final). Si bajas el asiento (#6-#12) o en remos trabajas de pie o sentado a una mano separado del respaldo, la palanca alcanza los 90° en la zona media generando una curva en campana (80%-100%-80%) que encaja con la capacidad contráctil del dorsal.';

    if (setupMode === 'low_or_unilateral') {
      primary_hack = 'Configuración con Asiento Bajo (#6-#12) / Separado del Respaldo: Al descender el centro de tracción, la palanca cruza los 90° respecto a la gravedad justo en la zona media (50% ROM). La carga máxima (100%) coincide donde el músculo genera más fuerza (~95%), y aligera la carga al 80% en acortamiento evitando la insuficiencia activa.';
      band_hack = 'No requiere bandas auxiliares: la propia cinemática de la máquina con asiento bajo reproduce la curva de fuerza articular natural.';
      pad_hack = 'Si trabajas a 1 mano separado del respaldo, coloca la mano contralateral firme sobre el cojín para estabilizar la pelvis y la columna lumbar.';
      summary_cue = 'Curva en campana perfecta: 80% al inicio, pico del 100% a mitad del recorrido y descenso a 80% en acortamiento.';
    } else {
      primary_hack = 'Configuración con Asiento Estándar (#1-#5): Perfil ascendente. Cuanto más traccionas, la palanca se aproxima a los 90° con la gravedad y más cuesta al final, justo cuando el dorsal se acorta y pierde fuerza. Si quieres alinear la carga con tu fuerza natural, baja el asiento al pin #6-#12 o ejecuta el ejercicio a una mano separado del respaldo.';
      band_hack = 'Hack de Bandas Acomodadas: Ancla una banda elástica ligera en el chasis superior para aligerar los últimos 15 cm de tracción y no quedar bloqueado.';
      pad_hack = 'Hack de Regulación Rápida: Baja el asiento 3 a 5 puntos (a #6 o más) para transformar de inmediato este perfil ascendente en una campana biomecánicamente óptima.';
      summary_cue = 'Perfil ascendente: la máquina se vuelve más pesada en el acortamiento (pico a 90° en contracción final).';
    }
  } else if (shortening_mismatch) {
    primary_hack = 'Desajuste en acortamiento detectado: la palanca alcanza ~90° respecto a la gravedad en máxima contracción donde el músculo sufre insuficiencia activa. Realiza repeticiones parciales pesadas en el rango medio/estirado (0% a 70% ROM) para máxima hipertrofia mediada por tensión.';
    band_hack = 'Hack de Bandas Acomodadas: Ancla una banda de resistencia ligera o media desde la parte superior del chasis para aligerar la fase final de contracción y equiparar el brazo de momento.';
    pad_hack = 'Ajuste de tope: Si la máquina dispone de tope regulable, bloquéalo 10° antes del cierre articular completo.';
    summary_cue = 'La máquina se vuelve más pesada al final del recorrido (perfil ascendente), justo donde la capacidad contráctil del músculo decae.';
  } else if (stretch_mismatch) {
    primary_hack = 'Desajuste en estiramiento: la carga máxima coincide con elongación extrema muscular. Evita rebotes o arrancadas bruscas en el inicio.';
    band_hack = 'Banda de ayuda en despegue: usa bandas en tracción inversa ("reverse band") para reducir la tensión patelar o glenoidea en el inicio.';
    pad_hack = 'Coloca una almohadilla o pad denso de 5 cm en el apoyo para acotar 3-5 cm el rango extremo sin perder tensión activa.';
    summary_cue = 'Pico de resistencia concentrado en la elongación profunda; requiere aceleración controlada sin tirones.';
  } else {
    primary_hack = 'Excelente correspondencia mecánica: la curva de resistencia de la palanca acompaña de forma orgánica la capacidad de producción de fuerza articular a lo largo de todo el recorrido.';
    band_hack = 'No requiere bandas de modificación: el perfil natural de la máquina optimiza la tensión mecánica continua.';
    pad_hack = 'Regula el asiento para que el eje anatómico coincida con el pasador giratorio del eje de la máquina.';
    summary_cue = 'Correspondencia biomecánica óptima: tensión homogénea sin valles de inercia.';
  }

  if (spec.stability === 'high' && !isPlatePull) {
    pad_hack += ' El apoyo rígido en el torso/pelvis maximiza la transferencia de fuerza eliminando pérdidas por estabilización axial.';
  }

  return {
    match_score,
    is_optimized,
    badge_label,
    badge_color,
    mismatch_delta,
    shortening_mismatch,
    stretch_mismatch,
    primary_hack,
    band_hack,
    pad_hack,
    summary_cue,
    setup_explanation
  };
}

/**
 * Standard registry of physical machine properties (4 mechanical parameters)
 * for key catalog equipment
 */
export const MACHINE_MECHANICAL_SPECS: Record<string, MachineMechanicalSpec> = {
  // Technogym Pure Strength - Chest Press: Palanca ascendente que llega a 90° en bloqueo
  technogym_pure_chest_press: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 35,
    theta_end: 90,
    path: 'converging',
    stability: 'high'
  },

  // Technogym Pure Strength - Pulldown (Jalón a discos): Palanca ascendente con asiento #1-#5
  technogym_pure_pulldown: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 38,
    theta_end: 90,
    path: 'converging',
    stability: 'high'
  },

  // Technogym Pure Strength - T-Bar Row (Remo en T de discos - Perfil Descendente real a 90° de inicio)
  technogym_pure_t_bar_row: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 90,
    theta_end: 45,
    path: 'converging',
    stability: 'high'
  },

  // Technogym Pure Strength - Deadlift (Peso Muerto a discos)
  technogym_pure_deadlift: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 40,
    theta_end: 85,
    path: 'converging',
    stability: 'high'
  },

  // Technogym Pure Strength - Low Row / Row Dorian: Palanca divergente horizontal
  technogym_pure_low_row: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 45,
    theta_end: 88,
    path: 'converging',
    stability: 'high'
  },
  technogym_pure_row_dorian: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 45,
    theta_end: 88,
    path: 'converging',
    stability: 'high'
  },

  // Technogym Pure Strength - Incline Chest Press
  technogym_pure_incline_chest_press: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 32,
    theta_end: 90,
    path: 'converging',
    stability: 'high'
  },

  // Technogym Pure Strength - Wide Chest Press
  technogym_pure_wide_chest: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 38,
    theta_end: 88,
    path: 'converging',
    stability: 'high'
  },

  // Technogym Pure Strength - Shoulder Press
  technogym_pure_shoulder_press: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 35,
    theta_end: 88,
    path: 'converging',
    stability: 'high'
  },

  // Technogym Pure Strength - Biceps Curl
  technogym_pure_arm_curl: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 30,
    theta_end: 90,
    path: 'linear',
    stability: 'high'
  },

  // Technogym Pure Strength - Seated Dip / Triceps
  technogym_pure_seated_dip: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 40,
    theta_end: 88,
    path: 'linear',
    stability: 'high'
  },

  // Technogym Pure Strength - Hip Thrust (Discos)
  technogym_pure_hip_thrust: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 40,
    theta_end: 90,
    path: 'linear',
    stability: 'high'
  },

  // Technogym Selection - Hip Thrust (Placas / Polea)
  technogym_selection_hip_thrust: {
    transmission_type: 'cable_constant_cam',
    theta_start: 45,
    theta_end: 80,
    path: 'linear',
    stability: 'high'
  },

  // Technogym Selection - Wide Row (Remo abierto de placas para deltoides posterior y trapecio)
  technogym_selection_wide_row: {
    transmission_type: 'cable_constant_cam',
    theta_start: 40,
    theta_end: 75,
    path: 'diverging',
    stability: 'high'
  },

  // Technogym Selection - Low Row (Remo cerrado de placas)
  technogym_selection_low_row: {
    transmission_type: 'cable_constant_cam',
    theta_start: 30,
    theta_end: 70,
    path: 'linear',
    stability: 'high'
  },

  // Technogym Selection - Chest Press (Placas)
  technogym_selection_chest_press: {
    transmission_type: 'cable_constant_cam',
    theta_start: 30,
    theta_end: 65,
    path: 'converging',
    stability: 'high'
  },

  // Technogym Selection - Lat Machine (Polea alta)
  technogym_selection_lat_machine: {
    transmission_type: 'cable_constant_cam',
    theta_start: 30,
    theta_end: 60,
    path: 'linear',
    stability: 'high'
  },

  // Technogym Pure Strength - Leg Extension (Leva variable)
  technogym_pure_leg_extension: {
    transmission_type: 'cable_variable_cam',
    theta_start: 25,
    theta_end: 90,
    path: 'linear',
    stability: 'high'
  },

  // Technogym Pure Strength - Leg Press


  technogym_pure_belt_squat: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 35,
    theta_end: 80,
    path: 'linear',
    stability: 'high'
  },
  technogym_selection_multi_hip: {
    transmission_type: 'cable_variable_cam',
    theta_start: 30,
    theta_end: 90,
    path: 'converging',
    stability: 'high'
  },
  technogym_pure_leg_press: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 45,
    theta_end: 85,
    path: 'linear',
    stability: 'high'
  },

  // Hammer Strength - Chest Supported T-Bar Row
  hammer_chest_supported_t_bar_row: {
    transmission_type: 'plate_loaded_lever',
    theta_start: 35,
    theta_end: 88,
    path: 'linear',
    stability: 'high'
  }
};
