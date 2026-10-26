import React, { useState } from 'react';
import { X, Sparkles, Camera, ShieldCheck, Check, ArrowRight, BrainCircuit, Activity, Cpu, Sliders, Code2, ChevronDown, ChevronUp } from 'lucide-react';
import { ExerciseTemplate } from '../types/workout';
import { EXERCISE_DATABASE } from '../data/exercises';

interface AiBiomechanicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (template: ExerciseTemplate) => void;
}

export const AiBiomechanicsModal: React.FC<AiBiomechanicsModalProps> = ({
  isOpen,
  onClose,
  onAddExercise
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'rag'>('scan');
  const [showDevMode, setShowDevMode] = useState(false);

  // Scanner state (Step 3: Multimodal Vision)
  const [selectedSamplePhoto, setSelectedSamplePhoto] = useState<string>('technogym_pure_chest');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<any | null>(null);

  // RAG state (Step 4: Vector Biomechanical Substitution)
  const [selectedJointPain, setSelectedJointPain] = useState<string>('shoulder_impingement');
  const [baseExercise, setBaseExercise] = useState<string>('Press de Banca con Barra Plana');
  const [isSearchingRag, setIsSearchingRag] = useState(false);
  const [ragResults, setRagResults] = useState<any[] | null>(null);

  if (!isOpen) return null;

  // Preset machine samples for vision scanner testing
  const MACHINE_SAMPLES = [
    {
      id: 'technogym_pure_chest',
      name: 'Technogym Pure Strength Chest Press',
      brand: 'Technogym',
      img: 'https://www.technogym.com/es-INT/feed/images/MG05/pure-strength-chest-press_MG05_grey.jpg',
      description: 'Máquina de palancas convergentes con brazos independientes.'
    },
    {
      id: 'hammer_iso_lat',
      name: 'Hammer Strength Iso-Lateral Front Lat Pulldown',
      brand: 'Hammer Strength',
      img: 'https://www.lifefitness.com/Kentico13CoreBase/media/LFMedia/LifeFitnessImages/MediaSync/252-486-plateloaded-frontpulldown.png',
      description: 'Placas de discos con curva de resistencia divergente.'
    },
    {
      id: 'panatta_monolith_hack',
      name: 'Panatta FreeWeight Super Hack Squat 45°',
      brand: 'Panatta',
      img: 'https://www.panattagymequipment.com.au/wp-content/uploads/2021/11/1FW087-pic-01.jpeg',
      description: 'Plataforma curva con respaldo ergonómico de 45 grados.'
    }
  ];

  const handleRunScan = () => {
    setIsScanning(true);
    setScannedResult(null);

    // Simulate Spring AI Multimodal Llama 3.2-Vision inference with JSON Schema output
    setTimeout(() => {
      const sample = MACHINE_SAMPLES.find(s => s.id === selectedSamplePhoto) || MACHINE_SAMPLES[0];
      
      let structuredOutput;
      if (sample.id === 'technogym_pure_chest') {
        structuredOutput = {
          machineName: 'Technogym Pure Strength Incline / Wide Chest Press',
          brand: 'Technogym',
          modelSeries: 'Pure Strength (Iso-Inertial)',
          primaryMuscleGroup: 'chest',
          secondaryMuscleGroups: ['triceps', 'shoulders'],
          equipmentCategory: 'machine',
          confidence: 0.984,
          leverPhysics: 'Palanca convergente de segundo género. Brazo de momento máximo d_perp = L * cos(40°) a mitad del empuje; pedal de despegue elimina torque peligroso en cápsula articular anterior.',
          resistanceCurve: {
            curve: 'lengthened',
            title: 'Perfil Biomecánico en Estiramiento / Zona Media',
            phases: [
              { phase: 'Estiramiento (0°-30°)', pct: 92, level: 'Tensión Máxima (92%)' },
              { phase: 'Zona Media (45°-90°)', pct: 85, level: 'Tensión Alta (85%)' },
              { phase: 'Bloqueo Concéntrico', pct: 62, level: 'Tensión Moderada (62%)' }
            ]
          },
          hotspots: [
            { id: 1, label: 'Regulador Asiento', part: 'Pasador de altura', top: '65%', left: '38%' },
            { id: 2, label: 'Pedal de Arranque', part: 'Foot release de precarga', top: '82%', left: '46%' },
            { id: 3, label: 'Mangos Iso-Laterales', part: 'Empuñaduras ergonómicas', top: '48%', left: '54%' }
          ],
          biomechanicalTips: [
            'Ajusta la palanca amarilla del asiento para que los mangos queden alineados con el pezón inferior.',
            'Utiliza el pedal de precarga (foot release) para iniciar el movimiento sin forzar la cápsula articular del hombro.',
            'Mantén las escápulas retraídas y deprimidas contra el respaldo; la trayectoria convergente replica el plano escapular a 45°.'
          ],
          exerciseTemplate: {
            id: 'tg_pure_chest_press',
            title: 'Technogym Pure Strength Chest Press',
            brand: 'Technogym',
            model_series: 'Pure Strength',
            muscle_group: 'chest',
            equipment_category: 'machine',
            exercise_type: 'weight_reps',
            image_url: sample.img,
            description: 'Press de palancas convergentes con pedal de arranque.',
            setup_tips: [
              'Ajuste de asiento a nivel del pectoral medio.',
              'Pisa el pedal amarillo para comenzar la repetición.',
              'No bloquees los codos en la fase concéntrica.'
            ]
          }
        };
      } else if (sample.id === 'hammer_iso_lat') {
        structuredOutput = {
          machineName: 'Hammer Strength Iso-Lateral High Row / Pulldown',
          brand: 'Hammer Strength',
          modelSeries: 'Iso-Lateral Plate Loaded',
          primaryMuscleGroup: 'lats',
          secondaryMuscleGroups: ['biceps', 'upper_back'],
          equipmentCategory: 'plate_loaded',
          confidence: 0.976,
          biomechanicalTips: [
            'Fija los rodillos acolchados sobre los muslos firmemente para anular la fuerza de elevación en cargas submáximas.',
            'Utiliza el agarre neutro o prono con rotación natural siguiendo el arco de movimiento divergente.',
            'Tracciona llevando los codos hacia las crestas ilíacas para maximizar el reclutamiento de las fibras ilíacas del dorsal.'
          ],
          exerciseTemplate: {
            id: 'hammer_iso_lat_pulldown',
            title: 'Hammer Strength Iso-Lateral Lat Pulldown',
            brand: 'Hammer Strength',
            model_series: 'Iso-Lateral',
            muscle_group: 'lats',
            equipment_category: 'plate_loaded',
            exercise_type: 'weight_reps',
            image_url: sample.img,
            description: 'Jalón divergente en placas olímpicas con movimiento independiente de brazos.',
            setup_tips: [
              'Ajusta el rodillo para fijar los cuádriceps.',
              'Lleva el codo hacia la cadera en el plano del dorsal.',
              'Pausa 1s en contracción máxima.'
            ]
          }
        };
      } else {
        structuredOutput = {
          machineName: 'Panatta Monolith Hack Squat 45°',
          brand: 'Panatta',
          modelSeries: 'Monolith Sport',
          primaryMuscleGroup: 'quadriceps',
          secondaryMuscleGroups: ['glutes', 'calves'],
          equipmentCategory: 'machine',
          confidence: 0.991,
          biomechanicalTips: [
            'Coloca los pies en la mitad inferior de la plataforma para favorecer la flexión de rodilla sin levantar los talones.',
            'El respaldo curvo estabiliza el sacro y evita la retroversión pélvica ("butt wink").',
            'Desbloquea los pestillos laterales con las empuñaduras ergonómicas y desciende controlando 3 segundos la fase excéntrica.'
          ],
          exerciseTemplate: {
            id: 'panatta_hack_squat',
            title: 'Panatta Monolith Hack Squat',
            brand: 'Panatta',
            model_series: 'Monolith',
            muscle_group: 'quadriceps',
            equipment_category: 'machine',
            exercise_type: 'weight_reps',
            image_url: sample.img,
            description: 'Hack Squat de 45° con guiado de baja fricción.',
            setup_tips: [
              'Pies a la anchura de hombros.',
              'Espalda y cabeza pegadas al respaldo en todo el rango.',
              'Frenos de emergencia ajustados a tu profundidad máxima segura.'
            ]
          }
        };
      }

      setScannedResult(structuredOutput);
      setIsScanning(false);
    }, 1100);
  };

  const handleRunRagSearch = () => {
    setIsSearchingRag(true);
    setRagResults(null);

    // Simulate pgvector cosine similarity search over Biomechanical knowledge base
    setTimeout(() => {
      let results: any[] = [];
      if (selectedJointPain === 'shoulder_impingement') {
        results = [
          {
            name: 'Technogym Pure Strength Chest Press (Convergente)',
            targetMuscle: 'Pecho',
            jointStressAvoided: 'Hombro Anterior (Evita abducción horizontal forzada a 90°)',
            similarityScore: 0.942,
            axialLoading: false,
            biomechanicalRationale: 'La trayectoria convergente y el agarre neutro mantienen el húmero en el plano escapular (30-45°), eliminando el pinzamiento subacromial característico de la barra plana.',
            template: EXERCISE_DATABASE.find(e => e.id === 'tg_pure_chest_press') || EXERCISE_DATABASE[0]
          },
          {
            name: 'Hammer Strength Iso-Lateral Decline Press',
            targetMuscle: 'Pecho',
            jointStressAvoided: 'Cápsula anterior del hombro',
            similarityScore: 0.915,
            axialLoading: false,
            biomechanicalRationale: 'El ángulo declinado reduce en un 60% la tensión sobre el tendón del bíceps braquial y el labrum antero-superior mientras estimula la porción esternocostal.',
            template: EXERCISE_DATABASE.find(e => e.id === 'hammer_iso_decline') || EXERCISE_DATABASE[1]
          }
        ];
      } else if (selectedJointPain === 'lower_back_l4l5') {
        results = [
          {
            name: 'Matrix Versa Chest Supported Row',
            targetMuscle: 'Espalda / Dorsal',
            jointStressAvoided: 'Columna Lumbar L4-S1 (Cizallamiento cero)',
            similarityScore: 0.965,
            axialLoading: false,
            biomechanicalRationale: 'Al estar el pecho completamente soportado por el cojín frontal, los erectores espinales no tienen que sostener momento de flexión, permitiendo trabajar el dorsal sin dolor lumbar.',
            template: EXERCISE_DATABASE.find(e => e.id === 'matrix_chest_supported_row') || EXERCISE_DATABASE[2]
          },
          {
            name: 'Technogym Selection Lat Pulldown',
            targetMuscle: 'Dorsal Ancho',
            jointStressAvoided: 'Fuerzas compresivas axiales',
            similarityScore: 0.898,
            axialLoading: false,
            biomechanicalRationale: 'Vector de tracción vertical sin sobrecarga axial en el raquis lumbosacro.',
            template: EXERCISE_DATABASE.find(e => e.id === 'tg_selection_pulldown') || EXERCISE_DATABASE[3]
          }
        ];
      } else {
        results = [
          {
            name: 'Technogym Pure Leg Press 45°',
            targetMuscle: 'Cuádriceps / Cadena Posterior',
            jointStressAvoided: 'Tendón rotuliano y ligamento cruzado anterior',
            similarityScore: 0.938,
            axialLoading: false,
            biomechanicalRationale: 'Permite colocar los pies en la parte alta de la plataforma aumentando el ángulo cadera-rodilla, lo cual reduce el brazo de momento de la rótula.',
            template: EXERCISE_DATABASE.find(e => e.id === 'tg_pure_leg_press') || EXERCISE_DATABASE[4]
          },
          {
            name: 'Matrix Ultra Seated Leg Curl',
            targetMuscle: 'Isquiosurales',
            jointStressAvoided: 'Rótula en flexión extrema',
            similarityScore: 0.887,
            axialLoading: false,
            biomechanicalRationale: 'Posición sentada pre-estira los isquiotibiales en la cadera mientras estabiliza la articulación tibiofemoral.',
            template: EXERCISE_DATABASE.find(e => e.id === 'matrix_seated_leg_curl') || EXERCISE_DATABASE[5]
          }
        ];
      }

      setRagResults(results);
      setIsSearchingRag(false);
    }, 900);
  };

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
                  CHΔNCE Vision & RAG
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sistema inteligente de análisis de máquinas y prescripción articular
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDevMode(!showDevMode)}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/60 hover:border-slate-600 text-slate-300 hover:text-white transition flex items-center gap-1.5"
              title="Alternar vista técnica de endpoints y embeddings"
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
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
              activeTab === 'scan'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Escaneo Visual de Máquinas</span>
          </button>

          <button
            onClick={() => setActiveTab('rag')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
              activeTab === 'rag'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Sustitución Biomecánica por Dolor</span>
          </button>
        </div>

        {/* Tab 1: Multimodal Vision Machine Scanner */}
        {activeTab === 'scan' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {showDevMode ? (
              <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-blue-400 flex items-center gap-1.5 text-sm">
                  <Cpu className="w-4 h-4" />
                  <span>Pipeline Técnico (Llama 3.2-Vision + Spring AI)</span>
                </div>
                <p className="leading-relaxed">
                  Envía la captura al endpoint <code className="text-blue-300 bg-slate-800 px-1.5 py-0.5 rounded font-semibold">POST /api/v1/exercises/scan</code> con <b>Structured Output (JSON Schema)</b>. Extrae fabricante, familia biomecánica, curva de resistencia y brazo de momento para calibración automática.
                </p>
              </div>
            ) : (
              <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-3.5 text-xs text-slate-300 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <p className="leading-relaxed">
                  Apunta con la cámara a cualquier máquina del gimnasio para identificar su perfil de resistencia, palancas y regulación óptima del asiento.
                </p>
              </div>
            )}

            {/* Select a sample image or upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Selecciona una fotografía de prueba del gimnasio:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MACHINE_SAMPLES.map(sample => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      setSelectedSamplePhoto(sample.id);
                      setScannedResult(null);
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 text-left p-1 transition ${
                      selectedSamplePhoto === sample.id
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

            <button
              onClick={handleRunScan}
              disabled={isScanning}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Analizando imagen con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Escanear y Extraer Metadatos</span>
                </>
              )}
            </button>

            {/* Structured Scan Results */}
            {scannedResult && (
              <div className="p-4 bg-[#181a28] border border-emerald-500/40 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tabular-nums">
                      {(scannedResult.confidence * 100).toFixed(1)}% Confianza
                    </span>
                    <span className="text-xs font-bold text-slate-400">{scannedResult.modelSeries}</span>
                  </div>
                  <span className="text-xs text-blue-400 uppercase font-bold">{scannedResult.brand}</span>
                </div>

                <div className="text-base font-black text-white">{scannedResult.machineName}</div>

                <div className="flex gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-semibold capitalize">
                    Foco: {scannedResult.primaryMuscleGroup}
                  </span>
                  {scannedResult.secondaryMuscleGroups.map((m: string) => (
                    <span key={m} className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 capitalize">
                      {m}
                    </span>
                  ))}
                </div>

                {/* Real Lever Physics and Moment Arm Box */}
                {scannedResult.leverPhysics && (
                  <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-blue-400 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Física de Palancas & Brazo de Momento:</span>
                      </div>
                      <span className="tabular-nums text-[10px] bg-blue-500/20 px-2 py-0.5 rounded">τ = F · L · cos(θ)</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{scannedResult.leverPhysics}</p>
                  </div>
                )}

                {/* 3-Phase Resistance Curve */}
                {scannedResult.resistanceCurve && (
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                    <div className="font-bold text-slate-300 flex items-center justify-between">
                      <span>Curva de Resistencia Calculada:</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">{scannedResult.resistanceCurve.title}</span>
                    </div>
                    <div className="space-y-1.5">
                      {scannedResult.resistanceCurve.phases.map((ph: any, idx: number) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                            <span>{ph.phase}</span>
                            <span className="text-white tabular-nums font-bold">{ph.level}</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                              style={{ width: `${ph.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Instrucciones Biomecánicas de Regulación:</span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
                    {scannedResult.biomechanicalTips.map((tip: string, i: number) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    onAddExercise(scannedResult.exerciseTemplate);
                    onClose();
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Añadir esta máquina escaneada a mi sesión</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: RAG Biomecánico & Sustitución con pgvector */}
        {activeTab === 'rag' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {showDevMode ? (
              <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-indigo-400 flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pipeline RAG Biomecánico (pgvector + Embeddings)</span>
                </div>
                <p className="leading-relaxed">
                  Búsqueda vectorial con operador <b>Cosine Distance (&lt;=&gt;)</b> sobre embeddings de 768 dimensiones en PostgreSQL. Mapea vectores articulares para sustituir ejercicios con idéntico reclutamiento muscular eliminando fuerzas de cizallamiento y sobrecarga axial.
                </p>
              </div>
            ) : (
              <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-3.5 text-xs text-slate-300 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <p className="leading-relaxed">
                  ¿Molestias articulares? Selecciona la zona afectada para obtener de forma inteligente máquinas alternativas seguras que estimulen el músculo sin comprometer articulaciones o tendones.
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
                  onChange={(e) => setBaseExercise(e.target.value)}
                  className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Zona / Articulación Afectada:
                </label>
                <select
                  value={selectedJointPain}
                  onChange={(e) => {
                    setSelectedJointPain(e.target.value);
                    setRagResults(null);
                  }}
                  className="w-full mt-1 bg-[#181a28] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="shoulder_impingement">Hombro anterior / Pinzamiento subacromial</option>
                  <option value="lower_back_l4l5">Zona lumbar / Compresión axial raquídea (L4-S1)</option>
                  <option value="knee_patellar">Rodilla / Tendón rotuliano y cizallamiento anterior</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRunRagSearch}
              disabled={isSearchingRag}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              {isSearchingRag ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Buscando alternativas en pgvector (Cosine Sim)...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Consultar Alternativas Biomecánicas RAG</span>
                </>
              )}
            </button>

            {/* RAG Query Results */}
            {ragResults && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Alternativas Óptimas Encontradas ({ragResults.length}):
                </div>

                {ragResults.map((alt, idx) => (
                  <div key={idx} className="p-4 bg-[#181a28] border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{alt.name}</span>
                      <span className="text-[10px] tabular-nums font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">
                        {(alt.similarityScore * 100).toFixed(1)}% Similitud Vectorial
                      </span>
                    </div>

                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                      <span><b>Protección articular:</b> {alt.jointStressAvoided}</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {alt.biomechanicalRationale}
                    </p>

                    <button
                      onClick={() => {
                        onAddExercise(alt.template);
                        onClose();
                      }}
                      className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-indigo-500/30"
                    >
                      <span>Usar este sustituto en mi entrenamiento</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
