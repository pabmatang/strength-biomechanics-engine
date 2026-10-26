import { ExerciseTemplate, WorkoutExercise } from '../types/workout';

export interface ExerciseAnimationInfo {
  gifUrl: string;
  name: string;
  slug: string;
  equipment: string;
  bodyPart: string;
  targetMuscle: string;
  secondaryMuscles?: string[];
  instructions: string[];
}

/**
 * ExerciseDB CDN base URL (jsDelivr mirror)
 */
export const EXERCISE_DB_CDN_BASE = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/';

/**
 * Static mapping of gym machines and catalog templates to verified ExerciseDB GIFs & Spanish instructions
 */
export const EXERCISE_ANIMATION_MAP: Record<string, ExerciseAnimationInfo> = {
  "technogym_pure_chest_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-chest-press.gif",
    "name": "Press de pecho en máquina",
    "slug": "lever-chest-press",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_chest_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-chest-press-0577.gif",
    "name": "Press de pecho en máquina",
    "slug": "lever-chest-press-0577",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_incline_chest": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-incline-chest-press.gif",
    "name": "Press de pecho inclinado en máquina",
    "slug": "lever-incline-chest-press",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_wide_chest": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-chest-press.gif",
    "name": "Press de pecho en máquina",
    "slug": "lever-chest-press",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_pec_deck_reverse_fly": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-seated-fly.gif",
    "name": "Apertura en máquina, sentado",
    "slug": "lever-seated-fly",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_pec_deck": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-seated-fly.gif",
    "name": "Apertura en máquina, sentado",
    "slug": "lever-seated-fly",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_iso_incline_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-incline-chest-press-v-2.gif",
    "name": "Press de pecho inclinado en máquina",
    "slug": "lever-incline-chest-press-v-2",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_iso_incline_chest_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-incline-chest-press-v-2.gif",
    "name": "Press de pecho inclinado en máquina",
    "slug": "lever-incline-chest-press-v-2",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_iso_wide_chest": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-chest-press.gif",
    "name": "Press de pecho en máquina",
    "slug": "lever-chest-press",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_iso_bench_press_plate": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-chest-press.gif",
    "name": "Press de pecho en máquina",
    "slug": "lever-chest-press",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_iso_decline_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-decline-chest-press.gif",
    "name": "Press de pecho declinado en máquina",
    "slug": "lever-decline-chest-press",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_decline_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-decline-chest-press.gif",
    "name": "Press de pecho declinado en máquina",
    "slug": "lever-decline-chest-press",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_incline_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-incline-chest-press.gif",
    "name": "Press de pecho inclinado en máquina",
    "slug": "lever-incline-chest-press",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "matrix_ultra_converging_chest": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-chest-press.gif",
    "name": "Press de pecho en máquina",
    "slug": "lever-chest-press",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "panatta_incline_chest": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-incline-chest-press.gif",
    "name": "Press de pecho inclinado en máquina",
    "slug": "lever-incline-chest-press",
    "equipment": "lever",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_pulldown": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/lever-front-pulldown.gif",
    "name": "Jalón al pecho en máquina, frontal",
    "slug": "lever-front-pulldown",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los dorsales antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_low_row": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-seated-row.gif",
    "name": "Remo sentado en máquina",
    "slug": "lever-seated-row",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_row_dorian": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-t-bar-row.gif",
    "name": "Remo en T en máquina",
    "slug": "lever-t-bar-row",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_t_bar_row": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-t-bar-row.gif",
    "name": "Remo en T en máquina",
    "slug": "lever-t-bar-row",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_deadlift": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/lever-deadlift.gif",
    "name": "Peso muerto en máquina",
    "slug": "lever-deadlift",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "lats",
      "traps",
      "forearms",
      "spine"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_lat_machine": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-lat-pulldown-full-range-of-motion.gif",
    "name": "Jalón al pecho en polea, en rango completo",
    "slug": "cable-lat-pulldown-full-range-of-motion",
    "equipment": "cable",
    "bodyPart": "back",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts"
    ],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa los dorsales antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_wide_row": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-seated-row.gif",
    "name": "Remo sentado en máquina",
    "slug": "lever-seated-row",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_low_row": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-alternating-narrow-grip-seated-row.gif",
    "name": "Remo sentado en máquina, con agarre estrecho, alternado",
    "slug": "lever-alternating-narrow-grip-seated-row",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_pulley": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-seated-row.gif",
    "name": "Remo sentado en polea",
    "slug": "cable-seated-row",
    "equipment": "cable",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_pullover": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/lever-pullover.gif",
    "name": "Pullover en máquina",
    "slug": "lever-pullover",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "pectorals",
      "triceps",
      "abs"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los dorsales antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_iso_front_lat_pulldown": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/lever-front-pulldown.gif",
    "name": "Jalón al pecho en máquina, frontal",
    "slug": "lever-front-pulldown",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los dorsales antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_front_pulldown": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/lever-front-pulldown.gif",
    "name": "Jalón al pecho en máquina, frontal",
    "slug": "lever-front-pulldown",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los dorsales antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_iso_dy_row": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-high-row.gif",
    "name": "Remo alto en máquina",
    "slug": "lever-high-row",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_iso_low_row": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-narrow-grip-seated-row.gif",
    "name": "Remo sentado en máquina, con agarre estrecho",
    "slug": "lever-narrow-grip-seated-row",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_plate_loaded_seated_row": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-seated-row.gif",
    "name": "Remo sentado en máquina",
    "slug": "lever-seated-row",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_chest_supported_t_bar_row": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-t-bar-reverse-grip-row.gif",
    "name": "Remo en máquina, con agarre invertido, t barra",
    "slug": "lever-t-bar-reverse-grip-row",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "panatta_super_high_row": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-high-row.gif",
    "name": "Remo alto en máquina",
    "slug": "lever-high-row",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "panatta_super_rowing_plate": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-bent-over-row.gif",
    "name": "Remo inclinado en máquina",
    "slug": "lever-bent-over-row",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "panatta_super_t_bar_row": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-t-bar-row.gif",
    "name": "Remo en T en máquina",
    "slug": "lever-t-bar-row",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "matrix_ultra_diverging_lat_pulldown": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/lever-front-pulldown.gif",
    "name": "Jalón al pecho en máquina, frontal",
    "slug": "lever-front-pulldown",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los dorsales antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "matrix_ultra_seated_row": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-seated-row.gif",
    "name": "Remo sentado en máquina",
    "slug": "lever-seated-row",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_belt_squat": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/smith-squat.gif",
    "name": "Sentadilla en máquina Smith",
    "slug": "smith-squat",
    "equipment": "smith",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "calves"
    ],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_leg_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-alternate-leg-press.gif",
    "name": "Prensa de piernas en máquina, alternado",
    "slug": "lever-alternate-leg-press",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los cuádriceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_leg_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/lever-horizontal-one-leg-press.gif",
    "name": "Prensa horizontal a una pierna en máquina",
    "slug": "lever-horizontal-one-leg-press",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_hack_squat": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/sled-hack-squat.gif",
    "name": "Hack squat en trineo",
    "slug": "sled-hack-squat",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "calves"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_hip_thrust": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/smith-hip-raise.gif",
    "name": "Elevación de cadera en máquina Smith",
    "slug": "smith-hip-raise",
    "equipment": "smith",
    "bodyPart": "core",
    "targetMuscle": "abs",
    "secondaryMuscles": [],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa el core antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_hip_thrust": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/smith-hip-raise.gif",
    "name": "Elevación de cadera en máquina Smith",
    "slug": "smith-hip-raise",
    "equipment": "smith",
    "bodyPart": "core",
    "targetMuscle": "abs",
    "secondaryMuscles": [],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa el core antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_adductor": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/adductors/lever-seated-hip-adduction.gif",
    "name": "Aducción de cadera en máquina, sentado",
    "slug": "lever-seated-hip-adduction",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "adductors",
    "secondaryMuscles": [],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los aductores antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_abductor": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abductors/lever-seated-hip-abduction.gif",
    "name": "Abducción de cadera en máquina, sentado",
    "slug": "lever-seated-hip-abduction",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "abductors",
    "secondaryMuscles": [],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los abductores antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_standing_abductor": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abductors/lever-seated-hip-abduction.gif",
    "name": "Abducción de cadera en máquina, sentado",
    "slug": "lever-seated-hip-abduction",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "abductors",
    "secondaryMuscles": [],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los abductores antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_multi_hip": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/lever-hip-extension-v-2.gif",
    "name": "Extensión en máquina, cadera",
    "slug": "lever-hip-extension-v-2",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "spine"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_leg_extension": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-leg-extension.gif",
    "name": "Extensión de cuádriceps en máquina",
    "slug": "lever-leg-extension",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "glutes",
      "hamstrings"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los cuádriceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_leg_curl": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-seated-leg-curl.gif",
    "name": "Curl femoral en máquina, sentado",
    "slug": "lever-seated-leg-curl",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "hamstrings",
    "secondaryMuscles": [
      "glutes",
      "calves"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los isquiotibiales antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_prone_leg_curl": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-lying-leg-curl.gif",
    "name": "Curl femoral en máquina, tumbado",
    "slug": "lever-lying-leg-curl",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "hamstrings",
    "secondaryMuscles": [
      "glutes",
      "calves"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los isquiotibiales antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_standing_leg_curl": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-kneeling-leg-curl.gif",
    "name": "Curl femoral en máquina, de rodillas",
    "slug": "lever-kneeling-leg-curl",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "hamstrings",
    "secondaryMuscles": [
      "glutes",
      "calves"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los isquiotibiales antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_iso_leg_extension": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-leg-extension.gif",
    "name": "Extensión de cuádriceps en máquina",
    "slug": "lever-leg-extension",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "glutes",
      "hamstrings"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los cuádriceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_kneeling_leg_curl": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-kneeling-leg-curl.gif",
    "name": "Curl femoral en máquina, de rodillas",
    "slug": "lever-kneeling-leg-curl",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "hamstrings",
    "secondaryMuscles": [
      "glutes",
      "calves"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los isquiotibiales antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_linear_hack_squat": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/sled-hack-squat.gif",
    "name": "Hack squat en trineo",
    "slug": "sled-hack-squat",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "calves"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_plate_loaded_v_squat": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/sled-hack-squat.gif",
    "name": "Hack squat en trineo",
    "slug": "sled-hack-squat",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "calves"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_plate_loaded_leg_press_45": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-alternate-leg-press.gif",
    "name": "Prensa de piernas en máquina, alternado",
    "slug": "lever-alternate-leg-press",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los cuádriceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_glute_drive": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/smith-hip-raise.gif",
    "name": "Elevación de cadera en máquina Smith",
    "slug": "smith-hip-raise",
    "equipment": "smith",
    "bodyPart": "core",
    "targetMuscle": "abs",
    "secondaryMuscles": [],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa el core antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "panatta_super_hack_squat": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/sled-hack-squat.gif",
    "name": "Hack squat en trineo",
    "slug": "sled-hack-squat",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "calves"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "panatta_super_leg_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-alternate-leg-press.gif",
    "name": "Prensa de piernas en máquina, alternado",
    "slug": "lever-alternate-leg-press",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los cuádriceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "panatta_super_leg_press_bridge": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-alternate-leg-press.gif",
    "name": "Prensa de piernas en máquina, alternado",
    "slug": "lever-alternate-leg-press",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los cuádriceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "panatta_super_belt_squat": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/smith-squat.gif",
    "name": "Sentadilla en máquina Smith",
    "slug": "smith-squat",
    "equipment": "smith",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "calves"
    ],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "panatta_super_pendulum_squat": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/sled-hack-squat.gif",
    "name": "Hack squat en trineo",
    "slug": "sled-hack-squat",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "calves"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_standing_calf": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/lever-standing-calf-raise.gif",
    "name": "Elevación de talones en máquina, de pie",
    "slug": "lever-standing-calf-raise",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "calves",
    "secondaryMuscles": [],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los gemelos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_seated_calf_raise": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/lever-seated-calf-raise.gif",
    "name": "Elevación de talones en máquina, sentado",
    "slug": "lever-seated-calf-raise",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "calves",
    "secondaryMuscles": [],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los gemelos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_standing_calf_raise": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/lever-standing-calf-raise.gif",
    "name": "Elevación de talones en máquina, de pie",
    "slug": "lever-standing-calf-raise",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "calves",
    "secondaryMuscles": [],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los gemelos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_super_horizontal_calf": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/lever-calf-press.gif",
    "name": "Press de gemelo en máquina",
    "slug": "lever-calf-press",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "calves",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los gemelos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "matrix_versa_calf_extension": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/lever-seated-calf-press.gif",
    "name": "Press de gemelo en máquina, sentado",
    "slug": "lever-seated-calf-press",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "calves",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los gemelos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "panatta_viking_press_calf": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/lever-standing-calf-raise.gif",
    "name": "Elevación de talones en máquina, de pie",
    "slug": "lever-standing-calf-raise",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "calves",
    "secondaryMuscles": [],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los gemelos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_shoulder_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/lever-shoulder-press.gif",
    "name": "Press de hombros en máquina",
    "slug": "lever-shoulder-press",
    "equipment": "lever",
    "bodyPart": "shoulders",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "triceps"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los hombros antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_shoulder_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/lever-shoulder-press-v-2.gif",
    "name": "Press de hombros en máquina",
    "slug": "lever-shoulder-press-v-2",
    "equipment": "lever",
    "bodyPart": "shoulders",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "triceps"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los hombros antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_lateral_raise": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/lever-lateral-raise.gif",
    "name": "Elevación lateral en máquina",
    "slug": "lever-lateral-raise",
    "equipment": "lever",
    "bodyPart": "shoulders",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "traps"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los hombros antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "matrix_ultra_lateral_raise": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/lever-lateral-raise.gif",
    "name": "Elevación lateral en máquina",
    "slug": "lever-lateral-raise",
    "equipment": "lever",
    "bodyPart": "shoulders",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "traps"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los hombros antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_arm_curl": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/lever-preacher-curl.gif",
    "name": "Curl predicador en máquina",
    "slug": "lever-preacher-curl",
    "equipment": "lever",
    "bodyPart": "arms",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los bíceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_pure_biceps_curl": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/lever-bicep-curl.gif",
    "name": "Curl de bíceps en máquina",
    "slug": "lever-bicep-curl",
    "equipment": "lever",
    "bodyPart": "arms",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los bíceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_seated_biceps_curl": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/lever-preacher-curl-v-2.gif",
    "name": "Curl predicador en máquina",
    "slug": "lever-preacher-curl-v-2",
    "equipment": "lever",
    "bodyPart": "arms",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los bíceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "panatta_super_preacher_curl": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/lever-preacher-curl.gif",
    "name": "Curl predicador en máquina",
    "slug": "lever-preacher-curl",
    "equipment": "lever",
    "bodyPart": "arms",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los bíceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "matrix_ultra_arm_curl": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/lever-bicep-curl.gif",
    "name": "Curl de bíceps en máquina",
    "slug": "lever-bicep-curl",
    "equipment": "lever",
    "bodyPart": "arms",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los bíceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_seated_dip": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/lever-seated-dip.gif",
    "name": "Fondo en máquina, sentado",
    "slug": "lever-seated-dip",
    "equipment": "lever",
    "bodyPart": "arms",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "delts",
      "pectorals"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los tríceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_seated_dip_triceps": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/lever-seated-dip.gif",
    "name": "Fondo en máquina, sentado",
    "slug": "lever-seated-dip",
    "equipment": "lever",
    "bodyPart": "arms",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "delts",
      "pectorals"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los tríceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "lifefitness_insignia_triceps_extension": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/lever-triceps-extension.gif",
    "name": "Extensión de tríceps en máquina",
    "slug": "lever-triceps-extension",
    "equipment": "lever",
    "bodyPart": "arms",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "delts"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los tríceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "panatta_monolith_triceps_dip": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/lever-overhand-triceps-dip.gif",
    "name": "Fondo de tríceps en máquina, overhand",
    "slug": "lever-overhand-triceps-dip",
    "equipment": "lever",
    "bodyPart": "arms",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "delts",
      "pectorals"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los tríceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_abdominal_crunch": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/lever-seated-crunch.gif",
    "name": "Crunch en máquina, sentado",
    "slug": "lever-seated-crunch",
    "equipment": "lever",
    "bodyPart": "core",
    "targetMuscle": "abs",
    "secondaryMuscles": [],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa el core antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "technogym_selection_lower_back": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/spine/lever-back-extension.gif",
    "name": "Extensión en máquina, espalda",
    "slug": "lever-back-extension",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "spine",
    "secondaryMuscles": [
      "glutes",
      "hamstrings"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la zona lumbar antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "lifefitness_back_extension": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/spine/lever-back-extension.gif",
    "name": "Extensión en máquina, espalda",
    "slug": "lever-back-extension",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "spine",
    "secondaryMuscles": [
      "glutes",
      "hamstrings"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la zona lumbar antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "hammer_back_extension": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/spine/lever-back-extension.gif",
    "name": "Extensión en máquina, espalda",
    "slug": "lever-back-extension",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "spine",
    "secondaryMuscles": [
      "glutes",
      "hamstrings"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa la zona lumbar antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "panatta_45_hyperextension_bench": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/lever-reverse-hyperextension.gif",
    "name": "Hyperextension invertido en máquina",
    "slug": "lever-reverse-hyperextension",
    "equipment": "lever",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "spine"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "lever_shrug": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/lever-shrug.gif",
    "name": "Encogimiento en máquina",
    "slug": "lever-shrug",
    "equipment": "lever",
    "bodyPart": "back",
    "targetMuscle": "traps",
    "secondaryMuscles": [
      "delts",
      "forearms"
    ],
    "instructions": [
      "Ajusta la máquina a tu medida y selecciona la carga.",
      "Activa los trapecios antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_lateral_raise": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif",
    "name": "Elevación lateral con mancuerna",
    "slug": "dumbbell-lateral-raise",
    "equipment": "dumbbell",
    "bodyPart": "shoulders",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "traps"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa los hombros antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_lateral_raise_standing": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif",
    "name": "Elevación lateral con mancuerna",
    "slug": "dumbbell-lateral-raise",
    "equipment": "dumbbell",
    "bodyPart": "shoulders",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "traps"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa los hombros antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_flat_bench_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif",
    "name": "Press de banca con mancuerna",
    "slug": "dumbbell-bench-press",
    "equipment": "dumbbell",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_bench_press_flat": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif",
    "name": "Press de banca con mancuerna",
    "slug": "dumbbell-bench-press",
    "equipment": "dumbbell",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "incline_dumbbell_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif",
    "name": "Press con mancuerna, en banco inclinado",
    "slug": "dumbbell-incline-bench-press",
    "equipment": "dumbbell",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_incline_bench_press_upper": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif",
    "name": "Press con mancuerna, en banco inclinado",
    "slug": "dumbbell-incline-bench-press",
    "equipment": "dumbbell",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_seated_shoulder_press_delts": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-seated-shoulder-press-parallel-grip.gif",
    "name": "Press de hombros con mancuerna, sentado, con agarre paralelo",
    "slug": "dumbbell-seated-shoulder-press-parallel-grip",
    "equipment": "dumbbell",
    "bodyPart": "shoulders",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "triceps"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa los hombros antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_rear_delt_raise_fly": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-rear-delt-raise.gif",
    "name": "Elevación posterior de deltoides con mancuerna",
    "slug": "dumbbell-rear-delt-raise",
    "equipment": "dumbbell",
    "bodyPart": "shoulders",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "traps"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa los hombros antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_one_arm_row": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/dumbbell-reverse-grip-incline-bench-one-arm-row.gif",
    "name": "Remo con mancuerna, con agarre invertido, en banco inclinado a una mano",
    "slug": "dumbbell-reverse-grip-incline-bench-one-arm-row",
    "equipment": "dumbbell",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_one_arm_row_bench": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/dumbbell-reverse-grip-incline-bench-one-arm-row.gif",
    "name": "Remo con mancuerna, con agarre invertido, en banco inclinado a una mano",
    "slug": "dumbbell-reverse-grip-incline-bench-one-arm-row",
    "equipment": "dumbbell",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_biceps_curl_standing": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-biceps-curl.gif",
    "name": "Curl de bíceps con mancuerna",
    "slug": "dumbbell-biceps-curl",
    "equipment": "dumbbell",
    "bodyPart": "arms",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa los bíceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_incline_curl": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-incline-biceps-curl.gif",
    "name": "Curl de bíceps inclinado con mancuerna",
    "slug": "dumbbell-incline-biceps-curl",
    "equipment": "dumbbell",
    "bodyPart": "arms",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa los bíceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_incline_biceps_curl_stretch": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-incline-biceps-curl.gif",
    "name": "Curl de bíceps inclinado con mancuerna",
    "slug": "dumbbell-incline-biceps-curl",
    "equipment": "dumbbell",
    "bodyPart": "arms",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa los bíceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_hammer_curl": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-hammer-curl.gif",
    "name": "Curl martillo con mancuerna",
    "slug": "dumbbell-hammer-curl",
    "equipment": "dumbbell",
    "bodyPart": "arms",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa los bíceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_hammer_curl_arms": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-hammer-curl.gif",
    "name": "Curl martillo con mancuerna",
    "slug": "dumbbell-hammer-curl",
    "equipment": "dumbbell",
    "bodyPart": "arms",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa los bíceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_overhead_triceps_extension": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/dumbbell-seated-triceps-extension.gif",
    "name": "Extensión de tríceps con mancuerna, sentado",
    "slug": "dumbbell-seated-triceps-extension",
    "equipment": "dumbbell",
    "bodyPart": "arms",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "delts"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa los tríceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_romanian_deadlift": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-romanian-deadlift.gif",
    "name": "Peso muerto rumano con mancuerna",
    "slug": "dumbbell-romanian-deadlift",
    "equipment": "dumbbell",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "lats",
      "traps",
      "forearms",
      "spine"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_romanian_deadlift_legs": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-romanian-deadlift.gif",
    "name": "Peso muerto rumano con mancuerna",
    "slug": "dumbbell-romanian-deadlift",
    "equipment": "dumbbell",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "lats",
      "traps",
      "forearms",
      "spine"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "dumbbell_lunge_quads": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-lunge.gif",
    "name": "Zancada con mancuerna",
    "slug": "dumbbell-lunge",
    "equipment": "dumbbell",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "calves"
    ],
    "instructions": [
      "Coge una mancuerna en cada mano (o la indicada) con un peso adecuado.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "barbell_bench_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif",
    "name": "Press de banca con barra",
    "slug": "barbell-bench-press",
    "equipment": "barbell",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Carga el peso adecuado en la barra y adopta la postura inicial.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "barbell_back_squat": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-full-squat.gif",
    "name": "Sentadilla completa con barra",
    "slug": "barbell-full-squat",
    "equipment": "barbell",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "calves"
    ],
    "instructions": [
      "Carga el peso adecuado en la barra y adopta la postura inicial.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "barbell_overhead_press": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/barbell-standing-close-grip-military-press.gif",
    "name": "Press militar con barra, de pie, con agarre cerrado",
    "slug": "barbell-standing-close-grip-military-press",
    "equipment": "barbell",
    "bodyPart": "shoulders",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "triceps"
    ],
    "instructions": [
      "Carga el peso adecuado en la barra y adopta la postura inicial.",
      "Activa los hombros antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "barbell_bent_over_row": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/barbell-bent-over-row.gif",
    "name": "Remo inclinado con barra",
    "slug": "barbell-bent-over-row",
    "equipment": "barbell",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Carga el peso adecuado en la barra y adopta la postura inicial.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "barbell_hip_thrust": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-glute-bridge-two-legs-on-bench-male.gif",
    "name": "Puente de glúteos con barra, a dos piernas en banco",
    "slug": "barbell-glute-bridge-two-legs-on-bench-male",
    "equipment": "barbell",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "instructions": [
      "Carga el peso adecuado en la barra y adopta la postura inicial.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "deadlift_barbell": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif",
    "name": "Peso muerto con barra",
    "slug": "barbell-deadlift",
    "equipment": "barbell",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "lats",
      "traps",
      "forearms",
      "spine"
    ],
    "instructions": [
      "Carga el peso adecuado en la barra y adopta la postura inicial.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "cable_standing_fly": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-standing-fly.gif",
    "name": "Apertura en polea, de pie",
    "slug": "cable-standing-fly",
    "equipment": "cable",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "delts"
    ],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "cable_high_to_low_flyes": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-standing-fly.gif",
    "name": "Apertura en polea, de pie",
    "slug": "cable-standing-fly",
    "equipment": "cable",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "delts"
    ],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "cable_lat_pulldown_full": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-lat-pulldown-full-range-of-motion.gif",
    "name": "Jalón al pecho en polea, en rango completo",
    "slug": "cable-lat-pulldown-full-range-of-motion",
    "equipment": "cable",
    "bodyPart": "back",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts"
    ],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa los dorsales antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "cable_seated_row_low": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-seated-row.gif",
    "name": "Remo sentado en polea",
    "slug": "cable-seated-row",
    "equipment": "cable",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "cable_triceps_pushdown_vbar": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-triceps-pushdown-v-bar.gif",
    "name": "Pushdown en polea con barra en V, tríceps",
    "slug": "cable-triceps-pushdown-v-bar",
    "equipment": "cable",
    "bodyPart": "arms",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "delts"
    ],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa los tríceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "cable_triceps_rope_pushdown": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-triceps-pushdown-v-bar.gif",
    "name": "Pushdown en polea con barra en V, tríceps",
    "slug": "cable-triceps-pushdown-v-bar",
    "equipment": "cable",
    "bodyPart": "arms",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "delts"
    ],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa los tríceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "cable_lateral_raise": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-lateral-raise.gif",
    "name": "Elevación lateral en polea",
    "slug": "cable-lateral-raise",
    "equipment": "cable",
    "bodyPart": "shoulders",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "traps"
    ],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa los hombros antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "cable_lateral_raise_single": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-lateral-raise.gif",
    "name": "Elevación lateral en polea",
    "slug": "cable-lateral-raise",
    "equipment": "cable",
    "bodyPart": "shoulders",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "traps"
    ],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa los hombros antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "cable_bicep_curl_standing": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-curl.gif",
    "name": "Curl en polea",
    "slug": "cable-curl",
    "equipment": "cable",
    "bodyPart": "arms",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa los bíceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "cable_biceps_curl": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-curl.gif",
    "name": "Curl en polea",
    "slug": "cable-curl",
    "equipment": "cable",
    "bodyPart": "arms",
    "targetMuscle": "biceps",
    "secondaryMuscles": [
      "forearms"
    ],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa los bíceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "cable_kneeling_crunch_core": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/cable-kneeling-crunch.gif",
    "name": "Crunch en polea, de rodillas",
    "slug": "cable-kneeling-crunch",
    "equipment": "cable",
    "bodyPart": "core",
    "targetMuscle": "abs",
    "secondaryMuscles": [],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa el core antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "cable_deadlift_glutes": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/cable-deadlift.gif",
    "name": "Peso muerto en polea",
    "slug": "cable-deadlift",
    "equipment": "cable",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "lats",
      "traps",
      "forearms",
      "spine"
    ],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "cable_face_pull": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-standing-rear-delt-row-with-rope.gif",
    "name": "Remo de deltoides posterior en polea, de pie, con cuerda",
    "slug": "cable-standing-rear-delt-row-with-rope",
    "equipment": "cable",
    "bodyPart": "shoulders",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "biceps",
      "forearms"
    ],
    "instructions": [
      "Ajusta la polea a la altura indicada y selecciona el peso.",
      "Activa los hombros antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "smith_squat_full": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/smith-squat.gif",
    "name": "Sentadilla en máquina Smith",
    "slug": "smith-squat",
    "equipment": "smith",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "calves"
    ],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "smith_single_leg_split_squat_bulgarian": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/smith-single-leg-split-squat.gif",
    "name": "Split squat en máquina Smith, a una pierna",
    "slug": "smith-single-leg-split-squat",
    "equipment": "smith",
    "bodyPart": "legs",
    "targetMuscle": "quads",
    "secondaryMuscles": [
      "glutes",
      "hamstrings",
      "calves"
    ],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa los cuádriceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "smith_hack_squat_legs": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/smith-hack-squat.gif",
    "name": "Hack squat en máquina Smith",
    "slug": "smith-hack-squat",
    "equipment": "smith",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "calves"
    ],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "smith_bench_press_flat": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/smith-bench-press.gif",
    "name": "Press de banca en máquina Smith",
    "slug": "smith-bench-press",
    "equipment": "smith",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "smith_incline_bench_press_chest": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/smith-incline-bench-press.gif",
    "name": "Press en máquina Smith, en banco inclinado",
    "slug": "smith-incline-bench-press",
    "equipment": "smith",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts"
    ],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "smith_seated_shoulder_press_military": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/smith-seated-shoulder-press.gif",
    "name": "Press de hombros en máquina Smith, sentado",
    "slug": "smith-seated-shoulder-press",
    "equipment": "smith",
    "bodyPart": "shoulders",
    "targetMuscle": "delts",
    "secondaryMuscles": [
      "triceps"
    ],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa los hombros antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "smith_bent_over_row_back": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/smith-bent-over-row.gif",
    "name": "Remo inclinado en máquina Smith",
    "slug": "smith-bent-over-row",
    "equipment": "smith",
    "bodyPart": "back",
    "targetMuscle": "upper-back",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts",
      "lats"
    ],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa la espalda alta antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "smith_deadlift_posterior": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/smith-deadlift.gif",
    "name": "Peso muerto en máquina Smith",
    "slug": "smith-deadlift",
    "equipment": "smith",
    "bodyPart": "legs",
    "targetMuscle": "glutes",
    "secondaryMuscles": [
      "hamstrings",
      "lats",
      "traps",
      "forearms",
      "spine"
    ],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa los glúteos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "smith_standing_leg_calf_raise_calves": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/smith-standing-leg-calf-raise.gif",
    "name": "Elevación de talones en máquina Smith, de pie, pierna",
    "slug": "smith-standing-leg-calf-raise",
    "equipment": "smith",
    "bodyPart": "legs",
    "targetMuscle": "calves",
    "secondaryMuscles": [],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa los gemelos antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "smith_shrug_traps": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/smith-shrug.gif",
    "name": "Encogimiento en máquina Smith",
    "slug": "smith-shrug",
    "equipment": "smith",
    "bodyPart": "back",
    "targetMuscle": "traps",
    "secondaryMuscles": [
      "delts",
      "forearms"
    ],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa los trapecios antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "smith_close_grip_bench_press_triceps": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/smith-close-grip-bench-press.gif",
    "name": "Press de banca en máquina Smith, con agarre cerrado",
    "slug": "smith-close-grip-bench-press",
    "equipment": "smith",
    "bodyPart": "arms",
    "targetMuscle": "triceps",
    "secondaryMuscles": [
      "delts"
    ],
    "instructions": [
      "Coloca la barra en la máquina Smith a la altura adecuada.",
      "Activa los tríceps antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "bodyweight_dips": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/chest-dip-on-dip-pull-up-cage.gif",
    "name": "Fondos de pecho en jaula de dominadas",
    "slug": "chest-dip-on-dip-pull-up-cage",
    "equipment": "bodyweight",
    "bodyPart": "chest",
    "targetMuscle": "pectorals",
    "secondaryMuscles": [
      "triceps",
      "delts",
      "biceps",
      "forearms"
    ],
    "instructions": [
      "Adopta la postura inicial con buena alineación corporal.",
      "Activa el pectoral antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "pull_up": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif",
    "name": "Dominada, asistido",
    "slug": "assisted-pull-up",
    "equipment": "bodyweight",
    "bodyPart": "back",
    "targetMuscle": "lats",
    "secondaryMuscles": [
      "biceps",
      "forearms",
      "delts"
    ],
    "instructions": [
      "Adopta la postura inicial con buena alineación corporal.",
      "Activa los dorsales antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  },
  "bodyweight_hanging_leg_raises": {
    "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/hanging-leg-raise.gif",
    "name": "Elevación de piernas en barra",
    "slug": "hanging-leg-raise",
    "equipment": "bodyweight",
    "bodyPart": "core",
    "targetMuscle": "abs",
    "secondaryMuscles": [],
    "instructions": [
      "Adopta la postura inicial con buena alineación corporal.",
      "Activa el core antes de iniciar el movimiento.",
      "Realiza el movimiento de forma controlada manteniendo la técnica.",
      "Vuelve a la posición inicial controlando la fase excéntrica.",
      "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
    ]
  }
};

/**
 * Muscle group default animations from ExerciseDB for machines
 */
export const MUSCLE_FALLBACK_ANIMATIONS: Record<string, ExerciseAnimationInfo> = {
  chest: {
  "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-chest-press.gif",
  "name": "Press de pecho en máquina",
  "slug": "lever-chest-press",
  "equipment": "lever",
  "bodyPart": "chest",
  "targetMuscle": "pectorals",
  "secondaryMuscles": [
    "triceps",
    "delts"
  ],
  "instructions": [
    "Ajusta la máquina a tu medida y selecciona la carga.",
    "Activa el pectoral antes de iniciar el movimiento.",
    "Realiza el movimiento de forma controlada manteniendo la técnica.",
    "Vuelve a la posición inicial controlando la fase excéntrica.",
    "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
  ]
},
  lats: {
  "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/lever-front-pulldown.gif",
  "name": "Jalón al pecho en máquina, frontal",
  "slug": "lever-front-pulldown",
  "equipment": "lever",
  "bodyPart": "back",
  "targetMuscle": "lats",
  "secondaryMuscles": [
    "biceps",
    "forearms",
    "delts"
  ],
  "instructions": [
    "Ajusta la máquina a tu medida y selecciona la carga.",
    "Activa los dorsales antes de iniciar el movimiento.",
    "Realiza el movimiento de forma controlada manteniendo la técnica.",
    "Vuelve a la posición inicial controlando la fase excéntrica.",
    "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
  ]
},
  upper_back: {
  "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-seated-row.gif",
  "name": "Remo sentado en máquina",
  "slug": "lever-seated-row",
  "equipment": "lever",
  "bodyPart": "back",
  "targetMuscle": "upper-back",
  "secondaryMuscles": [
    "biceps",
    "forearms",
    "delts",
    "lats"
  ],
  "instructions": [
    "Ajusta la máquina a tu medida y selecciona la carga.",
    "Activa la espalda alta antes de iniciar el movimiento.",
    "Realiza el movimiento de forma controlada manteniendo la técnica.",
    "Vuelve a la posición inicial controlando la fase excéntrica.",
    "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
  ]
},
  lower_back: {
  "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/spine/lever-back-extension.gif",
  "name": "Extensión en máquina, espalda",
  "slug": "lever-back-extension",
  "equipment": "lever",
  "bodyPart": "back",
  "targetMuscle": "spine",
  "secondaryMuscles": [
    "glutes",
    "hamstrings"
  ],
  "instructions": [
    "Ajusta la máquina a tu medida y selecciona la carga.",
    "Activa la zona lumbar antes de iniciar el movimiento.",
    "Realiza el movimiento de forma controlada manteniendo la técnica.",
    "Vuelve a la posición inicial controlando la fase excéntrica.",
    "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
  ]
},
  shoulders: {
  "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/lever-shoulder-press.gif",
  "name": "Press de hombros en máquina",
  "slug": "lever-shoulder-press",
  "equipment": "lever",
  "bodyPart": "shoulders",
  "targetMuscle": "delts",
  "secondaryMuscles": [
    "triceps"
  ],
  "instructions": [
    "Ajusta la máquina a tu medida y selecciona la carga.",
    "Activa los hombros antes de iniciar el movimiento.",
    "Realiza el movimiento de forma controlada manteniendo la técnica.",
    "Vuelve a la posición inicial controlando la fase excéntrica.",
    "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
  ]
},
  biceps: {
  "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/lever-bicep-curl.gif",
  "name": "Curl de bíceps en máquina",
  "slug": "lever-bicep-curl",
  "equipment": "lever",
  "bodyPart": "arms",
  "targetMuscle": "biceps",
  "secondaryMuscles": [
    "forearms"
  ],
  "instructions": [
    "Ajusta la máquina a tu medida y selecciona la carga.",
    "Activa los bíceps antes de iniciar el movimiento.",
    "Realiza el movimiento de forma controlada manteniendo la técnica.",
    "Vuelve a la posición inicial controlando la fase excéntrica.",
    "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
  ]
},
  triceps: {
  "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/lever-seated-dip.gif",
  "name": "Fondo en máquina, sentado",
  "slug": "lever-seated-dip",
  "equipment": "lever",
  "bodyPart": "arms",
  "targetMuscle": "triceps",
  "secondaryMuscles": [
    "delts",
    "pectorals"
  ],
  "instructions": [
    "Ajusta la máquina a tu medida y selecciona la carga.",
    "Activa los tríceps antes de iniciar el movimiento.",
    "Realiza el movimiento de forma controlada manteniendo la técnica.",
    "Vuelve a la posición inicial controlando la fase excéntrica.",
    "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
  ]
},
  quadriceps: {
  "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-alternate-leg-press.gif",
  "name": "Prensa de piernas en máquina, alternado",
  "slug": "lever-alternate-leg-press",
  "equipment": "lever",
  "bodyPart": "legs",
  "targetMuscle": "quads",
  "secondaryMuscles": [
    "triceps",
    "delts"
  ],
  "instructions": [
    "Ajusta la máquina a tu medida y selecciona la carga.",
    "Activa los cuádriceps antes de iniciar el movimiento.",
    "Realiza el movimiento de forma controlada manteniendo la técnica.",
    "Vuelve a la posición inicial controlando la fase excéntrica.",
    "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
  ]
},
  hamstrings: {
  "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-seated-leg-curl.gif",
  "name": "Curl femoral en máquina, sentado",
  "slug": "lever-seated-leg-curl",
  "equipment": "lever",
  "bodyPart": "legs",
  "targetMuscle": "hamstrings",
  "secondaryMuscles": [
    "glutes",
    "calves"
  ],
  "instructions": [
    "Ajusta la máquina a tu medida y selecciona la carga.",
    "Activa los isquiotibiales antes de iniciar el movimiento.",
    "Realiza el movimiento de forma controlada manteniendo la técnica.",
    "Vuelve a la posición inicial controlando la fase excéntrica.",
    "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
  ]
},
  glutes: {
  "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/lever-deadlift.gif",
  "name": "Peso muerto en máquina",
  "slug": "lever-deadlift",
  "equipment": "lever",
  "bodyPart": "legs",
  "targetMuscle": "glutes",
  "secondaryMuscles": [
    "hamstrings",
    "lats",
    "traps",
    "forearms",
    "spine"
  ],
  "instructions": [
    "Ajusta la máquina a tu medida y selecciona la carga.",
    "Activa los glúteos antes de iniciar el movimiento.",
    "Realiza el movimiento de forma controlada manteniendo la técnica.",
    "Vuelve a la posición inicial controlando la fase excéntrica.",
    "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
  ]
},
  calves: {
  "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/lever-standing-calf-raise.gif",
  "name": "Elevación de talones en máquina, de pie",
  "slug": "lever-standing-calf-raise",
  "equipment": "lever",
  "bodyPart": "legs",
  "targetMuscle": "calves",
  "secondaryMuscles": [],
  "instructions": [
    "Ajusta la máquina a tu medida y selecciona la carga.",
    "Activa los gemelos antes de iniciar el movimiento.",
    "Realiza el movimiento de forma controlada manteniendo la técnica.",
    "Vuelve a la posición inicial controlando la fase excéntrica.",
    "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
  ]
},
  abdominals: {
  "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/lever-seated-crunch.gif",
  "name": "Crunch en máquina, sentado",
  "slug": "lever-seated-crunch",
  "equipment": "lever",
  "bodyPart": "core",
  "targetMuscle": "abs",
  "secondaryMuscles": [],
  "instructions": [
    "Ajusta la máquina a tu medida y selecciona la carga.",
    "Activa el core antes de iniciar el movimiento.",
    "Realiza el movimiento de forma controlada manteniendo la técnica.",
    "Vuelve a la posición inicial controlando la fase excéntrica.",
    "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
  ]
},
  traps: {
  "gifUrl": "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/lever-shrug.gif",
  "name": "Encogimiento en máquina",
  "slug": "lever-shrug",
  "equipment": "lever",
  "bodyPart": "back",
  "targetMuscle": "traps",
  "secondaryMuscles": [
    "delts",
    "forearms"
  ],
  "instructions": [
    "Ajusta la máquina a tu medida y selecciona la carga.",
    "Activa los trapecios antes de iniciar el movimiento.",
    "Realiza el movimiento de forma controlada manteniendo la técnica.",
    "Vuelve a la posición inicial controlando la fase excéntrica.",
    "Mantén la respiración: exhala en el esfuerzo, inhala al volver."
  ]
}
};

/**
 * Smart resolver to obtain ExerciseDB GIF animation and step-by-step instructions for ANY exercise
 * strictly respecting whether the exercise is Free Weight (Dumbbell, Barbell, Cable, Bodyweight) or Machine.
 */
export function getExerciseAnimation(
  exercise?: {
    exercise_template_id?: string;
    id?: string;
    title?: string;
    muscle_group?: string;
    equipment_category?: string;
    gif_url?: string;
  } | null
): ExerciseAnimationInfo {
  if (!exercise) {
    return MUSCLE_FALLBACK_ANIMATIONS.chest;
  }

  // 1. Direct template ID match
  const templateId = exercise.exercise_template_id || exercise.id;
  if (templateId && EXERCISE_ANIMATION_MAP[templateId]) {
    return EXERCISE_ANIMATION_MAP[templateId];
  }

  // 2. If exercise has direct gif_url from ExerciseDB
  if (exercise.gif_url) {
    return {
      gifUrl: exercise.gif_url,
      name: exercise.title || 'Animación ExerciseDB',
      slug: templateId || 'exercise-anim',
      equipment: exercise.equipment_category || 'dumbbell',
      bodyPart: exercise.muscle_group || 'delts',
      targetMuscle: exercise.muscle_group || 'delts',
      instructions: [
        'Adopta la postura inicial estabilizando el tronco y las articulaciones implicadas.',
        'Inicia el movimiento guiando con el músculo diana de forma estricta sin balanceos.',
        'Alcanza el punto de máxima contracción manteniendo la tensión durante 1 segundo.',
        'Controla la fase excéntrica resistiendo el retorno durante 2-3 segundos.'
      ]
    };
  }

  const titleLower = (exercise.title || '').toLowerCase();
  const eq = (exercise.equipment_category || '').toLowerCase();

  // 3. STRICT CHECK: DUMBBELL EXERCISES (Mancuernas)
  const isDumbbell = eq === 'dumbbell' || titleLower.includes('mancuerna') || titleLower.includes('dumbbell');
  if (isDumbbell) {
    if (titleLower.includes('lateral') || titleLower.includes('elevacion lateral') || titleLower.includes('elevación lateral')) {
      return EXERCISE_ANIMATION_MAP['dumbbell_lateral_raise'];
    }
    if (titleLower.includes('inclinad') && (titleLower.includes('press') || titleLower.includes('banca') || titleLower.includes('pecho'))) {
      return EXERCISE_ANIMATION_MAP['dumbbell_incline_bench_press_upper'];
    }
    if (titleLower.includes('press') || titleLower.includes('banca') || titleLower.includes('pecho')) {
      return EXERCISE_ANIMATION_MAP['dumbbell_bench_press_flat'];
    }
    if (titleLower.includes('militar') || titleLower.includes('shoulder') || titleLower.includes('hombro')) {
      return EXERCISE_ANIMATION_MAP['dumbbell_seated_shoulder_press_delts'];
    }
    if (titleLower.includes('pajaro') || titleLower.includes('pájaro') || titleLower.includes('rear delt') || titleLower.includes('posterior')) {
      return EXERCISE_ANIMATION_MAP['dumbbell_rear_delt_raise_fly'];
    }
    if (titleLower.includes('remo') || titleLower.includes('row')) {
      return EXERCISE_ANIMATION_MAP['dumbbell_one_arm_row'];
    }
    if (titleLower.includes('martillo') || titleLower.includes('hammer')) {
      return EXERCISE_ANIMATION_MAP['dumbbell_hammer_curl'];
    }
    if (titleLower.includes('inclinad') && (titleLower.includes('curl') || titleLower.includes('bicep'))) {
      return EXERCISE_ANIMATION_MAP['dumbbell_incline_curl'];
    }
    if (titleLower.includes('curl') || titleLower.includes('bicep')) {
      return EXERCISE_ANIMATION_MAP['dumbbell_biceps_curl_standing'];
    }
    if (titleLower.includes('tricep') || titleLower.includes('copa') || titleLower.includes('overhead')) {
      return EXERCISE_ANIMATION_MAP['dumbbell_overhead_triceps_extension'];
    }
    if (titleLower.includes('rumano') || titleLower.includes('rdl') || titleLower.includes('deadlift') || titleLower.includes('muerto')) {
      return EXERCISE_ANIMATION_MAP['dumbbell_romanian_deadlift'];
    }
    if (titleLower.includes('zancada') || titleLower.includes('lunge')) {
      return EXERCISE_ANIMATION_MAP['dumbbell_lunge_quads'];
    }
    // Dumbbell fallback
    const mg = exercise.muscle_group || 'shoulders';
    if (mg === 'shoulders' || mg === 'delts') return EXERCISE_ANIMATION_MAP['dumbbell_lateral_raise'];
    if (mg === 'biceps') return EXERCISE_ANIMATION_MAP['dumbbell_biceps_curl_standing'];
    if (mg === 'triceps') return EXERCISE_ANIMATION_MAP['dumbbell_overhead_triceps_extension'];
    if (mg === 'chest') return EXERCISE_ANIMATION_MAP['dumbbell_bench_press_flat'];
    if (mg === 'upper_back' || mg === 'lats') return EXERCISE_ANIMATION_MAP['dumbbell_one_arm_row'];
    return EXERCISE_ANIMATION_MAP['dumbbell_lateral_raise'];
  }

  // 4. STRICT CHECK: BARBELL EXERCISES (Barras)
  const isBarbell = eq === 'barbell' || titleLower.includes('barra') || titleLower.includes('barbell');
  if (isBarbell) {
    if (titleLower.includes('inclinad') && titleLower.includes('press')) {
      return EXERCISE_ANIMATION_MAP['barbell_bench_press']; // fallback or exact
    }
    if (titleLower.includes('bench') || titleLower.includes('banca') || titleLower.includes('pecho')) {
      return EXERCISE_ANIMATION_MAP['barbell_bench_press'];
    }
    if (titleLower.includes('squat') || titleLower.includes('sentadilla')) {
      return EXERCISE_ANIMATION_MAP['barbell_back_squat'];
    }
    if (titleLower.includes('militar') || titleLower.includes('ohp') || titleLower.includes('hombro')) {
      return EXERCISE_ANIMATION_MAP['barbell_overhead_press'];
    }
    if (titleLower.includes('remo') || titleLower.includes('row')) {
      return EXERCISE_ANIMATION_MAP['barbell_bent_over_row'];
    }
    if (titleLower.includes('hip thrust') || titleLower.includes('puente')) {
      return EXERCISE_ANIMATION_MAP['barbell_hip_thrust'];
    }
    if (titleLower.includes('deadlift') || titleLower.includes('peso muerto')) {
      return EXERCISE_ANIMATION_MAP['deadlift_barbell'];
    }
    return EXERCISE_ANIMATION_MAP['barbell_bench_press'];
  }

  // 5. STRICT CHECK: CABLE EXERCISES (Poleas)
  const isCable = eq === 'cable' || titleLower.includes('polea') || titleLower.includes('cable');
  if (isCable) {
    if (titleLower.includes('lateral') || titleLower.includes('elevacion') || titleLower.includes('elevación')) {
      return EXERCISE_ANIMATION_MAP['cable_lateral_raise_single'];
    }
    if (titleLower.includes('tricep') || titleLower.includes('pushdown')) {
      return EXERCISE_ANIMATION_MAP['cable_triceps_pushdown_vbar'];
    }
    if (titleLower.includes('curl') || titleLower.includes('bicep')) {
      return EXERCISE_ANIMATION_MAP['cable_bicep_curl_standing'];
    }
    if (titleLower.includes('jalon') || titleLower.includes('jalón') || titleLower.includes('pulldown')) {
      return EXERCISE_ANIMATION_MAP['cable_lat_pulldown_full'];
    }
    if (titleLower.includes('remo') || titleLower.includes('row')) {
      return EXERCISE_ANIMATION_MAP['cable_seated_row_low'];
    }
    if (titleLower.includes('cruce') || titleLower.includes('apertura') || titleLower.includes('fly')) {
      return EXERCISE_ANIMATION_MAP['cable_standing_fly'];
    }
    if (titleLower.includes('face pull') || titleLower.includes('posterior')) {
      return EXERCISE_ANIMATION_MAP['cable_face_pull'];
    }
    if (titleLower.includes('crunch') || titleLower.includes('abdomen')) {
      return EXERCISE_ANIMATION_MAP['cable_kneeling_crunch_core'];
    }
    return EXERCISE_ANIMATION_MAP['cable_standing_fly'];
  }

  // 6. STRICT CHECK: SMITH MACHINE (Multipower)
  const isSmith = eq === 'smith' || titleLower.includes('smith') || titleLower.includes('multipower');
  if (isSmith) {
    if (titleLower.includes('bulgar') || titleLower.includes('búlgar') || titleLower.includes('split')) {
      return EXERCISE_ANIMATION_MAP['smith_single_leg_split_squat_bulgarian'];
    }
    if (titleLower.includes('hack')) {
      return EXERCISE_ANIMATION_MAP['smith_hack_squat_legs'];
    }
    if (titleLower.includes('squat') || titleLower.includes('sentadilla')) {
      return EXERCISE_ANIMATION_MAP['smith_squat_full'];
    }
    if (titleLower.includes('inclinad') && titleLower.includes('press')) {
      return EXERCISE_ANIMATION_MAP['smith_incline_bench_press_chest'];
    }
    if (titleLower.includes('press') && titleLower.includes('banca')) {
      return EXERCISE_ANIMATION_MAP['smith_bench_press_flat'];
    }
    if (titleLower.includes('militar') || titleLower.includes('shoulder')) {
      return EXERCISE_ANIMATION_MAP['smith_seated_shoulder_press_military'];
    }
    if (titleLower.includes('remo') || titleLower.includes('row')) {
      return EXERCISE_ANIMATION_MAP['smith_bent_over_row_back'];
    }
    if (titleLower.includes('deadlift') || titleLower.includes('peso muerto')) {
      return EXERCISE_ANIMATION_MAP['smith_deadlift_posterior'];
    }
    if (titleLower.includes('gemelo') || titleLower.includes('calf')) {
      return EXERCISE_ANIMATION_MAP['smith_standing_leg_calf_raise_calves'];
    }
    if (titleLower.includes('shrug') || titleLower.includes('trapecio')) {
      return EXERCISE_ANIMATION_MAP['smith_shrug_traps'];
    }
    return EXERCISE_ANIMATION_MAP['smith_squat_full'];
  }

  // 7. STRICT CHECK: BODYWEIGHT (Autocarga / Dominadas / Fondos)
  const isBodyweight = eq === 'none' || titleLower.includes('dominada') || titleLower.includes('fondo') || titleLower.includes('pull-up') || titleLower.includes('dip');
  if (isBodyweight) {
    if (titleLower.includes('fondo') || titleLower.includes('dip') || titleLower.includes('paralela')) {
      return EXERCISE_ANIMATION_MAP['bodyweight_dips'];
    }
    if (titleLower.includes('dominada') || titleLower.includes('pull-up') || titleLower.includes('chin-up')) {
      return EXERCISE_ANIMATION_MAP['pull_up'];
    }
    if (titleLower.includes('pierna') || titleLower.includes('leg raise') || titleLower.includes('abdominal')) {
      return EXERCISE_ANIMATION_MAP['bodyweight_hanging_leg_raises'];
    }
    return EXERCISE_ANIMATION_MAP['pull_up'];
  }

  // 8. GYM MACHINES (Technogym, Hammer, Panatta, Matrix)
  if (titleLower.includes('t-bar') || titleLower.includes('t bar') || titleLower.includes('remo en t')) {
    return EXERCISE_ANIMATION_MAP['technogym_pure_t_bar_row'];
  }
  if (titleLower.includes('deadlift') || titleLower.includes('peso muerto')) {
    return EXERCISE_ANIMATION_MAP['technogym_pure_deadlift'];
  }
  if (titleLower.includes('pulldown') || titleLower.includes('jalon') || titleLower.includes('jalón')) {
    return EXERCISE_ANIMATION_MAP['technogym_pure_pulldown'];
  }
  if (titleLower.includes('press') && (titleLower.includes('chest') || titleLower.includes('pecho') || titleLower.includes('banca'))) {
    if (titleLower.includes('inclin')) {
      return EXERCISE_ANIMATION_MAP['technogym_pure_incline_chest'];
    }
    return EXERCISE_ANIMATION_MAP['technogym_pure_chest_press'];
  }
  if (titleLower.includes('shoulder') || titleLower.includes('hombro') || titleLower.includes('militar')) {
    return EXERCISE_ANIMATION_MAP['technogym_pure_shoulder_press'];
  }
  if (titleLower.includes('lateral raise') || titleLower.includes('elevacion lateral') || titleLower.includes('elevación lateral')) {
    return EXERCISE_ANIMATION_MAP['technogym_pure_lateral_raise'];
  }
  if (titleLower.includes('leg press') || titleLower.includes('prensa')) {
    return EXERCISE_ANIMATION_MAP['technogym_pure_leg_press'];
  }
  if (titleLower.includes('hack')) {
    return EXERCISE_ANIMATION_MAP['technogym_pure_hack_squat'];
  }
  if (titleLower.includes('squat') || titleLower.includes('sentadilla')) {
    return EXERCISE_ANIMATION_MAP['technogym_pure_belt_squat'];
  }
  if (titleLower.includes('hip thrust') || titleLower.includes('glute')) {
    return EXERCISE_ANIMATION_MAP['technogym_pure_hip_thrust'];
  }
  if (titleLower.includes('bicep') || titleLower.includes('curl')) {
    return EXERCISE_ANIMATION_MAP['technogym_pure_biceps_curl'];
  }
  if (titleLower.includes('tricep') || titleLower.includes('dip') || titleLower.includes('fondo')) {
    return EXERCISE_ANIMATION_MAP['technogym_selection_seated_dip'];
  }
  if (titleLower.includes('row') || titleLower.includes('remo')) {
    return EXERCISE_ANIMATION_MAP['technogym_pure_low_row'];
  }
  if (titleLower.includes('calf') || titleLower.includes('gemelo') || titleLower.includes('talon') || titleLower.includes('talón')) {
    return EXERCISE_ANIMATION_MAP['technogym_selection_standing_calf'];
  }

  // 9. Final Fallback
  const mg = exercise.muscle_group || 'chest';
  return MUSCLE_FALLBACK_ANIMATIONS[mg] || MUSCLE_FALLBACK_ANIMATIONS.chest;
}

export const CABLE_EXERCISES_DB: ExerciseTemplate[] = [
  {
    id: 'cable_standing_fly',
    title: 'Aperturas en Poleas de Pie (Cable Crossover)',
    brand: 'General',
    model_series: 'Cable ExerciseDB',
    muscle_group: 'chest',
    other_muscles: ["shoulders"],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Cruces en polea a la altura del pecho que aíslan las fibras esternales del pectoral mayor con tensión constante durante toda la aducción horizontal.',
    setup_tips: ["Coloca las poleas a la altura de los hombros o el pecho", "Da un paso al frente con el torso ligeramente inclinado para mantener la tensión", "Junta las manos hacia el frente apretando el pecho sin flexionar los codos excesivamente"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-standing-fly.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-standing-fly.gif'
  },
  {
    id: 'cable_lat_pulldown_full',
    title: 'Jalón al Pecho en Polea Alta (Lat Pulldown)',
    brand: 'General',
    model_series: 'Cable ExerciseDB',
    muscle_group: 'lats',
    other_muscles: ["biceps", "upper_back"],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Tracción vertical clásica en polea alta con barra ergonómica para desarrollo de amplitud y grosor en el dorsal ancho.',
    setup_tips: ["Ajusta los rodillos de sujeción para que las rodillas queden fijas", "Agarra la barra algo más ancha que los hombros e inicia bajando las escápulas", "Lleva la barra hacia la parte superior del esternón sacando el pecho"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-lat-pulldown-full-range-of-motion.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-lat-pulldown-full-range-of-motion.gif'
  },
  {
    id: 'cable_seated_row_low',
    title: 'Remo Sentado en Polea Baja (Cable Seated Row)',
    brand: 'General',
    model_series: 'Cable ExerciseDB',
    muscle_group: 'upper_back',
    other_muscles: ["lats", "biceps", "traps"],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Remo en polea baja con agarre neutro estrecho para sobrecargar romboides, trapecio medio e inferior y masa dorsal.',
    setup_tips: ["Siéntate con las rodillas ligeramente flexionadas y los pies firmes en los apoyos", "Tracciona llevando los codos pegados a los costados y retrayendo las escápulas", "Controla la fase excéntrica sin encorvar la columna lumbar"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-seated-row.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-seated-row.gif'
  },
  {
    id: 'cable_triceps_pushdown_vbar',
    title: 'Extensión de Tríceps en Polea Alta con Barra en V',
    brand: 'General',
    model_series: 'Cable ExerciseDB',
    muscle_group: 'triceps',
    other_muscles: ["forearms"],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Pushdown en polea alta con barra en V que permite aplicar máxima fuerza en la cabeza lateral y medial del tríceps.',
    setup_tips: ["Mantén los codos pegados a los costados y bloqueados en su posición", "Extiende los antebrazos hacia abajo hasta el bloqueo completo sin mover los hombros", "Controla el retorno hasta que los antebrazos alcancen 90 grados"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-triceps-pushdown-v-bar.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-triceps-pushdown-v-bar.gif'
  },
  {
    id: 'cable_lateral_raise_single',
    title: 'Elevaciones Laterales en Polea (Cable Lateral Raise)',
    brand: 'General',
    model_series: 'Cable ExerciseDB',
    muscle_group: 'shoulders',
    other_muscles: ["traps"],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Elevación lateral unilateral en polea baja que ofrece un perfil de resistencia superior a las mancuernas al mantener tensión en los primeros grados de abducción.',
    setup_tips: ["Coloca la polea a la altura del tobillo o la rodilla", "Cruza el cable por detrás o delante del cuerpo y eleva el brazo en el plano escapular (30° adelantado)", "Lleva la mano hasta la altura del hombro sin encoger el cuello"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-lateral-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-lateral-raise.gif'
  },
  {
    id: 'cable_bicep_curl_standing',
    title: 'Curl de Bíceps en Polea Baja (Cable Bicep Curl)',
    brand: 'General',
    model_series: 'Cable ExerciseDB',
    muscle_group: 'biceps',
    other_muscles: ["forearms"],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Flexión de codos en polea baja con barra recta o EZ para tensión constante desde el inicio del recorrido.',
    setup_tips: ["Mantén los hombros relajados y los codos fijos a ambos lados del torso", "Flexiona los brazos contrayendo los bíceps en el punto máximo de acortamiento", "Baja en 2-3 segundos manteniendo tensión en los tendones distales"],
    image_url: '',
    gif_url: ''
  },
  {
    id: 'cable_kneeling_crunch_core',
    title: 'Crunch Abdominal en Polea de Rodillas (Cable Kneeling Crunch)',
    brand: 'General',
    model_series: 'Cable ExerciseDB',
    muscle_group: 'abdominals',
    other_muscles: [],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Flexión espinal resistida con cuerda en polea alta que permite sobrecargar el recto abdominal con carga progresiva.',
    setup_tips: ["Ponte de rodillas frente a la polea y sujeta la cuerda a ambos lados de la cabeza", "Flexiona el tronco enrollando la columna hacia la pelvis sin mover las caderas", "Aprieta el abdomen 1 segundo y sube controlando el estiramiento"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/cable-kneeling-crunch.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/cable-kneeling-crunch.gif'
  },
  {
    id: 'cable_deadlift_glutes',
    title: 'Peso Muerto en Polea Baja (Cable Deadlift)',
    brand: 'General',
    model_series: 'Cable ExerciseDB',
    muscle_group: 'glutes',
    other_muscles: ["hamstrings", "lower_back"],
    equipment_category: 'cable',
    exercise_type: 'weight_reps',
    description: 'Bisagra de cadera con tracción desde polea baja ideal para estímulo glúteo con tensión horizontal sostenida.',
    setup_tips: ["Coloca los pies al ancho de hombros y empuja la cadera hacia atrás", "Mantén la columna neutra y extiende la cadera apretando los glúteos arriba", "No flexiones excesivamente las rodillas para mantener el foco en la cadena posterior"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/cable-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/cable-deadlift.gif'
  },
];

export const DUMBBELL_EXERCISES_DB: ExerciseTemplate[] = [
  {
    id: 'dumbbell_bench_press_flat',
    title: 'Press de Banca Plano con Mancuernas (Dumbbell Bench Press)',
    brand: 'General',
    model_series: 'Dumbbell ExerciseDB',
    muscle_group: 'chest',
    other_muscles: ["triceps", "shoulders"],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Press básico con mancuernas en banco plano que ofrece mayor rango de movimiento y convergencia natural que la barra.',
    setup_tips: ["Túmbate con las mancuernas apoyadas sobre el pecho y los pies planos en el suelo", "Retrae las escápulas y mantén un arco fisiológico lumbar seguro", "Empuja en trayectoria ligeramente convergente hasta extender los brazos sin chocar las mancuernas"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif'
  },
  {
    id: 'dumbbell_incline_bench_press_upper',
    title: 'Press Inclinado con Mancuernas (Incline Dumbbell Press)',
    brand: 'General',
    model_series: 'Dumbbell ExerciseDB',
    muscle_group: 'chest',
    other_muscles: ["shoulders", "triceps"],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Press en banco a 30°-45° enfocado en el haz clavicular del pectoral mayor y la deltoides anterior.',
    setup_tips: ["Ajusta el banco a 30° para maximizar el pectoral superior sin derivar tensión excesiva al deltoides", "Baja las mancuernas de forma controlada hasta la altura del pecho", "Sube con fuerza manteniendo los antebrazos perpendiculares al suelo"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif'
  },
  {
    id: 'dumbbell_seated_shoulder_press_delts',
    title: 'Press de Hombros Sentado con Mancuernas (Seated Dumbbell Press)',
    brand: 'General',
    model_series: 'Dumbbell ExerciseDB',
    muscle_group: 'shoulders',
    other_muscles: ["triceps", "traps"],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Press vertical sentado con mancuernas para deltoides anterior y lateral con excelente estabilidad lumbar.',
    setup_tips: ["Coloca el respaldo casi vertical (80°-85°)", "Inicia con las mancuernas a la altura de las orejas con agarre neutro o semi-prono", "Empuja hacia arriba sin arquear la espalda baja ni hiperextender el cuello"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-seated-shoulder-press-parallel-grip.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-seated-shoulder-press-parallel-grip.gif'
  },
  {
    id: 'dumbbell_lateral_raise_standing',
    title: 'Elevaciones Laterales con Mancuernas (Dumbbell Lateral Raise)',
    brand: 'General',
    model_series: 'Dumbbell ExerciseDB',
    muscle_group: 'shoulders',
    other_muscles: ["traps"],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Aislamiento por excelencia de la cabeza lateral del deltoides para desarrollo de hombros anchos.',
    setup_tips: ["Inclina el torso 10° hacia adelante para alinear las fibras medias del deltoides con la gravedad", "Eleva las mancuernas como si vertieras dos jarras, guiando con los codos", "No superes la altura de los hombros para evitar pinzamiento subacromial"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-full-can-lateral-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-full-can-lateral-raise.gif'
  },
  {
    id: 'dumbbell_rear_delt_raise_fly',
    title: 'Pájaros con Mancuernas para Deltoides Posterior (Rear Delt Fly)',
    brand: 'General',
    model_series: 'Dumbbell ExerciseDB',
    muscle_group: 'shoulders',
    other_muscles: ["upper_back", "traps"],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Abducción horizontal del hombro inclinado para desarrollo del deltoides posterior y romboides.',
    setup_tips: ["Inclina el torso hasta quedar casi paralelo al suelo", "Abre los brazos hacia los laterales manteniendo una leve flexión fija de codos", "Concéntrate en tirar desde la parte posterior del hombro sin balancear el torso"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-rear-delt-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-rear-delt-raise.gif'
  },
  {
    id: 'dumbbell_one_arm_row_bench',
    title: 'Remo con Mancuerna a Una Mano (Single-Arm Dumbbell Row)',
    brand: 'General',
    model_series: 'Dumbbell ExerciseDB',
    muscle_group: 'upper_back',
    other_muscles: ["lats", "biceps", "forearms"],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Remo unilateral apoyado en banco que permite un enorme estiramiento del dorsal y gran sobrecarga de fuerza.',
    setup_tips: ["Apoya la rodilla y mano contrarias sobre el banco plano para un soporte rígido", "Tira de la mancuerna llevando el codo hacia el bolsillo trasero de la cadera", "Extiende el brazo abajo sintiendo el estiramiento completo del dorsal"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/dumbbell-reverse-grip-incline-bench-one-arm-row.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/dumbbell-reverse-grip-incline-bench-one-arm-row.gif'
  },
  {
    id: 'dumbbell_biceps_curl_standing',
    title: 'Curl de Bíceps con Mancuernas (Dumbbell Bicep Curl)',
    brand: 'General',
    model_series: 'Dumbbell ExerciseDB',
    muscle_group: 'biceps',
    other_muscles: ["forearms"],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Curl tradicional con supinación activa de muñeca para estímulo completo de ambas cabezas del bíceps braquial.',
    setup_tips: ["Inicia con agarre neutro a los lados del muslo y supina la muñeca mientras subes", "Mantén los codos pegados a los costados sin balancear la espalda", "Aprieta el bíceps arriba y desciende en 2 segundos controlados"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-biceps-curl.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-biceps-curl.gif'
  },
  {
    id: 'dumbbell_hammer_curl_arms',
    title: 'Curl Martillo con Mancuernas (Dumbbell Hammer Curl)',
    brand: 'General',
    model_series: 'Dumbbell ExerciseDB',
    muscle_group: 'biceps',
    other_muscles: ["forearms"],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Flexión de codos con agarre neutro constante que maximiza el reclutamiento del braquial anterior y braquiorradial.',
    setup_tips: ["Mantén las palmas mirándose durante toda la ejecución", "Flexiona el antebrazo manteniendo el codo como eje de pivote estático", "Baja con control hasta la extensión casi completa del codo"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-hammer-curl.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-hammer-curl.gif'
  },
  {
    id: 'dumbbell_incline_biceps_curl_stretch',
    title: 'Curl Inclinado en Banco con Mancuernas (Incline Dumbbell Curl)',
    brand: 'General',
    model_series: 'Dumbbell ExerciseDB',
    muscle_group: 'biceps',
    other_muscles: ["forearms"],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Curl en banco inclinado a 45°-60° que coloca la cabeza larga del bíceps en máximo estiramiento anatómico pasivo.',
    setup_tips: ["Ajusta el banco a 45°-60° y apoya completamente la espalda y la cabeza", "Deja que los brazos cuelguen rectos perpendicularmente al suelo", "Flexiona los codos manteniendo los brazos hacia atrás para no perder la tensión en estiramiento"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-incline-biceps-curl.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-incline-biceps-curl.gif'
  },
  {
    id: 'dumbbell_romanian_deadlift_legs',
    title: 'Peso Muerto Rumano con Mancuernas (Dumbbell RDL)',
    brand: 'General',
    model_series: 'Dumbbell ExerciseDB',
    muscle_group: 'hamstrings',
    other_muscles: ["glutes", "lower_back"],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Bisagra de cadera con mancuernas para sobrecarga excéntrica masiva de isquiosurales y glúteos.',
    setup_tips: ["Pies a la anchura de las caderas, rodillas con microflexión fija durante todo el ejercicio", "Empuja las caderas hacia atrás como si quisieras tocar una pared imaginaria", "Baja las mancuernas rozando las tibias hasta sentir la máxima tensión en isquiotibiales"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-romanian-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-romanian-deadlift.gif'
  },
  {
    id: 'dumbbell_lunge_quads',
    title: 'Zancadas con Mancuernas (Dumbbell Walking Lunge)',
    brand: 'General',
    model_series: 'Dumbbell ExerciseDB',
    muscle_group: 'quadriceps',
    other_muscles: ["glutes", "calves"],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Ejercicio unilateral de zancadas con mancuernas a los lados para desarrollo de fuerza, estabilidad y cuádriceps.',
    setup_tips: ["Da un paso adelante amplio descendiendo la rodilla trasera hasta casi rozar el suelo", "Mantén el torso erguido o con leve inclinación anterior para activar más el glúteo", "Empuja con el talón del pie delantero para volver a la posición de inicio"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-lunge.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-lunge.gif'
  },
];

export const SMITH_EXERCISES_DB: ExerciseTemplate[] = [
  {
    id: 'smith_squat_full',
    title: 'Sentadilla en Multipower / Smith (Smith Machine Squat)',
    brand: 'General',
    model_series: 'Smith ExerciseDB',
    muscle_group: 'quadriceps',
    other_muscles: ["glutes", "hamstrings", "calves"],
    equipment_category: 'smith',
    exercise_type: 'weight_reps',
    description: 'Sentadilla guiada en multipower que reduce los requerimientos de equilibrio y permite adelantar los pies para aislar cuádriceps.',
    setup_tips: ["Coloca los pies ligeramente adelantados respecto a la barra (15-20 cm) para enfatizar cuádriceps", "Gira la barra para desacoplar los ganchos de seguridad", "Desciende hasta que los muslos queden al menos paralelos al suelo manteniendo el torso estable"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/smith-squat.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/smith-squat.gif'
  },
  {
    id: 'smith_single_leg_split_squat_bulgarian',
    title: 'Sentadilla Búlgara en Multipower / Smith (Smith Bulgarian Split Squat)',
    brand: 'General',
    model_series: 'Smith ExerciseDB',
    muscle_group: 'quadriceps',
    other_muscles: ["glutes", "hamstrings"],
    equipment_category: 'smith',
    exercise_type: 'weight_reps',
    description: 'Sentadilla unilateral con pie trasero apoyado en banco dentro de la máquina Smith para máxima hipertrofia de pierna y glúteo con total estabilidad.',
    setup_tips: ["Apoya el empeine del pie trasero sobre un banco colocado a 60-80 cm por detrás de la barra", "Sitúa la barra sobre los trapecios y desciende en línea recta vertical", "Controla la rodilla delantera para que no colapse hacia adentro (valgo)"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/smith-single-leg-split-squat.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/smith-single-leg-split-squat.gif'
  },
  {
    id: 'smith_hack_squat_legs',
    title: 'Hack Squat en Multipower / Smith (Smith Hack Squat)',
    brand: 'General',
    model_series: 'Smith ExerciseDB',
    muscle_group: 'quadriceps',
    other_muscles: ["glutes", "calves"],
    equipment_category: 'smith',
    exercise_type: 'weight_reps',
    description: 'Variante de sentadilla con pies adelantados y torso vertical guiado en multipower que replica la cinemática de la máquina Hack tradicional.',
    setup_tips: ["Adelanta los pies 30-40 cm por delante de la línea de la barra", "Apoya la espalda firmemente y desciende flexionando las rodillas con el torso recto", "Empuja con toda la planta del pie sintiendo la tensión concentrada en el vasto interno y recto femoral"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/smith-hack-squat.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/smith-hack-squat.gif'
  },
  {
    id: 'smith_bench_press_flat',
    title: 'Press de Banca en Multipower / Smith (Smith Bench Press)',
    brand: 'General',
    model_series: 'Smith ExerciseDB',
    muscle_group: 'chest',
    other_muscles: ["triceps", "shoulders"],
    equipment_category: 'smith',
    exercise_type: 'weight_reps',
    description: 'Press de banca con barra guiada que permite llegar al fallo muscular seguro y enfocar el esfuerzo en la contracción pectoral.',
    setup_tips: ["Centra el banco plano de modo que la barra baje a la altura de la parte media del esternón", "Retrae y desciende las escápulas clavándote en el tapizado", "Empuja de forma explosiva controlada girando las muñecas para bloquear en el gancho si fuera necesario"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/smith-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/smith-bench-press.gif'
  },
  {
    id: 'smith_incline_bench_press_chest',
    title: 'Press Inclinado en Multipower / Smith (Smith Incline Press)',
    brand: 'General',
    model_series: 'Smith ExerciseDB',
    muscle_group: 'chest',
    other_muscles: ["shoulders", "triceps"],
    equipment_category: 'smith',
    exercise_type: 'weight_reps',
    description: 'Press inclinado guiado en multipower enfocado en el haz clavicular del pectoral con trayectoria fija y sin oscilaciones.',
    setup_tips: ["Alinea el banco a 30°-45° justo debajo de la guía vertical", "Baja la barra rozando suavemente la parte superior del pecho (clavículas)", "Extiende los brazos manteniendo los hombros pegados al respaldo"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/smith-incline-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/smith-incline-bench-press.gif'
  },
  {
    id: 'smith_seated_shoulder_press_military',
    title: 'Press Militar Sentado en Multipower / Smith (Smith Shoulder Press)',
    brand: 'General',
    model_series: 'Smith ExerciseDB',
    muscle_group: 'shoulders',
    other_muscles: ["triceps", "traps"],
    equipment_category: 'smith',
    exercise_type: 'weight_reps',
    description: 'Press vertical guiado para deltoides que maximiza la producción de fuerza en hombros con total seguridad en el despegue.',
    setup_tips: ["Coloca el banco en 80° justo bajo la barra para que baje por delante de la nariz hacia la barbilla", "Agarra la barra algo más ancha que los hombros con muñecas alineadas", "Empuja hacia arriba sin hiperextender el cuello"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/smith-seated-shoulder-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/smith-seated-shoulder-press.gif'
  },
  {
    id: 'smith_bent_over_row_back',
    title: 'Remo Inclinado en Multipower / Smith (Smith Bent Over Row)',
    brand: 'General',
    model_series: 'Smith ExerciseDB',
    muscle_group: 'upper_back',
    other_muscles: ["lats", "biceps", "traps"],
    equipment_category: 'smith',
    exercise_type: 'weight_reps',
    description: 'Remo horizontal guiado que elimina el esfuerzo estabilizador en el plano sagital y concentra la carga en espalda media y lats.',
    setup_tips: ["Inclina el torso a 45° manteniendo la espalda completamente recta y rodillas semiflexionadas", "Tracciona de la barra guiada hacia el ombligo retrayendo con fuerza las escápulas", "Desciende estirando los dorsales sin balancear el cuerpo"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/smith-bent-over-row.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/smith-bent-over-row.gif'
  },
  {
    id: 'smith_deadlift_posterior',
    title: 'Peso Muerto en Multipower / Smith (Smith Machine Deadlift)',
    brand: 'General',
    model_series: 'Smith ExerciseDB',
    muscle_group: 'lower_back',
    other_muscles: ["glutes", "hamstrings", "traps"],
    equipment_category: 'smith',
    exercise_type: 'weight_reps',
    description: 'Peso muerto en barra guiada ideal para sobrecarga progresiva de glúteos, erectores y cadena posterior en un plano de movimiento estricto.',
    setup_tips: ["Coloca los pies debajo de la barra con espinillas a 2 cm de la guía", "Agarra la barra, activa los dorsales y saca pecho", "Empuja con las piernas extendiendo cadera y rodillas sincronizadamente"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/smith-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/smith-deadlift.gif'
  },
  {
    id: 'smith_standing_leg_calf_raise_calves',
    title: 'Elevación de Talones de Pie en Multipower / Smith (Smith Calf Raise)',
    brand: 'General',
    model_series: 'Smith ExerciseDB',
    muscle_group: 'calves',
    other_muscles: [],
    equipment_category: 'smith',
    exercise_type: 'weight_reps',
    description: 'Elevaciones de gemelos de pie sobre un escalón o disco con la barra guiada en los hombros para máxima flexión plantar bajo carga alta.',
    setup_tips: ["Coloca las puntas de los pies sobre un step o plataforma para permitir estiramiento del talón por debajo de la horizontal", "Desciende lento sintiendo el estiramiento profundo del sóleo y gemelos durante 2 segundos", "Sube de forma potente apoyando sobre el primer metatarso y contrae arriba 1 segundo"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/smith-standing-leg-calf-raise.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/smith-standing-leg-calf-raise.gif'
  },
  {
    id: 'smith_shrug_traps',
    title: 'Encogimientos de Trapecio en Multipower / Smith (Smith Shrug)',
    brand: 'General',
    model_series: 'Smith ExerciseDB',
    muscle_group: 'traps',
    other_muscles: ["forearms"],
    equipment_category: 'smith',
    exercise_type: 'weight_reps',
    description: 'Encogimiento vertical de hombros guiado para hipertrofia masiva del trapecio superior.',
    setup_tips: ["Sujeta la barra a la anchura de hombros con los brazos rectos", "Eleva los hombros en dirección a las orejas en un movimiento puramente vertical", "Aguanta 1 segundo la contracción en la cima y desciende controladamente sin rotar los hombros"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/smith-shrug.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/smith-shrug.gif'
  },
  {
    id: 'smith_close_grip_bench_press_triceps',
    title: 'Press de Banca Cerrado en Multipower / Smith (Smith Close-Grip Press)',
    brand: 'General',
    model_series: 'Smith ExerciseDB',
    muscle_group: 'triceps',
    other_muscles: ["chest", "shoulders"],
    equipment_category: 'smith',
    exercise_type: 'weight_reps',
    description: 'Press de banca con agarre estrecho (anchura de hombros) para sobrecargar los tríceps con alta carga mecánica y total estabilidad.',
    setup_tips: ["Coloca las manos a la anchura de los hombros (no más cerrado para proteger las muñecas)", "Desciende la barra manteniendo los codos próximos al torso (a 30°-45°)", "Extiende con potencia enfocando la tensión en las tres cabezas del tríceps"],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/smith-close-grip-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/smith-close-grip-bench-press.gif'
  },
];

export const EXERCISE_DB_NEW_EXERCISES: ExerciseTemplate[] = [
  ...CABLE_EXERCISES_DB,
  ...DUMBBELL_EXERCISES_DB,
  ...SMITH_EXERCISES_DB
];
