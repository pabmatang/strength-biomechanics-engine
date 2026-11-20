import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Sliders,
  RotateCcw,
  Copy,
  Check,
  ShieldAlert,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import {
  isSuperUserMode,
  getCurveOverride,
  saveCurveOverride,
  removeCurveOverride,
  exportOverridesAsTypeScript,
  CurveWeights
} from '../utils/superuserCurveStore';

export interface ResistanceCurveEditorProps {
  targetId: string;
  targetName?: string;
  initialWeights: CurveWeights;
  initialPeakZone?: 'stretched' | 'mid' | 'shortened' | 'uniform';
  initialLabel?: string;
  onWeightsChange?: (weights: CurveWeights, label?: string) => void;
  height?: number;
  readOnly?: boolean;
}

const PRESETS: { label: string; weights: CurveWeights; peak: 'stretched' | 'mid' | 'shortened' | 'uniform' }[] = [
  { label: 'Ascendente suavizado (Convergente)', weights: { stretch: 0.25, mid: 0.35, shortened: 0.40 }, peak: 'shortened' },
  { label: 'Ascendente puro · Pico Acortamiento', weights: { stretch: 0.15, mid: 0.35, shortened: 0.50 }, peak: 'shortened' },
  { label: 'Descendente puro · Pico Estiramiento', weights: { stretch: 0.55, mid: 0.30, shortened: 0.15 }, peak: 'stretched' },
  { label: 'Campana · Pico en Punto Medio', weights: { stretch: 0.25, mid: 0.50, shortened: 0.25 }, peak: 'mid' },
  { label: 'Uniforme · Tensión Constante', weights: { stretch: 0.334, mid: 0.333, shortened: 0.333 }, peak: 'uniform' }
];

export const ResistanceCurveEditor: React.FC<ResistanceCurveEditorProps> = ({
  targetId,
  targetName,
  initialWeights,
  initialPeakZone = 'uniform',
  initialLabel,
  onWeightsChange,
  height = 95,
  readOnly = false
}) => {
  const [isSuperUser, setIsSuperUser] = useState(() => isSuperUserMode());
  const [copied, setCopied] = useState(false);
  const [activeDraggingNode, setActiveDraggingNode] = useState<'stretch' | 'mid' | 'shortened' | null>(null);

  // Check if an override already exists in localStorage
  const existingOverride = getCurveOverride(targetId);
  const [weights, setWeights] = useState<CurveWeights>(() => existingOverride?.curveWeights || initialWeights);
  const [label, setLabel] = useState<string>(() => existingOverride?.curveLabel || initialLabel || '');
  const [hasOverride, setHasOverride] = useState(() => Boolean(existingOverride));

  const svgRef = useRef<SVGSVGElement>(null);

  // Sync state if targetId or initialWeights change
  useEffect(() => {
    const ov = getCurveOverride(targetId);
    if (ov) {
      setWeights(ov.curveWeights);
      setLabel(ov.curveLabel || initialLabel || '');
      setHasOverride(true);
    } else {
      setWeights(initialWeights);
      setLabel(initialLabel || '');
      setHasOverride(false);
    }
  }, [targetId, initialWeights, initialLabel]);

  // Listen to global superuser state changes (e.g. Ctrl + Shift + A)
  useEffect(() => {
    const handleSuperUserChange = (e: any) => {
      setIsSuperUser(isSuperUserMode());
      const ov = getCurveOverride(targetId);
      if (ov) {
        setWeights(ov.curveWeights);
        setHasOverride(true);
      }
    };
    window.addEventListener('mia_superuser_state_changed', handleSuperUserChange);
    return () => window.removeEventListener('mia_superuser_state_changed', handleSuperUserChange);
  }, [targetId]);

  // Notify parent of weights changes
  const applyNewWeights = (newW: CurveWeights, newLbl?: string) => {
    // Re-balance so sum is exactly 1.000
    const sum = newW.stretch + newW.mid + newW.shortened;
    const s = Math.round((newW.stretch / sum) * 1000) / 1000;
    const m = Math.round((newW.mid / sum) * 1000) / 1000;
    const sh = Math.round((1 - s - m) * 1000) / 1000;
    const balanced = { stretch: s, mid: m, shortened: sh };

    setWeights(balanced);
    if (newLbl !== undefined) setLabel(newLbl);

    if (isSuperUser && !readOnly) {
      saveCurveOverride(targetId, {
        name: targetName,
        curveWeights: balanced,
        curveLabel: newLbl ?? label
      });
      setHasOverride(true);
    }

    if (onWeightsChange) {
      onWeightsChange(balanced, newLbl ?? label);
    }
  };

  const handleResetToDefault = () => {
    removeCurveOverride(targetId);
    setWeights(initialWeights);
    setLabel(initialLabel || '');
    setHasOverride(false);
    if (onWeightsChange) {
      onWeightsChange(initialWeights, initialLabel);
    }
  };

  const handleCopyCode = async () => {
    const code = exportOverridesAsTypeScript();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn('Clipboard failed');
    }
  };

  // Adjust a single node while preserving total sum = 1.0
  const updateSingleNode = (node: 'stretch' | 'mid' | 'shortened', rawValue: number) => {
    const val = Math.min(0.80, Math.max(0.10, rawValue));
    const current = { ...weights };
    current[node] = val;

    // Remaining weight distributed proportionally to the other 2 nodes
    const remaining = 1.0 - val;
    const otherKeys = (['stretch', 'mid', 'shortened'] as const).filter(k => k !== node);
    const sumOthers = weights[otherKeys[0]] + weights[otherKeys[1]] || 0.001;

    current[otherKeys[0]] = Math.max(0.08, (weights[otherKeys[0]] / sumOthers) * remaining);
    current[otherKeys[1]] = Math.max(0.08, remaining - current[otherKeys[0]]);

    applyNewWeights(current);
  };

  // Drag interaction logic
  const handlePointerDown = (node: 'stretch' | 'mid' | 'shortened', e: React.PointerEvent) => {
    if (!isSuperUser || readOnly) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    setActiveDraggingNode(node);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDraggingNode || !svgRef.current || !isSuperUser || readOnly) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relY = (e.clientY - rect.top) / rect.height;
    // Map relY (0 at top, 1 at bottom) to weight (e.g. 0.10 to 0.75)
    // Top of SVG (relY=0.15) -> weight ~ 0.65; bottom (relY=0.85) -> weight ~ 0.10
    const clampedY = Math.min(0.85, Math.max(0.15, relY));
    const calculatedWeight = 0.10 + (1.0 - (clampedY - 0.15) / 0.70) * 0.55;
    updateSingleNode(activeDraggingNode, calculatedWeight);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDraggingNode) {
      try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
      setActiveDraggingNode(null);
    }
  };

  // SVG Geometry Calculation (viewBox 0 0 280 100)
  const svgW = 280;
  const svgH = 100;
  const padBottom = 78;
  const minTop = 16;
  const rangeY = padBottom - minTop;
  const maxW = Math.max(weights.stretch, weights.mid, weights.shortened, 0.40);

  const getY = (w: number) => {
    const ratio = Math.min(1.0, Math.max(0.0, w / maxW));
    return padBottom - ratio * rangeY;
  };

  const p1 = { x: 42, y: getY(weights.stretch) };
  const p2 = { x: 140, y: getY(weights.mid) };
  const p3 = { x: 238, y: getY(weights.shortened) };

  const curvePath = `M ${p1.x} ${p1.y} C ${(p1.x + p2.x) / 2} ${p1.y}, ${(p1.x + p2.x) / 2} ${p2.y}, ${p2.x} ${p2.y} C ${(p2.x + p3.x) / 2} ${p2.y}, ${(p2.x + p3.x) / 2} ${p3.y}, ${p3.x} ${p3.y}`;
  const areaPath = `${curvePath} L ${p3.x} ${padBottom + 6} L ${p1.x} ${padBottom + 6} Z`;

  return (
    <div className="space-y-2 select-none">
      {/* Top Header / Status */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-cyan-400 flex items-center gap-1 text-[11px]">
            <Activity className="w-3.5 h-3.5" />
            <span>Curva de Resistencia</span>
          </span>
          {hasOverride && (
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Personalizada
            </span>
          )}
          {isSuperUser && (
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-500/25 text-purple-300 border border-purple-500/40 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
              <span>Admin Curvas</span>
            </span>
          )}
        </div>

        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
          {Math.round(weights.stretch * 100)}% · {Math.round(weights.mid * 100)}% · {Math.round(weights.shortened * 100)}%
        </span>
      </div>

      {/* Interactive SVG Canvas */}
      <div
        className={`w-full rounded-xl bg-slate-950/80 border relative flex items-center justify-center overflow-hidden transition ${
          isSuperUser && !readOnly ? 'border-cyan-500/60 shadow-lg shadow-cyan-950/30' : 'border-slate-800'
        }`}
        style={{ height: `${height}px` }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-full"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <defs>
            <linearGradient id={`curveGrad_${targetId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Reference Grid lines */}
          <line x1="20" y1={padBottom + 6} x2="260" y2={padBottom + 6} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="20" y1={(minTop + padBottom) / 2} x2="260" y2={(minTop + padBottom) / 2} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#curveGrad_${targetId})`} />

          {/* Curve Stroke */}
          <path d={curvePath} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />

          {/* 3 Physical Interactive Nodes */}
          {/* Node 1: Stretch */}
          <g
            className={isSuperUser && !readOnly ? 'cursor-ns-resize group' : ''}
            onPointerDown={(e) => handlePointerDown('stretch', e)}
          >
            <circle cx={p1.x} cy={p1.y} r={isSuperUser ? 6.5 : 4.5} fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" className="transition-transform group-hover:scale-125" />
            {isSuperUser && <circle cx={p1.x} cy={p1.y} r={14} fill="transparent" />}
          </g>

          {/* Node 2: Mid */}
          <g
            className={isSuperUser && !readOnly ? 'cursor-ns-resize group' : ''}
            onPointerDown={(e) => handlePointerDown('mid', e)}
          >
            <circle cx={p2.x} cy={p2.y} r={isSuperUser ? 6.5 : 4.5} fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" className="transition-transform group-hover:scale-125" />
            {isSuperUser && <circle cx={p2.x} cy={p2.y} r={14} fill="transparent" />}
          </g>

          {/* Node 3: Shortened */}
          <g
            className={isSuperUser && !readOnly ? 'cursor-ns-resize group' : ''}
            onPointerDown={(e) => handlePointerDown('shortened', e)}
          >
            <circle cx={p3.x} cy={p3.y} r={isSuperUser ? 6.5 : 4.5} fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" className="transition-transform group-hover:scale-125" />
            {isSuperUser && <circle cx={p3.x} cy={p3.y} r={14} fill="transparent" />}
          </g>

          {/* Text Labels */}
          <text x={p1.x} y={svgH - 3} fill="#94a3b8" fontSize="8.5" textAnchor="middle" fontWeight="bold">
            Estiramiento
          </text>
          <text x={p2.x} y={svgH - 3} fill="#94a3b8" fontSize="8.5" textAnchor="middle" fontWeight="bold">
            Punto Medio
          </text>
          <text x={p3.x} y={svgH - 3} fill="#94a3b8" fontSize="8.5" textAnchor="middle" fontWeight="bold">
            Acortamiento
          </text>
        </svg>

        {isSuperUser && !readOnly && !activeDraggingNode && (
          <div className="absolute top-1.5 right-2 text-[9px] text-cyan-400/80 bg-slate-900/80 px-1.5 py-0.5 rounded border border-cyan-500/30 pointer-events-none">
            Arrastra los nodos verticalmente
          </div>
        )}
      </div>

      {/* Superuser Fine Numerical Controls & Presets */}
      {isSuperUser && !readOnly && (
        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-purple-500/30 space-y-2">
          {/* 3 Numerical Micro-inputs */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5 font-bold">Estiramiento (%)</label>
              <input
                type="number"
                min="10"
                max="80"
                step="1"
                value={Math.round(weights.stretch * 100)}
                onChange={(e) => updateSingleNode('stretch', Number(e.target.value) / 100)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5 font-bold">Punto Medio (%)</label>
              <input
                type="number"
                min="10"
                max="80"
                step="1"
                value={Math.round(weights.mid * 100)}
                onChange={(e) => updateSingleNode('mid', Number(e.target.value) / 100)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5 font-bold">Acortamiento (%)</label>
              <input
                type="number"
                min="10"
                max="80"
                step="1"
                value={Math.round(weights.shortened * 100)}
                onChange={(e) => updateSingleNode('shortened', Number(e.target.value) / 100)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Quick Presets Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] no-scrollbar">
            {PRESETS.map((pr) => (
              <button
                key={pr.label}
                type="button"
                onClick={() => applyNewWeights(pr.weights, pr.label)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 whitespace-nowrap transition shrink-0"
              >
                {pr.label.split('·')[0]}
              </button>
            ))}
          </div>

          {/* Action Row: Revert Default & Copy TS Code */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
            {hasOverride ? (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar defecto</span>
              </button>
            ) : (
              <span className="text-slate-500">Valores de fábrica</span>
            )}

            <button
              type="button"
              onClick={handleCopyCode}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              title="Copiar todas las curvas modificadas al portapapeles"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copiado al portapapeles' : 'Copiar overrides (TS)'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
