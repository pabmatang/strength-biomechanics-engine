import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Camera,
  ShieldCheck,
  Check,
  ArrowRight,
  BrainCircuit,
  Activity,
  Cpu,
  Code2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Upload,
  Info,
  Video
} from 'lucide-react';
import { VideoPoseAnalysisModal } from './VideoPoseAnalysisModal';
import { ExerciseTemplate, GymBrand, MuscleGroup, EquipmentCategory } from '../types/workout';
import { EXERCISE_DATABASE } from '../data/exercises';
import {
  ApiError,
  BiomechanicalAlternativeDto,
  ScannedMachineDto,
  findSubstitutes,
  scanMachineImage
} from '../utils/api';

interface AiBiomechanicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (template: ExerciseTemplate) => void;
}

interface MACHINE_SAMPLE {
  id: string;
  name: string;
  brand: string;
  img: string;
  description: string;
}

// Bundled sample photos (frontend/public/machines), so the demo works offline.
const MACHINE_SAMPLES: MACHINE_SAMPLE[] = [
  {
    id: 'technogym_pure_chest',
    name: 'Technogym Pure Strength Chest Press',
    brand: 'Technogym',
    img: '/machines/technogym_pure_chest_press.png',
    description: 'Máquina de palancas convergentes con brazos independientes.'
  },
  {
    id: 'hammer_iso_lat',
    name: 'Hammer Strength Iso-Lateral Front Lat Pulldown',
    brand: 'Hammer Strength',
    img: '/machines/hammer_iso_front_lat_pulldown.png',
    description: 'Placas de discos con curva de resistencia divergente.'
  },
  {
    id: 'panatta_monolith_hack',
    name: 'Panatta Super Hack Squat 45°',
    brand: 'Panatta',
    img: '/machines/panatta_super_hack_squat.jpg',
    description: 'Plataforma curva con respaldo ergonómico de 45 grados.'
  }
];

const JOINT_OPTIONS = [
  { value: 'shoulder_impingement', label: 'Hombro anterior / Pinzamiento subacromial' },
  { value: 'lower_back_l4l5', label: 'Zona lumbar / Compresión axial raquídea (L4-S1)' },
  { value: 'knee_patellar', label: 'Rodilla / Tendón rotuliano y cizallamiento anterior' }
];

const MUSCLE_GROUPS: MuscleGroup[] = [
  'abdominals', 'shoulders', 'biceps', 'triceps', 'forearms', 'quadriceps', 'hamstrings',
  'calves', 'glutes', 'abductors', 'adductors', 'lats', 'upper_back', 'traps', 'lower_back',
  'chest', 'cardio', 'neck', 'full_body', 'other'
];

const BRANDS: GymBrand[] = [
  'Technogym', 'Hammer Strength', 'Life Fitness', 'Matrix', 'Panatta',
  'Gym80', 'Eleiko', 'Booty Builder', 'Concept2', 'General'
];

const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  'none', 'barbell', 'dumbbell', 'kettlebell', 'machine', 'cable', 'plate',
  'smith', 'cardio_machine', 'resistance_band'
];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toMuscleGroup(value: string | null | undefined): MuscleGroup {
  if (!value) return 'other';

  const normalized = normalizeText(value);
  const direct = MUSCLE_GROUPS.find(group => normalizeText(group) === normalized);
  if (direct) return direct;

  const keywords: Array<[RegExp, MuscleGroup]> = [
    [/pectoral|chest|pecho/, 'chest'],
    [/dorsal|lats?\b|latissimus|jalon/, 'lats'],
    [/upper back|trapecio superior|romboides|espalda alta/, 'upper_back'],
    [/lower back|lumbar|erector/, 'lower_back'],
    [/trap/, 'traps'],
    [/shoulder|delt|hombro/, 'shoulders'],
    [/tricep|triceps/, 'triceps'],
    [/bicep|biceps/, 'biceps'],
    [/forearm|antebrazo/, 'forearms'],
    [/quad|cuadriceps/, 'quadriceps'],
    [/hamstring|isquio|femoral/, 'hamstrings'],
    [/glute|gluteo/, 'glutes'],
    [/calf|calves|gemelo|gastrocnemio|soleo/, 'calves'],
    [/abduct/, 'abductors'],
    [/adduct/, 'adductors'],
    [/abdomin|core|recto abdominal/, 'abdominals'],
    [/cardio|running|cycling/, 'cardio'],
    [/neck|cervical/, 'neck'],
    [/full body|cuerpo completo/, 'full_body']
  ];

  return keywords.find(([pattern]) => pattern.test(normalized))?.[1] ?? 'other';
}

function toBrand(value: string | null | undefined): GymBrand {
  if (!value) return 'General';
  const normalized = normalizeText(value);
  return BRANDS.find(brand => normalizeText(brand) === normalized)
    ?? BRANDS.find(brand => normalized.includes(normalizeText(brand)))
    ?? 'General';
}

function toEquipmentCategory(value: string | null | undefined): EquipmentCategory {
  if (!value) return 'machine';
  const normalized = normalizeText(value);

  if (/plate.?loaded|placa/.test(normalized)) return 'plate';
  if (/machine|maquina/.test(normalized)) return 'machine';
  if (/cable|polea/.test(normalized)) return 'cable';
  if (/barbell|barra/.test(normalized)) return 'barbell';
  if (/dumbbell|mancuerna/.test(normalized)) return 'dumbbell';
  if (/kettlebell/.test(normalized)) return 'kettlebell';
  if (/smith/.test(normalized)) return 'smith';
  if (/cardio/.test(normalized)) return 'cardio_machine';
  if (/band|goma/.test(normalized)) return 'resistance_band';
  if (/bodyweight|none|peso corporal/.test(normalized)) return 'none';

  return EQUIPMENT_CATEGORIES.find(category => normalizeText(category) === normalized) ?? 'machine';
}

function slugify(value: string): string {
  return normalizeText(value).replace(/ /g, '_').slice(0, 60) || 'machine';
}

function findTemplate(name: string): ExerciseTemplate | undefined {
  const target = normalizeText(name);

  const exact = EXERCISE_DATABASE.find(item => normalizeText(item.title) === target);
  if (exact) return exact;

  return EXERCISE_DATABASE.find(item => {
    const title = normalizeText(item.title);
    return title.includes(target) || target.includes(title);
  }) ?? EXERCISE_DATABASE.find(item => {
    // Token overlap: "Technogym Pure Strength Chest Press" vs "Technogym Pure - Chest Press".
    const targetTokens = new Set(target.split(' ').filter(token => token.length > 3));
    const titleTokens = normalizeText(item.title).split(' ').filter(token => token.length > 3);
    const shared = titleTokens.filter(token => targetTokens.has(token)).length;
    return shared >= 2;
  });
}

function templateFromScan(dto: ScannedMachineDto, imageUrl: string): ExerciseTemplate {
  const primary = toMuscleGroup(dto.primaryMuscleGroup);
  const secondary = (dto.secondaryMuscleGroups ?? [])
    .map(toMuscleGroup)
    .filter(muscle => muscle !== primary && muscle !== 'other');

  return {
    id: `scanned_${slugify(dto.machineName)}`,
    title: dto.machineName,
    brand: toBrand(dto.brand),
    model_series: dto.modelSeries ?? undefined,
    muscle_group: primary,
    other_muscles: secondary,
    equipment_category: toEquipmentCategory(dto.equipmentCategory),
    exercise_type: 'weight_reps',
    image_url: imageUrl,
    description: [dto.brand, dto.modelSeries].filter(Boolean).join(' · ') || 'Máquina identificada por visión multimodal.',
    setup_tips: dto.biomechanicalSetupTips ?? []
  };
}

function templateFromAlternative(alternative: BiomechanicalAlternativeDto): ExerciseTemplate {
  const match = findTemplate(alternative.name);
  if (match) return match;

  return {
    id: `substitute_${slugify(alternative.name)}`,
    title: alternative.name,
    brand: toBrand(alternative.brand),
    muscle_group: toMuscleGroup(alternative.targetMuscle),
    equipment_category: 'machine',
    exercise_type: 'weight_reps',
    description: `${alternative.movementPlane} · ${alternative.jointStressAvoided}`,
    setup_tips: [alternative.biomechanicalRationale]
  };
}

function describeApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Error inesperado al llamar a la API.';
}

async function sampleAsFile(sample: MACHINE_SAMPLE): Promise<File> {
  const response = await fetch(sample.img);
  if (!response.ok) {
    throw new Error(`No se pudo cargar la imagen de ejemplo (${response.status}).`);
  }
  const blob = await response.blob();
  const extension = sample.img.split('.').pop() ?? 'png';
  return new File([blob], `${sample.id}.${extension}`, { type: blob.type || 'image/png' });
}

export const AiBiomechanicsModal: React.FC<AiBiomechanicsModalProps> = ({
  isOpen,
  onClose,
  onAddExercise
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'rag' | 'video_pose'>('scan');
  const [showDevMode, setShowDevMode] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Scanner state
  const [selectedSamplePhoto, setSelectedSamplePhoto] = useState<string>(MACHINE_SAMPLES[0].id);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    dto: ScannedMachineDto;
    imageUrl: string;
    demo: boolean;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Substitution state
  const [selectedJointPain, setSelectedJointPain] = useState<string>(JOINT_OPTIONS[0].value);
  const [baseExercise, setBaseExercise] = useState<string>('Press de Banca con Barra Plana');
  const [isSearchingRag, setIsSearchingRag] = useState(false);
  const [ragResults, setRagResults] = useState<BiomechanicalAlternativeDto[] | null>(null);
  const [ragDemo, setRagDemo] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedSample = MACHINE_SAMPLES.find(sample => sample.id === selectedSamplePhoto) ?? MACHINE_SAMPLES[0];

  const handleSelectSample = (sample: MACHINE_SAMPLE) => {
    setSelectedSamplePhoto(sample.id);
    setCustomFile(null);
    setCustomPreview(null);
    setScanResult(null);
    setScanError(null);
  };

  const handleCustomFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCustomFile(file);
    setCustomPreview(URL.createObjectURL(file));
    setScanResult(null);
    setScanError(null);
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanError(null);
    setScanResult(null);

    try {
      const imageUrl = customPreview ?? selectedSample.img;
      const file = customFile ?? await sampleAsFile(selectedSample);
      const dto = await scanMachineImage(file);
      setScanResult({ dto, imageUrl, demo: false });
    } catch (error) {
      setScanError(describeApiError(error));
    } finally {
      setIsScanning(false);
    }
  };

  const handleRunRagSearch = async () => {
    if (!baseExercise.trim()) {
      setRagError('Indica el ejercicio que te genera molestias.');
      return;
    }

    setIsSearchingRag(true);
    setRagError(null);
    setRagResults(null);
    setRagDemo(false);

    const jointLabel = JOINT_OPTIONS.find(option => option.value === selectedJointPain)?.label
      ?? selectedJointPain;

    try {
      const results = await findSubstitutes({
        currentExercise: baseExercise.trim(),
        jointDiscomfort: jointLabel
      });
      setRagResults(results);
    } catch (error) {
      setRagError(describeApiError(error));
    } finally {
      setIsSearchingRag(false);
    }
  };

  /**
   * Explicitly labelled illustrative output for demos without the backend running.
   * It never touches the API and is rendered with a visible "ejemplo" banner.
   */
  const handleShowDemoScan = () => {
    setScanError(null);
    setScanResult({
      demo: true,
      imageUrl: selectedSample.img,
      dto: {
        machineName: 'Technogym Pure Strength Chest Press',
        brand: 'Technogym',
        modelSeries: 'Pure Strength (Iso-Inertial)',
        primaryMuscleGroup: 'chest',
        secondaryMuscleGroups: ['triceps', 'shoulders'],
        equipmentCategory: 'machine',
        biomechanicalSetupTips: [
          'Ajusta el asiento para que los mangos queden alineados con el pecho medio.',
          'Usa el pedal de precarga para empezar la repetición sin forzar el hombro.',
          'Mantén las escápulas retraídas y no bloquees los codos al final del empuje.'
        ]
      }
    });
  };

  const handleShowDemoRag = () => {
    setRagError(null);
    setRagDemo(true);
    setRagResults([
      {
        id: 'demo-1',
        name: 'Technogym Pure Strength Chest Press',
        brand: 'Technogym',
        targetMuscle: 'chest',
        movementPlane: 'Scapular convergent',
        jointStressAvoided: 'Low subacromial shear',
        axialLoading: false,
        similarityScore: 0.932,
        biomechanicalRationale:
          'Ejemplo ilustrativo: la trayectoria convergente mantiene el húmero en el plano escapular y reduce el pinzamiento subacromial.'
      },
      {
        id: 'demo-2',
        name: 'Technogym Selection Pec Deck',
        brand: 'Technogym',
        targetMuscle: 'chest',
        movementPlane: 'Transverse adduction',
        jointStressAvoided: 'Low shoulder extension stress',
        axialLoading: false,
        similarityScore: 0.874,
        biomechanicalRationale:
          'Ejemplo ilustrativo: aducción horizontal guiada que evita el componente de extensión de hombro.'
      }
    ]);
  };

  const scanTemplate = scanResult ? templateFromScan(scanResult.dto, scanResult.imageUrl) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-2xl bg-[#12141e] border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl text-white space-y-4 sm:space-y-5 max-h-full flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">IA & Biomecánica</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Spring AI · pgvector
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Escaneo multimodal y sustitución semántica contra la API real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDevMode(!showDevMode)}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/60 hover:border-slate-600 text-slate-300 hover:text-white transition flex items-center gap-1.5"
              title="Alternar vista técnica de endpoints"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Modo Developer</span>
              {showDevMode ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 p-1 bg-[#181a28] rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'scan'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Escaneo Visual</span>
          </button>

          <button
            onClick={() => setActiveTab('rag')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'rag'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Sustitución pgvector</span>
          </button>

          <button
            onClick={() => setActiveTab('video_pose')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'video_pose'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Vídeo Pose & Ángulos</span>
          </button>
        </div>

        {/* Tab 1: Multimodal Vision Machine Scanner */}
        {activeTab === 'scan' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {showDevMode ? (
              <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-blue-400 flex items-center gap-1.5 text-sm">
                  <Cpu className="w-4 h-4" />
                  <span>Pipeline real (Spring AI + Ollama)</span>
                </div>
                <p className="leading-relaxed">
                  Envía la imagen a{' '}
                  <code className="text-blue-300 bg-slate-800 px-1.5 py-0.5 rounded font-semibold">
                    POST /api/v1/exercises/scan
                  </code>{' '}
                  (multipart, JWT obligatorio). El backend pide a llama3.2-vision un JSON con el esquema
                  <code className="text-blue-300 bg-slate-800 px-1.5 py-0.5 rounded font-semibold ml-1">ScannedMachineDto</code>.
                  No se inventan marcas: si el modelo no está seguro, lo indica en el campo correspondiente.
                </p>
                <p className="text-[11px] text-slate-500">
                  Los porcentajes de confianza, curvas de resistencia y puntos hotspot de versiones anteriores
                  eran simulados y se han eliminado de la interfaz.
                </p>
              </div>
            ) : (
              <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-3.5 text-xs text-slate-300 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <p className="leading-relaxed">
                  Sube una foto real de la máquina o usa una de las muestras incluidas. La imagen se envía al
                  backend, que la analiza con el modelo de visión local.
                </p>
              </div>
            )}

            {/* Sample images */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Muestras incluidas en la app:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MACHINE_SAMPLES.map(sample => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className={`relative rounded-xl overflow-hidden border-2 text-left p-1 transition ${
                      !customFile && selectedSamplePhoto === sample.id
                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={sample.img} alt={sample.name} className="w-full h-20 object-cover rounded-lg" />
                    <div className="mt-1 px-1">
                      <div className="text-[10px] font-bold text-slate-300 truncate">{sample.name}</div>
                      <div className="text-[9px] text-blue-400 font-semibold">{sample.brand}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload own photo */}
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer text-[11px] font-semibold text-slate-300 bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl px-3 py-2.5 transition flex items-center justify-center gap-2">
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>{customFile ? customFile.name : 'Subir mi propia foto (máx. 10 MB)'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCustomFile}
                  className="hidden"
                />
              </label>
              {customPreview && (
                <img src={customPreview} alt="Previsualización" className="h-10 w-10 rounded-lg object-cover border border-slate-700" />
              )}
            </div>

            <button
              onClick={handleRunScan}
              disabled={isScanning}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Analizando imagen con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Escanear con el backend</span>
                </>
              )}
            </button>

            {scanError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{scanError}</span>
                </div>
                <button
                  onClick={handleShowDemoScan}
                  className="text-[11px] font-semibold text-slate-300 underline decoration-dotted hover:text-white"
                >
                  Ver ejemplo ilustrativo (sin backend)
                </button>
              </div>
            )}

            {/* Scan result */}
            {scanResult && (
              <div className="p-4 bg-[#181a28] border border-emerald-500/40 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                {scanResult.demo && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/40 rounded-lg text-[11px] text-amber-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>Ejemplo ilustrativo: no procede de la API ni del modelo de visión.</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Check className="w-3 h-3" />
                    <span>{scanResult.demo ? 'Datos de ejemplo' : 'Respuesta de la API'}</span>
                  </div>
                  <span className="text-xs text-blue-400 uppercase font-bold">{scanResult.dto.brand ?? 'Marca no identificada'}</span>
                </div>

                <div>
                  <div className="text-base font-black text-white">{scanResult.dto.machineName}</div>
                  <div className="text-xs text-slate-400">{scanResult.dto.modelSeries ?? 'Serie no identificada'}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-semibold capitalize">
                    Foco: {scanResult.dto.primaryMuscleGroup ?? 'sin identificar'}
                  </span>
                  {(scanResult.dto.secondaryMuscleGroups ?? []).map(muscle => (
                    <span key={muscle} className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 capitalize">
                      {muscle}
                    </span>
                  ))}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Consejos de ajuste devueltos por el modelo:</span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
                    {(scanResult.dto.biomechanicalSetupTips ?? []).map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                    {(scanResult.dto.biomechanicalSetupTips ?? []).length === 0 && (
                      <li>El modelo no devolvió consejos de ajuste para esta imagen.</li>
                    )}
                  </ul>
                </div>

                {scanTemplate && (
                  <button
                    onClick={() => {
                      onAddExercise(scanTemplate);
                      onClose();
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Añadir esta máquina a mi sesión</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Semantic substitution */}
        {activeTab === 'rag' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {showDevMode ? (
              <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-indigo-400 flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pipeline real (embeddings + pgvector)</span>
                </div>
                <p className="leading-relaxed">
                  <code className="text-blue-300 bg-slate-800 px-1.5 py-0.5 rounded font-semibold">
                    POST /api/v1/biomechanics/substitute
                  </code>{' '}
                  embebe la consulta con nomic-embed-text y ejecuta un kNN con el operador coseno
                  <code className="text-blue-300 bg-slate-800 px-1.5 py-0.5 rounded font-semibold mx-1">&lt;=&gt;</code>
                  sobre <b>vector(768)</b>. La similitud que se muestra la calcula PostgreSQL; la justificación se
                  compone de los atributos recuperados, sin generar texto con un LLM.
                </p>
              </div>
            ) : (
              <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-3.5 text-xs text-slate-300 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <p className="leading-relaxed">
                  Describe la molestia y el ejercicio. La API devuelve las alternativas más cercanas del catálogo
                  biomecánico con su similitud vectorial real.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Ejercicio que genera la molestia:
                </label>
                <input
                  type="text"
                  value={baseExercise}
                  onChange={(event) => {
                    setBaseExercise(event.target.value);
                    setRagResults(null);
                  }}
                  className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Zona / Articulación afectada:
                </label>
                <select
                  value={selectedJointPain}
                  onChange={(event) => {
                    setSelectedJointPain(event.target.value);
                    setRagResults(null);
                  }}
                  className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-semibold"
                >
                  {JOINT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleRunRagSearch}
              disabled={isSearchingRag}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              {isSearchingRag ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Buscando vecinos en pgvector...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Consultar alternativas en la API</span>
                </>
              )}
            </button>

            {ragError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{ragError}</span>
                </div>
                <button
                  onClick={handleShowDemoRag}
                  className="text-[11px] font-semibold text-slate-300 underline decoration-dotted hover:text-white"
                >
                  Ver ejemplo ilustrativo (sin backend)
                </button>
              </div>
            )}

            {ragDemo && ragResults && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/40 rounded-lg text-[11px] text-amber-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Ejemplo ilustrativo: similitudes y textos inventados, no calculados por pgvector.</span>
              </div>
            )}

            {ragResults && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Alternativas recuperadas ({ragResults.length}):
                </div>

                {ragResults.length === 0 && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
                    No hay alternativas con embeddings en el catálogo. Revisa que el backend haya sembrado la
                    base de conocimiento y que Ollama esté disponible.
                  </div>
                )}

                {ragResults.map(alternative => {
                  const template = templateFromAlternative(alternative);
                  return (
                    <div key={alternative.id} className="p-4 bg-[#181a28] border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-white">{alternative.name}</span>
                        <span className="text-[10px] tabular-nums font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 whitespace-nowrap">
                          {(alternative.similarityScore * 100).toFixed(1)}% similitud
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                        <span>Músculo: <b className="text-slate-300 capitalize">{alternative.targetMuscle}</b></span>
                        <span>Plano: <b className="text-slate-300">{alternative.movementPlane}</b></span>
                        <span>Carga axial: <b className="text-slate-300">{alternative.axialLoading ? 'sí' : 'no'}</b></span>
                      </div>

                      <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                        <span><b>Protección articular:</b> {alternative.jointStressAvoided}</span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {alternative.biomechanicalRationale}
                      </p>

                      <button
                        onClick={() => {
                          onAddExercise(template);
                          onClose();
                        }}
                        className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-indigo-500/30"
                      >
                        <span>Usar este sustituto en mi entrenamiento</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Video Pose Estimation & Trigonometric Tracking */}
        {activeTab === 'video_pose' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="p-4 bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Video className="w-4 h-4" />
                <span>Tracking Biomecánico por Vídeo (Edge Computing)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Detecta las articulaciones clave de tu cuerpo (hombros, codos, muñecas, caderas, rodillas, tobillos) en tiempo real mediante trigonometría vectorial en tu propio dispositivo sin subir pesados vídeos a la nube.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="font-bold text-cyan-400 mb-0.5">Trigonometría Vectorial</div>
                  <span>Cálculo de ángulos articulares internos (atan2) con visualización de esqueleto en Canvas/SVG a 60 FPS.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="font-bold text-blue-400 mb-0.5">Telemetría a Spring Boot</div>
                  <span>Envía métricas agregadas ligeras (ROM, repeticiones válidas, alertas) al backend para diagnóstico automático.</span>
                </div>
              </div>

              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition"
              >
                <Video className="w-4 h-4" />
                <span>Abrir Escáner de Vídeo & Pose Estimation</span>
              </button>
            </div>
          </div>
        )}

        {/* Embedded Pose Analysis Modal */}
        <VideoPoseAnalysisModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
        />

      </div>
    </div>
  );
};
