import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Trophy, History, Save, Dumbbell, Sparkles, 
  ThumbsUp, Send, Lock, Globe, ZoomIn, Activity, Target, CheckCircle2, 
  Zap, Info, Sliders, Wrench, ShieldCheck, Camera, AlertCircle,
  ChevronDown, ChevronUp, Layers, Ruler, TrendingUp, Plus, AlertTriangle, Video
} from 'lucide-react';
import { WorkoutExercise, Workout, ExerciseComment, CommunityTip } from '../types/workout';
import { calculate1RM } from '../utils/fitness';
import { EXERCISE_DATABASE } from '../data/exercises';
import { ImageLightboxModal } from './ImageLightboxModal';
import { VideoPoseAnalysisModal } from './VideoPoseAnalysisModal';
import { getSafeMachineImageUrl } from '../utils/machineImages';
import { formatMuscleName } from '../utils/muscleLabels';
import { getMachineBiomechanics } from '../utils/machineBiomechanics';
import { getExerciseAnimation } from '../utils/exerciseDbAnimations';
import { DualAnatomicalMap } from './DualAnatomicalMap';
import { getMuscleStrengthCurve10 } from '../utils/musclePhysiology';
import { 
  computeMachineTorqueCurve, 
  analyzeBiomechanicsMatch, 
  isPlateLoadedPullMachine,
  MACHINE_MECHANICAL_SPECS, 
  type MachineMechanicalSpec 
} from '../utils/machinePhysicsEngine';

interface ExerciseDetailModalProps {
  exercise: WorkoutExercise;
  isOpen: boolean;
  onClose: () => void;
  workoutHistory?: Workout[];
}

const DEFAULT_COMMUNITY_TIPS: Record<string, CommunityTip[]> = {
  technogym_pure_chest_press: [
    {
      id: 'tip_1',
      exercise_template_id: 'technogym_pure_chest_press',
      author: 'Carlos_Fit',
      author_badge: 'Avanzado',
      text: 'El pedal amarillo de precarga es indispensable. Písalo antes de colocar las manos para no comprometer el manguito rotador al despegar.',
      likes: 24,
      has_liked: false,
      date: 'hace 3 días'
    },
    {
      id: 'tip_2',
      exercise_template_id: 'technogym_pure_chest_press',
      author: 'Laura_Biomech',
      author_badge: 'Entrenadora',
      text: 'Regula el asiento para que las asas coincidan con la línea inferior de los pectorales. La trayectoria convergente aísla mucho mejor.',
      likes: 18,
      has_liked: true,
      date: 'hace 1 semana'
    }
  ],
  panatta_super_hack_squat: [
    {
      id: 'tip_3',
      exercise_template_id: 'panatta_super_hack_squat',
      author: 'David_LegDay',
      author_badge: 'Culturista Pro',
      text: 'La plataforma curva de Panatta permite colocar los pies abajo sin estrés patelar. Controla 3 segundos la bajada.',
      likes: 31,
      has_liked: false,
      date: 'hace 5 días'
    }
  ]
};

/**
 * Clean Spanish translator for equipment and muscle tags from ExerciseDB
 */
function translateEquipment(eq?: string): string {
  if (!eq) return 'Gimnasio';
  const lower = eq.toLowerCase().trim();
  if (lower.includes('lever') || lower.includes('plate')) return 'Máquina de Palanca';
  if (lower.includes('dumbbell') || lower.includes('mancuerna')) return 'Mancuerna';
  if (lower.includes('barbell') || lower.includes('barra')) return 'Barra Olímpica';
  if (lower.includes('cable') || lower.includes('polea')) return 'Polea Guiada';
  if (lower.includes('smith')) return 'Multipower / Smith';
  if (lower.includes('body weight') || lower.includes('bodyweight') || lower.includes('propio')) return 'Peso Corporal';
  if (lower.includes('band')) return 'Banda Elástica';
  if (lower.includes('kettlebell')) return 'Pesa Rusa (Kettlebell)';
  return eq.toUpperCase();
}

function translateMuscleTarget(m?: string): string {
  if (!m) return 'General';
  const lower = m.toLowerCase().trim().replace(/[-_]/g, ' ');
  if (lower.includes('upper back')) return 'Espalda Alta / Romboides';
  if (lower.includes('lats') || lower.includes('latissimus')) return 'Dorsal Ancho';
  if (lower.includes('chest') || lower.includes('pectoral')) return 'Pectoral';
  if (lower.includes('delts') || lower.includes('shoulder')) return 'Deltoides / Hombros';
  if (lower.includes('biceps')) return 'Bíceps';
  if (lower.includes('triceps')) return 'Tríceps';
  if (lower.includes('quads') || lower.includes('quadriceps')) return 'Cuádriceps';
  if (lower.includes('hamstrings')) return 'Isquios / Femoral';
  if (lower.includes('glute')) return 'Glúteos';
  if (lower.includes('calves') || lower.includes('calf')) return 'Gemelos';
  if (lower.includes('abs') || lower.includes('abdominal')) return 'Abdomen / Core';
  if (lower.includes('traps') || lower.includes('trapezius')) return 'Trapecios';
  return formatMuscleName(m);
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  isOpen,
  onClose,
  workoutHistory = []
}) => {
  // 3 Primary Modal Tabs: overview | biomechanics | execution
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'biomechanics' | 'execution'>('overview');
  
  // Biomechanical Lab Mode: simple (actionable) vs pro (full 10-pt curve & physics)
  const [biomechMode, setBiomechMode] = useState<'simple' | 'pro'>('simple');
  
  // Collapsible accordion for workshop hacks
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Floating Toast for bidirectional pin sync
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Comments & Tips State
  const [commentText, setCommentText] = useState('');
  const [pinSetting, setPinSetting] = useState('');
  const [savedComments, setSavedComments] = useState<ExerciseComment[]>([]);
  const [activeNotesTab, setActiveNotesTab] = useState<'personal' | 'community'>('personal');
  const [communityTips, setCommunityTips] = useState<CommunityTip[]>([]);
  const [newCommunityTip, setNewCommunityTip] = useState('');

  // Image & Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [pinPickerOpen, setPinPickerOpen] = useState<'seat' | 'pad' | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Quick Machine Pins (persisted in localStorage)
  const templateId = exercise?.exercise_template_id || exercise?.id || '';
  const [seatPin, setSeatPin] = useState(() => {
    try {
      return localStorage.getItem(`mia_pin_seat_${templateId}`) || '';
    } catch {
      return '';
    }
  });
  const [padPin, setPadPin] = useState(() => {
    try {
      return localStorage.getItem(`mia_pin_pad_${templateId}`) || '';
    } catch {
      return '';
    }
  });

  // Progression Graph Metric
  const [graphMetric, setGraphMetric] = useState<'maxWeight' | 'estimated1RM' | 'totalVolume'>('maxWeight');

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Determine if exercise is Free Weight vs Machine
  const isFreeWeight = useMemo(() => {
    const eq = (exercise.equipment_category || '').toLowerCase();
    const titleLower = (exercise.title || '').toLowerCase();
    return eq === 'dumbbell' || 
      eq === 'barbell' || 
      eq === 'cable' || 
      eq === 'none' || 
      eq === 'kettlebell' || 
      eq === 'resistance_band' ||
      titleLower.includes('mancuerna') ||
      titleLower.includes('dumbbell') ||
      titleLower.includes('barra') ||
      titleLower.includes('polea') ||
      titleLower.includes('dominada') ||
      titleLower.includes('fondo') ||
      exercise.brand === 'General' || 
      exercise.brand === 'Eleiko';
  }, [exercise]);

  // ExerciseDB Animation & Step-by-Step Instructions
  const animInfo = useMemo(() => getExerciseAnimation(exercise), [exercise]);

  // Find template for tips & brand
  const template = EXERCISE_DATABASE.find(t => t.id === exercise.exercise_template_id);
  const safeImageUrl = getSafeMachineImageUrl(
    exercise.exercise_template_id,
    exercise.muscle_group,
    exercise.image_url || template?.image_url,
    exercise.brand,
    exercise.equipment_category
  );

  // Load comments
  useEffect(() => {
    if (!isOpen) return;

    const storageKey = `mia_comments_${exercise.exercise_template_id}`;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        setSavedComments(JSON.parse(raw));
      } catch {}
    } else {
      setSavedComments([]);
    }

    const commKey = `mia_community_tips_${exercise.exercise_template_id}`;
    const rawComm = localStorage.getItem(commKey);
    if (rawComm) {
      try {
        setCommunityTips(JSON.parse(rawComm));
      } catch {}
    } else {
      const defaults = DEFAULT_COMMUNITY_TIPS[exercise.exercise_template_id] || [
        {
          id: `tip_def_${Date.now()}`,
          exercise_template_id: exercise.exercise_template_id,
          author: 'Comunidad CHΔNCE',
          author_badge: 'Verificado',
          text: 'Ajusta el asiento de modo que el eje de rotación de la máquina coincida con el pivote de tu articulación para optimizar la curva de fuerza.',
          likes: 12,
          has_liked: false,
          date: 'hace 2 días'
        }
      ];
      setCommunityTips(defaults);
    }
  }, [isOpen, exercise.exercise_template_id]);

  // Extract robust history data points for progression graph
  const historyPoints = useMemo(() => {
    const points: { timestamp: number; date: string; maxWeight: number; estimated1RM: number; totalVolume: number; setsCount: number }[] = [];
    if (!exercise) return points;

    const exerciseTitleClean = (exercise.title || '').toLowerCase().trim();
    const tempId = exercise.exercise_template_id;
    const safeHistory = Array.isArray(workoutHistory) ? workoutHistory : [];

    safeHistory.forEach((w, wIdx) => {
      if (!w || !Array.isArray(w.exercises)) return;
      const foundEx = w.exercises.find(e => {
        if (!e) return false;
        const idMatches = Boolean(tempId && e.exercise_template_id && (e.exercise_template_id === tempId));
        const titleMatches = Boolean(e.title && exerciseTitleClean && (e.title.toLowerCase().trim() === exerciseTitleClean));
        return idMatches || titleMatches;
      });

      if (foundEx && Array.isArray(foundEx.sets) && foundEx.sets.length > 0) {
        let maxW = 0;
        let best1RM = 0;
        let vol = 0;
        let count = 0;

        foundEx.sets.forEach(s => {
          if (!s) return;
          const wKg = Number(s.weight_kg) || 0;
          const reps = Number(s.reps) || 0;
          if (wKg > 0 || reps > 0) {
            count++;
            if (s.type !== 'warmup') {
              if (wKg > maxW) maxW = wKg;
              const e1rm = calculate1RM(wKg, reps);
              if (e1rm > best1RM) best1RM = e1rm;
              vol += wKg * reps;
            }
          }
        });

        if (maxW > 0 || vol > 0) {
          const safeDate = w.start_time ? new Date(w.start_time) : new Date(Date.now() - (safeHistory.length - wIdx) * 86400000);
          points.push({
            timestamp: safeDate.getTime(),
            date: isNaN(safeDate.getTime()) ? `Sesión ${wIdx + 1}` : safeDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            maxWeight: maxW,
            estimated1RM: best1RM,
            totalVolume: vol,
            setsCount: count
          });
        }
      }
    });

    // Check current active workout sets
    if (exercise && Array.isArray(exercise.sets) && exercise.sets.length > 0) {
      let currentMax = 0;
      let current1RM = 0;
      let currentVol = 0;
      let count = 0;

      exercise.sets.forEach(s => {
        if (!s) return;
        const wKg = Number(s.weight_kg) || 0;
        const reps = Number(s.reps) || 0;
        if (wKg > 0) {
          count++;
          if (s.type !== 'warmup') {
            if (wKg > currentMax) currentMax = wKg;
            const e1rm = calculate1RM(wKg, reps);
            if (e1rm > current1RM) current1RM = e1rm;
            currentVol += wKg * reps;
          }
        }
      });

      const todayStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      if (currentMax > 0 && !points.some(p => p.date && p.date.includes(todayStr))) {
        points.push({
          timestamp: Date.now(),
          date: `${todayStr} (Hoy)`,
          maxWeight: currentMax,
          estimated1RM: current1RM,
          totalVolume: currentVol,
          setsCount: count
        });
      }
    }

    return points.sort((a, b) => a.timestamp - b.timestamp);
  }, [workoutHistory, exercise]);

  const maxHistoricalWeight = Math.max(...historyPoints.map(p => p.maxWeight), 0);
  const maxHistorical1RM = Math.max(...historyPoints.map(p => p.estimated1RM), 0);
  const totalVolumeCumulative = historyPoints.reduce((acc, curr) => acc + curr.totalVolume, 0);

  // Biomechanics data
  const biomechanics = useMemo(() => {
    return getMachineBiomechanics(
      exercise.exercise_template_id,
      exercise.title,
      exercise.muscle_group
    );
  }, [exercise.exercise_template_id, exercise.title, exercise.muscle_group]);

  const HOTSPOTS = biomechanics?.hotspots || [];
  const grips = template?.grips || [];

  const isPulldownOrLat = exercise.title.toLowerCase().includes('pulldown') || 
    exercise.title.toLowerCase().includes('jalón') || 
    (exercise.exercise_template_id || '').includes('pulldown') || 
    (exercise.exercise_template_id || '').includes('lat_');
  const secondPinLabel = isPulldownOrLat ? 'Rodillo' : 'Respaldo';

  const isPullExercise = useMemo(() => {
    const text = (exercise.title + ' ' + (exercise.exercise_template_id || '')).toLowerCase();
    return text.includes('row') || text.includes('remo') || text.includes('pull') || 
           text.includes('jalon') || text.includes('jalón') || text.includes('chin') || 
           text.includes('curl') || exercise.muscle_group === 'lats' || exercise.muscle_group === 'upper_back';
  }, [exercise.title, exercise.exercise_template_id, exercise.muscle_group]);

  const isTBarMachine = (templateId || '').toLowerCase().includes('t_bar') ||
                        (exercise.title || '').toLowerCase().includes('remo en t') ||
                        (exercise.title || '').toLowerCase().includes('t-bar');

  // Dual posture state for T-Bar Row
  const [tbarMode, setTBarMode] = useState<'standard_steps' | 'floor_standing'>('standard_steps');

  // Machine Mechanical Spec
  const machineSpec: MachineMechanicalSpec = useMemo(() => {
    if (MACHINE_MECHANICAL_SPECS[templateId]) {
      return MACHINE_MECHANICAL_SPECS[templateId];
    }
    const isPure = (exercise.brand || '').toLowerCase().includes('technogym') && 
      (exercise.title.toLowerCase().includes('pure') || templateId.includes('pure'));
    const isLever = isPure || templateId.includes('hammer') || exercise.title.toLowerCase().includes('lever') || exercise.title.toLowerCase().includes('discos');
    
    return {
      transmission_type: isLever ? 'plate_loaded_lever' : 'cable_constant_cam',
      theta_start: isLever ? 35 : 30,
      theta_end: isLever ? 90 : 70,
      path: exercise.title.toLowerCase().includes('wide') ? 'diverging' : 'converging',
      stability: 'high'
    };
  }, [templateId, exercise.brand, exercise.title]);

  const isPlatePull = useMemo(() => {
    return isPlateLoadedPullMachine(templateId, exercise.title, exercise.brand || '');
  }, [templateId, exercise.title, exercise.brand]);

  // Setup mode based on seatPin:
  // Pin #1 to #5 => 'standard' (Ascendente)
  // Pin #6 to #12 => 'low_or_unilateral' (Campana con pico en zona media)
  const seatNum = parseInt((seatPin || '#4').replace('#', ''), 10) || 4;
  const setupMode: 'standard' | 'low_or_unilateral' = seatNum >= 6 ? 'low_or_unilateral' : 'standard';

  // 10-point curves & mathematical mismatch
  const muscleCurve10 = useMemo(() => {
    return getMuscleStrengthCurve10(exercise.muscle_group, exercise.title);
  }, [exercise.muscle_group, exercise.title]);

  const machineCurve10 = useMemo(() => {
    return computeMachineTorqueCurve(machineSpec, setupMode, isPlatePull, tbarMode);
  }, [machineSpec, setupMode, isPlatePull, tbarMode]);

  const matchAnalysis = useMemo(() => {
    return analyzeBiomechanicsMatch(muscleCurve10, machineCurve10, machineSpec, setupMode, isPlatePull, tbarMode);
  }, [muscleCurve10, machineCurve10, machineSpec, setupMode, isPlatePull, tbarMode]);

  // Handle seat pin changes with bidirectional sync & Toast
  const handleSelectSeatPin = (pinVal: string) => {
    setSeatPin(pinVal);
    try {
      localStorage.setItem(`mia_pin_seat_${templateId}`, pinVal);
    } catch {}

    const num = parseInt(pinVal.replace('#', ''), 10) || 4;
    if (isPlatePull || isPullExercise) {
      if (num >= 6) {
        setToastMessage(`Asiento ajustado a ${pinVal}: Curva adaptada a Campana Óptima (80%-100%-80%).`);
      } else {
        setToastMessage(`Asiento ajustado a ${pinVal}: Curva adaptada a Perfil Ascendente (pico en acortamiento a 90°).`);
      }
    } else {
      setToastMessage(`Ajuste de Asiento guardado en ${pinVal}`);
    }
  };

  const handleSelectPadPin = (pinVal: string) => {
    setPadPin(pinVal);
    try {
      localStorage.setItem(`mia_pin_pad_${templateId}`, pinVal);
    } catch {}
    setToastMessage(`Ajuste de ${secondPinLabel} guardado en ${pinVal}`);
  };

  const handleSavePrivateComment = () => {
    if (!commentText.trim() && !pinSetting.trim()) return;

    const newComment: ExerciseComment = {
      id: `comm_${Date.now()}`,
      exercise_template_id: exercise.exercise_template_id,
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
      text: commentText.trim(),
      machine_pin: pinSetting.trim()
    };

    const updated = [newComment, ...savedComments];
    setSavedComments(updated);
    localStorage.setItem(`mia_comments_${exercise.exercise_template_id}`, JSON.stringify(updated));
    setCommentText('');
    setPinSetting('');
  };

  const handleDeleteComment = (id: string) => {
    const updated = savedComments.filter(c => c.id !== id);
    setSavedComments(updated);
    localStorage.setItem(`mia_comments_${exercise.exercise_template_id}`, JSON.stringify(updated));
  };

  const handleToggleTipLike = (tipId: string) => {
    const updated = communityTips.map(t => {
      if (t.id === tipId) {
        const nextLiked = !t.has_liked;
        return {
          ...t,
          has_liked: nextLiked,
          likes: nextLiked ? t.likes + 1 : t.likes - 1
        };
      }
      return t;
    });
    setCommunityTips(updated);
    localStorage.setItem(`mia_community_tips_${exercise.exercise_template_id}`, JSON.stringify(updated));
  };

  const handleAddCommunityTip = () => {
    if (!newCommunityTip.trim()) return;

    const newTip: CommunityTip = {
      id: `comm_tip_${Date.now()}`,
      exercise_template_id: exercise.exercise_template_id,
      author: 'Tú (Atleta CHΔNCE)',
      author_badge: 'Atleta',
      text: newCommunityTip.trim(),
      likes: 1,
      has_liked: true,
      date: 'ahora mismo'
    };

    const updated = [newTip, ...communityTips];
    setCommunityTips(updated);
    localStorage.setItem(`mia_community_tips_${exercise.exercise_template_id}`, JSON.stringify(updated));
    setNewCommunityTip('');
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordion(prev => prev === key ? null : key);
  };

  // Actionable Top Banner Copy for "Qué hacer hoy"
  const actionableBannerText = useMemo(() => {
    if (isTBarMachine) {
      return tbarMode === 'floor_standing'
        ? 'Directriz Hoy: Al traccionar de pie con pies en el suelo partes a 90° con máxima carga en estiramiento. Mantén el pecho firme sobre el soporte.'
        : 'Directriz Hoy: Apoya los pies en el escalón inferior para mayor anclaje y estabilidad respiratoria. Tracciona con retracción escapular.';
    }
    if (isPlatePull || isPullExercise) {
      return setupMode === 'low_or_unilateral'
        ? 'Directriz Hoy: Asiento bajo (#6-#12) activado. La curva forma campana (80%-100%-80%), protegiendo el bíceps y maximizando la tensión en el dorsal.'
        : 'Directriz Hoy: Con asiento estándar (#1-#5), el pico de carga llega al final. Si buscas aislar dorsal puro, baja el asiento al pin #7 o tracciona a 1 mano.';
    }
    if (exercise.muscle_group === 'chest' || exercise.muscle_group === 'shoulders') {
      return 'Directriz Hoy: Regula el asiento para alinear las empuñaduras con el esternón. Empuja en el plano escapular (30-45°) sin hiperextender codos.';
    }
    if (exercise.muscle_group === 'quadriceps' || exercise.muscle_group === 'glutes' || exercise.muscle_group === 'hamstrings') {
      return 'Directriz Hoy: Ajusta el respaldo para máxima flexión sin retroversión pélvica. Ralentiza 3 segundos la fase excéntrica.';
    }
    return 'Directriz Hoy: Control excéntrico de 2-3s y pausa isométrica de 1s para sostener la tensión mecánica activa en todo el rango útil.';
  }, [isTBarMachine, tbarMode, isPlatePull, isPullExercise, setupMode, exercise.muscle_group]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-2xl bg-[#0a0a0c] border border-white/[0.08] rounded-3xl p-4 sm:p-6 shadow-2xl text-white space-y-4 max-h-full flex flex-col relative">
        
        {/* Floating Toast for Pin Sync */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#18181c] border border-blue-500/40 text-blue-200 text-xs px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-md animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25 font-bold tracking-wide">
                {exercise.brand || 'CHΔNCE'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold whitespace-nowrap">
                {formatMuscleName(exercise.muscle_group)}
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">{exercise.title}</h2>

            {/* Quick Machine Pin Badges (Only for Machines) */}
            {!isFreeWeight ? (
              <div className="relative pt-1">
                <div className="flex items-center gap-2 flex-nowrap overflow-x-auto [scrollbar-width:none]">
                  <button
                    type="button"
                    onClick={() => setPinPickerOpen(pinPickerOpen === 'seat' ? null : 'seat')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121215] hover:bg-[#18181c] border border-white/[0.08] text-xs shrink-0 transition active:scale-95"
                  >
                    <Sliders className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-zinc-400 font-semibold whitespace-nowrap">Asiento:</span>
                    <span className="font-bold text-white bg-blue-600/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30">
                      {seatPin || '#4'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPinPickerOpen(pinPickerOpen === 'pad' ? null : 'pad')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121215] hover:bg-[#18181c] border border-white/[0.08] text-xs shrink-0 transition active:scale-95"
                  >
                    <Sliders className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-zinc-400 font-semibold whitespace-nowrap">{secondPinLabel}:</span>
                    <span className="font-bold text-white bg-blue-600/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30">
                      {padPin || '#2'}
                    </span>
                  </button>

                  <span className="text-[10px] text-zinc-500 italic hidden sm:inline whitespace-nowrap">
                    Toca para regular
                  </span>
                </div>

                {/* Quick Wheel Selector Popover */}
                {pinPickerOpen && (
                  <div className="absolute top-full left-0 mt-2 z-30 p-3 bg-[#121215] border border-white/[0.12] rounded-2xl shadow-2xl space-y-2 animate-fadeIn w-64">
                    <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
                      <span className="text-[11px] font-bold text-zinc-300">
                        Ajuste de {pinPickerOpen === 'seat' ? 'Asiento' : secondPinLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPinPickerOpen(null)}
                        className="text-zinc-500 hover:text-white text-xs p-1"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-1">
                      {['#1', '#2', '#3', '#4', '#5', '#6', '#7', '#8', '#9', '#10', '#11', '#12'].map((num) => {
                        const isCurrent = (pinPickerOpen === 'seat' ? (seatPin || '#4') : (padPin || '#2')) === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              if (pinPickerOpen === 'seat') {
                                handleSelectSeatPin(num);
                              } else {
                                handleSelectPadPin(num);
                              }
                              setPinPickerOpen(null);
                            }}
                            className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                              isCurrent
                                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                                : 'bg-[#18181c] border-white/[0.06] text-zinc-300 hover:bg-[#24242c] hover:text-white'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-1 flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121215] border border-white/[0.07] text-xs font-semibold text-zinc-300">
                  <Dumbbell className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-zinc-400">Modalidad:</span>
                  <span className="font-bold text-white bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider text-[10px]">
                    {translateEquipment(exercise.equipment_category)}
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="Analizar técnica biomecánica por vídeo"
            >
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Vídeo Técnica</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 TOP PRIMARY TABS (Anti-Infinite Scroll Architecture) */}
        <div className="flex border-b border-white/[0.08] bg-[#0c0c0e] p-1 rounded-2xl gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveMainTab('overview')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeMainTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Resumen & Mi Progreso</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('biomechanics')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeMainTab === 'biomechanics'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Laboratorio Biomecánico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('execution')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeMainTab === 'execution'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Ejecución & Músculos</span>
          </button>
        </div>

        {/* SCROLLABLE MAIN BODY */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          
          {/* ======================================================== */}
          {/* TAB 1: RESUMEN & MI PROGRESO                             */}
          {/* ======================================================== */}
          {activeMainTab === 'overview' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Media Card (Interactive Machine Photo or Free Weight banner) */}
              <div className="bg-[#121215] rounded-2xl border border-white/[0.08] p-3 space-y-3 shadow-lg">
                <div className="relative w-full h-52 sm:h-60 rounded-xl overflow-hidden bg-gradient-to-b from-[#18181c] via-[#0e0e11] to-[#09090b] border border-white/[0.06] flex items-center justify-center">
                  
                  {/* Subtle radial spotlight glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)] pointer-events-none" />

                  {/* Machine or Free Weight Image */}
                  <img
                    src={safeImageUrl}
                    alt={exercise.title}
                    className="w-full h-full object-contain p-3 filter drop-shadow-[0px_10px_20px_rgba(0,0,0,0.85)] contrast-[1.05] cursor-zoom-in transition transform duration-300 hover:scale-105"
                    onClick={() => { setLightboxImageUrl(safeImageUrl); setIsLightboxOpen(true); }}
                    onError={(e) => {
                      e.currentTarget.src = '/machines/technogym_pure_chest_press.jpg';
                    }}
                  />

                  {/* Numbered Interactive Hotspots (Only for machines with hotspots) */}
                  {!isFreeWeight && HOTSPOTS.map((spot) => {
                    const isSelected = activeHotspot === spot.id;
                    return (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() => setActiveHotspot(isSelected ? null : spot.id)}
                        style={{ top: spot.top, left: spot.left }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-lg ${
                          isSelected
                            ? 'bg-amber-400 text-black ring-4 ring-amber-400/50 scale-125 z-20'
                            : 'bg-blue-600 text-white ring-2 ring-white/80 hover:scale-110 z-10 animate-pulse'
                        }`}
                        title={spot.label}
                      >
                        {spot.id}
                      </button>
                    );
                  })}

                  {/* Lightbox Badge */}
                  <button
                    onClick={() => { setLightboxImageUrl(safeImageUrl); setIsLightboxOpen(true); }}
                    className="absolute top-2.5 right-2.5 bg-black/70 hover:bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-zinc-300 border border-white/[0.1] flex items-center gap-1 transition"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                    <span>Zoom HD</span>
                  </button>
                </div>

                {/* Hotspot details if clicked */}
                {(() => {
                  const activeSpot = HOTSPOTS.find(h => h.id === activeHotspot);
                  if (activeSpot) {
                    return (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1.5 transition animate-fadeIn">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center font-black text-xs">
                              {activeSpot.id}
                            </span>
                            <span className="font-bold text-white text-xs">{activeSpot.label}</span>
                            <span className="text-[10px] text-amber-300 px-2 py-0.2 rounded bg-amber-500/20 font-semibold border border-amber-500/30">
                              {activeSpot.part_name}
                            </span>
                          </div>
                          <button onClick={() => setActiveHotspot(null)} className="text-zinc-400 hover:text-white p-1">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-zinc-300 leading-relaxed text-[11px]">
                          <strong className="text-amber-300">Función:</strong> {activeSpot.biomechanical_purpose}
                        </p>
                        {activeSpot.pro_tip && (
                          <div className="text-[11px] text-blue-300 bg-blue-950/40 border border-blue-500/30 rounded-lg p-2 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span><strong className="text-white">Tip:</strong> {activeSpot.pro_tip}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (!isFreeWeight && HOTSPOTS.length > 0) {
                    return (
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 px-1">
                        <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>Toca en los números de la imagen para ver la regulación de clavijas y palancas.</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Personal Records Cards (3 compact stats) */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#121215] p-3 rounded-2xl border border-white/[0.08] text-center space-y-0.5">
                  <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    <span>Carga Máx</span>
                  </div>
                  <div className="text-lg font-black text-white">
                    {maxHistoricalWeight > 0 ? `${maxHistoricalWeight} kg` : '--'}
                  </div>
                  <div className="text-[9px] text-zinc-500">Récord absoluto</div>
                </div>

                <div className="bg-[#121215] p-3 rounded-2xl border border-white/[0.08] text-center space-y-0.5">
                  <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3 text-blue-400" />
                    <span>1RM Estimado</span>
                  </div>
                  <div className="text-lg font-black text-blue-400">
                    {maxHistorical1RM > 0 ? `${maxHistorical1RM} kg` : '--'}
                  </div>
                  <div className="text-[9px] text-zinc-500">Fuerza teórica</div>
                </div>

                <div className="bg-[#121215] p-3 rounded-2xl border border-white/[0.08] text-center space-y-0.5">
                  <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span>Volumen</span>
                  </div>
                  <div className="text-lg font-black text-emerald-400">
                    {totalVolumeCumulative > 0 ? `${Math.round(totalVolumeCumulative)} kg` : '--'}
                  </div>
                  <div className="text-[9px] text-zinc-500">Tonelaje total</div>
                </div>
              </div>

              {/* Historical Load Progression Graph */}
              <div className="bg-[#121215] p-4 rounded-2xl border border-white/[0.08] space-y-3 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <History className="w-4 h-4 text-blue-400" />
                    <span>Curva Histórica de Progresión</span>
                  </div>
                  
                  {/* Metric Switcher */}
                  <div className="flex items-center gap-1 bg-[#18181c] p-1 rounded-xl border border-white/[0.06] self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setGraphMetric('maxWeight')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                        graphMetric === 'maxWeight'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Carga Máx
                    </button>
                    <button
                      type="button"
                      onClick={() => setGraphMetric('estimated1RM')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                        graphMetric === 'estimated1RM'
                          ? 'bg-amber-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      1RM Estimado
                    </button>
                    <button
                      type="button"
                      onClick={() => setGraphMetric('totalVolume')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                        graphMetric === 'totalVolume'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Volumen
                    </button>
                  </div>
                </div>

                {historyPoints.length === 0 ? (
                  <div className="text-center py-6 px-4 text-xs text-zinc-400 border border-dashed border-white/[0.08] rounded-xl space-y-1">
                    <p className="font-semibold text-zinc-300">Aún no hay series registradas para este ejercicio</p>
                    <p className="text-[11px] text-zinc-500">
                      Introduce kg y repeticiones en tu sesión para desbloquear la gráfica de sobrecarga progresiva.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* SVG Curve Chart */}
                    {(() => {
                      const metricValues = historyPoints.map(p => {
                        let v = 0;
                        if (graphMetric === 'maxWeight') v = Number(p.maxWeight);
                        else if (graphMetric === 'estimated1RM') v = Number(p.estimated1RM);
                        else v = Number(p.totalVolume);
                        return isFinite(v) && v >= 0 ? v : 0;
                      });

                      const isSingleSession = historyPoints.length === 1 && metricValues[0] > 0;
                      const projectedVal = isSingleSession 
                        ? Math.max(Math.round((metricValues[0] * 1.08) * 2) / 2, metricValues[0] + 2.5) 
                        : 0;

                      const rawMax = isSingleSession 
                        ? Math.max(projectedVal * 1.2, 15) 
                        : Math.max(...metricValues, 10) * 1.15;
                      const currentMax = Math.ceil(rawMax / 5) * 5;
                      const currentMin = 0;
                      const range = Math.max(currentMax - currentMin, 1);
                      const width = 520;
                      const height = 150;
                      const padding = { top: 25, right: 55, bottom: 30, left: 45 };

                      const getYForValue = (val: number) => {
                        const safeVal = isNaN(val) ? 0 : val;
                        const normalized = (safeVal - currentMin) / range;
                        return height - padding.bottom - normalized * (height - padding.top - padding.bottom);
                      };

                      const pointsCoords = historyPoints.map((pt, i) => {
                        const rawVal = metricValues[i];
                        const val = isNaN(rawVal) ? 0 : rawVal;
                        const x = historyPoints.length === 1 
                          ? padding.left + 80
                          : padding.left + (i / Math.max(historyPoints.length - 1, 1)) * (width - padding.left - padding.right);
                        const y = Math.round(getYForValue(val));
                        return { x: Math.round(x), y, val, date: pt.date, pt };
                      });

                      const singlePt = pointsCoords[0] || { x: padding.left + 80, y: height - padding.bottom, val: 0, date: '', pt: null };
                      const projX = width - padding.right - 50;
                      const projY = isSingleSession ? Math.round(getYForValue(projectedVal)) : padding.top + 20;

                      const linePath = pointsCoords.reduce((acc, curr, idx) => {
                        return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
                      }, '');

                      const areaPath = pointsCoords.length > 1 
                        ? `${linePath} L ${pointsCoords[pointsCoords.length - 1].x} ${height - padding.bottom} L ${pointsCoords[0].x} ${height - padding.bottom} Z`
                        : '';

                      const colorStroke = graphMetric === 'maxWeight' ? '#3b82f6' : graphMetric === 'estimated1RM' ? '#f59e0b' : '#10b981';
                      const colorGradientId = `grad_tab_${graphMetric}`;

                      return (
                        <div className="w-full bg-[#09090b] p-2.5 rounded-xl border border-white/[0.06] space-y-2">
                          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 overflow-visible">
                            <defs>
                              <linearGradient id={colorGradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={colorStroke} stopOpacity="0.4" />
                                <stop offset="100%" stopColor={colorStroke} stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Horizontal Grid lines */}
                            {[0, 0.5, 1].map((pct, idx) => {
                              const y = height - padding.bottom - pct * (height - padding.top - padding.bottom);
                              const labelVal = Math.round(currentMin + pct * range);
                              return (
                                <g key={idx}>
                                  <line
                                    x1={padding.left}
                                    y1={y}
                                    x2={width - padding.right}
                                    y2={y}
                                    stroke="#27272a"
                                    strokeDasharray="3 3"
                                    strokeWidth="0.8"
                                  />
                                  <text
                                    x={padding.left - 6}
                                    y={y + 3}
                                    textAnchor="end"
                                    className="text-[9px] fill-zinc-500 font-bold"
                                  >
                                    {labelVal}kg
                                  </text>
                                </g>
                              );
                            })}

                            {/* Area fill */}
                            {pointsCoords.length > 1 && (
                              <path d={areaPath} fill={`url(#${colorGradientId})`} />
                            )}

                            {/* Line */}
                            {pointsCoords.length > 1 && (
                              <path
                                d={linePath}
                                fill="none"
                                stroke={colorStroke}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}

                            {/* Single session projection */}
                            {isSingleSession && (
                              <g>
                                <line
                                  x1={singlePt.x}
                                  y1={singlePt.y}
                                  x2={projX}
                                  y2={projY}
                                  stroke="#06b6d4"
                                  strokeWidth="2.5"
                                  strokeDasharray="4 4"
                                />
                                <circle
                                  cx={projX}
                                  cy={projY}
                                  r={5}
                                  fill="#06b6d4"
                                  stroke="#09090b"
                                  strokeWidth="2"
                                  className="animate-pulse"
                                />
                                <text
                                  x={projX}
                                  y={projY - 10}
                                  textAnchor="middle"
                                  className="text-[9px] font-bold fill-cyan-300"
                                >
                                  Objetivo: {projectedVal} kg
                                </text>
                              </g>
                            )}

                            {/* Real Points */}
                            {pointsCoords.map((p, idx) => (
                              <g key={idx} className="cursor-pointer group">
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r={pointsCoords.length === 1 ? 6 : 4.5}
                                  fill={colorStroke}
                                  stroke="#09090b"
                                  strokeWidth="2"
                                  className="group-hover:r-6 transition-all"
                                />
                                <text
                                  x={p.x}
                                  y={p.y - 10}
                                  textAnchor="middle"
                                  className="text-[10px] font-bold fill-white"
                                >
                                  {p.val} kg
                                </text>
                                <text
                                  x={p.x}
                                  y={height - 10}
                                  textAnchor="middle"
                                  className="text-[9px] fill-zinc-500"
                                >
                                  {p.date}
                                </text>
                              </g>
                            ))}
                          </svg>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Private Notes & Community Tips (Foldable Subsections) */}
              <div className="bg-[#121215] rounded-2xl border border-white/[0.08] overflow-hidden shadow-lg">
                <div className="flex border-b border-white/[0.08] bg-[#18181c] p-1">
                  <button
                    onClick={() => setActiveNotesTab('personal')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                      activeNotesTab === 'personal'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Mis Notas Privadas</span>
                  </button>

                  <button
                    onClick={() => setActiveNotesTab('community')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                      activeNotesTab === 'community'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Tips Comunidad ({communityTips.length})</span>
                  </button>
                </div>

                {/* Personal Notes Content */}
                {activeNotesTab === 'personal' && (
                  <div className="p-4 space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Sensaciones, agarre o notas de tu serie..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 bg-[#18181c] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-medium"
                      />
                      <button
                        onClick={handleSavePrivateComment}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition shadow-md shadow-blue-600/30"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Guardar</span>
                      </button>
                    </div>

                    <div className="space-y-2 pt-1">
                      {savedComments.length === 0 ? (
                        <div className="text-center py-3 text-xs text-zinc-500">
                          Sin notas privadas guardadas para este ejercicio.
                        </div>
                      ) : (
                        savedComments.map(c => (
                          <div key={c.id} className="p-2.5 bg-[#18181c] border border-white/[0.06] rounded-xl flex items-start justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-zinc-500">{c.date}</span>
                              <p className="text-zinc-200">{c.text}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-zinc-500 hover:text-rose-400 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Community Tips Content */}
                {activeNotesTab === 'community' && (
                  <div className="p-4 space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Comparte un tip o truco biomecánico..."
                        value={newCommunityTip}
                        onChange={(e) => setNewCommunityTip(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCommunityTip()}
                        className="flex-1 bg-[#18181c] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleAddCommunityTip}
                        disabled={!newCommunityTip.trim()}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publicar</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {communityTips.map(tip => (
                        <div key={tip.id} className="p-3 bg-[#18181c] border border-white/[0.06] rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{tip.author}</span>
                            <span className="text-[10px] text-zinc-500">{tip.date}</span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed text-[11px]">{tip.text}</p>
                          <div className="pt-1 flex items-center justify-end">
                            <button
                              onClick={() => handleToggleTipLike(tip.id)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition active:scale-90 text-[10px] font-bold ${
                                tip.has_liked
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              <ThumbsUp className={`w-3 h-3 ${tip.has_liked ? 'fill-current' : ''}`} />
                              <span>{tip.likes} Útil</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: LABORATORIO BIOMECÁNICO                           */}
          {/* ======================================================== */}
          {activeMainTab === 'biomechanics' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Actionable Top Banner: "Qué hacer hoy en esta máquina" */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-[#121215] to-[#121215] border border-blue-500/30 shadow-lg space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                    Qué hacer hoy en esta máquina
                  </span>
                </div>
                <p className="text-zinc-200 text-xs leading-relaxed pl-6">
                  {actionableBannerText}
                </p>
              </div>

              {/* Mode Switcher: Modo Simple vs Modo Pro */}
              <div className="flex bg-[#121215] p-1 rounded-2xl border border-white/[0.08] gap-1">
                <button
                  type="button"
                  onClick={() => setBiomechMode('simple')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                    biomechMode === 'simple'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Modo Simple (Recomendado)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBiomechMode('pro')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                    biomechMode === 'pro'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Modo Pro (Física & Curvas)</span>
                </button>
              </div>

              {/* MODO SIMPLE CONTENT */}
              {biomechMode === 'simple' && (
                <div className="bg-[#121215] p-4 rounded-2xl border border-white/[0.08] space-y-3.5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Ajuste Rápido de Rendimiento
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold text-xs border border-emerald-500/25 flex items-center gap-1">
                      ★ {biomechanics.rating} / 10 Biomecánica
                    </span>
                  </div>

                  {/* Interactive Variant Buttons (Plate Pulls or T-Bar) */}
                  {isPlatePull && !isTBarMachine && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-zinc-400">Variante de Asiento:</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectSeatPin('#4')}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            setupMode === 'standard'
                              ? 'bg-blue-600/20 border-blue-500 text-white'
                              : 'bg-[#18181c] border-white/[0.06] text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">Asiento #1-#5 (Estándar)</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">Perfil ascendente continuo</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectSeatPin('#7')}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            setupMode === 'low_or_unilateral'
                              ? 'bg-emerald-600/20 border-emerald-500 text-white'
                              : 'bg-[#18181c] border-white/[0.06] text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold text-emerald-300">Asiento #6-#12 (Óptimo)</div>
                          <div className="text-[10px] text-emerald-400/80 mt-0.5">Campana óptima para dorsal</div>
                        </button>
                      </div>
                    </div>
                  )}

                  {isTBarMachine && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-zinc-400">Postura en Remo en T:</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTBarMode('standard_steps')}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            tbarMode === 'standard_steps'
                              ? 'bg-blue-600/20 border-blue-500 text-white'
                              : 'bg-[#18181c] border-white/[0.06] text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">Pies en Escalón</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">Ascendente (45° → 90°)</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTBarMode('floor_standing')}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            tbarMode === 'floor_standing'
                              ? 'bg-emerald-600/20 border-emerald-500 text-white'
                              : 'bg-[#18181c] border-white/[0.06] text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold text-emerald-300">De Pie / Suelo</div>
                          <div className="text-[10px] text-emerald-400/80 mt-0.5">Descendente (90° inicial)</div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Clean 3 Bullet Execution Guidelines */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Posición de Inicio:</strong>{' '}
                        <span className="text-zinc-300">
                          {isPullExercise 
                            ? 'Brazos estirados permitiendo protracción escapular para máximo estiramiento del dorsal.'
                            : 'Escápulas apoyadas y hombros alejados de las orejas antes del despegue.'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Pico de Tensión:</strong>{' '}
                        <span className="text-zinc-300">
                          {biomechanics.match_summary || 'La mayor carga coincide con el rango medio del recorrido donde el músculo genera mayor par.'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Criterio de Bloqueo:</strong>{' '}
                        <span className="text-zinc-300">
                          {isPullExercise
                            ? 'Lleva los codos hacia la cadera en retracción escapular sin tirar en exceso de bíceps.'
                            : 'Extiende de manera controlada sin hiperextender las articulaciones.'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">¿Quieres analizar la gráfica de par torsor vs longitud-tensión?</span>
                    <button
                      type="button"
                      onClick={() => setBiomechMode('pro')}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2"
                    >
                      Ver Física Detallada →
                    </button>
                  </div>
                </div>
              )}

              {/* MODO PRO CONTENT (Full 10-point Dual Curve & Mathematical Analysis) */}
              {biomechMode === 'pro' && (
                <div className="space-y-3 bg-[#121215] p-4 rounded-2xl border border-white/[0.08] shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                    <div>
                      <div className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-blue-400" />
                        <span>Curva de Fuerza Muscular vs. Resistencia de Máquina:</span>
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Capacidad activa de tensión muscular (Cyan) vs Par Torsor real (Azul)
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-semibold">
                      <span className="flex items-center gap-1 text-cyan-400">
                        <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full" /> Fuerza Músculo
                      </span>
                      <span className="flex items-center gap-1 text-blue-400">
                        <span className="w-2.5 h-0.5 bg-blue-500 rounded-full" /> Carga Máquina
                      </span>
                    </div>
                  </div>

                  {/* Superimposed Dual Curves SVG Chart */}
                  {(() => {
                    const strengthPts = muscleCurve10;
                    const resistPts = machineCurve10;
                    const width = 320;
                    const height = 190;
                    const pad = { top: 20, right: 18, bottom: 28, left: 32 };
                    const plotW = width - pad.left - pad.right;
                    const plotH = height - pad.top - pad.bottom;

                    // Domain [45%, 100%]
                    const domainMin = 45;
                    const domainMax = 100;
                    const getY = (val: number) => {
                      const normalized = Math.max(0, Math.min(1, (val - domainMin) / (domainMax - domainMin)));
                      return height - pad.bottom - normalized * plotH;
                    };

                    const getX = (idx: number) => {
                      return pad.left + (idx / 9.0) * plotW;
                    };

                    // Cubic Bézier Spline
                    const getSmoothBezierPath = (pts: number[]) => {
                      const points = pts.map((val, idx) => ({ x: getX(idx), y: getY(val) }));
                      if (points.length < 2) return '';
                      let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
                      for (let i = 0; i < points.length - 1; i++) {
                        const p0 = i > 0 ? points[i - 1] : points[i];
                        const p1 = points[i];
                        const p2 = points[i + 1];
                        const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];

                        const cp1x = p1.x + (p2.x - p0.x) / 6;
                        const cp1y = p1.y + (p2.y - p0.y) / 6;
                        const cp2x = p2.x - (p3.x - p1.x) / 6;
                        const cp2y = p2.y - (p3.y - p1.y) / 6;

                        d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
                      }
                      return d;
                    };

                    const strPath = getSmoothBezierPath(strengthPts);
                    const resPath = getSmoothBezierPath(resistPts);

                    let mismatchPoly = strPath;
                    for (let i = 9; i >= 0; i--) {
                      mismatchPoly += ` L ${getX(i).toFixed(2)} ${getY(resistPts[i]).toFixed(2)}`;
                    }
                    mismatchPoly += ' Z';

                    return (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-full bg-[#09090b] p-3 rounded-2xl border border-white/[0.06] shadow-inner">
                          <svg viewBox={`0 0 ${width} ${height}`} className="w-full aspect-[320/190] overflow-visible select-none">
                            <defs>
                              <linearGradient id="proMismatchGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.04" />
                              </linearGradient>
                            </defs>

                            {/* Horizontal Gridlines (50%, 75%, 100%) */}
                            {[50, 75, 100].map((val) => {
                              const y = getY(val);
                              return (
                                <g key={val}>
                                  <line
                                    x1={pad.left}
                                    y1={y}
                                    x2={width - pad.right}
                                    y2={y}
                                    stroke="#27272a"
                                    strokeDasharray="2 2"
                                    strokeWidth="0.8"
                                  />
                                  <text
                                    x={pad.left - 4}
                                    y={y + 3}
                                    textAnchor="end"
                                    className="text-[9px] fill-zinc-400 font-mono font-semibold"
                                  >
                                    {val}%
                                  </text>
                                </g>
                              );
                            })}

                            {/* 3 ROM Phase Labels */}
                            {[
                              { x: getX(0), label: '0% (Estir.)' },
                              { x: getX(4.5), label: '50% (Media)' },
                              { x: getX(9), label: '100% (Acort.)' }
                            ].map((col, idx) => (
                              <g key={idx}>
                                <line
                                  x1={col.x}
                                  y1={pad.top}
                                  x2={col.x}
                                  y2={height - pad.bottom}
                                  stroke="#27272a"
                                  strokeWidth="0.8"
                                  strokeDasharray="2 2"
                                />
                                <text
                                  x={col.x}
                                  y={height - 10}
                                  textAnchor="middle"
                                  className="text-[9px] fill-zinc-400 font-semibold"
                                >
                                  {col.label}
                                </text>
                              </g>
                            ))}

                            {/* Shaded Mismatch */}
                            <path d={mismatchPoly} fill="url(#proMismatchGrad)" />

                            {/* Machine Line */}
                            <path
                              d={resPath}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                            />

                            {/* Muscle Line */}
                            <path
                              d={strPath}
                              fill="none"
                              stroke="#06b6d4"
                              strokeWidth="2.5"
                              strokeDasharray="4 3"
                              strokeLinecap="round"
                            />

                            {/* Data points */}
                            {[0, 4, 9].map((idx) => {
                              const x = getX(idx);
                              const yR = getY(resistPts[idx]);
                              const yS = getY(strengthPts[idx]);
                              return (
                                <g key={idx}>
                                  <circle cx={x} cy={yR} r={3.5} fill="#3b82f6" stroke="#09090b" strokeWidth="1.5" />
                                  <circle cx={x} cy={yS} r={3.5} fill="#06b6d4" stroke="#09090b" strokeWidth="1.5" />
                                </g>
                              );
                            })}
                          </svg>
                        </div>

                        {/* ROM Delta Badges */}
                        <div className="w-full pt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-300">Alineación Biomecánica:</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                              matchAnalysis.is_optimized 
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                                : matchAnalysis.shortening_mismatch
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            }`}>
                              {matchAnalysis.is_optimized && <CheckCircle2 className="w-3 h-3" />}
                              {matchAnalysis.shortening_mismatch && <AlertCircle className="w-3 h-3" />}
                              <span>{matchAnalysis.badge_label}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 text-center">
                            <div className="bg-[#18181c] p-2 rounded-xl border border-white/[0.04]">
                              <div className="text-[8px] text-zinc-400 font-semibold">Estiramiento (0%)</div>
                              <div className="text-[10px] font-bold text-cyan-400">
                                M:{muscleCurve10[0]}% | R:{machineCurve10[0]}%
                              </div>
                              <div className={`text-[9px] font-mono font-bold ${
                                muscleCurve10[0] - machineCurve10[0] >= 0 ? 'text-emerald-400' : 'text-amber-400'
                              }`}>
                                Δ {muscleCurve10[0] - machineCurve10[0] >= 0 ? '+' : ''}{muscleCurve10[0] - machineCurve10[0]}%
                              </div>
                            </div>

                            <div className="bg-[#18181c] p-2 rounded-xl border border-white/[0.04]">
                              <div className="text-[8px] text-zinc-400 font-semibold">Media (50%)</div>
                              <div className="text-[10px] font-bold text-cyan-400">
                                M:{muscleCurve10[4]}% | R:{machineCurve10[4]}%
                              </div>
                              <div className={`text-[9px] font-mono font-bold ${
                                muscleCurve10[4] - machineCurve10[4] >= 0 ? 'text-emerald-400' : 'text-amber-400'
                              }`}>
                                Δ {muscleCurve10[4] - machineCurve10[4] >= 0 ? '+' : ''}{muscleCurve10[4] - machineCurve10[4]}%
                              </div>
                            </div>

                            <div className="bg-[#18181c] p-2 rounded-xl border border-white/[0.04]">
                              <div className="text-[8px] text-zinc-400 font-semibold">Acortado (100%)</div>
                              <div className="text-[10px] font-bold text-cyan-400">
                                M:{muscleCurve10[9]}% | R:{machineCurve10[9]}%
                              </div>
                              <div className={`text-[9px] font-mono font-bold ${
                                matchAnalysis.shortening_mismatch ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                                Δ {muscleCurve10[9] - machineCurve10[9] >= 0 ? '+' : ''}{muscleCurve10[9] - machineCurve10[9]}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Diagnostic Box */}
                  <div className="bg-[#18181c] p-3 rounded-xl border border-white/[0.06] text-xs space-y-1">
                    <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Diagnóstico Mecánico:</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      {matchAnalysis.primary_hack || biomechanics.mismatch_analysis || biomechanics.match_summary}
                    </p>
                  </div>
                </div>
              )}

              {/* COLLAPSIBLE ACCORDIONS FOR GYM HACKS (Clean Lucide Icons, No Emojis) */}
              <div className="bg-[#121215] p-4 rounded-2xl border border-white/[0.08] space-y-2 shadow-lg">
                <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
                  <Wrench className="w-4 h-4 text-blue-400" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                    Modificaciones de Taller & Hacks Pro
                  </h4>
                </div>

                <div className="space-y-1.5 pt-1">
                  
                  {/* Accordion 1: Pads / Foam */}
                  <div className="rounded-xl border border-white/[0.06] bg-[#18181c] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('pad_hack')}
                      className="w-full p-3 flex items-center justify-between text-left text-xs font-bold text-zinc-200 hover:text-white transition"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Uso de Pads / Espumas Adicionales</span>
                      </div>
                      {openAccordion === 'pad_hack' ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </button>
                    {openAccordion === 'pad_hack' && (
                      <div className="px-3 pb-3 text-[11px] text-zinc-300 border-t border-white/[0.04] pt-2 leading-relaxed animate-fadeIn">
                        {matchAnalysis.pad_hack || biomechanics.gym_hacks?.pad_hack || 'Coloca un bloque de yoga o pad de alta densidad de 4 cm en el soporte pectoral para ganar rango de elongación sin que los discos hagan tope.'}
                      </div>
                    )}
                  </div>

                  {/* Accordion 2: Accommodating Resistance (Elastic Bands) */}
                  <div className="rounded-xl border border-white/[0.06] bg-[#18181c] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('band_hack')}
                      className="w-full p-3 flex items-center justify-between text-left text-xs font-bold text-zinc-200 hover:text-white transition"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Accommodating Resistance (Bandas Elásticas)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {((exercise.brand || '').toLowerCase().includes('technogym') || (templateId || '').toLowerCase().includes('technogym')) && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border hidden sm:inline ${
                            ['abductor', 'hip_thrust', 'hack_squat', 'hack'].some(key => 
                              (templateId || '').toLowerCase().includes(key) || 
                              (exercise.title || '').toLowerCase().includes(key)
                            )
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            {['abductor', 'hip_thrust', 'hack_squat', 'hack'].some(key => 
                              (templateId || '').toLowerCase().includes(key) || 
                              (exercise.title || '').toLowerCase().includes(key)
                            )
                              ? 'Pivotes de Serie'
                              : 'Sin Pivotes de Fábrica'}
                          </span>
                        )}
                        {openAccordion === 'band_hack' ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                      </div>
                    </button>
                    {openAccordion === 'band_hack' && (
                      <div className="px-3 pb-3 text-[11px] text-zinc-300 border-t border-white/[0.04] pt-2 leading-relaxed space-y-2 animate-fadeIn">
                        {(() => {
                          const isTG = (exercise.brand || '').toLowerCase().includes('technogym') || (templateId || '').toLowerCase().includes('technogym');
                          const hasTGBandPegs = isTG && ['abductor', 'hip_thrust', 'hack_squat', 'hack'].some(key => 
                            (templateId || '').toLowerCase().includes(key) || 
                            (exercise.title || '').toLowerCase().includes(key)
                          );
                          if (hasTGBandPegs) {
                            return (
                              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                                <strong>Pivotes Oficiales de Fábrica:</strong> Esta máquina Technogym sí incorpora de serie clavijas para anclar bandas elásticas de resistencia acomodada progresiva.
                              </div>
                            );
                          }
                          if (isTG) {
                            return (
                              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                                <strong>Nota de Fábrica Technogym:</strong> Technogym únicamente equipa clavijas oficiales de serie para bandas en 3 máquinas de discos: Abductor de pie, Hip Thrust y Sentadilla Hack. En este modelo no vienen clavijas de serie (para acomodación, fija bandas al travesaño inferior del chasis con mosquetón o banda corta).
                              </div>
                            );
                          }
                          return (
                            <p>{matchAnalysis.band_hack || biomechanics.gym_hacks?.band_hack || 'Ancla bandas de resistencia ligera en los puntos de soporte del chasis para sobrecargar la fase de bloqueo o en configuración Reverse Band.'}</p>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Accordion 3: Anthropometry (Corrected copywriting for pull vs push) */}
                  <div className="rounded-xl border border-white/[0.06] bg-[#18181c] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('anthropometry')}
                      className="w-full p-3 flex items-center justify-between text-left text-xs font-bold text-zinc-200 hover:text-white transition"
                    >
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Regulación Antropométrica por Estatura</span>
                      </div>
                      {openAccordion === 'anthropometry' ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </button>
                    {openAccordion === 'anthropometry' && (
                      <div className="px-3 pb-3 text-[11px] text-zinc-300 border-t border-white/[0.04] pt-2 leading-relaxed animate-fadeIn">
                        {isPullExercise ? (
                          <span>
                            Para atletas de más de 1.80 m, sitúa el asiento en los puntos inferiores (#6-#10) o añade agarres individuales tipo D-Handles para alinear la dirección de tracción con las fibras del dorsal y permitir retracción escapular completa sin chocar con los topes mecánicos.
                          </span>
                        ) : (
                          <span>
                            Para atletas de más de 1.80 m, sitúa el asiento en los puntos inferiores (#3-#5) para alinear la dirección de empuje en el plano escapular (30-45°) respecto al esternón y proteger el manguito rotador.
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Accordion 4: Lever Physics */}
                  <div className="rounded-xl border border-white/[0.06] bg-[#18181c] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('lever_physics')}
                      className="w-full p-3 flex items-center justify-between text-left text-xs font-bold text-zinc-200 hover:text-white transition"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Física de Palancas & Vector de Resistencia</span>
                      </div>
                      {openAccordion === 'lever_physics' ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </button>
                    {openAccordion === 'lever_physics' && (
                      <div className="px-3 pb-3 text-[11px] text-zinc-300 border-t border-white/[0.04] pt-2 leading-relaxed animate-fadeIn">
                        {biomechanics.lever_physics}
                      </div>
                    )}
                  </div>

                  {/* Accordion 5: Manufacturer Biomechanical Instructions */}
                  {template?.setup_tips && template.setup_tips.length > 0 && (
                    <div className="rounded-xl border border-white/[0.06] bg-[#18181c] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleAccordion('manufacturer')}
                        className="w-full p-3 flex items-center justify-between text-left text-xs font-bold text-zinc-200 hover:text-white transition"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Instrucciones del Fabricante</span>
                        </div>
                        {openAccordion === 'manufacturer' ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                      </button>
                      {openAccordion === 'manufacturer' && (
                        <div className="px-3 pb-3 text-[11px] text-zinc-300 border-t border-white/[0.04] pt-2 leading-relaxed animate-fadeIn">
                          <ul className="space-y-1 list-disc pl-4 text-zinc-400">
                            {template.setup_tips.map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Accordion 6: Compatible Grips */}
                  {grips.length > 0 && (
                    <div className="rounded-xl border border-white/[0.06] bg-[#18181c] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleAccordion('grips')}
                        className="w-full p-3 flex items-center justify-between text-left text-xs font-bold text-zinc-200 hover:text-white transition"
                      >
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-400 shrink-0" />
                          <span>Tipos de Agarre & Enfoque ({grips.length})</span>
                        </div>
                        {openAccordion === 'grips' ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                      </button>
                      {openAccordion === 'grips' && (
                        <div className="px-3 pb-3 border-t border-white/[0.04] pt-2 space-y-2 animate-fadeIn">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {grips.map((grip) => (
                              <div
                                key={grip.id}
                                className={`p-2.5 rounded-xl border text-xs space-y-0.5 ${
                                  grip.is_recommended
                                    ? 'bg-blue-600/10 border-blue-500/30 text-zinc-200'
                                    : 'bg-[#18181c] border-white/[0.06] text-zinc-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white text-xs">{grip.name}</span>
                                  {grip.is_recommended && (
                                    <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.2 rounded font-bold">
                                      Recomendado
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-emerald-400 font-medium">
                                  Enfoca: {grip.target_muscle}
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                  {grip.biomechanical_benefit}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: EJECUCIÓN & MÚSCULOS                              */}
          {/* ======================================================== */}
          {activeMainTab === 'execution' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* ExerciseDB HD Animation Card (Dark Mode Integrated) */}
              <div className="rounded-2xl bg-[#09090b] border border-white/[0.08] overflow-hidden shadow-2xl relative">
                
                {/* Animation Card Header */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#121215] border-b border-white/[0.07]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-zinc-200">
                      Demostración Técnica ExerciseDB
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {translateEquipment(animInfo.equipment || exercise.equipment_category)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxImageUrl(animInfo.gifUrl);
                        setIsLightboxOpen(true);
                      }}
                      className="p-1 text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition"
                      title="Ver en pantalla completa"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dark-Mode Fitted GIF Container */}
                <div className="relative w-full h-72 sm:h-80 bg-black/95 flex items-center justify-center overflow-hidden p-2">
                  <img
                    src={animInfo.gifUrl}
                    alt={animInfo.name || exercise.title}
                    className="w-full h-full object-contain filter contrast-[1.08] drop-shadow-md rounded-xl"
                    loading="eager"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = safeImageUrl;
                    }}
                  />
                </div>

                {/* Animation Footer / Translated Badges */}
                <div className="px-3.5 py-2.5 bg-[#121215] border-t border-white/[0.07] flex items-center justify-between">
                  <div className="truncate mr-2">
                    <p className="text-xs font-bold text-zinc-100 truncate">
                      {animInfo.name || exercise.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      Músculo principal: <span className="text-emerald-400 font-bold">{translateMuscleTarget(animInfo.targetMuscle || exercise.muscle_group)}</span>
                    </p>
                  </div>

                  <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded shrink-0">
                    ExerciseDB HD
                  </span>
                </div>
              </div>

              {/* Numbered Step-by-Step Instructions */}
              <div className="rounded-2xl bg-[#121215] border border-white/[0.08] p-4 space-y-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Instrucciones de Ejecución Paso a Paso
                  </h4>
                </div>

                <div className="space-y-2">
                  {animInfo.instructions && animInfo.instructions.length > 0 ? (
                    animInfo.instructions.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed flex-1 text-zinc-300 text-[11px]">
                          {step}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-400 italic">
                      Realiza el movimiento de forma controlada manteniendo la tensión activa y respiración constante.
                    </p>
                  )}
                </div>

                {/* Secondary recruited muscles */}
                {animInfo.secondaryMuscles && animInfo.secondaryMuscles.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.05] flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      Músculos Secundarios:
                    </span>
                    {animInfo.secondaryMuscles.map((sec, i) => (
                      <span key={i} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full capitalize">
                        {translateMuscleTarget(sec)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 2D Vector Anatomical Map */}
              <div className="bg-[#121215] rounded-2xl border border-white/[0.08] p-4 space-y-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400 shrink-0" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Mapa de Reclutamiento Muscular (Frontal & Posterior)
                  </h4>
                </div>
                <DualAnatomicalMap
                  primaryMuscle={exercise.muscle_group}
                  secondaryMuscles={grips && grips.length > 0 ? grips.map(g => g.target_muscle) : []}
                />
              </div>

            </div>
          )}

        </div>

        {/* STICKY BOTTOM ACTION CTA */}
        <div className="pt-2 border-t border-white/[0.08] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Serie en este Ejercicio</span>
          </button>
        </div>

        {/* Fullscreen HD Lightbox Modal */}
        {isLightboxOpen && safeImageUrl && (
          <ImageLightboxModal
            isOpen={true}
            onClose={() => { setIsLightboxOpen(false); setLightboxImageUrl(null); }}
            imageUrl={lightboxImageUrl || safeImageUrl}
            title={exercise.title}
            brand={exercise.brand}
            muscleGroup={exercise.muscle_group}
          />
        )}

        {/* Video Pose Analysis Modal */}
        {isVideoModalOpen && (
          <VideoPoseAnalysisModal
            isOpen={true}
            onClose={() => setIsVideoModalOpen(false)}
            defaultExerciseId={exercise.exercise_template_id || exercise.id}
            defaultExerciseName={exercise.title}
          />
        )}

      </div>
    </div>
  );
};
