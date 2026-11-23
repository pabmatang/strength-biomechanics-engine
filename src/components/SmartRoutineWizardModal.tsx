import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  X,
  Calendar,
  Award,
  Clock,
  Check,
  Dumbbell,
  Layers,
  Activity,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Sliders,
  AlertTriangle,
  Flame,
  ChevronRight
} from 'lucide-react';
import { Routine, WorkoutExercise } from '../types/workout';
import {
  BaseEquipmentType,
  MachineBrandFilter,
  ExperienceLevel,
  SplitDays,
  SessionDuration,
  ALL_DISPLAY_MUSCLES,
  calculateDefaultWeeklyVolume,
  calculateEstimatedSessionDuration,
  generateWizardRoutines
} from '../utils/routineGenerator';
import { MachineThumbnail } from './MachineThumbnail';

interface SmartRoutineWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoutine: (routine: Routine) => void;
  onSaveAllRoutines?: (routines: Routine[]) => void;
}

const AVAILABLE_BRANDS: { brand: MachineBrandFilter; title: string; desc: string }[] = [
  { brand: 'Technogym', title: 'Technogym Pure Strength', desc: 'Palancas de discos independientes y convergentes' },
  { brand: 'Hammer Strength', title: 'Hammer Strength Iso-Lateral', desc: 'Máquinas olímpicas divergentes de alta carga' },
  { brand: 'Titanium Strength', title: 'Titanium Strength', desc: 'Maquinaria pesada comercial de palancas convergentes' },
  { brand: 'Panatta', title: 'Panatta FreeWeight / Monolith', desc: 'Biomecánica italiana con brazos de palanca circulares' },
  { brand: 'Nautilus', title: 'Nautilus Nitro', desc: 'Leva excéntrica para máxima curva de fuerza' },
  { brand: 'Cybex', title: 'Cybex Eagle', desc: 'Doble eje articulado para articulaciones protegidas' },
  { brand: 'Matrix', title: 'Matrix Ultra Converging', desc: 'Torres selectorizadas convergentes/divergentes' },
  { brand: 'Gym80', title: 'Gym80 Sygnum', desc: 'Ingeniería alemana de acero pesado y tensión uniforme' }
];

export const SmartRoutineWizardModal: React.FC<SmartRoutineWizardModalProps> = ({
  isOpen,
  onClose,
  onSaveRoutine,
  onSaveAllRoutines
}) => {
  // Wizard Step: 1 = Perfil/Disponibilidad, 2 = Equipamiento/Marcas, 3 = Volumen/Prioridades, 4 = Revisión
  const [step, setStep] = useState<number>(1);

  // Step 1: Perfil y Disponibilidad
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermedio');
  const [daysPerWeek, setDaysPerWeek] = useState<SplitDays>(4);
  const [durationMinutes, setDurationMinutes] = useState<SessionDuration>(60);

  // Step 2: Equipamiento Base & Marcas
  const [baseEquipment, setBaseEquipment] = useState<BaseEquipmentType[]>([
    'free_weight',
    'cable',
    'generic_machine'
  ]);
  const [machineBrands, setMachineBrands] = useState<MachineBrandFilter[]>([
    'Technogym',
    'Hammer Strength'
  ]);

  // Step 3: Volumen Semanal por Músculo
  const [targetWeeklyVolume, setTargetWeeklyVolume] = useState<Record<string, number>>(() =>
    calculateDefaultWeeklyVolume('intermedio', 4, 60)
  );

  // Active muscle being edited in modal sheet
  const [activeEditingMuscle, setActiveEditingMuscle] = useState<string | null>(null);

  // Step 4: Generated routines result & preview tab
  const [generatedRoutines, setGeneratedRoutines] = useState<Routine[] | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // Auto-recalculate recommended volume baseline when Level, Days or Duration change in Step 1
  useEffect(() => {
    setTargetWeeklyVolume(calculateDefaultWeeklyVolume(experienceLevel, daysPerWeek, durationMinutes));
  }, [experienceLevel, daysPerWeek, durationMinutes]);

  // Total weekly volume sum
  const totalWeeklySets = useMemo(() => {
    return Object.values(targetWeeklyVolume).reduce((a, b) => a + b, 0);
  }, [targetWeeklyVolume]);

  const estimatedMinutesPerSession = useMemo(() => {
    return calculateEstimatedSessionDuration(totalWeeklySets, daysPerWeek);
  }, [totalWeeklySets, daysPerWeek]);

  const isDurationOverbudget = estimatedMinutesPerSession > durationMinutes + 12;

  if (!isOpen) return null;

  // Toggle base equipment (guarantee at least 1 remains selected)
  const toggleBaseEquipment = (eq: BaseEquipmentType) => {
    setBaseEquipment(prev => {
      if (prev.includes(eq)) {
        if (prev.length <= 1) return prev; // Do not allow 0 base equipment
        return prev.filter(e => e !== eq);
      } else {
        return [...prev, eq];
      }
    });
  };

  // Toggle machine brand
  const toggleBrand = (brand: MachineBrandFilter) => {
    setMachineBrands(prev => {
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand);
      } else {
        return [...prev, brand];
      }
    });
  };

  // Handle generation click
  const handleGenerateRoutines = () => {
    const routines = generateWizardRoutines({
      experienceLevel,
      daysPerWeek,
      durationMinutes,
      baseEquipment,
      machineBrands,
      targetWeeklyVolume
    });

    setGeneratedRoutines(routines);
    setSelectedDayIndex(0);
    setStep(4);
  };

  const handleSaveSelected = () => {
    if (!generatedRoutines || !generatedRoutines[selectedDayIndex]) return;
    onSaveRoutine(generatedRoutines[selectedDayIndex]);
    onClose();
  };

  const handleSaveAll = () => {
    if (!generatedRoutines) return;
    if (onSaveAllRoutines) {
      onSaveAllRoutines(generatedRoutines);
    } else {
      generatedRoutines.forEach(r => onSaveRoutine(r));
    }
    onClose();
  };

  // Helper for volume badge label and style
  const getVolumeBadge = (sets: number) => {
    if (sets === 0) {
      return { label: 'Omitido', color: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
    if (sets <= 6) {
      return { label: 'Mantenimiento', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
    }
    if (sets <= 14) {
      return { label: 'Estándar', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    }
    return { label: 'Prioridad Alta', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-xl bg-[#11131f] border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl text-white space-y-4 max-h-[94vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Generador Biomecánico MIA</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                  Paso {step} de 4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {step === 1 && 'Perfil, frecuencia semanal y duración de sesión'}
                {step === 2 && 'Equipamiento base y marcas de maquinaria'}
                {step === 3 && 'Ajuste de volumen semanal y prioridades por músculo'}
                {step === 4 && 'Revisión final y guardado de rutinas'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">

          {/* ==================================================== */}
          {/* PASO 1: Perfil y Disponibilidad */}
          {/* ==================================================== */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Nivel de Experiencia */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>1. Nivel de Experiencia e Intensidad</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'principiante', label: 'Principiante', sub: 'RIR 2-3 · 2 series/ej' },
                    { key: 'intermedio', label: 'Intermedio', sub: 'RIR 1-2 · 3 series/ej' },
                    { key: 'avanzado', label: 'Avanzado', sub: 'RIR 0-1 · 3-4 series/ej' }
                  ].map(lvl => (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => setExperienceLevel(lvl.key as ExperienceLevel)}
                      className={`p-2.5 rounded-2xl border text-center transition ${
                        experienceLevel === lvl.key
                          ? 'border-emerald-500 bg-emerald-600/20 ring-1 ring-emerald-500/40 text-white font-bold'
                          : 'border-slate-800 bg-[#171928] hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{lvl.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{lvl.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Días por Semana */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>2. Días de Entrenamiento por Semana</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { days: 2, label: '2 días', sub: 'Full Body' },
                    { days: 3, label: '3 días', sub: 'Push/Pull/Legs' },
                    { days: 4, label: '4 días', sub: 'Torso/Pierna' },
                    { days: 5, label: '5 días', sub: 'PPL + Foco' },
                    { days: 6, label: '6 días', sub: 'PPL x 2' }
                  ].map(opt => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setDaysPerWeek(opt.days as SplitDays)}
                      className={`p-2 rounded-xl border text-center transition ${
                        daysPerWeek === opt.days
                          ? 'border-blue-500 bg-blue-600/20 ring-1 ring-blue-500/40 text-white font-bold'
                          : 'border-slate-800 bg-[#171928] hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 truncate">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duración por Sesión (ampliada hasta 120 min) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>3. Duración por Sesión (hasta 2 Horas)</span>
                  </span>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    ~{Math.round((durationMinutes - 10) / 3.6)} series objetivo / sesión
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { mins: 45, label: '45 min', sub: '10-12 ser' },
                    { mins: 60, label: '60 min', sub: '14-16 ser' },
                    { mins: 75, label: '75 min', sub: '18-20 ser' },
                    { mins: 90, label: '90 min', sub: '22-24 ser' },
                    { mins: 105, label: '105 min', sub: '26-28 ser' },
                    { mins: 120, label: '120 min', sub: '30-32 ser' }
                  ].map(opt => (
                    <button
                      key={opt.mins}
                      type="button"
                      onClick={() => setDurationMinutes(opt.mins as SessionDuration)}
                      className={`p-2 rounded-xl border text-center transition ${
                        durationMinutes === opt.mins
                          ? 'border-cyan-500 bg-cyan-600/20 ring-1 ring-cyan-500/40 text-white font-bold'
                          : 'border-slate-800 bg-[#171928] hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[10px] text-cyan-400/80 mt-0.5">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Information pill */}
              <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-2xl text-xs text-blue-200/90 leading-relaxed flex items-start gap-2.5">
                <Activity className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p>
                  Presupuesto calculado: <b>{Math.round((durationMinutes - 10) / 3.6) * daysPerWeek} series semanales</b> (~{Math.round((durationMinutes - 10) / 3.6)} por sesión con descansos de 2–3 min y técnica controlada).
                </p>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* PASO 2: Equipamiento y Marcas */}
          {/* ==================================================== */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Bloque A: Equipamiento Base */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                    <span>Bloque A — Equipamiento Base (Multi-selección)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Al menos 1 requerido</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      key: 'free_weight' as BaseEquipmentType,
                      title: 'Peso Libre (Barra Olímpica & Mancuernas)',
                      desc: 'Básicos biomecánicos con mancuernas, barras y autocarga.'
                    },
                    {
                      key: 'cable' as BaseEquipmentType,
                      title: 'Poleas y Cables Regulables',
                      desc: 'Torres cruzadas y poleas bajas/altas con tensión continua.'
                    },
                    {
                      key: 'generic_machine' as BaseEquipmentType,
                      title: 'Máquinas Estándar (Gimnasio de barrio / Sin marca)',
                      desc: 'Máquinas tradicionales de placas y trineos guiados con perfiles estándar.'
                    }
                  ].map(item => {
                    const isSelected = baseEquipment.includes(item.key);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleBaseEquipment(item.key)}
                        className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-600/15 text-white ring-1 ring-emerald-500/40'
                            : 'border-slate-800 bg-[#171928] text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{item.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition flex-shrink-0 ml-2 ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-slate-700 bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bloque B: Marcas de Máquinas */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Bloque B — Marcas de Máquinas Disponibles (Opcional)</span>
                  </span>
                  <span className="text-[10px] text-purple-400 font-mono">
                    {machineBrands.length} marcas activas
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Puedes seleccionar varias marcas simultáneamente. El generador vinculará los perfiles oficiales de resistencia de cada fabricante.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_BRANDS.map(item => {
                    const isSelected = machineBrands.includes(item.brand);
                    return (
                      <button
                        key={item.brand}
                        type="button"
                        onClick={() => toggleBrand(item.brand)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'border-purple-500 bg-purple-600/20 text-white ring-1 ring-purple-500/40'
                            : 'border-slate-800 bg-[#171928] text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold text-white truncate">{item.title}</div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'border-slate-700 bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* PASO 3: Distribución de Volumen y Prioridades */}
          {/* ==================================================== */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Barra Superior Fija de Presupuesto en Tiempo Real */}
              <div className="p-3 bg-gradient-to-r from-slate-900 to-[#14182b] border border-cyan-500/30 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Series semanales totales:</span>
                    <span className="font-mono text-cyan-300 font-black text-sm">{totalWeeklySets} series</span>
                  </div>
                  <div className="font-mono text-slate-300 text-xs font-semibold">
                    ~{estimatedMinutesPerSession} min / sesión
                  </div>
                </div>

                {isDurationOverbudget && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-lg p-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                    <span>
                      Volumen alto: estimamos ~{estimatedMinutesPerSession} min por sesión (tu objetivo era {durationMinutes} min). Puedes reducir series en músculos secundarios o continuar.
                    </span>
                  </div>
                )}
              </div>

              {/* Rejilla Compacta de Músculos (Chips / Tarjetas Limpias) */}
              <div className="space-y-1.5">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Toca un músculo para abrir el editor de series semanales:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setTargetWeeklyVolume(
                        calculateDefaultWeeklyVolume(experienceLevel, daysPerWeek, durationMinutes)
                      )
                    }
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Restaurar recomendadas
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_DISPLAY_MUSCLES.map(m => {
                    const sets = targetWeeklyVolume[m.key] || 0;
                    const badge = getVolumeBadge(sets);
                    const isSelected = activeEditingMuscle === m.key;

                    return (
                      <div
                        key={m.key}
                        onClick={() => setActiveEditingMuscle(m.key)}
                        className={`p-2.5 rounded-2xl border cursor-pointer transition text-left flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-950/50 border-blue-400 shadow-md shadow-blue-950/60 ring-1 ring-blue-400/50'
                            : sets === 0
                            ? 'bg-slate-900/40 border-slate-800/60 opacity-60 hover:opacity-100 hover:border-slate-700'
                            : 'bg-[#161828] border-slate-800 hover:border-slate-700 hover:bg-[#1c1f33]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-xs font-bold text-white leading-tight">{m.label}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-xl font-black font-mono text-white">
                            {sets} <span className="text-[10px] font-sans font-normal text-slate-400">series/sem</span>
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Editor Bajo Demanda (Panel Compacto de Ajuste para el Músculo Seleccionado) */}
              {activeEditingMuscle && (
                <div className="p-3 bg-slate-900/90 border border-blue-500/40 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-blue-400" />
                      <span>
                        Ajuste para{' '}
                        <b className="text-cyan-300">
                          {ALL_DISPLAY_MUSCLES.find(m => m.key === activeEditingMuscle)?.label}
                        </b>
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveEditingMuscle(null)}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300 px-2 py-0.5 rounded-md hover:bg-slate-800"
                    >
                      Listo
                    </button>
                  </div>

                  {/* Slider 0 a 24 */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono font-bold">
                      <span className="text-slate-400">0 (Omitir)</span>
                      <span className="text-lg text-white font-black">
                        {targetWeeklyVolume[activeEditingMuscle] || 0} series semanales
                      </span>
                      <span className="text-slate-400">24 (Máx)</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      step={2}
                      value={targetWeeklyVolume[activeEditingMuscle] || 0}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        setTargetWeeklyVolume(prev => ({
                          ...prev,
                          [activeEditingMuscle]: val
                        }));
                      }}
                      className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Botones rápidos */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { sets: 0, label: '0 (Omitir)' },
                      { sets: 6, label: '6 (Mantenimiento)' },
                      { sets: 12, label: '12 (Estándar)' },
                      { sets: 16, label: '16 (Prioridad)' },
                      { sets: 20, label: '20 (Máx)' }
                    ].map(btn => (
                      <button
                        key={btn.sets}
                        type="button"
                        onClick={() =>
                          setTargetWeeklyVolume(prev => ({
                            ...prev,
                            [activeEditingMuscle]: btn.sets
                          }))
                        }
                        className={`flex-1 py-1 px-1.5 text-[10px] font-bold rounded-lg border transition ${
                          targetWeeklyVolume[activeEditingMuscle] === btn.sets
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {targetWeeklyVolume[activeEditingMuscle] === 0 && (
                    <p className="text-[10px] text-rose-300 bg-rose-950/30 border border-rose-800/40 p-1.5 rounded-lg">
                      Al poner 0 series, este músculo quedará 100% excluido de la rutina generada.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* PASO 4: Revisión y Generación de la Rutina */}
          {/* ==================================================== */}
          {step === 4 && generatedRoutines && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Day Selector Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {generatedRoutines.map((routine, idx) => (
                  <button
                    key={routine.id}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedDayIndex === idx
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    Día {idx + 1}
                  </button>
                ))}
              </div>

              {/* Active Day Details */}
              {generatedRoutines[selectedDayIndex] && (
                <div className="p-3 bg-[#151726] border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {generatedRoutines[selectedDayIndex].title}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {generatedRoutines[selectedDayIndex].exercises.length} ejercicios ·{' '}
                        {generatedRoutines[selectedDayIndex].exercises.reduce(
                          (acc, e) => acc + e.sets.length,
                          0
                        )}{' '}
                        series totales
                      </p>
                    </div>
                  </div>

                  {/* Exercises List */}
                  <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                    {generatedRoutines[selectedDayIndex].exercises.map((ex: WorkoutExercise, exIdx: number) => (
                      <div
                        key={ex.id || exIdx}
                        className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MachineThumbnail
                            imageUrl={ex.image_url}
                            alt={ex.title}
                            brand={ex.brand}
                            modelName={ex.title}
                            className="w-10 h-10 rounded-lg flex-shrink-0"
                            imageClassName="w-full h-full object-contain p-0.5"
                            showCurve={false}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{ex.title}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="uppercase text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded">
                                {ex.equipment_category}
                              </span>
                              {ex.brand && (
                                <span className="text-slate-400 truncate">
                                  {ex.brand}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 font-mono">
                          <span className="font-bold text-blue-400">{ex.sets.length} series</span>
                          <div className="text-[10px] text-slate-400">× 8-12 reps</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Navigation Footer */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between flex-shrink-0">
          {step > 1 && step < 4 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Atrás</span>
            </button>
          )}

          {step < 3 && (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="ml-auto py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleGenerateRoutines}
              className="ml-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generar Rutina Biomecánica</span>
            </button>
          )}

          {step === 4 && (
            <div className="flex gap-2 w-full justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Modificar</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveSelected}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                >
                  Guardar Día {selectedDayIndex + 1}
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar toda la rutina</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
