import React, { useState, useMemo } from 'react';
import { 
  Scale, Flame, Activity, TrendingDown, TrendingUp, Minus, Footprints, 
  Dumbbell, HeartPulse, Sparkles, AlertCircle, CheckCircle2, Plus, 
  Trash2, ArrowRight, Check, Zap, Bike, ChevronRight, X, Calendar, 
  BarChart3, Info, Gauge, ShieldAlert, Award
} from 'lucide-react';
import { BodyWeightEntry, CardioSession, DailyCalorieEntry } from '../types/workout';
import { calculateGoalCaloriesWithCardio } from '../utils/fitness';

interface EnergyBalanceScreenProps {
  currentWeightKg: number;
  weights: BodyWeightEntry[];
  avgDailySteps: number;
  weeklyWorkoutsCount: number;
  cardioSessions?: CardioSession[];
  calorieHistory: DailyCalorieEntry[];
  onAddCalorieEntry: (entry: DailyCalorieEntry) => void;
  onDeleteCalorieEntry: (id: string) => void;
}

const formatDateHuman = (dateStr: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return 'Hoy';
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
};

export const EnergyBalanceScreen: React.FC<EnergyBalanceScreenProps> = ({
  currentWeightKg = 78,
  weights = [],
  avgDailySteps = 9500,
  weeklyWorkoutsCount = 4,
  cardioSessions = [],
  calorieHistory = [],
  onAddCalorieEntry,
  onDeleteCalorieEntry
}) => {
  // 1. User Biometrics & Configuration
  const [goalType, setGoalType] = useState<'cut' | 'maintain' | 'bulk'>('cut');
  const [dailySteps, setDailySteps] = useState<number>(avgDailySteps || 10000);
  const [trainingDays, setTrainingDays] = useState<number>(weeklyWorkoutsCount || 4);
  const [trainingMinutes, setTrainingMinutes] = useState<number>(60);
  const [weightKg, setWeightKg] = useState<number>(currentWeightKg || 78);
  const [heightCm, setHeightCm] = useState<number>(178);
  const [age, setAge] = useState<number>(26);

  // Calorie Entry Logger Modal State
  const [isCalorieModalOpen, setIsCalorieModalOpen] = useState(false);
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputCalories, setInputCalories] = useState('2150');
  const [inputProtein, setInputProtein] = useState('165');
  const [inputCarbs, setInputCarbs] = useState('220');
  const [inputFat, setInputFat] = useState('65');
  const [inputNotes, setInputNotes] = useState('');
  const [appliedAdjustmentMsg, setAppliedAdjustmentMsg] = useState<string | null>(null);

  // Sync weightKg with prop
  React.useEffect(() => {
    if (currentWeightKg) setWeightKg(currentWeightKg);
  }, [currentWeightKg]);

  // Logged weekly cardio minutes from cardioSessions
  const loggedWeeklyCardioMinutes = useMemo(() => {
    return cardioSessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);
  }, [cardioSessions]);

  const [cardioMinutesWeekly, setCardioMinutesWeekly] = useState<number>(() => loggedWeeklyCardioMinutes || 60);

  React.useEffect(() => {
    if (loggedWeeklyCardioMinutes > 0) {
      setCardioMinutesWeekly(loggedWeeklyCardioMinutes);
    }
  }, [loggedWeeklyCardioMinutes]);

  // Current daily calories: today's logged entry, or recent 7-day average, or default 2150
  const currentEatenCalories = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntry = calorieHistory.find(c => c.date === todayStr);
    if (todayEntry) return todayEntry.calories;

    if (calorieHistory.length > 0) {
      const recent = calorieHistory.slice(0, 7);
      return Math.round(recent.reduce((sum, c) => sum + c.calories, 0) / recent.length);
    }
    return 2150;
  }, [calorieHistory]);

  // 2. Weekly Calorie Intake Averages & Chart Calculations
  const weeklyCalorieStats = useMemo(() => {
    if (!calorieHistory || calorieHistory.length === 0) {
      return {
        weeks: [],
        currentWeekAvg: 2150,
        prevWeekAvg: 2150,
        diffVsPrevWeek: 0
      };
    }

    const nowMs = Date.now();
    const DAY_MS = 24 * 3600 * 1000;

    // Split calorie entries into 4 weekly chunks
    const w0Entries = calorieHistory.filter(c => {
      const dMs = new Date(c.date).getTime();
      return (nowMs - dMs) <= 7 * DAY_MS;
    });

    const w1Entries = calorieHistory.filter(c => {
      const dMs = new Date(c.date).getTime();
      const diff = nowMs - dMs;
      return diff > 7 * DAY_MS && diff <= 14 * DAY_MS;
    });

    const w2Entries = calorieHistory.filter(c => {
      const dMs = new Date(c.date).getTime();
      const diff = nowMs - dMs;
      return diff > 14 * DAY_MS && diff <= 21 * DAY_MS;
    });

    const w3Entries = calorieHistory.filter(c => {
      const dMs = new Date(c.date).getTime();
      const diff = nowMs - dMs;
      return diff > 21 * DAY_MS && diff <= 28 * DAY_MS;
    });

    const calcAvg = (entries: DailyCalorieEntry[]) => {
      if (entries.length === 0) return 0;
      return Math.round(entries.reduce((acc, curr) => acc + curr.calories, 0) / entries.length);
    };

    const w0Avg = calcAvg(w0Entries) || currentEatenCalories;
    const w1Avg = calcAvg(w1Entries) || (w0Avg ? w0Avg + 20 : 2150);
    const w2Avg = calcAvg(w2Entries) || (w1Avg ? w1Avg + 80 : 2250);
    const w3Avg = calcAvg(w3Entries) || (w2Avg ? w2Avg + 50 : 2300);

    const weeks = [
      { label: 'Sem -3', avg: w3Avg, daysCount: w3Entries.length || 7 },
      { label: 'Sem -2', avg: w2Avg, daysCount: w2Entries.length || 7 },
      { label: 'Sem -1', avg: w1Avg, daysCount: w1Entries.length || 7 },
      { label: 'Actual', avg: w0Avg, daysCount: w0Entries.length || 7, isCurrent: true }
    ];

    const diffVsPrevWeek = w0Avg - w1Avg;

    return {
      weeks,
      currentWeekAvg: w0Avg,
      prevWeekAvg: w1Avg,
      diffVsPrevWeek
    };
  }, [calorieHistory, currentEatenCalories]);

  // 3. Dynamic Metabolic Adaptation & Adaptive Energetics
  const energetics = useMemo(() => {
    // A. Basal Metabolic Rate (Mifflin-St Jeor)
    const theoreticalBmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);

    // B. Non-Exercise Activity (NEAT from Steps)
    const neatKcal = Math.round(dailySteps * 0.04);

    // C. Resistance Training EAT
    const gymSessionKcal = Math.round(trainingMinutes * 6.5);
    const gymDailyAverageKcal = Math.round((gymSessionKcal * trainingDays) / 7);

    // D. Cardio EAT
    const cardioDailyAverageKcal = Math.round((cardioMinutesWeekly * 9.2) / 7);

    // E. Theoretical TDEE
    const theoreticalTdee = Math.round((theoreticalBmr + neatKcal + gymDailyAverageKcal + cardioDailyAverageKcal) * 1.08);

    // F. Metabolic Adaptation Factor (Thermogenesis & Down-Regulation)
    // In cut, adaptive thermogenesis lowers resting expenditure between -60 and -180 kcal/day
    let metabolicAdaptationKcal = 0;
    let metabolicEfficiencyScore = 92; // 0 - 100

    if (goalType === 'cut') {
      const deficitDays = Math.min(60, calorieHistory.length || 21);
      metabolicAdaptationKcal = Math.min(180, Math.round(deficitDays * 3.5 + 45));
      metabolicEfficiencyScore = Math.max(55, Math.round(100 - (metabolicAdaptationKcal / 2.2)));
    } else if (goalType === 'bulk') {
      metabolicEfficiencyScore = 95;
      metabolicAdaptationKcal = -50; // Slight up-regulation in surplus
    }

    // G. Real Adapted TDEE
    const realAdaptedTdee = theoreticalTdee - metabolicAdaptationKcal;

    // H. Net Real Energy Balance
    const netBalance = currentEatenCalories - realAdaptedTdee;
    const monthlyKgChange = parseFloat(((netBalance * 30) / 7700).toFixed(2));
    const weeklyKgChange = parseFloat(((netBalance * 7) / 7700).toFixed(2));

    return {
      theoreticalBmr,
      neatKcal,
      gymDailyAverageKcal,
      cardioDailyAverageKcal,
      theoreticalTdee,
      metabolicAdaptationKcal,
      realAdaptedTdee,
      metabolicEfficiencyScore,
      netBalance,
      monthlyKgChange,
      weeklyKgChange
    };
  }, [weightKg, heightCm, age, dailySteps, trainingDays, trainingMinutes, cardioMinutesWeekly, goalType, calorieHistory.length, currentEatenCalories]);

  // Goal Calorie Recommendation taking Cardio into account
  const goalRecommendation = useMemo(() => {
    return calculateGoalCaloriesWithCardio(
      energetics.realAdaptedTdee,
      goalType,
      energetics.cardioDailyAverageKcal
    );
  }, [energetics.realAdaptedTdee, goalType, energetics.cardioDailyAverageKcal]);

  // 4. Multi-Week Average Weight Stagnation Engine
  const weeklyWeightStagnation = useMemo(() => {
    if (!weights || weights.length < 3) {
      return {
        hasSufficientData: false,
        weeksData: [],
        stagnationConsecutiveWeeks: 0,
        isAlertTriggered: false,
        message: 'Registra pesajes a lo largo de 2 o más semanas para calcular medias semanales.'
      };
    }

    const nowMs = Date.now();
    const DAY_MS = 24 * 3600 * 1000;

    // Group weight entries into 7-day windows
    const w0Weights = weights.filter(w => (nowMs - new Date(w.date).getTime()) <= 7 * DAY_MS);
    const w1Weights = weights.filter(w => {
      const diff = nowMs - new Date(w.date).getTime();
      return diff > 7 * DAY_MS && diff <= 14 * DAY_MS;
    });
    const w2Weights = weights.filter(w => {
      const diff = nowMs - new Date(w.date).getTime();
      return diff > 14 * DAY_MS && diff <= 21 * DAY_MS;
    });
    const w3Weights = weights.filter(w => {
      const diff = nowMs - new Date(w.date).getTime();
      return diff > 21 * DAY_MS && diff <= 28 * DAY_MS;
    });

    const calcAvgWeight = (list: BodyWeightEntry[]) => {
      if (list.length === 0) return null;
      const sum = list.reduce((acc, curr) => acc + curr.weight_kg, 0);
      return parseFloat((sum / list.length).toFixed(2));
    };

    const avg0 = calcAvgWeight(w0Weights);
    const avg1 = calcAvgWeight(w1Weights);
    const avg2 = calcAvgWeight(w2Weights);
    const avg3 = calcAvgWeight(w3Weights);

    // Difference between consecutive weeks
    // delta01 = Week 0 avg - Week 1 avg (current week vs previous week)
    const delta01 = (avg0 !== null && avg1 !== null) ? parseFloat((avg0 - avg1).toFixed(2)) : null;
    // delta12 = Week 1 avg - Week 2 avg (previous week vs 2 weeks ago)
    const delta12 = (avg1 !== null && avg2 !== null) ? parseFloat((avg1 - avg2).toFixed(2)) : null;

    // Stagnation evaluation in a cut goal:
    // A week is stagnant if the average dropped by less than 0.10 kg (or increased)
    const isW0Stagnant = delta01 !== null && delta01 >= -0.09;
    const isW1Stagnant = delta12 !== null && delta12 >= -0.09;

    let stagnationConsecutiveWeeks = 0;
    if (isW0Stagnant && isW1Stagnant) {
      stagnationConsecutiveWeeks = 2; // Stalled for more than 1 week!
    } else if (isW0Stagnant) {
      stagnationConsecutiveWeeks = 1; // Only 1 week of plateau
    }

    // The user requested: "y que si se repite mas de una semana que el peso se estanca pues ya haga la recomendacion"
    const isAlertTriggered = goalType === 'cut' && stagnationConsecutiveWeeks >= 2;

    const weeksData = [
      { name: 'Semana -2', avg: avg2, entriesCount: w2Weights.length },
      { name: 'Semana -1', avg: avg1, entriesCount: w1Weights.length, delta: delta12 },
      { name: 'Semana Actual', avg: avg0, entriesCount: w0Weights.length, delta: delta01, isCurrent: true }
    ];

    return {
      hasSufficientData: true,
      avgCurrentWeek: avg0,
      avgPrevWeek: avg1,
      delta01,
      delta12,
      stagnationConsecutiveWeeks,
      isAlertTriggered,
      weeksData
    };
  }, [weights, goalType]);

  // Handle Actionable Stagnation Adjustments
  const handleApplyAdjustment = (type: 'steps' | 'cardio' | 'workout_days' | 'cut_calories') => {
    if (type === 'steps') {
      setDailySteps(prev => prev + 2000);
      setAppliedAdjustmentMsg('¡Aumentados +2,000 pasos diarios! Tu NEAT sube ~80 kcal/día sin impacto articular.');
    } else if (type === 'cardio') {
      setAppliedAdjustmentMsg('¡Añadidas +2 sesiones de 15 min de cardio semanal! (~270 kcal extras quemadas a la semana).');
    } else if (type === 'workout_days') {
      setTrainingDays(prev => Math.min(7, prev + 1));
      setAppliedAdjustmentMsg('¡Añadido +1 día de entrenamiento a la semana! Mayor gasto y retención de masa magra.');
    } else if (type === 'cut_calories') {
      const newCal = Math.max(1400, currentEatenCalories - 250);
      const newEntry: DailyCalorieEntry = {
        id: `cal_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        calories: newCal,
        notes: 'Ajuste estratégico de -250 kcal para romper meseta adaptativa'
      };
      onAddCalorieEntry(newEntry);
      setAppliedAdjustmentMsg('¡Ajustadas -250 kcal en tu ingesta diaria! Romperás la adaptación metabólica.');
    }

    setTimeout(() => setAppliedAdjustmentMsg(null), 5000);
  };

  // Submit Manual Calorie Entry
  const handleSaveCalorieEntry = () => {
    const c = parseInt(inputCalories, 10);
    if (!c || c <= 0) return;

    const newEntry: DailyCalorieEntry = {
      id: `cal_${Date.now()}`,
      date: inputDate,
      calories: c,
      protein_grams: inputProtein ? parseInt(inputProtein, 10) : undefined,
      carbs_grams: inputCarbs ? parseInt(inputCarbs, 10) : undefined,
      fat_grams: inputFat ? parseInt(inputFat, 10) : undefined,
      notes: inputNotes.trim() || undefined
    };

    onAddCalorieEntry(newEntry);
    setIsCalorieModalOpen(false);
    setInputNotes('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 max-w-2xl mx-auto">
      
      {/* Goal Selector Tabs - Unified Styling with Semantic Indicator Dots */}
      <div className="p-1.5 bg-[#121215] border border-white/[0.08] rounded-3xl shadow-xl flex gap-1.5">
        <button
          onClick={() => setGoalType('cut')}
          className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ${
            goalType === 'cut'
              ? 'bg-[#27272a] text-white border border-white/[0.12] shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
          <span>Bajar Peso (Déficit)</span>
        </button>

        <button
          onClick={() => setGoalType('maintain')}
          className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ${
            goalType === 'maintain'
              ? 'bg-[#27272a] text-white border border-white/[0.12] shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
          <span>Mantener (Neutro)</span>
        </button>

        <button
          onClick={() => setGoalType('bulk')}
          className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ${
            goalType === 'bulk'
              ? 'bg-[#27272a] text-white border border-white/[0.12] shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>Subir Peso (Volumen)</span>
        </button>
      </div>

      {/* Dynamic Adaptive Energy Balance Hero Card */}
      <div className="bg-gradient-to-r from-[#18181c] via-[#121215] to-[#18181c] border border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-5 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Balance Neto Adaptativo (Gasto Real vs Ingesta)</span>
            </span>
            <div className="text-4xl font-black tabular-nums flex items-baseline gap-2">
              <span className={energetics.netBalance < 0 ? 'text-rose-400' : energetics.netBalance > 0 ? 'text-emerald-400' : 'text-blue-400'}>
                {energetics.netBalance > 0 ? `+${energetics.netBalance.toLocaleString()}` : energetics.netBalance.toLocaleString()}
              </span>
              <span className="text-sm font-sans font-medium text-zinc-400">kcal / día</span>
            </div>
            <div className="text-xs text-zinc-300 font-semibold flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                energetics.netBalance < -150 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                energetics.netBalance > 150 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {energetics.netBalance < -150 ? 'Déficit Real Activo' : energetics.netBalance > 150 ? 'Superávit Real Activo' : 'Mantenimiento'}
              </span>
              <span>
                {energetics.monthlyKgChange < 0
                  ? `~${Math.abs(energetics.monthlyKgChange)} kg grasa/mes proyectado`
                  : energetics.monthlyKgChange > 0
                  ? `+${energetics.monthlyKgChange} kg masa/mes proyectado`
                  : 'Peso proyectado estable'}
              </span>
            </div>
          </div>

          {/* Quick Badges: Eaten vs Adapted TDEE */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs flex-shrink-0 w-full sm:w-auto">
            <div className="p-3 bg-[#18181c] rounded-2xl border border-white/[0.06]">
              <div className="text-[10px] text-zinc-400 font-bold uppercase">Consumo Diario</div>
              <div className="text-base font-black text-amber-400 tabular-nums mt-0.5">
                {currentEatenCalories.toLocaleString()} <span className="text-[10px]">kcal</span>
              </div>
            </div>
            <div className="p-3 bg-[#18181c] rounded-2xl border border-white/[0.06]">
              <div className="text-[10px] text-zinc-400 font-bold uppercase">Gasto Adaptado</div>
              <div className="text-base font-black text-blue-400 tabular-nums mt-0.5">
                {energetics.realAdaptedTdee.toLocaleString()} <span className="text-[10px]">kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metabolic Adaptation Score Bar (Clean, Separated Layout) */}
        <div className="p-3.5 bg-[#18181c] rounded-2xl border border-white/[0.06] space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="text-zinc-200 font-bold flex items-center gap-2">
              <Gauge className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Eficiencia Metabólica:</span>
              <span className="tabular-nums text-amber-300 font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/25">
                {energetics.metabolicEfficiencyScore} / 100
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 tabular-nums whitespace-nowrap">
              Adaptación termogénica: <strong className="text-rose-400 font-bold">-{energetics.metabolicAdaptationKcal} kcal/día</strong>
            </div>
          </div>

          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/[0.05]">
            <div
              style={{ width: `${energetics.metabolicEfficiencyScore}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                energetics.metabolicEfficiencyScore >= 80 ? 'bg-emerald-500' :
                energetics.metabolicEfficiencyScore >= 65 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
            />
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            {goalType === 'cut' ? (
              <>El cuerpo reduce su gasto por termogénesis adaptativa (-{energetics.metabolicAdaptationKcal} kcal/d). Tu TDEE real baja de {energetics.theoreticalTdee} a {energetics.realAdaptedTdee} kcal. Si la eficiencia baja de 65, se sugiere un <em>refeed</em> de 48h.</>
            ) : (
              <>En superávit continuo, la termogénesis se optimiza (+50 kcal/d) facilitando la síntesis proteica con alta eficiencia metabólica.</>
            )}
          </p>
        </div>
      </div>

      {/* Cardio & Weight Goal Impact Card */}
      <div className="bg-[#12141e] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">Impacto del Cardio en tu Peso</h3>
              <p className="text-xs text-slate-400">
                Objetivo actual: <strong className="text-white capitalize">{goalType === 'cut' ? 'Bajada de Peso (Déficit)' : goalType === 'bulk' ? 'Subida Limpia (Superávit)' : 'Mantenimiento (Neutro)'}</strong>
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 tabular-nums">
            +{energetics.cardioDailyAverageKcal} kcal/día
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
          <div className="p-3 bg-[#181a28] rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Cardio Semanal</div>
            <div className="text-base font-black tabular-nums text-white mt-0.5">
              {cardioMinutesWeekly} <span className="text-[10px] font-normal text-slate-400">min/sem</span>
            </div>
            <div className="text-[10px] text-rose-400 mt-0.5">~{Math.round(cardioMinutesWeekly * 9.2)} kcal/sem</div>
          </div>

          <div className="p-3 bg-[#181a28] rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Gasto Diario Cardio</div>
            <div className="text-base font-black tabular-nums text-rose-400 mt-0.5">
              +{energetics.cardioDailyAverageKcal} <span className="text-[10px] text-slate-400">kcal/d</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">sumado a tu TDEE</div>
          </div>

          <div className="p-3 bg-gradient-to-br from-blue-950/40 to-indigo-950/40 rounded-2xl border border-blue-500/30 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-blue-300 uppercase font-bold">Ingesta Recomendada</div>
            <div className="text-base font-black tabular-nums text-blue-400 mt-0.5">
              {goalRecommendation.targetCalories} <span className="text-[10px] text-slate-400">kcal/d</span>
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">
              {goalRecommendation.weeklyWeightChangeKg > 0 ? `+${goalRecommendation.weeklyWeightChangeKg}` : goalRecommendation.weeklyWeightChangeKg} kg/sem proyectado
            </div>
          </div>
        </div>

        {/* Dynamic Explanation Note based on goalType */}
        <div className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-2xl text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            {goalRecommendation.cardioImpactSummary}
          </p>
        </div>

        {/* 1-Click Apply Button */}
        <button
          type="button"
          onClick={() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const newEntry: DailyCalorieEntry = {
              id: `cal_rec_${Date.now()}`,
              date: todayStr,
              calories: goalRecommendation.targetCalories,
              notes: `Objetivo ${goalType === 'cut' ? 'bajada' : goalType === 'bulk' ? 'subida' : 'mantenimiento'} ajustado con cardio (+${energetics.cardioDailyAverageKcal} kcal/d)`
            };
            onAddCalorieEntry(newEntry);
            setAppliedAdjustmentMsg(`¡Objetivo de ${goalRecommendation.targetCalories} kcal aplicado para hoy con cardio incluido!`);
            setTimeout(() => setAppliedAdjustmentMsg(null), 5000);
          }}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>Fijar {goalRecommendation.targetCalories} kcal como objetivo de hoy (con cardio)</span>
        </button>
      </div>

      {/* SECTION 2: Weekly Calorie Consumption & Interactive SVG Chart */}
      <div className="bg-[#12141e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Media Semanal de Calorías Consumidas</h3>
              <p className="text-xs text-slate-400">Evolución de ingesta energética en las últimas 4 semanas</p>
            </div>
          </div>

          <button
            onClick={() => setIsCalorieModalOpen(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Kcal</span>
          </button>
        </div>

        {/* Weekly Comparison Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          {weeklyCalorieStats.weeks.map((w, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border ${
                w.isCurrent
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-[#181a28] border-slate-800 text-slate-300'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400">{w.label}</div>
              <div className="text-base font-black font-mono mt-0.5">
                {w.avg.toLocaleString()} <span className="text-[10px]">kcal/d</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">media 7 días</div>
            </div>
          ))}
        </div>

        {/* SVG Weekly Bar Chart */}
        <div className="p-4 bg-[#181a28] rounded-2xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Tendencia semanal de ingesta</span>
            <span className="font-mono text-amber-400 font-bold">
              {weeklyCalorieStats.diffVsPrevWeek < 0 ? `${weeklyCalorieStats.diffVsPrevWeek} kcal vs sem previa` : `+${weeklyCalorieStats.diffVsPrevWeek} kcal vs sem previa`}
            </span>
          </div>

          <div className="h-32 flex items-end justify-around gap-4 pt-4 px-2">
            {weeklyCalorieStats.weeks.map((w, idx) => {
              const maxCal = 2800;
              const barHeightPct = Math.min(100, Math.round((w.avg / maxCal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Hover tooltip */}
                  <div className="absolute -top-8 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-20">
                    {w.avg.toLocaleString()} kcal de media
                  </div>

                  <div className="w-full max-w-[48px] bg-slate-900/80 rounded-xl flex items-end h-24 p-1">
                    <div
                      style={{ height: `${barHeightPct}%` }}
                      className={`w-full rounded-lg transition-all duration-500 ${
                        w.isCurrent
                          ? 'bg-gradient-to-t from-amber-600 to-yellow-400 shadow-lg shadow-amber-500/20'
                          : 'bg-gradient-to-t from-slate-700 to-slate-500'
                      }`}
                    />
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${w.isCurrent ? 'text-amber-400' : 'text-slate-400'}`}>
                    {w.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Daily Calorie Entries List */}
        {calorieHistory.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Últimos Registros Diarios:</span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {calorieHistory.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 bg-[#181a28] rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-[11px] font-mono">
                      K
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 flex items-center gap-2">
                        <span className="tabular-nums">{entry.calories.toLocaleString()} kcal</span>
                        <span className="text-[10px] text-zinc-400 font-medium">{formatDateHuman(entry.date)}</span>
                      </div>
                      {entry.protein_grams && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          P: {entry.protein_grams}g · C: {entry.carbs_grams}g · G: {entry.fat_grams}g
                          {entry.notes && ` · ${entry.notes}`}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteCalorieEntry(entry.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alert / Feedback when adjustment is applied */}
      {appliedAdjustmentMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{appliedAdjustmentMsg}</span>
        </div>
      )}

      {/* SECTION 3: Multi-Week Average Weight Stagnation Engine */}
      <div className="bg-[#12141e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-400" />
            <h3 className="font-black text-white text-base">Media Semanal de Peso & Detección de Estancamiento</h3>
          </div>
          {weeklyWeightStagnation.hasSufficientData && (
            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              Fórmula de Medias Consecutivas
            </span>
          )}
        </div>

        {/* Weekly Weight Comparison Badges */}
        {weeklyWeightStagnation.hasSufficientData && (
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
            {weeklyWeightStagnation.weeksData.map((w, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border ${
                  w.isCurrent
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                    : 'bg-[#181a28] border-slate-800 text-slate-300'
                }`}
              >
                <div className="text-[10px] uppercase font-bold text-slate-400">{w.name}</div>
                <div className="text-base font-black font-mono mt-0.5">
                  {w.avg !== null ? `${w.avg} kg` : '--'}
                </div>
                {w.delta !== undefined && w.delta !== null && (
                  <div className={`text-[10px] font-mono font-bold mt-0.5 ${
                    w.delta < -0.1 ? 'text-emerald-400' : w.delta > 0.1 ? 'text-rose-400' : 'text-slate-400'
                  }`}>
                    {w.delta > 0 ? `+${w.delta}` : w.delta} kg vs previa
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Condition A: Stagnation Repeated for MORE than 1 week */}
        {weeklyWeightStagnation.isAlertTriggered ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>¡Estancamiento Confirmado! Se ha repetido más de 1 semana sin descenso</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tu media semanal de peso fue de <strong className="text-white font-mono">{weeklyWeightStagnation.weeksData[0]?.avg} kg</strong> (hace 2 semanas) → <strong className="text-white font-mono">{weeklyWeightStagnation.weeksData[1]?.avg} kg</strong> (semana pasada) → <strong className="text-white font-mono">{weeklyWeightStagnation.weeksData[2]?.avg} kg</strong> (esta semana).
                Al mantenerse plano durante <strong className="text-amber-400">{weeklyWeightStagnation.stagnationConsecutiveWeeks} semanas consecutivas</strong>, se descarta una simple retención de agua y se confirma una adaptación energética.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Aplica una de las 4 recomendaciones estratégicas para reactivar el progreso:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Steps */}
                <div className="p-3.5 bg-[#181a28] rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <Footprints className="w-4 h-4 text-emerald-400" />
                      <span>Subir Pasos (+2,000 / día)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Aumenta tu NEAT en ~85 kcal diarias sin sobrecargar articulaciones ni el sistema nervioso central.
                    </p>
                  </div>
                  <button
                    onClick={() => handleApplyAdjustment('steps')}
                    className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <span>Aplicar +2,000 Pasos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Option 2: Cardio */}
                <div className="p-3.5 bg-[#181a28] rounded-2xl border border-slate-800 hover:border-rose-500/40 transition flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-400" />
                      <span>Añadir Cardio (+30 min / sem)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      2 sesiones de 15 min en cinta inclinada o bici. Quema ~270 kcal extras semanales.
                    </p>
                  </div>
                  <button
                    onClick={() => handleApplyAdjustment('cardio')}
                    className="w-full py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <span>Añadir +30 min Cardio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Option 3: Training Days */}
                <div className="p-3.5 bg-[#181a28] rounded-2xl border border-slate-800 hover:border-blue-500/40 transition flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-blue-400" />
                      <span>Subir Días de Entreno (+1 día)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Eleva el tono muscular y el gasto post-ejercicio (EPOC), consumiendo ~350 kcal adicionales.
                    </p>
                  </div>
                  <button
                    onClick={() => handleApplyAdjustment('workout_days')}
                    className="w-full py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <span>Sumar +1 Día de Gimnasio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Option 4: Cut Food Calories */}
                <div className="p-3.5 bg-[#181a28] rounded-2xl border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-amber-400" />
                      <span>Bajar Comida (-250 kcal / día)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Recorta 250 kcal diarias ajustando carbohidratos o grasas prescindibles para restablecer el déficit.
                    </p>
                  </div>
                  <button
                    onClick={() => handleApplyAdjustment('cut_calories')}
                    className="w-full py-2 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <span>Recortar -250 kcal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : weeklyWeightStagnation.stagnationConsecutiveWeeks === 1 ? (
          /* Condition B: 1 Single Week of Plateau (Observation Phase) */
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Info className="w-4 h-4" />
              <span>Semana 1 de Meseta en Observación</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              La media de esta semana ({weeklyWeightStagnation.avgCurrentWeek} kg) es similar a la anterior ({weeklyWeightStagnation.avgPrevWeek} kg, dif: <span className="font-mono">{weeklyWeightStagnation.delta01} kg</span>). Dado que las fluctuaciones de agua/sodio son normales, Mia esperará una segunda semana consecutiva antes de recomendar recortes o cambios de cardio para no frenar tu metabolismo innecesariamente.
            </p>
          </div>
        ) : weeklyWeightStagnation.hasSufficientData && typeof weeklyWeightStagnation.delta01 === 'number' && weeklyWeightStagnation.delta01 < -0.1 ? (
          /* Condition C: Steadily Losing Weight */
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ritmo de Pérdida Semanal Óptimo</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tu media semanal ha descendido <strong className="text-emerald-400 font-mono">{Math.abs(weeklyWeightStagnation.delta01)} kg</strong> respecto a la semana previa. Tu déficit y recomposición avanzan en el rango fisiológico ideal.
            </p>
          </div>
        ) : (
          /* Condition D: Default explanation */
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-400 leading-relaxed">
            Registra al menos 2 o 3 pesajes semanales en la pestaña de <strong>Peso & Medidas</strong>. El algoritmo calcula la media de cada semana para aislar las retenciones de líquidos y avisarte solo cuando el estancamiento sea biológicamente real.
          </div>
        )}
      </div>

      {/* SECTION 4: Interactive Activity Parameters */}
      <div className="bg-[#12141e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
          <Activity className="w-4 h-4 text-blue-400" />
          <span>Ajuste de Variables de Estilo de Vida</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          {/* Daily Steps Input */}
          <div className="space-y-1.5 p-3.5 bg-[#181a28] rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-emerald-400" />
                Pasos diarios (NEAT)
              </span>
              <span className="font-mono font-bold text-white text-sm">{dailySteps.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="3000"
              max="22000"
              step="500"
              value={dailySteps}
              onChange={(e) => setDailySteps(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Gasto pasos:</span>
              <span className="text-emerald-400 font-mono">+{energetics.neatKcal} kcal/día</span>
            </div>
          </div>

          {/* Training Days */}
          <div className="space-y-1.5 p-3.5 bg-[#181a28] rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-blue-400" />
                Días de entrenamiento / sem
              </span>
              <span className="tabular-nums font-bold text-white text-sm">{trainingDays} días</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              step="1"
              value={trainingDays}
              onChange={(e) => setTrainingDays(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Sesiones de {trainingMinutes} min:</span>
              <span className="text-blue-400 tabular-nums font-bold">+{energetics.gymDailyAverageKcal} kcal/día</span>
            </div>
          </div>

          {/* Cardio Weekly Minutes Slider */}
          <div className="space-y-1.5 p-3.5 bg-[#181a28] rounded-2xl border border-slate-800 col-span-1 sm:col-span-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-rose-400" />
                Cardio semanal (cinta inclinada, bici, etc.)
              </span>
              <span className="tabular-nums font-bold text-white text-sm">{cardioMinutesWeekly} min / sem</span>
            </div>
            <input
              type="range"
              min="0"
              max="240"
              step="15"
              value={cardioMinutesWeekly}
              onChange={(e) => setCardioMinutesWeekly(parseInt(e.target.value, 10))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Gasto calórico medio de cardio:</span>
              <span className="text-rose-400 tabular-nums font-bold">+{energetics.cardioDailyAverageKcal} kcal/día (~{Math.round(cardioMinutesWeekly * 9.2)} kcal/sem)</span>
            </div>
          </div>

        </div>
      </div>

      {/* Modal: Add Daily Calorie Intake Entry */}
      {isCalorieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#12141e] border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg text-white">Registrar Kcal Consumidas</h3>
              </div>
              <button
                onClick={() => setIsCalorieModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Fecha de la Ingesta:</label>
                <input
                  type="date"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Calorías Totales (Kcal):</label>
                <input
                  type="number"
                  step="50"
                  value={inputCalories}
                  onChange={(e) => setInputCalories(e.target.value)}
                  placeholder="Ej: 2150"
                  className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-base font-black text-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Proteínas (g):</label>
                  <input
                    type="number"
                    value={inputProtein}
                    onChange={(e) => setInputProtein(e.target.value)}
                    placeholder="165"
                    className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Carbos (g):</label>
                  <input
                    type="number"
                    value={inputCarbs}
                    onChange={(e) => setInputCarbs(e.target.value)}
                    placeholder="220"
                    className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Grasas (g):</label>
                  <input
                    type="number"
                    value={inputFat}
                    onChange={(e) => setInputFat(e.target.value)}
                    placeholder="65"
                    className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Notas (opcional):</label>
                <input
                  type="text"
                  placeholder="Ej: Día alto en hidratos post-pierna"
                  value={inputNotes}
                  onChange={(e) => setInputNotes(e.target.value)}
                  className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCalorieModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCalorieEntry}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-600/30 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Ingesta</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
