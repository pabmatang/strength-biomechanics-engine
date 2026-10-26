import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, BarChart3, Plus, Play, Ruler, Scale, BrainCircuit, Users, Footprints, Flame, Settings, Heart, Utensils } from 'lucide-react';
import { Routine, Workout, BodyWeightEntry, BodyTapeMeasurement, ExerciseTemplate, WorkoutExercise, SocialPost, DailyStepEntry, AppSettings, CardioSession, DailyCalorieEntry } from './types/workout';
import { INITIAL_ROUTINES } from './data/exercises';
import { RoutinesScreen } from './components/RoutinesScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { AnalyticsScreen } from './components/AnalyticsScreen';
import { ActiveWorkoutScreen } from './components/ActiveWorkoutScreen';
import { BodyTrackingScreen } from './components/BodyTrackingScreen';
import { AiBiomechanicsModal } from './components/AiBiomechanicsModal';
import { SettingsModal } from './components/SettingsModal';
import { DailyStepsScreen } from './components/DailyStepsScreen';
import { EnergyBalanceScreen } from './components/EnergyBalanceScreen';
import { SocialFeedScreen } from './components/SocialFeedScreen';
import { FatSecretNutritionScreen } from './components/FatSecretNutritionScreen';
import { AuthScreen } from './components/AuthScreen';
import { getCurrentUser, setCurrentUser, fetchSnapshotFromCloud, syncSnapshotToCloud } from './utils/cloudSync';
import { UserProfile, UserDataSnapshot } from './types/workout';
import { Cloud } from 'lucide-react';
import { checkAndTriggerDailyReminder } from './utils/notificationService';

const SAMPLE_HISTORY: Workout[] = [
  {
    id: 'workout_sample_1',
    title: 'Push Day (Technogym & Hammer)',
    description: 'Excelente congestión y récord en Chest Press',
    start_time: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    end_time: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 45 * 60 * 1000).toISOString(),
    duration_seconds: 2700,
    volume_kg: 5480,
    sets_count: 12,
    exercises: [
      {
        id: 'ex_sample_1',
        exercise_template_id: 'technogym_pure_chest_press',
        title: 'Technogym Pure Strength - Chest Press',
        brand: 'Technogym',
        muscle_group: 'chest',
        equipment_category: 'machine',
        image_url: '/machines/technogym_pure_chest_press.jpg',
        sets: [
          { id: 'ss1', index: 1, type: 'warmup', weight_kg: 40, reps: 10, rpe: 7.0, is_completed: true },
          { id: 'ss2', index: 2, type: 'normal', weight_kg: 80, reps: 8, rpe: 8.0, is_completed: true },
          { id: 'ss3', index: 3, type: 'normal', weight_kg: 85, reps: 8, rpe: 8.5, is_completed: true },
          { id: 'ss4', index: 4, type: 'normal', weight_kg: 90, reps: 6, rpe: 9.5, is_completed: true }
        ]
      },
      {
        id: 'ex_sample_2',
        exercise_template_id: 'technogym_pure_shoulder_press',
        title: 'Technogym Pure Strength - Shoulder Press',
        brand: 'Technogym',
        muscle_group: 'shoulders',
        equipment_category: 'machine',
        image_url: '/machines/technogym_pure_shoulder_press.jpg',
        sets: [
          { id: 'ss5', index: 1, type: 'normal', weight_kg: 30, reps: 10, rpe: 7.5, is_completed: true },
          { id: 'ss6', index: 2, type: 'normal', weight_kg: 35, reps: 8, rpe: 8.5, is_completed: true }
        ]
      }
    ],
    personal_records: [
      {
        id: 'pr_sample_1',
        exercise_id: 'technogym_pure_chest_press',
        exercise_title: 'Technogym Pure Strength - Chest Press',
        type: 'max_weight',
        value: 90,
        date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      }
    ],
    survey: {
      fatigue: 7.0,
      motivation: 8.5,
      mind_muscle_connection: 9.0,
      discomfort_joints: ['Hombro derecho leve'],
      notes: 'Gran congestión en pectoral medio. Ligera molestia en el hombro al bloquear la última repetición.'
    }
  }
];

const INITIAL_WEIGHTS: BodyWeightEntry[] = [
  // Semana Actual (Oct 19 - Oct 21) -> Media: ~79.43 kg
  { id: 'w1', date: '2026-10-21', weight_kg: 79.4 },
  { id: 'w2', date: '2026-10-20', weight_kg: 79.5 },
  { id: 'w3', date: '2026-10-19', weight_kg: 79.4 },
  // Semana -1 (Oct 12 - Oct 18) -> Media: ~79.50 kg (Estancamiento confirmado vs Semana Actual: -0.07 kg)
  { id: 'w4', date: '2026-10-18', weight_kg: 79.4 },
  { id: 'w5', date: '2026-10-16', weight_kg: 79.6 },
  { id: 'w6', date: '2026-10-14', weight_kg: 79.5 },
  // Semana -2 (Oct 05 - Oct 11) -> Media: ~79.90 kg (Descenso activo de -0.40 kg)
  { id: 'w7', date: '2026-10-11', weight_kg: 79.8 },
  { id: 'w8', date: '2026-10-08', weight_kg: 79.9 },
  { id: 'w9', date: '2026-10-06', weight_kg: 80.0 },
  // Semana -3 (Sep 28 - Oct 04) -> Media: ~80.50 kg
  { id: 'w10', date: '2026-10-04', weight_kg: 80.4 },
  { id: 'w11', date: '2026-10-01', weight_kg: 80.6 }
];

const INITIAL_CALORIE_HISTORY: DailyCalorieEntry[] = [
  // Semana Actual (Oct 15 - Oct 21) -> Media: ~2,145 kcal/día
  { id: 'cal_1', date: '2026-10-21', calories: 2150, protein_grams: 165, carbs_grams: 220, fat_grams: 65, notes: 'Comida limpia, alta en proteína' },
  { id: 'cal_2', date: '2026-10-20', calories: 2100, protein_grams: 170, carbs_grams: 210, fat_grams: 62 },
  { id: 'cal_3', date: '2026-10-19', calories: 2120, protein_grams: 160, carbs_grams: 215, fat_grams: 65 },
  { id: 'cal_4', date: '2026-10-18', calories: 2200, protein_grams: 175, carbs_grams: 230, fat_grams: 66 },
  { id: 'cal_5', date: '2026-10-17', calories: 2140, protein_grams: 168, carbs_grams: 218, fat_grams: 64 },
  { id: 'cal_6', date: '2026-10-16', calories: 2180, protein_grams: 165, carbs_grams: 225, fat_grams: 68 },
  { id: 'cal_7', date: '2026-10-15', calories: 2130, protein_grams: 162, carbs_grams: 220, fat_grams: 63 },
  // Semana -1 (Oct 08 - Oct 14) -> Media: ~2,160 kcal/día
  { id: 'cal_8', date: '2026-10-14', calories: 2160, protein_grams: 166, carbs_grams: 225, fat_grams: 65 },
  { id: 'cal_9', date: '2026-10-13', calories: 2150, protein_grams: 164, carbs_grams: 222, fat_grams: 64 },
  { id: 'cal_10', date: '2026-10-12', calories: 2190, protein_grams: 168, carbs_grams: 230, fat_grams: 67 },
  { id: 'cal_11', date: '2026-10-11', calories: 2140, protein_grams: 165, carbs_grams: 220, fat_grams: 63 },
  { id: 'cal_12', date: '2026-10-10', calories: 2180, protein_grams: 170, carbs_grams: 228, fat_grams: 66 },
  { id: 'cal_13', date: '2026-10-09', calories: 2130, protein_grams: 162, carbs_grams: 218, fat_grams: 62 },
  { id: 'cal_14', date: '2026-10-08', calories: 2170, protein_grams: 167, carbs_grams: 226, fat_grams: 65 },
  // Semana -2 (Oct 01 - Oct 07) -> Media: ~2,267 kcal/día
  { id: 'cal_15', date: '2026-10-07', calories: 2280, protein_grams: 172, carbs_grams: 242, fat_grams: 70 },
  { id: 'cal_16', date: '2026-10-06', calories: 2250, protein_grams: 170, carbs_grams: 238, fat_grams: 68 },
  { id: 'cal_17', date: '2026-10-05', calories: 2310, protein_grams: 175, carbs_grams: 248, fat_grams: 72 },
  { id: 'cal_18', date: '2026-10-04', calories: 2260, protein_grams: 168, carbs_grams: 240, fat_grams: 69 },
  { id: 'cal_19', date: '2026-10-03', calories: 2300, protein_grams: 173, carbs_grams: 245, fat_grams: 71 },
  { id: 'cal_20', date: '2026-10-02', calories: 2270, protein_grams: 171, carbs_grams: 242, fat_grams: 70 },
  { id: 'cal_21', date: '2026-10-01', calories: 2290, protein_grams: 174, carbs_grams: 246, fat_grams: 71 }
];

const INITIAL_MEASUREMENTS: BodyTapeMeasurement[] = [
  {
    id: 't1',
    date: '2026-10-01',
    chest_cm: 102.5,
    waist_cm: 83.0,
    hips_cm: 98.0,
    left_arm_cm: 37.5,
    right_arm_cm: 38.0,
    left_thigh_cm: 58.0,
    right_thigh_cm: 58.0,
    calves_cm: 38.5
  },
  {
    id: 't2',
    date: '2026-10-20',
    chest_cm: 104.0,
    waist_cm: 81.5,
    hips_cm: 98.5,
    left_arm_cm: 38.5,
    right_arm_cm: 39.0,
    left_thigh_cm: 59.0,
    right_thigh_cm: 59.5,
    calves_cm: 39.0
  }
];

const INITIAL_STEP_HISTORY: DailyStepEntry[] = [
  { id: 'step_1', date: '2026-10-21', steps: 9450, distance_km: 7.1, active_calories: 380, source: 'Google Health Connect' },
  { id: 'step_2', date: '2026-10-20', steps: 11200, distance_km: 8.4, active_calories: 450, source: 'Google Health Connect' },
  { id: 'step_3', date: '2026-10-19', steps: 10400, distance_km: 7.8, active_calories: 415, source: 'Google Health Connect' },
  { id: 'step_4', date: '2026-10-18', steps: 8900, distance_km: 6.7, active_calories: 355, source: 'Google Health Connect' },
  { id: 'step_5', date: '2026-10-17', steps: 12500, distance_km: 9.3, active_calories: 500, source: 'Sensor del Dispositivo' },
  { id: 'step_6', date: '2026-10-16', steps: 9800, distance_km: 7.3, active_calories: 390, source: 'Sensor del Dispositivo' },
  { id: 'step_7', date: '2026-10-15', steps: 8600, distance_km: 6.4, active_calories: 345, source: 'Manual' }
];

const INITIAL_SOCIAL_POSTS: SocialPost[] = [
  {
    id: 'post_1',
    user_name: 'Carlos Ruiz',
    user_handle: '@carlos_fit',
    user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    time_ago: 'hace 2 horas',
    workout_title: 'Push Day Technogym & Hammer 🔥',
    duration_minutes: 58,
    volume_kg: 6850,
    exercises_count: 5,
    prs_count: 2,
    top_exercises: ['Technogym Pure Chest Press', 'Hammer Iso Shoulder Press', 'Hammer Seated Dip'],
    kudos_count: 14,
    has_kudos: false,
    comments: [
      { id: 'c1', user: 'Laura', text: '¡Vaya récord en Chest Press! Qué máquina usaste?', time: 'hace 1h' },
      { id: 'c2', user: 'Carlos Ruiz', text: 'La Pure Strength con pedal, es brutal para los hombros', time: 'hace 45m' }
    ],
    routine_blueprint: {
      id: 'routine_carlos_push',
      title: 'Torso Push de Carlos Ruiz',
      folder_name: 'Comunidad',
      description: 'Rutina de empuje pesada en Technogym Pure Strength',
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      exercises: [
        {
          id: 'ex_c1',
          exercise_template_id: 'technogym_pure_chest_press',
          title: 'Technogym Pure Strength - Chest Press',
          brand: 'Technogym',
          muscle_group: 'chest',
          equipment_category: 'machine',
          image_url: '/machines/technogym_pure_chest_press.jpg',
          sets: [
            { id: 's1', index: 1, type: 'warmup', weight_kg: 50, reps: 10, is_completed: true },
            { id: 's2', index: 2, type: 'normal', weight_kg: 95, reps: 8, is_completed: true },
            { id: 's3', index: 3, type: 'failure', weight_kg: 100, reps: 6, is_completed: true }
          ]
        }
      ]
    }
  },
  {
    id: 'post_2',
    user_name: 'Laura Gómez',
    user_handle: '@laura_biomech',
    user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    time_ago: 'hace 4 horas',
    workout_title: 'Glúteos & Isquios Panatta Hack 🍑',
    duration_minutes: 65,
    volume_kg: 7420,
    exercises_count: 4,
    prs_count: 1,
    top_exercises: ['Panatta Super Hack Squat', 'Technogym Pure Hip Thrust', 'Technogym Selection Leg Curl'],
    kudos_count: 22,
    has_kudos: true,
    comments: [
      { id: 'c3', user: 'Marcos', text: 'La Hack de Panatta tiene una plataforma comodísima!', time: 'hace 2h' }
    ]
  }
];

const INITIAL_CARDIO_SESSIONS: CardioSession[] = [
  {
    id: 'cardio_1',
    date: '2026-10-20',
    activity_type: 'incline_treadmill',
    activity_name: 'Cinta Inclinada (10% a 5.2 km/h)',
    duration_minutes: 30,
    incline_percentage: 10,
    speed_kmh: 5.2,
    estimated_calories: 285,
    notes: 'Post-entreno torso, excelente quema de grasa sin fatiga'
  },
  {
    id: 'cardio_2',
    date: '2026-10-18',
    activity_type: 'bike',
    activity_name: 'Bicicleta Estática / Spinning Zona 2',
    duration_minutes: 25,
    speed_kmh: 22.0,
    estimated_calories: 220,
    notes: 'Cadencia constante de 80 RPM'
  }
];

const INITIAL_SETTINGS: AppSettings = {
  show_rpe: true,
  weight_unit: 'kg',
  auto_start_timer: true,
  sound_enabled: true,
  sync_health_apps: true
};

// Safe localStorage getter helper
function getStoredJson<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    return JSON.parse(saved);
  } catch {
    return defaultValue;
  }
}

function setStoredJson(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function App() {
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(() => getCurrentUser());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('synced');
  
  const [activeTab, setActiveTab] = useState<'routines' | 'history' | 'analytics' | 'health_hub' | 'social'>(() => {
    try {
      const saved = localStorage.getItem('mia_active_tab');
      if (saved && ['routines', 'history', 'analytics', 'health_hub', 'social'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'routines';
  });

  const [healthSubTab, setHealthSubTab] = useState<'diet' | 'nutrition' | 'steps' | 'body'>(() => {
    try {
      const saved = localStorage.getItem('mia_health_sub_tab');
      if (saved && ['diet', 'nutrition', 'steps', 'body'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'diet';
  });

  // Load from localStorage with defaults
  const [routines, setRoutines] = useState<Routine[]>(() => 
    getStoredJson('mia_routines', INITIAL_ROUTINES)
  );

  const [history, setHistory] = useState<Workout[]>(() => 
    getStoredJson('mia_workout_history', SAMPLE_HISTORY)
  );

  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(() => 
    getStoredJson('mia_active_workout', null)
  );

  const [weights, setWeights] = useState<BodyWeightEntry[]>(() => 
    getStoredJson('mia_body_weights', INITIAL_WEIGHTS)
  );

  const [measurements, setMeasurements] = useState<BodyTapeMeasurement[]>(() => 
    getStoredJson('mia_tape_measurements', INITIAL_MEASUREMENTS)
  );

  const [stepHistory, setStepHistory] = useState<DailyStepEntry[]>(() => 
    getStoredJson('mia_step_history', INITIAL_STEP_HISTORY)
  );

  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(() => 
    getStoredJson('mia_social_posts', INITIAL_SOCIAL_POSTS)
  );

  const [settings, setSettings] = useState<AppSettings>(() => 
    getStoredJson('mia_app_settings', INITIAL_SETTINGS)
  );

  const [cardioSessions, setCardioSessions] = useState<CardioSession[]>(() => 
    getStoredJson('mia_cardio_sessions', INITIAL_CARDIO_SESSIONS)
  );

  const [calorieHistory, setCalorieHistory] = useState<DailyCalorieEntry[]>(() => 
    getStoredJson('mia_calorie_history', INITIAL_CALORIE_HISTORY)
  );

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Persist navigation tabs
  useEffect(() => {
    try {
      localStorage.setItem('mia_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('mia_health_sub_tab', healthSubTab);
    } catch {}
  }, [healthSubTab]);

  // Persist to localStorage
  useEffect(() => {
    setStoredJson('mia_calorie_history', calorieHistory);
  }, [calorieHistory]);

  useEffect(() => {
    setStoredJson('mia_cardio_sessions', cardioSessions);
  }, [cardioSessions]);

  useEffect(() => {
    setStoredJson('mia_routines', routines);
  }, [routines]);

  useEffect(() => {
    setStoredJson('mia_workout_history', history);
  }, [history]);

  // Daily reminder notification checker (once a day for workout & nutrition logging)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const hasWorkoutToday = history.some(w => w.start_time && w.start_time.startsWith(today));
    const hasMealsToday = calorieHistory.some(c => c.date === today && c.calories > 0);

    checkAndTriggerDailyReminder(hasWorkoutToday, hasMealsToday);

    const interval = setInterval(() => {
      checkAndTriggerDailyReminder(hasWorkoutToday, hasMealsToday);
    }, 60000);

    return () => clearInterval(interval);
  }, [history, calorieHistory]);

  useEffect(() => {
    if (activeWorkout) {
      setStoredJson('mia_active_workout', activeWorkout);
    } else {
      try { localStorage.removeItem('mia_active_workout'); } catch {}
    }
  }, [activeWorkout]);

  useEffect(() => {
    setStoredJson('mia_body_weights', weights);
  }, [weights]);

  useEffect(() => {
    setStoredJson('mia_tape_measurements', measurements);
  }, [measurements]);

  useEffect(() => {
    setStoredJson('mia_step_history', stepHistory);
  }, [stepHistory]);

  useEffect(() => {
    setStoredJson('mia_social_posts', socialPosts);
  }, [socialPosts]);

  useEffect(() => {
    setStoredJson('mia_app_settings', settings);
  }, [settings]);

  // Handle Authentication from AuthScreen
  const handleAuthenticated = (user: UserProfile, snapshot?: UserDataSnapshot | null) => {
    setCurrentUserState(user);
    if (snapshot) {
      if (snapshot.routines && snapshot.routines.length > 0) setRoutines(snapshot.routines);
      if (snapshot.history) setHistory(snapshot.history);
      if (snapshot.weights) setWeights(snapshot.weights);
      if (snapshot.calorieHistory) setCalorieHistory(snapshot.calorieHistory);
      if (snapshot.stepHistory) setStepHistory(snapshot.stepHistory);
      if (snapshot.cardioSessions) setCardioSessions(snapshot.cardioSessions);
      if (snapshot.measurements) setMeasurements(snapshot.measurements);
      if (snapshot.settings) setSettings(snapshot.settings);
    } else {
      fetchSnapshotFromCloud(user.email).then(remoteSnapshot => {
        if (remoteSnapshot) {
          if (remoteSnapshot.routines && remoteSnapshot.routines.length > 0) setRoutines(remoteSnapshot.routines);
          if (remoteSnapshot.history) setHistory(remoteSnapshot.history);
          if (remoteSnapshot.weights) setWeights(remoteSnapshot.weights);
          if (remoteSnapshot.calorieHistory) setCalorieHistory(remoteSnapshot.calorieHistory);
          if (remoteSnapshot.stepHistory) setStepHistory(remoteSnapshot.stepHistory);
          if (remoteSnapshot.cardioSessions) setCardioSessions(remoteSnapshot.cardioSessions);
          if (remoteSnapshot.measurements) setMeasurements(remoteSnapshot.measurements);
          if (remoteSnapshot.settings) setSettings(remoteSnapshot.settings);
        }
      });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentUserState(null);
    setIsSettingsModalOpen(false);
  };

  const handleForceSync = async () => {
    if (!currentUser) return;
    setSyncStatus('syncing');
    const snapshot: UserDataSnapshot = {
      user: currentUser,
      routines,
      history,
      weights,
      measurements,
      calorieHistory,
      cardioSessions,
      stepHistory,
      settings,
      lastSyncedAt: new Date().toISOString()
    };
    const ok = await syncSnapshotToCloud(snapshot);
    setSyncStatus(ok ? 'synced' : 'error');
    setTimeout(() => setSyncStatus('synced'), 2500);
  };

  // Debounced auto-sync to cloud when data changes
  useEffect(() => {
    if (!currentUser) return;
    const timer = setTimeout(async () => {
      setSyncStatus('syncing');
      const snapshot: UserDataSnapshot = {
        user: currentUser,
        routines,
        history,
        weights,
        measurements,
        calorieHistory,
        cardioSessions,
        stepHistory,
        settings,
        lastSyncedAt: new Date().toISOString()
      };
      await syncSnapshotToCloud(snapshot);
      setSyncStatus('synced');
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentUser, routines, history, weights, calorieHistory, cardioSessions, stepHistory, measurements, settings]);

  // Start a fresh empty workout
  const startEmptyWorkout = () => {
    const now = new Date();
    const hours = now.getHours();
    let timeLabel = 'Entrenamiento de Tarde';
    if (hours < 12) timeLabel = 'Entrenamiento de Mañana';
    else if (hours >= 20) timeLabel = 'Entrenamiento Nocturno';

    const newWorkout: Workout = {
      id: `workout_${Date.now()}`,
      title: `${timeLabel} 💪`,
      start_time: now.toISOString(),
      end_time: '',
      duration_seconds: 0,
      volume_kg: 0,
      sets_count: 0,
      exercises: [],
      personal_records: []
    };
    setActiveWorkout(newWorkout);
  };

  // Start workout from routine
  const startRoutineWorkout = (routine: Routine) => {
    const newWorkout: Workout = {
      id: `workout_${Date.now()}`,
      title: `${routine.title} 💪`,
      routine_id: routine.id,
      start_time: new Date().toISOString(),
      end_time: '',
      duration_seconds: 0,
      volume_kg: 0,
      sets_count: 0,
      exercises: JSON.parse(JSON.stringify(routine.exercises)),
      personal_records: []
    };
    setActiveWorkout(newWorkout);
  };

  const finishWorkout = (workout: Workout) => {
    setHistory(prev => [workout, ...prev]);
    setActiveWorkout(null);
    setActiveTab('history');
  };

  const discardWorkout = () => {
    if (confirm('¿Estás seguro de que deseas descartar este entrenamiento?')) {
      setActiveWorkout(null);
    }
  };

  const handleAddExerciseFromAi = (template: ExerciseTemplate) => {
    const isCardio = template.muscle_group === 'cardio' || template.exercise_type === 'cardio_incline';
    const newExercise: WorkoutExercise = {
      id: `ex_${Date.now()}_ai`,
      exercise_template_id: template.id,
      title: template.title,
      brand: template.brand,
      muscle_group: template.muscle_group,
      equipment_category: template.equipment_category,
      exercise_type: template.exercise_type,
      image_url: template.image_url,
      sets: [
        {
          id: `set_${Date.now()}_1`,
          index: 1,
          type: 'normal',
          weight_kg: isCardio ? 0 : 30,
          reps: isCardio ? 0 : 10,
          duration_seconds: isCardio ? 900 : null,
          incline_pct: isCardio ? 8.0 : null,
          calories_kcal: isCardio ? 140 : null,
          rpe: 8.0,
          is_completed: false
        }
      ]
    };

    setActiveWorkout({
      id: `workout_${Date.now()}`,
      title: `Sesión IA: ${template.title}`,
      description: 'Generada con IA Biomecánica (Llama 3.2-Vision / pgvector)',
      start_time: new Date().toISOString(),
      end_time: '',
      duration_seconds: 0,
      volume_kg: 0,
      sets_count: 0,
      exercises: [newExercise],
      personal_records: []
    });
  };

  // Social actions
  const handleToggleKudos = (postId: string) => {
    setSocialPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const next = !p.has_kudos;
        return {
          ...p,
          has_kudos: next,
          kudos_count: next ? p.kudos_count + 1 : p.kudos_count - 1
        };
      }
      return p;
    }));
  };

  const handleAddSocialComment = (postId: string, text: string) => {
    setSocialPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...p.comments,
            { id: `c_${Date.now()}`, user: 'Tú', text, time: 'ahora' }
          ]
        };
      }
      return p;
    }));
  };

  const handleCloneSocialRoutine = (cloned: Routine) => {
    const newRoutine: Routine = {
      ...cloned,
      id: `routine_cloned_${Date.now()}`,
      title: `${cloned.title} (Copiada)`,
      folder_name: 'Comunidad'
    };
    setRoutines(prev => [newRoutine, ...prev]);
  };

  // If no user is logged in, show initial credentials gate
  if (!currentUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  // If a workout is active, show the active workout screen
  if (activeWorkout) {
    return (
      <ActiveWorkoutScreen
        workout={activeWorkout}
        onUpdateWorkout={setActiveWorkout}
        onFinishWorkout={finishWorkout}
        onDiscardWorkout={discardWorkout}
        workoutHistory={history}
        showRpe={settings.show_rpe}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100 flex flex-col justify-between pb-[max(6rem,calc(env(safe-area-inset-bottom)+5.5rem))] selection:bg-blue-600 selection:text-white">
      
      {/* Top App Header with Clean Mobile-Native Layout (No horizontal overflow) */}
      <header className="sticky top-0 z-30 bg-[#09090b]/90 backdrop-blur-2xl border-b border-white/[0.07] px-4 pt-[max(0.75rem,calc(env(safe-area-inset-top)+0.5rem))] pb-3 transition-all">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          
          {/* Clean Brand Section */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 flex-shrink-0">
              <span className="font-black text-sm tracking-tighter">Δ</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white m-0 truncate">CHΔNCE</h1>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 hidden xs:inline-block">
                  Biomechanics
                </span>
              </div>
              <p className="text-[10px] text-slate-400 m-0 leading-none truncate hidden sm:block">Strength & Biomechanics Engine</p>
            </div>
          </div>

          {/* Right Action Section: Compact, zero horizontal overflow */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* AI Scanner Button (Tablet & Desktop) */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="hidden sm:flex px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 items-center gap-1.5 transition active:scale-95 border border-indigo-400/30"
              title="Escanear máquinas con IA"
            >
              <BrainCircuit className="w-4 h-4 text-cyan-300" />
              <span>IA Biomecánica</span>
            </button>

            {/* Quick Start Empty Workout */}
            <button
              onClick={startEmptyWorkout}
              className="flex px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 items-center gap-1.5 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Libre</span>
            </button>

            {/* Unified User Profile, Cloud Sync & Settings Pill */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-95 rounded-xl transition text-xs shadow-sm"
              title={`Ajustes y Cuenta: ${currentUser?.name || ''} (${currentUser?.email || ''})`}
            >
              <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-[10px]">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className="hidden md:inline font-semibold text-slate-300 max-w-[80px] truncate">
                {currentUser?.name?.split(' ')[0]}
              </span>
              <Cloud className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
              <Settings className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="max-w-3xl mx-auto w-full px-4 pt-5 flex-1">
        {activeTab === 'routines' && (
          <RoutinesScreen
            routines={routines}
            onStartRoutine={startRoutineWorkout}
            onCreateRoutine={(r) => setRoutines(prev => [r, ...prev])}
            onUpdateRoutine={(updated) => setRoutines(prev => prev.map(r => r.id === updated.id ? updated : r))}
            onDeleteRoutine={(id) => setRoutines(prev => prev.filter(r => r.id !== id))}
            workoutHistory={history}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen
            workouts={history}
            onDeleteWorkout={(id) => setHistory(prev => prev.filter(w => w.id !== id))}
            onImportWorkout={(w) => setHistory(prev => [w, ...prev])}
            onUpdateWorkout={(updated) => setHistory(prev => prev.map(w => w.id === updated.id ? updated : w))}
          />
        )}

        {activeTab === 'social' && (
          <SocialFeedScreen
            posts={socialPosts}
            onToggleKudos={handleToggleKudos}
            onAddComment={handleAddSocialComment}
            onCloneRoutine={handleCloneSocialRoutine}
            onStartRoutine={startRoutineWorkout}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsScreen 
            workouts={history} 
            onOpenBiomechanicsRAG={(joint) => {
              setIsAiModalOpen(true);
            }}
          />
        )}

        {/* Health, Steps, Calories & Body Hub */}
        {activeTab === 'health_hub' && (
          <div className="space-y-5">
            {/* Sub-tab Navigation Pills */}
            <div className="flex gap-1.5 p-1 bg-[#12141e] border border-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
              <button
                onClick={() => setHealthSubTab('diet')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl whitespace-nowrap transition flex items-center justify-center gap-1.5 ${
                  healthSubTab === 'diet'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Nutrición IA</span>
              </button>

              <button
                onClick={() => setHealthSubTab('nutrition')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl whitespace-nowrap transition flex items-center justify-center gap-1.5 ${
                  healthSubTab === 'nutrition'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Balance Kcal</span>
              </button>

              <button
                onClick={() => setHealthSubTab('steps')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl whitespace-nowrap transition flex items-center justify-center gap-1.5 ${
                  healthSubTab === 'steps'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Pasos & Cardio</span>
              </button>

              <button
                onClick={() => setHealthSubTab('body')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl whitespace-nowrap transition flex items-center justify-center gap-1.5 ${
                  healthSubTab === 'body'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Peso & Medidas</span>
              </button>
            </div>

            {/* Sub-tab view rendering */}
            {healthSubTab === 'diet' && (
              <FatSecretNutritionScreen
                currentWeightKg={weights[0]?.weight_kg || 78}
                onUpdateDailyCalories={(calories, protein, carbs, fat) => {
                  const today = new Date().toISOString().split('T')[0];
                  setCalorieHistory(prev => {
                    const filtered = prev.filter(c => c.date !== today);
                    return [{
                      id: `cal_${Date.now()}`,
                      date: today,
                      calories,
                      protein_grams: protein,
                      carbs_grams: carbs,
                      fat_grams: fat,
                      notes: 'Sincronizado desde Nutrición Inteligente (IA de Voz)'
                    }, ...filtered];
                  });
                }}
              />
            )}

            {healthSubTab === 'steps' && (
              <DailyStepsScreen
                stepHistory={stepHistory}
                onAddStepEntry={(entry) => setStepHistory(prev => [entry, ...prev])}
                syncHealthEnabled={settings.sync_health_apps}
                cardioSessions={cardioSessions}
                onAddCardioSession={(session) => setCardioSessions(prev => [session, ...prev])}
                onDeleteCardioSession={(id) => setCardioSessions(prev => prev.filter(c => c.id !== id))}
              />
            )}

            {healthSubTab === 'nutrition' && (
              <EnergyBalanceScreen
                currentWeightKg={weights[0]?.weight_kg || 78}
                weights={weights}
                avgDailySteps={stepHistory[0]?.steps || 9500}
                weeklyWorkoutsCount={history.length > 0 ? 4 : 3}
                cardioSessions={cardioSessions}
                calorieHistory={calorieHistory}
                onAddCalorieEntry={(entry) => setCalorieHistory(prev => [entry, ...prev])}
                onDeleteCalorieEntry={(id) => setCalorieHistory(prev => prev.filter(c => c.id !== id))}
              />
            )}

            {healthSubTab === 'body' && (
              <BodyTrackingScreen
                weights={weights}
                measurements={measurements}
                onAddWeight={(w) => setWeights(prev => [w, ...prev])}
                onDeleteWeight={(id) => setWeights(prev => prev.filter(w => w.id !== id))}
                onAddMeasurement={(m) => setMeasurements(prev => [m, ...prev])}
                onDeleteMeasurement={(id) => setMeasurements(prev => prev.filter(m => m.id !== id))}
              />
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation Dock with iOS Liquid Glass support */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#12141e]/90 backdrop-blur-2xl border-t border-slate-800/80 px-2 sm:px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between">
          
          <button
            onClick={() => setActiveTab('routines')}
            className={`flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-xl transition ${
              activeTab === 'routines'
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-5 h-5" />
            <span className="text-[11px] whitespace-nowrap">Rutinas</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-xl transition ${
              activeTab === 'history'
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[11px] whitespace-nowrap">Historial</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-xl transition ${
              activeTab === 'analytics'
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px] whitespace-nowrap">Progreso</span>
          </button>

          <button
            onClick={() => setActiveTab('health_hub')}
            className={`flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-xl transition ${
              activeTab === 'health_hub'
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-[11px] whitespace-nowrap">Salud & Kcal</span>
          </button>

          <button
            onClick={() => setActiveTab('social')}
            className={`flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-xl transition ${
              activeTab === 'social'
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px] whitespace-nowrap">Comunidad</span>
          </button>

        </div>
      </nav>

      {/* AI Machine Scanner & Biomechanical RAG Modal */}
      <AiBiomechanicsModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onAddExercise={handleAddExerciseFromAi}
      />

      {/* App Settings Modal with Account & Cloud Sync */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        currentUser={currentUser}
        onLogout={handleLogout}
        onForceSync={handleForceSync}
        syncStatus={syncStatus}
      />

    </div>
  );
}
export default App;
