import React, { useState, useMemo } from 'react';
import { Footprints, Flame, MapPin, RefreshCw, Smartphone, Heart, Calendar, Plus, Trophy, Check, TrendingUp, Bike, Trash2, X } from 'lucide-react';
import { DailyStepEntry, CardioSession } from '../types/workout';
import { calculateCardioSessionCalories, stepsToActiveCalories, stepsToDistanceKm } from '../utils/stepMath';

interface DailyStepsScreenProps {
  stepHistory: DailyStepEntry[];
  onAddStepEntry: (entry: DailyStepEntry) => void;
  cardioSessions?: CardioSession[];
  onAddCardioSession?: (session: CardioSession) => void;
  onDeleteCardioSession?: (id: string) => void;
}

const formatDisplayDate = (dateStr: string) => {
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

export const DailyStepsScreen: React.FC<DailyStepsScreenProps> = ({
  stepHistory,
  onAddStepEntry,
  cardioSessions = [],
  onAddCardioSession,
  onDeleteCardioSession
}) => {
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualSteps, setManualSteps] = useState('10000');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);

  // Cardio Logger Modal state
  const [isCardioModalOpen, setIsCardioModalOpen] = useState(false);
  const [cardioActivity, setCardioActivity] = useState<'incline_treadmill' | 'bike' | 'running' | 'elliptical' | 'rower'>('incline_treadmill');
  const [cardioDuration, setCardioDuration] = useState(25);
  const [cardioIncline, setCardioIncline] = useState(10);
  const [cardioSpeed, setCardioSpeed] = useState(5.2);
  const [cardioNotes, setCardioNotes] = useState('');
  const [weeklyCardioTargetMinutes, setWeeklyCardioTargetMinutes] = useState(90);

  const loggedWeeklyCardioMinutes = useMemo(() => {
    return cardioSessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);
  }, [cardioSessions]);

  // Today's entry or zeroes. Never show an old entry as today's data.
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = stepHistory.find(s => s.date === todayStr) || {
    id: 'step_today',
    date: todayStr,
    steps: 0,
    distance_km: 0,
    active_calories: 0,
    source: 'Sin datos'
  };

  const STEP_GOAL = 10000;
  const progressPct = Math.min(100, Math.round((todayEntry.steps / STEP_GOAL) * 100));

  // Compute 7-day average
  const recent7Days = stepHistory.slice(0, 7);
  const avgSteps7d = Math.round(recent7Days.reduce((sum, s) => sum + s.steps, 0) / (recent7Days.length || 1));
  const totalKm7d = recent7Days.reduce((sum, s) => sum + s.distance_km, 0).toFixed(1);
  const totalKcal7d = recent7Days.reduce((sum, s) => sum + s.active_calories, 0);

  // There is no automatic Health Connect / Apple Health integration in this app:
  // browsers cannot read those stores, and inventing step counts would be fake data.
  const handleSyncHealth = () => {
    setSyncMessage(
      'La sincronización automática con Health Connect o Apple Health no está implementada. Usa «Añadir» para registrar tus pasos manualmente.'
    );
  };

  const handleSaveManual = () => {
    const s = parseInt(manualSteps, 10);
    if (!s || s <= 0) return;

    const km = stepsToDistanceKm(s, 0.75);
    const kcal = stepsToActiveCalories(s, 78);

    const newEntry: DailyStepEntry = {
      id: `step_${Date.now()}`,
      date: manualDate,
      steps: s,
      distance_km: km,
      active_calories: kcal,
      source: 'Manual'
    };

    onAddStepEntry(newEntry);
    setIsManualModalOpen(false);
  };

  const handleSaveCardio = () => {
    if (!onAddCardioSession) return;
    const activityNames: Record<string, string> = {
      incline_treadmill: `Cinta Inclinada (${cardioIncline}% / ${cardioSpeed} km/h)`,
      bike: 'Bicicleta Estática / Spinning',
      running: 'Carrera Continua',
      elliptical: 'Elíptica',
      rower: 'Remo Indoor Concept2'
    };

    const estimatedKcal = calculateCardioSessionCalories({
      activity_type: cardioActivity,
      duration_minutes: cardioDuration,
      weightKg: 78,
      incline_percentage: cardioActivity === 'incline_treadmill' ? cardioIncline : undefined,
      speed_kmh: cardioSpeed
    });

    const newSession: CardioSession = {
      id: `cardio_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      activity_type: cardioActivity,
      activity_name: activityNames[cardioActivity],
      duration_minutes: cardioDuration,
      incline_percentage: cardioActivity === 'incline_treadmill' ? cardioIncline : undefined,
      speed_kmh: cardioSpeed,
      estimated_calories: estimatedKcal,
      notes: cardioNotes.trim() || undefined
    };

    onAddCardioSession(newSession);
    setIsCardioModalOpen(false);
    setCardioNotes('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Top Banner / Sync Status */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-[#12141e] to-blue-950/40 border border-emerald-500/30 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Footprints className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Pasos Diarios & NEAT</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Registro local
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pasos introducidos a mano y cardio de este dispositivo. Sin integración con Health Connect ni Apple Health.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir</span>
          </button>

          <button
            onClick={handleSyncHealth}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start gap-2 animate-in fade-in">
          <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Today's Steps Main Card */}
        <div className="sm:col-span-1 bg-[#12141e] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pasos de Hoy</span>
            <span className="text-xs tabular-nums font-bold text-emerald-400">{progressPct}%</span>
          </div>

          <div className="text-center py-2">
            <div className="text-4xl font-black text-white tabular-nums tracking-tight">
              {todayEntry.steps.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Meta: <b className="text-slate-200">{STEP_GOAL.toLocaleString()} pasos</b>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700 shadow-md"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <b>{todayEntry.distance_km} km</b>
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <b>{todayEntry.active_calories} kcal</b>
            </span>
          </div>
        </div>

        {/* 7-Day Average & Performance */}
        <div className="sm:col-span-2 bg-[#12141e] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Media Semanal (Últimos 7 días)</span>
            </div>
            <span className="text-xs text-slate-500">
              {todayEntry.source}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 py-1">
            <div className="p-3 bg-[#181a28] rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Media Diaria</span>
              <div className="text-xl font-black text-emerald-400 tabular-nums mt-0.5">
                {avgSteps7d.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">pasos / día</span>
            </div>

            <div className="p-3 bg-[#181a28] rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Distancia 7d</span>
              <div className="text-xl font-black text-blue-400 tabular-nums mt-0.5">
                {totalKm7d}
              </div>
              <span className="text-[10px] text-slate-500">km recorridos</span>
            </div>

            <div className="p-3 bg-[#181a28] rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Gasto NEAT 7d</span>
              <div className="text-xl font-black text-amber-400 tabular-nums mt-0.5">
                {totalKcal7d.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">kcal quemadas</span>
            </div>
          </div>

          {/* SVG 7-Day Bar Chart */}
          <div className="pt-2">
            <div className="h-28 flex items-end justify-between gap-2 px-1">
              {recent7Days.slice().reverse().map((entry, idx) => {
                const dayHeight = Math.min(100, Math.round((entry.steps / 14000) * 100));
                const dayName = new Date(entry.date).toLocaleDateString('es-ES', { weekday: 'short' });
                const isOverGoal = entry.steps >= STEP_GOAL;

                const handleSaveCardio = () => {
    if (!onAddCardioSession) return;
    const activityNames: Record<string, string> = {
      incline_treadmill: `Cinta Inclinada (${cardioIncline}% / ${cardioSpeed} km/h)`,
      bike: 'Bicicleta Estática / Spinning',
      running: 'Carrera Continua',
      elliptical: 'Elíptica',
      rower: 'Remo Indoor Concept2'
    };

    const estimatedKcal = calculateCardioSessionCalories({
      activity_type: cardioActivity,
      duration_minutes: cardioDuration,
      weightKg: 78,
      incline_percentage: cardioActivity === 'incline_treadmill' ? cardioIncline : undefined,
      speed_kmh: cardioSpeed
    });

    const newSession: CardioSession = {
      id: `cardio_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      activity_type: cardioActivity,
      activity_name: activityNames[cardioActivity],
      duration_minutes: cardioDuration,
      incline_percentage: cardioActivity === 'incline_treadmill' ? cardioIncline : undefined,
      speed_kmh: cardioSpeed,
      estimated_calories: estimatedKcal,
      notes: cardioNotes.trim() || undefined
    };

    onAddCardioSession(newSession);
    setIsCardioModalOpen(false);
    setCardioNotes('');
  };

  return (
                  <div key={entry.id || idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-20">
                      {entry.steps.toLocaleString()} pasos
                    </div>

                    <div className="w-full bg-slate-800/80 rounded-xl flex items-end h-20 p-1">
                      <div
                        className={`w-full rounded-lg transition-all duration-500 ${
                          isOverGoal
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                            : 'bg-gradient-to-t from-blue-600 to-indigo-500'
                        }`}
                        style={{ height: `${dayHeight}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Weekly Cardio Control & Quick Add Button */}
      <div className="bg-[#12141e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Control Semanal de Cardio</h3>
              <p className="text-xs text-slate-400">Cinta inclinada, bicicleta estática, carrera y calorías quemadas</p>
            </div>
          </div>

          <button
            onClick={() => setIsCardioModalOpen(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Cardio</span>
          </button>
        </div>

        {/* Weekly Cardio Progress Bar */}
        <div className="p-4 bg-[#181a28] rounded-2xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-semibold">Minutos de cardio completados esta semana</span>
            <span className="tabular-nums font-bold text-white text-sm">
              {loggedWeeklyCardioMinutes} / {weeklyCardioTargetMinutes} min ({Math.min(100, Math.round((loggedWeeklyCardioMinutes / Math.max(1, weeklyCardioTargetMinutes)) * 100))}%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, (loggedWeeklyCardioMinutes / Math.max(1, weeklyCardioTargetMinutes)) * 100)}%` }}
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500">
            <span>{cardioSessions.length} sesiones registradas</span>
            <span className="text-rose-400 tabular-nums font-bold">
              ~{cardioSessions.reduce((acc, c) => acc + c.estimated_calories, 0).toLocaleString()} kcal quemadas
            </span>
          </div>
        </div>

        {/* Logged Cardio Sessions List */}
        {cardioSessions.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Sesiones Recientes:</span>
            {cardioSessions.map((session) => (
              <div
                key={session.id}
                className="p-3 bg-[#181a28] rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
                    <Bike className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">{session.activity_name}</div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5 tabular-nums">
                      <span className="font-medium text-zinc-300">{formatDisplayDate(session.date)}</span>
                      <span>·</span>
                      <span className="font-bold">{session.duration_minutes} min</span>
                      <span>·</span>
                      <span className="text-rose-400 font-bold">+{session.estimated_calories} kcal</span>
                    </div>
                  </div>
                </div>

                {onDeleteCardioSession && (
                  <button
                    onClick={() => onDeleteCardioSession(session.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Eliminar sesión"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Step Log Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#12141e] border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <h3 className="text-base font-bold">Registrar Pasos Manualmente</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Fecha</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Cantidad de Pasos</label>
                <input
                  type="number"
                  step="500"
                  value={manualSteps}
                  onChange={(e) => setManualSteps(e.target.value)}
                  className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-base font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveManual}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Cardio Session */}
      {isCardioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#12141e] border border-rose-500/30 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-lg text-white">Registrar Sesión de Cardio</h3>
              </div>
              <button
                onClick={() => setIsCardioModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              
              {/* Activity Type Picker */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Tipo de Actividad:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCardioActivity('incline_treadmill')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                      cardioActivity === 'incline_treadmill'
                        ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Cinta Inclinada (10-15%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardioActivity('bike')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                      cardioActivity === 'bike'
                        ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Bicicleta / Spinning
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardioActivity('running')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                      cardioActivity === 'running'
                        ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Carrera Continua
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardioActivity('elliptical')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                      cardioActivity === 'elliptical'
                        ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Elíptica
                  </button>
                </div>
              </div>

              {/* Duration in Minutes */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-400 font-semibold">Duración:</label>
                  <span className="font-mono font-bold text-white">{cardioDuration} minutos</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={cardioDuration}
                  onChange={(e) => setCardioDuration(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Incline if treadmill */}
              {cardioActivity === 'incline_treadmill' && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-slate-400 font-semibold">Pendiente / Inclinación:</label>
                    <span className="font-mono font-bold text-white">{cardioIncline} %</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={cardioIncline}
                    onChange={(e) => setCardioIncline(parseInt(e.target.value, 10))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Notas / Sensaciones (opcional):</label>
                <input
                  type="text"
                  placeholder="Ej: Zona 2 suave tras entrenamiento de pierna"
                  value={cardioNotes}
                  onChange={(e) => setCardioNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              {/* Estimated burn summary */}
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Gasto calórico estimado:</span>
                <span className="font-mono font-black text-rose-400 text-sm">
                  ~{Math.round(cardioDuration * (cardioActivity === 'running' ? 12 : cardioActivity === 'incline_treadmill' ? 10.5 : 8.8))} kcal
                </span>
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCardioModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCardio}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Sesión</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
