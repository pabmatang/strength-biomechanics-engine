import React, { useState } from 'react';
import { 
  X, Sparkles, Dumbbell, Clock, Calendar, Check, ArrowRight, ArrowLeft, 
  Sliders, ShieldCheck, Layers, Play, RefreshCw, Star, Info, ThumbsDown,
  Activity, Award, Split, BarChart2, CheckCircle2, ChevronRight, Zap
} from 'lucide-react';
import { Routine, WorkoutExercise, ExerciseTemplate, MuscleGroup } from '../types/workout';
import { EXERCISE_DATABASE } from '../data/exercises';
import { formatMuscleName } from '../utils/muscleLabels';

interface SmartRoutineWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoutine: (routine: Routine) => void;
  onSaveAllRoutines?: (routines: Routine[]) => void;
}

type SplitDays = 2 | 3 | 4 | 5 | 6;
type SessionDuration = 45 | 60 | 75 | 90;
type EquipmentPref = 'technogym' | 'hammer' | 'cables_selectorized' | 'free_weights' | 'hybrid';
type ExperienceLevel = 'principiante' | 'intermedio' | 'avanzado';
type RoutineSplitType = 'ppl' | 'torso_pierna' | 'fullbody' | 'auto';

/**
 * Broad muscle group classifier to strictly enforce:
 * 1) Max 3 exercises of any single muscle group per session (including sub-regions)
 * 2) Volume landmarks:
 *    - Principiante: 6 series/sem estándar (8 en prioridad)
 *    - Intermedio: 8 series/sem estándar (10-12 en prioridad)
 *    - Avanzado: 10 series/sem estándar (12-16 en prioridad)
 *    - Complementarios (Abdomen / Aductor): 2-4 series recordatorio
 */
const BROAD_GROUP_MAP: Record<string, string> = {
  lats: 'back',
  upper_back: 'back',
  trapezius: 'back',
  traps: 'back',
  lower_back: 'back',
  chest: 'chest',
  shoulders: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  quadriceps: 'quadriceps',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  calves: 'calves',
  abdominals: 'abdominals',
  adductors: 'adductors',
  abductors: 'adductors'
};

export const SmartRoutineWizardModal: React.FC<SmartRoutineWizardModalProps> = ({
  isOpen,
  onClose,
  onSaveRoutine,
  onSaveAllRoutines
}) => {
  const [step, setStep] = useState<number>(1);

  // Wizard answers (Clean default: Back and Chest as priorities, no forced biceps)
  const [daysPerWeek, setDaysPerWeek] = useState<SplitDays>(5);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermedio');
  const [routineSplitType, setRoutineSplitType] = useState<RoutineSplitType>('ppl');
  const [priorityMuscles, setPriorityMuscles] = useState<string[]>(['lats', 'chest']);
  const [backSpecialization, setBackSpecialization] = useState<boolean>(true);
  const [dislikedMuscles, setDislikedMuscles] = useState<string[]>([]);
  const [interleavedArmMuscle, setInterleavedArmMuscle] = useState<'biceps' | 'triceps' | 'both'>('biceps');
  const [durationMinutes, setDurationMinutes] = useState<SessionDuration>(60);
  const [equipmentPref, setEquipmentPref] = useState<EquipmentPref>('technogym');

  // Generated routines result
  const [generatedRoutines, setGeneratedRoutines] = useState<Routine[] | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  if (!isOpen) return null;

  // Toggle muscle priority (limit to max 3)
  const togglePriorityMuscle = (muscle: string) => {
    setPriorityMuscles(prev => {
      if (prev.includes(muscle)) {
        return prev.filter(m => m !== muscle);
      } else {
        if (prev.length >= 3) {
          return [...prev.slice(1), muscle];
        }
        return [...prev, muscle];
      }
    });
  };

  // Toggle disliked muscle
  const toggleDislikedMuscle = (muscle: string) => {
    setDislikedMuscles(prev => {
      if (prev.includes(muscle)) {
        return prev.filter(m => m !== muscle);
      } else {
        return [...prev, muscle];
      }
    });
  };

  // Helper to pick exercise matching muscle and equipment preference
  const pickBestExercise = (
    muscle: string,
    pref: EquipmentPref,
    usedIds: Set<string>,
    variantBias?: 'lats' | 'upper_back' | 'trapezius'
  ): ExerciseTemplate => {
    // 1. Prioritize strict primary muscle_group match to avoid picking secondary exercises
    let candidates = EXERCISE_DATABASE.filter(
      t => t.muscle_group === muscle && !usedIds.has(t.id)
    );

    // 2. If no direct primary match left, fallback to secondary other_muscles
    if (candidates.length === 0) {
      candidates = EXERCISE_DATABASE.filter(
        t => t.other_muscles && (t.other_muscles as string[]).includes(muscle) && !usedIds.has(t.id)
      );
    }

    // Apply sub-specialization bias if requested
    if (variantBias && candidates.length > 1) {
      const biased = candidates.filter(t => {
        const title = t.title.toLowerCase();
        if (variantBias === 'lats') {
          return title.includes('jalón') || title.includes('dorsal') || title.includes('lat') || title.includes('pulldown') || title.includes('pullover');
        } else if (variantBias === 'upper_back') {
          return title.includes('remo') || title.includes('row') || title.includes('pájaros') || title.includes('facepull') || title.includes('pecho');
        } else if (variantBias === 'trapezius') {
          return title.includes('encogimiento') || title.includes('shrug') || title.includes('trapecio') || title.includes('remo');
        }
        return true;
      });
      if (biased.length > 0) {
        candidates = biased;
      }
    }

    if (candidates.length === 0) {
      const fallback = EXERCISE_DATABASE.find(t => t.muscle_group === (muscle as MuscleGroup)) || EXERCISE_DATABASE[0];
      return fallback;
    }

    if (pref === 'technogym') {
      const tg = candidates.find(t => t.brand?.toLowerCase().includes('technogym'));
      if (tg) return tg;
    } else if (pref === 'hammer') {
      const hammer = candidates.find(t => t.brand?.toLowerCase().includes('hammer'));
      if (hammer) return hammer;
    } else if (pref === 'cables_selectorized') {
      const cable = candidates.find(
        t => t.equipment_category === 'cable' || t.equipment_category === 'machine'
      );
      if (cable) return cable;
    } else if (pref === 'free_weights') {
      const free = candidates.find(
        t => t.equipment_category === 'dumbbell' || t.equipment_category === 'barbell'
      );
      if (free) return free;
    }

    return candidates[0];
  };

  /**
   * Main Generator Function:
   * 1. Interleaving on ALL days:
   *    - Push days: Chest 1 -> Lateral Delts -> Chest 2 -> Triceps -> Delts/Core (Pecho intercalado).
   *    - Pull days: Lats 1 -> Biceps -> Lats 2 -> Rear Delt -> Biceps/Core.
   *    - Torso days: Lats -> Chest -> Shoulders -> Biceps -> Triceps (ambos brazos siempre presentes!).
   *    - Leg days: Quads -> Hamstrings -> Quads -> Calves -> Adductors.
   * 2. Pure anatomic assignment: Calves and Adductors ONLY on Leg days. Core on Torso/Push/Pull days.
   * 3. Volume calibrated by experienceLevel:
   *    - Principiante: exact 2 sets per exercise (all standard muscles = 6 sets/week, priority = 8).
   *    - Intermedio: 2-3 sets per exercise (standard = 8 sets/week, priority = 10-12).
   *    - Avanzado: 3-4 sets per exercise (standard = 10 sets/week, priority = 12-16).
   *    - Complementary: exact 2 sets per exercise (total 2-4 sets/week).
   * 4. Max 3 exercises per muscle group per session.
   * 5. Strict session duration normalization (45m=4, 60m=5, 75m=6, 90m=7).
   */
  const generateRoutines = () => {
    const routines: Routine[] = [];

    // Exact normalization: each duration has an exact fixed number of exercises across ALL days
    const exactExercisesCount = durationMinutes === 45 ? 4 : durationMinutes === 60 ? 5 : durationMinutes === 75 ? 6 : 7;

    interface DayQueueItem {
      muscle: string;
      bias?: 'lats' | 'upper_back' | 'trapezius';
      note?: string;
      isComplementary?: boolean;
    }

    interface DayTemplate {
      name: string;
      focusCategory: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'fullbody';
      musclesQueue: DayQueueItem[];
    }

    let dayTemplates: DayTemplate[] = [];

    const effectiveSplit = routineSplitType === 'auto'
      ? (daysPerWeek === 2 ? 'fullbody' : daysPerWeek === 4 ? 'torso_pierna' : 'ppl')
      : routineSplitType;

    if (effectiveSplit === 'ppl') {
      if (daysPerWeek === 3) {
        dayTemplates = [
          {
            name: 'Día 1: Push (Pectoral & Deltoides Intercalados)',
            focusCategory: 'push',
            musclesQueue: [
              { muscle: 'chest', note: 'Pectoral 1: Press convergente de discos o mancuernas' },
              { muscle: 'shoulders', note: 'Deltoides Lateral: Elevaciones laterales en polea (Intercalado para descanso de pecho)' },
              { muscle: 'chest', note: 'Pectoral 2: Press inclinado o aperturas' },
              { muscle: 'triceps', note: 'Tríceps: Extensión en polea con cuerda' },
              { muscle: 'abdominals', note: 'Core: Abdominales en polea (Finisher)', isComplementary: true },
              { muscle: 'shoulders', note: 'Deltoides: Press militar' },
              { muscle: 'triceps', note: 'Tríceps: Extensión katana' }
            ]
          },
          {
            name: 'Día 2: Pull (Espalda & Bíceps Intercalados)',
            focusCategory: 'pull',
            musclesQueue: [
              { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho 1: Jalón unilateral o remo al ilíaco' },
              { muscle: 'biceps', note: 'Bíceps 1: Curl en banco Scott (Intercalado para descanso dorsal)' },
              { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda Alta: Remo con codos a 45-60°' },
              { muscle: 'shoulders', note: 'Deltoides Posterior: Pájaros en máquina o polea' },
              { muscle: 'biceps', note: 'Bíceps 2: Curl martillo en polea' },
              { muscle: 'abdominals', note: 'Core: Elevaciones de piernas', isComplementary: true },
              { muscle: 'upper_back', bias: 'trapezius', note: 'Trapecios: Encogimientos' }
            ]
          },
          {
            name: 'Día 3: Legs (Pierna Completa & Aductor)',
            focusCategory: 'legs',
            musclesQueue: [
              { muscle: 'quadriceps', note: 'Cuádriceps 1: Prensa inclinada o Hack Squat' },
              { muscle: 'hamstrings', note: 'Isquios: Curl femoral sentado (Intercalado antagonista)' },
              { muscle: 'quadriceps', note: 'Cuádriceps 2: Extensiones en máquina' },
              { muscle: 'calves', note: 'Gemelos: Elevaciones de talones en prensa' },
              { muscle: 'adductors', note: 'Aductores: Máquina de "cerrar piernas" (Recordatorio)', isComplementary: true },
              { muscle: 'glutes', note: 'Glúteos: Hip thrust' },
              { muscle: 'hamstrings', note: 'Isquios: Curl femoral tumbado' }
            ]
          }
        ];
      } else if (daysPerWeek === 4) {
        dayTemplates = [
          {
            name: 'Día 1: Torso A (Tracción & Empuje Intercalados)',
            focusCategory: 'upper',
            musclesQueue: [
              { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho 1: Jalón unilateral o remo al ilíaco' },
              { muscle: 'chest', note: 'Pectoral: Press convergente de pecho (Intercalado antagonista)' },
              { muscle: 'shoulders', note: 'Deltoides Lateral: Elevaciones en polea' },
              { muscle: 'biceps', note: 'Bíceps: Curl en banco Scott' },
              { muscle: 'triceps', note: 'Tríceps: Extensión en polea con cuerda' },
              { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda Alta: Remo con soporte de pecho' },
              { muscle: 'abdominals', note: 'Core: Abdominales en polea', isComplementary: true }
            ]
          },
          {
            name: 'Día 2: Pierna A (Cuádriceps & Aductores)',
            focusCategory: 'lower',
            musclesQueue: [
              { muscle: 'quadriceps', note: 'Cuádriceps 1: Hack squat o Prensa 45°' },
              { muscle: 'hamstrings', note: 'Isquios: Curl femoral sentado (Intercalado antagonista)' },
              { muscle: 'quadriceps', note: 'Cuádriceps 2: Extensiones en máquina' },
              { muscle: 'calves', note: 'Gemelos: Elevaciones de talones de pie' },
              { muscle: 'adductors', note: 'Aductores: Máquina de "cerrar piernas" (Recordatorio)', isComplementary: true },
              { muscle: 'glutes', note: 'Glúteos: Hip thrust guiado' },
              { muscle: 'hamstrings', note: 'Isquios: Curl femoral tumbado' }
            ]
          },
          {
            name: 'Día 3: Torso B (Foco Pectoral & Espalda Alta)',
            focusCategory: 'upper',
            musclesQueue: [
              { muscle: 'chest', note: 'Pectoral Superior: Press inclinado' },
              { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda Alta: Remo con codos a 45-60° (Intercalado)' },
              { muscle: 'shoulders', note: 'Deltoides Posterior: Facepull o pájaros' },
              { muscle: 'triceps', note: 'Tríceps: Extensión katana tras nuca' },
              { muscle: 'biceps', note: 'Bíceps: Curl bayesiano en polea' },
              { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho: Pullover en polea' },
              { muscle: 'abdominals', note: 'Core: Crunch en máquina', isComplementary: true }
            ]
          },
          {
            name: 'Día 4: Pierna B (Isquiosurales & Cadena Posterior)',
            focusCategory: 'lower',
            musclesQueue: [
              { muscle: 'hamstrings', note: 'Isquios 1: Peso muerto rumano (RDL)' },
              { muscle: 'quadriceps', note: 'Cuádriceps: Prensa horizontal (Intercalado)' },
              { muscle: 'hamstrings', note: 'Isquios 2: Curl femoral tumbado' },
              { muscle: 'calves', note: 'Gemelos: Elevaciones sentado (sóleo)' },
              { muscle: 'adductors', note: 'Aductores: Máquina guiada (Recordatorio)', isComplementary: true },
              { muscle: 'glutes', note: 'Glúteos: Patada en polea o abductor' },
              { muscle: 'quadriceps', note: 'Zancadas guiadas' }
            ]
          }
        ];
      } else if (daysPerWeek === 5) {
        // EXACT 5-DAY SPLIT:
        // Push A & B: Chest interleaved with delts/triceps (NO consecutive chest!).
        // Pull A & B: Back interleaved with biceps (Back strictly on Day 1 & Day 4 = Frequency 2).
        // Legs: Quads interleaved with hamstrings; Calves and Adductor strictly on Leg day.
        dayTemplates = [
          {
            name: 'Día 1: Pull A (Foco Dorsal Ancho & Bíceps Intercalado)',
            focusCategory: 'pull',
            musclesQueue: [
              { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho 1: Jalón unilateral o remo al ilíaco' },
              { muscle: 'biceps', note: 'Bíceps: Curl en banco Scott (Intercalado para permitir descanso dorsal)' },
              { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho 2: Remo con apoyo de pecho agarre neutro' },
              { muscle: 'shoulders', note: 'Deltoides Posterior: Pájaros en máquina o polea' },
              { muscle: 'biceps', note: 'Bíceps 2: Curl martillo para braquial' },
              { muscle: 'abdominals', note: 'Core: Abdomen en polea (Recordatorio)', isComplementary: true },
              { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho 3: Pullover en polea' }
            ]
          },
          {
            name: 'Día 2: Push A (Pectoral & Deltoides Intercalados)',
            focusCategory: 'push',
            musclesQueue: [
              { muscle: 'chest', note: 'Pectoral 1: Press convergente de discos o mancuernas' },
              { muscle: 'shoulders', note: 'Deltoides Lateral: Elevaciones laterales en polea (Intercalado para descanso pectoral)' },
              { muscle: 'chest', note: 'Pectoral 2: Press inclinado o cruces en polea' },
              { muscle: 'triceps', note: 'Tríceps: Extensión en polea con cuerda' },
              { muscle: 'shoulders', note: 'Deltoides Anterior: Press de hombros' },
              { muscle: 'triceps', note: 'Tríceps: Extensión katana tras nuca' },
              { muscle: 'abdominals', note: 'Core: Crunch en máquina', isComplementary: true }
            ]
          },
          {
            name: 'Día 3: Legs (Cuádriceps, Femoral & Aductor)',
            focusCategory: 'legs',
            musclesQueue: [
              { muscle: 'quadriceps', note: 'Cuádriceps 1: Hack squat o Prensa 45°' },
              { muscle: 'hamstrings', note: 'Isquios: Curl sentado en máquina (Intercalado antagonista)' },
              { muscle: 'quadriceps', note: 'Cuádriceps 2: Extensiones en máquina' },
              { muscle: 'calves', note: 'Gemelos: Elevaciones de talones en prensa' },
              { muscle: 'adductors', note: 'Aductores: Máquina de "cerrar piernas" (Recordatorio)', isComplementary: true },
              { muscle: 'glutes', note: 'Glúteos: Hip thrust o Prensa unilateral' },
              { muscle: 'hamstrings', note: 'Isquios: Curl femoral tumbado' }
            ]
          },
          {
            name: 'Día 4: Pull B (Espalda Alta, Trapecios & Bíceps Intercalados)',
            focusCategory: 'pull',
            musclesQueue: [
              { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda Alta 1: Remo con codos a 45-60° con apoyo de pecho' },
              { muscle: 'biceps', note: 'Bíceps: Curl bayesiano en polea unilateral (Intercalado)' },
              { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho: Pullover en polea alta' },
              { muscle: 'upper_back', bias: 'trapezius', note: 'Trapecios: Encogimientos o Remo alto' },
              { muscle: 'shoulders', note: 'Deltoides Posterior: Facepull en polea' },
              { muscle: 'biceps', note: 'Bíceps: Curl concentrado' },
              { muscle: 'abdominals', note: 'Core: Elevación de piernas', isComplementary: true }
            ]
          },
          {
            name: 'Día 5: Push B (Pectoral Superior & Tríceps Intercalados)',
            focusCategory: 'push',
            musclesQueue: [
              { muscle: 'chest', note: 'Pectoral Superior: Press inclinado con mancuernas o máquina' },
              { muscle: 'shoulders', note: 'Deltoides Lateral: Elevaciones laterales unilaterales (Intercalado)' },
              { muscle: 'chest', note: 'Pectoral: Aperturas inclinadas en polea' },
              { muscle: 'triceps', note: 'Tríceps: Fondos en paralelas asistidos o polea' },
              { muscle: 'triceps', note: 'Tríceps: Extensión tras nuca con cuerda' },
              { muscle: 'shoulders', note: 'Deltoides: Elevaciones frontales o militar' },
              { muscle: 'abdominals', note: 'Core: Abdominales en polea', isComplementary: true }
            ]
          }
        ];
      } else if (daysPerWeek === 6) {
        dayTemplates = [
          {
            name: 'Día 1: Push A (Pectoral & Deltoides Intercalados)',
            focusCategory: 'push',
            musclesQueue: [
              { muscle: 'chest', note: 'Press convergente' },
              { muscle: 'shoulders', note: 'Elevaciones laterales (Intercalado)' },
              { muscle: 'chest', note: 'Press declinado' },
              { muscle: 'triceps', note: 'Extensión polea' },
              { muscle: 'shoulders', note: 'Press hombro' },
              { muscle: 'triceps', note: 'Tríceps tras nuca' },
              { muscle: 'abdominals', note: 'Core', isComplementary: true }
            ]
          },
          {
            name: 'Día 2: Pull A (Dorsal & Bíceps Intercalados)',
            focusCategory: 'pull',
            musclesQueue: [
              { muscle: 'lats', bias: 'lats', note: 'Jalón unilateral' },
              { muscle: 'biceps', note: 'Curl banco Scott (Intercalado)' },
              { muscle: 'lats', bias: 'lats', note: 'Remo dorsal agarre cerrado' },
              { muscle: 'shoulders', note: 'Pájaros máquina' },
              { muscle: 'biceps', note: 'Curl martillo' },
              { muscle: 'upper_back', bias: 'trapezius', note: 'Trapecio' },
              { muscle: 'abdominals', note: 'Core', isComplementary: true }
            ]
          },
          {
            name: 'Día 3: Legs A (Cuádriceps & Aductor)',
            focusCategory: 'legs',
            musclesQueue: [
              { muscle: 'quadriceps', note: 'Hack squat' },
              { muscle: 'hamstrings', note: 'Curl sentado (Intercalado)' },
              { muscle: 'quadriceps', note: 'Extensiones' },
              { muscle: 'calves', note: 'Gemelo en prensa' },
              { muscle: 'adductors', note: 'Aductor máquina ("cerrar piernas")', isComplementary: true },
              { muscle: 'glutes', note: 'Hip thrust' },
              { muscle: 'hamstrings', note: 'Femoral tumbado' }
            ]
          },
          {
            name: 'Día 4: Push B (Pectoral Superior & Tríceps Intercalados)',
            focusCategory: 'push',
            musclesQueue: [
              { muscle: 'chest', note: 'Press inclinado' },
              { muscle: 'shoulders', note: 'Elevaciones polea (Intercalado)' },
              { muscle: 'chest', note: 'Cruces polea' },
              { muscle: 'triceps', note: 'Extensión katana' },
              { muscle: 'triceps', note: 'Tríceps fondos' },
              { muscle: 'shoulders', note: 'Deltoides posterior' },
              { muscle: 'abdominals', note: 'Core', isComplementary: true }
            ]
          },
          {
            name: 'Día 5: Pull B (Espalda Alta & Bíceps Intercalados)',
            focusCategory: 'pull',
            musclesQueue: [
              { muscle: 'upper_back', bias: 'upper_back', note: 'Remo con soporte pecho' },
              { muscle: 'biceps', note: 'Curl bayesiano (Intercalado)' },
              { muscle: 'lats', bias: 'lats', note: 'Pullover polea' },
              { muscle: 'shoulders', note: 'Facepull' },
              { muscle: 'biceps', note: 'Curl invertido' },
              { muscle: 'upper_back', bias: 'trapezius', note: 'Encogimientos' },
              { muscle: 'abdominals', note: 'Core', isComplementary: true }
            ]
          },
          {
            name: 'Día 6: Legs B (Femoral & Glúteos)',
            focusCategory: 'legs',
            musclesQueue: [
              { muscle: 'hamstrings', note: 'Peso muerto rumano' },
              { muscle: 'quadriceps', note: 'Prensa (Intercalado)' },
              { muscle: 'hamstrings', note: 'Curl tumbado' },
              { muscle: 'calves', note: 'Gemelo sentado' },
              { muscle: 'adductors', note: 'Aductor en máquina', isComplementary: true },
              { muscle: 'glutes', note: 'Abductor en máquina' },
              { muscle: 'glutes', note: 'Hip thrust' }
            ]
          }
        ];
      }
    } else if (effectiveSplit === 'torso_pierna') {
      // 4-day Torso/Pierna:
      // In Torso days: BOTH Biceps and Triceps are guaranteed within the 5 exercises!
      // In Leg days: Calves and Adductors are present, NOT on Torso days!
      dayTemplates = [
        {
          name: 'Día 1: Torso A (Tracción, Empuje & Brazos Intercalados)',
          focusCategory: 'upper',
          musclesQueue: [
            { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho: Jalón unilateral o remo al ilíaco' },
            { muscle: 'chest', note: 'Pectoral: Press convergente de pecho (Intercalado antagonista)' },
            { muscle: 'shoulders', note: 'Deltoides Lateral: Elevaciones en polea' },
            { muscle: 'biceps', note: 'Bíceps: Curl en banco Scott' },
            { muscle: 'triceps', note: 'Tríceps: Extensión en polea con cuerda' },
            { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda Alta: Remo codos 45°' },
            { muscle: 'abdominals', note: 'Core: Abdominales en polea', isComplementary: true }
          ]
        },
        {
          name: 'Día 2: Pierna A (Cuádriceps, Femoral & Aductor)',
          focusCategory: 'lower',
          musclesQueue: [
            { muscle: 'quadriceps', note: 'Prensa o sentadilla guiada' },
            { muscle: 'hamstrings', note: 'Curl femoral sentado (Intercalado antagonista)' },
            { muscle: 'quadriceps', note: 'Extensiones de cuádriceps' },
            { muscle: 'calves', note: 'Gemelo de pie o prensa' },
            { muscle: 'adductors', note: 'Aductor en máquina ("cerrar piernas")', isComplementary: true },
            { muscle: 'glutes', note: 'Hip thrust' },
            { muscle: 'hamstrings', note: 'Curl femoral tumbado' }
          ]
        },
        {
          name: 'Día 3: Torso B (Foco Pectoral, Espalda Alta & Brazos)',
          focusCategory: 'upper',
          musclesQueue: [
            { muscle: 'chest', note: 'Pectoral Superior: Press inclinado' },
            { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda Alta: Remo con soporte de pecho (Intercalado)' },
            { muscle: 'shoulders', note: 'Deltoides Posterior: Facepull o pájaros' },
            { muscle: 'triceps', note: 'Tríceps: Extensión katana tras nuca' },
            { muscle: 'biceps', note: 'Bíceps: Curl bayesiano' },
            { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho: Pullover polea' },
            { muscle: 'abdominals', note: 'Core: Crunch en máquina', isComplementary: true }
          ]
        },
        {
          name: 'Día 4: Pierna B (Isquios, Cadena Posterior & Gemelo)',
          focusCategory: 'lower',
          musclesQueue: [
            { muscle: 'hamstrings', note: 'Peso muerto rumano (RDL)' },
            { muscle: 'quadriceps', note: 'Hack squat o Prensa horizontal (Intercalado)' },
            { muscle: 'hamstrings', note: 'Curl femoral tumbado' },
            { muscle: 'calves', note: 'Gemelo en máquina de discos' },
            { muscle: 'adductors', note: 'Aductor en máquina ("cerrar piernas")', isComplementary: true },
            { muscle: 'glutes', note: 'Patada de glúteo o abductor' },
            { muscle: 'quadriceps', note: 'Zancadas guiadas' }
          ]
        }
      ];
    } else {
      // Full body (2 days)
      dayTemplates = [
        {
          name: 'Día 1: Full Body A (Dorsal, Pecho & Pierna Intercalados)',
          focusCategory: 'fullbody',
          musclesQueue: [
            { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho: Jalón o remo al ilíaco' },
            { muscle: 'chest', note: 'Pectoral medio/convergente (Intercalado)' },
            { muscle: 'quadriceps', note: 'Cuádriceps: Prensa o Hack squat' },
            { muscle: 'biceps', note: 'Bíceps: Curl en banco Scott' },
            { muscle: 'triceps', note: 'Tríceps: Extensión en polea' },
            { muscle: 'shoulders', note: 'Deltoides lateral polea' },
            { muscle: 'calves', note: 'Gemelos en máquina' }
          ]
        },
        {
          name: 'Día 2: Full Body B (Espalda Alta, Cadena Posterior & Brazos)',
          focusCategory: 'fullbody',
          musclesQueue: [
            { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda Alta: Remo con codos a 45-60°' },
            { muscle: 'chest', note: 'Pectoral inclinado (Intercalado)' },
            { muscle: 'hamstrings', note: 'Isquios: Curl femoral sentado' },
            { muscle: 'triceps', note: 'Tríceps: Extensión katana' },
            { muscle: 'biceps', note: 'Bíceps: Curl bayesiano' },
            { muscle: 'adductors', note: 'Aductor en máquina ("cerrar piernas")', isComplementary: true },
            { muscle: 'abdominals', note: 'Abdomen en polea' }
          ]
        }
      ];
    }

    // Track global weekly exercise counts per broad muscle group to strictly hit volume targets
    const weeklyGroupExerciseCount: Record<string, number> = {};

    // Build each routine and enforce strict biomechanical limits
    dayTemplates.forEach((day, dayIdx) => {
      const usedIds = new Set<string>();

      // Track broad category count for the day to enforce: MAX 3 EXERCISES OF THE SAME MUSCLE GROUP PER DAY!
      const broadCategoryCounts: Record<string, number> = {};

      // Filter out muscles that the user dislikes
      const filteredQueue = day.musclesQueue.filter(
        item => !dislikedMuscles.includes(item.muscle)
      );

      const chosenQueue: DayQueueItem[] = [];

      for (const item of filteredQueue) {
        if (chosenQueue.length >= exactExercisesCount) break;

        const broad = BROAD_GROUP_MAP[item.muscle] || item.muscle;
        const currentCount = broadCategoryCounts[broad] || 0;

        // RULE 1: No more than 3 exercises of the same muscle group per day
        if (currentCount >= 3) {
          continue;
        }

        const isPriority = priorityMuscles.includes(item.muscle) || (BROAD_GROUP_MAP[item.muscle] && priorityMuscles.includes(BROAD_GROUP_MAP[item.muscle]));
        const isComp = item.isComplementary || ['abdominals', 'adductors', 'abductors'].includes(item.muscle);

        // RULE 2: Weekly volume cap enforcement based on experience level
        // Principiante: standard max 3 exercises (3x2 = 6 sets), priority max 4 exercises (4x2 = 8 sets)
        // Intermedio: standard max 4 exercises (8 sets), priority max 4 exercises (10-12 sets)
        // Avanzado: standard max 4 exercises (10 sets), priority max 4 exercises (12-16 sets)
        const weeklyCap = isComp ? 2 : (isPriority ? 4 : (experienceLevel === 'principiante' ? 3 : 4));
        const currentWeeklyCount = weeklyGroupExerciseCount[broad] || 0;
        if (currentWeeklyCount >= weeklyCap) {
          continue;
        }

        broadCategoryCounts[broad] = currentCount + 1;
        weeklyGroupExerciseCount[broad] = currentWeeklyCount + 1;
        chosenQueue.push(item);
      }

      // If fewer than exactExercisesCount, fill with appropriate category that has not exceeded weekly cap
      let fallbackLoop = 0;
      while (chosenQueue.length < exactExercisesCount && fallbackLoop < 10) {
        fallbackLoop++;
        const candidate = (day.focusCategory === 'legs' || day.focusCategory === 'lower')
          ? { muscle: 'adductors', note: 'Finisher Complementario de pierna', isComplementary: true }
          : { muscle: 'abdominals', note: 'Finisher Complementario de core', isComplementary: true };

        chosenQueue.push(candidate);
      }

      const exercises: WorkoutExercise[] = chosenQueue.map((item, exIdx) => {
        const template = pickBestExercise(item.muscle, equipmentPref, usedIds, item.bias);
        usedIds.add(template.id);

        const isPriority = priorityMuscles.includes(item.muscle) || (BROAD_GROUP_MAP[item.muscle] && priorityMuscles.includes(BROAD_GROUP_MAP[item.muscle]));
        const isComp = item.isComplementary || ['abdominals', 'adductors', 'abductors'].includes(item.muscle);

        // Sets calculation strictly adhering to experience level & intensity:
        // - Principiante: EXACT 2 sets per exercise (standard reaches exactly 6 sets/week, priority reaches 8).
        // - Intermedio: 2-3 sets per exercise (standard reaches 8 sets/week, priority reaches 10-12).
        // - Avanzado: 3-4 sets per exercise (standard reaches 10 sets/week, priority reaches 12-16).
        // - Complementary (Abdomen / Aductor): EXACT 2 sets per session (~2-4 sets/week reminder).
        let setCount = 2;
        if (isComp) {
          setCount = 2;
        } else if (experienceLevel === 'principiante') {
          setCount = 2;
        } else if (experienceLevel === 'intermedio') {
          setCount = isPriority ? 3 : 2;
        } else {
          // Avanzado
          setCount = isPriority ? 4 : 3;
        }

        // Rep range and target RPE based on user experience level
        const targetReps = isComp 
          ? '12-15' 
          : (experienceLevel === 'principiante' ? '10-12' : (isPriority ? '6-8' : '8-10'));

        const targetRpe = experienceLevel === 'principiante' 
          ? (isComp ? 7.0 : 7.5) 
          : (experienceLevel === 'intermedio' ? (isPriority ? 8.5 : 8.0) : (isPriority ? 9.0 : 8.5));

        const sets = Array.from({ length: setCount }, (_, sIdx) => ({
          id: `sw_${Date.now()}_${dayIdx}_${exIdx}_${sIdx}`,
          index: sIdx + 1,
          type: 'normal' as any,
          weight_kg: 20,
          reps: isComp ? 12 : (experienceLevel === 'principiante' ? 10 : (isPriority ? 8 : 10)),
          rpe: targetRpe,
          is_completed: false
        }));

        return {
          id: `ex_${Date.now()}_${dayIdx}_${exIdx}`,
          exercise_template_id: template.id,
          title: template.title,
          brand: template.brand,
          muscle_group: template.muscle_group,
          equipment_category: template.equipment_category,
          image_url: template.image_url,
          target_rep_range: targetReps,
          notes: item.note
            ? `★ ${item.note} · Tempo controlado 3-0-1. RPE ${targetRpe}.`
            : `Descanso de 90-120s entre series. Técnica estricta.`,
          sets
        };
      });

      routines.push({
        id: `smart_routine_${Date.now()}_${dayIdx}`,
        title: day.name,
        folder_name: `Plan ${effectiveSplit.toUpperCase()} (${durationMinutes} min/día)`,
        description: `Sesión normalizada de ${exercises.length} ejercicios (${exercises.reduce((acc, e) => acc + e.sets.length, 0)} series). Nivel: ${experienceLevel.toUpperCase()}. Máx 3 ej/grupo.`,
        exercises,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    setGeneratedRoutines(routines);
    setSelectedDayIndex(0);
    setStep(7); // Jump to preview
  };

  // Helper to compute weekly volume across all generated routines
  const calculateWeeklyVolumeByGroup = () => {
    if (!generatedRoutines) return {};
    const volume: Record<string, { sets: number; exercisesCount: number; isPriority: boolean; isComplementary: boolean }> = {};

    generatedRoutines.forEach(routine => {
      routine.exercises.forEach(ex => {
        const broad = BROAD_GROUP_MAP[ex.muscle_group] || ex.muscle_group;
        if (!volume[broad]) {
          volume[broad] = {
            sets: 0,
            exercisesCount: 0,
            isPriority: priorityMuscles.includes(broad) || priorityMuscles.includes(ex.muscle_group),
            isComplementary: ['abdominals', 'adductors', 'abductors'].includes(broad)
          };
        }
        volume[broad].sets += ex.sets.length;
        volume[broad].exercisesCount += 1;
      });
    });

    return volume;
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

  const weeklyVolume = calculateWeeklyVolumeByGroup();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-xl bg-[#12141e] border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl text-white space-y-4 max-h-full flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Generador Biomecánico de Rutinas</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Paso {step} de 7
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Periodización fisiológica: {experienceLevel === 'principiante' ? '6 series (Principiante)' : experienceLevel === 'intermedio' ? '8 series (Intermedio)' : '10-16 series (Avanzado)'} · Intercalado agonista/antagonista
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">

          {/* STEP 1: Días por semana */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>¿Cuántos días a la semana vas a entrenar?</span>
                </h4>
                <p className="text-xs text-slate-400">
                  En 5 días aplicaremos Frecuencia 2 exacta en tus músculos prioritarios (ej. Espalda exactamente 2 días, nunca más de 2).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { days: 2, label: '2 días / semana', sub: 'Full Body A/B optimizado' },
                  { days: 3, label: '3 días / semana', sub: 'Push / Pull / Legs intercalado' },
                  { days: 4, label: '4 días / semana', sub: 'Torso / Pierna A/B (Brazos y piernas equilibrados)' },
                  { days: 5, label: '5 días / semana', sub: 'PPL + Especialización (Espalda Frecuencia 2 exacta)' },
                  { days: 6, label: '6 días / semana', sub: 'Push / Pull / Legs x2 avanzado' }
                ].map(opt => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setDaysPerWeek(opt.days as SplitDays)}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      daysPerWeek === opt.days
                        ? 'border-blue-500 bg-blue-600/15 ring-1 ring-blue-500/40 text-white'
                        : 'border-slate-800 bg-[#181a28] hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{opt.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{opt.sub}</div>
                    </div>
                    {daysPerWeek === opt.days && <Check className="w-4 h-4 text-blue-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Nivel & Esquema Preferido */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Nivel de experiencia e intensidad real</span>
                </h4>
                <p className="text-xs text-slate-400">
                  El nivel no depende solo del tiempo entrenando, sino sobre todo de la <b>capacidad de aplicar verdadera intensidad neuromuscular (RIR y cercanía al fallo)</b> en cada serie.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { 
                    key: 'principiante', 
                    label: 'Principiante', 
                    time: '< 1 año entrenando',
                    intensity: 'RIR 2-3 (Intensidad moderada)',
                    volume: '6 series/semana · 2 series/ejercicio',
                    desc: 'Prioriza aprender el patrón motor y técnica sin saturar el sistema nervioso.' 
                  },
                  { 
                    key: 'intermedio', 
                    label: 'Intermedio', 
                    time: '1 a 3 años entrenando',
                    intensity: 'RIR 1-2 (Cercano al fallo)',
                    volume: '8 series/semana · 2-3 series/ejercicio',
                    desc: 'Buena capacidad de reclutamiento motor y sobrecarga progresiva.' 
                  },
                  { 
                    key: 'avanzado', 
                    label: 'Avanzado', 
                    time: '> 3 años entrenando',
                    intensity: 'RIR 0-1 (Fallo real / Máxima tensión)',
                    volume: '10 series/sem (12-16 en prioridad) · 3-4 series/ej',
                    desc: 'Capaz de exprimir cada repetición con máxima tensión mecánica.' 
                  }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setExperienceLevel(item.key as ExperienceLevel)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      experienceLevel === item.key
                        ? 'border-emerald-500 bg-emerald-600/15 ring-1 ring-emerald-500/40 text-white'
                        : 'border-slate-800 bg-[#181a28] text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{item.label}</div>
                    <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">{item.time}</div>
                    <div className="text-[10px] text-amber-300 font-medium mt-0.5">{item.intensity}</div>
                    <div className="text-[10px] text-blue-300 font-mono mt-1">{item.volume}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-tight">{item.desc}</div>
                  </button>
                ))}
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Split className="w-3.5 h-3.5 text-blue-400" />
                  División preferida:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'ppl', name: 'Empuje / Tirón / Pierna (PPL)' },
                    { key: 'torso_pierna', name: 'Torso / Pierna' },
                    { key: 'fullbody', name: 'Full Body' },
                    { key: 'auto', name: 'Automático / Algorítmico' }
                  ].map(split => (
                    <button
                      key={split.key}
                      type="button"
                      onClick={() => setRoutineSplitType(split.key as RoutineSplitType)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                        routineSplitType === split.key
                          ? 'border-blue-500 bg-blue-600/20 text-white font-bold'
                          : 'border-slate-800 bg-[#181a28] text-slate-400'
                      }`}
                    >
                      {split.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Músculos Prioritarios y Especialización de Espalda */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>Músculos prioritarios (Frecuencia 2 y volumen maximizado)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Selecciona los grupos que deseas priorizar. Los músculos no prioritarios recibirán {experienceLevel === 'principiante' ? '6 series' : experienceLevel === 'intermedio' ? '8 series' : '10 series'}.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'lats', label: 'Espalda (Dorsal & Alta)' },
                  { key: 'chest', label: 'Pectoral (Pecho)' },
                  { key: 'biceps', label: 'Bíceps (Brazo)' },
                  { key: 'triceps', label: 'Tríceps' },
                  { key: 'shoulders', label: 'Deltoides (Hombros)' },
                  { key: 'quadriceps', label: 'Cuádriceps' },
                  { key: 'hamstrings', label: 'Isquiosurales' },
                  { key: 'glutes', label: 'Glúteos' }
                ].map(m => {
                  const isSel = priorityMuscles.includes(m.key);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => togglePriorityMuscle(m.key)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition flex items-center justify-between ${
                        isSel
                          ? 'border-amber-500 bg-amber-500/20 text-white font-bold'
                          : 'border-slate-800 bg-[#181a28] text-slate-400'
                      }`}
                    >
                      <span className="truncate">{m.label}</span>
                      {isSel && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Interleaving explanation banner */}
              <div className="p-3 rounded-2xl bg-slate-900 border border-blue-500/30 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>Técnica de Intercalado Agonista/Antagonista:</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  • <b>Pecho intercalado con deltoides/tríceps:</b> Press 1 → Deltoides Lateral → Press 2 → Tríceps (el pecho descansa 4-5 min entre presses sin fatiga local acumulada).<br/>
                  • <b>Espalda intercalada con bíceps:</b> Dorsal 1 → Bíceps → Espalda Alta → Deltoides Posterior → Bíceps/Core.<br/>
                  • <b>Pierna intercalada:</b> Cuádriceps (Prensa) → Isquios (Femoral sentado) → Cuádriceps (Extensiones) → Gemelos → Aductor.<br/>
                  • <b>Máximo 3 ejercicios por grupo:</b> Ningún día excederá 3 ejercicios del mismo grupo.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Músculos que NO gustan / menos prioritarios */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-rose-400" />
                  <span>¿Qué músculos NO te gusta entrenar o tienen baja prioridad?</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Los excluiremos del plan. Los complementarios (abdomen y máquina de aductor "cerrar piernas") <b>recibirán un recordatorio de solo 2 a 4 series semanales</b> sin saturar el volumen.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'calves', label: 'Gemelos' },
                  { key: 'abdominals', label: 'Abdomen / Core' },
                  { key: 'adductors', label: 'Aductores ("Cerrar piernas")' },
                  { key: 'forearms', label: 'Antebrazos' },
                  { key: 'trapezius', label: 'Trapecios' },
                  { key: 'glutes', label: 'Glúteos' }
                ].map(m => {
                  const isDisliked = dislikedMuscles.includes(m.key);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => toggleDislikedMuscle(m.key)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between ${
                        isDisliked
                          ? 'border-rose-500 bg-rose-500/20 text-rose-200'
                          : 'border-slate-800 bg-[#181a28] text-slate-400'
                      }`}
                    >
                      <span className="truncate">{m.label}</span>
                      {isDisliked && <X className="w-3.5 h-3.5 text-rose-400" />}
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Volumen controlado: Aductor y Abdomen reciben solo 2 series por sesión (2-4 semanales). Gemelos se entrena únicamente en días de pierna.
                </span>
              </div>
            </div>
          )}

          {/* STEP 5: Tiempo de Sesión (Con normalización estricta) */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Tiempo exacto por sesión (Normalización Estricta)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Cada día de la rutina tendrá <b>exactamente la misma cantidad de ejercicios</b>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { mins: 45, label: '45 minutos', sub: `Exactamente 4 ejercicios · ${experienceLevel === 'principiante' ? '8 series' : '12-14 series'}` },
                  { mins: 60, label: '60 minutos', sub: `Exactamente 5 ejercicios · ${experienceLevel === 'principiante' ? '10 series' : '15-18 series'}` },
                  { mins: 75, label: '75 minutos', sub: `Exactamente 6 ejercicios · ${experienceLevel === 'principiante' ? '12 series' : '18-22 series'}` },
                  { mins: 90, label: '90 minutos', sub: `Exactamente 7 ejercicios · ${experienceLevel === 'principiante' ? '14 series' : '22-26 series'}` }
                ].map(opt => (
                  <button
                    key={opt.mins}
                    type="button"
                    onClick={() => setDurationMinutes(opt.mins as SessionDuration)}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      durationMinutes === opt.mins
                        ? 'border-cyan-500 bg-cyan-600/20 ring-1 ring-cyan-500/40 text-white'
                        : 'border-slate-800 bg-[#181a28] hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{opt.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{opt.sub}</div>
                    </div>
                    {durationMinutes === opt.mins && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Maquinaria */}
          {step === 6 && (
            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Preferencia de maquinaria</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Selecciona la línea con la que prefieres entrenar.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { key: 'technogym', name: 'Technogym Pure Strength', desc: 'Palancas de discos independientes con perfiles convergentes' },
                  { key: 'hammer', name: 'Hammer Strength Iso-Lateral', desc: 'Máquinas olímpicas divergentes' },
                  { key: 'cables_selectorized', name: 'Poleas & Torres guiadas', desc: 'Tensión constante durante todo el rango articular' },
                  { key: 'hybrid', name: 'Híbrido Inteligente', desc: 'Combina máquinas de discos con peso libre' },
                  { key: 'free_weights', name: 'Peso Libre', desc: 'Barras y mancuernas' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setEquipmentPref(item.key as EquipmentPref)}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      equipmentPref === item.key
                        ? 'border-purple-500 bg-purple-600/20 text-white'
                        : 'border-slate-800 bg-[#181a28] text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </div>
                    {equipmentPref === item.key && <Check className="w-4 h-4 text-purple-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: Previsualización de Rutinas y Desglose de Volumen Semanal */}
          {step === 7 && generatedRoutines && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Rutina Biomecánica Optimizada
                  </h4>
                  <p className="text-xs text-slate-400">
                    {generatedRoutines.length} sesiones de {durationMinutes} min ({generatedRoutines[0]?.exercises.length} ejercicios/día) · Nivel {experienceLevel.toUpperCase()}
                  </p>
                </div>

                <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {generatedRoutines.map((r, idx) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                        selectedDayIndex === idx
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Día {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume Landmarks Compliance Card */}
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
                    Volumen Semanal (Series Totales según Nivel {experienceLevel.toUpperCase()}):
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    ✓ Intercalado & Máx 3 ej/día
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                  {Object.entries(weeklyVolume).map(([grp, data]) => {
                    let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                    let targetLabel = experienceLevel === 'principiante' ? '6s objetivo' : experienceLevel === 'intermedio' ? '8s objetivo' : '10s objetivo';
                    if (data.isPriority) {
                      badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
                      targetLabel = experienceLevel === 'principiante' ? '8s ★ Prioridad' : '12-16s ★ Prioridad';
                    } else if (data.isComplementary) {
                      badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
                      targetLabel = '2-4s (Recordatorio)';
                    }
                    return (
                      <div
                        key={grp}
                        className={`p-1.5 rounded-lg border flex items-center justify-between ${badgeColor}`}
                      >
                        <span className="capitalize truncate">{formatMuscleName(grp)}:</span>
                        <div className="flex items-center gap-1 ml-1">
                          <span className="text-[9px] opacity-70">({targetLabel})</span>
                          <span className="font-mono font-bold">{data.sets}s</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day Details */}
              {generatedRoutines[selectedDayIndex] && (
                <div className="space-y-2 bg-[#181a28] p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="font-bold text-xs text-blue-300">
                      {generatedRoutines[selectedDayIndex].title}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                      {generatedRoutines[selectedDayIndex].exercises.length} ejercicios · {generatedRoutines[selectedDayIndex].exercises.reduce((acc, e) => acc + e.sets.length, 0)} series
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {generatedRoutines[selectedDayIndex].exercises.map((ex, i) => (
                      <div
                        key={ex.id}
                        className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5 max-w-[75%]">
                          <div className="font-semibold text-slate-200 truncate">
                            {i + 1}. {ex.title}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ex.sets.length} series × {ex.target_rep_range} reps · {ex.notes}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                          {ex.muscle_group}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          {step > 1 && step < 7 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Atrás
            </button>
          )}

          {step < 6 && (
            <button
              onClick={() => setStep(s => s + 1)}
              className="ml-auto py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition"
            >
              Siguiente
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 6 && (
            <button
              onClick={generateRoutines}
              className="ml-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/30 transition"
            >
              <Sparkles className="w-4 h-4" />
              Generar Rutina Personalizada
            </button>
          )}

          {step === 7 && (
            <div className="flex gap-2 w-full justify-end">
              <button
                onClick={() => setStep(1)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Modificar
              </button>
              <button
                onClick={handleSaveSelected}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Guardar Día {selectedDayIndex + 1}
              </button>
              <button
                onClick={handleSaveAll}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
              >
                <Check className="w-3.5 h-3.5" />
                Guardar Plan Completo ({daysPerWeek} Días)
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
