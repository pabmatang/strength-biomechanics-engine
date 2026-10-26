import React, { useState, useMemo } from 'react';
import { Search, X, Dumbbell, Filter, Sparkles, Building2, Plus, ZoomIn, Star } from 'lucide-react';
import { EXERCISE_DATABASE } from '../data/exercises';
import { ExerciseTemplate, MuscleGroup, GymBrand } from '../types/workout';
import { CreateCustomExerciseModal } from './CreateCustomExerciseModal';
import { ImageLightboxModal } from './ImageLightboxModal';
import { getSafeMachineImageUrl } from '../utils/machineImages';

interface ExerciseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: ExerciseTemplate) => void;
}

const BRANDS: { key: string; label: string }[] = [
  { key: 'my_gym', label: 'Mi Gimnasio' },
  { key: 'all', label: 'Todos' },
  { key: 'cable', label: 'Poleas / Cables' },
  { key: 'dumbbell', label: 'Mancuernas' },
  { key: 'smith', label: 'Multipower / Smith' },
  { key: 'Technogym', label: 'Technogym' },
  { key: 'Hammer Strength', label: 'Hammer Strength' },
  { key: 'Panatta', label: 'Panatta' },
  { key: 'Matrix', label: 'Matrix' },
  { key: 'Life Fitness', label: 'Life Fitness' },
  { key: 'Eleiko', label: 'Eleiko' },
  { key: 'General', label: 'Peso Libre / General' }
];

const MUSCLE_LABELS: Record<string, string> = {
  all: 'Todos los músculos',
  chest: 'Pecho',
  lats: 'Dorsales',
  upper_back: 'Espalda Alta / Media',
  lower_back: 'Espalda Baja / Lumbares',
  shoulders: 'Hombros',
  quadriceps: 'Cuádriceps',
  hamstrings: 'Isquios / Femoral',
  glutes: 'Glúteos / Cadera',
  adductors: 'Aductores (Cerrar piernas)',
  abductors: 'Abductores (Abrir piernas)',
  calves: 'Gemelos',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  abdominals: 'Abdomen',
  cardio: 'Cardio & Resistencia'
};

export const ExerciseSelectorModal: React.FC<ExerciseSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState<{
    imageUrl: string;
    title: string;
    brand?: string;
    muscleGroup?: string;
  } | null>(null);
  const [customList, setCustomList] = useState<ExerciseTemplate[]>(() => {
    const saved = localStorage.getItem('mia_custom_exercises');
    return saved ? JSON.parse(saved) : [];
  });

  const handleCreateCustom = (newTemplate: ExerciseTemplate) => {
    const updated = [newTemplate, ...customList];
    setCustomList(updated);
    localStorage.setItem('mia_custom_exercises', JSON.stringify(updated));
    onSelect(newTemplate);
    onClose();
  };

  const allExercises = useMemo(() => {
    return [...customList, ...EXERCISE_DATABASE];
  }, [customList]);

  const userGymBrands: string[] = useMemo(() => {
    const raw = localStorage.getItem('mia_app_settings');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.gym_brands && parsed.gym_brands.length > 0) return parsed.gym_brands;
      } catch {}
    }
    return ['Technogym', 'Hammer Strength'];
  }, []);

  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => {
      const matchesSearch = ex.title.toLowerCase().includes(search.toLowerCase()) ||
        ex.description?.toLowerCase().includes(search.toLowerCase()) ||
        ex.brand?.toLowerCase().includes(search.toLowerCase());
      
      let matchesBrand = false;
      if (selectedBrand === 'all') {
        matchesBrand = true;
      } else if (selectedBrand === 'my_gym') {
        matchesBrand = userGymBrands.includes(ex.brand || '');
      } else if (selectedBrand === 'cable') {
        matchesBrand = ex.equipment_category === 'cable';
      } else if (selectedBrand === 'dumbbell') {
        matchesBrand = ex.equipment_category === 'dumbbell';
      } else if (selectedBrand === 'smith') {
        matchesBrand = ex.equipment_category === 'smith' || ex.title.toLowerCase().includes('smith') || ex.title.toLowerCase().includes('multipower');
      } else {
        matchesBrand = ex.brand === selectedBrand;
      }

      const matchesMuscle = selectedMuscle === 'all' || ex.muscle_group === selectedMuscle;
      return matchesSearch && matchesBrand && matchesMuscle;
    });
  }, [allExercises, search, selectedBrand, selectedMuscle, userGymBrands]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-2xl bg-[#12141e] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-full overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Catálogo de Máquinas & Ejercicios</h2>
              <p className="text-xs text-slate-400">Technogym, Hammer Strength, Matrix, Mancuernas & Peso Libre</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition"
              title="Crear un ejercicio propio con mancuernas, barra o peso libre"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Crear Propio</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-[#181a28]/50">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar máquina o ejercicio (ej. Pure Pulldown, Hack Squat, Chest Press...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#12141e] border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              autoFocus
            />
          </div>

          {/* Brand Filter Chips */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Marca / Fabricante:</div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {BRANDS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedBrand(key)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition flex items-center gap-1.5 ${
                    selectedBrand === key
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {key === 'my_gym' && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Muscle Category Filter Chips */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Grupo Muscular:</div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {Object.entries(MUSCLE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedMuscle(key)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition ${
                    selectedMuscle === key
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-800/50">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Filter className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No se encontraron máquinas ni ejercicios con estos filtros.</p>
            </div>
          ) : (
            filteredExercises.map(ex => (
              <div
                key={ex.id}
                onClick={() => {
                  onSelect(ex);
                  onClose();
                }}
                className="pt-2 first:pt-0 cursor-pointer group"
              >
                <div className="p-3.5 rounded-2xl bg-transparent hover:bg-slate-800/60 transition flex items-center justify-between gap-4 border border-transparent hover:border-slate-700/50">
                  {(() => {
                    const safeUrl = getSafeMachineImageUrl(ex.id, ex.muscle_group, ex.image_url, ex.brand);
                    return (
                      <div className="flex items-center gap-3">
                        {/* Machine Photo with Lightbox Zoom Trigger */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxData({
                              imageUrl: safeUrl,
                              title: ex.title,
                              brand: ex.brand,
                              muscleGroup: MUSCLE_LABELS[ex.muscle_group] || ex.muscle_group
                            });
                          }}
                          className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 relative group/img cursor-zoom-in"
                          title="Haz click para ver la foto de la máquina en grande y alta calidad"
                        >
                          <img
                            src={safeUrl}
                            alt={ex.title}
                            className="w-full h-full object-cover group-hover/img:scale-110 transition duration-300"
                            onError={(e) => {
                              e.currentTarget.src = '/machines/technogym_pure_chest_press.jpg';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center">
                            <ZoomIn className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.2 rounded bg-blue-500/20 text-blue-400 font-bold font-mono">
                              {ex.brand || 'General'}
                            </span>
                            {ex.resistance_profile && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-mono font-bold border border-amber-500/30">
                                ★ {ex.resistance_profile.rating}
                              </span>
                            )}
                            {ex.model_series && (
                              <span className="text-[10px] text-slate-400 hidden sm:inline">
                                {ex.model_series}
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-sm text-slate-100 group-hover:text-blue-400 transition">
                            {ex.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="capitalize px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {MUSCLE_LABELS[ex.muscle_group] || ex.muscle_group}
                            </span>
                            {ex.resistance_profile?.curve_label && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                {ex.resistance_profile.curve_label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="text-xs px-3.5 py-2 rounded-xl bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white font-bold transition flex-shrink-0">
                    Añadir
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Custom Exercise Creator Modal */}
        <CreateCustomExerciseModal
          isOpen={isCustomModalOpen}
          onClose={() => setIsCustomModalOpen(false)}
          onCreate={handleCreateCustom}
        />

        {/* High-Resolution Fullscreen Lightbox Modal */}
        {lightboxData && (
          <ImageLightboxModal
            isOpen={true}
            onClose={() => setLightboxData(null)}
            imageUrl={lightboxData.imageUrl}
            title={lightboxData.title}
            brand={lightboxData.brand}
            muscleGroup={lightboxData.muscleGroup}
          />
        )}

      </div>
    </div>
  );
};
