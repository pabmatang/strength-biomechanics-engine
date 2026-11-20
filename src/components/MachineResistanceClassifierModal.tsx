import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Check,
  Loader2,
  Info,
  ShieldCheck,
  Sliders,
  Save,
  Activity,
  Layers,
  Compass
} from 'lucide-react';
import {
  type MachineResistanceProfile,
  type MachineLoadType,
  type LeverPivotBehavior,
  type MachinePathType,
  type PeakResistanceZone,
  classifyMachineResistanceProfile
} from '../utils/machinePhysicsEngine';
import { classifyMachinePhoto } from '../services/modalBiomechanicsClient';

interface MachineResistanceClassifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseTitle?: string;
  initialProfile?: Partial<MachineResistanceProfile>;
  onSaveProfile?: (profile: MachineResistanceProfile) => void;
}

export const MachineResistanceClassifierModal: React.FC<MachineResistanceClassifierModalProps> = ({
  isOpen,
  onClose,
  exerciseTitle = '',
  initialProfile,
  onSaveProfile
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Editable Profile State
  const [loadType, setLoadType] = useState<MachineLoadType>(initialProfile?.loadType || 'plate_loaded');
  const [pivotBehavior, setPivotBehavior] = useState<LeverPivotBehavior>(
    initialProfile?.pivotBehavior || 'approaches_vertical_loss'
  );
  const [pathType, setPathType] = useState<MachinePathType>(initialProfile?.pathType || 'converging_arc');
  const [peakZone, setPeakZone] = useState<PeakResistanceZone>(initialProfile?.peakZone || 'stretched');
  const [brandName, setBrandName] = useState<string>(initialProfile?.machineBrandGuess || '');
  const [modelName, setModelName] = useState<string>(initialProfile?.machineModelGuess || '');
  const [customDescription, setCustomDescription] = useState<string>(
    initialProfile?.resistanceCurveDescription || ''
  );
  const [customWeights, setCustomWeights] = useState(
    initialProfile?.curveWeights || { stretch: 0.55, mid: 0.30, shortened: 0.15 }
  );

  if (!isOpen) return null;

  // Handle Photo File Selection & AI classification
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await classifyMachinePhoto(file, exerciseTitle);
      if (result) {
        if (result.loadType) setLoadType(result.loadType);
        if (result.pivotBehavior) setPivotBehavior(result.pivotBehavior);
        if (result.pathType) setPathType(result.pathType);
        if (result.peakZone) setPeakZone(result.peakZone);
        if (result.machineBrandGuess) setBrandName(result.machineBrandGuess);
        if (result.machineModelGuess) setModelName(result.machineModelGuess);
        if (result.resistanceCurveDescription) setCustomDescription(result.resistanceCurveDescription);
        if (result.curveWeights) setCustomWeights(result.curveWeights);
      }
    } catch (err: any) {
      console.warn('[Classifier] Error al analizar foto con IA:', err);
      setAnalysisError('No se pudo conectar con el clasificador IA. Puedes ajustar las opciones manualmente abajo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Recompute curve when chips are toggled manually
  const handleChipChange = (
    newLoad?: MachineLoadType,
    newPivot?: LeverPivotBehavior,
    newPath?: MachinePathType,
    newZone?: PeakResistanceZone
  ) => {
    const activeLoad = newLoad ?? loadType;
    const activePivot = newPivot ?? pivotBehavior;
    const activePath = newPath ?? pathType;

    const synthesized = classifyMachineResistanceProfile({
      loadType: activeLoad,
      pivotBehavior: activePivot,
      pathType: activePath,
      machineBrandGuess: brandName,
      machineModelGuess: modelName
    });

    if (newLoad) setLoadType(newLoad);
    if (newPivot) {
      setPivotBehavior(newPivot);
      setPeakZone(synthesized.peakZone);
      setCustomWeights(synthesized.curveWeights);
      setCustomDescription(synthesized.resistanceCurveDescription);
    }
    if (newPath) setPathType(newPath);
    if (newZone) {
      setPeakZone(newZone);
      // Adjust weights based on selected peak zone
      if (newZone === 'stretched') {
        setCustomWeights({ stretch: 0.55, mid: 0.30, shortened: 0.15 });
      } else if (newZone === 'mid') {
        setCustomWeights({ stretch: 0.25, mid: 0.55, shortened: 0.20 });
      } else if (newZone === 'shortened') {
        setCustomWeights({ stretch: 0.15, mid: 0.35, shortened: 0.50 });
      } else {
        setCustomWeights({ stretch: 0.334, mid: 0.333, shortened: 0.333 });
      }
    }
  };

  const getPeakZoneLabel = (zone: PeakResistanceZone) => {
    switch (zone) {
      case 'stretched':
        return 'Pico en Estiramiento · Descendente al Bloquear';
      case 'mid':
        return 'Pico en Punto Medio · Curva en Campana';
      case 'shortened':
        return 'Pico en Acortamiento · Carga Máxima al Final';
      case 'uniform':
      default:
        return 'Perfil Uniforme · Tensión Constante';
    }
  };

  const handleSave = () => {
    const finalProfile: MachineResistanceProfile = {
      loadType,
      pivotBehavior,
      pathType,
      peakZone,
      resistanceCurveDescription:
        customDescription ||
        `Perfil clasificado con pico en ${peakZone} y transmisión ${loadType.replace('_', ' ')}.`,
      curveWeights: customWeights,
      machineBrandGuess: brandName || undefined,
      machineModelGuess: modelName || undefined
    };

    // Save to localStorage machine catalog
    try {
      const existing = localStorage.getItem('mia_custom_machines_catalog');
      const list = existing ? JSON.parse(existing) : [];
      const entry = {
        id: `machine_${Date.now()}`,
        name: modelName || exerciseTitle || 'Máquina Personalizada',
        brand: brandName || 'Gimnasio',
        profile: finalProfile,
        photo: photoPreview || undefined,
        createdAt: new Date().toISOString()
      };
      list.unshift(entry);
      localStorage.setItem('mia_custom_machines_catalog', JSON.stringify(list));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }

    if (onSaveProfile) {
      onSaveProfile(finalProfile);
    }
    onClose();
  };

  // SVG Coordinates for 3 Nodes (Stretch: x=40, Mid: x=140, Shortened: x=240, viewBox 0..280 x 0..110)
  // Higher weight -> lower y coordinate (higher visually)
  const svgW = 280;
  const svgH = 110;
  const padBottom = 90;
  const minTop = 20;
  const rangeY = padBottom - minTop;

  // Max weight scale factor (typically 0.15 to 0.55)
  const maxW = Math.max(customWeights.stretch, customWeights.mid, customWeights.shortened, 0.4);
  const getY = (w: number) => {
    const ratio = Math.min(1.0, Math.max(0.0, w / maxW));
    return padBottom - ratio * rangeY;
  };

  const p1 = { x: 40, y: getY(customWeights.stretch) };
  const p2 = { x: 140, y: getY(customWeights.mid) };
  const p3 = { x: 240, y: getY(customWeights.shortened) };

  // Smooth bezier curve path string
  const curvePath = `M ${p1.x} ${p1.y} C ${(p1.x + p2.x) / 2} ${p1.y}, ${(p1.x + p2.x) / 2} ${p2.y}, ${p2.x} ${p2.y} C ${(p2.x + p3.x) / 2} ${p2.y}, ${(p2.x + p3.x) / 2} ${p3.y}, ${p3.x} ${p3.y}`;
  const areaPath = `${curvePath} L ${p3.x} ${padBottom + 8} L ${p1.x} ${padBottom + 8} Z`;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-[max(1.25rem,calc(env(safe-area-inset-top)+1rem))] pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+1rem))] bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-[#11131f] border border-cyan-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl text-white space-y-4 my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
              <Compass className="w-4 h-4" />
              <span>Clasificador Físico de Palancas</span>
            </div>
            <h2 className="text-lg font-black text-white">Perfil de Resistencia de Máquina</h2>
            {exerciseTitle && (
              <p className="text-xs text-slate-400 truncate">
                Contexto: <b className="text-slate-200">{exerciseTitle}</b>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          
          {/* Photo Capture Section */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2.5">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl bg-slate-950 border border-dashed border-cyan-500/40 hover:border-cyan-400 cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-cyan-300 transition shrink-0 overflow-hidden relative"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Máquina" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 mb-1 text-cyan-400" />
                    <span className="text-[10px] font-bold">Subir Foto</span>
                  </>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-cyan-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="font-bold text-slate-200">
                  {isAnalyzing
                    ? 'Analizando palanca con Gemini VLM...'
                    : photoPreview
                    ? 'Foto cargada con éxito'
                    : 'Fotografía la máquina del gimnasio'}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Identifica automáticamente el brazo de palanca respecto al pivote, la torre o polea y clasifica la curva de resistencia.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1 mt-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{photoPreview ? 'Cambiar Foto' : 'Cargar / Sacar Foto'}</span>
                </button>
              </div>
            </div>

            {analysisError && (
              <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
                {analysisError}
              </div>
            )}
          </div>

          {/* Live SVG Resistance Curve */}
          <div className="p-3.5 bg-gradient-to-br from-slate-900 to-[#141829] border border-cyan-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                Curva de Resistencia Calculada
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                {Math.round(customWeights.stretch * 100)}% · {Math.round(customWeights.mid * 100)}% · {Math.round(customWeights.shortened * 100)}%
              </span>
            </div>

            <div className="w-full h-28 bg-slate-950/70 rounded-xl p-2 relative flex items-center justify-center overflow-hidden border border-slate-800">
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full">
                <defs>
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Base horizontal grid lines */}
                <line x1="20" y1={padBottom + 8} x2="260" y2={padBottom + 8} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="20" y1={(minTop + padBottom) / 2} x2="260" y2={(minTop + padBottom) / 2} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

                {/* Area under curve */}
                <path d={areaPath} fill="url(#curveGradient)" />

                {/* Main Curve Line */}
                <path d={curvePath} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />

                {/* 3 Physical Nodes */}
                <circle cx={p1.x} cy={p1.y} r="4.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx={p2.x} cy={p2.y} r="4.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx={p3.x} cy={p3.y} r="4.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />

                {/* Labels */}
                <text x={p1.x} y={svgH - 3} fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold">
                  Estiramiento
                </text>
                <text x={p2.x} y={svgH - 3} fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold">
                  Punto Medio
                </text>
                <text x={p3.x} y={svgH - 3} fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold">
                  Acortamiento
                </text>
              </svg>
            </div>

            {/* Verdict Label */}
            <div className="space-y-1">
              <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>{getPeakZoneLabel(peakZone)}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                {customDescription ||
                  'Comportamiento cinemático con variación de brazo de palanca adaptado a la curva de fuerza articular.'}
              </p>
            </div>
          </div>

          {/* 4 Interactive Chip Selectors */}
          <div className="space-y-3">
            {/* Question 1: Load Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. Tipo de Transmisión de Carga:</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'plate_loaded' as MachineLoadType, label: 'Discos en Palanca' },
                  { id: 'selectorized_stack' as MachineLoadType, label: 'Torre de Placas' },
                  { id: 'cable_pulley' as MachineLoadType, label: 'Polea / Cable' },
                  { id: 'smith_guided' as MachineLoadType, label: 'Multipower / Guiada' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChipChange(opt.id)}
                    className={`py-1.5 px-2 rounded-xl text-left font-medium transition border flex items-center justify-between ${
                      loadType === opt.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {loadType === opt.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: Lever Pivot Movement */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>2. Movimiento de Palanca / Pivote:</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  {
                    id: 'approaches_vertical_loss' as LeverPivotBehavior,
                    label: 'Se verticaliza conforme sube (Brazo momento decrece · Pico Estiramiento)'
                  },
                  {
                    id: 'opens_to_horizontal_gain' as LeverPivotBehavior,
                    label: 'Se abre a la horizontal (Brazo momento aumenta · Pico Acortamiento)'
                  },
                  {
                    id: 'eccentric_cam_drop' as LeverPivotBehavior,
                    label: 'Leva excéntrica o doble pivote (Campana · Pico Medio)'
                  },
                  {
                    id: 'circular_cam_constant' as LeverPivotBehavior,
                    label: 'Polea circular constante (Tensión uniforme en todo el rango)'
                  }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChipChange(undefined, opt.id)}
                    className={`py-2 px-2.5 rounded-xl text-left font-medium transition border flex items-center justify-between ${
                      pivotBehavior === opt.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {pivotBehavior === opt.id && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 3: Path of Grip */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>3. Trayectoria del Agarre:</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'converging_arc' as MachinePathType, label: 'Arco Convergente' },
                  { id: 'diverging_arc' as MachinePathType, label: 'Arco Divergente' },
                  { id: 'linear_fixed' as MachinePathType, label: 'Lineal / Guiada' },
                  { id: 'free_cable' as MachinePathType, label: 'Cable Libre' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChipChange(undefined, undefined, opt.id)}
                    className={`py-1.5 px-2 rounded-xl text-left font-medium transition border flex items-center justify-between ${
                      pathType === opt.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {pathType === opt.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 4: Peak Zone Override */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>4. Zona de Resistencia Pico Estimada:</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'stretched' as PeakResistanceZone, label: 'Estiramiento' },
                  { id: 'mid' as PeakResistanceZone, label: 'Medio' },
                  { id: 'shortened' as PeakResistanceZone, label: 'Acortamiento' },
                  { id: 'uniform' as PeakResistanceZone, label: 'Uniforme' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChipChange(undefined, undefined, undefined, opt.id)}
                    className={`py-2 px-1 rounded-xl text-center font-bold text-[10px] transition border ${
                      peakZone === opt.id
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Machine Brand & Model Inputs */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Datos de Máquina para el Catálogo
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Marca / Fabricante</label>
                <input
                  type="text"
                  list="brand-suggestions"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="Selecciona o escribe marca"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
                <datalist id="brand-suggestions">
                  <option value="Technogym" />
                  <option value="Hammer Strength" />
                  <option value="Panatta" />
                  <option value="Nautilus" />
                  <option value="Cybex" />
                  <option value="Matrix" />
                  <option value="Gym80" />
                  <option value="Otra" />
                </datalist>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(['Technogym', 'Hammer Strength', 'Panatta', 'Nautilus', 'Cybex', 'Matrix', 'Gym80'] as const).map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBrandName(b)}
                      className={`text-[9px] px-1.5 py-0.5 rounded transition ${
                        brandName === b
                          ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Modelo / Serie</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={e => setModelName(e.target.value)}
                  placeholder="Ej: Iso-Lateral Chest Press"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Guardar en Catálogo Local</span>
          </button>
        </div>

      </div>
    </div>
  );
};