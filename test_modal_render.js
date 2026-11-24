// Test ExerciseDetailModal logic
import { calculate1RM } from './src/utils/fitness.js';

const exercise = {
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
    { id: 's2', index: 2, type: 'normal', weight_kg: 80, reps: 8, is_completed: false },
  ]
};

const workoutHistory = undefined; // What if undefined?

try {
  (workoutHistory || []).forEach(w => {
    console.log(w);
  });
  console.log("Safe workoutHistory works!");
} catch (e) {
  console.error("Crash on workoutHistory:", e);
}
