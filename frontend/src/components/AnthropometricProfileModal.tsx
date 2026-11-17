import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  User,
  Activity,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Camera,
  RotateCcw,
  Save,
  Check,
  ShieldCheck,
  Dna
} from 'lucide-react';
import {
  analyzeAnthropometry,
  AnthropometricProfile
} from '../services/modalBiomechanicsClient';

interface AnthropometricProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: AnthropometricProfile) => void;
}

const STORAGE_KEY = 'client_anthropometric_profile';

export const AnthropometricProfileModal: React.FC<AnthropometricProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated
}) => {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AnthropometricProfile | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load saved profile on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        if (parsed.frontImage) setFrontImage(parsed.frontImage);
        if (parsed.sideImage) setSideImage(parsed.sideImage);
      }
    } catch (e) {
      console.warn('Failed to load anthropometric profile from storage', e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'side'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor sube un archivo de imagen válido (JPG, PNG o WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (type === 'front') setFrontImage(base64);
      else setSideImage(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!frontImage && !sideImage) {
      setError('Sube al menos una fotografía (idealmente frontal y lateral) para analizar las proporciones.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeAnthropometry(frontImage || '', sideImage || '');
      const fullProfile: AnthropometricProfile = {
        ...result,
        frontImage: frontImage || undefined,
        sideImage: sideImage || undefined,
        date: new Date().toISOString()
      };
      setProfile(fullProfile);
      try {
        const toSave = { ...fullProfile, frontImage: undefined, sideImage: undefined };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (e) {
        try { localStorage.clear(); } catch {}
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      if (onProfileUpdated) onProfileUpdated(fullProfile);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al procesar las imágenes con RT-DETR + ViTPose.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveManual = () => {
    if (!profile) return;
    try {
      const toSave = { ...profile, frontImage: undefined, sideImage: undefined };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      try { localStorage.clear(); } catch {}
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    if (onProfileUpdated) onProfileUpdated(profile);
  };

  // Helper for ratio comparison bars
  const renderRatioRow = (
    label: string,
    value: number,
    mean: number,
    description: string,
    interpretation: string
  ) => {
    const diffPct = Math.round(((value - mean) / mean) * 100);
    const diffSign = diffPct > 0 ? `+${diffPct}%` : `${diffPct}%`;
    const minScale = mean * 0.7;
    const maxScale = mean * 1.3;
    const clampedVal = Math.max(minScale, Math.min(maxScale, value));
    const userPct = ((clampedVal - minScale) / (maxScale - minScale)) * 100;
    const meanPct = ((mean - minScale) / (maxScale - minScale)) * 100;

    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-200">{label}</span>
            <span className="text-[11px] text-slate-400">({description})</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-cyan-400 font-bold">{value.toFixed(2)}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                Math.abs(diffPct) <= 5
                  ? 'bg-slate-800 text-slate-300'
                  : diffPct > 5
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                  : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
              }`}
            >
              {diffSign} vs media
            </span>
          </div>
        </div>

        {/* Comparative Bar with Marker */}
        <div className="relative w-full h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
          {/* User Value Bar */}
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${userPct}%` }}
          />
          {/* Mean marker line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)] z-10"
            style={{ left: `${meanPct}%` }}
            title={`Media poblacional: ${mean.toFixed(2)}`}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
          <span>Menor longitud</span>
          <span className="text-slate-400">Media ({mean.toFixed(2)})</span>
          <span>Mayor longitud</span>
        </div>

        <p className="text-[11px] text-slate-300 bg-slate-950/40 p-2 rounded border border-slate-800/60 leading-relaxed">
          💡 <span className="font-medium text-slate-200">{interpretation}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Pasaporte Biomecánico del Atleta
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-mono">
                  MÓDULO ANTROPOMÉTRICO
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Mapeo de proporciones óseas invariantes y adaptación automática de palancas
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo Upload Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Front Photo */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>1. Fotografía Frontal</span>
                <span className="text-[10px] text-slate-500 font-normal">Clavícula vs Pelvis</span>
              </label>
              <div className="relative group border-2 border-dashed border-slate-700 hover:border-cyan-500/70 rounded-xl bg-slate-950/40 p-4 transition flex flex-col items-center justify-center min-h-[160px]">
                {frontImage ? (
                  <div className="relative w-full flex flex-col items-center">
                    <img
                      src={frontImage}
                      alt="Front view"
                      className="max-h-36 object-contain rounded-lg border border-slate-800"
                    />
                    <button
                      onClick={() => setFrontImage(null)}
                      className="absolute top-1 right-1 p-1 bg-slate-900/80 text-rose-400 rounded-full hover:bg-slate-800"
                      title="Eliminar foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center space-y-2 text-center">
                    <Upload className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition" />
                    <span className="text-xs text-slate-400 font-medium">Subir foto frontal</span>
                    <span className="text-[10px] text-slate-600">De pie, brazos a los lados</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'front')}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Side Photo */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>2. Fotografía Lateral (Perfil)</span>
                <span className="text-[10px] text-slate-500 font-normal">Fémur, Tibia, Brazos vs Torso</span>
              </label>
              <div className="relative group border-2 border-dashed border-slate-700 hover:border-cyan-500/70 rounded-xl bg-slate-950/40 p-4 transition flex flex-col items-center justify-center min-h-[160px]">
                {sideImage ? (
                  <div className="relative w-full flex flex-col items-center">
                    <img
                      src={sideImage}
                      alt="Side view"
                      className="max-h-36 object-contain rounded-lg border border-slate-800"
                    />
                    <button
                      onClick={() => setSideImage(null)}
                      className="absolute top-1 right-1 p-1 bg-slate-900/80 text-rose-400 rounded-full hover:bg-slate-800"
                      title="Eliminar foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center space-y-2 text-center">
                    <Upload className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition" />
                    <span className="text-xs text-slate-400 font-medium">Subir foto de perfil</span>
                    <span className="text-[10px] text-slate-600">De pie, vista lateral limpia</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'side')}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-1">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!frontImage && !sideImage)}
              className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-900/30 transition transform active:scale-95"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Extrayendo keypoints con ViTPose...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>{profile ? 'Recalcular Proporciones' : 'Analizar Proporciones Antropométricas'}</span>
                </>
              )}
            </button>
          </div>

          {/* Results Display */}
          {profile && (
            <div className="space-y-4 pt-2 border-t border-slate-800 animate-fadeIn">
              {/* Archetype Badge Card */}
              <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-800/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono tracking-wider text-cyan-400 font-semibold uppercase">
                    Arquetipo Estructural Clasificado
                  </div>
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    <span>🦴</span>
                    <span>{profile.archetype}</span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl">
                    {profile.archetype_description}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={handleSaveManual}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Guardado!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Perfil</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Ratios Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Ratios Óseos Invariantes a la Perspectiva
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderRatioRow(
                    'Fémur / Torso',
                    profile.ratios.femur_to_torso,
                    profile.population_means.femur_to_torso,
                    'Longitud de muslo vs tronco',
                    profile.ratios.femur_to_torso > 0.88
                      ? 'Fémur largo: Requiere mayor inclinación de torso en sentadilla y es naturalmente dominante de cadera.'
                      : profile.ratios.femur_to_torso < 0.76
                      ? 'Fémur corto: Sentadilla profunda con torso muy vertical y menor momento flexor lumbar.'
                      : 'Proporción equilibrada entre cadena posterior y anterior.'
                  )}

                  {renderRatioRow(
                    'Tibia / Fémur',
                    profile.ratios.tibia_to_femur,
                    profile.population_means.tibia_to_femur,
                    'Longitud de pierna inferior vs muslo',
                    profile.ratios.tibia_to_femur > 0.92
                      ? 'Tibia larga: Facilita avance de rodilla y profundidad sin forzar dorsiflexión extrema.'
                      : 'Tibia en rango estándar: Excelente estabilidad en levantamientos de empuje de suelo.'
                  )}

                  {renderRatioRow(
                    'Brazo / Torso',
                    profile.ratios.arm_to_torso,
                    profile.population_means.arm_to_torso,
                    'Longitud total de extremidad superior',
                    profile.ratios.arm_to_torso > 1.18
                      ? 'Envergadura larga: Mayor palanca en peso muerto; en press de banca tolera mayor flexión humeral.'
                      : profile.ratios.arm_to_torso < 1.04
                      ? 'Brazos cortos: Trayectoria reducida en press de banca, palanca muy favorable para fuerza.'
                      : 'Longitud de palanca de empuje neutra.'
                  )}

                  {renderRatioRow(
                    'Clavícula / Pelvis',
                    profile.ratios.clavicle_to_pelvis,
                    profile.population_means.clavicle_to_pelvis,
                    'Anchura biacromial vs pelvis',
                    profile.ratios.clavicle_to_pelvis > 1.42
                      ? 'Estructura en V amplia: Mayor brazo de momento lateral en jalones y remos.'
                      : 'Estructura estrecha/compacta: Óptima alineación articular directa sin estrés glenohumeral.'
                  )}
                </div>
              </div>

              {/* Threshold Adaptation Details */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Adaptación Biomecánica en el Análisis de Vídeo
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Este pasaporte se adjunta automáticamente en cada análisis de vídeo. El motor ajustará las alertas técnicas (tolerando{' '}
                  <span className="text-slate-200 font-mono">
                    +{profile.custom_thresholds?.squat_torso_tolerance_deg || 0}°
                  </span>{' '}
                  de inclinación en sentadilla/RDL o{' '}
                  <span className="text-slate-200 font-mono">
                    +{profile.custom_thresholds?.press_elbow_depth_deg || 0}°
                  </span>{' '}
                  en press), evitando falsas alertas generadas por tu estructura ósea natural.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Zero-Storage: Datos guardados localmente en este dispositivo</span>
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
export default AnthropometricProfileModal;
