import React, { useState, useMemo } from 'react';
import {
  X,
  Dumbbell,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { BiomechanicsAnalysisResponse } from '../services/modalBiomechanicsClient';

interface EffectiveVolumeAuditProps {
  isOpen: boolean;
  onClose: () => void;
  currentAnalysis?: BiomechanicsAnalysisResponse | null;
  exerciseId?: string;
  weightKg?: number;
  targetReps?: number;
}

interface MuscleVolumeEntry {
  id: string;
  name: string;
  grossSets: number;
  effectiveSets: number;
  efficiencyPct: number;
  primaryExercises: string[];
  alert?: string;
  status: 'optimal' | 'warning' | 'alert';
}

export const EffectiveVolumeAudit: React.FC<EffectiveVolumeAuditProps> = ({
  isOpen,
  onClose,
  currentAnalysis,
  exerciseId = 'chest_press',
  weightKg = 0,
  targetReps = 0
}) => {
  // Configurable sets per exercise for live interactive auditing
  const [programmedSets, setProgrammedSets] = useState<number>(4);

  // Extract torque split and RIR from current analysis if available
  const { currentTorqueSplit, rirFactor, exactRir } = useMemo(() => {
    if (!currentAnalysis) {
      return {
        currentTorqueSplit: { primary: 0.65, secondary: 0.35 },
        rirFactor: 1.0,
        exactRir: 1.5
      };
    }

    const metrics = currentAnalysis.intensity_metrics;
    const rirVal = typeof metrics?.exact_rir === 'number'
      ? metrics.exact_rir
      : (metrics?.estimated_rir ? parseFloat(metrics.estimated_rir.replace(/[^\d.]/g, '')) || 2.0 : 2.0);

    // RIR Intensity Factor:
    // <= 2 -> 1.0 (Máxima estimulación de unidades motoras de alto umbral)
    // 3 - 4 -> 0.75 (Estimulación moderada)
    // > 4 -> 0.40 (Submáximo / Baja tensión mecánica)
    let factor = 1.0;
    if (rirVal <= 2.0) factor = 1.0;
    else if (rirVal <= 4.0) factor = 0.75;
    else factor = 0.40;

    // Determine torque split from last repetition verdict or frame
    let primaryRatio = 0.65;
    let secondaryRatio = 0.35;

    const repSummary = currentAnalysis.repetitions_summary;
    if (repSummary && repSummary.length > 0) {
      const lastVerdict = repSummary[repSummary.length - 1].verdict;
      const dHip = lastVerdict.d_hip_norm || 0;
      const dKnee = lastVerdict.d_knee_norm || 0;
      const dSh = lastVerdict.d_shoulder_norm || 0;
      const total = dHip + dKnee + dSh;
      if (total > 0.01) {
        primaryRatio = Math.max(0.2, Math.min(0.95, (dSh || dHip) / total));
        secondaryRatio = 1.0 - primaryRatio;
      }
    }

    return {
      currentTorqueSplit: { primary: primaryRatio, secondary: secondaryRatio },
      rirFactor: factor,
      exactRir: rirVal
    };
  }, [currentAnalysis]);

  // Biomechanical audit data across 9 muscle groups
  const muscleAuditList: MuscleVolumeEntry[] = useMemo(() => {
    const isChest = exerciseId.includes('bench') || exerciseId.includes('press') || exerciseId.includes('dips') || exerciseId.includes('fly');
    const isBack = exerciseId.includes('row') || exerciseId.includes('pull') || exerciseId.includes('t_bar') || exerciseId.includes('gironda');
    const isGlutes = exerciseId.includes('hip_thrust') || exerciseId.includes('thrust') || exerciseId.includes('glute');
    const isQuads = exerciseId.includes('squat') || exerciseId.includes('leg_press') || exerciseId.includes('bulgarian');

    // Base mock workout plan (representing a standard weekly or session distribution)
    // Dynamic overlay for current exercise analyzed
    const pecGross = isChest ? programmedSets : 4;
    const pecShare = isChest ? currentTorqueSplit.primary : 0.62;
    const pecEff = Number((pecGross * pecShare * rirFactor).toFixed(2));

    const triGross = isChest ? programmedSets : 3;
    const triShare = isChest ? currentTorqueSplit.secondary : 0.38;
    const triEff = Number((triGross * triShare * rirFactor).toFixed(2));

    const dorsGross = isBack ? programmedSets : 5;
    const dorsShare = isBack ? currentTorqueSplit.primary : 0.55;
    const dorsEff = Number((dorsGross * dorsShare * rirFactor).toFixed(2));

    const espAltaGross = isBack ? programmedSets : 4;
    const espAltaShare = isBack ? currentTorqueSplit.secondary : 0.45;
    const espAltaEff = Number((espAltaGross * espAltaShare * rirFactor).toFixed(2));

    const bicGross = isBack ? programmedSets : 3;
    const bicShare = isBack ? 0.30 : 0.25;
    const bicEff = Number((bicGross * bicShare * rirFactor).toFixed(2));

    const deltGross = isChest ? programmedSets : 4;
    const deltShare = isChest ? 0.25 : 0.40;
    const deltEff = Number((deltGross * deltShare * rirFactor).toFixed(2));

    const glutGross = isGlutes ? programmedSets : 5;
    const glutShare = isGlutes ? currentTorqueSplit.primary : 0.85;
    const glutEff = Number((glutGross * glutShare * rirFactor).toFixed(2));

    const quadGross = isQuads ? programmedSets : 6;
    const quadShare = isQuads ? 0.70 : 0.20;
    const quadEff = Number((quadGross * quadShare * rirFactor).toFixed(2));

    const isqGross = isGlutes ? programmedSets : 4;
    const isqShare = isGlutes ? currentTorqueSplit.secondary : 0.50;
    const isqEff = Number((isqGross * isqShare * rirFactor).toFixed(2));

    const list: MuscleVolumeEntry[] = [
      {
        id: 'pectoral',
        name: 'Pectoral Mayor',
        grossSets: pecGross,
        effectiveSets: pecEff,
        efficiencyPct: Math.round((pecEff / Math.max(1, pecGross)) * 100),
        primaryExercises: ['Press Banca', 'Press Inclinado', 'Fondos'],
        status: pecEff >= pecGross * 0.7 ? 'optimal' : pecEff >= pecGross * 0.5 ? 'warning' : 'alert',
        alert: pecEff < pecGross * 0.65 ? 'Tu tríceps y deltoides están absorbiendo más del 35% del momento de fuerza.' : undefined
      },
      {
        id: 'dorsal',
        name: 'Dorsal Ancho',
        grossSets: dorsGross,
        effectiveSets: dorsEff,
        efficiencyPct: Math.round((dorsEff / Math.max(1, dorsGross)) * 100),
        primaryExercises: ['Jalón al Pecho', 'Remo con Apoyo', 'Pullover'],
        status: dorsEff >= dorsGross * 0.7 ? 'optimal' : 'warning',
        alert: undefined
      },
      {
        id: 'espalda_alta',
        name: 'Espalda Alta (Romboides / Trapecio)',
        grossSets: espAltaGross,
        effectiveSets: espAltaEff,
        efficiencyPct: Math.round((espAltaEff / Math.max(1, espAltaGross)) * 100),
        primaryExercises: ['Remo en T', 'Remo Gironda con Agarre Ancho'],
        status: 'optimal'
      },
      {
        id: 'gluteo',
        name: 'Glúteo Mayor',
        grossSets: glutGross,
        effectiveSets: glutEff,
        efficiencyPct: Math.round((glutEff / Math.max(1, glutGross)) * 100),
        primaryExercises: ['Hip Thrust', 'Sentadilla Búlgara', 'RDL'],
        status: 'optimal'
      },
      {
        id: 'cuadriceps',
        name: 'Cuádriceps',
        grossSets: quadGross,
        effectiveSets: quadEff,
        efficiencyPct: Math.round((quadEff / Math.max(1, quadGross)) * 100),
        primaryExercises: ['Sentadilla Hack', 'Prensa', 'Extensiones'],
        status: 'optimal'
      },
      {
        id: 'isquios',
        name: 'Isquiosurales',
        grossSets: isqGross,
        effectiveSets: isqEff,
        efficiencyPct: Math.round((isqEff / Math.max(1, isqGross)) * 100),
        primaryExercises: ['Curl Femoral Sentado', 'Peso Muerto Rumano'],
        status: 'optimal'
      },
      {
        id: 'deltoides',
        name: 'Deltoides (Anterior / Lateral)',
        grossSets: deltGross,
        effectiveSets: deltEff,
        efficiencyPct: Math.round((deltEff / Math.max(1, deltGross)) * 100),
        primaryExercises: ['Press Militar', 'Press Inclinado', 'Elevaciones'],
        status: 'optimal'
      },
      {
        id: 'triceps',
        name: 'Tríceps Braquial',
        grossSets: triGross,
        effectiveSets: triEff,
        efficiencyPct: Math.round((triEff / Math.max(1, triGross)) * 100),
        primaryExercises: ['Extensiones en Polea', 'Press Cerrado', 'Fondos'],
        status: triEff > triGross * 0.9 ? 'alert' : 'optimal',
        alert: triEff > triGross * 0.9 ? 'Volumen acumulado alto: absorbe fatiga excesiva de los empujes de pectoral.' : undefined
      },
      {
        id: 'biceps',
        name: 'Bíceps Braquial',
        grossSets: bicGross,
        effectiveSets: bicEff,
        efficiencyPct: Math.round((bicEff / Math.max(1, bicGross)) * 100),
        primaryExercises: ['Curl en Banco Scott', 'Remos Supinos'],
        status: 'optimal'
      }
    ];

    return list;
  }, [programmedSets, currentTorqueSplit, rirFactor, exerciseId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Auditoría de Volumen Efectivo Real por Músculo
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-mono">
                  BIOMECHANIC AUDIT
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ponderación científica por reparto articular de torque y cercanía al fallo (RIR)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Configuration Bar */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Series programadas evaluadas:</span>
            <div className="flex items-center space-x-1.5">
              {[2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setProgrammedSets(num)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-medium transition ${
                    programmedSets === num
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {num} series
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
            <span>RIR Medido: <strong className="text-cyan-400">{exactRir}</strong></span>
            <span>·</span>
            <span>Factor Intensidad: <strong className="text-emerald-400">{(rirFactor * 100).toFixed(0)}%</strong></span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Scientific Formula Card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-slate-300 text-[11px] leading-relaxed">
                <span className="font-semibold text-slate-100">Fórmula de Estímulo Real:</span>{' '}
                <code className="text-cyan-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">
                  Series Efectivas = Series Brutas × Reparto de Palanca × Factor RIR
                </code>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-mono shrink-0">
              RIR ≤ 2: 100% · RIR 3-4: 75% · RIR &gt; 4: 40%
            </div>
          </div>

          {/* Muscle Breakdown Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Reparto Biomecánico por Grupo Muscular
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {muscleAuditList.map((entry) => (
                <div
                  key={entry.id}
                  className={`border rounded-xl p-3.5 space-y-2.5 transition ${
                    entry.alert
                      ? 'bg-amber-950/20 border-amber-800/50'
                      : 'bg-slate-900/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{entry.name}</h4>
                      <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                        {entry.primaryExercises.join(', ')}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-1.5 font-mono text-xs">
                        <span className="text-emerald-400 font-bold">{entry.effectiveSets}</span>
                        <span className="text-slate-500 font-normal">/ {entry.grossSets} series</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {entry.efficiencyPct}% efectividad
                      </span>
                    </div>
                  </div>

                  {/* Comparative Progress Bar */}
                  <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    {/* Gross Bar (Background Full Width Reference) */}
                    <div className="absolute inset-0 bg-slate-700/40 rounded-full" />
                    {/* Effective Bar */}
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        entry.alert
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                          : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, (entry.effectiveSets / entry.grossSets) * 100)}%` }}
                    />
                  </div>

                  {/* Alert if muscle is compromised */}
                  {entry.alert && (
                    <div className="flex items-start space-x-1.5 pt-1 text-[11px] text-amber-300/90 leading-tight">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                      <span>{entry.alert}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Insights */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Diagnóstico de Compensación y Fatiga Sistémica
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              En ejercicios compuestos, el reparto articular de torque determina qué músculo recibe la tensión mecánica real.
              Si el tríceps braquial absorbe más del 35% del momento flexor en press de banca o fondos, el pectoral mayor
              recibe un estímulo incompleto. Ajustar la anchura del agarre, ángulo de codo o inclinación del banco permite redirigir
              las series hacia el músculo diana sin necesidad de añadir volumen basura fatigante.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Zero-Storage: Ponderado matemáticamente según la cinemática de la serie</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
export default EffectiveVolumeAudit;
