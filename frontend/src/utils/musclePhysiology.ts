// ==========================================
// CHΔNCE MUSCLE PHYSIOLOGY ENGINE
// Internal muscle force capacity profiles across 10-point ROM (0% -> 100%)
// Based on length-tension relationship (sarcomere overlap) & internal moment arm literature
// ==========================================

export type JointMovementType =
  | 'shoulder_extension_adduction' // Dorsal ancho (Lats), Redondo mayor
  | 'horizontal_adduction'         // Pectoral mayor (clavicular + external)
  | 'horizontal_abduction'         // Deltoides posterior, trapecio medio, romboides
  | 'shoulder_abduction'           // Deltoides lateral
  | 'shoulder_flexion'             // Deltoides anterior
  | 'elbow_flexion'                // Bíceps braquial, braquial anterior
  | 'elbow_extension'              // Tríceps braquial
  | 'knee_extension'               // Cuádriceps (recto femoral, vastos)
  | 'knee_flexion'                 // Isquiosurales (bíceps femoral, semitendinoso)
  | 'hip_extension'                // Glúteo mayor
  | 'hip_abduction'                // Glúteo medio, glúteo menor, TFL
  | 'hip_adduction'                // Aductor mayor, aductor largo, recto interno
  | 'plantar_flexion'              // Gemelos (gastrocnemio), sóleo
  | 'spinal_extension';            // Erectores espinales, cuadrado lumbar

export interface MuscleStrengthProfile {
  movement: JointMovementType;
  primary_muscle: string;
  scientific_name: string;
  peak_rom_percent: number; // 0% (máximo estiramiento) a 100% (máximo acortamiento)
  // 10 puntos de ROM normalizados de 0% a 100% de fuerza interna relativa (%)
  curve_10_points: [number, number, number, number, number, number, number, number, number, number];
  physiology_notes: string;
  active_insufficiency_warning?: string;
}

export const MUSCLE_STRENGTH_PROFILES: Record<JointMovementType, MuscleStrengthProfile> = {
  // 1. DORSAL ANCHO (Tracciones verticales y horizontales)
  shoulder_extension_adduction: {
    movement: 'shoulder_extension_adduction',
    primary_muscle: 'Dorsal Ancho & Redondo Mayor',
    scientific_name: 'Latissimus dorsi / Teres major',
    peak_rom_percent: 35,
    // Pico en rango medio-estirado (~30-40% ROM), caída acusada en acortamiento terminal
    curve_10_points: [82, 92, 98, 96, 90, 80, 68, 56, 45, 38],
    physiology_notes: 'Máxima capacidad de torque entre 30% y 50% del recorrido donde el brazo de momento interno del dorsal respecto al húmero es óptimo. En acortamiento completo (húmero tras el plano frontal), entra en insuficiencia activa perdiendo más del 50% de capacidad contráctil.',
    active_insufficiency_warning: 'Desajuste fisiológico en acortamiento: el dorsal pierde drásticamente brazo de palanca interno al finalizar la tracción.'
  },

  // 2. PECTORAL MAYOR (Empujes horizontales, aperturas)
  horizontal_adduction: {
    movement: 'horizontal_adduction',
    primary_muscle: 'Pectoral Mayor',
    scientific_name: 'Pectoralis major (sternocostal & clavicular)',
    peak_rom_percent: 40,
    // Pico en rango estirado-medio (30-50%), pierde fuerza en bloqueo terminal
    curve_10_points: [72, 85, 95, 98, 92, 82, 72, 62, 52, 44],
    physiology_notes: 'Gran capacidad de producción de fuerza pasiva + activa en estiramiento profundo. Al alcanzar la aducción completa con manos juntas, la superposición de actina-miosina satura y la orientación de las fibras reduce el brazo de momento interno.',
    active_insufficiency_warning: 'En aducción máxima las fibras se acortan excesivamente; máquinas con pico a 90° al final sobrecargan el eslabón débil.'
  },

  // 3. DELTOIDES POSTERIOR / TRAPECIO (Remos abiertos, pájaros)
  horizontal_abduction: {
    movement: 'horizontal_abduction',
    primary_muscle: 'Deltoides Posterior & Trapecio Medio/Romboides',
    scientific_name: 'Deltoideus posterior / Rhomboidei / Trapezius',
    peak_rom_percent: 35,
    curve_10_points: [68, 82, 95, 98, 92, 80, 68, 55, 45, 38],
    physiology_notes: 'El deltoides posterior genera su pico de tensión con los codos a 30°-45° de abducción horizontal; en retracción escapular extrema acorta rápido.'
  },

  // 4. DELTOIDES LATERAL (Elevaciones laterales)
  shoulder_abduction: {
    movement: 'shoulder_abduction',
    primary_muscle: 'Deltoides Lateral',
    scientific_name: 'Deltoideus medius',
    peak_rom_percent: 50,
    // Campana centrada en 60°-90° de abducción del húmero
    curve_10_points: [52, 65, 78, 90, 98, 95, 84, 70, 56, 42],
    physiology_notes: 'A 0° (brazo pegado al cuerpo) el brazo de momento del deltoides es mínimo (el supraespinoso inicia la abducción). Entre 60° y 90° alcanza su ventaja mecánica máxima.',
    active_insufficiency_warning: 'A 0° el músculo está en desventaja mecánica. Por encima de 90° el trapecio asume la rotación escapular superior.'
  },

  // 5. DELTOIDES ANTERIOR (Press militar, press inclinado)
  shoulder_flexion: {
    movement: 'shoulder_flexion',
    primary_muscle: 'Deltoides Anterior',
    scientific_name: 'Deltoideus anterior',
    peak_rom_percent: 40,
    curve_10_points: [62, 78, 92, 98, 94, 85, 74, 62, 50, 40],
    physiology_notes: 'Pico de producción de fuerza en 45°-60° de flexión glenohumeral, estabilizándose hacia el bloqueo sobre la cabeza.'
  },

  // 6. BÍCEPS BRAQUIAL (Curls de bíceps)
  elbow_flexion: {
    movement: 'elbow_flexion',
    primary_muscle: 'Bíceps Braquial & Braquial Anterior',
    scientific_name: 'Biceps brachii / Brachialis',
    peak_rom_percent: 50,
    // Pico clásico a 90° de flexión del codo
    curve_10_points: [55, 68, 82, 94, 100, 94, 82, 68, 54, 42],
    physiology_notes: 'El brazo de momento interno del tendón del bíceps en la tuberosidad bicipital del radio alcanza su mayor longitud a 90° de flexión. En extensión completa (0°) y flexión extrema (>130°) el brazo de momento cae a menos de la mitad.',
    active_insufficiency_warning: 'Con el hombro flexionado y el codo totalmente flexionado, el bíceps entra en insuficiencia activa biarticular.'
  },

  // 7. TRÍCEPS BRAQUIAL (Extensiones, fondos, press cerrado)
  elbow_extension: {
    movement: 'elbow_extension',
    primary_muscle: 'Tríceps Braquial',
    scientific_name: 'Triceps brachii (lateral, medial & long head)',
    peak_rom_percent: 45,
    curve_10_points: [58, 72, 86, 96, 100, 92, 80, 68, 55, 45],
    physiology_notes: 'Pico de torque alrededor de 90° de flexión de codo. En bloqueo articular completo a 180° la ventaja mecánica muscular decae aunque los huesos transmitan la compresión.'
  },

  // 8. CUÁDRICEPS (Extensiones de rodilla, prensa, sentadilla)
  knee_extension: {
    movement: 'knee_extension',
    primary_muscle: 'Cuádriceps Femoral',
    scientific_name: 'Quadriceps femoris (vastus lat, med, int & rectus femoris)',
    peak_rom_percent: 50,
    // Curva acampanada con pico a 60° de flexión de rodilla (~50% ROM)
    curve_10_points: [60, 74, 88, 96, 100, 95, 84, 70, 56, 42],
    physiology_notes: 'La rótula amplifica el brazo de momento del tendón rotuliano, con pico de par motor biomecánico entre 55° y 65° de flexión de rodilla. A 0° (bloqueo completo) y >110° de flexión profunda, la capacidad de tensión activa se reduce significativamente.',
    active_insufficiency_warning: 'En bloqueo completo (0° extensión) el recto femoral biarticular pierde tensión activa si la cadera está flexionada a 90°.'
  },

  // 9. ISQUIOSURALES (Curl femoral sentado / tumbado)
  knee_flexion: {
    movement: 'knee_flexion',
    primary_muscle: 'Isquiosurales / Femorales',
    scientific_name: 'Hamstrings (biceps femoris, semitendinosus, semimembranosus)',
    peak_rom_percent: 35,
    curve_10_points: [75, 88, 98, 96, 88, 78, 66, 54, 44, 35],
    physiology_notes: 'Pico de fuerza en los primeros 30°-45° de flexión de rodilla desde el estiramiento completo. A 90°-120° de flexión los isquiosufren fuerte acortamiento y propensión a calambres por insuficiencia activa.',
    active_insufficiency_warning: 'En curl femoral prono, la hiperextensión de cadera acorta los isquiosurates reduciendo su capacidad de generar tensión terminal.'
  },

  // 10. GLÚTEO MAYOR (Hip thrust, extensión de cadera)
  hip_extension: {
    movement: 'hip_extension',
    primary_muscle: 'Glúteo Mayor',
    scientific_name: 'Gluteus maximus',
    peak_rom_percent: 85,
    // Perfil ASCENDENTE: más fuerte a medida que se extiende la cadera hacia 180°
    curve_10_points: [52, 60, 70, 78, 86, 92, 96, 99, 100, 96],
    physiology_notes: 'El glúteo mayor tiene un perfil de fuerza marcadamente ascendente: su brazo de palanca y capacidad de reclutamiento neuromuscular aumentan a medida que la cadera pasa de 90° de flexión a 0° de extensión neutral (180° respecto al fémur).',
    active_insufficiency_warning: 'En flexión profunda de cadera (>90°), el glúteo está elongado pero los aductores e isquiotibiales asumen mayor proporción del par extensor.'
  },

  // 11. GLÚTEO MEDIO / ABDUCTORES (Abductor machine)
  hip_abduction: {
    movement: 'hip_abduction',
    primary_muscle: 'Glúteo Medio & Menor',
    scientific_name: 'Gluteus medius / Gluteus minimus / TFL',
    peak_rom_percent: 45,
    curve_10_points: [64, 78, 90, 98, 96, 88, 78, 66, 54, 44],
    physiology_notes: 'Pico de fuerza entre 15° y 30° de abducción de cadera; decae al aproximarse al tope articular lateral.'
  },

  // 12. ADUCTORES (Aductor machine)
  hip_adduction: {
    movement: 'hip_adduction',
    primary_muscle: 'Aductor Mayor & Largo',
    scientific_name: 'Adductor magnus / longus / brevis',
    peak_rom_percent: 30,
    curve_10_points: [78, 90, 98, 94, 86, 76, 65, 54, 45, 36],
    physiology_notes: 'Máxima fuerza en estiramiento amplio donde la arquitectura peniforme del aductor mayor genera tensión elástica pasiva alta.'
  },

  // 13. GEMELOS Y SÓLEO (Elevación de talones)
  plantar_flexion: {
    movement: 'plantar_flexion',
    primary_muscle: 'Gastrocnemio & Sóleo',
    scientific_name: 'Triceps surae (gastrocnemius & soleus)',
    peak_rom_percent: 40,
    curve_10_points: [68, 82, 94, 98, 94, 84, 72, 60, 48, 38],
    physiology_notes: 'El tendón de Aquiles almacena alta energía elástica en dorsiflexión profunda. En flexión plantar terminal (puntillas máximas), la fuerza muscular activa decae notablemente.'
  },

  // 14. ERECTORES ESPINALES (Extensiones lumbares)
  spinal_extension: {
    movement: 'spinal_extension',
    primary_muscle: 'Erectores Espinales & Multífidos',
    scientific_name: 'Erector spinae / Multifidus',
    peak_rom_percent: 40,
    curve_10_points: [62, 76, 90, 98, 94, 86, 76, 65, 54, 44],
    physiology_notes: 'Pico de fuerza en la posición neutra vertebral (curvatura lordótica natural).'
  }
};

/**
 * Maps any common muscle group or exercise title to its anatomical joint movement
 */
export function resolveJointMovement(muscleGroup: string, title: string = ''): JointMovementType {
  const t = title.toLowerCase();
  const m = muscleGroup.toLowerCase();

  // Specific title overrides
  if (t.includes('hip thrust') || t.includes('glute drive')) return 'hip_extension';
  if (t.includes('abductor') || t.includes('abducción')) return 'hip_abduction';
  if (t.includes('adductor') || t.includes('aductor') || t.includes('aducción')) return 'hip_adduction';
  if (t.includes('leg curl') || t.includes('femoral') || t.includes('isquios')) return 'knee_flexion';
  if (t.includes('leg extension') || t.includes('extensión de cuadriceps') || t.includes('extensión cuadriceps')) return 'knee_extension';
  if (t.includes('press banca') || t.includes('chest press') || t.includes('pecho') || t.includes('pec deck') || t.includes('aperturas')) return 'horizontal_adduction';
  if (t.includes('remo abierto') || t.includes('wide row') || t.includes('pájaro') || t.includes('rear delt')) return 'horizontal_abduction';
  if (t.includes('pulldown') || t.includes('jalón') || t.includes('remo') || t.includes('row') || t.includes('t-bar') || t.includes('t bar')) return 'shoulder_extension_adduction';
  if (t.includes('lateral raise') || t.includes('elevación lateral') || t.includes('elevaciones laterales')) return 'shoulder_abduction';
  if (t.includes('shoulder press') || t.includes('press militar') || t.includes('press de hombro')) return 'shoulder_flexion';
  if (t.includes('biceps') || t.includes('bíceps') || t.includes('arm curl') || t.includes('curl')) return 'elbow_flexion';
  if (t.includes('triceps') || t.includes('tríceps') || t.includes('dip') || t.includes('fondos') || t.includes('press francés')) return 'elbow_extension';
  if (t.includes('calf') || t.includes('gemelo') || t.includes('talones')) return 'plantar_flexion';
  if (t.includes('lumbar') || t.includes('back extension') || t.includes('erector')) return 'spinal_extension';

  // Fallback to muscle group
  switch (m) {
    case 'chest':
    case 'pectoral':
      return 'horizontal_adduction';
    case 'back':
    case 'lats':
    case 'upper_back':
    case 'espalda':
      return 'shoulder_extension_adduction';
    case 'quads':
    case 'quadriceps':
    case 'cuadriceps':
      return 'knee_extension';
    case 'hamstrings':
    case 'isquios':
      return 'knee_flexion';
    case 'glutes':
    case 'gluteos':
      return 'hip_extension';
    case 'biceps':
      return 'elbow_flexion';
    case 'triceps':
      return 'elbow_extension';
    case 'shoulders':
    case 'hombros':
      return 'shoulder_abduction';
    case 'calves':
    case 'gemelos':
      return 'plantar_flexion';
    default:
      return 'horizontal_adduction';
  }
}

/**
 * Returns the exact 10-point physiological curve for any given movement or muscle
 */
export function getMuscleStrengthCurve10(movementOrMuscle: string, title: string = ''): [number, number, number, number, number, number, number, number, number, number] {
  const movement = MUSCLE_STRENGTH_PROFILES[movementOrMuscle as JointMovementType]
    ? (movementOrMuscle as JointMovementType)
    : resolveJointMovement(movementOrMuscle, title);

  const profile = MUSCLE_STRENGTH_PROFILES[movement];
  return profile ? profile.curve_10_points : [70, 80, 90, 95, 95, 90, 80, 70, 60, 50];
}
