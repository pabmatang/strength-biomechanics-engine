// ==========================================
// CHΔNCE BIOMECHANICS & LEVERAGE ENGINE
// Authentic machine hotspot coordinates & 3-phase resistance profiles
// ==========================================

export interface MachineHotspot {
  id: number;
  label: string;
  part_name: string;
  top: string;
  left: string;
  biomechanical_purpose: string;
  pro_tip?: string;
}

export interface PhaseTension {
  phase: 'Estiramiento (Inicio)' | 'Zona Media (45°-90°)' | 'Acortamiento (Pico Contracción)';
  pct: number;
  level: string;
  color: string;
  cue: string;
}

export interface GymHacks {
  pad_hack?: string;
  band_hack?: string;
  anthropometric_hack?: string;
}

export interface MachineBiomechanicsData {
  curve_type: 'lengthened' | 'mid_range' | 'shortened' | 'linear';
  curve_title: string;
  rating: number;
  match_summary: string;
  phases: PhaseTension[];
  strength_curve?: [number, number, number]; // [estiramiento, medio, acortamiento] % fuerza interna
  resistance_curve?: [number, number, number]; // [estiramiento, medio, acortamiento] % par máquina
  mismatch_analysis?: string;
  gym_hacks?: GymHacks;
  lever_physics: string;
  pro_hack: string;
  hotspots: MachineHotspot[];
}

export const MACHINE_BIOMECHANICS_CATALOG: Record<string, MachineBiomechanicsData> = {
  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - CHEST PRESS
  // ----------------------------------------------------
  technogym_pure_chest_press: {
    curve_type: 'shortened',
    curve_title: 'Perfil Ascendente (Pico en Acortamiento a 90° con Brazo de Momento Máximo)',
    rating: 9.8,
    match_summary: 'Perfil biomecánico ascendente de palanca: la resistencia aumenta progresivamente y alcanza su pico cuando los brazos portadiscos se sitúan a 90° del suelo en la contracción terminal.',
    strength_curve: [68, 96, 70],
    resistance_curve: [55, 82, 100],
    mismatch_analysis: 'Desajuste en Bloqueo Final: La resistencia mecánica alcanza su máximo absoluto (100%) justo cuando el pectoral está en máximo acortamiento. Requiere aceleración uniforme en la fase media para no estancarse antes de la aducción completa.',
    gym_hacks: {
      pad_hack: 'Hack Joan Pradells: Coloca una almohadilla de espuma densa (pad de 5 cm) en la zona dorsal/escapular media. Te permite ganar 4 cm de estiramiento profundo del pectoral sin que los portadiscos golpeen los topes inferiores.',
      band_hack: 'Configura bandas elásticas en "Reverse Band" desde el chasis superior para aligerar los primeros 10 cm de empuje y proteger el tendón del bíceps y manguito rotador.',
      anthropometric_hack: 'Atletas con extremidades largas: Coloca el sillín en el punto #4 o #5 para que los agarres queden a la altura de las fibras esternales medias, reduciendo el torque excesivo sobre la cápsula anterior.'
    },
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 55,
        level: 'Tensión Moderada (55%)',
        color: 'from-blue-500 to-cyan-400',
        cue: 'Palancas de carga colgando en ángulo oblicuo; brazo de momento reducido que protege la cápsula anterior y el manguito rotador en el despegue.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 82,
        level: 'Tensión Creciente (82%)',
        color: 'from-cyan-500 to-teal-400',
        cue: 'Las palancas inician el arco convergente hacia el centro; la rotación angular eleva la carga hacia la horizontal.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 100,
        level: 'Máxima Tensión (100%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Brazo de palanca a 90° respecto a la gravedad: máximo brazo de momento mecánico (τ = F · L · sin 90° = F · L) en el bloqueo y máxima congestión pectoral.'
      }
    ],
    lever_physics: 'Palanca de segundo género con eje de giro inferior y trayectoria convergente ascendente. Al estar cargada con discos, la resistencia depende directamente del ángulo de la palanca respecto a la gravedad. En el inicio del recorrido (estiramiento), el brazo portadiscos se encuentra inclinado, reduciendo el brazo de momento. A medida que extiendes los codos y juntas las manos, la palanca asciende hasta situarse a 90° respecto al suelo (vector perpendicular a la gravedad), generando el máximo momento torsor en el punto de contracción terminal del pectoral mayor.',
    pro_hack: 'Dado que el perfil es ascendente (la máquina se siente más pesada en el bloqueo final), imprime una aceleración uniforme desde el pecho y aprieta 1 segundo en el pico final sin desarmar la retracción escapular.',
    hotspots: [
      {
        id: 1,
        label: 'Regulación de Asiento',
        part_name: 'Pasador amarillo bajo el sillín',
        top: '58%',
        left: '44%',
        biomechanical_purpose: 'Alinea los hombros y codos en el plano escapular (30°-45° respecto al torso) evitando abducción forzada a 90°.',
        pro_tip: 'Regula la altura de modo que las asas coincidan con la línea media de los pezones.'
      },
      {
        id: 2,
        label: 'Portadiscos & Eje de Palanca 90°',
        part_name: 'Brazo de palanca superior con portadiscos olímpicos',
        top: '28%',
        left: '48%',
        biomechanical_purpose: 'Eje de rotación angular de los discos. Al empujar hacia adelante, este brazo gira hacia arriba hasta alcanzar 90° con la gravedad, generando el pico máximo de sobrecarga mecánica.',
        pro_tip: 'Carga discos idénticos en ambos lados para un trabajo iso-lateral simétrico.'
      },
      {
        id: 3,
        label: 'Empuñaduras Convergentes',
        part_name: 'Manetas con agarre horizontal y neutro',
        top: '38%',
        left: '52%',
        biomechanical_purpose: 'El movimiento describe un arco convergente hacia el centro que respeta la orientación anatómica de las fibras esternales del pectoral.',
        pro_tip: 'Usa el agarre horizontal para haz esternal o agarre neutro si buscas menor estrés en el hombro.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - INCLINE CHEST PRESS
  // ----------------------------------------------------
  technogym_pure_incline_chest: {
    curve_type: 'shortened',
    curve_title: 'Perfil Ascendente Inclinado (Pico en Acortamiento Clavicular)',
    rating: 9.7,
    match_summary: 'Optimizado para la cabeza clavicular del pectoral mayor y deltoides anterior con palanca ascendente a 35° que culmina en máximo brazo de momento.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 58,
        level: 'Tensión Moderada (58%)',
        color: 'from-blue-500 to-cyan-400',
        cue: 'Codos flexionados en la parte baja; la palanca de discos está en ángulo oblicuo con el suelo para un arranque suave y seguro.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 82,
        level: 'Tensión Creciente (82%)',
        color: 'from-cyan-500 to-teal-400',
        cue: 'La palanca empuja hacia arriba y adentro, aproximándose a los 90° respecto al vector de gravedad.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 100,
        level: 'Máxima Tensión (100%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Máximo brazo de momento en contracción terminal sobre el haz clavicular con las empuñaduras en convergencia.'
      }
    ],
    lever_physics: 'Brazo de palanca angular ascendente a 35°. La rotación de los portadiscos aumenta el brazo de palanca perpendicular a la gravedad conforme se produce la extensión del codo y flexión del hombro, concentrando la mayor demanda en acortamiento.',
    pro_hack: 'No despegues la zona escapular del respaldo alto. Mantén los codos unos 45° cerrados respecto a las costillas para dirigir toda la fuerza al haz clavicular.',
    hotspots: [
      {
        id: 1,
        label: 'Ajuste de Asiento',
        part_name: 'Pasador regulador de altura del sillín',
        top: '64%',
        left: '38%',
        biomechanical_purpose: 'Asegura que las empuñaduras queden al nivel de la clavícula y parte superior del pecho.',
        pro_tip: 'Si eres alto colócalo en el punto #3-#4; si eres de estatura media en el #5.'
      },
      {
        id: 2,
        label: 'Eje de Palanca & Portadiscos',
        part_name: 'Cuerno de discos independiente en brazo angular',
        top: '28%',
        left: '48%',
        biomechanical_purpose: 'Genera resistencia pura por gravedad que alcanza su máximo brazo de momento en la posición final.',
        pro_tip: 'Mantén una velocidad controlada en la bajada para no perder tensión.'
      },
      {
        id: 3,
        label: 'Palancas de Empuje Ascendente',
        part_name: 'Empuñaduras ergonómicas inclinadas',
        top: '38%',
        left: '54%',
        biomechanical_purpose: 'Trayectoria convergente que optimiza el acortamiento del haz clavicular sin colisión acromial.',
        pro_tip: 'Empuja pensando en juntar los bíceps contra la barbilla.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - PULLDOWN
  // ----------------------------------------------------
  technogym_pure_pulldown: {
    curve_type: 'mid_range',
    curve_title: 'Pico en Zona Media con Gran Retención en Acortamiento',
    rating: 9.7,
    match_summary: 'Una de las mejores máquinas de tracción vertical del mundo. La divergencia circular replica con exactitud la línea del dorsal.',
    strength_curve: [75, 95, 48],
    resistance_curve: [60, 98, 80],
    mismatch_analysis: 'Desajuste en Acortamiento Terminal: El dorsal pierde hasta un 45% de capacidad contráctil en acortamiento profundo (insuficiencia activa), mientras que la palanca mantiene un 80% de carga. Esto provoca fatiga anticipada del bíceps braquial.',
    gym_hacks: {
      pad_hack: 'Coloca un bloque de yoga o pad de alta densidad contra el soporte de muslos para adelantar 3-4 cm la posición de la cadera. Esto te permite traccionar en el plano escapular perfecto sin forzar la extensión lumbar.',
      band_hack: 'Esta máquina permite anclar una banda elástica de 15 mm en los pernos inferiores de las palancas hacia la base frontal para contrarrestar la inercia de los discos en el despegue inicial.',
      anthropometric_hack: 'Atletas >1.80 m: Utiliza el sillín en posición #3-#4 y engancha agarres D individuales a las manetas fijas para que los codos viajen pegados a las costillas sin colisión acromial.'
    },
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 78,
        level: 'Tensión Media-Alta (78%)',
        color: 'from-blue-500 to-teal-400',
        cue: 'Brazos extendidos arriba en rotación neutra; escápulas en rotación superior completa.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 98,
        level: 'Pico Máximo de Tensión (98%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Codos flexionados descendiendo en plano escapular; máxima perpendicularidad del brazo de palanca de los discos.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 82,
        level: 'Alta Tensión Sostenida (82%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Codos pegados a las costillas; no hay caída abrupta de resistencia gracias al pivote divergente de Technogym.'
      }
    ],
    lever_physics: 'Palanca suspendida con pivote alto posterior y brazos independientes divergentes. A diferencia de una polea tradicional donde el cable tira en línea recta, aquí las palancas rotan en un arco que coincide con la aducción en el plano frontal y frontal-oblicuo del húmero.',
    pro_hack: 'Inicia el movimiento con una depresión escapular consciente (bajar hombros sin flexionar los codos) antes de iniciar la tracción de los brazos.',
    hotspots: [
      {
        id: 1,
        label: 'Ajuste de Altura de Sillín',
        part_name: 'Pasador regulador amarillo de sillín',
        top: '68%',
        left: '46%',
        biomechanical_purpose: 'Alinea los hombros con la vertical del pivote para un tirón óptimo.',
        pro_tip: 'Regúlalo de modo que los pies queden completamente planos en el suelo.'
      },
      {
        id: 2,
        label: 'Rodillo Bloqueador de Muslos',
        part_name: 'Pasador amarillo de bloqueo para cuádriceps',
        top: '52%',
        left: '48%',
        biomechanical_purpose: 'Ancla la pelvis y fémur para contrarrestar la fuerza vertical sin levantarse del asiento con cargas superiores al peso corporal.',
        pro_tip: 'Deben presionar firmemente los cuádriceps sin pellizcar.'
      },
      {
        id: 3,
        label: 'Empuñaduras Divergentes Iso-laterales',
        part_name: 'Mangos articulados con carga directa de discos',
        top: '24%',
        left: '58%',
        biomechanical_purpose: 'Permite que cada brazo trabaje sin compensaciones del lado dominante y abre los codos siguiendo la trayectoria anatómica del dorsal.',
        pro_tip: 'Conduce el codo hacia la cadera en vez de tirar con las manos.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - LOW ROW
  // ----------------------------------------------------
  technogym_pure_low_row: {
    curve_type: 'mid_range',
    curve_title: 'Pico en Zona Media con Máxima Tracción Escapular',
    rating: 9.6,
    match_summary: 'Ideal para grosor de espalda, dorsal ilíaco, romboides y trapecio medio con apoyo esternal antilumbar.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 88,
        level: 'Tensión Alta (88%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Brazos extendidos adelante; protracción escapular completa con estiramiento del romboides y dorsal.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 96,
        level: 'Pico Máximo de Tensión (96%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Húmero a 90° respecto a la palanca; torque perpendicular máximo de los discos cargados.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 68,
        level: 'Media-Alta (68%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Codos rebasan el torso; la palanca se eleva ligeramente facilitando el bloqueo escapular sin arqueo de columna.'
      }
    ],
    lever_physics: 'Brazo de palanca bajo con eje de giro anterior inferior. Proporciona una resistencia que tracciona en diagonal abajo-adelante, permitiendo al dorsal ancho traccionar siguiendo su vector de extensión del hombro.',
    pro_hack: 'Si quieres enfatizar dorsal bajo usa el agarre neutro estrecho pegando los codos. Si buscas trapecio medio y romboides, usa agarre prono abierto tirando a 60°.',
    hotspots: [
      {
        id: 1,
        label: 'Ajuste de Asiento',
        part_name: 'Pasador amarillo de elevación de sillín',
        top: '56%',
        left: '42%',
        biomechanical_purpose: 'Posiciona el pecho en el centro exacto del apoyo para anular compensación con la columna lumbar.',
        pro_tip: 'El borde superior del cojín debe quedar en la parte media de tu esternón.'
      },
      {
        id: 2,
        label: 'Apoyo Pectoral Torácico',
        part_name: 'Almohadilla frontal con regulación de profundidad',
        top: '48%',
        left: '48%',
        biomechanical_purpose: 'Permite ajustar el recorrido de estiramiento para que los brazos alcancen elongación total sin despegar el pecho.',
        pro_tip: 'Regúlalo de forma que en máxima elongación tus dedos rocen las asas sin encorvar la espalda.'
      },
      {
        id: 3,
        label: 'Empuñaduras Independientes',
        part_name: 'Palancas de tracción con doble agarre',
        top: '40%',
        left: '56%',
        biomechanical_purpose: 'Palancas iso-laterales que compensan asimetrías de fuerza entre hemitórax izquierdo y derecho.',
        pro_tip: 'Tracciona con los codos liderando el movimiento; mantén la muñeca neutra.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - ROW DORIAN (REMO DORIAN)
  // ----------------------------------------------------
  technogym_pure_row_dorian: {
    curve_type: 'mid_range',
    curve_title: 'Pico en Zona Media con Máxima Extensión y Retracción',
    rating: 9.7,
    match_summary: 'Remo horizontal de discos diseñado para masa densa en espalda media, dorsal y romboides con estabilidad torácica.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 90,
        level: 'Tensión Alta (90%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Escápulas completamente abiertas en protracción sin perder el contacto del esternón.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 96,
        level: 'Pico de Fuerza Máximo (96%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Codos en 45°; activación simultánea de dorsal ancho, redondo mayor y trapecio medio.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 72,
        level: 'Media-Alta (72%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Retracción escapular compacta con 1 segundo de isometría recomendada.'
      }
    ],
    lever_physics: 'Palancas convergentes de gran radio con pivote anterior. El centro de masas de la carga rota de forma que el momento torsor acompaña la curva de fuerza del complejo escapulohumeral.',
    pro_hack: 'Mantén una pausa isométrica de 1 segundo en el punto de contracción máxima antes de iniciar la bajada lenta de 3 segundos.',
    hotspots: [
      {
        id: 1,
        label: 'Altura de Sillín',
        part_name: 'Pasador amarillo bajo el asiento',
        top: '55%',
        left: '42%',
        biomechanical_purpose: 'Alinea la línea de tracción con el punto medio de inserción escapular.',
        pro_tip: 'Sube el asiento si quieres enfocar dorsal bajo; bájalo si buscas trapecio medio.'
      },
      {
        id: 2,
        label: 'Cojín Pectoral Torácico',
        part_name: 'Soporte anterior de esternón',
        top: '46%',
        left: '48%',
        biomechanical_purpose: 'Elimina totalmente el estrés sobre los erectores espinales lumbares y estabiliza el torso.',
        pro_tip: 'Presiona el pecho contra el cojín durante toda la serie sin despegarte.'
      },
      {
        id: 3,
        label: 'Manillar Multi-Agarre',
        part_name: 'Empuñaduras ergonómicas convergentes',
        top: '36%',
        left: '54%',
        biomechanical_purpose: 'Permite alternar agarre prono abierto (romboides/trapecio) o neutro cerrado (dorsal puro).',
        pro_tip: 'Tira con fuerza hacia las caderas, no hacia el cuello.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - T-BAR ROW
  // ----------------------------------------------------
  technogym_pure_t_bar_row: {
    curve_type: 'lengthened',
    curve_title: 'Perfil Descendente (Pico de Resistencia a 90° en Máximo Estiramiento)',
    rating: 9.9,
    match_summary: 'Remo en T de discos olímpicos con soporte torácico fijo. La palanca parte perpendicular a la gravedad (90° respecto al suelo), generando un perfil descendente con el 100% de par en el inicio que aligera en la contracción.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 100,
        level: 'Máxima Tensión (100%)',
        color: 'from-blue-500 to-cyan-400',
        cue: 'Palanca horizontal a 90° respecto a la gravedad: par torsor máximo (τ = F·L·sin 90° = F·L) en estiramiento profundo con las escápulas abiertas.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 84,
        level: 'Tensión Progresiva (84%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'La palanca asciende angularmente superando los 90°; tracción compacta hacia el esternón.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 68,
        level: 'Resistencia Aligerada (68%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Cierre escapular fluido; el brazo de momento decae aliviando la insuficiencia activa del dorsal.'
      }
    ],
    lever_physics: 'Palanca de discos pivotante posterior con soporte torácico inclinado fijo a ~45°. Al despegar con brazos extendidos, la palanca se encuentra perpendicular a la fuerza de gravedad (90° respecto al suelo), produciendo el máximo brazo de momento posible (100% par torsor). A medida que traccionas hacia el cojín, la palanca rota hacia arriba acercándose a la vertical, reduciendo progresivamente el brazo de momento de la carga (perfil descendente), lo que facilita el bloqueo escapular sin estancarse.',
    pro_hack: 'Coloca los pies en el escalón o cerca de la base debajo del respaldo. Por física: cuanto más alejes los pies hacia atrás, más peso corporal recae sobre el cojín torácico, dificultando la respiración y restando estabilidad al core.',
    hotspots: [
      {
        id: 1,
        label: 'Cojín Pectoral Fijo',
        part_name: 'Soporte torácico inclinado acolchado',
        top: '15%',
        left: '52%',
        biomechanical_purpose: 'Elimina todo el estrés axial en la columna lumbar. Al ser fijo no permite alejarte del respaldo; apoya el esternón firmemente.',
        pro_tip: 'No intentes despegar el pecho durante la tracción para no perder tensión mecánica.'
      },
      {
        id: 2,
        label: 'Plataforma de Apoyo de Pies',
        part_name: 'Pedales dobles estriados antideslizantes',
        top: '55%',
        left: '72%',
        biomechanical_purpose: 'Regula la distribución del peso corporal: apoya los pies compactos cerca del respaldo para liberar la compresión pulmonar.',
        pro_tip: 'Evita retrasar los pies en exceso para poder expandir la caja torácica con comodidad.'
      },
      {
        id: 3,
        label: 'Palanca Portadiscos & Agarres',
        part_name: 'Brazo de palanca con cuerno olímpico y manillar dual',
        top: '68%',
        left: '32%',
        biomechanical_purpose: 'Parte de 90° con par torsor máximo al inicio; manillar neutro para dorsal y prono para espalda alta.',
        pro_tip: 'Tracciona con aceleración suave desde el fondo aprovechando el perfil descendente natural.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - DEADLIFT
  // ----------------------------------------------------
  technogym_pure_deadlift: {
    curve_type: 'shortened',
    curve_title: 'Perfil Guiado de Cadena Posterior (Pico en Extensión Terminal)',
    rating: 9.8,
    match_summary: 'Máquina de peso muerto guiada a discos con palancas independientes convergentes y amplia plataforma diamantada para máxima seguridad lumbar y reclutamiento de glúteos e isquios.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 70,
        level: 'Tensión Segura (70%)',
        color: 'from-blue-500 to-cyan-400',
        cue: 'Palancas a la altura media de la tibia; despegue protegido sin el balanceo horizontal de una barra libre.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 90,
        level: 'Alta Tensión Mecánica (90%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Extensión simultánea de rodillas y cadera con empuje plantar contra la chapa estriada.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 100,
        level: 'Máximo Bloqueo Glúteo (100%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Bloqueo terminal de glúteos y erectores sin hiperextensión lumbar.'
      }
    ],
    lever_physics: 'Doble palanca independiente convergente montada sobre rodamientos industriales. La trayectoria de pivote traslada el vector de carga hacia el centro de gravedad del atleta, eliminando el brazo de momento perjudicial que sufren las vértebras L4-L5 en el peso muerto convencional con barra.',
    pro_hack: 'Mantén los hombros sobre la línea de las empuñaduras y empuja el suelo hacia abajo como si fuera una prensa de piernas.',
    hotspots: [
      {
        id: 1,
        label: 'Plataforma Texturada Diamantada',
        part_name: 'Chapa de acero antideslizante con textura de diamante',
        top: '75%',
        left: '50%',
        biomechanical_purpose: 'Base ancha que permite posicionamiento convencional o semi-sumo con estabilidad inquebrantable.',
        pro_tip: 'Coloca los pies a la anchura de caderas con puntas ligeramente abiertas hacia afuera.'
      },
      {
        id: 2,
        label: 'Empuñaduras Rotatorias de Doble Altura',
        part_name: 'Mangos ergonómicos estriados neutros',
        top: '48%',
        left: '38%',
        biomechanical_purpose: 'Permite regular el rango de inicio para atletas con fémures largos o menor movilidad de isquios.',
        pro_tip: 'Usa el agarre alto si buscas enfoque en glúteos e inicio con menor flexión de cadera.'
      },
      {
        id: 3,
        label: 'Portadiscos Independientes',
        part_name: 'Brazos de carga laterales olímpicos',
        top: '42%',
        left: '74%',
        biomechanical_purpose: 'Asegura una sobrecarga simétrica corrigiendo desbalances de fuerza entre lado izquierdo y derecho.',
        pro_tip: 'Carga discos olímpicos equilibrados en ambos lados.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM SELECTION - LEG EXTENSION
  // ----------------------------------------------------
  technogym_selection_leg_extension: {
    curve_type: 'shortened',
    curve_title: 'Pico en Acortamiento (Leva Excéntrica Cam Ascendente)',
    rating: 9.6,
    match_summary: 'Diseño biomecánico con leva excéntrica que protege el cruzado anterior (LCA) en estiramiento y maximiza el pico en bloqueo del cuádriceps.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 45,
        level: 'Tensión Moderada (45%)',
        color: 'from-blue-500 to-cyan-400',
        cue: 'Rodilla flexionada a 90°-100°; radio de leva reducido para prevenir cizallamiento en el ligamento cruzado anterior.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 85,
        level: 'Tensión Alta (85%)',
        color: 'from-teal-500 to-emerald-400',
        cue: 'La leva incrementa progresivamente su radio efectivo a medida que el cuádriceps gana ventaja mecánica.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 100,
        level: 'Pico Máximo de Tensión (100%)',
        color: 'from-emerald-500 to-green-400',
        cue: 'Rodilla en extensión completa (0°); palanca horizontal y leva en máximo diámetro. Contracción brutal en recto femoral y vastos.'
      }
    ],
    lever_physics: 'Leva excéntrica elíptica (Nautilus Cam Principle). Al inicio (flexión 90°), el radio de la leva r(θ) es mínimo, reduciendo el torque externo en la posición donde la rótula sufre mayor presión de contacto. Conforme la tibia se eleva, r(θ) aumenta hasta el máximo en extensión horizontal, generando la máxima tensión justo en el pico de acortamiento.',
    pro_hack: 'Regula el respaldo para que el hueco poplíteo (detrás de la rodilla) quede a 1 cm del borde del asiento y el pivote rojo coincida exactamente con tu cóndilo femoral externo.',
    hotspots: [
      {
        id: 1,
        label: 'Profundidad de Respaldo',
        part_name: 'Palanca trasera de ajuste lumbar',
        top: '42%',
        left: '36%',
        biomechanical_purpose: 'Alinea el eje de rotación de la rodilla con el eje de la máquina.',
        pro_tip: 'Evita que la rodilla quede adelantada o retrasada respecto al eje circular rojo.'
      },
      {
        id: 2,
        label: 'Rodillo Tibial Inferior',
        part_name: 'Pasador amarillo en el brazo de palanca inferior',
        top: '74%',
        left: '62%',
        biomechanical_purpose: 'Ajusta la longitud de la palanca sobre la tibia para que no comprima la articulación del tobillo ni ruede sobre la espinilla.',
        pro_tip: 'Debe reposar 2 dedos por encima del empeine/maléolo externo del tobillo.'
      },
      {
        id: 3,
        label: 'Selector de Rango ROM / Leva',
        part_name: 'Pasador circular de inicio de recorrido en el eje',
        top: '48%',
        left: '52%',
        biomechanical_purpose: 'Determina el ángulo inicial de flexión de rodilla para proteger articulaciones sensibles.',
        pro_tip: 'Usa el punto #1 o #2 para rango completo si tienes rodillas sanas.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM SELECTION - SEATED LEG CURL (FEMORAL SENTADO)
  // ----------------------------------------------------
  technogym_selection_leg_curl: {
    curve_type: 'lengthened',
    curve_title: 'Pico en Zona Media con Gran Tensión en Elongación',
    rating: 9.8,
    match_summary: 'Superior al femoral tumbado para hipertrofia porque la flexión de cadera a 90° elonga los isquiosurales en su origen isquiático.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 92,
        level: 'Máxima Tensión (92%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Rodillas extendidas a 0° con cadera flexionada; isquiosurales bajo máxima tensión pasiva y activa.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 96,
        level: 'Pico de Fuerza Máximo (96%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Flexión a 45°-60°; momento de fuerza óptimo del bíceps femoral, semitendinoso y semimembranoso.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 68,
        level: 'Tensión Descendente (68%)',
        color: 'from-cyan-500 to-blue-400',
        cue: 'Flexión profunda de rodilla; desciende para compensar la insuficiencia activa de los isquios.'
      }
    ],
    lever_physics: 'Palanca con leva y fijación pélvica superior. Al estar sentado con la cadera a ~90°, los isquiosurales (músculos biarticulares excepto la cabeza corta del bíceps femoral) parten en una posición de mayor elongación en la curva longitud-tensión de Gordon-Huxley, generando mayor hipertrofia mediada por estiramiento.',
    pro_hack: 'Fija el rodillo superior sobre los muslos lo más apretado posible sin dolor. Si el fémur se levanta aunque sea 1 cm, perderás un 30% del estímulo en los isquiotibiales.',
    hotspots: [
      {
        id: 1,
        label: 'Almohadilla Fijadora de Muslos',
        part_name: 'Palanca de bloqueo superior sobre cuádriceps',
        top: '46%',
        left: '54%',
        biomechanical_purpose: 'Impide que los muslos se eleven durante la fase concéntrica, garantizando el aislamiento puro de los isquiosurales.',
        pro_tip: 'Bájala hasta que quede bien encajada contra los muslos antes de iniciar.'
      },
      {
        id: 2,
        label: 'Rodillo Inferior de Isquios',
        part_name: 'Rodillo acolchado sobre tendón de Aquiles',
        top: '72%',
        left: '64%',
        biomechanical_purpose: 'Alinea el contacto en la parte posterior distal de la pierna.',
        pro_tip: 'Colócalo justo sobre el tendón de Aquiles, 3 cm por encima de los talones.'
      },
      {
        id: 3,
        label: 'Respaldo & Eje de Pivote',
        part_name: 'Regulación de profundidad de respaldo lumbar',
        top: '40%',
        left: '36%',
        biomechanical_purpose: 'Alinea los cóndilos femorales con el eje circular de rotación de la máquina.',
        pro_tip: 'Mantén la espalda apoyada y agárrate con fuerza a los mangos laterales.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - HACK SQUAT
  // ----------------------------------------------------
  technogym_pure_hack_squat: {
    curve_type: 'lengthened',
    curve_title: 'Pico en Estiramiento Profundo (Sobrecarga Elongada en Cuádriceps)',
    rating: 9.8,
    match_summary: 'Sentadilla guiada a 45° con soporte dorsal completo que elimina la fatiga axial lumbar y aísla los extensores de rodilla.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 100,
        level: 'Pico Máximo Absoluto (100%)',
        color: 'from-emerald-500 to-green-400',
        cue: 'Fondo de la sentadilla (flexión de rodilla >110°); brazo de momento articular máximo de la rodilla con hipertrofia mediada por estiramiento.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 82,
        level: 'Tensión Alta (82%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Empuje con cuádriceps y glúteos en ángulo oblicuo de 45°.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 35,
        level: 'Tensión Muy Baja (35%)',
        color: 'from-blue-500 to-slate-400',
        cue: 'Extensión completa arriba; la carga pasa a los huesos y articulaciones en bloqueo.'
      }
    ],
    lever_physics: 'Guía lineal sobre raíles inclinados a 45°. La fuerza resistiva es F = m · g · sin(45°) más rozamiento. En la parte inferior, el brazo de momento interno de la rodilla (distancia del eje articular de la rodilla a la línea de fuerza) se multiplica, exigiendo el máximo par de fuerza a los cuádriceps.',
    pro_hack: 'Coloca los pies en la mitad inferior de la plataforma para permitir un desplazamiento tibial hacia adelante seguro sin despegar los talones. No bloquees las rodillas arriba para no perder la tensión continua.',
    hotspots: [
      {
        id: 1,
        label: 'Plataforma 45° Antideslizante',
        part_name: 'Plataforma amplia de apoyo de pies',
        top: '78%',
        left: '35%',
        biomechanical_purpose: 'Permite regular la posición de los pies para enfatizar cuádriceps (pies abajo) o glúteos e isquios (pies arriba).',
        pro_tip: 'Pies a la anchura de hombros con puntas ligeramente hacia afuera.'
      },
      {
        id: 2,
        label: 'Hombreras & Palancas de Desenganche',
        part_name: 'Almohadillas claviculares y palanca de seguridad',
        top: '32%',
        left: '64%',
        biomechanical_purpose: 'Transmite la fuerza axial de manera confortable y permite liberar el carro de rodadura con un giro de muñeca.',
        pro_tip: 'Empuja hacia arriba y gira las palancas hacia afuera para iniciar la serie.'
      },
      {
        id: 3,
        label: 'Tope Mecánico de Seguridad',
        part_name: 'Topes regulables de profundidad inferior',
        top: '62%',
        left: '46%',
        biomechanical_purpose: 'Evita que el carro baje más allá de tu rango activo si llegas al fallo muscular.',
        pro_tip: 'Fíjalo siempre a una altura inferior a tu máxima profundidad activa para no golpear.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - BELT SQUAT
  // ----------------------------------------------------
  technogym_pure_belt_squat: {
    curve_type: 'lengthened',
    curve_title: 'Sobrecarga en Estiramiento Profundo con Descarga Espinal',
    rating: 9.8,
    match_summary: 'Palanca a discos anclada a cinturón pélvico. Cero estrés axial en columna vertebral y máxima tensión en cuádriceps y glúteos en flexión profunda.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 95,
        level: 'Máxima Carga (95%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Sentadilla profunda por debajo de 90° con pelvis neutra y empuje vertical desde el mediopié.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 82,
        level: 'Tensión Fuerte (82%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Empuje simultáneo de cuádriceps sin tirar de las empuñaduras de seguridad.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 45,
        level: 'Aligeramiento Óptimo (45%)',
        color: 'from-cyan-500 to-blue-400',
        cue: 'Extensión completa de cadera con contracción de glúteos sin hiperextender la columna.'
      }
    ],
    lever_physics: 'Brazo de palanca con carga en péndulo inferior; par de resistencia máximo a 90° de flexión de rodilla coincidiendo con el pico de brazo de momento osteoarticular.',
    pro_hack: 'Usa la cadena en el eslabón intermedio para iniciar el movimiento con tensión sin flexión excesiva en frío y mantén las manos en el pasamanos solo para equilibrio.',
    hotspots: [
      { id: 1, label: '1', part_name: 'Cinturón Pélvico', top: '35%', left: '50%', biomechanical_purpose: 'Descarga axial completa' },
      { id: 2, label: '2', part_name: 'Plataforma Diamantada', top: '78%', left: '50%', biomechanical_purpose: 'Tracción antideslizante' },
      { id: 3, label: '3', part_name: 'Soportes de Discos', top: '55%', left: '75%', biomechanical_purpose: 'Carga libre' }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM SELECTION 900 - MULTI HIP
  // ----------------------------------------------------
  technogym_selection_multi_hip: {
    curve_type: 'mid_range',
    curve_title: 'Curva Isoinercial Regulable 360°',
    rating: 9.6,
    match_summary: 'Torre de placas con eje concéntrico/excéntrico regulable en 360° para extensión de cadera (glúteo), aducción y abducción guiada.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 75,
        level: 'Tensión Constante (75%)',
        color: 'from-blue-500 to-indigo-400',
        cue: 'Alinea el rodillo a la altura adecuada sobre el muslo o rodilla.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 95,
        level: 'Pico Máximo (95%)',
        color: 'from-indigo-500 to-purple-400',
        cue: 'Contrae con fuerza el glúteo mayor o aductores/abductores sin arquear la espalda lumbar.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 60,
        level: 'Tensión Suave (60%)',
        color: 'from-purple-500 to-pink-400',
        cue: 'Baja en 2 segundos controlando el peso de las placas.'
      }
    ],
    lever_physics: 'Leva excéntrica circular con eje de 360° que equilibra el brazo de momento en todo el arco de movimiento coxofemoral.',
    pro_hack: 'Alinea el centro del eje circular con la articulación de la cadera (trocánter mayor) para evitar compensaciones de la columna lumbar.',
    hotspots: [
      { id: 1, label: '1', part_name: 'Eje Giratorio 360°', top: '48%', left: '50%', biomechanical_purpose: 'Punto de partida anatómico regulable' },
      { id: 2, label: '2', part_name: 'Plataforma de Altura', top: '72%', left: '48%', biomechanical_purpose: 'Alineación de cadera' },
      { id: 3, label: '3', part_name: 'Torre de Placas Compacta', top: '35%', left: '80%', biomechanical_purpose: 'Carga guiada magnética' }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - LEG PRESS 45°
  // ----------------------------------------------------
  technogym_pure_leg_press: {
    curve_type: 'lengthened',
    curve_title: 'Pico en Estiramiento Profundo a 45°',
    rating: 9.7,
    match_summary: 'Prensa lineal de discos a 45° con respaldo regulable para evitar la retroversión pélvica ("butt wink").',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 98,
        level: 'Máxima Tensión (98%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Fondo de la prensa; flexión máxima de rodilla y cadera sin despegar el glúteo del asiento.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 80,
        level: 'Tensión Alta (80%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Pase por 90° de flexión; máximo reclutamiento simultáneo de vastos y glúteo mayor.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 40,
        level: 'Baja en Bloqueo (40%)',
        color: 'from-cyan-500 to-blue-400',
        cue: 'Casi extensión completa; mantén microflexión para no transferir la carga a los meniscos.'
      }
    ],
    lever_physics: 'Carro lineal a 45° con 4 puntos de apoyo en rodamientos sellados. En la posición baja, el momento de flexión en rodilla y cadera es máximo, demandando máxima fuerza contráctil concéntrica.',
    pro_hack: 'Regula el respaldo en una posición más reclinada si notas que se te redondea la espalda baja al bajar hondo. Mantén los glúteos pegados agarrándote fuerte a los manillares laterales.',
    hotspots: [
      {
        id: 1,
        label: 'Inclinación de Respaldo',
        part_name: 'Palanca de regulación de ángulo de respaldo',
        top: '58%',
        left: '32%',
        biomechanical_purpose: 'Modifica el ángulo del fémur con la pelvis; mayor inclinación permite mayor profundidad sin retroversión pélvica.',
        pro_tip: 'Punto #2 para personas con poca flexibilidad en isquios.'
      },
      {
        id: 2,
        label: 'Plataforma de Empuje 45°',
        part_name: 'Plataforma grande antideslizante con ángulo',
        top: '34%',
        left: '62%',
        biomechanical_purpose: 'Superficie de carga para distribuir la presión en toda la planta del pie.',
        pro_tip: 'Empuja empujando el suelo con el talón y el tercio medio del pie.'
      },
      {
        id: 3,
        label: 'Palancas de Seguridad y Desenganche',
        part_name: 'Mangos laterales con pasador de retención',
        top: '68%',
        left: '42%',
        biomechanical_purpose: 'Liberan y aseguran la plataforma con una sola mano.',
        pro_tip: 'Gira las palancas hacia afuera al iniciar y hacia adentro al terminar.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - STANDING ABDUCTOR (DE PIE A DISCOS)
  // ----------------------------------------------------
  technogym_pure_standing_abductor: {
    curve_type: 'shortened',
    curve_title: 'Pico en Acortamiento Máximo (Glúteo Medio & Tensor de Fascia Lata)',
    rating: 9.7,
    match_summary: 'Una de las máquinas más demandadas en biomecánica moderna: al realizarse de pie con la cadera en extensión/ligera flexión, activa al 100% las fibras superiores del glúteo medio y superior.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 55,
        level: 'Tensión Moderada (55%)',
        color: 'from-blue-500 to-cyan-400',
        cue: 'Piernas juntas; glúteo medio en posición neutra con palanca en ángulo cerrado.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 88,
        level: 'Tensión Alta (88%)',
        color: 'from-teal-500 to-emerald-400',
        cue: 'Abducción a 20°; el brazo de palanca de los discos se aproxima a la perpendicular contra el eje de giro.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 100,
        level: 'Pico Máximo Absoluto (100%)',
        color: 'from-emerald-500 to-green-400',
        cue: 'Abducción máxima a 35°-45°; palanca completamente horizontal. Congestión brutal en la porción superior y externa del glúteo.'
      }
    ],
    lever_physics: 'Palanca pendular lateral con eje de giro posterior bajo. A medida que las piernas se abren lateralmente, el portadiscos rota hacia la horizontal respecto a la gravedad, aumentando el brazo de momento de la carga de forma coincidente con la curva de activación del glúteo medio.',
    pro_hack: 'Inclina el torso ligeramente hacia adelante (~15°-20°) apoyándote en el manillar superior para alinear el plano de abducción con las fibras del glúteo medio y glúteo menor.',
    hotspots: [
      {
        id: 1,
        label: 'Almohadillas Laterales de Empuje',
        part_name: 'Cojines acolchados a la altura del muslo lateral',
        top: '54%',
        left: '52%',
        biomechanical_purpose: 'Transmiten la fuerza directamente al fémur distal sin forzar la articulación de la rodilla.',
        pro_tip: 'Colócalas justo por encima de las rodillas en la cara externa de los muslos.'
      },
      {
        id: 2,
        label: 'Apoyo Torácico Anterior & Manillar',
        part_name: 'Almohadilla frontal de torso y empuñaduras',
        top: '42%',
        left: '42%',
        biomechanical_purpose: 'Estabiliza la pelvis y el torso para evitar que el cuadrado lumbar compense la abducción.',
        pro_tip: 'Apoya el pecho con suavidad y sujeta los mangos con firmeza.'
      },
      {
        id: 3,
        label: 'Portadiscos & Eje de Giro',
        part_name: 'Cuernos de carga en el eje pendular posterior',
        top: '46%',
        left: '72%',
        biomechanical_purpose: 'Eje mecánico que modula la curva de resistencia mediante la rotación de los discos.',
        pro_tip: 'Carga discos del mismo tamaño en ambos lados para equilibrar el centro de gravedad.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - STANDING LEG CURL (FEMORAL DE PIE)
  // ----------------------------------------------------
  technogym_pure_standing_leg_curl: {
    curve_type: 'shortened',
    curve_title: 'Pico en Contracción Máxima (Unilateral Isquiotibial)',
    rating: 9.6,
    match_summary: 'Aislamiento unilateral estricto para corregir asimetrías de fuerza entre bíceps femoral izquierdo y derecho.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 60,
        level: 'Tensión Media (60%)',
        color: 'from-blue-500 to-cyan-400',
        cue: 'Pierna extendida en la vertical; los isquiosurales están elongados en la articulación de la rodilla.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 92,
        level: 'Tensión Alta (92%)',
        color: 'from-teal-500 to-emerald-400',
        cue: 'Flexión de rodilla a 60°; momento de fuerza perpendicular entre la palanca y la gravedad.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 98,
        level: 'Pico de Tensión Máximo (98%)',
        color: 'from-emerald-500 to-green-400',
        cue: 'Talón cerca del glúteo; pico de acortamiento con máxima activación de la cabeza corta del bíceps femoral.'
      }
    ],
    lever_physics: 'Palanca de primer grado con pivote superior y rodillo inferior. Al realizarse de pie con la pierna de apoyo fija, anula la compensación de la espalda baja y permite que la cabeza corta del bíceps femoral (monoarticular) alcance su máximo potencial contráctil.',
    pro_hack: 'Mantén el tobillo en dorsiflexión (puntas hacia la espinilla) durante la subida para inhibir parcialmente los gemelos y obligar a los isquios a realizar el 100% del trabajo.',
    hotspots: [
      {
        id: 1,
        label: 'Rodillo Posterior de Talón',
        part_name: 'Cilindro acolchado regulable para tendón de Aquiles',
        top: '72%',
        left: '48%',
        biomechanical_purpose: 'Ajusta la longitud de palanca a la altura de tu tibia.',
        pro_tip: 'Regúlalo para que descanse justo por encima de tu talón de Aquiles.'
      },
      {
        id: 2,
        label: 'Apoyo Anterior de Muslo',
        part_name: 'Cojín frontal de cuádriceps',
        top: '52%',
        left: '44%',
        biomechanical_purpose: 'Fija el fémur de la pierna activa para que la rodilla no se adelante durante la flexión.',
        pro_tip: 'Presiona el muslo contra el cojín durante toda la fase concéntrica.'
      },
      {
        id: 3,
        label: 'Empuñaduras de Estabilización',
        part_name: 'Mangos superiores de sujeción',
        top: '32%',
        left: '42%',
        biomechanical_purpose: 'Permiten sujetar el tren superior para anclar la pelvis neutra.',
        pro_tip: 'Agarra con fuerza para evitar que la cadera rote lateralmente.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - HIP THRUST
  // ----------------------------------------------------
  technogym_pure_hip_thrust: {
    curve_type: 'shortened',
    curve_title: 'Pico en Acortamiento Máximo (Puente de Glúteo a Discos)',
    rating: 9.8,
    match_summary: 'La referencia mundial para glúteo mayor: máxima tensión en la extensión completa de cadera, justo donde el glúteo genera su mayor torque.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 50,
        level: 'Tensión Moderada (50%)',
        color: 'from-blue-500 to-cyan-400',
        cue: 'Cadera en flexión profunda abajo; la palanca está inclinada con brazo de momento reducido.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 82,
        level: 'Tensión Alta (82%)',
        color: 'from-teal-500 to-emerald-400',
        cue: 'Elevación de pelvis a través de los talones; reclutamiento acelerado de fibras de glúteo e isquios.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 100,
        level: 'Pico Máximo Absoluto (100%)',
        color: 'from-emerald-500 to-green-400',
        cue: 'Extensión completa de cadera (bloqueo en puente a 180°); palanca perfectamente horizontal contra la gravedad. Máxima activación electromiográfica (EMG).'
      }
    ],
    lever_physics: 'Brazo de palanca angular con pivote trasero y rodillo acolchado sobre la cresta ilíaca. La curva de resistencia mecánica coincide de manera perfecta con la curva de fuerza del glúteo mayor, que es máxima en los últimos 15° de extensión de cadera.',
    pro_hack: 'Mantén la barbilla pegada al pecho (mirando hacia adelante, no al techo) y haz una retroversión pélvica al llegar arriba ("apretar glúteo"), aguantando 1 segundo en el pico.',
    hotspots: [
      {
        id: 1,
        label: 'Rodillo Acolchado Pélvico',
        part_name: 'Rodillo giratorio de alta densidad con cierre de seguridad',
        top: '52%',
        left: '50%',
        biomechanical_purpose: 'Distribuye la carga sobre las espinas ilíacas sin dolor ni hematomas, sustituyendo a la incómoda barra olímpica.',
        pro_tip: 'Colócalo en el pliegue de la cadera justo debajo de las crestas ilíacas.'
      },
      {
        id: 2,
        label: 'Plataforma Inclinada de Pies',
        part_name: 'Base texturizada antideslizante con inclinación',
        top: '68%',
        left: '38%',
        biomechanical_purpose: 'Permite regular la distancia de los pies para que las tibias queden a 90° exactos en el punto alto.',
        pro_tip: 'Si sientes demasiado cuádriceps, adelanta los pies 3 cm; si sientes demasiado isquio, retrásalos.'
      },
      {
        id: 3,
        label: 'Banco Escapular Pivotante',
        part_name: 'Respaldo superior acolchado con eje rotativo',
        top: '48%',
        left: '64%',
        biomechanical_purpose: 'Acompaña la rotación del torso para no arquear la columna cervical ni lumbar.',
        pro_tip: 'Apoya el tercio inferior de tus escápulas en el borde superior del banco.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - SHOULDER PRESS
  // ----------------------------------------------------
  technogym_pure_shoulder_press: {
    curve_type: 'lengthened',
    curve_title: 'Pico en Estiramiento con Alivio Acromial Superior',
    rating: 9.5,
    match_summary: 'Empuje vertical convergente que respeta el ritmo escapulohumeral y reduce el pinzamiento del supraespinoso.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 94,
        level: 'Máxima Tensión (94%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Manos a nivel de orejas/barbilla; máxima carga excéntrica en deltoides anterior y lateral.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 85,
        level: 'Tensión Alta (85%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Extensión media del codo en plano escapular a 30°.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 52,
        level: 'Tensión Moderada-Baja (52%)',
        color: 'from-cyan-500 to-blue-400',
        cue: 'Convergencia por encima de la cabeza; reduce la compresión en la articulación del hombro.'
      }
    ],
    lever_physics: 'Palancas iso-laterales convergentes con pivote bajo posterior. A diferencia del press militar con barra recta donde la barra debe rodear la cabeza forzando hiperextensión cervical, las palancas se desplazan en trayectoria curvilínea natural.',
    pro_hack: 'Utiliza el agarre neutro si tienes antecedentes de molestias en el manguito rotador o el agarre prono abierto para mayor foco en deltoides lateral.',
    hotspots: [
      {
        id: 1,
        label: 'Regulación de Asiento',
        part_name: 'Pasador amarillo de sillín',
        top: '68%',
        left: '44%',
        biomechanical_purpose: 'Ajusta la altura para que las asas no desciendan por debajo de la altura de la clavícula.',
        pro_tip: 'No dejes que los codos bajen demasiado para no someter a estrés el manguito.'
      },
      {
        id: 2,
        label: 'Pedal de Precarga',
        part_name: 'Pedal de pie frontal',
        top: '84%',
        left: '48%',
        biomechanical_purpose: 'Eleva las empuñaduras para iniciar la serie con los hombros en posición cómoda.',
        pro_tip: 'Písalo antes de colocar las manos y suéltalo con suavidad.'
      },
      {
        id: 3,
        label: 'Empuñaduras Duales Convergentes',
        part_name: 'Asas con agarre prono y neutro cerrado',
        top: '35%',
        left: '54%',
        biomechanical_purpose: 'Facilita la trayectoria convergente en el plano escapular.',
        pro_tip: 'Mantén las muñecas rígidas y empuja alineando antebrazos con los mangos.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM PURE STRENGTH - LATERAL RAISE (ELEVACIONES LATERALES)
  // ----------------------------------------------------
  technogym_pure_lateral_raise: {
    curve_type: 'shortened',
    curve_title: 'Pico en Acortamiento Máximo (Deltoides Lateral Puro)',
    rating: 9.8,
    match_summary: 'Incomparablemente superior a las mancuernas tradicionales: tensión constante y pico de sobrecarga justo cuando el deltoides lateral está a 90° de abducción.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 55,
        level: 'Tensión Media (55%)',
        color: 'from-blue-500 to-cyan-400',
        cue: 'Codos pegados al cuerpo; no hay "punto muerto" sin resistencia como ocurre con mancuernas.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 90,
        level: 'Tensión Alta (90%)',
        color: 'from-teal-500 to-emerald-400',
        cue: 'Elevación de codos a 45°; reclutamiento explosivo de las fibras acromiales del deltoides.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 100,
        level: 'Pico Máximo de Tensión (100%)',
        color: 'from-emerald-500 to-green-400',
        cue: 'Codos a 90° respecto al torso; palancas horizontales contra la gravedad. Máxima congestión muscular.'
      }
    ],
    lever_physics: 'Palancas de apoyo en codos con eje rotativo concéntrico a la articulación glenohumeral. Al aplicar la fuerza en el codo (antebrazo libre), se elimina por completo la implicación de los antebrazos y muñecas y se reduce a cero el momento de inercia parásito de las mancuernas.',
    pro_hack: 'No intentes levantar con las manos: relaja las muñecas y concéntrate únicamente en empujar las almohadillas con la cara externa de los codos hacia las paredes laterales.',
    hotspots: [
      {
        id: 1,
        label: 'Ajuste de Altura de Sillín',
        part_name: 'Pasador de asiento',
        top: '65%',
        left: '46%',
        biomechanical_purpose: 'Alinea la articulación del hombro con el eje de rotación de las levas laterales.',
        pro_tip: 'Regula de modo que las almohadillas queden apoyadas exactamente sobre tus codos.'
      },
      {
        id: 2,
        label: 'Almohadillas de Codos',
        part_name: 'Cojines acolchados basculantes de presión',
        top: '46%',
        left: '54%',
        biomechanical_purpose: 'Punto de contacto directo para transmitir el par de torsión sin palanca distal.',
        pro_tip: 'Apoya el codo firmemente; no es necesario apretar las empuñaduras con los dedos.'
      },
      {
        id: 3,
        label: 'Apoyo Torácico Estabilizador',
        part_name: 'Cojín de esternón anterior',
        top: '52%',
        left: '42%',
        biomechanical_purpose: 'Inmoviliza el tronco para que no se use impulso o balanceo lumbar en las repeticiones pesadas.',
        pro_tip: 'Mantén el pecho en contacto en todo momento.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM SELECTION - ADDUCTOR (CERRAR PIERNAS)
  // ----------------------------------------------------
  technogym_selection_adductor: {
    curve_type: 'mid_range',
    curve_title: 'Pico en Zona Media con Gran Resistencia en Acortamiento',
    rating: 9.5,
    match_summary: 'Aislamiento seguro para el aductor mayor, largo y grácil con palancas circulares y leva de compensación.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 85,
        level: 'Tensión Alta (85%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Piernas abiertas; máximo estiramiento de aductores bajo tensión controlada.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 95,
        level: 'Pico Máximo de Tensión (95%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Cierre de rodillas hacia el plano medio; momento de fuerza óptimo de los aductores mediales.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 75,
        level: 'Tensión Alta (75%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Rodillas juntas en el centro; pausa isométrica para reclutamiento neuromuscular.'
      }
    ],
    lever_physics: 'Leva de placas que proporciona resistencia fluida mediante poleas desmultiplicadas. Permite ajustar el ángulo de inicio para no someter a distensión el tendón del aductor en frío.',
    pro_hack: 'Controla 3 segundos la apertura; nunca permitas que el carro de placas choque al volver.',
    hotspots: [
      {
        id: 1,
        label: 'Almohadillas Mediales de Rodilla',
        part_name: 'Cojines en cara interna de piernas',
        top: '58%',
        left: '52%',
        biomechanical_purpose: 'Punto de empuje sobre el cóndilo medial del fémur.',
        pro_tip: 'Gira las almohadillas para que queden cómodas en la cara interna de tu pierna.'
      },
      {
        id: 2,
        label: 'Palanca de Amplitud de Inicio',
        part_name: 'Pasador amarillo de rango ROM',
        top: '50%',
        left: '48%',
        biomechanical_purpose: 'Determina cuánta apertura tienen las piernas al iniciar la serie.',
        pro_tip: 'Elige un punto donde sientas estiramiento confortable sin sensación de tirón articular.'
      },
      {
        id: 3,
        label: 'Torre de Placas & Selector',
        part_name: 'Clavija magnética de placas',
        top: '38%',
        left: '72%',
        biomechanical_purpose: 'Permite microprogresiones precisas de 2.5 kg y 5 kg.',
        pro_tip: 'Comprueba que el pasador esté bien introducido antes de comenzar.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM SELECTION - ABDUCTOR (ABRIR PIERNAS)
  // ----------------------------------------------------
  technogym_selection_abductor: {
    curve_type: 'shortened',
    curve_title: 'Pico en Acortamiento Máximo (Glúteo Medio & Menor)',
    rating: 9.6,
    match_summary: 'Aislamiento sentado de glúteo medio y tensor de la fascia lata con apoyo pélvico lumbar.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 65,
        level: 'Tensión Media-Alta (65%)',
        color: 'from-blue-500 to-teal-400',
        cue: 'Rodillas juntas en el centro; el glúteo medio se elonga de forma segura.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 90,
        level: 'Tensión Alta (90%)',
        color: 'from-teal-500 to-emerald-400',
        cue: 'Apertura hacia el exterior; resistencia en aumento armónico.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 100,
        level: 'Pico Máximo de Tensión (100%)',
        color: 'from-emerald-500 to-green-400',
        cue: 'Apertura completa de rodillas; máxima contracción isométrica del glúteo medio.'
      }
    ],
    lever_physics: 'Leva concéntrica que ofrece una curva de resistencia suave con pico en contracción externa.',
    pro_hack: 'Prueba inclinarte hacia adelante con la espalda recta agarrando los manillares frontales para aumentar el brazo de palanca del glúteo superior.',
    hotspots: [
      {
        id: 1,
        label: 'Almohadillas Laterales de Rodilla',
        part_name: 'Cojines en cara externa de muslos',
        top: '56%',
        left: '52%',
        biomechanical_purpose: 'Transmiten la fuerza de abducción desde la rodilla sin forzar la articulación femorotibial.',
        pro_tip: 'Ajusta la posición para que no resbale sobre el muslo.'
      },
      {
        id: 2,
        label: 'Pasador de Rango de Apertura',
        part_name: 'Palanca amarilla de ajuste de ángulo',
        top: '50%',
        left: '48%',
        biomechanical_purpose: 'Configura la posición inicial de partida con rodillas juntas.',
        pro_tip: 'Empieza con las almohadillas casi tocándose en el centro.'
      },
      {
        id: 3,
        label: 'Respaldo Lumbar Ergonómico',
        part_name: 'Asiento anatómico con inclinación dorsal',
        top: '42%',
        left: '36%',
        biomechanical_purpose: 'Mantiene la pelvis anclada para evitar torsión sacra durante el empuje.',
        pro_tip: 'Mantén la pelvis firme sin deslizarte hacia adelante.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM SELECTION - PEC DECK & REVERSE FLY
  // ----------------------------------------------------
  technogym_selection_pec_deck_reverse_fly: {
    curve_type: 'shortened',
    curve_title: 'Pico en Acortamiento (Aducción Horizontal de Pectoral / Pájaros)',
    rating: 9.7,
    match_summary: 'Máquina dual: como Pec Deck ofrece máxima tensión en el cierre esternal; como Reverse Fly aísla deltoides posterior y romboides.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 80,
        level: 'Tensión Alta (80%)',
        color: 'from-blue-500 to-teal-400',
        cue: 'Brazos abiertos en cruz con codos semiextendidos; estiramiento controlado del pectoral mayor.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 95,
        level: 'Pico de Tensión (95%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Aducción horizontal hacia el frente; máxima tensión sostenida.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 95,
        level: 'Pico Máximo de Tensión (95%)',
        color: 'from-emerald-500 to-green-400',
        cue: 'Manos casi en contacto al frente; máxima contracción concéntrica sin perder tensión (a diferencia de aperturas con mancuernas).'
      }
    ],
    lever_physics: 'Brazos de palanca giratorios articulados conectados a leva de doble polea. La dirección de tiro del cable se mantiene perpendicular al antebrazo durante todo el recorrido.',
    pro_hack: 'Mantén una microflexión fija de 15° en los codos y concéntrate en juntar la cara interna de los bíceps delante del pecho.',
    hotspots: [
      {
        id: 1,
        label: 'Ajuste de Altura de Asiento',
        part_name: 'Pasador de elevación del sillín',
        top: '68%',
        left: '44%',
        biomechanical_purpose: 'Alinea los hombros con el eje horizontal de las empuñaduras.',
        pro_tip: 'Las empuñaduras deben coincidir con la parte media del pecho.'
      },
      {
        id: 2,
        label: 'Pasadores Superiores de Ángulo ROM',
        part_name: 'Pasadores amarillos en la parte alta de cada brazo',
        top: '32%',
        left: '54%',
        biomechanical_purpose: 'Permiten cambiar la máquina entre Pec Deck (empuje anterior) y Pájaros (aperturas posteriores).',
        pro_tip: 'Para pecho colócalo en los puntos traseros #3-#5; para deltoides posterior en los puntos frontales #1-#2.'
      },
      {
        id: 3,
        label: 'Empuñaduras Ergonómicas Duales',
        part_name: 'Mangos de agarre vertical y horizontal',
        top: '42%',
        left: '60%',
        biomechanical_purpose: 'Proporcionan libertad de agarre según la anatomía de tu muñeca.',
        pro_tip: 'Usa el agarre vertical neutro para menor tensión en la muñeca.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM SELECTION - ARM CURL (PREDICADOR BÍCEPS)
  // ----------------------------------------------------
  technogym_selection_arm_curl: {
    curve_type: 'lengthened',
    curve_title: 'Pico en Estiramiento Profundo (Banco Scott Guiado)',
    rating: 9.6,
    match_summary: 'Banco predicador biomecánico con leva: máxima tensión en la primera mitad del recorrido donde el bíceps tiene mayor brazo de momento.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 96,
        level: 'Pico Máximo de Tensión (96%)',
        color: 'from-emerald-500 to-green-400',
        cue: 'Codos extendidos en banco a 45°; máxima tensión en la inserción distal del bíceps braquial.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 82,
        level: 'Tensión Alta (82%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Flexión a 90°; palanca perpendicular al cable con excelente estímulo contráctil.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 45,
        level: 'Tensión Descendente (45%)',
        color: 'from-blue-500 to-slate-400',
        cue: 'Codos completamente doblados; el antebrazo se aproxima a la vertical aliviando tensión articular.'
      }
    ],
    lever_physics: 'Brazo de palanca angular apoyado en atril Scott inclinado a 45°-50°. El hombro se mantiene fijado en flexión anterior, lo que acorta la cabeza larga en el origen y sobrecarga preferentemente la cabeza corta y el braquial anterior en la porción elongada.',
    pro_hack: 'No despegues los codos del atril en ningún momento. Controla la bajada en 3 segundos y frena 1 cm antes de la hiperextensión articular completa.',
    hotspots: [
      {
        id: 1,
        label: 'Ajuste de Altura de Sillín',
        part_name: 'Pasador de sillín',
        top: '68%',
        left: '36%',
        biomechanical_purpose: 'Alinea los codos con el eje rotatorio de la leva sin encorvar la columna cervical.',
        pro_tip: 'Las axilas deben quedar cómodamente encajadas en la parte superior del atril.'
      },
      {
        id: 2,
        label: 'Atril Acolchado Inclinado (Scott)',
        part_name: 'Almohadilla en ángulo de 45°',
        top: '48%',
        left: '48%',
        biomechanical_purpose: 'Inmoviliza el húmero anulando el impulso del deltoides anterior.',
        pro_tip: 'Mantén todo el tríceps apoyado en el acolchado durante la serie.'
      },
      {
        id: 3,
        label: 'Manillar Giratorio con Leva',
        part_name: 'Empuñaduras con articulación libre y cable',
        top: '52%',
        left: '62%',
        biomechanical_purpose: 'Permite que la muñeca rote naturalmente sin estrés en el túnel carpiano.',
        pro_tip: 'Agarra con las palmas mirando hacia arriba (supinación completa).'
      }
    ]
  },


  // ----------------------------------------------------
  // TECHNOGYM SELECTION 900 - CHEST PRESS (PLACAS)
  // ----------------------------------------------------
  technogym_selection_chest_press: {
    curve_type: 'mid_range',
    curve_title: 'Perfil Guiado por Leva - Tensión Uniforme y Suave',
    rating: 9.5,
    match_summary: 'Prensa horizontal de pecho con torre de placas y pedal de asistencia al inicio (Easy Start) para proteger el hombro en la fase de desacoplamiento.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 88,
        level: 'Tensión Segura Asistida (88%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Inicia el despegue usando el pedal de pie amarillo para no forzar la cápsula articular anterior.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 94,
        level: 'Pico de Carga Efectiva (94%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Momento de fuerza máximo a 90° de flexión de codo; empuje potente con escápulas retraídas.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 85,
        level: 'Tensión Continua por Cable (85%)',
        color: 'from-cyan-500 to-blue-400',
        cue: 'Casi extensión completa; la polea mantiene la resistencia constante sin puntos muertos.'
      }
    ],
    lever_physics: 'Sistema de levas elípticas conectadas a torre de placas mediante poleas desmultiplicadoras. Reduce la inercia inicial y asegura que la curva de resistencia acompañe la capacidad de fuerza del músculo a lo largo del ROM.',
    pro_hack: 'Hack Biomecánico Pro: Pisa firmemente el pedal Easy Start con el talón antes de sujetar las empuñaduras. Una vez en posición y con las escápulas compactadas contra el respaldo, suelta suavemente el pedal para iniciar la serie con cero estrés en el bíceps braquial o manguito.',
    hotspots: [
      {
        id: 1,
        label: 'Ajuste de Altura de Sillín',
        part_name: 'Pasador telescópico amarillo',
        top: '64%',
        left: '42%',
        biomechanical_purpose: 'Alinea los mangos con la línea del pezón (haz esternal del pectoral mayor).',
        pro_tip: 'Regula de modo que los codos queden a unos 45°-60° de abducción respecto al costado.'
      },
      {
        id: 2,
        label: 'Pedal Asistente de Inicio (Easy Start)',
        part_name: 'Pedal de pie articulado',
        top: '84%',
        left: '48%',
        biomechanical_purpose: 'Adelanta las empuñaduras ~15 cm para entrar y salir del ejercicio sin hiperextender el hombro.',
        pro_tip: 'Pisa a fondo para tomar el agarre y al terminar para soltar el peso.'
      },
      {
        id: 3,
        label: 'Empuñaduras Ergonómicas Duales',
        part_name: 'Mangos para agarre neutro y prono',
        top: '42%',
        left: '55%',
        biomechanical_purpose: 'Permiten variar entre agarre prono tradicional o agarre neutro para menor tensión acromioclavicular.',
        pro_tip: 'El agarre neutro es ideal si tienes molestias previas de hombro.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM SELECTION 900 - WIDE ROW (REMO ABIERTO PLACAS)
  // ----------------------------------------------------
  technogym_selection_wide_row: {
    curve_type: 'shortened',
    curve_title: 'Pico en Retracción Escapular y Aducción Horizontal',
    rating: 9.6,
    match_summary: 'Remo sentado de placas con empuñaduras abiertas convergentes para sobrecarga focalizada en deltoides posterior, romboides y trapecio medio.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 70,
        level: 'Tensión Moderada en Protracción (70%)',
        color: 'from-blue-500 to-teal-400',
        cue: 'Permite que las escápulas se separen controladamente abrazando el soporte pectoral.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 88,
        level: 'Tensión Creciente (88%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Conduce los codos hacia afuera en un ángulo de 60°-75° respecto al torso.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 98,
        level: 'Pico de Contracción Máximo (98%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Junta con fuerza las escápulas atrás sin arquear la columna lumbar.'
      }
    ],
    lever_physics: 'Brazo de palanca con trayectoria divergente/abierta hacia el plano frontal. Maximiza el brazo de momento para el plano de los retractores escapulares y aductores horizontales de hombro.',
    pro_hack: 'Hack Biomecánico Pro: No uses agarre cerrado; toma las empuñaduras anchas horizontales y piensa en separar los codos hacia las paredes laterales en vez de tirar hacia el abdomen.',
    hotspots: [
      {
        id: 1,
        label: 'Regulación de Altura de Sillín',
        part_name: 'Pasador de asiento neumático',
        top: '64%',
        left: '38%',
        biomechanical_purpose: 'Determina el ángulo de los codos; los brazos deben tirar en un plano a 60°-75° del torso.',
        pro_tip: 'Siéntate lo bastante bajo como para tirar hacia el esternón alto.'
      },
      {
        id: 2,
        label: 'Soporte Pectoral Regulable',
        part_name: 'Almohadilla torácica delantera',
        top: '46%',
        left: '49%',
        biomechanical_purpose: 'Estabiliza el torso y aísla la cintura escapular evitando el tirón con la columna lumbar.',
        pro_tip: 'Ajusta para permitir estiramiento escapular completo sin despegar el pecho.'
      },
      {
        id: 3,
        label: 'Empuñaduras Anchas Multigrip',
        part_name: 'Mangos horizontales y semi-pronos',
        top: '38%',
        left: '58%',
        biomechanical_purpose: 'Facilitan la tracción con codos abiertos para aislar el trapecio medio y deltoides posterior.',
        pro_tip: 'Evita muñequear al final del recorrido.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM SELECTION / BIOSTRENGTH - HIP THRUST (PLACAS)
  // ----------------------------------------------------
  technogym_selection_hip_thrust: {
    curve_type: 'shortened',
    curve_title: 'Pico Terminal en Extensión Completa de Cadera',
    rating: 9.8,
    match_summary: 'Máquina de empuje de cadera con torre de placas y rodillo/cinturón acolchado con palanca de fijación rápida para máximo estímulo en glúteo mayor.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 65,
        level: 'Tensión Inicial Estable (65%)',
        color: 'from-blue-500 to-teal-400',
        cue: 'Cadera en flexión profunda; apoya la columna dorsal firmemente en el respaldo pivotante.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 85,
        level: 'Tensión Progresiva (85%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Empuja emparejando la fuerza con los talones manteniendo las rodillas alineadas.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 100,
        level: 'Máxima Tensión Mecánica (100%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Bloqueo horizontal completo de pelvis en retroversión; contracción máxima de glúteo mayor.'
      }
    ],
    lever_physics: 'Palanca circular pivotante con leva compensadora de carga de placas. Genera su pico de par resistente en los últimos 15° de extensión de cadera, haciendo coincidir la curva de carga con el pico de acortamiento del glúteo mayor.',
    pro_hack: 'Hack Biomecánico Pro: Mantén la barbilla pegada al pecho (mirada al frente o a las rodillas) durante todo el ascenso para bloquear la extensión lumbar y dirigir el 100% del estímulo a las fibras del glúteo.',
    hotspots: [
      {
        id: 1,
        label: 'Cojín Pélvico Acolchado / Rodillo',
        part_name: 'Rodillo cilíndrico de soporte pélvico',
        top: '46%',
        left: '52%',
        biomechanical_purpose: 'Transfiere la fuerza sobre la sínfisis púbica y espinas ilíacas sin dolor ni hematomas.',
        pro_tip: 'Ajusta el trinquete para que quede firmemente ceñido antes de empujar.'
      },
      {
        id: 2,
        label: 'Plataforma Inclinada de Apoyo Plantar',
        part_name: 'Base con estrías antideslizantes',
        top: '68%',
        left: '38%',
        biomechanical_purpose: 'Garantiza un ángulo de 90° entre tibia y muslo en el pico de contracción alta.',
        pro_tip: 'Coloca los talones al ancho de hombros con ligera rotación externa (15°).'
      },
      {
        id: 3,
        label: 'Respaldo Torácico Basculante',
        part_name: 'Almohadilla escapular autoajustable',
        top: '48%',
        left: '66%',
        biomechanical_purpose: 'Pivota acompañando la rotación de la columna torácica sin generar fricción en la espalda.',
        pro_tip: 'Apoya el borde inferior de las escápulas justo sobre el borde del acolchado.'
      }
    ]
  },

  // ----------------------------------------------------
  // TECHNOGYM SELECTION 900 - SEATED DIP / TRICEPS PRESS (PLACAS)
  // ----------------------------------------------------
  technogym_selection_seated_dip: {
    curve_type: 'shortened',
    curve_title: 'Pico en Extensión Terminal de Codo (Bloqueo Tríceps)',
    rating: 9.6,
    match_summary: 'Fondos en máquina de placas con cinturón de sujeción que permite mover cargas supramáximas sin despegar los glúteos del asiento.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 72,
        level: 'Tensión Controlada a 90° (72%)',
        color: 'from-blue-500 to-teal-400',
        cue: 'Codos flexionados a 90°; mantén los hombros deprimidos para proteger el ligamento coracoacromial.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 90,
        level: 'Tensión Elevada (90%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Empuje hacia abajo manteniendo los codos pegados a los costados.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 98,
        level: 'Pico Máximo en Extensión (98%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Extensión completa de codo con bloqueo de tríceps lateral y medial sostenido 1 segundo.'
      }
    ],
    lever_physics: 'Palanca paralela descendente con leva que incrementa la resistencia al final de la carrera, adaptándose al aumento de brazo de momento del tríceps sobre el olécranon durante la extensión.',
    pro_hack: 'Hack Biomecánico Pro: Ajusta el cinturón de seguridad bien tenso sobre las caderas. Si mantienes el torso 100% vertical, el tríceps asume el 90% del trabajo; si te inclinas hacia adelante, transferirás parte de la carga al pectoral menor.',
    hotspots: [
      {
        id: 1,
        label: 'Cinturón de Retención Pélvico',
        part_name: 'Cinturón con cierre de alta seguridad',
        top: '56%',
        left: '46%',
        biomechanical_purpose: 'Evita que el cuerpo se eleve al empujar cargas superiores al propio peso corporal.',
        pro_tip: 'Abróchalo y ténsalo antes de iniciar la serie.'
      },
      {
        id: 2,
        label: 'Regulación de Asiento',
        part_name: 'Palanca amarilla de ajuste de altura',
        top: '68%',
        left: '42%',
        biomechanical_purpose: 'Alinea los mangos al nivel de la cadera para iniciar el movimiento con codos a 90° exactos.',
        pro_tip: 'No dejes que los codos suban por encima del nivel del hombro.'
      },
      {
        id: 3,
        label: 'Empuñaduras Giratorias (Estrecho/Ancho)',
        part_name: 'Mangos paralelos rotatorios',
        top: '48%',
        left: '54%',
        biomechanical_purpose: 'Gira las empuñaduras hacia adentro para enfatizar tríceps braquial o hacia afuera para involucrar pectoral.',
        pro_tip: 'Posición estrecha recomendada para tríceps puro.'
      }
    ]
  },
  // ----------------------------------------------------
  // HAMMER STRENGTH - ISO-LATERAL FRONT LAT PULLDOWN
  // ----------------------------------------------------
  hammer_iso_front_lat_pulldown: {
    curve_type: 'mid_range',
    curve_title: 'Pico en Zona Media con Gran Convergencia en Acortamiento',
    rating: 9.8,
    match_summary: 'Una de las máquinas más icónicas de Hammer Strength: trayectoria convergente natural que respeta la línea anatómica del dorsal ancho.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 75,
        level: 'Tensión Media-Alta (75%)',
        color: 'from-blue-500 to-teal-400',
        cue: 'Brazos arriba en ángulo abierto; estiramiento completo con elevación y rotación superior de la escápula.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 98,
        level: 'Pico Máximo de Tensión (98%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Paso por 90° de codo; momento de inercia y torque máximo de la palanca de discos.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 85,
        level: 'Alta Tensión Sostenida (85%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Codos encajados en las costillas; las empuñaduras convergen permitiendo la máxima contracción del dorsal.'
      }
    ],
    lever_physics: 'Palancas iso-laterales de 2º grado con movimiento convergente patentado por Hammer Strength. A medida que las empuñaduras bajan, se aproximan entre sí, siguiendo exactamente el vector de aducción del húmero hacia la fascia toracolumbar.',
    pro_hack: 'Prueba a entrenarla de forma unilateral (un solo brazo cada vez), inclinando el torso 10° hacia el lado activo para conseguir un acortamiento extremo de las fibras ilíacas del dorsal.',
    hotspots: [
      {
        id: 1,
        label: 'Altura de Sillín',
        part_name: 'Pasador de asiento con muelle',
        top: '66%',
        left: '48%',
        biomechanical_purpose: 'Determina el rango de estiramiento arriba para no tener que ponerse de pie para alcanzar las barras.',
        pro_tip: 'Regula para que alcances las asas estirando completamente los brazos desde sentado.'
      },
      {
        id: 2,
        label: 'Cilindros de Retención de Muslos',
        part_name: 'Rodillos acolchados regulables',
        top: '52%',
        left: '48%',
        biomechanical_purpose: 'Fijan los fémures para que la carga no levante el cuerpo del asiento en series pesadas.',
        pro_tip: 'Fíjalos firmes contra los cuádriceps sin holgura.'
      },
      {
        id: 3,
        label: 'Palancas Iso-Laterales Convergentes',
        part_name: 'Brazos de palanca independientes con empuñaduras neutras',
        top: '20%',
        left: '54%',
        biomechanical_purpose: 'Permiten que cada brazo trabaje de forma 100% independiente con trayectoria en arco convergente.',
        pro_tip: 'Conduce el codo directamente hacia el bolsillo trasero de tu pantalón.'
      }
    ]
  },

  // ----------------------------------------------------
  // HAMMER STRENGTH - ISO-LATERAL LOW ROW
  // ----------------------------------------------------
  hammer_iso_low_row: {
    curve_type: 'mid_range',
    curve_title: 'Pico en Zona Media con Gran Brazo de Momento',
    rating: 9.7,
    match_summary: 'Referencia absoluta para dorsal y grosor de espalda: trayectoria diagonal baja-alta con soporte pectoral completo.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 90,
        level: 'Tensión Alta (90%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Brazos estirados al frente; protracción escapular máxima con tensión en toda la cadena dorsal.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 96,
        level: 'Pico Máximo de Tensión (96%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Codos pasando el torso; brazo de momento perpendicular al eje de palanca.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 65,
        level: 'Media-Alta (65%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Bloqueo escapular completo; la ligera elevación de la palanca alivia el esfuerzo en el final.'
      }
    ],
    lever_physics: 'Palancas divergentes independientes con eje inferior. La trayectoria sigue la línea de los codos hacia atrás y abajo, activando con máxima intensidad el dorsal ancho y redondo mayor.',
    pro_hack: 'Mantén el pecho bien pegado al cojín. Si te despegas para tirar con la inercia del torso, perderás la tensión en el dorsal y sobrecargarás la columna lumbar.',
    hotspots: [
      {
        id: 1,
        label: 'Regulación de Asiento',
        part_name: 'Pasador de altura del sillín',
        top: '64%',
        left: '38%',
        biomechanical_purpose: 'Ubica el pecho a la altura adecuada del soporte esternal.',
        pro_tip: 'El esternón debe descansar sobre el centro del cojín.'
      },
      {
        id: 2,
        label: 'Apoyo Torácico Pectoral',
        part_name: 'Almohadilla frontal de apoyo',
        top: '46%',
        left: '48%',
        biomechanical_purpose: 'Elimina por completo la necesidad de que los erectores lumbares soporten la carga en isometría.',
        pro_tip: 'Permite que tus escápulas se abran por completo en la bajada.'
      },
      {
        id: 3,
        label: 'Empuñaduras Iso-Laterales Bajas',
        part_name: 'Manetas con agarre horizontal y vertical neutro',
        top: '48%',
        left: '64%',
        biomechanical_purpose: 'Garantizan que el brazo izquierdo y derecho muevan exactamente su propia carga sin compensaciones.',
        pro_tip: 'Usa el agarre vertical neutro para aislamiento total del dorsal.'
      }
    ]
  },

  // ----------------------------------------------------
  // HAMMER STRENGTH - ISO-LATERAL DY ROW
  // ----------------------------------------------------
  hammer_iso_dy_row: {
    curve_type: 'mid_range',
    curve_title: 'Pico en Zona Media (Diseñada por Dorian Yates)',
    rating: 9.8,
    match_summary: 'Diseñada específicamente por Dorian Yates para tracción diagonal descendente: el mejor ángulo biomecánico para hipertrofia de dorsal bajo.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 85,
        level: 'Tensión Alta (85%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Brazos arriba y adelante en ángulo de 45°; dorsal en estiramiento fascial profundo.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 98,
        level: 'Pico de Fuerza Absoluto (98%)',
        color: 'from-emerald-500 to-green-400',
        cue: 'Tracción diagonal hacia abajo; coincidencia exacta con el vector de las fibras toracolumbares del dorsal.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 72,
        level: 'Alta Tensión (72%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Codo pegado a la cadera; contracción brutal en la porción inferior del dorsal.'
      }
    ],
    lever_physics: 'Ángulo de tracción único a 45° con pivote anterior elevado. Combina lo mejor de un pulldown vertical y un remo horizontal.',
    pro_hack: 'Tira pensando en llevar los codos hacia abajo y hacia tus bolsillos traseros, manteniendo el pecho firme sobre el apoyo.',
    hotspots: [
      {
        id: 1,
        label: 'Regulación de Asiento',
        part_name: 'Pasador de altura del sillín',
        top: '65%',
        left: '36%',
        biomechanical_purpose: 'Alinea la línea de tracción diagonal con la altura de tus hombros.',
        pro_tip: 'Colócalo a una altura donde puedas estirar los brazos arriba sin encogerte.'
      },
      {
        id: 2,
        label: 'Apoyo Torácico Frontal',
        part_name: 'Cojín de esternón acolchado',
        top: '44%',
        left: '46%',
        biomechanical_purpose: 'Asegura estabilidad rígida en el plano sagital.',
        pro_tip: 'Mantén el pecho firme sin permitir que el torso rote.'
      },
      {
        id: 3,
        label: 'Palancas Iso-Laterales DY',
        part_name: 'Empuñaduras de tracción diagonal convergente',
        top: '32%',
        left: '58%',
        biomechanical_purpose: 'Permite la tracción convergente descendente patentada por Hammer Strength.',
        pro_tip: 'Usa agarre neutro o con correas (straps) para anular los antebrazos.'
      }
    ]
  },

  // ----------------------------------------------------
  // HAMMER STRENGTH - LINEAR HACK SQUAT
  // ----------------------------------------------------
  hammer_linear_hack_squat: {
    curve_type: 'lengthened',
    curve_title: 'Pico en Estiramiento Profundo (Sentadilla Hack a 45°)',
    rating: 9.8,
    match_summary: 'Carro lineal a 45° con apoyo lumbar continuo: la mejor herramienta para sobrecargar cuádriceps en elongación.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 100,
        level: 'Pico Máximo de Tensión (100%)',
        color: 'from-emerald-500 to-green-400',
        cue: 'Fondo de la sentadilla; cuádriceps en estiramiento extremo con máxima sobrecarga mecánica.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 82,
        level: 'Tensión Alta (82%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Empuje a 45°; cuádriceps y glúteos trabajando en su rango de máxima potencia concéntrica.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 35,
        level: 'Tensión Baja en Bloqueo (35%)',
        color: 'from-blue-500 to-slate-400',
        cue: 'Rodillas extendidas; la carga descansa sobre la estructura ósea en el bloqueo superior.'
      }
    ],
    lever_physics: 'Guía lineal sobre cojinetes industriales a 45°. El momento de flexión sobre la articulación de la rodilla se maximiza en el punto más profundo de la bajada.',
    pro_hack: 'Mantén una bajada controlada de 3 segundos, haz una micro-pausa en el fondo para disipar la energía elástica y empuja con fuerza sin rebotar.',
    hotspots: [
      {
        id: 1,
        label: 'Plataforma Inclinada Texturizada',
        part_name: 'Base metálica de apoyo de pies',
        top: '76%',
        left: '32%',
        biomechanical_purpose: 'Permite regular la colocación de los pies para modificar el ángulo de rodilla y tobillo.',
        pro_tip: 'Coloca los pies en la mitad inferior para máximo énfasis en cuádriceps.'
      },
      {
        id: 2,
        label: 'Hombreras & Palancas de Bloqueo',
        part_name: 'Cojines acolchados de hombros con palanca giratoria',
        top: '28%',
        left: '64%',
        biomechanical_purpose: 'Alinea la carga directamente sobre la caja torácica con liberación ergonómica.',
        pro_tip: 'Gira las palancas hacia afuera para desenganchar el carro.'
      },
      {
        id: 3,
        label: 'Topes Racking de Seguridad',
        part_name: 'Pivotes de bloqueo lateral',
        top: '56%',
        left: '48%',
        biomechanical_purpose: 'Garantizan que puedas dejar la máquina enganchada en caso de fallo muscular.',
        pro_tip: 'Verifica los niveles de altura de seguridad antes de cargar peso pesado.'
      }
    ]
  },

  // ----------------------------------------------------
  // HAMMER STRENGTH - SEATED CALF RAISE (GEMELOS SENTADO)
  // ----------------------------------------------------
  hammer_seated_calf_raise: {
    curve_type: 'lengthened',
    curve_title: 'Pico en Estiramiento Profundo (Aislamiento Puro del Sóleo)',
    rating: 9.7,
    match_summary: 'Al estar la rodilla flexionada a 90°, los gastrocnemios (gemelos) entran en insuficiencia activa y el sóleo realiza el 100% de la flexión plantar.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 95,
        level: 'Máxima Tensión (95%)',
        color: 'from-emerald-500 to-green-400',
        cue: 'Talones abajo en dorsiflexión profunda; máximo estiramiento bajo tensión en las fibras del sóleo.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 88,
        level: 'Tensión Alta (88%)',
        color: 'from-teal-500 to-emerald-400',
        cue: 'Elevación de talones hacia la horizontal; máxima fuerza de flexión plantar.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 55,
        level: 'Tensión Moderada (55%)',
        color: 'from-cyan-500 to-blue-400',
        cue: 'De puntillas arriba; contracción máxima sostenida durante 1 segundo.'
      }
    ],
    lever_physics: 'Palanca de 2º grado con eje en el tobillo y resistencia sobre el fémur distal. La flexión de rodilla a 90° acorta los gemelos biarticulares, aislando de forma perfecta el músculo sóleo monoarticular.',
    pro_hack: 'Aguanta 2 segundos en la posición de estiramiento profundo abajo en cada repetición para disipar la elasticidad del tendón de Aquiles y obligar al sóleo a reclutar todas sus fibras.',
    hotspots: [
      {
        id: 1,
        label: 'Almohadillas de Retención de Muslos',
        part_name: 'Cojines dobles ajustables en altura',
        top: '46%',
        left: '48%',
        biomechanical_purpose: 'Transmiten la carga de los discos directamente sobre el extremo distal del fémur.',
        pro_tip: 'Colócalas firmemente encajadas sobre la parte baja de los muslos (justo antes de la rodilla).'
      },
      {
        id: 2,
        label: 'Palanca de Desenganche de Seguridad',
        part_name: 'Mango metálico de desbloqueo lateral',
        top: '52%',
        left: '40%',
        biomechanical_purpose: 'Soporta la palanca cargada hasta que te sitúes de puntillas y la gires para iniciar.',
        pro_tip: 'Eleva los talones y gira la palanca hacia adelante para liberar el peso.'
      },
      {
        id: 3,
        label: 'Bloque Texturizado para Metatarsos',
        part_name: 'Barra redondeada antideslizante para los pies',
        top: '76%',
        left: '52%',
        biomechanical_purpose: 'Permite descender los talones muy por debajo de la horizontal para un estiramiento extremo del sóleo.',
        pro_tip: 'Apoya únicamente la bola del pie (metatarsos), dejando los talones libres en el aire.'
      }
    ]
  },

  // ----------------------------------------------------
  // PANATTA - SUPER HACK SQUAT 45°
  // ----------------------------------------------------
  panatta_super_hack_squat: {
    curve_type: 'lengthened',
    curve_title: 'Pico en Estiramiento Profundo con Plataforma Curva Panatta',
    rating: 9.9,
    match_summary: 'Considerada la mejor sentadilla hack del mundo: su plataforma curva patentada adapta el ángulo del tobillo durante todo el recorrido.',
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 100,
        level: 'Pico Máximo de Tensión (100%)',
        color: 'from-emerald-500 to-green-400',
        cue: 'Profundidad extrema; la curvatura de la plataforma elimina la limitación de dorsiflexión y protege el tendón rotuliano.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 85,
        level: 'Tensión Alta (85%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Ascenso a 45°; potencia fluida en todo el cuádriceps.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 40,
        level: 'Tensión Baja en Bloqueo (40%)',
        color: 'from-blue-500 to-slate-400',
        cue: 'Casi bloqueo arriba; mantén las rodillas en microflexión para no perder la tensión continua.'
      }
    ],
    lever_physics: 'Guía sobre rodamientos lineales de alta precisión con plataforma curva parabólica. A diferencia de las plataformas planas donde el tobillo sufre compresión al bajar, aquí el ángulo de incidencia del pie varía de forma armónica.',
    pro_hack: 'Coloca los pies en la mitad inferior de la plataforma curva; notarás que puedes bajar 10 cm más profundo que en cualquier otra hack squat sin molestias en las rodillas.',
    hotspots: [
      {
        id: 1,
        label: 'Plataforma Curva Parabólica Panatta',
        part_name: 'Plataforma ergonómica curva patentada',
        top: '76%',
        left: '34%',
        biomechanical_purpose: 'Adapta dinámicamente el ángulo de la articulación talocrural (tobillo) evitando estrés patelar.',
        pro_tip: 'Pies a la anchura de caderas para activación brutal de vasto medial y lateral.'
      },
      {
        id: 2,
        label: 'Hombreras & Palancas de Desenganche',
        part_name: 'Almohadillas acolchadas de alta densidad con manetas',
        top: '28%',
        left: '62%',
        biomechanical_purpose: 'Alinean la fuerza axial sobre los hombros y columna con desenganche instantáneo.',
        pro_tip: 'Gira las palancas laterales para iniciar la serie.'
      },
      {
        id: 3,
        label: 'Carro de Rodadura Contrapesado',
        part_name: 'Chasis de placas con rodamientos sellados',
        top: '54%',
        left: '46%',
        biomechanical_purpose: 'Minimiza la fricción para que la curva de resistencia sea 100% pura y suave.',
        pro_tip: 'Comprueba los topes de seguridad antes de cargar con pesos pesados.'
      }
    ]
  }
};

// ==========================================
// INTELLIGENT FALLBACK & RESOLVER ENGINE
// ==========================================

export function getMachineBiomechanics(
  templateId?: string,
  title?: string,
  muscleGroup?: string
): MachineBiomechanicsData {
  if (templateId && MACHINE_BIOMECHANICS_CATALOG[templateId]) {
    return MACHINE_BIOMECHANICS_CATALOG[templateId];
  }

  const cleanId = (templateId || '').toLowerCase();
  const cleanTitle = (title || '').toLowerCase();
  const mg = (muscleGroup || '').toLowerCase();

  // 1. CHEST PRESS (Flat / Incline / Decline / Wide)
  if (cleanId.includes('chest_press') || cleanTitle.includes('chest press') || cleanId.includes('bench_press') || cleanTitle.includes('press de pecho') || cleanTitle.includes('press de banca')) {
    if (cleanId.includes('incline') || cleanTitle.includes('inclinad')) {
      return {
        ...MACHINE_BIOMECHANICS_CATALOG['technogym_pure_incline_chest'],
        hotspots: [
          { id: 1, label: 'Asiento / Altura', part_name: 'Pasador de altura de sillín', top: '65%', left: '38%', biomechanical_purpose: 'Alinea las empuñaduras con el haz clavicular superior.', pro_tip: 'Punto medio para ángulo óptimo a 35°.' },
          { id: 2, label: 'Pedal / Asistencia', part_name: 'Mecanismo de precarga', top: '82%', left: '46%', biomechanical_purpose: 'Adelanta las empuñaduras para evitar hiperextensión del hombro.', pro_tip: 'Pisa antes de posicionar las manos.' },
          { id: 3, label: 'Empuñaduras Inclinadas', part_name: 'Mangos convergentes ascendentes', top: '38%', left: '54%', biomechanical_purpose: 'Trayectoria convergente que concentra la carga en el pecho superior.', pro_tip: 'Empuja hacia arriba y adentro.' }
        ]
      };
    }
    return {
      ...MACHINE_BIOMECHANICS_CATALOG['technogym_pure_chest_press'],
      hotspots: [
        { id: 1, label: 'Regulación de Asiento', part_name: 'Pasador regulador de sillín', top: '63%', left: '44%', biomechanical_purpose: 'Alinea los codos en el plano escapular a 30°-45° respecto al torso.', pro_tip: 'Manetas a la altura de la parte media del pecho.' },
        { id: 2, label: 'Eje de Giro / Palanca Convergente', part_name: 'Eje rotatorio de convergencia', top: '28%', left: '48%', biomechanical_purpose: 'Define el recorrido natural en aducción horizontal.', pro_tip: 'Alinea la trayectoria con tus fibras pectorales.' },
        { id: 3, label: 'Empuñaduras Convergentes', part_name: 'Mangos con agarre ergonómico', top: '42%', left: '56%', biomechanical_purpose: 'Trayectoria convergente respetando las fibras esternales.', pro_tip: 'Mantén las muñecas neutras.' }
      ]
    };
  }

  // 2. PULLDOWN / JALÓN
  if (cleanId.includes('pulldown') || cleanTitle.includes('pulldown') || cleanTitle.includes('jalón') || cleanId.includes('lat_machine')) {
    return {
      ...MACHINE_BIOMECHANICS_CATALOG['technogym_pure_pulldown'],
      hotspots: [
        { id: 1, label: 'Altura de Sillín', part_name: 'Pasador de asiento', top: '68%', left: '46%', biomechanical_purpose: 'Asegura que los pies queden apoyados planos en el suelo.', pro_tip: 'Ajusta la altura antes de cargar peso.' },
        { id: 2, label: 'Rodillos de Retención', part_name: 'Almohadillas de bloqueo de muslos', top: '54%', left: '46%', biomechanical_purpose: 'Impide que el torso se eleve al traccionar cargas elevadas.', pro_tip: 'Fíjalos apretados contra los cuádriceps.' },
        { id: 3, label: 'Empuñaduras Superiores', part_name: 'Manetas / barra de tracción', top: '22%', left: '56%', biomechanical_purpose: 'Dirección de tracción en el plano escapular hacia el dorsal ancho.', pro_tip: 'Conduce los codos hacia las costillas.' }
      ]
    };
  }

  // 3. ROW / REMO
  if (cleanId.includes('row') || cleanTitle.includes('row') || cleanTitle.includes('remo')) {
    return {
      ...MACHINE_BIOMECHANICS_CATALOG['technogym_pure_low_row'],
      hotspots: [
        { id: 1, label: 'Regulación de Asiento', part_name: 'Pasador de altura', top: '66%', left: '38%', biomechanical_purpose: 'Coloca el esternón en el centro del apoyo pectoral.', pro_tip: 'Regula de modo que no te encorves.' },
        { id: 2, label: 'Apoyo Torácico', part_name: 'Almohadilla pectoral regulable', top: '48%', left: '48%', biomechanical_purpose: 'Anula el estrés y compensación con la columna lumbar.', pro_tip: 'Mantén el pecho en contacto durante toda la serie.' },
        { id: 3, label: 'Empuñaduras de Tracción', part_name: 'Palancas iso-laterales de remo', top: '44%', left: '62%', biomechanical_purpose: 'Permiten traccionar en el ángulo natural de los codos.', pro_tip: 'Tira con los codos liderando la fase concéntrica.' }
      ]
    };
  }

  // 4. LEG EXTENSION / EXTENSIÓN DE CUÁDRICEPS
  if (cleanId.includes('leg_extension') || cleanTitle.includes('leg extension') || cleanTitle.includes('extensión de cuádriceps') || cleanTitle.includes('extension cuatriceps')) {
    return {
      ...MACHINE_BIOMECHANICS_CATALOG['technogym_selection_leg_extension'],
      hotspots: [
        { id: 1, label: 'Profundidad de Respaldo', part_name: 'Pasador lumbar', top: '42%', left: '36%', biomechanical_purpose: 'Alinea los cóndilos femorales de la rodilla con el eje de rotación de la máquina.', pro_tip: 'Hueco poplíteo a 1 cm del borde del asiento.' },
        { id: 2, label: 'Rodillo Tibial Inferior', part_name: 'Almohadilla para espinilla/tobillo', top: '74%', left: '62%', biomechanical_purpose: 'Ajusta la longitud de la palanca sobre la tibia.', pro_tip: 'Debe quedar justo sobre el empeine.' },
        { id: 3, label: 'Selector de Ángulo ROM', part_name: 'Pasador de leva excéntrica', top: '48%', left: '52%', biomechanical_purpose: 'Determina el inicio de la flexión para cuidar la rótula.', pro_tip: 'Punto #1 o #2 para rango completo.' }
      ]
    };
  }

  // 5. LEG CURL / FEMORAL
  if (cleanId.includes('leg_curl') || cleanTitle.includes('leg curl') || cleanTitle.includes('femoral')) {
    return {
      ...MACHINE_BIOMECHANICS_CATALOG['technogym_selection_leg_curl'],
      hotspots: [
        { id: 1, label: 'Almohadilla Bloqueadora', part_name: 'Cojín de sujeción sobre cuádriceps', top: '46%', left: '54%', biomechanical_purpose: 'Evita que los muslos se eleven al contraer los isquios.', pro_tip: 'Fíjala bien apretada contra las piernas.' },
        { id: 2, label: 'Rodillo de Talón', part_name: 'Rodillo para tendón de Aquiles', top: '72%', left: '64%', biomechanical_purpose: 'Punto de apoyo para la palanca de flexión de rodilla.', pro_tip: 'Debe quedar 2 cm por encima del talón.' },
        { id: 3, label: 'Eje & Respaldo', part_name: 'Pasador de profundidad', top: '40%', left: '36%', biomechanical_purpose: 'Alinea la articulación de la rodilla con el pivote.', pro_tip: 'Agárrate fuerte a las asas laterales.' }
      ]
    };
  }

  // 6. HACK SQUAT / PRENSA 45°
  if (cleanId.includes('hack') || cleanTitle.includes('hack') || cleanId.includes('leg_press') || cleanTitle.includes('prensa')) {
    return {
      ...MACHINE_BIOMECHANICS_CATALOG['technogym_pure_hack_squat'],
      hotspots: [
        { id: 1, label: 'Plataforma Inclinada', part_name: 'Base antideslizante para pies', top: '78%', left: '35%', biomechanical_purpose: 'Permite regular la posición de pies para enfocar cuádriceps o glúteos.', pro_tip: 'Pies abajo para máximo énfasis en vastos.' },
        { id: 2, label: 'Hombreras & Bloqueo', part_name: 'Cojines de hombro con desenganche', top: '32%', left: '64%', biomechanical_purpose: 'Alinea la carga directamente sobre el tren superior.', pro_tip: 'Gira las palancas para liberar el carro.' },
        { id: 3, label: 'Topes de Seguridad', part_name: 'Topes de retención inferior', top: '62%', left: '46%', biomechanical_purpose: 'Protegen contra accidentes en caso de fallo muscular.', pro_tip: 'Ajusta la altura antes de cargar peso.' }
      ]
    };
  }

  // 7. HIP THRUST / GLUTE DRIVE
  if (cleanId.includes('hip_thrust') || cleanTitle.includes('hip thrust') || cleanId.includes('glute_drive') || cleanTitle.includes('glute drive') || cleanTitle.includes('empuje de cadera')) {
    return {
      ...MACHINE_BIOMECHANICS_CATALOG['technogym_pure_hip_thrust'],
      hotspots: [
        { id: 1, label: 'Rodillo / Cinturón Pélvico', part_name: 'Acolchado de cresta ilíaca', top: '52%', left: '50%', biomechanical_purpose: 'Distribuye la carga de empuje sobre la pelvis sin dañar el pubis.', pro_tip: 'Colócalo en el pliegue de la cadera.' },
        { id: 2, label: 'Plataforma de Pies', part_name: 'Base de apoyo plantar', top: '68%', left: '38%', biomechanical_purpose: 'Asegura que la tibia quede a 90° exactos en el pico de extensión.', pro_tip: 'Empuja con los talones.' },
        { id: 3, label: 'Banco Escapular', part_name: 'Respaldo superior basculante', top: '48%', left: '64%', biomechanical_purpose: 'Acompaña el ángulo del torso para no arquear la zona lumbar.', pro_tip: 'Mantén la mirada al frente.' }
      ]
    };
  }

  // 8. ABDUCTOR / ADDUCTOR
  if (cleanId.includes('abductor') || cleanTitle.includes('abductor') || cleanTitle.includes('abducción')) {
    return {
      ...MACHINE_BIOMECHANICS_CATALOG['technogym_pure_standing_abductor'],
      hotspots: [
        { id: 1, label: 'Almohadillas de Empuje Lateral', part_name: 'Cojines en cara externa de muslos', top: '54%', left: '52%', biomechanical_purpose: 'Transmiten la fuerza de abducción sobre el fémur.', pro_tip: 'Colócalas sobre la rodilla externa.' },
        { id: 2, label: 'Apoyo Torácico', part_name: 'Soporte frontal de estabilización', top: '42%', left: '42%', biomechanical_purpose: 'Inmoviliza la pelvis para evitar compensación lumbar.', pro_tip: 'Inclina el torso 15° hacia adelante.' },
        { id: 3, label: 'Eje de Giro & Carga', part_name: 'Portadiscos posterior', top: '46%', left: '72%', biomechanical_purpose: 'Proporciona pico de tensión máximo al abrir.', pro_tip: 'Aguanta 1s en apertura máxima.' }
      ]
    };
  }

  // 9. SHOULDER PRESS / ELEVACIONES LATERALES
  if (cleanId.includes('shoulder') || cleanTitle.includes('shoulder') || cleanTitle.includes('hombro') || cleanId.includes('lateral_raise') || cleanTitle.includes('lateral')) {
    return {
      ...MACHINE_BIOMECHANICS_CATALOG['technogym_pure_shoulder_press'],
      hotspots: [
        { id: 1, label: 'Altura de Sillín', part_name: 'Pasador de asiento', top: '68%', left: '44%', biomechanical_purpose: 'Alinea los hombros a la altura adecuada para no forzar el manguito.', pro_tip: 'Manetas a la altura de las orejas.' },
        { id: 2, label: 'Pedal de Precarga', part_name: 'Pedal frontal de inicio', top: '84%', left: '48%', biomechanical_purpose: 'Eleva las empuñaduras antes de iniciar el movimiento.', pro_tip: 'Pisa antes de colocar las manos.' },
        { id: 3, label: 'Empuñaduras Convergentes', part_name: 'Mangos ergonómicos ascendentes', top: '35%', left: '54%', biomechanical_purpose: 'Trayectoria convergente que respeta el plano escapular.', pro_tip: 'Empuja hacia arriba y al centro.' }
      ]
    };
  }

  // 10. BICEPS / TRICEPS
  if (cleanId.includes('biceps') || cleanTitle.includes('biceps') || cleanId.includes('curl') || cleanTitle.includes('curl') || cleanId.includes('triceps') || cleanTitle.includes('tríceps') || cleanId.includes('dip')) {
    return {
      ...MACHINE_BIOMECHANICS_CATALOG['technogym_selection_arm_curl'],
      hotspots: [
        { id: 1, label: 'Altura de Sillín', part_name: 'Pasador de asiento', top: '68%', left: '36%', biomechanical_purpose: 'Coloca las axilas en el borde del atril para bloquear el húmero.', pro_tip: 'Apoya bien el brazo sin encorvarte.' },
        { id: 2, label: 'Atril Acolchado Inclinado', part_name: 'Almohadilla en ángulo de 45°', top: '48%', left: '48%', biomechanical_purpose: 'Aísla el bíceps eliminando el impulso del deltoides.', pro_tip: 'Mantén todo el brazo apoyado.' },
        { id: 3, label: 'Empuñaduras Giratorias', part_name: 'Manillar ergonómico con leva', top: '52%', left: '62%', biomechanical_purpose: 'Permite flexión sin sobrecargar el túnel carpiano.', pro_tip: 'Controla 3s la bajada.' }
      ]
    };
  }

  // 11. CALF / GEMELOS
  if (cleanId.includes('calf') || cleanTitle.includes('calf') || cleanTitle.includes('gemelo') || cleanTitle.includes('sóleo')) {
    return {
      ...MACHINE_BIOMECHANICS_CATALOG['hammer_seated_calf_raise'],
      hotspots: [
        { id: 1, label: 'Almohadillas de Muslo', part_name: 'Cojines acolchados de presión', top: '46%', left: '48%', biomechanical_purpose: 'Transmiten la carga directamente sobre el fémur distal.', pro_tip: 'Fíjalas bien encajadas.' },
        { id: 2, label: 'Palanca de Desenganche', part_name: 'Mango de seguridad lateral', top: '52%', left: '40%', biomechanical_purpose: 'Libera la palanca para permitir el rango completo.', pro_tip: 'Gira para iniciar la serie.' },
        { id: 3, label: 'Bloque para Metatarsos', part_name: 'Base redondeada antideslizante', top: '76%', left: '52%', biomechanical_purpose: 'Permite dorsiflexión profunda por debajo de la horizontal.', pro_tip: 'Apoya solo la punta del pie.' }
      ]
    };
  }

  // DEFAULT / GENERAL MACHINE FALLBACK
  return {
    curve_type: 'lengthened',
    curve_title: 'Perfil Biomecánico Optimizado con Brazo de Momento Adaptado',
    rating: 9.4,
    match_summary: 'Máquina comercial con diseño de palanca optimizado para la curva natural de fuerza muscular.',
    strength_curve: [75, 95, 60],
    resistance_curve: [65, 90, 75],
    mismatch_analysis: 'Correspondencia biomecánica alta: el pico de torque de la palanca acompaña de forma equilibrada la zona de mayor superposición de actina y miosina del músculo motor.',
    gym_hacks: {
      pad_hack: 'Usa un bloque o colchoneta adicional si los brazos de palanca hacen tope antes de alcanzar tu rango activo de estiramiento.',
      band_hack: 'Puedes acoplar bandas ligeras al eje de giro para adaptar la curva de resistencia a tu curva de fuerza personal.',
      anthropometric_hack: 'Ajusta la altura del asiento para que el eje anatómico de la articulación principal coincida exactamente con el perno de giro del chasis.'
    },
    phases: [
      {
        phase: 'Estiramiento (Inicio)',
        pct: 90,
        level: 'Máxima Tensión (90%)',
        color: 'from-emerald-500 to-teal-400',
        cue: 'Músculo diana en elongación completa; máxima tensión mecánica para estimular la hipertrofia.'
      },
      {
        phase: 'Zona Media (45°-90°)',
        pct: 82,
        level: 'Tensión Alta (82%)',
        color: 'from-teal-500 to-cyan-400',
        cue: 'Brazo de momento óptimo; coincidencia con la fuerza máxima concéntrica.'
      },
      {
        phase: 'Acortamiento (Pico Contracción)',
        pct: 60,
        level: 'Tensión Moderada (60%)',
        color: 'from-cyan-500 to-blue-400',
        cue: 'Contracción terminal con reducción de estrés articular.'
      }
    ],
    lever_physics: 'Brazo de palanca con eje de rotación biomecánico que adapta la trayectoria de la carga a los planos anatómicos de movimiento.',
    pro_hack: 'Ajusta el sillín y los apoyos de modo que el eje articular principal coincida de forma exacta con el eje de rotación de la máquina.',
    hotspots: [
      {
        id: 1,
        label: 'Regulación de Asiento / Altura',
        part_name: 'Pasador regulador de sillín',
        top: '64%',
        left: '42%',
        biomechanical_purpose: 'Alinea las articulaciones con el plano de tracción/empuje de la máquina.',
        pro_tip: 'Ajusta la altura antes de cargar peso.'
      },
      {
        id: 2,
        label: 'Apoyo Torácico o Respaldo',
        part_name: 'Almohadilla de soporte anatómico',
        top: '48%',
        left: '48%',
        biomechanical_purpose: 'Anula las compensaciones y estabiliza la columna vertebral.',
        pro_tip: 'Mantén el contacto firme durante toda la serie.'
      },
      {
        id: 3,
        label: 'Palancas / Empuñaduras de Ejercicio',
        part_name: 'Mangos ergonómicos de accionamiento',
        top: '40%',
        left: '58%',
        biomechanical_purpose: 'Transmiten la fuerza respetando la línea de tracción muscular.',
        pro_tip: 'Controla 3 segundos la fase excéntrica lenta.'
      }
    ]
  };
}
