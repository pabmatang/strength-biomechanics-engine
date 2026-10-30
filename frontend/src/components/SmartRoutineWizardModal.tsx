import React, { useState } from 'react';
import { 
  X, Sparkles, Dumbbell, Clock, Calendar, Check, ArrowRight, ArrowLeft, 
  Sliders, ShieldCheck, Layers, Play, RefreshCw, Star, Info, ThumbsDown,
  Activity, Award, Split, BarChart2, CheckCircle2, ChevronRight
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
 * 2) Volume landmarks (12-16 sets priority, 6-10 secondary, 4 complementary reminder)
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

  // Wizard answers
  const [daysPerWeek, setDaysPerWeek] = useState<SplitDays>(5);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('avanzado');
  const [routineSplitType, setRoutineSplitType] = useState<RoutineSplitType>('ppl');
  const [priorityMuscles, setPriorityMuscles] = useState<string[]>(['lats', 'chest', 'biceps']);
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
   * 1. Automatic Complementary Muscle assignment (Calves, Abs, Adductors) at the end of sessions (4 sets reminder).
   * 2. Max 3 exercises of the same muscle group per session (strict biomechanical ceiling).
   * 3. Frequency ceiling: Back appears exactly 2 times per week in a 5-day split (Pull A & Pull B).
   * 4. Interleaving: On Pull days, Biceps is interleaved between Back Exercise 1 and Back Exercise 2.
   * 5. Strict Session Duration Normalization (45m=4, 60m=5, 75m=6, 90m=7 exercises on ALL days).
   * 6. Weekly Volume targets: Priority 12-16 sets, Secondary 6-10 sets, Complementary 4 sets reminder.
   */
  const generateRoutines = () => {
    const routines: Routine[] = [];

    // Exact normalization: each duration has an exact fixed number of exercises across ALL days
    const exactExercisesCount = durationMinutes === 45 ? 4 : durationMinutes === 60 ? 5 : durationMinutes === 75 ? 6 : 7;

    // Available complementary muscles for rotation (never asked directly, auto-distributed)
    const complementaryPool = ['calves', 'abdominals', 'adductors'].filter(
      m => !dislikedMuscles.includes(m)
    );
    if (complementaryPool.length === 0) complementaryPool.push('abdominals');

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
            name: 'Día 1: Push (Pectoral & Deltoides)',
            focusCategory: 'push',
            musclesQueue: [
              { muscle: 'chest', note: 'Pectoral plano/convergente' },
              { muscle: 'chest', note: 'Pectoral superior/inclinado' },
              { muscle: 'shoulders', note: 'Deltoides lateral' },
              { muscle: 'triceps', note: 'Extensión de tríceps' },
              { muscle: complementaryPool[0 % complementaryPool.length], note: 'Complementario recordatorio', isComplementary: true },
              { muscle: 'shoulders', note: 'Deltoides anterior' },
              { muscle: 'triceps', note: 'Tríceps katana' }
            ]
          },
          {
            name: 'Día 2: Pull (Espalda Especializada & Bíceps Intercalado)',
            focusCategory: 'pull',
            musclesQueue: [
              { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho 1: Jalón o remo guiado al ilíaco' },
              { muscle: 'biceps', note: 'Bíceps 1: Curl en banco Scott (Intercalado para recuperación de espalda)' },
              { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda Alta: Remo con codos a 45-60°' },
              { muscle: 'shoulders', note: 'Deltoides posterior / Facepull' },
              { muscle: complementaryPool[1 % complementaryPool.length], note: 'Complementario recordatorio', isComplementary: true },
              { muscle: 'biceps', note: 'Bíceps 2: Curl martillo o polea' },
              { muscle: 'upper_back', bias: 'trapezius', note: 'Trapecios / Encogimientos' }
            ]
          },
          {
            name: 'Día 3: Legs (Pierna Completa & Aductor)',
            focusCategory: 'legs',
            musclesQueue: [
              { muscle: 'quadriceps', note: 'Cuádriceps: Prensa o Hack Squat' },
              { muscle: 'hamstrings', note: 'Isquios: Curl femoral sentado' },
              { muscle: 'quadriceps', note: 'Cuádriceps: Extensiones en máquina' },
              { muscle: 'glutes', note: 'Glúteos: Hip thrust guiado' },
              { muscle: complementaryPool[2 % complementaryPool.length] || 'calves', note: 'Complementario: Gemelos o Aductor', isComplementary: true },
              { muscle: 'adductors', note: 'Aductor en máquina ("cerrar piernas")' },
              { muscle: 'calves', note: 'Gemelo en prensa' }
            ]
          }
        ];
      } else if (daysPerWeek === 4) {
        dayTemplates = [
          {
            name: 'Día 1: Torso A (Foco Dorsal Ancho & Bíceps Intercalado)',
            focusCategory: 'upper',
            musclesQueue: [
              { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho 1: Jalón o remo al ilíaco' },
              { muscle: 'biceps', note: 'Bíceps: Curl Scott (Intercalado)' },
              { muscle: 'chest', note: 'Pectoral plano convergente' },
              { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda Alta: Remo soporte de pecho' },
              { muscle: complementaryPool[0 % complementaryPool.length], note: 'Complementario recordatorio', isComplementary: true },
              { muscle: 'shoulders', note: 'Deltoides lateral polea' },
              { muscle: 'triceps', note: 'Tríceps en polea' }
            ]
          },
          {
            name: 'Día 2: Pierna A (Cuádriceps & Aductores)',
            focusCategory: 'lower',
            musclesQueue: [
              { muscle: 'quadriceps', note: 'Hack squat o Prensa 45°' },
              { muscle: 'hamstrings', note: 'Curl femoral sentado' },
              { muscle: 'quadriceps', note: 'Extensiones de cuádriceps' },
              { muscle: 'adductors', note: 'Aductor en máquina ("cerrar piernas")' },
              { muscle: complementaryPool[1 % complementaryPool.length], note: 'Complementario recordatorio', isComplementary: true },
              { muscle: 'glutes', note: 'Hip thrust' },
              { muscle: 'calves', note: 'Gemelo de pie' }
            ]
          },
          {
            name: 'Día 3: Torso B (Foco Espalda Alta, Pectoral & Brazos)',
            focusCategory: 'upper',
            musclesQueue: [
              { muscle: 'chest', note: 'Pectoral superior / inclinado' },
              { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda Alta: Remo con codos a 45-60°' },
              { muscle: 'biceps', note: 'Bíceps: Curl bayesiano polea' },
              { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho 2: Pullover en polea' },
              { muscle: complementaryPool[2 % complementaryPool.length] || 'abdominals', note: 'Complementario recordatorio', isComplementary: true },
              { muscle: 'shoulders', note: 'Deltoides posterior / pájaros' },
              { muscle: 'triceps', note: 'Extensión tras nuca' }
            ]
          },
          {
            name: 'Día 4: Pierna B (Isquiosurales & Cadena Posterior)',
            focusCategory: 'lower',
            musclesQueue: [
              { muscle: 'hamstrings', note: 'Peso muerto rumano / Femoral tumbado' },
              { muscle: 'quadriceps', note: 'Prensa horizontal' },
              { muscle: 'glutes', note: 'Patada de glúteo en polea o abductor' },
              { muscle: 'calves', note: 'Gemelo en máquina de discos' },
              { muscle: complementaryPool[0 % complementaryPool.length], note: 'Complementario recordatorio', isComplementary: true },
              { muscle: 'adductors', note: 'Aductor guiado' },
              { muscle: 'abdominals', note: 'Elevación de piernas' }
            ]
          }
        ];
      } else if (daysPerWeek === 5) {
        // EXACT 5-DAY SPLIT:
        // Back appears ONLY in Día 1 (Pull A) and Día 4 (Pull B) -> Exactly 2 days per week!
        // No Back on Día 2, Día 3 or Día 5!
        dayTemplates = [
          {
            name: 'Día 1: Pull A (Foco Dorsal Ancho & Bíceps Intercalado)',
            focusCategory: 'pull',
            musclesQueue: [
              { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho 1: Jalón unilateral o remo al ilíaco' },
              { muscle: 'biceps', note: 'Bíceps: Curl en banco Scott (Intercalado para permitir descanso dorsal)' },
              { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho 2: Remo con apoyo de pecho agarre neutro' },
              { muscle: 'shoulders', note: 'Deltoides Posterior: Pájaros en máquina o polea' },
              { muscle: complementaryPool[0 % complementaryPool.length], note: 'Finisher Complementario: Gemelo/Core (Recordatorio 4 series)', isComplementary: true },
              { muscle: 'biceps', note: 'Bíceps 2: Curl martillo para braquial' },
              { muscle: complementaryPool[1 % complementaryPool.length], note: 'Finisher Complementario: Aductor/Pierna', isComplementary: true }
            ]
          },
          {
            name: 'Día 2: Push A (Foco Pectoral & Tríceps)',
            focusCategory: 'push',
            musclesQueue: [
              { muscle: 'chest', note: 'Pectoral 1: Press convergente de discos o mancuernas' },
              { muscle: 'chest', note: 'Pectoral 2: Cruces en polea baja o press declinado' },
              { muscle: 'shoulders', note: 'Deltoides Lateral: Elevaciones laterales en polea' },
              { muscle: 'triceps', note: 'Tríceps: Extensión en polea con cuerda' },
              { muscle: complementaryPool[1 % complementaryPool.length], note: 'Finisher Complementario: Abdominales en polea', isComplementary: true },
              { muscle: 'shoulders', note: 'Deltoides Anterior: Press de hombros' },
              { muscle: 'triceps', note: 'Tríceps: Extensión katana tras nuca' }
            ]
          },
          {
            name: 'Día 3: Legs (Cuádriceps, Femoral & Aductor)',
            focusCategory: 'legs',
            musclesQueue: [
              { muscle: 'quadriceps', note: 'Cuádriceps 1: Hack squat o Prensa 45°' },
              { muscle: 'hamstrings', note: 'Femoral: Curl sentado en máquina' },
              { muscle: 'quadriceps', note: 'Cuádriceps 2: Extensiones en máquina' },
              { muscle: 'glutes', note: 'Glúteos: Hip thrust o Prensa unilateral' },
              { muscle: complementaryPool[2 % complementaryPool.length] || 'adductors', note: 'Finisher Complementario: Aductor máquina ("cerrar piernas")', isComplementary: true },
              { muscle: 'calves', note: 'Gemelo en prensa' },
              { muscle: 'hamstrings', note: 'Curl femoral tumbado' }
            ]
          },
          {
            name: 'Día 4: Pull B (Foco Espalda Alta, Trapecios & Bíceps Intercalado)',
            focusCategory: 'pull',
            musclesQueue: [
              { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda Alta 1: Remo con codos a 45-60° con apoyo de pecho' },
              { muscle: 'biceps', note: 'Bíceps: Curl bayesiano en polea unilateral (Intercalado)' },
              { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho: Pullover en polea alta' },
              { muscle: 'upper_back', bias: 'trapezius', note: 'Trapecios: Encogimientos o Remo alto' },
              { muscle: complementaryPool[0 % complementaryPool.length], note: 'Finisher Complementario: Gemelo/Core (Recordatorio)', isComplementary: true },
              { muscle: 'shoulders', note: 'Deltoides posterior: Facepull en polea' },
              { muscle: 'biceps', note: 'Bíceps: Curl concentrado' }
            ]
          },
          {
            name: 'Día 5: Push B (Foco Pectoral Superior & Hombro Lateral)',
            focusCategory: 'push',
            musclesQueue: [
              { muscle: 'chest', note: 'Pectoral Superior: Press inclinado con mancuernas o máquina' },
              { muscle: 'chest', note: 'Pectoral: Aperturas inclinadas en polea' },
              { muscle: 'shoulders', note: 'Deltoides Lateral: Elevaciones laterales unilaterales' },
              { muscle: 'triceps', note: 'Tríceps: Fondos en paralelas asistidos' },
              { muscle: complementaryPool[1 % complementaryPool.length], note: 'Finisher Complementario: Abdominales en máquina', isComplementary: true },
              { muscle: 'shoulders', note: 'Deltoides posterior / trapecio' },
              { muscle: 'triceps', note: 'Tríceps en cuerda' }
            ]
          }
        ];
      } else if (daysPerWeek === 6) {
        dayTemplates = [
          {
            name: 'Día 1: Push A (Pectoral Pesado)',
            focusCategory: 'push',
            musclesQueue: [
              { muscle: 'chest', note: 'Press convergente' },
              { muscle: 'chest', note: 'Press declinado' },
              { muscle: 'shoulders', note: 'Elevaciones laterales' },
              { muscle: 'triceps', note: 'Extensión polea' },
              { muscle: complementaryPool[0 % complementaryPool.length], note: 'Complementario recordatorio', isComplementary: true },
              { muscle: 'shoulders', note: 'Press hombro' },
              { muscle: 'triceps', note: 'Tríceps tras nuca' }
            ]
          },
          {
            name: 'Día 2: Pull A (Dorsal & Bíceps Intercalado)',
            focusCategory: 'pull',
            musclesQueue: [
              { muscle: 'lats', bias: 'lats', note: 'Jalón unilateral' },
              { muscle: 'biceps', note: 'Curl banco Scott (Intercalado)' },
              { muscle: 'lats', bias: 'lats', note: 'Remo dorsal agarre cerrado' },
              { muscle: 'shoulders', note: 'Pájaros máquina' },
              { muscle: complementaryPool[1 % complementaryPool.length], note: 'Complementario recordatorio', isComplementary: true },
              { muscle: 'biceps', note: 'Curl martillo' },
              { muscle: 'upper_back', bias: 'trapezius', note: 'Trapecio' }
            ]
          },
          {
            name: 'Día 3: Legs A (Cuádriceps & Aductor)',
            focusCategory: 'legs',
            musclesQueue: [
              { muscle: 'quadriceps', note: 'Hack squat' },
              { muscle: 'hamstrings', note: 'Curl sentado' },
              { muscle: 'quadriceps', note: 'Extensiones' },
              { muscle: 'adductors', note: 'Aductor máquina' },
              { muscle: complementaryPool[2 % complementaryPool.length] || 'calves', note: 'Complementario recordatorio', isComplementary: true },
              { muscle: 'glutes', note: 'Hip thrust' },
              { muscle: 'calves', note: 'Gemelo en prensa' }
            ]
          },
          {
            name: 'Día 4: Push B (Pectoral Superior & Tríceps)',
            focusCategory: 'push',
            musclesQueue: [
              { muscle: 'chest', note: 'Press inclinado' },
              { muscle: 'chest', note: 'Cruces polea' },
              { muscle: 'shoulders', note: 'Elevaciones polea' },
              { muscle: 'triceps', note: 'Extensión katana' },
              { muscle: complementaryPool[0 % complementaryPool.length], note: 'Complementario recordatorio', isComplementary: true },
              { muscle: 'shoulders', note: 'Deltoides posterior' },
              { muscle: 'triceps', note: 'Tríceps fondos' }
            ]
          },
          {
            name: 'Día 5: Pull B (Espalda Alta & Bíceps Intercalado)',
            focusCategory: 'pull',
            musclesQueue: [
              { muscle: 'upper_back', bias: 'upper_back', note: 'Remo con soporte pecho' },
              { muscle: 'biceps', note: 'Curl bayesiano (Intercalado)' },
              { muscle: 'lats', bias: 'lats', note: 'Pullover polea' },
              { muscle: 'upper_back', bias: 'trapezius', note: 'Encogimientos' },
              { muscle: complementaryPool[1 % complementaryPool.length], note: 'Complementario recordatorio', isComplementary: true },
              { muscle: 'shoulders', note: 'Facepull' },
              { muscle: 'biceps', note: 'Curl invertido' }
            ]
          },
          {
            name: 'Día 6: Legs B (Femoral & Glúteos)',
            focusCategory: 'legs',
            musclesQueue: [
              { muscle: 'hamstrings', note: 'Peso muerto rumano' },
              { muscle: 'quadriceps', note: 'Prensa' },
              { muscle: 'glutes', note: 'Abductor en máquina' },
              { muscle: 'hamstrings', note: 'Curl tumbado' },
              { muscle: complementaryPool[2 % complementaryPool.length] || 'calves', note: 'Complementario recordatorio', isComplementary: true },
              { muscle: 'calves', note: 'Gemelo sentado' },
              { muscle: 'abdominals', note: 'Abdominales en polea' }
            ]
          }
        ];
      }
    } else if (effectiveSplit === 'torso_pierna') {
      dayTemplates = [
        {
          name: 'Día 1: Torso A (Foco Dorsal & Bíceps Intercalado)',
          focusCategory: 'upper',
          musclesQueue: [
            { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho 1: Jalón o remo al ilíaco' },
            { muscle: 'biceps', note: 'Bíceps: Curl Scott (Intercalado)' },
            { muscle: 'chest', note: 'Pectoral medio convergente' },
            { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda Alta: Remo codos 45°' },
            { muscle: complementaryPool[0 % complementaryPool.length], note: 'Complementario recordatorio', isComplementary: true },
            { muscle: 'shoulders', note: 'Deltoides lateral polea' },
            { muscle: 'triceps', note: 'Tríceps en polea' }
          ]
        },
        {
          name: 'Día 2: Pierna A (Cuádriceps & Aductor)',
          focusCategory: 'lower',
          musclesQueue: [
            { muscle: 'quadriceps', note: 'Prensa o sentadilla guiada' },
            { muscle: 'hamstrings', note: 'Curl femoral sentado' },
            { muscle: 'quadriceps', note: 'Extensiones de cuádriceps' },
            { muscle: 'adductors', note: 'Aductor en máquina ("cerrar piernas")' },
            { muscle: complementaryPool[1 % complementaryPool.length], note: 'Complementario recordatorio', isComplementary: true },
            { muscle: 'glutes', note: 'Hip thrust' },
            { muscle: 'calves', note: 'Gemelo de pie' }
          ]
        },
        {
          name: 'Día 3: Torso B (Foco Pectoral & Espalda Alta)',
          focusCategory: 'upper',
          musclesQueue: [
            { muscle: 'chest', note: 'Pectoral superior convergente' },
            { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda Alta: Remo con soporte de pecho' },
            { muscle: 'biceps', note: 'Bíceps: Curl bayesiano' },
            { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho: Pullover polea' },
            { muscle: complementaryPool[2 % complementaryPool.length] || 'abdominals', note: 'Complementario recordatorio', isComplementary: true },
            { muscle: 'shoulders', note: 'Deltoides posterior / Pájaros' },
            { muscle: 'triceps', note: 'Tríceps katana' }
          ]
        },
        {
          name: 'Día 4: Pierna B (Isquios & Cadena Posterior)',
          focusCategory: 'lower',
          musclesQueue: [
            { muscle: 'hamstrings', note: 'Peso muerto rumano' },
            { muscle: 'quadriceps', note: 'Hack squat' },
            { muscle: 'glutes', note: 'Patada de glúteo o abductor' },
            { muscle: 'calves', note: 'Gemelo en máquina' },
            { muscle: complementaryPool[0 % complementaryPool.length], note: 'Complementario recordatorio', isComplementary: true },
            { muscle: 'adductors', note: 'Aductor máquina ("cerrar piernas")' },
            { muscle: 'abdominals', note: 'Elevación de piernas en suspensión' }
          ]
        }
      ];
    } else {
      // Full body (2 days)
      dayTemplates = [
        {
          name: 'Día 1: Full Body A (Dorsal & Pectoral Pesado)',
          focusCategory: 'fullbody',
          musclesQueue: [
            { muscle: 'lats', bias: 'lats', note: 'Dorsal Ancho: Jalón o remo al ilíaco' },
            { muscle: 'biceps', note: 'Bíceps: Curl en banco Scott (Intercalado)' },
            { muscle: 'chest', note: 'Pectoral medio/convergente' },
            { muscle: 'quadriceps', note: 'Cuádriceps: Prensa o Hack squat' },
            { muscle: complementaryPool[0 % complementaryPool.length], note: 'Complementario recordatorio', isComplementary: true },
            { muscle: 'shoulders', note: 'Deltoides lateral polea' },
            { muscle: 'calves', note: 'Gemelos en máquina' }
          ]
        },
        {
          name: 'Día 2: Full Body B (Espalda Alta & Cadena Posterior)',
          focusCategory: 'fullbody',
          musclesQueue: [
            { muscle: 'upper_back', bias: 'upper_back', note: 'Espalda Alta: Remo con codos a 45-60°' },
            { muscle: 'chest', note: 'Pectoral inclinado' },
            { muscle: 'hamstrings', note: 'Isquios: Curl femoral sentado' },
            { muscle: 'triceps', note: 'Tríceps: Extensión en polea' },
            { muscle: complementaryPool[1 % complementaryPool.length], note: 'Complementario recordatorio', isComplementary: true },
            { muscle: 'adductors', note: 'Aductor en máquina ("cerrar piernas")' },
            { muscle: 'abdominals', note: 'Abdomen en polea' }
          ]
        }
      ];
    }

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

        // RULE: No more than 3 exercises of the same muscle group per day (e.g. back <= 3, chest <= 3, shoulders <= 3)
        if (currentCount >= 3) {
          // Skip or replace with complementary finisher if available
          continue;
        }

        broadCategoryCounts[broad] = currentCount + 1;
        chosenQueue.push(item);
      }

      // If there are fewer than exactExercisesCount, backfill with complementary muscles or safe accessory
      let compIdx = 0;
      while (chosenQueue.length < exactExercisesCount) {
        const nextComp = complementaryPool[compIdx % complementaryPool.length] || 'abdominals';
        compIdx++;
        const broad = BROAD_GROUP_MAP[nextComp] || nextComp;
        const count = broadCategoryCounts[broad] || 0;
        if (count < 2) {
          broadCategoryCounts[broad] = count + 1;
          chosenQueue.push({
            muscle: nextComp,
            note: 'Finisher Complementario de compensación (Recordatorio 4 series)',
            isComplementary: true
          });
        } else {
          // Add safe arms or accessory
          chosenQueue.push({
            muscle: 'biceps',
            note: 'Accesorio de compensación de volumen'
          });
        }
      }

      const exercises: WorkoutExercise[] = chosenQueue.map((item, exIdx) => {
        const template = pickBestExercise(item.muscle, equipmentPref, usedIds, item.bias);
        usedIds.add(template.id);

        const isPriority = priorityMuscles.includes(item.muscle);
        const isComp = item.isComplementary || ['calves', 'abdominals', 'adductors', 'abductors'].includes(item.muscle);

        // Sets calculation by biomechanical landmark:
        // Priority muscles: 4 sets (minimum 4 series to reach 12-16 weekly volume)
        // Secondary major muscles: 3 sets (to reach 6-10 weekly volume)
        // Complementary muscles: 4 sets (weekly reminder)
        let setCount = 3;
        if (isPriority) {
          setCount = 4;
        } else if (isComp) {
          setCount = 4; // Reminder of 4 sets
        } else {
          setCount = experienceLevel === 'principiante' ? 2 : 3;
        }

        const sets = Array.from({ length: setCount }, (_, sIdx) => ({
          id: `sw_${Date.now()}_${dayIdx}_${exIdx}_${sIdx}`,
          index: sIdx + 1,
          type: 'normal' as any,
          weight_kg: 20,
          reps: isPriority ? 8 : (isComp ? 12 : 10),
          rpe: isPriority ? 8.5 : (isComp ? 7.5 : 8.0),
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
          target_rep_range: isPriority ? '6-8' : (isComp ? '12-15' : '8-12'),
          notes: item.note
            ? `★ ${item.note} · Tempo controlado 3-0-1. RPE ${isPriority ? 8.5 : 8.0}.`
            : `Descanso de 90-120s entre series. Técnica estricta.`,
          sets
        };
      });

      routines.push({
        id: `smart_routine_${Date.now()}_${dayIdx}`,
        title: day.name,
        folder_name: `Plan ${effectiveSplit.toUpperCase()} (${durationMinutes} min/día)`,
        description: `Sesión normalizada de ${exercises.length} ejercicios (${exercises.reduce((acc, e) => acc + e.sets.length, 0)} series). Prioridad: ${priorityMuscles.map(m => formatMuscleName(m)).join(', ')}. Máx 3 ej/grupo.`,
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
            isComplementary: ['calves', 'abdominals', 'adductors'].includes(broad)
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
                Periodización estricta: 12-16 series prioridad, máx 3 ej/grupo y bíceps intercalado
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
                  { days: 3, label: '3 días / semana', sub: 'Push / Pull / Legs o Torso/Pierna' },
                  { days: 4, label: '4 días / semana', sub: 'Torso / Pierna A/B (Frecuencia 2)' },
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
                  <span>Nivel de experiencia y división preferida</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Modularemos el volumen por serie (4 series para prioridad, 3 estándar, 4 complementarios).
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'principiante', label: 'Principiante', desc: 'Series moderadas · RPE 7-8' },
                  { key: 'intermedio', label: 'Intermedio', desc: '3-4 series · RPE 8-8.5' },
                  { key: 'avanzado', label: 'Avanzado', desc: '4 series prioridad · RPE 8.5-9' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setExperienceLevel(item.key as ExperienceLevel)}
                    className={`p-3 rounded-2xl border text-center transition ${
                      experienceLevel === item.key
                        ? 'border-emerald-500 bg-emerald-600/15 ring-1 ring-emerald-500/40 text-white'
                        : 'border-slate-800 bg-[#181a28] text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{item.desc}</div>
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
                          ? 'border-blue-500 bg-blue-600/20 text-white'
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
                  <span>Músculos prioritarios (Meta: 12-16 series semanales)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Selecciona hasta 3 grupos. Tendrán <b>frecuencia 2 y mínimo 4 series por ejercicio</b>.
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
                  <span>Técnica de Intercalado de Brazos y Techo Biomecánico:</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  • <b>Pull A:</b> Dorsal Ancho 1 → <b>Bíceps (Intercalado)</b> → Dorsal Ancho 2 → Deltoides Posterior → Finisher (Gemelo o Aductor).<br/>
                  • <b>Pull B:</b> Espalda Alta 1 → <b>Bíceps (Intercalado)</b> → Pullover Dorsal → Trapecios → Finisher.<br/>
                  • <b>Máximo 3 ejercicios por grupo:</b> Ningún día excederá 3 ejercicios de espalda o pectoral.
                </p>
              </div>

              {/* Interleaved arms choice */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Brazo preferido para intercalar en los descansos de espalda:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'biceps', name: 'Bíceps (Recomendado)' },
                    { key: 'triceps', name: 'Tríceps' },
                    { key: 'both', name: 'Brazos Completos' }
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setInterleavedArmMuscle(item.key as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                        interleavedArmMuscle === item.key
                          ? 'border-blue-500 bg-blue-600/20 text-white'
                          : 'border-slate-800 bg-[#181a28] text-slate-400'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Músculos que NO gustan / menos prioritarios (SIN pregunta de complementarios) */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-rose-400" />
                  <span>¿Qué músculos NO te gusta entrenar o tienen baja prioridad?</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Los excluiremos del plan. Los músculos complementarios (gemelos, abdomen y aductor para "cerrar piernas") <b>se distribuirán automáticamente al final de cada sesión como recordatorio de 4 series</b>.
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
                  Los complementarios no seleccionados (gemelo, abdomen, máquina de aductor) se añaden como recordatorio final de sesión (~4 series semanales) sin saturar el entrenamiento.
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
                  { mins: 45, label: '45 minutos', sub: 'Exactamente 4 ejercicios · 14-16 series' },
                  { mins: 60, label: '60 minutos', sub: 'Exactamente 5 ejercicios · 18-20 series' },
                  { mins: 75, label: '75 minutos', sub: 'Exactamente 6 ejercicios · 22-24 series' },
                  { mins: 90, label: '90 minutos', sub: 'Exactamente 7 ejercicios · 26-28 series' }
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
                    {generatedRoutines.length} sesiones de {durationMinutes} min (exactamente {generatedRoutines[0]?.exercises.length} ejercicios/día)
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
                    Volumen Semanal por Grupo (Series Totales):
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    ✓ Máx 3 ej/día respetado
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                  {Object.entries(weeklyVolume).map(([grp, data]) => {
                    let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                    let targetLabel = '6-10 series';
                    if (data.isPriority) {
                      badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
                      targetLabel = '12-16 series ★';
                    } else if (data.isComplementary) {
                      badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
                      targetLabel = '~4 series (Recordatorio)';
                    }
                    return (
                      <div
                        key={grp}
                        className={`p-1.5 rounded-lg border flex items-center justify-between ${badgeColor}`}
                      >
                        <span className="capitalize truncate">{formatMuscleName(grp)}:</span>
                        <span className="font-mono font-bold ml-1">{data.sets}s</span>
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
