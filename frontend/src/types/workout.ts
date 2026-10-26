export type MuscleGroup =
  | 'abdominals'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quadriceps'
  | 'hamstrings'
  | 'calves'
  | 'glutes'
  | 'abductors'
  | 'adductors'
  | 'lats'
  | 'upper_back'
  | 'traps'
  | 'lower_back'
  | 'chest'
  | 'cardio'
  | 'neck'
  | 'full_body'
  | 'other';

export type EquipmentCategory =
  | 'none'
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'machine'
  | 'cable'
  | 'plate'
  | 'smith'
  | 'cardio_machine'
  | 'resistance_band'
  | 'suspension'
  | 'other';

export type GymBrand =
  | 'Technogym'
  | 'Hammer Strength'
  | 'Life Fitness'
  | 'Matrix'
  | 'Panatta'
  | 'Gym80'
  | 'Eleiko'
  | 'Booty Builder'
  | 'Concept2'
  | 'General';

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

export type ExerciseType =
  | 'weight_reps'
  | 'bodyweight_reps'
  | 'cardio_time_distance'
  | 'cardio_incline'
  | 'reps_only'
  | 'duration';

export interface WorkoutSet {
  id: string;
  index: number;
  type: SetType;
  weight_kg: number;
  reps: number;
  rpe?: number | null;
  target_rep_range?: string; // e.g. "8-12", "6-8", "10-12"
  // Cardio and endurance specific metrics
  duration_seconds?: number | null;
  distance_km?: number | null;
  incline_pct?: number | null; // e.g. 8.0% incline
  speed_kmh?: number | null;   // e.g. 5.5 km/h
  calories_kcal?: number | null; // e.g. 150 kcal
  is_completed: boolean;
  previous_weight_kg?: number | null;
  previous_reps?: number | null;
  previous_rpe?: number | null;
}

export type ResistanceCurveType = 'lengthened' | 'shortened' | 'mid_range' | 'constant' | 'bell_shaped';

export interface ResistanceProfile {
  curve: ResistanceCurveType;
  curve_label: string; // e.g. "Máxima tensión en estiramiento"
  rating: number; // 1-10
  match_analysis: string; // e.g. "Excelente adaptación al perfil de fuerza del dorsal en elongación"
  pro_hack?: string; // e.g. "Sentarse 5cm más atrás en el remo a una mano para evitar convergencia excesiva"
}

export interface GripOption {
  id: string;
  name: string; // e.g. "Agarre Neutro Cerrado"
  target_muscle: string; // e.g. "Dorsal Ancho Bajo / Fibras Ilíacas"
  biomechanical_benefit: string; // e.g. "Mantiene el húmero adosado al torso evitando rotación interna"
  is_recommended?: boolean;
}

export interface ExerciseTemplate {
  id: string;
  title: string;
  brand?: GymBrand;
  model_series?: string;
  muscle_group: MuscleGroup;
  other_muscles?: MuscleGroup[];
  equipment_category: EquipmentCategory;
  exercise_type: ExerciseType;
  description?: string;
  setup_tips?: string[];
  image_url?: string;
  gif_url?: string;
  is_custom?: boolean;
  resistance_profile?: ResistanceProfile;
  grips?: GripOption[];
  target_rep_range?: string;
}

export interface WorkoutExercise {
  id: string;
  exercise_template_id: string;
  title: string;
  brand?: GymBrand;
  muscle_group: MuscleGroup;
  equipment_category: EquipmentCategory;
  exercise_type?: ExerciseType;
  notes?: string;
  image_url?: string;
  gif_url?: string;
  sets: WorkoutSet[];
  target_rep_range?: string;
  selected_grip?: string;
}

export interface PersonalRecord {
  id: string;
  exercise_id: string;
  exercise_title: string;
  type: 'max_weight' | 'max_volume' | 'best_1rm' | 'cardio_distance';
  value: number;
  date: string;
}

export interface WorkoutSurvey {
  fatigue: number; // 1 to 10
  motivation: number; // 1 to 10
  mind_muscle_connection: number; // 1 to 10
  discomfort_joints?: string[]; // e.g. ['Hombros', 'Rodillas', 'Ninguna']
  notes?: string;
}

export interface Workout {
  id: string;
  title: string;
  routine_id?: string | null;
  description?: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  volume_kg: number;
  sets_count: number;
  exercises: WorkoutExercise[];
  personal_records: PersonalRecord[];
  survey?: WorkoutSurvey;
}

export interface Routine {
  id: string;
  title: string;
  folder_name?: string;
  description?: string;
  updated_at: string;
  created_at: string;
  exercises: WorkoutExercise[];
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weight_kg: number;
  notes?: string;
}

export interface BodyTapeMeasurement {
  id: string;
  date: string;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  left_arm_cm?: number;
  right_arm_cm?: number;
  left_thigh_cm?: number;
  right_thigh_cm?: number;
  calves_cm?: number;
  notes?: string;
}

export interface ExerciseComment {
  id: string;
  exercise_template_id: string;
  date: string;
  text: string;
  machine_pin?: string;
}

export interface CommunityTip {
  id: string;
  exercise_template_id: string;
  author: string;
  author_badge?: string;
  text: string;
  likes: number;
  has_liked?: boolean;
  date: string;
}

export interface DailyStepEntry {
  id: string;
  date: string; // YYYY-MM-DD
  steps: number;
  distance_km: number;
  active_calories: number;
  source: 'Google Health Connect' | 'Apple Health' | 'Sensor del Dispositivo' | 'Manual';
}

export interface NutritionGoal {
  goal_type: 'cut' | 'maintain' | 'bulk';
  target_weight_kg: number;
  weekly_training_days: number;
  avg_training_minutes: number;
  avg_daily_steps: number;
  weekly_cardio_minutes: number;
  calculated_bmr: number;
  calculated_tdee: number;
  target_calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
}

export interface SocialPost {
  id: string;
  user_name: string;
  user_handle: string;
  user_avatar: string;
  time_ago: string;
  workout_title: string;
  duration_minutes: number;
  volume_kg: number;
  exercises_count: number;
  prs_count: number;
  top_exercises: string[];
  kudos_count: number;
  has_kudos: boolean;
  comments: { id: string; user: string; text: string; time: string }[];
  routine_blueprint?: Routine;
}

export interface CardioSession {
  id: string;
  date: string; // YYYY-MM-DD
  activity_type: 'incline_treadmill' | 'bike' | 'running' | 'elliptical' | 'rower';
  activity_name: string;
  duration_minutes: number;
  incline_percentage?: number;
  speed_kmh?: number;
  distance_km?: number;
  estimated_calories: number;
  notes?: string;
}

export interface DailyCalorieEntry {
  id: string;
  date: string; // YYYY-MM-DD
  calories: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  notes?: string;
}

export interface AppSettings {
  show_rpe: boolean;
  weight_unit: 'kg' | 'lbs';
  auto_start_timer: boolean;
  sound_enabled: boolean;
  sync_health_apps: boolean;
  gym_brands?: string[];
}

// ==========================================
// FATSECRET-STYLE NUTRITION ENGINE
// ==========================================
export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  serving_description: string; // e.g. "100 g", "1 ración (150 g)"
  serving_grams: number;
  calories_kcal: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  fiber_grams?: number;
  category: 'meat_fish' | 'grains_cereals' | 'dairy' | 'fats_oils' | 'vegetables_fruits' | 'supplements' | 'other';
  barcode?: string;
  image_url?: string;
  source?: 'local_spain' | 'openfoodfacts' | 'usda';
}

export interface LoggedFoodItem {
  id: string;
  food_id: string;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time?: string;
}

export type MealType = 'breakfast' | 'mid_morning' | 'lunch' | 'snack' | 'dinner';

export interface MealBucket {
  meal_type: MealType;
  label: string;
  foods: LoggedFoodItem[];
}

export interface DailyMealPlan {
  date: string; // YYYY-MM-DD
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  meals: MealBucket[];
  notes?: string;
}

// ==========================================
// USER AUTH & MULTI-DEVICE CLOUD SYNC
// ==========================================
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  goal: 'hypertrophy' | 'fat_loss' | 'strength' | 'recomposition';
  created_at: string;
  avatar_url?: string;
}

export interface UserDataSnapshot {
  user: UserProfile;
  routines: Routine[];
  history: Workout[];
  weights: BodyWeightEntry[];
  measurements: BodyTapeMeasurement[];
  calorieHistory: DailyCalorieEntry[];
  stepHistory: DailyStepEntry[];
  cardioSessions: CardioSession[];
  settings: AppSettings;
  mealPlans?: Record<string, DailyMealPlan>;
  lastSyncedAt: string;
}
