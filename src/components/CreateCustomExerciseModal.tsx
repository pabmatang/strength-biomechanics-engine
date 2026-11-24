import React, { useState, useRef } from 'react';
import { X, Plus, Dumbbell, Sparkles, Check, Image as ImageIcon, Upload, Wand2, Camera } from 'lucide-react';
import { ExerciseTemplate, MuscleGroup, EquipmentCategory, ExerciseType } from '../types/workout';

interface CreateCustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (exercise: ExerciseTemplate) => void;
}

const MUSCLE_OPTIONS: { key: MuscleGroup; label: string }[] = [
  { key: 'chest', label: 'Pecho' },
  { key: 'lats', label: 'Dorsales' },
  { key: 'upper_back', label: 'Espalda Alta / Romboides' },
  { key: 'shoulders', label: 'Hombros' },
  { key: 'biceps', label: 'Bíceps' },
  { key: 'triceps', label: 'Tríceps' },
  { key: 'quadriceps', label: 'Cuádriceps' },
  { key: 'hamstrings', label: 'Isquiosurales' },
  { key: 'glutes', label: 'Glúteos' },
  { key: 'calves', label: 'Gemelos' },
  { key: 'abductors', label: 'Abductores' },
  { key: 'adductors', label: 'Aductores' },
  { key: 'abdominals', label: 'Abdominales' },
  { key: 'cardio', label: 'Cardio' }
];

const EQUIPMENT_OPTIONS: { key: EquipmentCategory; label: string }[] = [
  { key: 'dumbbell', label: 'Mancuernas' },
  { key: 'barbell', label: 'Barra Olímpica' },
  { key: 'cable', label: 'Polea' },
  { key: 'machine', label: 'Máquina' },
  { key: 'none', label: 'Peso Corporal / Libre' },
  { key: 'cardio_machine', label: 'Máquina de Cardio' },
  { key: 'kettlebell', label: 'Kettlebell / Pesa Rusa' }
];

export const CreateCustomExerciseModal: React.FC<CreateCustomExerciseModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('General');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('chest');
  const [equipmentCategory, setEquipmentCategory] = useState<EquipmentCategory>('dumbbell');
  const [description, setDescription] = useState('');
  const [setupTip, setSetupTip] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processAndRemoveBackground = (file: File) => {
    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setImageUrl(src);
          setIsProcessingImage(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Smooth color-distance thresholding to create alpha transparency
        // Removes pure white and near-white gym catalogue background while preserving metallic gray edges
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          const brightness = (r + g + b) / 3;
          const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
          
          if (brightness > 245 && maxDiff < 15) {
            data[i + 3] = 0; // Pure transparent
          } else if (brightness > 225 && maxDiff < 20) {
            // Feather edge
            const alpha = Math.round(((245 - brightness) / 20) * 255);
            data[i + 3] = Math.min(data[i + 3], alpha);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentPng = canvas.toDataURL('image/png');
        setImageUrl(transparentPng);
        setIsProcessingImage(false);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) return;

    const isCardio = muscleGroup === 'cardio' || equipmentCategory === 'cardio_machine';
    const exerciseType: ExerciseType = isCardio ? 'cardio_incline' : 'weight_reps';

    const defaultImg = equipmentCategory === 'dumbbell'
      ? 'https://media.eleiko.com/images/upload/4x5/3062962-03_10.jpg'
      : equipmentCategory === 'barbell'
      ? 'https://media.eleiko.com/images/upload/4x5/3065208-03_10.jpg'
      : 'https://www.technogym.com/es-INT/feed/images/MG05/pure-strength-chest-press_MG05_grey.jpg';

    const newTemplate: ExerciseTemplate = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      brand: 'General',
      muscle_group: muscleGroup,
      equipment_category: equipmentCategory,
      exercise_type: exerciseType,
      description: description.trim() || 'Ejercicio personalizado creado por el usuario.',
      setup_tips: setupTip.trim() ? [setupTip.trim()] : ['Mantén una técnica estricta con control de la fase excéntrica.'],
      image_url: imageUrl.trim() || defaultImg,
      is_custom: true
    };

    onCreate(newTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-lg bg-[#12141e] border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl text-white space-y-4 max-h-full flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl flex-shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">Crear Ejercicio Propio</h2>
              <p className="text-xs text-slate-400 truncate">Añade mancuernas, peso libre o poleas</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition"
              title="Guardar ejercicio"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
          
          {/* Title */}
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Nombre del Ejercicio *
            </label>
            <input
              type="text"
              placeholder="ej. Press Francés con Mancuernas en Banco Plano"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
              autoFocus
            />
          </div>

          {/* Muscle Group & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Músculo Principal
              </label>
              <select
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
                className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                {MUSCLE_OPTIONS.map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Tipo de Equipamiento
              </label>
              <select
                value={equipmentCategory}
                onChange={(e) => setEquipmentCategory(e.target.value as EquipmentCategory)}
                className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                {EQUIPMENT_OPTIONS.map(eq => (
                  <option key={eq.key} value={eq.key}>{eq.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Descripción o Enfoque (Opcional)
            </label>
            <input
              type="text"
              placeholder="ej. Máximo estiramiento de la porción larga del tríceps"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Setup Tip */}
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Tip de Técnica o Regulación (Opcional)
            </label>
            <input
              type="text"
              placeholder="ej. Mantener los codos cerrados y bajar detrás de la coronilla"
              value={setupTip}
              onChange={(e) => setSetupTip(e.target.value)}
              className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Image & Background Removal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-slate-400 block text-xs">
                Foto de la Máquina / Ejercicio
              </label>
              <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-semibold">
                <Wand2 className="w-3 h-3" />
                <span>Recorte Transparente Automático</span>
              </span>
            </div>

            {/* Upload or Camera Capture Button */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processAndRemoveBackground(file);
              }}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 active:scale-98"
              >
                {isProcessingImage ? <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <Camera className="w-3.5 h-3.5" />}
                <span>{isProcessingImage ? 'Recortando fondo blanco...' : 'Subir o Hacer Foto (Móvil)'}</span>
              </button>

              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition"
                  title="Eliminar foto"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* URL input fallback */}
            <div className="relative">
              <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="url"
                placeholder="O pega una URL de imagen..."
                value={imageUrl.startsWith('data:') ? '(Foto con fondo transparente recortado)' : imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                readOnly={imageUrl.startsWith('data:')}
                className="w-full bg-[#181a28] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Live Transparent Spotlight Preview Card */}
            {imageUrl && (
              <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gradient-to-b from-slate-900/90 via-[#0d101d] to-[#0a0c16] border border-slate-800 flex items-center justify-center p-2">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18)_0%,transparent_70%)] pointer-events-none" />
                <img
                  src={imageUrl}
                  alt="Vista previa"
                  className="w-full h-full object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.6)]"
                />
                <span className="absolute bottom-1.5 right-2 text-[9px] font-bold text-emerald-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur">
                  ✓ Silueta limpia con halo radial
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Ejercicio</span>
          </button>
        </div>

      </div>
    </div>
  );
};
