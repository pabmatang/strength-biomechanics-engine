import { ExerciseTemplate, Routine } from '../types/workout';
import { SPANISH_GYM_MACHINES } from './spanishGymMachines';
import { FREE_EXERCISES_DATABASE } from './freeExercisesDb';
import { EXERCISE_DB_NEW_EXERCISES } from '../utils/exerciseDbAnimations';

export const EXERCISE_DATABASE: ExerciseTemplate[] = [
  ...SPANISH_GYM_MACHINES,
  ...EXERCISE_DB_NEW_EXERCISES,
  ...FREE_EXERCISES_DATABASE,
  // Free weight staples with authentic equipment images
  {
    id: 'incline_dumbbell_press',
    title: 'Press Inclinado con Mancuernas',
    brand: 'Eleiko',
    model_series: 'Evo Dumbbells & Bench',
    muscle_group: 'chest',
    other_muscles: ['shoulders', 'triceps'],
    equipment_category: 'dumbbell',
    exercise_type: 'weight_reps',
    description: 'Enfocado en la cabeza clavicular (pectoral superior) con libertad de rotación en muñecas.',
    setup_tips: ['Inclinación recomendada del banco a 30°', 'Controla la bajada hasta sentir estiramiento en el pectoral'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif'
  },
  {
    id: 'deadlift_barbell',
    title: 'Peso Muerto Convencional (Barra Olímpica)',
    brand: 'Eleiko',
    model_series: 'IPF Powerlifting Barbell',
    muscle_group: 'lower_back',
    other_muscles: ['glutes', 'hamstrings', 'traps', 'forearms'],
    equipment_category: 'barbell',
    exercise_type: 'weight_reps',
    description: 'Ejercicio básico de cadena posterior de máxima demanda neuromuscular.',
    setup_tips: ['Barra pegada a las espinillas antes de despegar', 'Empuja el suelo con las piernas en vez de tirar solo con la espalda'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif'
  },
  {
    id: 'pull_up',
    title: 'Dominadas en Barra / Jaula',
    brand: 'Eleiko',
    model_series: 'Prestera Pull-Up Station',
    muscle_group: 'lats',
    other_muscles: ['biceps', 'forearms'],
    equipment_category: 'none',
    exercise_type: 'bodyweight_reps',
    description: 'Tracción vertical fundamental con autocarga en barra de jaula.',
    setup_tips: ['Rango completo: bloqueo escapular abajo y barbilla sobre la barra arriba'],
    image_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif',
    gif_url: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/assisted-pull-up.gif'
  }
];

export const INITIAL_ROUTINES: Routine[] = [
  {
    id: 'routine_ppl_push',
    title: 'Push Day (Technogym & Hammer Strength)',
    folder_name: 'Push / Pull / Legs',
    description: 'Sesión de empuje con maquinaria comercial de gimnasio en España.',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    exercises: [
      {
        id: 'e1',
        exercise_template_id: 'technogym_pure_chest_press',
        title: 'Technogym Pure Strength - Chest Press',
        brand: 'Technogym',
        muscle_group: 'chest',
        equipment_category: 'machine',
        notes: 'Sillín en punto 4. Rango completo.',
        image_url: '/machines/technogym_pure_chest_press.jpg',
        sets: [
          { id: 's1', index: 1, type: 'warmup', weight_kg: 40, reps: 10, is_completed: false },
          { id: 's2', index: 2, type: 'normal', weight_kg: 80, reps: 8, is_completed: false, previous_weight_kg: 80, previous_reps: 8 },
          { id: 's3', index: 3, type: 'normal', weight_kg: 80, reps: 8, is_completed: false, previous_weight_kg: 80, previous_reps: 7 },
          { id: 's4', index: 4, type: 'failure', weight_kg: 85, reps: 6, is_completed: false, previous_weight_kg: 80, previous_reps: 6 }
        ]
      },
      {
        id: 'e2',
        exercise_template_id: 'technogym_pure_shoulder_press',
        title: 'Technogym Pure Strength - Shoulder Press',
        brand: 'Technogym',
        muscle_group: 'shoulders',
        equipment_category: 'machine',
        notes: 'Agarre neutro para cuidar el manguito rotador.',
        image_url: '/machines/technogym_pure_shoulder_press.jpg',
        sets: [
          { id: 's5', index: 1, type: 'normal', weight_kg: 30, reps: 10, is_completed: false, previous_weight_kg: 30, previous_reps: 10 },
          { id: 's6', index: 2, type: 'normal', weight_kg: 35, reps: 8, is_completed: false, previous_weight_kg: 30, previous_reps: 9 }
        ]
      },
      {
        id: 'e3',
        exercise_template_id: 'hammer_iso_decline_press',
        title: 'Hammer Strength - Iso-Lateral Decline Press',
        brand: 'Hammer Strength',
        muscle_group: 'chest',
        equipment_category: 'machine',
        notes: 'Pausa de 1s en contracción.',
        image_url: '/machines/hammer_iso_decline_press.png',
        sets: [
          { id: 's7', index: 1, type: 'normal', weight_kg: 45, reps: 12, is_completed: false, previous_weight_kg: 40, previous_reps: 12 },
          { id: 's8', index: 2, type: 'dropset', weight_kg: 35, reps: 15, is_completed: false, previous_weight_kg: 30, previous_reps: 15 }
        ]
      }
    ]
  },
  {
    id: 'routine_ppl_pull',
    title: 'Pull Day (Dorsal & Espalda Media)',
    folder_name: 'Push / Pull / Legs',
    description: 'Tracciones convergentes y poleas Technogym / Hammer.',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    exercises: [
      {
        id: 'e20',
        exercise_template_id: 'technogym_pure_pulldown',
        title: 'Technogym Pure Strength - Pulldown',
        brand: 'Technogym',
        muscle_group: 'lats',
        equipment_category: 'machine',
        image_url: '/machines/technogym_pure_pulldown.jpg',
        sets: [
          { id: 's20', index: 1, type: 'normal', weight_kg: 60, reps: 10, is_completed: false, previous_weight_kg: 55, previous_reps: 10 },
          { id: 's21', index: 2, type: 'normal', weight_kg: 60, reps: 10, is_completed: false, previous_weight_kg: 55, previous_reps: 9 }
        ]
      },
      {
        id: 'e21',
        exercise_template_id: 'hammer_iso_dy_row',
        title: 'Hammer Strength - Iso-Lateral DY Row',
        brand: 'Hammer Strength',
        muscle_group: 'upper_back',
        equipment_category: 'machine',
        image_url: '/machines/hammer_iso_dy_row.png',
        sets: [
          { id: 's22', index: 1, type: 'normal', weight_kg: 40, reps: 10, is_completed: false, previous_weight_kg: 40, previous_reps: 10 }
        ]
      }
    ]
  }
];
