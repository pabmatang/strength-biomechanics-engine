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
  {
    id: 'barbell_incline_bench_press',
    title: 'Press de Banca Inclinado con Barra Olímpica',
    brand: 'Eleiko',
    model_series: 'Incline Olympic Bench Press',
    muscle_group: 'chest',
    other_muscles: ['shoulders', 'triceps'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Empuje con barra en banco inclinado a 30°-45° para focalizar el haz clavicular (pectoral superior).',
    setup_tips: [
      'Banco regulado idealmente a 30° para no transferir excesivo trabajo al deltoides anterior',
      'Baja la barra rozando suavemente la parte superior del pecho (línea infraclavicular)',
      'Mantén los antebrazos estrictamente perpendiculares al suelo durante todo el recorrido'
    ],
    resistance_profile: {
      curve: 'bell_shaped',
      curve_label: 'Curva de Fuerza Ascendente en Empuje Inclinado',
      rating: 9.3,
      match_analysis: 'Alineación precisa con el ángulo de penación de las fibras claviculares del pectoral mayor.',
      pro_hack: 'No despegues los glúteos del banco al empujar en el punto de estancamiento.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-incline-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-incline-bench-press.gif'
  },
  {
    id: 'barbell_close_grip_bench_press',
    title: 'Press de Banca Agarre Estrecho con Barra',
    brand: 'Eleiko',
    model_series: 'Olympic Close Grip Triceps Bench',
    muscle_group: 'triceps',
    other_muscles: ['chest', 'shoulders'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Variante de press con agarre al ancho de hombros que incrementa la flexo-extensión de codos y el estímulo en tríceps.',
    setup_tips: [
      'Agarre al ancho de hombros (aproximadamente 30-40 cm entre pulgares, no más cerrado para no dañar las muñecas)',
      'Mantén los codos ceñidos a los costados a unos 30° respecto al torso durante la bajada',
      'Desciende hasta tocar la base del esternón y bloquea con fuerza los codos arriba'
    ],
    resistance_profile: {
      curve: 'bell_shaped',
      curve_label: 'Curva de Extensión de Codo con Sobrecarga Máxima',
      rating: 9.4,
      match_analysis: 'Permite manejar cargas notablemente mayores que cualquier ejercicio de aislamiento para tríceps.',
      pro_hack: 'Imagina que intentas doblar la barra hacia afuera para activar la cabeza lateral del tríceps.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-close-grip-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-close-grip-bench-press.gif'
  },
  {
    id: 'barbell_romanian_deadlift',
    title: 'Peso Muerto Rumano con Barra (RDL)',
    brand: 'Eleiko',
    model_series: 'Olympic RDL Hamstring Station',
    muscle_group: 'hamstrings',
    other_muscles: ['glutes', 'lower_back', 'forearms'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Bisagra de cadera fundamental con barra olímpica rozando las piernas para hipertrofia de isquiosurales mediada por estiramiento.',
    setup_tips: [
      'Pies al ancho de cadera, rodillas semiflexionadas (ángulo constante de 15°-20°)',
      'Empuja la pelvis hacia atrás manteniendo la columna completamente neutra',
      'Desciende la barra rozando los muslos hasta la parte media de las espinillas'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Curva en Estiramiento Extremo de Cadena Posterior',
      rating: 9.6,
      match_analysis: 'Tensión mecánica excéntrica insuperable en la cabeza larga del bíceps femoral y semitendinoso.',
      pro_hack: 'Usa straps para aislar los isquiosurales sin que el antebrazo ceda antes de tiempo.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-romanian-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-romanian-deadlift.gif'
  },
  {
    id: 'barbell_sumo_deadlift',
    title: 'Peso Muerto Sumo con Barra Olímpica',
    brand: 'Eleiko',
    model_series: 'Competition Sumo Deadlift',
    muscle_group: 'glutes',
    other_muscles: ['adductors', 'quadriceps', 'hamstrings', 'lower_back'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Postura ancha con puntas de pies rotadas hacia afuera que incrementa el reclutamiento de aductores, glúteos y cuádriceps.',
    setup_tips: [
      'Pies muy separados con puntas hacia los discos a 45° de apertura',
      'Brazos perpendiculares cayendo por dentro de las rodillas',
      'Abre las caderas empujando el suelo con las piernas y mantén el torso lo más erguido posible'
    ],
    resistance_profile: {
      curve: 'bell_shaped',
      curve_label: 'Curva de Tracción con Brazo de Momento Lumbar Reducido',
      rating: 9.2,
      match_analysis: 'Menor demanda de corte lumbar y mayor torque sobre aductores magnos y glúteo.',
      pro_hack: 'Extiende rodillas y caderas al unísono manteniendo la barra pegada a los tibiales.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-sumo-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-sumo-deadlift.gif'
  },
  {
    id: 'barbell_front_squat',
    title: 'Sentadilla Frontal con Barra Olímpica',
    brand: 'Eleiko',
    model_series: 'Olympic Front Squat',
    muscle_group: 'quadriceps',
    other_muscles: ['abdominals', 'glutes', 'upper_back'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Barra apoyada sobre la porción anterior de los deltoides obligando al torso a mantenerse vertical y focalizando los cuádriceps.',
    setup_tips: [
      'Apoyo de la barra sobre los hombros con codos altos en posición rack o brazos cruzados',
      'Desciende con el tronco completamente erguido flexionando las rodillas hacia adelante',
      'Profundidad completa rompiendo el paralelo para máximo estiramiento de cuádriceps'
    ],
    resistance_profile: {
      curve: 'bell_shaped',
      curve_label: 'Curva Dominante de Rodilla con Torque Cuadricipital',
      rating: 9.4,
      match_analysis: 'Máximo brazo de palanca sobre la articulación de la rodilla con mínima flexión de cadera.',
      pro_hack: 'Mantén los codos apuntando al frente en todo momento para evitar que la barra ruede.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-front-squat.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-front-squat.gif'
  },
  {
    id: 'barbell_biceps_curl',
    title: 'Curl de Bíceps con Barra Olímpica o Barra Z',
    brand: 'Eleiko',
    model_series: 'Olympic / EZ Bar Biceps Station',
    muscle_group: 'biceps',
    other_muscles: ['forearms'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'El clásico básico de sobrecarga máxima para bíceps braquial en flexión estricta de pie.',
    setup_tips: [
      'Pies al ancho de caderas, espalda recta y escápulas fijas',
      'Codos pegados a los laterales de las costillas sin adelantarlos',
      'Sube la barra hasta la altura del pecho sin balancear el torso y baja controlando en 3 segundos'
    ],
    resistance_profile: {
      curve: 'bell_shaped',
      curve_label: 'Curva en Arco con Pico a 90° de Flexión',
      rating: 9.3,
      match_analysis: 'El torque de gravedad es máximo cuando el antebrazo forma 90° respecto al húmero.',
      pro_hack: 'Usa una barra Z (EZ bar) para reducir la tensión de torsión en los tendones de la muñeca.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-biceps-curl.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-biceps-curl.gif'
  },
  {
    id: 'barbell_skull_crusher',
    title: 'Press Francés con Barra Z en Banco Plano',
    brand: 'Eleiko',
    model_series: 'EZ Bar Lying Skull Crusher',
    muscle_group: 'triceps',
    other_muscles: ['forearms'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Extensión de codos tumbado en banco plano para sobrecargar la cabeza larga y medial del tríceps.',
    setup_tips: [
      'Tumbado boca arriba en el banco, sujeta la barra Z con agarre prono a la altura de la frente o coronilla',
      'Inclina los brazos ligeramente hacia atrás (70°-80° respecto al suelo) para mantener tensión en el tríceps',
      'Flexiona los codos bajando la barra hacia la frente o justo detrás de la cabeza'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Curva de Sobrecarga en Estiramiento de Tríceps',
      rating: 9.5,
      match_analysis: 'La ligera inclinación humeral hacia atrás elimina el punto muerto articular arriba.',
      pro_hack: 'Mantén los codos paralelos entre sí; no dejes que se abran en abanico hacia afuera.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-lying-triceps-extension-skull-crusher.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-lying-triceps-extension-skull-crusher.gif'
  },
  {
    id: 'barbell_shrug',
    title: 'Encogimientos de Trapecio con Barra Olímpica',
    brand: 'Eleiko',
    model_series: 'Olympic Barbell Shrug',
    muscle_group: 'traps',
    other_muscles: ['forearms', 'upper_back'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Elevación escapular pura con barra olímpica pesada para hipertrofia del trapecio superior.',
    setup_tips: [
      'Agarre al ancho de hombros con barra por delante de los muslos',
      'Eleva los hombros directamente hacia las orejas sin rotarlos ni flexionarlos en círculo',
      'Pausa isométrica de 1 a 2 segundos en la cima antes de descender lentamente'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Curva en Acortamiento Escapular Superior',
      rating: 9.1,
      match_analysis: 'Reclutamiento puro en la línea de tracción de las fibras oblicuas del trapecio superior.',
      pro_hack: 'Usa straps para que la fuerza de agarre no limite el volumen de sobrecarga.'
    },
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/barbell-shrug.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/barbell-shrug.gif'
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
    image_url: '/machines/cable_triceps_pushdown_v_bar.png',
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
    image_url: '/machines/cable_lateral_raise.png',
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
    image_url: '/machines/cable_curl.png',
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
    image_url: '/machines/cable_standing_fly.png',
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
    image_url: '/machines/cable_rear_delt_row.png',
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
,
  // ==========================================
  // COMPREHENSIVE FREE WEIGHT & CABLE STAPLES (100% COVERAGE)
  // ==========================================
  // DORSAL / LATS
  {
    id: 'cable_lat_pulldown_wide',
    title: 'Jalón al Pecho en Polea Alta (Agarre Abierto)',
    brand: 'Eleiko',
    muscle_group: 'lats',
    other_muscles: ['upper_back', 'biceps'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Tracción vertical fundamental en polea alta para anchura dorsal.',
    setup_tips: ['Fija los muslos bajo los rodillos', 'Tira llevando los codos hacia las costillas'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif'
  },
  {
    id: 'cable_lat_prayer',
    title: 'Pullover en Polea Alta con Cuerda (Lat Prayer)',
    brand: 'Eleiko',
    muscle_group: 'lats',
    other_muscles: ['chest', 'triceps'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Aislamiento dorsal puro mediante extensión de hombro sin fatiga del bíceps.',
    setup_tips: ['Torso inclinado 45°', 'Arco amplio alejando las manos y contrayendo hacia la cadera'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif'
  },
  {
    id: 'cable_seated_low_row',
    title: 'Remo en Polea Baja (Agarre Estrecho)',
    brand: 'Eleiko',
    muscle_group: 'lats',
    other_muscles: ['upper_back', 'biceps'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Tracción horizontal en polea baja con agarre neutro para espesor de la espalda.',
    setup_tips: ['Mantén el torso casi vertical sin balanceos excesivos'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif'
  },
  {
    id: 'dumbbell_pullover',
    title: 'Pullover con Mancuerna en Banco Plano',
    brand: 'Eleiko',
    muscle_group: 'lats',
    other_muscles: ['chest'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Extensión de hombros sobre banco para estiramiento profundo del dorsal mayor.',
    setup_tips: ['Codos ligeramente flexionados fijos durante la bajada'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif'
  },
  {
    id: 'barbell_pendlay_row',
    title: 'Remo Pendlay con Barra Olímpica',
    brand: 'Eleiko',
    muscle_group: 'lats',
    other_muscles: ['upper_back', 'biceps'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Remo estricto desde el suelo con torso completamente paralelo.',
    setup_tips: ['Cada repetición inicia muerta sobre los discos en el suelo'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif'
  },

  // ESPALDA ALTA & TRAPECIO
  {
    id: 'cable_wide_grip_seated_row',
    title: 'Remo en Polea Agarre Abierto (Espalda Alta)',
    brand: 'Eleiko',
    muscle_group: 'upper_back',
    other_muscles: ['traps', 'shoulders'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Tracción con codos a 60-70° del torso para romboides y trapecio medio.',
    setup_tips: ['Retrae escápulas y aprieta 1s atrás'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif'
  },
  {
    id: 'cable_rear_delt_flyes',
    title: 'Pájaros en Doble Polea Cruzada (Deltoides Posterior)',
    brand: 'Eleiko',
    muscle_group: 'upper_back',
    other_muscles: ['shoulders'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Abducción horizontal cruzada para aislar la cabeza posterior del deltoides.',
    setup_tips: ['Ajusta las poleas a la altura de los ojos y cruza los cables sin agarres'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif'
  },
  {
    id: 'cable_shrug',
    title: 'Encogimiento de Trapecio en Polea Baja con Barra',
    brand: 'Eleiko',
    muscle_group: 'traps',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Elevación escapular constante en polea baja para trapecio superior.',
    setup_tips: ['Sube en diagonal hacia las orejas sin rotar los hombros'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif'
  },
  {
    id: 'dumbbell_rear_delt_fly',
    title: 'Pájaros con Mancuernas en Banco Inclinado',
    brand: 'Eleiko',
    muscle_group: 'upper_back',
    other_muscles: ['shoulders'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Pecho apoyado en banco a 30-45° para eliminar trampeo en deltoides posterior.',
    setup_tips: ['Abre en semicírculo hacia los lados'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif'
  },
  {
    id: 'dumbbell_shrug',
    title: 'Encogimientos con Mancuernas de Pie',
    brand: 'Eleiko',
    muscle_group: 'traps',
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Encogimiento neutro con mancuernas pegadas a los muslos.',
    setup_tips: ['Pausa de 2 segundos en contracción máxima arriba'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif'
  },

  // DELTOIDES / SHOULDERS
  {
    id: 'dumbbell_shoulder_press_seated',
    title: 'Press de Hombro Sentado con Mancuernas',
    brand: 'Eleiko',
    muscle_group: 'shoulders',
    other_muscles: ['triceps'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Empuje vertical en banco a 75° con mancuernas para deltoides anterior.',
    setup_tips: ['Baja hasta que las mancuernas rocen la altura de las orejas'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif'
  },
  {
    id: 'cable_y_raise',
    title: 'Elevaciones en Y en Polea Baja',
    brand: 'Eleiko',
    muscle_group: 'shoulders',
    other_muscles: ['traps'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Elevación a 30° en el plano escapular para alinear fibras laterales.',
    setup_tips: ['Poleas cruzadas en el suelo, sube formando una letra Y'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif'
  },
  {
    id: 'cable_front_raise',
    title: 'Elevaciones Frontales en Polea Baja',
    brand: 'Eleiko',
    muscle_group: 'shoulders',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Flexión anterior de hombro con tensión continua para deltoides anterior.',
    setup_tips: ['Sube hasta la altura de los ojos con los codos fijos'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif'
  },

  // BÍCEPS & TRÍCEPS
  {
    id: 'cable_bayesian_curl',
    title: 'Curl Bayesiano en Polea Baja (Húmero Extendido)',
    brand: 'Eleiko',
    muscle_group: 'biceps',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'De espaldas a la polea con el brazo por detrás del torso para máximo estiramiento de cabeza larga.',
    setup_tips: ['Da un paso adelante de la polea y mantén el codo retrasado'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-incline-biceps-curl.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-incline-biceps-curl.gif'
  },
  {
    id: 'cable_rope_hammer_curl',
    title: 'Curl Martillo en Polea Baja con Cuerda',
    brand: 'Eleiko',
    muscle_group: 'biceps',
    other_muscles: ['forearms'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Flexión con agarre neutro para braquial anterior y braquiorradial.',
    setup_tips: ['Abre ligeramente las puntas de la cuerda arriba'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-incline-biceps-curl.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-incline-biceps-curl.gif'
  },
  {
    id: 'cable_overhead_triceps_extension',
    title: 'Extensión de Tríceps Katatrópica en Polea (Overhead)',
    brand: 'Eleiko',
    muscle_group: 'triceps',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Extensión por encima de la cabeza para estiramiento profundo de la cabeza larga.',
    setup_tips: ['Codos fijos apuntando hacia adelante'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif'
  },
  {
    id: 'cable_straight_bar_pushdown',
    title: 'Empuje de Tríceps en Polea con Barra Recta',
    brand: 'Eleiko',
    muscle_group: 'triceps',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Extensión pesada hacia abajo para cabeza lateral y medial del tríceps.',
    setup_tips: ['Codos pegados a los costados'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif'
  },

  // CUÁDRICEPS / LEGS
  {
    id: 'dumbbell_bulgarian_split_squat',
    title: 'Sentadilla Búlgara con Mancuernas',
    brand: 'Eleiko',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes', 'hamstrings'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Ejercicio unilateral de altísima demanda y activación en cuádriceps y glúteo.',
    setup_tips: ['Pie trasero elevado sobre banco a la altura de la rodilla'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'dumbbell_goblet_squat',
    title: 'Sentadilla Goblet con Mancuerna Pesada',
    brand: 'Eleiko',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Sentadilla profunda sosteniendo una mancuerna vertical pegada al pecho.',
    setup_tips: ['Mantén el torso erguido y baja entre las caderas'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'cable_sissy_squat',
    title: 'Sentadilla Sissy Asistida en Polea Baja',
    brand: 'Eleiko',
    muscle_group: 'quadriceps',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Flexión profunda de rodillas hacia adelante con agarre a la polea para aislar el recto femoral.',
    setup_tips: ['Rodillas viajan hacia adelante y cadera se mantiene extendida'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'cable_leg_extension',
    title: 'Extensión de Cuádriceps con Tobillera en Polea Baja',
    brand: 'Eleiko',
    muscle_group: 'quadriceps',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Aislamiento unilateral de cuádriceps mediante cable y tobillera.',
    setup_tips: ['Extiende la rodilla completamente contra la resistencia del cable'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },

  // ISQUIOSURALES / HAMSTRINGS
  {
    id: 'barbell_stiff_leg_deadlift',
    title: 'Peso Muerto Piernas Rígidas con Barra',
    brand: 'Eleiko',
    muscle_group: 'hamstrings',
    other_muscles: ['glutes', 'lower_back'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Bisagra pura de cadera con rodillas casi fijas para estiramiento máximo de isquios.',
    setup_tips: ['Empuja el culo hacia la pared trasera sin doblar la zona lumbar'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'nordic_hamstring_curl',
    title: 'Curl Nórdico de Isquiosurales (Autocarga)',
    brand: 'Eleiko',
    muscle_group: 'hamstrings',
    equipment_category: 'none',
    exercise_type: 'bodyweight_reps',
    description: 'Contracción excéntrica pura para prevención de lesiones y fuerza en isquios.',
    setup_tips: ['Tobillos fijados, desciende con el torso recto lo más lento posible'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'cable_standing_leg_curl',
    title: 'Curl Femoral de Pie en Polea Baja con Tobillera',
    brand: 'Eleiko',
    muscle_group: 'hamstrings',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Flexión de rodilla de pie con resistencia continua durante todo el rango.',
    setup_tips: ['Muslo fijo alineado con el torso, flexiona talón hacia el glúteo'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'cable_pull_through',
    title: 'Cable Pull-Through en Polea Baja con Cuerda',
    brand: 'Eleiko',
    muscle_group: 'hamstrings',
    other_muscles: ['glutes'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Bisagra de cadera con cable entre las piernas para cadena posterior.',
    setup_tips: ['Aprieta glúteos e isquios al colocarte de pie en extensión completa'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },

  // GLÚTEOS / GLUTES
  {
    id: 'dumbbell_b_stance_rdl',
    title: 'Peso Muerto Rumano B-Stance con Mancuernas (Foco Glúteo)',
    brand: 'Eleiko',
    muscle_group: 'glutes',
    other_muscles: ['hamstrings'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Postura asimétrica para cargar el glúteo mayor de la pierna adelantada.',
    setup_tips: ['El 90% del peso recae en el pie delantero'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'dumbbell_step_up',
    title: 'Step Up en Cajón con Mancuernas',
    brand: 'Eleiko',
    muscle_group: 'glutes',
    other_muscles: ['quadriceps'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Extensión unilateral de cadera y rodilla en cajón a 90° para glúteo mayor.',
    setup_tips: ['Evita impulsarte con el pie del suelo; sube tirando con la pierna del cajón'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'cable_glute_kickback',
    title: 'Patada de Glúteo en Polea Baja con Tobillera',
    brand: 'Eleiko',
    muscle_group: 'glutes',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Extensión pura de cadera en diagonal hacia atrás para hipertrofia de glúteo mayor.',
    setup_tips: ['Aprieta 1 segundo en máxima contracción sin arquear la zona lumbar'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'cable_hip_abduction',
    title: 'Abducción de Cadera en Polea Baja de Pie',
    brand: 'Eleiko',
    muscle_group: 'glutes',
    other_muscles: ['abductors'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Separación lateral de pierna con tobillera para glúteo medio.',
    setup_tips: ['Pierna ligeramente por detrás del eje del cuerpo'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },

  // GEMELOS / CALVES
  {
    id: 'dumbbell_standing_calf_raise',
    title: 'Elevación de Talones de Pie con Mancuernas',
    brand: 'Eleiko',
    muscle_group: 'calves',
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Flexión plantar con mancuernas sobre un escalón o disco.',
    setup_tips: ['Pausa de 2s abajo en máximo estiramiento y sube con fuerza'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'barbell_standing_calf_raise',
    title: 'Elevación de Talones con Barra en Step / Jaula',
    brand: 'Eleiko',
    muscle_group: 'calves',
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Sobrecarga pesada con barra en la espalda sobre step para gemelos.',
    setup_tips: ['Rodillas bloqueadas sin hiperextensión'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'dumbbell_seated_calf_raise',
    title: 'Elevación de Talones Sentado con Mancuernas',
    brand: 'Eleiko',
    muscle_group: 'calves',
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Sentado en banco con mancuernas sobre las rodillas para aislar el sóleo.',
    setup_tips: ['Coloca un taco bajo las puntas de los pies para rango completo'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'cable_standing_calf_raise',
    title: 'Elevación de Talones en Polea Baja sobre Step',
    brand: 'Eleiko',
    muscle_group: 'calves',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Cinturón o barra conectado a polea baja para tensión vertical constante.',
    setup_tips: ['Rango completo sin balanceo'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'cable_single_leg_calf_raise',
    title: 'Elevación de Talón Unilateral en Polea Baja',
    brand: 'Eleiko',
    muscle_group: 'calves',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Aislamiento unilateral en polea baja para corregir asimetrías de pantorrilla.',
    setup_tips: ['Control excéntrico de 3 segundos por repetición'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },

  // ADUCTORES & ABDUCTORES
  {
    id: 'dumbbell_sumo_squat',
    title: 'Sentadilla Sumo con Mancuerna (Foco Aductores)',
    brand: 'Eleiko',
    muscle_group: 'adductors',
    other_muscles: ['quadriceps', 'glutes'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Pies muy separados con puntas a 45° para elongar y activar aductores.',
    setup_tips: ['Sostén la mancuerna colgada entre las piernas y baja profundo'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'dumbbell_cossack_squat',
    title: 'Sentadilla Cosaca con Mancuerna',
    brand: 'Eleiko',
    muscle_group: 'adductors',
    other_muscles: ['quadriceps', 'glutes'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Desplazamiento frontal alterno hacia un lado con máxima apertura de cadera.',
    setup_tips: ['Pierna extendida con talón apoyado y dedos hacia arriba'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'cable_hip_adduction',
    title: 'Aducción de Cadera en Polea Baja con Tobillera',
    brand: 'Eleiko',
    muscle_group: 'adductors',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Aproximación de pierna cruzando por delante de la pierna de apoyo.',
    setup_tips: ['Movimiento lento y contracción máxima al cruzar'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'cable_hip_abduction_standing',
    title: 'Abducción de Cadera en Polea Baja con Tobillera',
    brand: 'Eleiko',
    muscle_group: 'abductors',
    other_muscles: ['glutes'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Separación lateral en polea baja para glúteo medio y tensor de la fascia lata.',
    setup_tips: ['Mantén el torso erguido sin inclinarte hacia el lado contrario'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },

  // ABDOMEN & CORE
  {
    id: 'plate_weighted_crunch',
    title: 'Crunch en Suelo con Disco en el Pecho',
    brand: 'Eleiko',
    muscle_group: 'abdominals',
    equipment_category: 'plate',
    exercise_type: 'weight_reps',
    description: 'Flexión espinal con sobrecarga progresiva mediante disco olímpico.',
    setup_tips: ['Pega la zona lumbar al suelo y enrolla la caja torácica hacia la pelvis'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif'
  },
  {
    id: 'ab_wheel_rollout',
    title: 'Rueda Abdominal (Ab Wheel Rollout)',
    brand: 'Eleiko',
    muscle_group: 'abdominals',
    equipment_category: 'none',
    exercise_type: 'bodyweight_reps',
    description: 'Anti-extensión de columna con tremenda activación del recto abdominal.',
    setup_tips: ['Inicia desde rodillas manteniendo retroversión pélvica'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif'
  },
  {
    id: 'cable_kneeling_crunch',
    title: 'Crunch Abdominal de Rodillas en Polea Alta',
    brand: 'Eleiko',
    muscle_group: 'abdominals',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Flexión de tronco en polea alta con cuerda sobre la nuca.',
    setup_tips: ['Fija la cadera en el sitio; no te sientes sobre los talones'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif'
  },
  {
    id: 'cable_woodchopper',
    title: 'Leñador en Polea Alta a Baja (Woodchopper)',
    brand: 'Eleiko',
    muscle_group: 'abdominals',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Rotación y flexión diagonal para oblicuos internos y externos.',
    setup_tips: ['Pivota sobre el pie trasero y contrae el abdomen al rotar'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif'
  },
  {
    id: 'cable_pallof_press',
    title: 'Pallof Press Antirrotacional en Polea Media',
    brand: 'Eleiko',
    muscle_group: 'abdominals',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Resistencia isométrica contra rotación para estabilidad central del core.',
    setup_tips: ['Extiende los brazos al frente y resiste 2 segundos sin girar el tronco'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif'
  }
,
  // ABDUCTORES & ADUCTORES COMPLEMENTARIOS
  {
    id: 'bodyweight_side_lying_leg_raise',
    title: 'Elevación Lateral de Pierna en Suelo (Abductores)',
    brand: 'Eleiko',
    muscle_group: 'abductors',
    other_muscles: ['glutes'],
    equipment_category: 'none',
    exercise_type: 'bodyweight_reps',
    description: 'Aislamiento de glúteo medio en posición decúbito lateral sin sobrecarga axial.',
    setup_tips: ['Mantén la punta del pie apuntando hacia adelante o ligeramente hacia abajo'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'dumbbell_side_lying_abduction',
    title: 'Elevación Lateral de Pierna con Mancuerna sobre Muslo',
    brand: 'Eleiko',
    muscle_group: 'abductors',
    other_muscles: ['glutes'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Elevación lateral tumbado con mancuerna apoyada en la cara externa del muslo.',
    setup_tips: ['Movimiento controlado de 2 segundos arriba y 3 segundos bajando'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'cable_cross_body_adduction',
    title: 'Aducción de Pierna Cruzada en Polea Baja',
    brand: 'Eleiko',
    muscle_group: 'adductors',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Aducción profunda cruzando el cable por detrás de la pierna de apoyo.',
    setup_tips: ['Tensión continua sin tocar el suelo'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'cable_seated_hamstring_curl',
    title: 'Curl Femoral Sentado en Banco con Polea Baja',
    brand: 'Eleiko',
    muscle_group: 'hamstrings',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Sentado en banco plano de espaldas a la polea con tobillera.',
    setup_tips: ['Cadera a 90° para sobrecargar en estiramiento'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'cable_behind_back_shrug',
    title: 'Encogimiento de Trapecio Tras Nuca en Polea Baja',
    brand: 'Eleiko',
    muscle_group: 'traps',
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Tensión angular continua por detrás del cuerpo para trapecio superior.',
    setup_tips: ['Sube en diagonal hacia arriba y hacia atrás'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif'
  }
];
