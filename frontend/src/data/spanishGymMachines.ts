import { ExerciseTemplate } from '../types/workout';

export const SPANISH_GYM_MACHINES: ExerciseTemplate[] = [
  // ==========================================
  // TECHNOGYM (Selection 900 / Pure Strength / Biostrength)
  // ==========================================
  // Espalda (Lats & Upper Back)
  {
    id: 'technogym_pure_pulldown',
    title: 'Technogym Pure Strength - Pulldown',
    brand: 'Technogym',
    model_series: 'Pure Strength (Palancas convergentes)',
    muscle_group: 'lats',
    other_muscles: ['biceps', 'upper_back'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina de discos con trayectoria circular convergente que maximiza el acortamiento del dorsal ancho.',
    setup_tips: [
      'Ajusta la almohadilla de los muslos para que las rodillas queden firmemente fijadas a 90°',
      'Inicia con ligera depresión escapular antes de traccionar',
      'Conduce los codos hacia las costillas en lugar de tirar con los antebrazos'
    ],
    image_url: '/machines/technogym_pure_pulldown.png'
  },
  {
    id: 'technogym_pure_low_row',
    title: 'Technogym Pure Strength - Low Row',
    brand: 'Technogym',
    model_series: 'Pure Strength',
    muscle_group: 'upper_back',
    other_muscles: ['lats', 'biceps', 'traps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Remo bajo en palanca independiente para grosor de espalda media y romboides.',
    setup_tips: [
      'Ajusta la altura del asiento para que el apoyo de pecho quede a la altura del esternón',
      'Usa agarre neutro para dorsales o agarre prono abierto para deltoides posterior y trapecio medio'
    ],
    image_url: '/machines/technogym_pure_low_row.png'
  },
  {
    id: 'technogym_pure_row_dorian',
    title: 'Technogym Pure Strength - Row (Remo Dorian / Remo Horizontal a Discos)',
    brand: 'Technogym',
    model_series: 'Pure Strength (Palancas convergentes)',
    muscle_group: 'upper_back',
    other_muscles: ['lats', 'biceps', 'traps', 'shoulders'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Remo horizontal en palancas divergentes con apoyo en el pecho estilo Dorian Yates. Máximo estímulo para masa y grosor en romboides, trapecio y dorsal.',
    setup_tips: [
      'Regula el cojín pectoral para que los brazos alcancen el inicio del recorrido con un estiramiento escapular completo',
      'Mantén los codos pegados o en 45° y tracciona sintiendo el bloqueo escapular en la fase concéntrica',
      'Permite que las escápulas se abran en la fase excéntrica lenta (3 segundos)'
    ],
    image_url: '/machines/technogym_pure_row_dorian.png'
  },
  {
    id: 'technogym_pure_t_bar_row',
    title: 'Technogym Pure Strength - T-Bar Row (Remo en T a Discos)',
    brand: 'Technogym',
    model_series: 'Pure Strength (Discos Olímpicos)',
    muscle_group: 'upper_back',
    other_muscles: ['lats', 'biceps', 'traps', 'shoulders'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Remo en T con soporte torácico inclinado fijo y carga de discos frontales. Perfil biomecánico descendente: la palanca parte a 90° respecto al suelo con máximo par torsor en estiramiento y aligera la carga en la contracción final.',
    setup_tips: [
      'Coloca los pies en la plataforma cerca o debajo del respaldo; no los alejes hacia atrás para evitar que tu peso comprima el tórax y dificulte la respiración',
      'Apoya el esternón firmemente en el cojín superior sin opción de alejarte del respaldo (soporte fijo)',
      'Perfil descendente natural: 100% de resistencia en el despegue inicial (palanca horizontal a 90°) aligerando progresivamente hacia el pecho'
    ],
    image_url: '/machines/technogym_pure_t_bar_row.png'
  },
  {
    id: 'technogym_pure_deadlift',
    title: 'Technogym Pure Strength - Deadlift (Peso Muerto a Discos)',
    brand: 'Technogym',
    model_series: 'Pure Strength',
    muscle_group: 'lower_back',
    other_muscles: ['glutes', 'hamstrings', 'traps', 'lats', 'forearms'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina de peso muerto y encogimientos guiada a discos con palancas independientes convergentes y amplia plataforma de acero antideslizante con textura diamantada.',
    setup_tips: [
      'Sitúate en el centro de la plataforma con los pies a la anchura de caderas y tibias alineadas con los agarres rotatorios',
      'Selecciona el agarre neutro cerrado para máxima palanca o agarre abierto según tu antropometría',
      'Empuja con las piernas manteniendo la columna lordótica neutra y bloquea los glúteos arriba sin hiperextender el tronco'
    ],
    image_url: '/machines/technogym_pure_deadlift.png'
  },
  {
    id: 'technogym_selection_lat_machine',
    title: 'Technogym Selection - Lat Machine',
    brand: 'Technogym',
    model_series: 'Selection 900 (Torre de placas)',
    muscle_group: 'lats',
    other_muscles: ['biceps', 'forearms'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Polea alta tradicional con barra ergonómica para tracciones verticales controladas.',
    setup_tips: [
      'Elige el pin selector de carga y verifica el enganche del cable',
      'Mantén el pecho erguido y evita inclinar el torso hacia atrás más de 15°'
    ],
    image_url: '/machines/technogym_selection_lat_machine.png'
  },
  {
    id: 'technogym_selection_wide_row',
    title: 'Technogym Selection 900 - Seated Wide Row (Remo Sentado Abierto de Placas)',
    brand: 'Technogym',
    model_series: 'Selection 900 (Torre de placas)',
    muscle_group: 'upper_back',
    other_muscles: ['lats', 'biceps', 'traps', 'shoulders'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Remo sentado de placas con empuñaduras abiertas horizontales divergentes para máximo desarrollo del trapecio medio, romboides y deltoides posterior.',
    setup_tips: [
      'Ajusta la altura del sillín para que el cojín pectoral quede apoyado en la parte media del esternón',
      'Toma las empuñaduras anchas horizontales con agarre prono abierto',
      'Tracciona conduciendo los codos abiertos en ángulo de 60°-70° respecto al torso para concentrar el estímulo en la espalda alta'
    ],
    image_url: '/machines/technogym_selection_wide_row.png'
  },

  // Pecho (Chest)
  {
    id: 'technogym_pure_chest_press',
    title: 'Technogym Pure Strength - Chest Press',
    brand: 'Technogym',
    model_series: 'Pure Strength',
    muscle_group: 'chest',
    other_muscles: ['triceps', 'shoulders'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Empuje plano convergente a discos olímpicos con perfil de resistencia ascendente que alcanza su pico a 90° respecto al suelo en acortamiento.',
    setup_tips: [
      'Ajusta la altura del asiento con el pasador amarillo para que las manetas coincidan con el pectoral medio',
      'Mantén las escápulas fijas y retrotraídas contra el banco sin hiperextender el hombro',
      'Imprime aceleración uniforme concéntrica para vencer el pico de brazo de momento final'
    ],
    image_url: '/machines/technogym_pure_chest_press.png'
  },
  {
    id: 'technogym_selection_chest_press',
    title: 'Technogym Selection 900 - Chest Press (Press de Pecho de Placas)',
    brand: 'Technogym',
    model_series: 'Selection 900 (Torre de placas)',
    muscle_group: 'chest',
    other_muscles: ['triceps', 'shoulders'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Prensa horizontal de placas con trayectoria convergente independiente y pedal de asistencia de precarga para arranque seguro.',
    setup_tips: [
      'Pisa el pedal amarillo frontal de precarga antes de colocar las manos para adelantar las empuñaduras y proteger el manguito rotador',
      'Ajusta la altura del sillín con el pasador amarillo para alinear los manerales con la línea media del pectoral',
      'Empuja de forma fluida y suelta el pedal suavemente una vez iniciada la primera repetición'
    ],
    image_url: '/machines/technogym_selection_pec_deck.png'
  },
  {
    id: 'technogym_pure_incline_chest',
    title: 'Technogym Pure Strength - Incline Chest Press',
    brand: 'Technogym',
    model_series: 'Pure Strength',
    muscle_group: 'chest',
    other_muscles: ['shoulders', 'triceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Prensa inclinada a 30° con curva de resistencia progresiva para el haz clavicular.',
    setup_tips: [
      'Alinea los codos por debajo del hombro formando un ángulo de 45° a 60° con el torso',
      'No despegues la zona lumbar del respaldo anatómico'
    ],
    image_url: '/machines/technogym_pure_incline_chest.png'
  },
  {
    id: 'technogym_pure_wide_chest',
    title: 'Technogym Pure Strength - Wide Chest Press',
    brand: 'Technogym',
    model_series: 'Pure Strength',
    muscle_group: 'chest',
    other_muscles: ['shoulders', 'triceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Press con agarre amplio para máxima apertura y estiramiento del pectoral mayor.',
    setup_tips: [
      'Ajusta la altura del sillín para alinear los manerales con el pectoral medio',
      'Mantén las escápulas fijas y retrotraídas contra el banco sin hiperextender el hombro'
    ],
    image_url: '/machines/technogym_pure_wide_chest.png'
  },
  {
    id: 'technogym_selection_pec_deck_reverse_fly',
    title: 'Technogym Selection - Pectoral & Reverse Fly (Pec Deck & Pájaros)',
    brand: 'Technogym',
    model_series: 'Selection 700 / 900 Dual',
    muscle_group: 'chest',
    other_muscles: ['shoulders', 'upper_back'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina dual para aislamiento de pectoral mayor (aperturas) y deltoides posterior (pájaros/cruces inversos).',
    setup_tips: [
      'Para pecho (Pec Deck): sitúa las palancas en apertura amplia y las empuñaduras a la altura media del esternón',
      'Para deltoides posterior (Pájaros): gira el asiento mirando al respaldo y cruza los brazos hacia atrás contrayendo la espalda alta'
    ],
    image_url: '/machines/technogym_selection_pec_deck_reverse_fly.png'
  },

  // Piernas & Glúteos (Legs & Glutes)
  {
    id: 'technogym_pure_hip_thrust',
    title: 'Technogym Pure Strength - Hip Thrust',
    brand: 'Technogym',
    model_series: 'Pure Strength',
    muscle_group: 'glutes',
    other_muscles: ['hamstrings', 'quadriceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina biomecánicamente optimizada para empuje de cadera con acolchado pélvico ergonómico.',
    setup_tips: [
      'Apoya las escápulas fijas contra el rodillo posterior acolchado',
      'Ajusta el cinturón de sujeción sobre la cresta ilíaca sin que oprima el abdomen',
      'Pausa de 1.5 segundos en la parte alta contrayendo los glúteos a 180°'
    ],
    image_url: '/machines/technogym_pure_hip_thrust.png'
  },
  {
    id: 'technogym_selection_hip_thrust',
    title: 'Technogym Selection 900 / Biostrength - Hip Thrust (Empuje de Cadera / Glúteo de Placas)',
    brand: 'Technogym',
    model_series: 'Selection 900 / Biostrength',
    muscle_group: 'glutes',
    other_muscles: ['hamstrings', 'quadriceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina de empuje de cadera selectorizada de placas con rodillo o cinturón pélvico acolchado y plataforma de apoyo angular.',
    setup_tips: [
      'Apoya la espalda alta y escápulas firmemente en el respaldo pivotante acolchado',
      'Coloca el rodillo pélvico exactamente sobre el pliegue de la cadera (cresta ilíaca anterior) sin comprimir el abdomen',
      'Empuja con los talones hasta alcanzar la extensión completa de cadera a 180°, aguantando 1.5 segundos en contracción máxima'
    ],
    image_url: '/machines/technogym_selection_hip_thrust.png'
  },
  {
    id: 'technogym_selection_adductor',
    title: 'Technogym Selection - Adductor (Aductores / Cerrar Piernas)',
    brand: 'Technogym',
    model_series: 'Selection 900',
    muscle_group: 'adductors',
    other_muscles: ['glutes'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Aislamiento de la cara interna del muslo (aductor mayor, mediano y gracilis) mediante aducción guiada.',
    setup_tips: [
      'Gira las almohadillas hacia el interior y ajusta el pasador al máximo rango de apertura cómoda sin tirones',
      'Junta las rodillas (cerrar piernas) con fuerza controlada, aguantando 1 segundo en el punto de contacto',
      'Mantén la pelvis y la espalda pegadas al respaldo sin despegar el sacro'
    ],
    image_url: '/machines/technogym_selection_adductor.png'
  },
  {
    id: 'technogym_selection_abductor',
    title: 'Technogym Selection - Abductor (Abductores / Abrir Piernas / Glúteo Medio)',
    brand: 'Technogym',
    model_series: 'Selection 900',
    muscle_group: 'abductors',
    other_muscles: ['glutes'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Aislamiento de glúteo medio y tensor de la fascia lata con levas divergentes anatómicas.',
    setup_tips: [
      'Gira las almohadillas hacia el exterior y siéntate ligeramente inclinado hacia adelante para máximo reclutamiento del glúteo medio',
      'Abre las piernas venciendo la resistencia y aguanta 1 segundo en apertura máxima antes de retornar controlado'
    ],
    image_url: '/machines/technogym_selection_abductor.png'
  },
  {
    id: 'technogym_pure_standing_abductor',
    title: 'Technogym Pure Strength - Standing Abductor (Abductor de Pie a Discos)',
    brand: 'Technogym',
    model_series: 'Pure Strength (Discos)',
    muscle_group: 'abductors',
    other_muscles: ['glutes'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina de discos de abducción de pie con brazo pivotante y almohadilla lateral para reclutar con máxima sobrecarga la porción superior del glúteo medio sin compresión lumbar.',
    setup_tips: [
      'Apoya el lateral del muslo sobre la almohadilla ergonómica acolchada',
      'Mantén el torso estable agarrando los manubrios frontales y abduce la cadera lateralmente',
      'Aguanta 1.5 segundos en apertura máxima contrayendo el glúteo medio antes de descender lento'
    ],
    resistance_profile: {
      curve: 'mid_range',
      curve_label: 'Tensión máxima en pico de abducción a 35° (9.8/10)',
      rating: 9.8,
      match_analysis: 'Reclutamiento superior de glúteo medio sin fricción articular.',
      pro_hack: 'Hack: Inclina levemente la pelvis hacia adelante para activar fibras supero-posteriores.'
    },
    target_rep_range: '12-15',
    image_url: '/machines/technogym_pure_standing_abductor.png'
  },

  {
    id: 'technogym_pure_hack_squat',
    title: 'Technogym Pure Strength - Hack Squat',
    brand: 'Technogym',
    model_series: 'Pure Strength',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes', 'calves'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Sentadilla hack guiada con plataforma antideslizante para hipertrofia de cuádriceps.',
    setup_tips: [
      'Coloca los pies en la parte baja de la plataforma para mayor flexión de rodilla y foco en cuádriceps',
      'Desbloquea las palancas de seguridad girando hacia afuera tras incorporarte'
    ],
    image_url: '/machines/technogym_pure_hack_squat.png'
  },
  {
    id: 'technogym_pure_belt_squat',
    title: 'Technogym Pure Strength - Belt Squat (Sentadilla con Cinturón a Discos)',
    brand: 'Technogym',
    model_series: 'Pure Strength',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes', 'hamstrings', 'calves'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Sentadilla con cinturón anclado a palanca de discos que sobrecarga cuádriceps y glúteos con cero compresión espinal y máxima estabilidad lumbar.',
    setup_tips: [
      'Coloca el cinturón ancho acolchado rodeando la pelvis baja por debajo de las crestas ilíacas',
      'Engancha el mosquetón en el orificio que te permita alcanzar la posición de inicio con ligera flexión de rodillas',
      'Empuja contra la plataforma diamantada manteniendo el torso vertical y apóyate suavemente en los asideros de control'
    ],
    image_url: '/machines/technogym_pure_belt_squat.png'
  },
  {
    id: 'technogym_selection_multi_hip',
    title: 'Technogym Selection 900 - Multi Hip (Glúteo, Aductores y Abductores de Placas)',
    brand: 'Technogym',
    model_series: 'Selection 900 (Torre de placas)',
    muscle_group: 'glutes',
    other_muscles: ['abductors', 'adductors', 'quadriceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina biomecánica de placas con rodillo circular giratorio 360° y eje excéntrico para extensión de cadera (glúteo), aducción y abducción guiada.',
    setup_tips: [
      'Ajusta la altura del reposapiés con el pasador amarillo para alinear el eje de giro con la articulación coxofemoral',
      'Regula el ángulo del brazo del rodillo según vayas a realizar extensión de glúteo hacia atrás o abducción lateral',
      'Sujétate con firmeza a los manerales para evitar que la pelvis rote durante el recorrido'
    ],
    image_url: '/machines/technogym_selection_multi_hip.png'
  },
  {
    id: 'technogym_pure_leg_press',
    title: 'Technogym Pure Strength - Prensa de Piernas a Discos 45° (Pure Leg Press)',
    brand: 'Technogym',
    model_series: 'Pure Strength (Discos)',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes', 'hamstrings'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Prensa lineal a 45° de carga de discos olímpicos con movimiento guiado rotacional que replica la biomecánica de la sentadilla sin compresión axial en la columna vertebral.',
    setup_tips: [
      'Ajusta la inclinación del respaldo para estabilizar la pelvis y evitar la retroversión (butt wink) en máxima flexión',
      'Desbloquea los topes laterales girando las palancas amarillas al inicio del empuje',
      'Desciende hasta que el fémur quede paralelo o inferior a la plataforma (90°-100° de flexión de rodilla) manteniendo el sacro apoyado',
      'No bloquees las rodillas bruscamente en la extensión'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Perfil Ascendente - Máxima carga en extensión de rodilla (9.7/10)',
      rating: 9.7,
      match_analysis: 'El brazo de momento sobre el cuádriceps es óptimo en la fase media-alta, permitiendo aplicar máxima potencia con total seguridad lumbar.',
      pro_hack: 'Hack Biomecánico Pro: Coloca los pies en la zona media-baja de la plataforma con separación a la anchura de caderas para maximizar el momento flexor en la rodilla y el estímulo directo en el vasto interno y recto femoral.'
    },
    grips: [
      {
        id: 'feet_mid_low',
        name: 'Pies Medios-Bajos (Anchura Caderas)',
        target_muscle: 'Cuádriceps (Vastos Externo, Medio e Interno)',
        biomechanical_benefit: 'Máximo momento flexor de rodilla y elongación de cuádriceps',
        is_recommended: true
      },
      {
        id: 'feet_high_wide',
        name: 'Pies Altos y Separados',
        target_muscle: 'Glúteo Mayor y Aductores',
        biomechanical_benefit: 'Mayor brazo de momento sobre la cadera',
        is_recommended: false
      }
    ],
    target_rep_range: '8-12',
    image_url: '/machines/technogym_pure_leg_press.png'
  },
  {
    id: 'technogym_selection_leg_press',
    title: 'Technogym Selection 900 - Leg Press (Prensa Horizontal de Placas)',
    brand: 'Technogym',
    model_series: 'Selection 900 (Torre de placas)',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes', 'calves'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Prensa de placas con respaldo ajustable en ángulo y movimiento lineal suave que minimiza la compresión lumbar mientras proporciona tensión constante en cuádriceps.',
    setup_tips: [
      'Ajusta el respaldo con la palanca amarilla para sentarte con la pelvis bien anclada',
      'Coloca los pies en la plataforma a la anchura de las caderas',
      'Empuja la plataforma sin bloquear las rodillas al final del recorrido concéntrico'
    ],
    resistance_profile: {
      curve: 'mid_range',
      curve_label: 'Carga guiada con desaceleración suave (9.4/10)',
      rating: 9.4,
      match_analysis: 'Excelente para rangos medios y drop-sets rápidos gracias al selector de placas.',
      pro_hack: 'Hack: Ajusta el pin selector rápidamente en descanso-pausa para exprimir hipertrofia metabólica.'
    },
    target_rep_range: '12-15',
    image_url: '/machines/technogym_selection_leg_press.png'
  },

  {
    id: 'technogym_selection_leg_extension',
    title: 'Technogym Selection - Leg Extension',
    brand: 'Technogym',
    model_series: 'Selection 900 / Biostrength',
    muscle_group: 'quadriceps',
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Aislamiento de cuádriceps con eje concéntrico adaptable.',
    setup_tips: [
      'Estudio Pedrosa et al. (2022): La fase de 90° a 45° en estiramiento profundo produce significativamente mayor hipertrofia del cuádriceps que el bloqueo terminal',
      'Alinea el pivote amarillo de la máquina con el cóndilo lateral de la rodilla para evitar fuerzas de cizallamiento en el ligamento cruzado',
      'Ajusta el respaldo para que la espalda esté en contacto completo y agarra firmemente las manetas laterales para deprimir la pelvis'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Tensión máxima en semielongación (9.6/10)',
      rating: 9.6,
      match_analysis: 'Aísla el recto femoral en su función extensora con brazo de palanca estable.',
      pro_hack: 'Hack Biomecánico Pro: Realiza repeticiones parciales en estiramiento (de 90° a 45°) al llegar al fallo concéntrico para exprimir el potencial hipertrófico mediado por estiramiento.'
    },
    image_url: '/machines/technogym_selection_leg_extension.png'
  },
  {
    id: 'technogym_selection_leg_curl',
    title: 'Technogym Selection - Seated Leg Curl',
    brand: 'Technogym',
    model_series: 'Selection 900 / Biostrength',
    muscle_group: 'hamstrings',
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Curl femoral sentado para máximo estiramiento proximal de los isquiosurales.',
    setup_tips: [
      'Estudio Maeo et al. (2021): La flexión de cadera a 90° en posición sentada produce un 25-30% más de hipertrofia que el curl tumbado debido a la tensión pasiva previa del bíceps femoral',
      'Inclina levemente el torso hacia adelante para acentuar el estiramiento en la tuberosidad isquiática',
      'Fija firmemente la almohadilla superior sobre los muslos para evitar la retroversión de cadera compensatoria'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Máxima elongación y pico en flexión de 60° (9.8/10)',
      rating: 9.8,
      match_analysis: 'El curl sentado es el ejercicio rey para la cabeza larga del bíceps femoral, semitendinoso y semimembranoso.',
      pro_hack: 'Hack Biomecánico Pro: No dejes que la pelvis se despegue del asiento; mantén los tobillos en dorsiflexión neutra para evitar calambres en gemelos.'
    },
    image_url: '/machines/technogym_selection_leg_curl.png'
  },
  {
    id: 'hammer_kneeling_leg_curl',
    title: 'Hammer Strength - Kneeling Leg Curl (Femoral Tumbado / Unilateral)',
    brand: 'Hammer Strength',
    model_series: 'Plate Loaded',
    muscle_group: 'hamstrings',
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Aislamiento unilateral de isquiosurales con palanca pivotante de curvatura optimizada.',
    setup_tips: [
      'Apoya el pecho firmemente contra el cojín acolchado inclinado',
      'Sitúa el rodillo por encima del talón de Aquiles y flexiona hasta tocar el glúteo'
    ],
    image_url: '/machines/hammer_kneeling_leg_curl.png'
  },
  {
    id: 'hammer_glute_drive',
    title: 'Hammer Strength - Glute Drive (Hip Thrust de Discos)',
    brand: 'Hammer Strength',
    model_series: 'Plate Loaded',
    muscle_group: 'glutes',
    other_muscles: ['hamstrings', 'quadriceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina oficial de hip thrust con cinturón acolchado para máxima sobrecarga segura de glúteos.',
    setup_tips: [
      'Ajusta el cinturón ancho sobre la cadera pélvica',
      'Empuja con los talones hasta alcanzar la extensión completa de 180° y realiza una pausa isométrica'
    ],
    image_url: '/machines/hammer_glute_drive.png'
  },

  // Espalda Baja / Lumbares (Lower Back)
  {
    id: 'lifefitness_back_extension',
    title: 'Life Fitness Signature - Back Extension (Espalda Baja / Lumbares)',
    brand: 'Life Fitness',
    model_series: 'Signature Series',
    muscle_group: 'lower_back',
    other_muscles: ['glutes', 'hamstrings'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Extensión lumbar guiada con arco de movimiento protegido para fortalecimiento del erector espinal.',
    setup_tips: [
      'Alinea la articulación de la cadera con el eje circular de rotación de la máquina',
      'Ajusta la almohadilla superior sobre los omóplatos y la plataforma para que los pies queden firmes',
      'Extiende el tronco de manera controlada sin hiperextender bruscamente la zona lumbar'
    ],
    image_url: '/machines/lifefitness_back_extension.png'
  },
  {
    id: 'hammer_back_extension',
    title: 'Hammer Strength Select - Back Extension (Extensión Lumbar en Torre)',
    brand: 'Hammer Strength',
    model_series: 'Hammer Strength Select',
    muscle_group: 'lower_back',
    other_muscles: ['glutes', 'hamstrings'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Extensión de columna guiada en torre de placas con selector de rango de movimiento inicial para fortalecimiento del erector espinal.',
    setup_tips: [
      'Alinea el pivote de giro con la articulación coxofemoral',
      'Ajusta el rodillo dorsal a la altura de las escápulas y apoya los pies firmemente',
      'Extiende el tronco de forma fluida aguantando 1 segundo en la cima sin hiperextensión brusca'
    ],
    image_url: '/machines/hammer_back_extension.png'
  },


  // Gemelos (Calves)
  {
    id: 'hammer_seated_calf_raise',
    title: 'Hammer Strength - Plate-Loaded Seated Calf (Gemelos Sentado a Discos)',
    brand: 'Hammer Strength',
    model_series: 'Plate Loaded',
    muscle_group: 'calves',
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Elevación de talones sentado en máquina de discos oficial Hammer Strength para aislamiento estricto del músculo sóleo.',
    setup_tips: [
      'Coloca los metatarsos en la plataforma antideslizante con los talones libres',
      'Ajusta las almohadillas sobre la parte distal de los muslos (justo sobre las rodillas)',
      'Realiza una parada de 2 segundos en el fondo del estiramiento para eliminar el reflejo miotático del tendón de Aquiles'
    ],
    image_url: '/machines/hammer_seated_calf_raise.png'
  },
  {
    id: 'matrix_versa_calf_extension',
    title: 'Matrix Versa - Calf Extension (Gemelos en Prensa de Placas)',
    brand: 'Matrix',
    model_series: 'Versa Series',
    muscle_group: 'calves',
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Extensión de tobillo guiada con apoyo lumbar ergonómico en torre de placas.',
    setup_tips: [
      'Apoya los metatarsos en el borde de la plataforma con talones libres',
      'Desciende hasta el estiramiento completo con pausa de 2 segundos'
    ],
    image_url: '/machines/matrix_calf_extension.jpg'
  },

  // Abdomen (Abdominals)
  {
    id: 'technogym_selection_abdominal_crunch',
    title: 'Technogym Selection - Total Abdominal Crunch',
    brand: 'Technogym',
    model_series: 'Selection 900',
    muscle_group: 'abdominals',
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Flexión anterior del raquis lumbar contra resistencia guiada con sujeción de pies y hombros.',
    setup_tips: [
      'Coloca los pies tras los rodillos y abraza las almohadillas de pecho',
      'Flexiona la columna enrollando el abdomen en lugar de empujar con los brazos'
    ],
    image_url: '/machines/technogym_selection_abdominal_crunch.png'
  },

  // Brazos: Bíceps & Tríceps
  {
    id: 'technogym_selection_arm_curl',
    title: 'Technogym Selection 900 - Arm Curl (Predicador Bíceps)',
    brand: 'Technogym',
    model_series: 'Selection 900',
    muscle_group: 'biceps',
    other_muscles: ['forearms'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Banco Scott guiado con levas excéntricas que mantienen la tensión continua en la cabeza corta y larga del bíceps.',
    setup_tips: [
      'Apoya las axilas en el borde superior del cojín acolchado',
      'Mantén las muñecas neutras durante toda la flexión y no despegues los codos'
    ],
    image_url: '/machines/technogym_selection_arm_curl.png'
  },
  {
    id: 'hammer_seated_biceps_curl',
    title: 'Hammer Strength - Plate-Loaded Seated Biceps (Banco Scott Discos)',
    brand: 'Hammer Strength',
    model_series: 'Plate Loaded',
    muscle_group: 'biceps',
    other_muscles: ['forearms'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina de discos para bíceps con palancas independientes que permiten trabajo simétrico y unilateral.',
    setup_tips: [
      'Ajusta la altura del asiento para apoyar el pecho sin arquear la espalda',
      'Tira de forma explosiva pero controlada, apretando 1 segundo arriba'
    ],
    image_url: '/machines/hammer_seated_biceps_curl.png'
  },
  {
    id: 'lifefitness_insignia_triceps_extension',
    title: 'Life Fitness Insignia - Seated Triceps Extension',
    brand: 'Life Fitness',
    model_series: 'Insignia Series',
    muscle_group: 'triceps',
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Extensión de tríceps sentado con soporte para brazos que aísla de forma pura las tres cabezas del tríceps.',
    setup_tips: [
      'Coloca los codos apoyados en las almohadillas circulares ergonómicas',
      'Empuja hacia adelante y hacia abajo hasta extender el brazo por completo sin hiperextender el hombro'
    ],
    image_url: '/machines/lifefitness_insignia_triceps_extension.png'
  },
  {
    id: 'hammer_seated_dip_triceps',
    title: 'Hammer Strength - Seated Dip (Fondos Tríceps en Palanca)',
    brand: 'Hammer Strength',
    model_series: 'Plate Loaded',
    muscle_group: 'triceps',
    other_muscles: ['chest', 'shoulders'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Fondos en palanca sentada para sobrecargar las tres cabezas del tríceps con alta estabilidad.',
    setup_tips: [
      'Ajusta el cinturón de seguridad pélvico para no levantarte en cargas pesadas',
      'Mantén los codos pegados al cuerpo y extiende hacia abajo controlando la subida'
    ],
    image_url: '/machines/hammer_seated_dip_triceps.png'
  },

  // Hombros (Shoulders)
  {
    id: 'technogym_pure_shoulder_press',
    title: 'Technogym Pure Strength - Shoulder Press',
    brand: 'Technogym',
    model_series: 'Pure Strength',
    muscle_group: 'shoulders',
    other_muscles: ['triceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Press militar convergente guiado por palancas independientes para deltoides anterior.',
    setup_tips: [
      'Ajusta el sillín para que los agarres queden a la altura de la clavícula/orejas',
      'Empuja siguiendo la trayectoria convergente natural hacia el centro'
    ],
    image_url: '/machines/technogym_pure_shoulder_press.png'
  },

  // ==========================================
  // HAMMER STRENGTH / LIFE FITNESS
  // ==========================================
  {
    id: 'hammer_iso_front_lat_pulldown',
    title: 'Hammer Strength - Iso-Lateral Front Lat Pulldown',
    brand: 'Hammer Strength',
    model_series: 'Plate Loaded Iso-Lateral',
    muscle_group: 'lats',
    other_muscles: ['biceps', 'upper_back'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'La máquina de dorsal más icónica del culturismo con brazos independientes convergentes.',
    setup_tips: [
      'Los brazos se mueven de forma independiente: corrige descompensaciones entre lados',
      'Permite agarre neutro o prono; estira completamente en la fase excéntrica arriba'
    ],
    image_url: '/machines/hammer_iso_front_lat_pulldown.png'
  },
  {
    id: 'hammer_iso_dy_row',
    title: 'Hammer Strength - Iso-Lateral DY Row',
    brand: 'Hammer Strength',
    model_series: 'Plate Loaded (Dorian Yates Style)',
    muscle_group: 'upper_back',
    other_muscles: ['lats', 'biceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Remo con tracción diagonal descendente diseñado para densidad en dorsal medio y bajo.',
    setup_tips: [
      'Apoya el pecho firmemente contra el cojín para neutralizar el balanceo lumbar',
      'Tira con los codos pegados al cuerpo para involucrar la inserción baja del dorsal'
    ],
    image_url: '/machines/hammer_iso_dy_row.png'
  },
  {
    id: 'hammer_iso_low_row',
    title: 'Hammer Strength - Iso-Lateral Low Row',
    brand: 'Hammer Strength',
    model_series: 'Plate Loaded Iso-Lateral',
    muscle_group: 'upper_back',
    other_muscles: ['lats', 'traps', 'biceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Remo bajo en arco divergente con doble apoyo podal para tracción pesada.',
    setup_tips: [
      'Tracciona llevando los codos hacia atrás y hacia abajo',
      'Pausa isométrica de 1 segundo en máxima contracción escapular'
    ],
    image_url: '/machines/hammer_iso_low_row.png'
  },
  {
    id: 'hammer_iso_wide_chest',
    title: 'Hammer Strength - Iso-Lateral Bench Press',
    brand: 'Hammer Strength',
    model_series: 'Plate Loaded Iso-Lateral',
    muscle_group: 'chest',
    other_muscles: ['triceps', 'shoulders'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Prensa horizontal plana de palancas convergentes que reproduce la banca olímpica con total seguridad.',
    setup_tips: [
      'Ajusta la altura del banco con el pasador lateral para que los mangos queden a mitad de pecho',
      'No bloquees los codos al final del recorrido para mantener tensión continua'
    ],
    image_url: '/machines/hammer_iso_wide_chest.png'
  },
  {
    id: 'hammer_iso_incline_press',
    title: 'Hammer Strength - Iso-Lateral Incline Press',
    brand: 'Hammer Strength',
    model_series: 'Plate Loaded Iso-Lateral',
    muscle_group: 'chest',
    other_muscles: ['shoulders', 'triceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Prensa inclinada con trayectoria convergente hacia arriba para reclutar las fibras claviculares.',
    setup_tips: [
      'Ajusta el asiento para que el agarre quede justo por debajo del mentón en posición inicial',
      'Empuja con los codos a 45 grados respecto al tronco'
    ],
    image_url: '/machines/hammer_iso_incline_press.png'
  },
  {
    id: 'hammer_iso_decline_press',
    title: 'Hammer Strength - Iso-Lateral Decline Press',
    brand: 'Hammer Strength',
    model_series: 'Plate Loaded Iso-Lateral',
    muscle_group: 'chest',
    other_muscles: ['triceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Prensa declinada que elimina el estrés en la articulación glenohumeral anterior.',
    setup_tips: [
      'Fija las piernas bajo los rodillos para no deslizarte durante la carga pesada',
      'Excelente opción si tienes dolor en el hombro al hacer press plano'
    ],
    image_url: '/machines/hammer_iso_decline_press.png'
  },
  {
    id: 'hammer_linear_hack_squat',
    title: 'Hammer Strength - Linear Hack Squat (Sentadilla Hack a Discos)',
    brand: 'Hammer Strength',
    model_series: 'Plate-Loaded Linear',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes', 'calves'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Sentadilla Hack lineal sobre guías de precisión a 45°. Máximo aislamiento de cuádriceps (vasto externo e intermedio) con total seguridad para la columna lumbar.',
    setup_tips: [
      'Apoya la espalda y hombreras firmemente sobre el acolchado contorneado',
      'Sitúa los pies en la parte baja de la plataforma para máximo énfasis en cuádriceps',
      'Desciende hasta alcanzar al menos 90° de flexión de rodilla manteniendo la cadera pegada'
    ],
    image_url: '/machines/hammer_linear_hack_squat.png'
  },
  {
    id: 'hammer_plate_loaded_v_squat',
    title: 'Hammer Strength - Plate-Loaded V-Squat (Sentadilla V)',
    brand: 'Hammer Strength',
    model_series: 'Plate Loaded Series',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes', 'hamstrings', 'lower_back'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Sentadilla en arco guiado que reduce la compresión axial en vértebras lumbares permitiendo trabajo frontal o invertido.',
    setup_tips: [
      'Apoya las hombreras firmemente y sitúa los pies en el centro de la plataforma antideslizante',
      'Permite ejecución inversa (Reverse Hack) mirando hacia el respaldo para mayor reclutamiento de glúteo e isquios'
    ],
    image_url: '/machines/hammer_plate_loaded_v_squat.png'
  },
  {
    id: 'hammer_iso_leg_extension',
    title: 'Hammer Strength - Iso-Lateral Leg Extension (Discos)',
    brand: 'Hammer Strength',
    model_series: 'Plate Loaded Iso-Lateral',
    muscle_group: 'quadriceps',
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Extensión de cuádriceps de palancas independientes para aislamiento y simetría entre ambas piernas.',
    setup_tips: [
      'Regula el cojín lumbar para que el eje de rotación de la rodilla coincida con el pivote de la máquina',
      'Pausa isométrica de 1 segundo en la cima del movimiento'
    ],
    image_url: '/machines/hammer_iso_leg_extension.png'
  },

  // ==========================================
  // MATRIX FITNESS (Ultra & Versa Series)
  // ==========================================
  {
    id: 'matrix_ultra_converging_chest',
    title: 'Matrix Ultra - Converging Chest Press',
    brand: 'Matrix',
    model_series: 'Ultra Series (G7-S13)',
    muscle_group: 'chest',
    other_muscles: ['triceps', 'shoulders'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Prensa con torre de placas digital y empuñaduras dobles (prono y neutro).',
    setup_tips: [
      'El dial superior permite añadir micro-pesos de 1.1 kg y 2.3 kg para sobrecarga milimétrica'
    ],
    image_url: '/machines/matrix_ultra_converging_chest.jpg'
  },
  {
    id: 'matrix_ultra_diverging_lat_pulldown',
    title: 'Matrix Ultra - Diverging Lat Pulldown',
    brand: 'Matrix',
    model_series: 'Ultra Series (G7-S33)',
    muscle_group: 'lats',
    other_muscles: ['biceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Jalón divergente que respeta la línea de tracción natural de las fibras del dorsal.',
    setup_tips: [
      'Las empuñaduras rotan libremente: permite pronación arriba y supinación abajo'
    ],
    image_url: '/machines/matrix_ultra_diverging_lat_pulldown.jpg'
  },
  {
    id: 'matrix_ultra_seated_row',
    title: 'Matrix Ultra - Diverging Seated Row',
    brand: 'Matrix',
    model_series: 'Ultra Series (G7-S34)',
    muscle_group: 'upper_back',
    other_muscles: ['lats', 'biceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Remo sentado con apoyo de pecho ergonómico y agarres multi-posición rotativos.',
    setup_tips: [
      'Regula el cojín de pecho de modo que al estirar los brazos las placas no choquen',
      'Utiliza el micro-peso superior para superar mesetas de carga'
    ],
    image_url: '/machines/matrix_ultra_seated_row.jpg'
  },
  {
    id: 'matrix_ultra_leg_extension',
    title: 'Matrix Ultra - Leg Extension',
    brand: 'Matrix',
    model_series: 'Ultra Series (G7-S71)',
    muscle_group: 'quadriceps',
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Extensión de cuádriceps de precisión con asiento anatómico reclinable.',
    setup_tips: [
      'Alinea el centro de la rodilla con el indicador circular del marco',
      'Aprieta 1 segundo al llegar a la extensión completa'
    ],
    image_url: '/machines/matrix_ultra_leg_extension.jpg'
  },

  // ==========================================
  // PANATTA (Free Weight Special & Monolith)
  // ==========================================
  {
    id: 'panatta_super_hack_squat',
    title: 'Panatta - Super Hack Squat 45°',
    brand: 'Panatta',
    model_series: 'Free Weight Special (1FW087)',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'La máquina de hack preferida en culturismo pro, con plataforma curvada de apoyo podal.',
    setup_tips: [
      'La plataforma curvada permite modificar el apoyo de los pies sin tensión en el tendón rotuliano',
      'El respaldo anatómico previene cualquier redondeo lumbar ("butt wink")'
    ],
    image_url: '/machines/panatta_super_hack_squat.png'
  },
  {
    id: 'panatta_super_high_row',
    title: 'Panatta - Super High Row',
    brand: 'Panatta',
    model_series: 'Free Weight Special (1FW003)',
    muscle_group: 'upper_back',
    other_muscles: ['lats', 'biceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Tracción alta divergente con arco biomecánico guiado de máxima tensión dorsal.',
    setup_tips: [
      'Inicia con los brazos extendidos y abre el pecho al tirar llevando los codos abajo',
      'Pies firmemente plantados sobre los estribos metálicos antideslizantes'
    ],
    image_url: '/machines/panatta_super_high_row.png'
  },
  {
    id: 'panatta_incline_chest',
    title: 'Panatta - Free Weight Incline Chest Press',
    brand: 'Panatta',
    model_series: 'Free Weight (1FW039)',
    muscle_group: 'chest',
    other_muscles: ['shoulders', 'triceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Prensa inclinada articulada de palancas independientes para el haz clavicular del pectoral.',
    setup_tips: [
      'Ajusta la altura del asiento para alinear las empuñaduras con la parte alta del tórax'
    ],
    image_url: '/machines/panatta_incline_chest.png'
  },
  {
    id: 'panatta_super_leg_press_bridge',
    title: 'Panatta - Super Leg Press Bridge 45°',
    brand: 'Panatta',
    model_series: 'Free Weight Special (1FW085)',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes', 'hamstrings'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Prensa articulada de discos con plataforma sobredimensionada de 80x60 cm y sistema de contrapeso a resorte.',
    setup_tips: [
      'Posición podal alta y ancha para enfatizar glúteo e isquios; baja para enfatizar cuádriceps',
      'El sistema de palanca descompresiona las rodillas en el punto de máxima flexión profunda'
    ],
    image_url: '/machines/panatta_super_leg_press_bridge.png'
  },
  {
    id: 'panatta_viking_press_calf',
    title: 'Panatta - Viking Press & Standing Calf (Hombros & Gemelos)',
    brand: 'Panatta',
    model_series: 'Free Weight Special (1FW029)',
    muscle_group: 'shoulders',
    other_muscles: ['calves', 'triceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Prensa Vikinga de palancas independientes para empuje vertical de hombros y elevación de talones de pie con plataforma super-grip.',
    setup_tips: [
      'Para Viking Press (hombro): empuja con agarre neutro manteniendo el abdomen contraído sin arquear la espalda',
      'Para gemelo de pie: apoya los hombros bajo las almohadillas, sitúa los metatarsos en el estribo y extiende al máximo'
    ],
    image_url: '/machines/panatta_viking_press_calf.png'
  },

  // ==========================================
  // ELEIKO (Certificación IPF / Competición)
  // ==========================================
  {
    id: 'eleiko_prestera_half_rack',
    title: 'Eleiko - Prestera Half Rack con Banco Regulable',
    brand: 'Eleiko',
    model_series: 'Prestera Strength System',
    muscle_group: 'quadriceps',
    other_muscles: ['chest', 'shoulders', 'glutes'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Half rack de competición en acero sueco con brazos protectores telescópicos y banco ajustable multiposición.',
    setup_tips: [
      'Ajusta la altura de los J-cups para que la barra quede a la altura del esternón superior antes de sacar la carga',
      'Brazos de seguridad con recubrimiento de polímero que amortigua caídas imprevistas'
    ],
    image_url: '/machines/eleiko_prestera_half_rack.png'
  },
  {
    id: 'eleiko_power_rack',
    title: 'Eleiko - Prestera Power Rack',
    brand: 'Eleiko',
    model_series: 'Prestera Strength',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes', 'hamstrings', 'lower_back'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Jaula de potencia profesional con acero sueco, barras magnéticas de seguridad y J-cups de precisión.',
    setup_tips: [
      'Ajusta los seguros de acero justo por debajo de tu punto de profundidad en sentadilla',
      'Utiliza calzado de suela plana para una base sólida de transferencia de fuerza'
    ],
    image_url: '/machines/eleiko_power_rack.png'
  },
  {
    id: 'eleiko_olympic_bench',
    title: 'Eleiko - Olympic Flat Bench Press',
    brand: 'Eleiko',
    model_series: 'Powerlifting / IPF Certified',
    muscle_group: 'chest',
    other_muscles: ['triceps', 'shoulders'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Banca olímpica con soportes de rodillos y barra Eleiko de 20 kg.',
    setup_tips: [
      'Asegura los topes metálicos olímpicos para evitar el desplazamiento de discos',
      'Realiza un arco fisiológico firme con 5 puntos de apoyo (pies, glúteo, escápulas, cabeza)'
    ],
    image_url: '/machines/eleiko_olympic_bench.png'
  },

  // ==========================================
  // FEMORAL TUMBADO (LYING / PRONE LEG CURL)
  // ==========================================
  {
    id: 'technogym_selection_prone_leg_curl',
    title: 'Technogym Selection - Prone Leg Curl (Femoral Tumbado)',
    brand: 'Technogym',
    model_series: 'Selection 900 (Torre de placas)',
    muscle_group: 'hamstrings',
    other_muscles: ['calves'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina de femoral tumbado con banco angulado a 25° para estirar los isquiosurales sin forzar la curvatura lumbar.',
    setup_tips: [
      'Alinea el eje de rotación de la máquina (punto amarillo) directamente con la articulación de la rodilla',
      'Regula el rodillo de apoyo para que repose justo encima de los talones de Aquiles',
      'Sujeta los asideros frontales y aprieta el abdomen contra el banco durante toda la flexión'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Pico de tensión en flexión terminal de rodilla',
      rating: 9.3,
      match_analysis: 'Recluta intensamente las cabezas corta y larga del bíceps femoral en acortamiento.',
      pro_hack: 'Hack: Mantén los tobillos en flexión dorsal (puntas hacia la tibia) para inhibir los gemelos y focalizar los isquios.'
    },
    target_rep_range: '10-12',
    image_url: '/machines/technogym_selection_prone_leg_curl.png'
  },
  {
    id: 'technogym_pure_standing_leg_curl',
    title: 'Technogym Pure Strength - Standing Leg Curl (Femoral de Pie a Discos)',
    brand: 'Technogym',
    model_series: 'Pure Strength (Discos)',
    muscle_group: 'hamstrings',
    other_muscles: ['glutes', 'calves'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Curl femoral unilateral de pie con carga a discos olímpicos. Permite aislar cada pierna individualmente siguiendo la curva fisiológica natural de flexión de rodilla.',
    setup_tips: [
      'Apoya el muslo firmemente sobre la almohadilla frontal y sitúa el rodillo por encima del talón de Aquiles',
      'Flexiona la rodilla hacia el glúteo sin arquear la zona lumbar ni balancear la pelvis',
      'Controla la fase excéntrica en 3 segundos sintiendo el estiramiento en el vientre del bíceps femoral'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Curva fisiológica convergente (9.7/10)',
      rating: 9.7,
      match_analysis: 'Aislamiento unilateral estricto para eliminar asimetrías de fuerza.',
      pro_hack: 'Hack: Mantén el tobillo neutro para no transferir el trabajo al gastrocnemio.'
    },
    target_rep_range: '10-12',
    image_url: '/machines/technogym_pure_standing_leg_curl.png'
  },

  {
    id: 'panatta_freeweight_lying_leg_curl',
    title: 'Panatta Freeweight - Lying Leg Curl (Femoral Tumbado a Discos)',
    brand: 'Panatta',
    model_series: 'Freeweight HP (Carga de discos)',
    muscle_group: 'hamstrings',
    other_muscles: ['calves', 'glutes'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Palanca pura de flexión de rodilla con perfil de resistencia progresivo que maximiza la tensión en la fase de acortamiento.',
    setup_tips: [
      'Mantén los pies en ligera flexión dorsal (punteras apuntando a la espinilla) para inhibir los gemelos',
      'Controla la bajada excéntrica en 3 segundos sin dejar que los discos choquen al final'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Sobrecarga de palanca progresiva a discos',
      rating: 9.5,
      match_analysis: 'Sensación de tensión muscular ininterrumpida sin rozamiento de poleas.',
      pro_hack: 'Hack: Aprieta los cuádriceps contra el banco para fijar la cadera y evitar que el glúteo suba.'
    },
    target_rep_range: '8-12',
    image_url: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=800&q=80'
  },

  // ==========================================
  // ABDUCCIÓN DE PIE (STANDING HIP ABDUCTION)
  // ==========================================
  {
    id: 'panatta_monolith_standing_abductor',
    title: 'Panatta Monolith - Standing Abductor (Abducción de Glúteo de Pie)',
    brand: 'Panatta',
    model_series: 'Monolith Selection',
    muscle_group: 'glutes',
    other_muscles: ['abductors'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Abducción de cadera en bipedestación que elimina la flexión lumbar y activa el glúteo medio en su vector óptimo.',
    setup_tips: [
      'Coloca el rodillo acolchado en la parte lateral externa del muslo, justo sobre la rodilla',
      'Mantén la pelvis neutra y empuja hacia afuera en diagonal (30° posterior) sin ladear el torso'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Mayor tensión en el inicio de la abducción',
      rating: 9.6,
      match_analysis: 'La posición bípeda permite el vector exacto de 30° posterior para el glúteo medio y superior.',
      pro_hack: 'Hack: Inclina el torso 10° hacia el soporte para estirar el glúteo medio antes de iniciar la abducción.'
    },
    target_rep_range: '12-15',
    image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'matrix_ultra_standing_glute_kick',
    title: 'Matrix Ultra - Standing Glute & Abductor',
    brand: 'Matrix',
    model_series: 'Ultra Series',
    muscle_group: 'glutes',
    other_muscles: ['hamstrings', 'lower_back'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Plataforma para patada trasera y abducción de pie con doble asidero multiposición y selector electrónico.',
    setup_tips: [
      'Apoya los codos en los reposabrazos acolchados para aislar la articulación coxofemoral',
      'Empuja con el talón de forma constante hasta alcanzar la contracción máxima del glúteo mayor'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Pico de contracción terminal con cadera extendida',
      rating: 9.1,
      match_analysis: 'Favorece el acortamiento de fibras ilíacas del glúteo mayor.',
      pro_hack: 'Hack: Pausa 1 segundo arriba manteniendo la pelvis inmóvil.'
    },
    target_rep_range: '12-15',
    image_url: '/machines/technogym_pure_standing_glute.png'
  },

  // ==========================================
  // GEMELOS DE PIE (STANDING CALF RAISE)
  // ==========================================
  {
    id: 'hammer_standing_calf_raise',
    title: 'Hammer Strength - Standing Calf Raise (Gemelos de Pie a Discos)',
    brand: 'Hammer Strength',
    model_series: 'Plate-Loaded Ground Base',
    muscle_group: 'calves',
    other_muscles: ['calves'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina para gemelo de pie con rodillos acolchados regulables sobre hombros y plataforma curvada antideslizante.',
    setup_tips: [
      'Mantén las rodillas bloqueadas en extensión casi completa (con microflexión de seguridad)',
      'Desciende hasta conseguir un estiramiento profundo del sóleo y gastrocnemio; pausa 2 segundos abajo',
      'Eleva el cuerpo sobre los primeros metatarsos concentrando el empuje en el dedo gordo'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Máxima tensión en dorsiflexión profunda (Elongación del tendón de Aquiles)',
      rating: 9.6,
      match_analysis: 'El gastrocnemio responde mejor al estímulo mecánico en máximo estiramiento bajo carga pesada.',
      pro_hack: 'Hack: Realiza una pausa isométrica de 2 segundos en el fondo para disipar la energía elástica del tendón.'
    },
    target_rep_range: '10-15',
    image_url: '/machines/hammer_standing_calf_raise.png'
  },
  {
    id: 'hammer_super_horizontal_calf',
    title: 'Hammer Strength - Super Horizontal Calf (PL-SHC a Discos)',
    brand: 'Hammer Strength',
    model_series: 'Plate-Loaded Linear',
    muscle_group: 'calves',
    other_muscles: ['calves'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina de gemelos horizontal a discos donde el empuje se transmite directamente a través de las caderas, eliminando la compresión axial sobre la columna vertebral.',
    setup_tips: [
      'Apoya las almohadillas sobre las crestas ilíacas y fija la posición de inicio',
      'Desciende hasta alcanzar una dorsiflexión completa sintiendo la tensión en el tendón de Aquiles',
      'Extiende los tobillos explosivamente y pausa 1 segundo en flexión plantar máxima'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Tensión constante sin compresión espinal',
      rating: 9.8,
      match_analysis: 'Es la máquina de gemelos biomecánicamente superior para cargar peso sin riesgo de dolor lumbar.',
      pro_hack: 'Hack: Descenso lento de 3 segundos con 2 segundos de parada isométrica abajo.'
    },
    target_rep_range: '12-18',
    image_url: '/machines/hammer_super_horizontal_calf.png'
  },
  {
    id: 'technogym_selection_standing_calf',
    title: 'Technogym Selection - Standing Calf (Gemelos en Torre)',
    brand: 'Technogym',
    model_series: 'Selection 900',
    muscle_group: 'calves',
    other_muscles: ['calves'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Elevación de talones en bipedestación con columna de placas guiada y almohadillas pivotantes para hombros.',
    setup_tips: [
      'Regula la altura de los apoyos de hombro para desbloquear el seguro con ligera flexión de rodillas',
      'Ejecuta repeticiones estrictas evitando el rebote del tendón de Aquiles'
    ],
    resistance_profile: {
      curve: 'constant',
      curve_label: 'Tensión constante guiada por torre de placas',
      rating: 8.9,
      match_analysis: 'Permite un cambio rápido de carga con el pin para series descendentes (drop sets).',
      pro_hack: 'Hack: Eleva únicamente hasta la posición neutra si sientes molestia en el arco plantar.'
    },
    target_rep_range: '12-15',
    image_url: '/machines/technogym_selection_standing_calf.png'
  },

  // ==========================================
  // BÍCEPS (PREACHER / SCOTT / DUAL CURL)
  // ==========================================
  {
    id: 'panatta_super_preacher_curl',
    title: 'Panatta Super Scott - Preacher Biceps Curl (Banco Scott a Discos)',
    brand: 'Panatta',
    model_series: 'Super Freeweight HP',
    muscle_group: 'biceps',
    other_muscles: ['forearms'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Banco predicador Scott articulado con levas excéntricas que mantienen la tensión tanto al inicio como al final de la flexión.',
    setup_tips: [
      'Ajusta la altura del asiento para que la axila descanse firmemente en el borde superior del soporte acolchado',
      'Evita separar los codos durante la fase concéntrica y contrae el bíceps 1 segundo en el punto alto'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Pico de torque en ángulo medio-alto de flexión',
      rating: 9.4,
      match_analysis: 'Aísla la cabeza corta del bíceps braquial sin balanceo ni ayuda del deltoides anterior.',
      pro_hack: 'Hack: No extiendas los codos al 100% en hiperextensión brusca; frena 5° antes para mantener la tensión muscular continua.'
    },
    grips: [
      {
        id: 'grip_supine',
        name: 'Agarre Supino',
        target_muscle: 'Bíceps Braquial (Cabeza Corta)',
        biomechanical_benefit: 'Máxima activación EMG en supinación',
        is_recommended: true
      },
      {
        id: 'grip_semi_neutral',
        name: 'Agarre Semi-Neutro / EZ',
        target_muscle: 'Braquial Anterior y Braquiorradial',
        biomechanical_benefit: 'Protege las articulaciones radiocubitales de la muñeca',
        is_recommended: false
      }
    ],
    target_rep_range: '8-12',
    image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'matrix_ultra_arm_curl',
    title: 'Matrix Ultra - Arm Biceps Curl (Palanca Guiada Independiente)',
    brand: 'Matrix',
    model_series: 'Ultra Series',
    muscle_group: 'biceps',
    other_muscles: ['forearms'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Bíceps en máquina de placas con manerales giratorios 360° que reducen la tensión ligamentosa en la muñeca.',
    setup_tips: [
      'Alinea el codo con el pivote circular de rotación de los brazos móviles',
      'Puedes usar agarre neutro para trabajar el braquiorradial o prono/supino según el objetivo'
    ],
    resistance_profile: {
      curve: 'mid_range',
      curve_label: 'Tensión equilibrada en todo el rango',
      rating: 9.0,
      match_analysis: 'El pivote flotante mantiene un brazo de palanca estable.',
      pro_hack: 'Hack: Inicia en posición neutra y rota a supino durante la subida.'
    },
    target_rep_range: '10-12',
    image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80'
  },

  // ==========================================
  // TRÍCEPS (FONDOS EN MÁQUINA & EXTENSIONES)
  // ==========================================
  {
    id: 'technogym_selection_seated_dip',
    title: 'Technogym Selection 900 - Seated Triceps Press (Tríceps Sentado de Placas / Seated Dip)',
    brand: 'Technogym',
    model_series: 'Selection 900',
    muscle_group: 'triceps',
    other_muscles: ['chest', 'shoulders'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina de fondos sentado con cinturón de retención para sobrecarga pesada del tríceps braquial sin estrés acromioclavicular.',
    setup_tips: [
      'Estudio Boehler et al.: El torso 100% vertical con codos cerrados produce el mayor momento extensor sobre las cabezas lateral y medial del tríceps, evitando compensación de pectoral',
      'Abróchate el cinturón de retención pélvico para permitir sobrecarga progresiva supramáxima sin despegar los glúteos',
      'Desciende controladamente hasta los 90° de flexión de codo para no estirar la cápsula anterior del hombro'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Máxima tensión en extensión terminal de codo (9.4/10)',
      rating: 9.4,
      match_analysis: 'Permite sobrecargar el tríceps con cargas elevadas con la pelvis 100% estabilizada.',
      pro_hack: 'Hack Biomecánico Pro: Mantén la columna lumbar neutra y realiza una pausa isométrica de 1 segundo abajo en bloqueo para forzar el reclutamiento de las unidades motoras de alto umbral.'
    },
    grips: [
      {
        id: 'grip_narrow',
        name: 'Agarre Estrecho Paralelo',
        target_muscle: 'Tríceps (Cabezas Lateral y Medial)',
        biomechanical_benefit: 'Línea de fuerza perpendicular a la fosa olecraniana',
        is_recommended: true
      },
      {
        id: 'grip_wide',
        name: 'Agarre Ancho Divergente',
        target_muscle: 'Pectoral Inferior y Deltoides Anterior',
        biomechanical_benefit: 'Mayor apertura articular',
        is_recommended: false
      }
    ],
    target_rep_range: '8-12',
    image_url: '/machines/technogym_selection_seated_dip.png'
  },
  {
    id: 'panatta_monolith_triceps_dip',
    title: 'Panatta Monolith - Seated Triceps Dip (Fondos Guiados Convergentes)',
    brand: 'Panatta',
    model_series: 'Monolith Selection',
    muscle_group: 'triceps',
    other_muscles: ['chest', 'shoulders'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Empuje descendente convergente con doble posición de asas que replica el fondo en paralelas con máxima estabilidad.',
    setup_tips: [
      'Regula el respaldo para mantener el tronco recto o con ligera inclinación hacia el frente',
      'Empuja con la eminencia tenar de la mano y extiende por completo sin hiperextender el codo de golpe'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Trayectoria convergente hacia abajo',
      rating: 9.3,
      match_analysis: 'La convergencia reduce el estrés en la articulación de la muñeca.',
      pro_hack: 'Hack: Mantén las escápulas deprimidas durante todo el recorrido.'
    },
    target_rep_range: '10-12',
    image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  },

  // ==========================================
  // GLÚTEO (KICKBACK & CIRCULAR)
  // ==========================================
  {
    id: 'technogym_pure_standing_glute',
    title: 'Technogym Pure Strength - Standing Glute Kickback',
    brand: 'Technogym',
    model_series: 'Pure Strength',
    muscle_group: 'glutes',
    other_muscles: ['hamstrings'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Palanca independiente de patada de glúteo en discos con trayectoria circular biomecánica pura.',
    setup_tips: [
      'Apoya el pecho en la almohadilla inclinada y contrae el transverso abdominal para fijar la pelvis',
      'Extiende la pierna hacia atrás impulsando desde el talón sin rotar la cadera'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Pico en contracción máxima del glúteo mayor',
      rating: 9.2,
      match_analysis: 'Sigue la trayectoria curvilínea del fémur en extensión.',
      pro_hack: 'Hack: Aprieta 1 segundo en el bloqueo articular de cadera.'
    },
    target_rep_range: '12-15',
    image_url: '/machines/technogym_pure_standing_glute.png'
  },
  {
    id: 'panatta_circular_glute_kickback',
    title: 'Panatta Freeweight - Circular Glute Kickback (Patada de Glúteo a Discos)',
    brand: 'Panatta',
    model_series: 'Freeweight HP',
    muscle_group: 'glutes',
    other_muscles: ['hamstrings', 'lower_back'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina de discos con trayectoria semicircular que coincide con la línea de tiro de las fibras superiores del glúteo mayor.',
    setup_tips: [
      'Coloca la planta del pie en el estribo móvil y ajusta la altura del soporte pélvico',
      'Pausa 1.5 segundos en la fase de máxima contracción terminal para activar el 100% de fibras motoras'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Curva en arco semiesférico a discos',
      rating: 9.5,
      match_analysis: 'Alinea la fuerza con la orientación de las fibras del glúteo mayor.',
      pro_hack: 'Hack: Mantén la rodilla de apoyo ligeramente flexionada para ganar estabilidad.'
    },
    target_rep_range: '10-12',
    image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  },

  // ==========================================
  // HOMBROS (MÁQUINAS DE ELEVACIONES LATERALES)
  // ==========================================
  {
    id: 'technogym_pure_lateral_raise',
    title: 'Technogym Pure Strength - Lateral Raise (Elevaciones Laterales en Máquina)',
    brand: 'Technogym',
    model_series: 'Pure Strength (Palancas convergentes)',
    muscle_group: 'shoulders',
    other_muscles: ['traps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina de elevaciones laterales guiada por almohadillas en codos que aísla el deltoides lateral sin participación del antebrazo.',
    setup_tips: [
      'Ajusta el asiento para que el pivote de giro coincida con el acromion de tu hombro',
      'Presiona con los codos hacia afuera en el plano escapular (30° adelantado respecto al torso)',
      'Eleva hasta la altura de los hombros (90°) controlando el descenso sin rebotar abajo'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Tensión constante desde los 0° hasta los 90° de abducción',
      rating: 9.7,
      match_analysis: 'Supera con creces a las mancuernas, que ofrecen 0 tensión en los primeros 30° de elevación.',
      pro_hack: 'Hack Biomecánico Pro: Relaja completamente las manos y empuja exclusivamente con el tríceps distal/codo contra las almohadillas para anular cualquier intervención del trapecio superior.'
    },
    target_rep_range: '12-15',
    image_url: '/machines/technogym_pure_lateral_raise.png'
  },
  {
    id: 'matrix_ultra_lateral_raise',
    title: 'Matrix Ultra - Lateral Raise (Deltoides Lateral Guiado en Torre)',
    brand: 'Matrix',
    model_series: 'Ultra Series',
    muscle_group: 'shoulders',
    other_muscles: ['traps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Elevaciones laterales en torre de placas con manijas autoalineables y contador electrónico de repeticiones.',
    setup_tips: [
      'Mantén el pecho firme contra la almohadilla frontal y la barbilla retraída',
      'Inicia el movimiento pensando en empujar las paredes laterales con los codos'
    ],
    resistance_profile: {
      curve: 'mid_range',
      curve_label: 'Carga uniforme con levas excéntricas',
      rating: 9.3,
      match_analysis: 'Excelente curva con palanca autoajustable al largo de brazo del usuario.',
      pro_hack: 'Hack: Desciende en 3 segundos frenando la gravedad.'
    },
    target_rep_range: '12-15',
    image_url: '/machines/matrix_ultra_lateral_raise.png'
  },

  // ==========================================
  // LUMBAR (BANCO 45° & EXTENSIÓN LUMBAR)
  // ==========================================
  {
    id: 'panatta_45_hyperextension_bench',
    title: 'Panatta Freeweight - 45° Hyperextension / Roman Chair (Banco Lumbar y Glúteo)',
    brand: 'Panatta',
    model_series: 'Freeweight Pro',
    muscle_group: 'lower_back',
    other_muscles: ['glutes', 'hamstrings'],
    equipment_category: 'other',
    exercise_type: 'weight_reps',
    description: 'Banco inclinado a 45° para hiperextensiones lumbares, fortalecimiento del erector espinal y cadena posterior.',
    setup_tips: [
      'Regula el soporte acolchado superior 3 cm por debajo de la sínfisis púbica para permitir la flexión completa de cadera',
      'Desciende con la columna recta o redondea ligeramente en dorsal si el objetivo es aislar glúteo e isquios',
      'Sube contrayendo glúteos y lumbares hasta alinear el torso con las piernas sin hiperextender el cuello'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Pico de palanca a 45° con gravedad perpendicular',
      rating: 9.5,
      match_analysis: 'Recluta armónicamente erectores espinales, glúteos e isquiosurales.',
      pro_hack: 'Hack: Si deseas aislar GLÚTEOS, redondea la espalda alta (cifosis dorsal), rota los pies a 45° hacia afuera y concéntrate en extender solo desde la cadera.'
    },
    target_rep_range: '10-15',
    image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'technogym_selection_lower_back',
    title: 'Technogym Selection - Lower Back (Extensión Lumbar en Torre)',
    brand: 'Technogym',
    model_series: 'Selection 900',
    muscle_group: 'lower_back',
    other_muscles: ['glutes'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina guiada con rodillo de apoyo en escápulas medias y plataforma de pies para extensión controlada del erector de columna.',
    setup_tips: [
      'Ajusta la palanca de inicio según tu rango de movilidad lumbar confortable',
      'Empuja con la espalda media manteniendo los talones firmemente anclados en los estribos'
    ],
    resistance_profile: {
      curve: 'mid_range',
      curve_label: 'Tensión lineal con soporte axial',
      rating: 8.8,
      match_analysis: 'Ideal para rehabilitación y ganancia de densidad en multífidos y erector espinal.',
      pro_hack: 'Hack: No despegues los pies de los estribos en ningún momento.'
    },
    target_rep_range: '12-15',
    image_url: '/machines/technogym_selection_lower_back.png'
  },

  // ==========================================
  // REMO EN T (CHEST-SUPPORTED T-BAR ROW)
  // ==========================================
  {
    id: 'hammer_chest_supported_t_bar_row',
    title: 'Hammer Strength - Chest Supported T-Bar Row (Remo en T con Apoyo)',
    brand: 'Hammer Strength',
    model_series: 'Plate-Loaded Ground Base',
    muscle_group: 'upper_back',
    other_muscles: ['lats', 'biceps', 'traps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Remo en T con cojín pectoral que descarga la columna vertebral permitiendo mover cargas pesadas para espalda media y dorsales.',
    setup_tips: [
      'Apoya la parte superior del esternón en la almohadilla sin comprimir el plexo solar',
      'Usa agarre neutro para enfatizar el dorsal ancho o agarre prono abierto para trapecio medio y deltoides posterior',
      'Tracciona con los codos hacia la cadera y retrae completamente las escápulas al final'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Máxima sobrecarga en semielongación con soporte torácico',
      rating: 9.8,
      match_analysis: 'El apoyo pectoral elimina la fatiga del erector espinal, permitiendo llevar la espalda media al fallo técnico real.',
      pro_hack: 'Hack Biomecánico Pro: Usa agarre neutro cerrado y piensa en empujar la almohadilla con el pecho mientras tiras hacia las costillas para una retracción escapular perfecta.'
    },
    grips: [
      {
        id: 'grip_tbar_neutral',
        name: 'Agarre Neutro Cerrado',
        target_muscle: 'Dorsal Ancho y Romboides',
        biomechanical_benefit: 'Línea de tiro cerrada en el plano sagital',
        is_recommended: true
      },
      {
        id: 'grip_tbar_wide_prono',
        name: 'Agarre Prono Abierto a 45°',
        target_muscle: 'Trapecio Medio y Deltoides Posterior',
        biomechanical_benefit: 'Favorece aducción escapular pura en plano transversal',
        is_recommended: false
      }
    ],
    target_rep_range: '8-12',
    image_url: '/machines/hammer_chest_supported_t_bar_row.png'
  },
  {
    id: 'panatta_super_t_bar_row',
    title: 'Panatta Freeweight - Super T-Bar Row Pectoral Support',
    brand: 'Panatta',
    model_series: 'Super Freeweight HP',
    muscle_group: 'upper_back',
    other_muscles: ['lats', 'biceps', 'upper_back'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina a discos con plataforma multiángulo para pies y agarres giratorios independientes de precisión biomecánica.',
    setup_tips: [
      'Selecciona el ángulo de apoyo del pie para conseguir estabilidad total sin desplazarte',
      'Mantén los hombros deprimidos antes de comenzar el tirón para no sobrecargar el trapecio superior'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Palanca pura a discos con plataforma divergente',
      rating: 9.6,
      match_analysis: 'Los agarres giratorios se adaptan a la rotación natural del antebrazo.',
      pro_hack: 'Hack: Ajusta los pies en la inclinación más vertical para evitar resbalar.'
    },
    target_rep_range: '8-10',
    image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'
  },

  // ==========================================
  // REMO SENTADO A DISCOS & MÁS MÁQUINAS DE DISCOS (PLATE-LOADED)
  // ==========================================
  {
    id: 'hammer_plate_loaded_seated_row',
    title: 'Hammer Strength - Iso-Lateral Seated Row (Remo Sentado a Discos)',
    brand: 'Hammer Strength',
    model_series: 'Plate-Loaded Ground Base',
    muscle_group: 'lats',
    other_muscles: ['upper_back', 'biceps', 'traps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'El remo a discos de referencia en culturismo profesional: brazos independientes con divergencia anatómica que aísla el dorsal ancho.',
    setup_tips: [
      'Regula el asiento para que el soporte de pecho quede justo en el tercio inferior del esternón',
      'Para tracción unilateral con máximo estímulo de dorsal ilíaco, siéntate 5 cm más retrasado en el asiento sin bloquearte totalmente con el cojín',
      'Conduce el codo rozando la cadera sin permitir que el hombro rote internamente'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Pico en acortamiento por palancas divergentes (9.8/10 con ajuste unilateral)',
      rating: 9.8,
      match_analysis: 'En ejecución bilateral sentada, la divergencia angular traslada el pico de tensión a la posición acortada donde el dorsal pierde brazo de momento interno. Sin embargo, al ejecutarlo unilateralmente se transforma en el mejor estímulo biomecánico existente para el dorsal ancho.',
      pro_hack: 'Hack Biomecánico Pro (Recomendación Sentado/De Pie a Una Mano): Para emparejar el perfil de resistencia de la máquina con la curva de fuerza real del dorsal, NO lo hagas bilateral. Ejecútalo UNILATERAL (a una mano): colócate de pie con el torso a 45° apoyando la mano contraria en el respaldo, o siéntate girando la cadera 30° en diagonal. Esto elimina la divergencia de la palanca, permitiendo que la mano tire en una trayectoria sagital pura hacia la cresta ilíaca sin rotación humeral, cargando el dorsal en su rango de máxima fuerza (estiramiento y medio).'
    },
    grips: [
      {
        id: 'grip_neutral_low',
        name: 'Agarre Neutro Inferior',
        target_muscle: 'Dorsal Ancho Bajo (Fibras Ilíacas y Lumbares)',
        biomechanical_benefit: 'Permite un vector de tracción cerrado pegado a la cresta ilíaca sin rotación humeral',
        is_recommended: true
      },
      {
        id: 'grip_pronation_high',
        name: 'Agarre Prono Superior Abierto',
        target_muscle: 'Trapecio Medio, Romboides y Deltoides Posterior',
        biomechanical_benefit: 'Favorece una abducción de codo a 45-60° con retracción escapular completa',
        is_recommended: false
      }
    ],
    target_rep_range: '8-12',
    image_url: '/machines/hammer_iso_low_row.png'
  },
  {
    id: 'panatta_super_rowing_plate',
    title: 'Panatta Freeweight - Super Rowing a Discos (Remo Sentado Convergente)',
    brand: 'Panatta',
    model_series: 'Super Freeweight HP',
    muscle_group: 'lats',
    other_muscles: ['upper_back', 'biceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina de remo sentado a discos con pivote de trayectoria curvilínea que acompaña la articulación del hombro.',
    setup_tips: [
      'Apoya el pecho con el esternón erguido y las escápulas neutras',
      'Inicia con los codos en extensión controlada para un estiramiento completo de la fascia dorsal'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Tensión progresiva con pico en contracción terminal (9.3/10)',
      rating: 9.3,
      match_analysis: 'La leva mecánica incrementa el brazo de palanca al acercar las manos al torso.',
      pro_hack: 'Hack Biomecánico Pro: Rota ligeramente el torso (10°) hacia el lado que tracciona para aumentar el acortamiento de las fibras medias del dorsal.'
    },
    grips: [
      {
        id: 'grip_semi_supine',
        name: 'Agarre Semi-Supino / Ergonómico',
        target_muscle: 'Dorsal Ancho y Braquial Anterior',
        biomechanical_benefit: 'Minimiza la tensión en los epicóndilos del codo',
        is_recommended: true
      }
    ],
    target_rep_range: '8-10',
    image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'technogym_selection_low_row',
    title: 'Technogym Selection 900 - Low Row (Remo Bajo en Torre de Placas)',
    brand: 'Technogym',
    model_series: 'Selection 900 (Torre de placas)',
    muscle_group: 'upper_back',
    other_muscles: ['lats', 'biceps', 'traps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Remo bajo en columna de placas con levas ergonómicas independientes que guían el codo en un arco perfecto hacia las costillas.',
    setup_tips: [
      'Regula la altura del asiento para que el apoyo pectoral coincida con la parte baja del esternón',
      'Tira de los manerales con los codos pegados para enfocar dorsal o abiertos para romboides',
      'Aguanta 1 segundo en máxima retracción escapular'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Pico de resistencia en contracción completa (9.5/10)',
      rating: 9.5,
      match_analysis: 'Aislamiento impecable de romboides y trapecio medio.',
      pro_hack: 'Hack: Suelta el aire al traccionar para cerrar costillas y optimizar la inserción dorsal.'
    },
    target_rep_range: '10-12',
    image_url: '/machines/technogym_selection_low_row.png'
  },
  {
    id: 'technogym_selection_pulley',
    title: 'Technogym Selection 900 - Seated Cable Row (Polea Baja de Remo)',
    brand: 'Technogym',
    model_series: 'Selection 900 (Torre de placas)',
    muscle_group: 'lats',
    other_muscles: ['upper_back', 'biceps'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Remo en polea baja horizontal clásica con apoyo anatómico para pies y desplazamiento de cable sin fricción.',
    setup_tips: [
      'Apoya los pies en los estribos con ligera flexión de rodilla para no tensar la zona poplítea',
      'Mantén el pecho erguido y lleva el agarre directamente hacia el ombligo',
      'Estira los brazos completamente hacia adelante en la fase excéntrica permitiendo la protracción escapular'
    ],
    resistance_profile: {
      curve: 'constant',
      curve_label: 'Tensión continua y constante por polea (9.6/10)',
      rating: 9.6,
      match_analysis: 'El clásico remo sentado en polea con la suavidad de rodamientos Technogym.',
      pro_hack: 'Hack: Utiliza agarre neutro estrecho para máximo enfoque en la porción iliocostal del dorsal.'
    },
    target_rep_range: '10-12',
    image_url: '/machines/technogym_selection_pulley.png'
  },
  {
    id: 'hammer_plate_loaded_leg_press_45',
    title: 'Hammer Strength - 45° Linear Plate-Loaded Leg Press (Prensa 45° a Discos)',
    brand: 'Hammer Strength',
    model_series: 'Plate-Loaded Linear',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes', 'calves', 'hamstrings'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Prensa lineal a 45° con raíles de acero pulido y rodamientos sellados para sobrecarga de cuádriceps sin cizallamiento vertebral.',
    setup_tips: [
      'Ajusta la inclinación del respaldo a 40° para evitar la retroversión de la pelvis (butt wink) en la máxima flexión',
      'Coloca los pies al ancho de las caderas en la parte inferior para máximo cuádriceps o arriba para glúteo/isquios',
      'Baja hasta que el fémur forme al menos 90° con la tibia sin levantar el sacro del respaldo'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Máxima tensión en estiramiento de cuádriceps y glúteos (9.6/10)',
      rating: 9.6,
      match_analysis: 'Curva lineal perfecta donde la gravedad ejerce la máxima fuerza normal en el punto de mayor flexión de rodilla.',
      pro_hack: 'Hack Biomecánico Pro: Sujétate con fuerza a los asideros laterales traccionando hacia arriba para empotrar tu cadera contra el respaldo, eliminando el riesgo de flexión lumbosacra.'
    },
    target_rep_range: '10-15',
    image_url: '/machines/hammer_plate_loaded_leg_press_45.png'
  },
  {
    id: 'panatta_super_belt_squat',
    title: 'Panatta Freeweight - Belt Squat a Discos (Sentadilla con Cinturón)',
    brand: 'Panatta',
    model_series: 'Super Freeweight HP',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Sentadilla a discos con carga suspendida de la pelvis mediante cinturón, eliminando el 100% de compresión axial en la columna vertebral.',
    setup_tips: [
      'Ajusta el cinturón ancho por encima de la pelvis y ancla el mosquetón en el orificio central',
      'Desciende con tronco vertical buscando la máxima flexión de rodilla sin restricción en tobillos'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Máxima sobrecarga en flexión profunda con cero compresión espinal (9.8/10)',
      rating: 9.8,
      match_analysis: 'Permite acumular volumen masivo de cuádriceps incluso con hernias discales o fatiga lumbar severa.',
      pro_hack: 'Hack: Sujétate de los manerales frontales tirando ligeramente hacia atrás para permitir que las rodillas viajen hacia adelante, aislando los vastos medial y lateral.'
    },
    target_rep_range: '8-12',
    image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'hammer_iso_bench_press_plate',
    title: 'Hammer Strength - Iso-Lateral Horizontal Bench Press a Discos',
    brand: 'Hammer Strength',
    model_series: 'Plate-Loaded Iso-Lateral',
    muscle_group: 'chest',
    other_muscles: ['triceps', 'shoulders'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Press banca horizontal con palancas convergentes a discos para sobrecarga del pectoral medio y esternal.',
    setup_tips: [
      'Regula el asiento para que las empuñaduras queden al nivel de los pezones',
      'Retrae y deprime escápulas antes de descolgar la palanca'
    ],
    resistance_profile: {
      curve: 'mid_range',
      curve_label: 'Tensión balanceada en rango medio y acortamiento',
      rating: 9.4,
      match_analysis: 'La convergencia acompaña el acortamiento horizontal de las fibras esternales del pectoral.',
      pro_hack: 'Hack: Realiza una pausa de 1 segundo abajo sin rebotar para aumentar el estímulo hipertrófico en estiramiento.'
    },
    grips: [
      {
        id: 'grip_pronation_standard',
        name: 'Agarre Prono Estándar',
        target_muscle: 'Pectoral Mayor Esternocostal',
        biomechanical_benefit: 'Máxima transferencia de fuerza con muñeca vertical',
        is_recommended: true
      }
    ],
    target_rep_range: '6-10',
    image_url: '/machines/hammer_iso_wide_chest.png'
  },

  // ==========================================
  // MÁS MÁQUINAS ESENCIALES EN GIMNASIOS DE ESPAÑA
  // ==========================================
  {
    id: 'panatta_super_pendulum_squat',
    title: 'Panatta Super Freeweight - Pendulum Squat (Sentadilla Péndulo)',
    brand: 'Panatta',
    model_series: 'Super Freeweight HP',
    muscle_group: 'quadriceps',
    other_muscles: ['glutes', 'calves'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'La máquina de sentadilla más aclamada en los centros de alto rendimiento en España: curva pendular que elimina el estrés axial en la columna y maximiza la flexión de rodilla.',
    setup_tips: [
      'Coloca los pies en la mitad inferior de la plataforma para un estímulo puro en vasto interno y recto femoral',
      'Desciende con cadera hacia atrás hasta que el contrapeso pase la curva de transición',
      'Extiende sin bloquear violentamente las rodillas al final'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Curva pendular compensada con alivio articular (9.9/10)',
      rating: 9.9,
      match_analysis: 'Aligera la carga en el agujero profundo donde la rodilla es más vulnerable, y sobrecarga el recorrido medio y alto.',
      pro_hack: 'Hack Biomecánico Pro: Baja sin miedo a romper la paralela; la leva del péndulo asiste en la transición, generando una activación brutal del vasto medial sin dolor de rodillas.'
    },
    target_rep_range: '8-12',
    image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'matrix_ultra_rotary_torso',
    title: 'Matrix Ultra - Rotary Torso (Rotación de Torso y Oblicuos)',
    brand: 'Matrix',
    model_series: 'Ultra Series',
    muscle_group: 'abdominals',
    other_muscles: ['abdominals'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina de rotación de tronco con rodillos estabilizadores de rodillas para aislar oblicuos internos y externos.',
    setup_tips: [
      'Fija las rodillas entre los rodillos de apoyo para que la rotación provenga del torso y no de las caderas',
      'Gira suavemente en un arco de 45° manteniendo la espalda pegada al cojín'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Pico en torsión máxima',
      rating: 8.7,
      match_analysis: 'Aislamiento de la musculatura rotadora espinal.',
      pro_hack: 'Hack: Realiza una contracción isométrica de 1 segundo en el punto de giro.'
    },
    target_rep_range: '12-15',
    image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'technogym_selection_shoulder_press',
    title: 'Technogym Selection - Shoulder Press (Press Militar en Torre)',
    brand: 'Technogym',
    model_series: 'Selection 900',
    muscle_group: 'shoulders',
    other_muscles: ['triceps', 'chest'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Press vertical de hombros guiado con trayectoria convergente y pedal de inicio asistido.',
    setup_tips: [
      'Pisa el pedal para acercar las empuñaduras antes de colocar las manos',
      'Usa el agarre neutro si presentas molestias en el manguito rotador o prono para deltoides anterior completo'
    ],
    image_url: '/machines/technogym_selection_shoulder_press.png'
  },
  {
    id: 'hammer_iso_incline_chest_press',
    title: 'Hammer Strength - Iso-Lateral Incline Press (Press Inclinado Palancas)',
    brand: 'Hammer Strength',
    model_series: 'Plate-Loaded Iso-Lateral',
    muscle_group: 'chest',
    other_muscles: ['shoulders', 'triceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Pectoral superior convergente con brazos independientes que corrigen asimetrías de empuje.',
    setup_tips: [
      'Ajusta el asiento de modo que las asas queden al nivel de la clavícula en la posición de reposo',
      'Empuja siguiendo la curva natural de convergencia sin despegar los glúteos del asiento'
    ],
    image_url: '/machines/hammer_iso_incline_press.png'
  },

  // ==========================================
  // CARDIO & RESISTENCIA EN ENTRENAMIENTO
  // ==========================================
  {
    id: 'cardio_incline_treadmill',
    title: 'Cinta Inclinada (Incline Treadmill Walk)',
    brand: 'Life Fitness',
    model_series: 'Elevation Series',
    muscle_group: 'cardio',
    other_muscles: ['calves', 'glutes', 'hamstrings'],
    equipment_category: 'cardio_machine',
    exercise_type: 'cardio_incline',
    description: 'Caminata en pendiente pronunciada (8-15%) para alto gasto calórico con cero impacto articular.',
    setup_tips: [
      'Mantén la postura erguida sin sujetarte de los pasamanos para maximizar el trabajo de core y glúteo',
      'Velocidad recomendada entre 4.8 km/h y 6.0 km/h con inclinación del 10% al 12%'
    ],
    image_url: '/machines/cardio_incline_treadmill.png'
  },
  {
    id: 'cardio_stationary_bike',
    title: 'Bicicleta Estática / Spinning',
    brand: 'Life Fitness',
    model_series: 'Integrity Series',
    muscle_group: 'cardio',
    other_muscles: ['quadriceps', 'calves'],
    equipment_category: 'cardio_machine',
    exercise_type: 'cardio_time_distance',
    description: 'Pedaleo continuo en zona 2 o intervalos HIIT con resistencia electromagnética.',
    setup_tips: [
      'Regula el sillín a la altura de tu cresta ilíaca para que la pierna quede con una ligera flexión de 15° al fondo',
      'Mantén una cadencia fluida de 75-90 RPM'
    ],
    image_url: '/machines/cardio_bike.png'
  },

  // ==========================================
  // CATÁLOGO AMPLIADO: FITNESS PARK, VIVAGYM & ALTAFIT
  // ==========================================
  {
    id: 'panatta_super_pullover_machine',
    title: 'Panatta Freeweight - Super Pullover a Discos',
    brand: 'Panatta',
    model_series: 'Super Freeweight Special',
    muscle_group: 'lats',
    other_muscles: ['chest', 'abdominals', 'triceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'La máquina de pullover a discos por excelencia en gimnasios de alto rendimiento. Sobrecarga la fascia del dorsal ancho, redondo mayor y serrato anterior con un arco de palanca curvilíneo.',
    setup_tips: [
      'Ajusta la altura del asiento para que el eje del hombro coincida exactamente con el pivote de giro de las almohadillas',
      'Apoya los codos en los pads circulares y mantén las manos relajadas en las asas para no traccionar con los tríceps',
      'Inhala profundamente en la fase de máximo estiramiento superior para expandir la caja torácica'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Pico en máximo estiramiento supraescapular (9.9/10)',
      rating: 9.9,
      match_analysis: 'Proporciona una tensión mecánica que las mancuernas no pueden lograr al inicio del recorrido por cuestiones de gravedad.',
      pro_hack: 'Hack Biomecánico Pro: Mantén la zona lumbar pegada al cojín con retroversión pélvica activa para aislar el dorsal y evitar hiperextensión espinal compensatoria.'
    },
    target_rep_range: '8-12',
    image_url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'panatta_standing_unilateral_leg_curl',
    title: 'Panatta Monolith - Standing Leg Curl Unilateral',
    brand: 'Panatta',
    model_series: 'Monolith Plate & Pin',
    muscle_group: 'hamstrings',
    other_muscles: ['calves', 'glutes'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Curl femoral de pie a una pierna con palanca contrabalanceada que elimina por completo la asimetría entre extremidades inferiores.',
    setup_tips: [
      'Apoya el muslo firmemente contra la almohadilla frontal y mantén la pelvis bloqueada',
      'Flexiona la rodilla llevando el talón hacia el glúteo sin balancear el torso hacia adelante',
      'Estudio Schoenfeld: La ejecución unilateral garantiza un reclutamiento simétrico sin que la pierna dominante compense'
    ],
    resistance_profile: {
      curve: 'mid_range',
      curve_label: 'Tensión constante en rango medio y acortamiento',
      rating: 9.5,
      match_analysis: 'Ideal para personas con molestias lumbares al eliminar la compresión axial del tronco.',
      pro_hack: 'Hack: Mantén el tobillo en dorsiflexión activa para optimizar la longitud del gastrocnemio.'
    },
    target_rep_range: '10-15',
    image_url: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'booty_builder_platinum',
    title: 'Booty Builder - Platinum Hip Thrust (Empuje de Cadera Guiado)',
    brand: 'Booty Builder',
    model_series: 'Platinum Commercial',
    muscle_group: 'glutes',
    other_muscles: ['hamstrings', 'quadriceps'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'La máquina de Hip Thrust oficial y patentada de mayor presencia en gimnasios españoles (VivaGym, McFit, BasicFit) con cinturón acolchado de liberación rápida y plataforma antideslizante.',
    setup_tips: [
      'Estudios Contreras et al.: La mayor activación del glúteo mayor ocurre en retroversión pélvica activa en la cima de la extensión',
      'Ajusta el cinturón sobre la pelvis (espina ilíaca anterosuperior) y apriétalo para que no deslice',
      'Mantén la barbilla pegada al pecho (mirada al frente) para evitar arquear la zona lumbar'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Pico en extensión terminal de cadera (9.9/10)',
      rating: 9.9,
      match_analysis: 'La curva de fuerza del glúteo mayor es ascendente: genera su mayor momento extensor al alinearse con el fémur.',
      pro_hack: 'Hack Biomecánico Pro: Realiza una parada isométrica de 1 a 2 segundos en el bloqueo arriba empujando con los talones.'
    },
    target_rep_range: '10-12',
    image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'booty_builder_standing_abductor',
    title: 'Booty Builder - Standing Abductor (Abductor de Pie 45°)',
    brand: 'Booty Builder',
    model_series: 'Standing Station',
    muscle_group: 'abductors',
    other_muscles: ['glutes'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina de abducción en bipedestación con inclinación anterior del torso a 45° para alinear las fibras del glúteo medio y superior.',
    setup_tips: [
      'Colócate de pie con las almohadillas descansando en la parte externa distal de los muslos',
      'Inclina el torso apoyando los antebrazos en las manetas frontales',
      'Abre las piernas de forma explosiva y frena la fase excéntrica durante 2 segundos'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Tensión constante desde semielongación',
      rating: 9.7,
      match_analysis: 'La posición en bipedestación con torso inclinado recluta hasta un 40% más de fibras superiores del glúteo que la máquina sentada convencional.',
      pro_hack: 'Hack: No permitas que las rodillas se cierren por completo al retornar para mantener tensión mecánica continua.'
    },
    target_rep_range: '12-15',
    image_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'technogym_pure_biceps_curl',
    title: 'Technogym Pure Strength - Biceps Curl a Discos',
    brand: 'Technogym',
    model_series: 'Pure Strength',
    muscle_group: 'biceps',
    other_muscles: ['forearms'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina de bíceps a discos con apoyabrazos inclinado y brazos independientes con trayectoria divergente natural.',
    setup_tips: [
      'Regula el asiento para que el tríceps descanse apoyado en toda la longitud del cojín',
      'Flexiona los codos sin despegar los hombros del respaldo para evitar inercia',
      'Controla la bajada hasta el estiramiento completo sin bloquear las articulaciones bruscamente'
    ],
    resistance_profile: {
      curve: 'mid_range',
      curve_label: 'Pico de torque a 90° de flexión de codo (9.5/10)',
      rating: 9.5,
      match_analysis: 'El brazo de momento de la palanca coincide con el momento flexor del bíceps braquial y braquial anterior.',
      pro_hack: 'Hack: Usa el agarre semi-supino para aliviar la tensión sobre la articulación radiocubital.'
    },
    target_rep_range: '8-12',
    image_url: '/machines/technogym_pure_biceps_curl.png'
  },
  {
    id: 'technogym_cable_crossover_dap',
    title: 'Technogym - Dual Adjustable Pulley (DAP / Polea Doble)',
    brand: 'Technogym',
    model_series: 'Selection Cable DAP',
    muscle_group: 'chest',
    other_muscles: ['shoulders', 'biceps', 'triceps'],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Estación de doble polea regulable en altura en 21 posiciones, ideal para cruces de polea en estiramiento, elevaciones laterales y extensiones katana.',
    setup_tips: [
      'Ajusta la altura de las poleas a la altura de tu hombro para cruces medios, arriba para pectoral inferior o abajo para haz clavicular',
      'Da un paso al frente para que el cable permanezca tenso en la posición de máximo estiramiento inicial'
    ],
    resistance_profile: {
      curve: 'constant',
      curve_label: 'Tensión constante durante todo el rango articular (9.8/10)',
      rating: 9.8,
      match_analysis: 'Los cables garantizan que la resistencia no disminuya en ningún punto del arco de movimiento.',
      pro_hack: 'Hack Biomecánico Pro: En cruces de pecho, cruza levemente las manos al final para lograr la máxima aducción horizontal de las fibras esternocostales.'
    },
    target_rep_range: '12-15',
    image_url: '/machines/technogym_cable_crossover_dap.png'
  },
  {
    id: 'hammer_iso_decline_press_plate',
    title: 'Hammer Strength - Iso-Lateral Decline Press a Discos',
    brand: 'Hammer Strength',
    model_series: 'Plate-Loaded Iso-Lateral',
    muscle_group: 'chest',
    other_muscles: ['triceps', 'shoulders'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Prensa declinada con brazos de palanca independientes que aíslan las fibras esternales e inferiores del pectoral con la menor tensión acromioclavicular.',
    setup_tips: [
      'Estudio Larsen et al.: El press declinado reduce el estrés de corte subacromial en comparación con el press plano o inclinado',
      'Engancha las piernas en los rodillos de retención y apoya la espalda completamente plana',
      'Empuja en un arco convergente descendente sin despegar las escápulas del respaldo'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Pico en aducción y extensión terminal (9.6/10)',
      rating: 9.6,
      match_analysis: 'Minimiza la activación del deltoides anterior, concentrando el empuje en el pectoral mayor y tríceps.',
      pro_hack: 'Hack: Mantén los codos a 45° del torso para maximizar la alineación con las fibras inferiores del pectoral.'
    },
    target_rep_range: '8-10',
    image_url: '/machines/hammer_iso_decline_press.png'
  },
  {
    id: 'hammer_tibia_dorsi_flexion',
    title: 'Hammer Strength - Tibia Dorsi Flexion a Discos',
    brand: 'Hammer Strength',
    model_series: 'Ground Base Plate-Loaded',
    muscle_group: 'calves',
    other_muscles: ['calves'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina especializada para dorsiflexión del tobillo (tibial anterior). Esencial para la desaceleración atlética y prevención de periostitis tibial.',
    setup_tips: [
      'Siéntate con los talones apoyados en el soporte ranurado y el dorso del pie bajo el rodillo acolchado',
      'Eleva los dedos de los pies hacia las espinillas con una pausa de 1 segundo arriba',
      'Desciende de forma controlada estirando la cara anterior de la pantorrilla'
    ],
    resistance_profile: {
      curve: 'constant',
      curve_label: 'Tensión lineal directa sobre el tibial anterior',
      rating: 9.4,
      match_analysis: 'El tibial anterior equilibra la fuerza del complejo gastrocnemio-sóleo, protegiendo el tendón rotuliano.',
      pro_hack: 'Hack: Entrénalo al inicio de la sesión de pierna para mejorar la dorsiflexión en sentadillas y prensas.'
    },
    target_rep_range: '12-15',
    image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'gym80_pure_kraft_shrug_machine',
    title: 'Gym80 - Pure Kraft Shrug Machine a Discos (Encogimientos)',
    brand: 'Gym80',
    model_series: 'Pure Kraft Plate-Loaded',
    muscle_group: 'traps',
    other_muscles: ['upper_back', 'forearms'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Máquina alemana de encogimientos con palancas independientes y agarres rotatorios que siguen el plano escapular natural sin rozar los muslos.',
    setup_tips: [
      'Colócate de pie en el centro de la plataforma con los hombros relajados',
      'Sujeta los manerales neutros y eleva las clavículas directamente hacia las orejas',
      'Evita rotar los hombros hacia adelante o hacia atrás: el movimiento es una elevación vertical pura'
    ],
    resistance_profile: {
      curve: 'shortened',
      curve_label: 'Pico de tensión en elevación escapular terminal (9.7/10)',
      rating: 9.7,
      match_analysis: 'Al eliminar el roce de la barra con los muslos, el vector de fuerza es 100% vertical.',
      pro_hack: 'Hack: Aguanta 2 segundos en la cima de cada repetición para reclutar las fibras superiores del trapecio.'
    },
    target_rep_range: '10-12',
    image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'gym80_pure_kraft_seated_calf',
    title: 'Gym80 - Pure Kraft Seated Calf Raise a Discos',
    brand: 'Gym80',
    model_series: 'Pure Kraft',
    muscle_group: 'calves',
    other_muscles: ['calves'],
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: 'Elevación de talones sentado a 90° con rodillo acolchado ajustable y plataforma angulada para aislar el músculo sóleo.',
    setup_tips: [
      'Estudio Kassiano et al. (2023): Con la rodilla flexionada a 90°, el gastrocnemio queda en insuficiencia activa, aislando el músculo sóleo',
      'Coloca los metatarsos en el borde de la plataforma y desciende los talones al máximo',
      'Realiza una parada de 2 segundos en el fondo para disipar la elasticidad del tendón'
    ],
    resistance_profile: {
      curve: 'lengthened',
      curve_label: 'Máximo estiramiento del sóleo en dorsiflexión profunda',
      rating: 9.6,
      match_analysis: 'El sóleo tiene predominancia de fibras lentas y responde a rangos amplios y pausas en elongación.',
      pro_hack: 'Hack: Mantén una cadencia 3-2-1 (3s bajada, 2s pausa en estiramiento, 1s subida).'
    },
    target_rep_range: '12-15',
    image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  }
];
