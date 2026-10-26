import { Workout, WorkoutExercise, PersonalRecord } from '../types/workout';

/**
 * Epley formula for estimated 1 Rep Max
 */
export function calculate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

/**
 * Compute total volume in kg (Warmup sets are excluded from total volume, matching Hevy)
 */
export function calculateWorkoutVolume(exercises: WorkoutExercise[]): number {
  let total = 0;
  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (set.is_completed && set.type !== 'warmup') {
        total += (set.weight_kg || 0) * (set.reps || 0);
      }
    }
  }
  return Math.round(total);
}

/**
 * Count total completed sets
 */
export function countCompletedSets(exercises: WorkoutExercise[]): number {
  let count = 0;
  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (set.is_completed) count++;
    }
  }
  return count;
}

/**
 * Detect new personal records achieved during this workout
 */
export function detectPersonalRecords(
  workout: Workout,
  history: Workout[]
): PersonalRecord[] {
  const newPRs: PersonalRecord[] = [];

  for (const ex of workout.exercises) {
    let currentBestWeight = 0;
    let currentBest1RM = 0;

    for (const set of ex.sets) {
      if (!set.is_completed || set.type === 'warmup') continue;
      if (set.weight_kg > currentBestWeight) {
        currentBestWeight = set.weight_kg;
      }
      const e1rm = calculate1RM(set.weight_kg, set.reps);
      if (e1rm > currentBest1RM) {
        currentBest1RM = e1rm;
      }
    }

    if (currentBestWeight === 0) continue;

    // Compare with history
    let historicalBestWeight = 0;
    let historicalBest1RM = 0;

    for (const past of history) {
      if (past.id === workout.id) continue;
      for (const pastEx of past.exercises) {
        if (pastEx.exercise_template_id === ex.exercise_template_id) {
          for (const s of pastEx.sets) {
            if (!s.is_completed || s.type === 'warmup') continue;
            if (s.weight_kg > historicalBestWeight) historicalBestWeight = s.weight_kg;
            const e1rm = calculate1RM(s.weight_kg, s.reps);
            if (e1rm > historicalBest1RM) historicalBest1RM = e1rm;
          }
        }
      }
    }

    if (currentBestWeight > historicalBestWeight) {
      newPRs.push({
        id: `pr_weight_${ex.id}_${Date.now()}`,
        exercise_id: ex.exercise_template_id,
        exercise_title: ex.title,
        type: 'max_weight',
        value: currentBestWeight,
        date: workout.end_time || new Date().toISOString()
      });
    }

    if (currentBest1RM > historicalBest1RM && currentBest1RM > currentBestWeight) {
      newPRs.push({
        id: `pr_1rm_${ex.id}_${Date.now()}`,
        exercise_id: ex.exercise_template_id,
        exercise_title: ex.title,
        type: 'best_1rm',
        value: currentBest1RM,
        date: workout.end_time || new Date().toISOString()
      });
    }
  }

  return newPRs;
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format payload according to Hevy Public API v1 /workouts schema
 */
export function exportToHevyJson(workout: Workout) {
  return {
    workout: {
      id: workout.id,
      title: workout.title,
      description: workout.description || '',
      start_time: workout.start_time,
      end_time: workout.end_time,
      exercises: workout.exercises.map((ex, exIdx) => ({
        index: exIdx,
        title: ex.title,
        notes: ex.notes || '',
        exercise_template_id: ex.exercise_template_id,
        sets: ex.sets
          .filter(s => s.is_completed)
          .map((s, sIdx) => ({
            index: sIdx,
            type: s.type,
            weight_kg: s.weight_kg,
            reps: s.reps,
            rpe: s.rpe || null
          }))
      }))
    }
  };
}

/**
 * =====================================================================
 * ENERGY BALANCE, METABOLISM & CARDIO EXPENDITURE ENGINE
 * =====================================================================
 */

/**
 * Basal Metabolic Rate using the Mifflin-St Jeor formula
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  isMale: boolean = true
): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(isMale ? base + 5 : base - 161);
}

/**
 * Non-Exercise Activity Thermogenesis (NEAT) derived from daily steps
 */
export function calculateNeatCalories(dailySteps: number): number {
  if (dailySteps <= 0) return 0;
  return Math.round(dailySteps * 0.04);
}

/**
 * Daily averaged strength training caloric expenditure
 */
export function calculateStrengthTrainingCalories(
  trainingMinutes: number,
  daysPerWeek: number
): number {
  if (trainingMinutes <= 0 || daysPerWeek <= 0) return 0;
  const sessionKcal = trainingMinutes * 6.5; // ~6.5 kcal/min moderate-high intensity lifting
  return Math.round((sessionKcal * Math.min(7, daysPerWeek)) / 7);
}

/**
 * Daily averaged cardio caloric expenditure from weekly cardio minutes
 */
export function calculateCardioDailyCalories(
  weeklyMinutes: number,
  kcalPerMinute: number = 9.2 // Standard for moderate incline walking (10% 5km/h) or stationary bike
): number {
  if (weeklyMinutes <= 0) return 0;
  return Math.round((weeklyMinutes * kcalPerMinute) / 7);
}

export interface TDEEComponents {
  bmr: number;
  neat: number;
  gymDailyKcal: number;
  cardioDailyKcal: number;
  tefKcal: number;
  tdee: number;
}

/**
 * Total Daily Energy Expenditure (TDEE) with explicit cardio integration
 */
export function calculateTDEE(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  isMale?: boolean;
  dailySteps: number;
  strengthDays: number;
  strengthMinutes: number;
  weeklyCardioMinutes: number;
  cardioKcalPerMin?: number;
}): TDEEComponents {
  const bmr = calculateBMR(params.weightKg, params.heightCm, params.age, params.isMale ?? true);
  const neat = calculateNeatCalories(params.dailySteps);
  const gymDailyKcal = calculateStrengthTrainingCalories(params.strengthMinutes, params.strengthDays);
  const cardioDailyKcal = calculateCardioDailyCalories(
    params.weeklyCardioMinutes,
    params.cardioKcalPerMin ?? 9.2
  );

  const rawSubtotal = bmr + neat + gymDailyKcal + cardioDailyKcal;
  // Thermic Effect of Food (TEF) ~8%
  const tefKcal = Math.round(rawSubtotal * 0.08);
  const tdee = rawSubtotal + tefKcal;

  return {
    bmr,
    neat,
    gymDailyKcal,
    cardioDailyKcal,
    tefKcal,
    tdee
  };
}

export type WeightGoal = 'cut' | 'maintain' | 'bulk';

export interface GoalCalorieRecommendation {
  targetCalories: number;
  netDailyBalance: number;
  weeklyWeightChangeKg: number;
  cardioKcalPerDay: number;
  cardioImpactSummary: string;
}

/**
 * Calculates target daily calories based on weight goal (cut/maintain/bulk)
 * explicitly factoring in cardio caloric expenditure.
 */
export function calculateGoalCaloriesWithCardio(
  tdee: number,
  goal: WeightGoal,
  cardioDailyKcal: number = 0,
  customDeficitOrSurplus?: number
): GoalCalorieRecommendation {
  let netDailyBalance = 0;
  let targetCalories = tdee;
  let cardioImpactSummary = '';

  if (goal === 'cut') {
    // Controlled deficit of 350 to 500 kcal for safe fat loss (~0.35 - 0.5 kg/week)
    const deficit = customDeficitOrSurplus ?? 400;
    targetCalories = Math.max(1300, tdee - deficit);
    netDailyBalance = targetCalories - tdee; // negative

    if (cardioDailyKcal > 0) {
      cardioImpactSummary = `El cardio quema +${cardioDailyKcal} kcal/día, lo que te permite comer ${targetCalories} kcal (en lugar de ${targetCalories - cardioDailyKcal} kcal sin cardio) manteniendo el mismo ritmo de bajada de grasa.`;
    } else {
      cardioImpactSummary = `Sin cardio activo. Para acelerar la pérdida sin reducir más la comida, añade 2 sesiones de 20 min semanales.`;
    }
  } else if (goal === 'maintain') {
    targetCalories = tdee;
    netDailyBalance = 0;

    if (cardioDailyKcal > 0) {
      cardioImpactSummary = `Tu cardio gasta +${cardioDailyKcal} kcal/día. Para mantener el peso intacto, debes ingerir ${targetCalories} kcal (compensando el gasto de cardio).`;
    } else {
      cardioImpactSummary = `Ingesta neutral para mantenimiento exacto de peso corporal.`;
    }
  } else {
    // Bulk: controlled surplus of 200 to 300 kcal for lean muscle accrual
    const surplus = customDeficitOrSurplus ?? 250;
    targetCalories = tdee + surplus;
    netDailyBalance = surplus;

    if (cardioDailyKcal > 0) {
      cardioImpactSummary = `Para subir peso de forma limpia haciendo cardio (+${cardioDailyKcal} kcal/día), necesitas comer ${targetCalories} kcal para no perder el superávit anabólico.`;
    } else {
      cardioImpactSummary = `Superávit limpio de +${surplus} kcal/día para maximizar la síntesis proteica minimizando la ganancia grasa.`;
    }
  }

  // 7700 kcal ~= 1 kg of body mass change
  const weeklyWeightChangeKg = parseFloat(((netDailyBalance * 7) / 7700).toFixed(2));

  return {
    targetCalories: Math.round(targetCalories),
    netDailyBalance,
    weeklyWeightChangeKg,
    cardioKcalPerDay: cardioDailyKcal,
    cardioImpactSummary
  };
}

