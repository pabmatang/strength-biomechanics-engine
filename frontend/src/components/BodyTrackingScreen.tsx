import React, { useState } from 'react';
import { Scale, Ruler, Plus, Calendar, TrendingUp, TrendingDown, Trash2, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { BodyWeightEntry, BodyTapeMeasurement } from '../types/workout';

interface BodyTrackingScreenProps {
  weights: BodyWeightEntry[];
  measurements: BodyTapeMeasurement[];
  onAddWeight: (entry: BodyWeightEntry) => void;
  onDeleteWeight: (id: string) => void;
  onAddMeasurement: (entry: BodyTapeMeasurement) => void;
  onDeleteMeasurement: (id: string) => void;
}

const TAPE_PARTS = [
  { key: 'chest_cm' as const, label: 'Pecho / Torso' },
  { key: 'waist_cm' as const, label: 'Cintura (Ombligo)' },
  { key: 'left_arm_cm' as const, label: 'Brazo Izquierdo (Bíceps)' },
  { key: 'right_arm_cm' as const, label: 'Brazo Derecho (Bíceps)' },
  { key: 'left_thigh_cm' as const, label: 'Cuádriceps Izquierdo' },
  { key: 'right_thigh_cm' as const, label: 'Cuádriceps Derecho' },
  { key: 'calves_cm' as const, label: 'Gemelos' },
  { key: 'hips_cm' as const, label: 'Cadera / Glúteo' }
];

// High-fidelity SVG Line Chart Component
interface SvgLineChartProps {
  data: { date: string; value: number }[];
  unit: string;
  lineColor: string;
  fillColorStart: string;
  title: string;
}

const SvgLineChart: React.FC<SvgLineChartProps> = ({ data, unit, lineColor, fillColorStart, title }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; value: number } | null>(null);

  if (data.length < 2) {
    return (
      <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
        Añade al menos 2 registros para generar la curva de evolución gráfica.
      </div>
    );
  }

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = (maxVal - minVal) || 1;

  // Chart coordinate space
  const width = 600;
  const height = 180;
  const paddingX = 45;
  const paddingY = 25;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - 2 * paddingX);
    const normalizedY = (d.value - minVal) / range;
    const y = height - paddingY - normalizedY * (height - 2 * paddingY);
    return { x, y, date: d.date, value: d.value };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs px-1">
        <span className="font-bold text-slate-300">{title}</span>
        <span className="font-mono text-slate-400">
          Mín: <b className="text-white">{minVal}{unit}</b> · Máx: <b className="text-emerald-400">{maxVal}{unit}</b>
        </span>
      </div>

      <div className="relative bg-[#181a28] border border-slate-800 rounded-2xl p-3 overflow-hidden">
        {hoveredPoint && (
          <div className="absolute top-3 right-4 px-2.5 py-1 rounded-lg bg-blue-600/90 text-white font-mono text-xs font-bold shadow-lg">
            {hoveredPoint.date}: {hoveredPoint.value} {unit}
          </div>
        )}

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColorStart} stopOpacity="0.35" />
              <stop offset="100%" stopColor={fillColorStart} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#2e334d" strokeDasharray="4 4" strokeWidth="1" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#2e334d" strokeDasharray="4 4" strokeWidth="1" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#2e334d" strokeWidth="1" />

          {/* Value Guide Labels */}
          <text x={paddingX - 10} y={paddingY + 4} fill="#818aa8" fontSize="10" textAnchor="end" fontFamily="monospace">
            {maxVal}
          </text>
          <text x={paddingX - 10} y={height / 2 + 4} fill="#818aa8" fontSize="10" textAnchor="end" fontFamily="monospace">
            {((maxVal + minVal) / 2).toFixed(1)}
          </text>
          <text x={paddingX - 10} y={height - paddingY + 4} fill="#818aa8" fontSize="10" textAnchor="end" fontFamily="monospace">
            {minVal}
          </text>

          {/* Area Fill */}
          <path d={areaD} fill={`url(#grad-${title})`} />

          {/* Line Path */}
          <path d={pathD} fill="none" stroke={lineColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((pt, i) => (
            <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredPoint(pt)} onMouseLeave={() => setHoveredPoint(null)}>
              <circle cx={pt.x} cy={pt.y} r="5" fill="#12141e" stroke={lineColor} strokeWidth="2.5" />
              <circle cx={pt.x} cy={pt.y} r="8" fill="transparent" />
            </g>
          ))}
        </svg>

        {/* Date labels under the chart */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-2 px-6">
          <span>{data[0]?.date}</span>
          {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.date}</span>}
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
};

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

export const BodyTrackingScreen: React.FC<BodyTrackingScreenProps> = ({
  weights,
  measurements,
  onAddWeight,
  onDeleteWeight,
  onAddMeasurement,
  onDeleteMeasurement
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'weight' | 'tape'>('weight');

  // Form states for Weight
  const [newWeight, setNewWeight] = useState<string>('');
  const [weightDate, setWeightDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weightNotes, setWeightNotes] = useState<string>('');

  // Selected muscle for tape measurement graph
  const [selectedMuscleGraph, setSelectedMuscleGraph] = useState<string>('left_arm_cm');

  // Form states for Tape Measurements
  const [measurementDate, setMeasurementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [chest, setChest] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [hips, setHips] = useState<string>('');
  const [leftArm, setLeftArm] = useState<string>('');
  const [rightArm, setRightArm] = useState<string>('');
  const [leftThigh, setLeftThigh] = useState<string>('');
  const [rightThigh, setRightThigh] = useState<string>('');
  const [calves, setCalves] = useState<string>('');

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newWeight);
    if (isNaN(val) || val <= 0) return;

    onAddWeight({
      id: `weight_${Date.now()}`,
      date: weightDate,
      weight_kg: Math.round(val * 10) / 10,
      notes: weightNotes.trim() || undefined
    });

    setNewWeight('');
    setWeightNotes('');
  };

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMeasurement({
      id: `tape_${Date.now()}`,
      date: measurementDate,
      chest_cm: chest ? parseFloat(chest) : undefined,
      waist_cm: waist ? parseFloat(waist) : undefined,
      hips_cm: hips ? parseFloat(hips) : undefined,
      left_arm_cm: leftArm ? parseFloat(leftArm) : undefined,
      right_arm_cm: rightArm ? parseFloat(rightArm) : undefined,
      left_thigh_cm: leftThigh ? parseFloat(leftThigh) : undefined,
      right_thigh_cm: rightThigh ? parseFloat(rightThigh) : undefined,
      calves_cm: calves ? parseFloat(calves) : undefined
    });

    setChest('');
    setWaist('');
    setHips('');
    setLeftArm('');
    setRightArm('');
    setLeftThigh('');
    setRightThigh('');
    setCalves('');
  };

  // Sorted data
  const sortedWeightsAsc = [...weights].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedWeightsDesc = [...weights].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentWeight = sortedWeightsDesc[0]?.weight_kg;
  const previousWeight = sortedWeightsDesc[1]?.weight_kg;
  const weightDelta = currentWeight && previousWeight ? Math.round((currentWeight - previousWeight) * 10) / 10 : null;

  const sortedMeasurementsAsc = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedMeasurementsDesc = [...measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const latestTape = sortedMeasurementsDesc[0];
  const oldestTape = sortedMeasurementsDesc[sortedMeasurementsDesc.length - 1];

  const getGrowthDelta = (key: keyof BodyTapeMeasurement) => {
    if (!latestTape || !oldestTape || sortedMeasurementsDesc.length < 2) return null;
    const latestVal = latestTape[key] as number | undefined;
    const oldestVal = oldestTape[key] as number | undefined;
    if (typeof latestVal !== 'number' || typeof oldestVal !== 'number') return null;
    return Math.round((latestVal - oldestVal) * 10) / 10;
  };

  // Prepare data for Weight Line Chart
  const weightChartData = sortedWeightsAsc.map(w => ({
    date: new Date(w.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    value: w.weight_kg
  }));

  // Prepare data for Muscle Tape Line Chart
  const tapeChartData = sortedMeasurementsAsc
    .filter(m => typeof m[selectedMuscleGraph as keyof BodyTapeMeasurement] === 'number')
    .map(m => ({
      date: new Date(m.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      value: Number(m[selectedMuscleGraph as keyof BodyTapeMeasurement])
    }));

  const activeMuscleLabel = TAPE_PARTS.find(p => p.key === selectedMuscleGraph)?.label || 'Músculo';

  return (
    <div className="space-y-6">
      
      {/* Subtab Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white">Medidas Corporales & Antropometría</h2>
          <p className="text-xs text-slate-400">Gráficas precisas de evolución de peso y contornos musculares con cinta métrica</p>
        </div>

        <div className="flex p-1 bg-[#12141e] border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveSubTab('weight')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'weight'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Peso Corporal</span>
          </button>
          <button
            onClick={() => setActiveSubTab('tape')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'tape'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Cinta Métrica</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PESO CORPORAL (WEIGHT TRACKING)                              */}
      {/* ============================================================ */}
      {activeSubTab === 'weight' && (
        <div className="space-y-5">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#12141e] border border-slate-800 rounded-2xl p-4 text-center shadow-lg">
              <div className="text-xs text-slate-400 font-semibold uppercase">Peso Actual</div>
              <div className="text-2xl font-black font-mono text-white mt-1">
                {currentWeight ? `${currentWeight} kg` : '—'}
              </div>
            </div>

            <div className="bg-[#12141e] border border-slate-800 rounded-2xl p-4 text-center shadow-lg">
              <div className="text-xs text-slate-400 font-semibold uppercase">Último Cambio</div>
              <div className={`text-2xl font-black font-mono mt-1 flex items-center justify-center gap-0.5 ${
                weightDelta === null ? 'text-slate-500' :
                weightDelta > 0 ? 'text-emerald-400' : weightDelta < 0 ? 'text-blue-400' : 'text-slate-300'
              }`}>
                {weightDelta !== null ? (
                  <>
                    {weightDelta > 0 ? '+' : ''}{weightDelta} <span className="text-xs font-normal">kg</span>
                  </>
                ) : '—'}
              </div>
            </div>

            <div className="bg-[#12141e] border border-slate-800 rounded-2xl p-4 text-center shadow-lg">
              <div className="text-xs text-slate-400 font-semibold uppercase">Pesajes Registrados</div>
              <div className="text-2xl font-black font-mono text-purple-400 mt-1">
                {weights.length}
              </div>
            </div>
          </div>

          {/* Quick Add Weight Form */}
          <form onSubmit={handleSaveWeight} className="bg-[#12141e] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Registrar Pesaje de Hoy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_120px] gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="Ej. 78.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="bg-[#181a28] border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-bold font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
              <input
                type="date"
                value={weightDate}
                onChange={(e) => setWeightDate(e.target.value)}
                className="bg-[#181a28] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5"
              >
                <span>Añadir</span>
              </button>
            </div>
          </form>

          {/* High-Fidelity Weight Evolution SVG Chart */}
          <div className="bg-[#12141e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <SvgLineChart
              data={weightChartData}
              unit=" kg"
              lineColor="#3b82f6"
              fillColorStart="#3b82f6"
              title="Curva Continua de Peso Corporal"
            />
          </div>

          {/* Weigh-in Log Table */}
          <div className="bg-[#12141e] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Historial de Pesajes</div>
            <div className="space-y-1.5 divide-y divide-slate-800/40 max-h-60 overflow-y-auto">
              {sortedWeightsDesc.map(w => (
                <div key={w.id} className="pt-1.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums text-zinc-400 text-[11px] font-medium">{formatDisplayDate(w.date)}</span>
                    <span className="tabular-nums font-bold text-white text-sm">{w.weight_kg} kg</span>
                  </div>
                  <button
                    onClick={() => onDeleteWeight(w.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Eliminar pesaje"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CINTA MÉTRICA (TAPE MEASUREMENTS & MUSCLE GRAPHS)             */}
      {/* ============================================================ */}
      {activeSubTab === 'tape' && (
        <div className="space-y-5">
          {/* Muscle Growth Delta Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Pecho / Torso', key: 'chest_cm' as const },
              { label: 'Cintura', key: 'waist_cm' as const },
              { label: 'Brazo Izquierdo', key: 'left_arm_cm' as const },
              { label: 'Cuádriceps', key: 'left_thigh_cm' as const }
            ].map(({ label, key }) => {
              const currentVal = latestTape?.[key];
              const growth = getGrowthDelta(key);
              return (
                <div key={key} className="bg-[#12141e] border border-slate-800 rounded-2xl p-3.5 text-center shadow-lg">
                  <div className="text-[11px] text-slate-400 font-semibold">{label}</div>
                  <div className="text-xl font-black font-mono text-white mt-0.5">
                    {currentVal ? `${currentVal} cm` : '—'}
                  </div>
                  {growth !== null && (
                    <div className={`text-[10px] font-bold font-mono mt-0.5 ${
                      growth > 0 ? 'text-emerald-400' : growth < 0 ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      {growth > 0 ? `+${growth}` : growth} cm total
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Muscle Circumference Evolution Graph with Selector */}
          <div className="bg-[#12141e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Gráfica de Crecimiento Muscular por Articulación</span>
              </div>

              {/* Selector of which muscle circumference to graph */}
              <select
                value={selectedMuscleGraph}
                onChange={(e) => setSelectedMuscleGraph(e.target.value)}
                className="bg-[#181a28] border border-slate-700 text-xs font-bold text-emerald-400 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                {TAPE_PARTS.map(p => (
                  <option key={p.key} value={p.key} className="bg-[#12141e] text-white">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <SvgLineChart
              data={tapeChartData}
              unit=" cm"
              lineColor="#10b981"
              fillColorStart="#10b981"
              title={`Evolución de: ${activeMuscleLabel}`}
            />
          </div>

          {/* Form to log measurements with tape */}
          <form onSubmit={handleSaveMeasurement} className="bg-[#12141e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Ruler className="w-4 h-4" />
                <span>Nueva Medición con Cinta Métrica</span>
              </div>
              <input
                type="date"
                value={measurementDate}
                onChange={(e) => setMeasurementDate(e.target.value)}
                className="bg-[#181a28] border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Pecho (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="ej. 104"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                  className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Cintura (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="ej. 82"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Cadera (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="ej. 98"
                  value={hips}
                  onChange={(e) => setHips(e.target.value)}
                  className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Brazo Izq (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="ej. 38"
                  value={leftArm}
                  onChange={(e) => setLeftArm(e.target.value)}
                  className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Brazo Der (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="ej. 38.5"
                  value={rightArm}
                  onChange={(e) => setRightArm(e.target.value)}
                  className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Cuádriceps Izq (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="ej. 58"
                  value={leftThigh}
                  onChange={(e) => setLeftThigh(e.target.value)}
                  className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Cuádriceps Der (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="ej. 58.5"
                  value={rightThigh}
                  onChange={(e) => setRightThigh(e.target.value)}
                  className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Gemelos (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="ej. 39"
                  value={calves}
                  onChange={(e) => setCalves(e.target.value)}
                  className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Mediciones Antropométricas</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
