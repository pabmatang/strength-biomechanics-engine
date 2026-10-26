import { ExerciseTemplate } from '../types/workout';

export const FREE_EXERCISES_DATABASE: ExerciseTemplate[] = [
  // ==========================================
  // MANCUERNAS (DUMBBELLS)
  // ==========================================
  {
    id: 'dumbbell_flat_bench_press',
    title: 'Press Plano con Mancuernas',
    brand: 'Eleiko',
    model_series: 'Evo Dumbbells & Flat Bench',
    muscle_group: 'chest',
    other_muscles: ['shoulders', 'triceps'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Empuje horizontal básico con mancuernas para pectoral mayor (haz esternal), con libertad articular y rango profundo.',
    setup_tips: [
      'Retracción y depresión escapular constante sobre el tapiz del banco',
      'Desciende las mancuernas en un ángulo humeral de 45°-60° con el torso',
      'Pausa de 1 segundo en máximo estiramiento antes de empujar con fuerza'
    ],
    resistance_profile: {
      curve: 'bell_shaped',
      curve_label: 'Curva Acampanada (Máxima tensión en rango medio-estirado)',
      rating: 9.2,
      match_analysis: 'Alta correspondencia con la longitud óptima de los sarcómeros del pectoral esternal.',
      pro_hack: 'Converge ligeramente las mancuernas en la cima sin chocarlas para mantener tensión en el haz medio.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif'
  },
  {
    id: 'dumbbell_lateral_raise',
    title: 'Elevaciones Laterales con Mancuernas',
    brand: 'Eleiko',
    model_series: 'Evo Urethane Dumbbells',
    muscle_group: 'shoulders',
    other_muscles: ['traps'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Aislamiento directo para el deltoides lateral en el plano escapular (30° adelantado respecto al plano coronal).',
    setup_tips: [
      'Inclina levemente el torso 10°-15° hacia adelante para alinear las fibras deltoideas',
      'Piensa en empujar las mancuernas hacia las paredes laterales, no hacia el techo',
      'Detén la subida a la altura exacta de los hombros sin balancear el torso'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Curva en Acortamiento (Brazo de palanca máximo a 90°)',
      rating: 8.8,
      match_analysis: 'El momento de fuerza por gravedad d = L * cos(θ) es máximo cuando el brazo queda paralelo al suelo.',
      pro_hack: 'Hack Pro: Si te sientas o te inclinas apoyando el pecho en un banco a 75°, anulas el rebote pélvico.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif'
  },
  {
    id: 'dumbbell_incline_curl',
    title: 'Curl de Bíceps en Banco Inclinado',
    brand: 'Eleiko',
    model_series: 'Incline Bench Dumbbell Curl',
    muscle_group: 'biceps',
    other_muscles: ['forearms'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Extensión posterior del húmero que coloca la cabeza larga del bíceps en máximo estiramiento anatómico pasivo.',
    setup_tips: [
      'Ajusta el banco a 45°-60° de inclinación',
      'Deja caer los brazos perpendiculares al suelo con los hombros relajados hacia atrás',
      'Supina las muñecas (gira la palma hacia afuera) durante la fase de contracción'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Curva en Estiramiento (Hipertrofia mediada por estiramiento)',
      rating: 9.6,
      match_analysis: 'Estiramiento fascial profundo de la cabeza larga con altísimo reclutamiento distal.',
      pro_hack: 'Mantén los codos clavados en la posición vertical; no los adelantes al subir la carga.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-incline-biceps-curl.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-incline-biceps-curl.gif'
  },
  {
    id: 'dumbbell_hammer_curl',
    title: 'Curl Martillo con Mancuernas',
    brand: 'Eleiko',
    model_series: 'Evo Neutral Grip Dumbbells',
    muscle_group: 'biceps',
    other_muscles: ['forearms'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Agarre neutro (palmas enfrentadas) enfocado en el braquial anterior y el braquiorradial (antebrazo).',
    setup_tips: [
      'Codos pegados a los costados',
      'Sube la mancuerna en dirección al hombro homolateral o ligeramente al esternón',
      'Desciende de forma controlada en 3 segundos sintiendo la tensión en el braquial'
    ],
    resistance_profile: {
      curve: 'bell_shaped',
      curve_label: 'Curva Media (Pico de torque en flexión a 90°)',
      rating: 9.0,
      match_analysis: 'Excelente transferencia para ensanchar el grosor lateral del brazo entre bíceps y tríceps.',
      pro_hack: 'Aprieta con fuerza el meñique contra la empuñadura para mantener el antebrazo alineado.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-hammer-curl.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-hammer-curl.gif'
  },
  {
    id: 'dumbbell_overhead_triceps_extension',
    title: 'Extensión de Tríceps Copa con Mancuerna',
    brand: 'Eleiko',
    model_series: 'Overhead Seated Triceps',
    muscle_group: 'triceps',
    other_muscles: ['shoulders'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Flexión completa del hombro para estirar la cabeza larga del tríceps braquial desde su origen en la escápula.',
    setup_tips: [
      'Sujeta la cara interna del disco superior de la mancuerna con ambas manos en forma de diamante',
      'Mantén los codos apuntando al frente o ligeramente hacia los lados, sin abrirlos excesivamente',
      'Desciende hasta notar un estiramiento profundo detrás de la nuca'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Curva en Estiramiento Profundo',
      rating: 9.4,
      match_analysis: 'La cabeza larga del tríceps sólo alcanza su máximo estímulo hipertrófico con el brazo elevado.',
      pro_hack: 'Usa un respaldo corto (altura lumbar) para no bloquear la movilidad dorsal.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/dumbbell-seated-triceps-extension.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/dumbbell-seated-triceps-extension.gif'
  },
  {
    id: 'dumbbell_one_arm_row',
    title: 'Remo con Mancuerna a una Mano',
    brand: 'Eleiko',
    model_series: 'Supported Single-Arm Row',
    muscle_group: 'lats',
    other_muscles: ['upper_back', 'biceps', 'forearms'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Tracción unilateral con libertad de trayectoria para aislar el dorsal ancho respetando la rotación anatómica.',
    setup_tips: [
      'Apoya rodilla y mano contraria en un banco plano manteniendo la columna lumbar neutra',
      'Tira de la mancuerna hacia la cadera (trayectoria en arco J), no verticalmente hacia el pecho',
      'Extiende el hombro hacia el suelo en excéntrica para abrir el dorsal'
    ],
    resistance_profile: {
      curve: 'bell_shaped',
      curve_label: 'Curva Biomecánica en Arco Natural',
      rating: 9.3,
      match_analysis: 'La trayectoria en forma de J orienta el vector de fuerza contra las fibras ilíacas del dorsal.',
      pro_hack: 'Mantén el codo bien ceñido al costado en la contracción final para no involucrar el deltoides posterior.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/dumbbell-reverse-grip-incline-bench-one-arm-row.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/dumbbell-reverse-grip-incline-bench-one-arm-row.gif'
  },
  {
    id: 'dumbbell_romanian_deadlift',
    title: 'Peso Muerto Rumano con Mancuernas',
    brand: 'Eleiko',
    model_series: 'Dumbbell RDL Hip Hinge',
    muscle_group: 'hamstrings',
    other_muscles: ['glutes', 'lower_back'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Bisagra de cadera pura con mancuernas pegadas a los muslos para someter a los isquiosurales a elongación excéntrica.',
    setup_tips: [
      'Pies al ancho de caderas con ligera flexión de rodillas que permanece fija durante el movimiento',
      'Empuja las caderas y los glúteos hacia la pared trasera como si fueras a cerrar una puerta',
      'Baja las mancuernas justo por debajo de las rótulas sin redondear la espalda baja'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Curva en Estiramiento Extremo de Cadena Posterior',
      rating: 9.5,
      match_analysis: 'La sobrecarga excéntrica en longitud fascicular induce aumentos superiores de sarcómeros en serie.',
      pro_hack: 'Usa correas o straps para que la fuerza de agarre en las manos no limite el trabajo en piernas.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-romanian-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-romanian-deadlift.gif'
  },

  // ==========================================
  // BARRAS OLÍMPICAS (BARBELLS)
  // ==========================================
  {
    id: 'barbell_bench_press',
    title: 'Press de Banca Plano con Barra Olímpica',
    brand: 'Eleiko',
    model_series: 'IPF Olympic Competition Bench Press',
    muscle_group: 'chest',
    other_muscles: ['shoulders', 'triceps'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'El levantamiento rey de empuje para fuerza máxima y masa de torso en pectoral mayor.',
    setup_tips: [
      'Apoyo de 5 puntos: cabeza, escápulas, glúteos y ambas plantas de los pies firmes en el suelo',
      'Arqueo lumbar fisiológico con retracción escapular activa para proteger el hombro',
      'Toca suavemente la línea de los pezones / apófisis xifoides antes de empujar en trayectoria diagonal'
    ],
    resistance_profile: {
      curve: 'bell_shaped',
      curve_label: 'Curva de Fuerza Clásica de Empuje',
      rating: 9.3,
      match_analysis: 'El sticking point suele situarse en el primer tercio concéntrico tras salir del pecho.',
      pro_hack: 'Genera "leg drive" empujando los talones contra el suelo hacia adelante para fijar la pelvis.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif'
  },
  {
    id: 'barbell_back_squat',
    title: 'Sentadilla Trasera con Barra (Barra Alta / Squat)',
    brand: 'Eleiko',
    model_series: 'Olympic Weightlifting Squat Station',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes', 'hamstrings', 'calves', 'lower_back'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Patrón dominante de rodilla con barra apoyada sobre el trapecio superior para cuádriceps y glúteo.',
    setup_tips: [
      'Apoya la barra sobre el estante carnoso del trapecio superior con agarre cerrado y muñecas firmes',
      'Inicia la bajada flexionando rodillas y caderas simultáneamente con rodillas siguiendo la línea de los pies',
      'Rompe el paralelo (pliegue de la cadera por debajo de la rótula) manteniendo el torso sólido'
    ],
    resistance_profile: {
      curve: 'bell_shaped',
      curve_label: 'Curva Ascendente con Máximo Torque en el Fondo',
      rating: 9.4,
      match_analysis: 'Máximo brazo de momento sobre la rodilla en el punto más profundo de flexión.',
      pro_hack: 'Usa calzado con cuña o talón rígido (zapatillas de halterofilia) para permitir mayor dorsiflexión de tobillo.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-full-squat.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-full-squat.gif'
  },
  {
    id: 'barbell_overhead_press',
    title: 'Press Militar de Pie con Barra (OHP)',
    brand: 'Eleiko',
    model_series: 'Overhead Press Strict Barbell',
    muscle_group: 'shoulders',
    other_muscles: ['triceps', 'traps', 'abdominals'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Empuje vertical estricto de pie con barra olímpica; reclutamiento simultáneo de deltoides anterior y core.',
    setup_tips: [
      'Agarre apenas por fuera del ancho de hombros con los codos ligeramente adelantados bajo la barra',
      'Aprieta glúteos y cuádriceps fuertemente para crear una columna vertebral rígida',
      'Desplaza la barbilla hacia atrás al salir de la clavícula y mete la cabeza bajo la barra al bloquear arriba'
    ],
    resistance_profile: {
      curve: 'bell_shaped',
      curve_label: 'Curva Vertical Ascendente',
      rating: 9.1,
      match_analysis: 'Mayor dificultad al despegar desde las clavículas hasta la altura de la frente.',
      pro_hack: 'Mantén los antebrazos completamente verticales en el plano sagital para no perder palanca mecánica.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/barbell-standing-close-grip-military-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/barbell-standing-close-grip-military-press.gif'
  },
  {
    id: 'barbell_bent_over_row',
    title: 'Remo con Barra 45° (Pronación o Supinación)',
    brand: 'Eleiko',
    model_series: 'Barbell Pendlay / Bent-Over Row',
    muscle_group: 'upper_back',
    other_muscles: ['lats', 'biceps', 'lower_back', 'traps'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Tracción horizontal bilateral para densidad escapular, romboides, trapecio medio y dorsal.',
    setup_tips: [
      'Inclina el torso en un ángulo de entre 45° y paralelo al suelo manteniendo la curvatura lumbar',
      'Tira de la barra hacia el ombligo (dorsal) o hacia el esternón (espalda alta / deltoides posterior)',
      'Junta las escápulas con fuerza al final del movimiento'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Curva en Acortamiento Escapular',
      rating: 9.0,
      match_analysis: 'Gran implicación isométrica de los erectores espinales para mantener el torso en suspensión.',
      pro_hack: 'No uses impulso de cadera para despegar la barra; el torso debe mantenerse como una viga rígida.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/barbell-bent-over-row.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/barbell-bent-over-row.gif'
  },
  {
    id: 'barbell_hip_thrust',
    title: 'Hip Thrust con Barra en Banco',
    brand: 'Eleiko',
    model_series: 'Prestera Hip Thrust Pad & Bench',
    muscle_group: 'glutes',
    other_muscles: ['hamstrings', 'quadriceps'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'La bisagra de cadera horizontal con mayor pico de tensión en acortamiento para el glúteo mayor.',
    setup_tips: [
      'Apoya el borde inferior de las escápulas sobre el borde del banco acolchado',
      'Pies separados al ancho de hombros con rodillas a 90° en la cima del movimiento',
      'Realiza una retroversión pélvica activa apretando los glúteos durante 2 segundos arriba'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Curva en Acortamiento Terminal de Glúteo',
      rating: 9.7,
      match_analysis: 'El vector de fuerza horizontal es perpendicular a las fibras del glúteo mayor en extensión completa.',
      pro_hack: 'Mantén la mirada fija al frente (no mires al techo) para evitar hiperlordosis lumbar.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-glute-bridge-two-legs-on-bench-male.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-glute-bridge-two-legs-on-bench-male.gif'
  },

  // ==========================================
  // POLEAS (CABLES & CROSSOVERS)
  // ==========================================
  {
    id: 'cable_triceps_rope_pushdown',
    title: 'Extensión de Tríceps en Polea con Cuerda',
    brand: 'Matrix',
    model_series: 'Versa Dual Adjustable Pulley',
    muscle_group: 'triceps',
    other_muscles: ['forearms'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Empuje de codos en polea alta con cuerda doble permitiendo abrir las manos al final para máxima contracción.',
    setup_tips: [
      'Coloca la polea en el punto superior con accesorio de cuerda larga',
      'Codos bloqueados pegados a las costillas sin balancear los hombros',
      'Separa las puntas de la cuerda hacia afuera al llegar a la extensión completa'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Curva Continua por Cable con Pico en Extensión',
      rating: 9.4,
      match_analysis: 'La polea mantiene tensión constante durante todo el arco de recorrido sin puntos muertos.',
      pro_hack: 'Inclina el torso 10° hacia adelante para permitir que la cuerda baje más allá de los muslos.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-triceps-pushdown-v-bar.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-triceps-pushdown-v-bar.gif'
  },
  {
    id: 'cable_lateral_raise',
    title: 'Elevaciones Laterales en Polea a Altura de Cadera',
    brand: 'Matrix',
    model_series: 'Cable Lateral Raise Crossover',
    muscle_group: 'shoulders',
    other_muscles: ['traps'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Elevación de brazo con cable regulado a la altura de la mano o cadera, solucionando el punto muerto de la mancuerna.',
    setup_tips: [
      'Ajusta la polea a la altura del puño o de la rótula',
      'Pásate el cable por detrás del cuerpo o por delante con agarre de estribo o muñequera',
      'Sube el brazo en el plano escapular hasta los 90° de abducción'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Curva en Estiramiento y Tensión Constante (Superior a Mancuerna)',
      rating: 9.8,
      match_analysis: 'A diferencia de la mancuerna que tiene 0 torque abajo, el cable ofrece tensión desde el primer grado.',
      pro_hack: 'Usa una muñequera (cuff) en lugar de una manopla para anular la intervención de los flexores del antebrazo.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-lateral-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-lateral-raise.gif'
  },
  {
    id: 'cable_biceps_curl',
    title: 'Curl de Bíceps en Polea Baja',
    brand: 'Matrix',
    model_series: 'Low Cable Biceps Station',
    muscle_group: 'biceps',
    other_muscles: ['forearms'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Flexión de codo con barra recta o Z conectada a polea baja con resistencia uniforme continua.',
    setup_tips: [
      'Da un pequeño paso hacia atrás desde la torre de placas para inclinar el vector del cable',
      'Mantén los codos pegados a los costados',
      'Flexiona los codos contrayendo el bíceps 1 segundo en la cima'
    ],
    resistance_profile: {
      curve: 'bell_shaped',
      curve_label: 'Curva Continua Asistida por Polea',
      rating: 9.1,
      match_analysis: 'El cable evita que el bíceps pierda tensión en la parte más alta de la flexión.',
      pro_hack: 'Prueba a dar un paso adelante de espaldas a la polea (bayesian curl) para mayor tensión en estiramiento.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-curl.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-curl.gif'
  },
  {
    id: 'cable_high_to_low_flyes',
    title: 'Cruces de Polea Alta a Baja (Pectoral Inferior / Esternal)',
    brand: 'Matrix',
    model_series: 'Dual Cable Functional Trainer',
    muscle_group: 'chest',
    other_muscles: ['shoulders'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Aducción horizontal descendente de hombro para aislar las fibras costales e inferiores del pectoral.',
    setup_tips: [
      'Poleas colocadas arriba del todo; da un paso al frente en posición de tijera',
      'Brazos con ligera flexión fija en los codos',
      'Cruza las manos por delante de la pelvis apretando el pecho'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Curva en Acortamiento Terminal de Pectoral',
      rating: 9.3,
      match_analysis: 'La tensión es máxima en el punto de cruce donde las fibras esternocostales están acortadas.',
      pro_hack: 'Alterna qué muñeca cruza por encima en cada repetición para mantener la simetría muscular.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-standing-fly.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-standing-fly.gif'
  },
  {
    id: 'cable_face_pull',
    title: 'Face Pull en Polea Alta con Cuerda',
    brand: 'Matrix',
    model_series: 'High Cable Face Pull',
    muscle_group: 'upper_back',
    other_muscles: ['shoulders', 'traps'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Tracción hacia la cara con rotación externa simultánea para salud escapular, manguito rotador y deltoides posterior.',
    setup_tips: [
      'Polea ajustada a la altura de los ojos o frente con cuerda doble',
      'Agarre neutro o con pulgares hacia atrás',
      'Tira de la cuerda hacia los ojos separando las manos al final'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Curva en Rotación Externa y Retracción',
      rating: 9.5,
      match_analysis: 'El mejor ejercicio preventivo contra el síndrome de pinzamiento subacromial.',
      pro_hack: 'Mantén los codos por encima de las muñecas durante toda la trayectoria.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-standing-rear-delt-row-with-rope.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-standing-rear-delt-row-with-rope.gif'
  },

  // ==========================================
  // PESO CORPORAL & CALISTENIA (BODYWEIGHT)
  // ==========================================
  {
    id: 'bodyweight_dips',
    title: 'Fondos en Paralelas (Dips para Pecho / Tríceps)',
    brand: 'Eleiko',
    model_series: 'Prestera Dip Station',
    muscle_group: 'chest',
    other_muscles: ['triceps', 'shoulders'],
    equipment_category: 'none',
    exercise_type: 'bodyweight_reps',
    description: 'Empuje con peso corporal en barras paralelas con sobrecarga de alta intensidad para tríceps y pectoral.',
    setup_tips: [
      'Para enfatizar el pecho: inclina el torso 30° hacia adelante y abre ligeramente los codos',
      'Para enfatizar el tríceps: mantén el torso completamente erguido y codos pegados al cuerpo',
      'Desciende hasta que el hombro alcance la línea del codo (90°)'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Curva en Estiramiento Profundo con Masa Corporal',
      rating: 9.3,
      match_analysis: 'Enorme estiramiento de los pectorales y deltoides anteriores en el fondo.',
      pro_hack: 'Añade un cinturón de lastre cuando superes las 12-15 repeticiones limpias.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/chest-dip-on-dip-pull-up-cage.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/chest-dip-on-dip-pull-up-cage.gif'
  },
  {
    id: 'bodyweight_hanging_leg_raises',
    title: 'Elevaciones de Piernas Colgado en Barra',
    brand: 'Eleiko',
    model_series: 'Hanging Core Station',
    muscle_group: 'abdominals',
    other_muscles: ['forearms'],
    equipment_category: 'none',
    exercise_type: 'bodyweight_reps',
    description: 'Flexión de cadera y columna pélvica en suspensión para la porción inferior del recto abdominal.',
    setup_tips: [
      'Cuélgate con agarre prono firme y escápulas activas',
      'Eleva las rodillas o piernas estiradas enrollando la pelvis hacia el pecho',
      'Controla la bajada para evitar balancearte con inercia'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Curva de Flexión Lumbo-Pélvica',
      rating: 9.2,
      match_analysis: 'El trabajo abdominal real ocurre cuando la pelvis bascula hacia arriba, no solo al mover los muslos.',
      pro_hack: 'Expulsa todo el aire en la cima de la elevación para activar el transverso abdominal.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/hanging-leg-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/hanging-leg-raise.gif'
  }
];
