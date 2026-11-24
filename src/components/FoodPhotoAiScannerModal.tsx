import React, { useState } from 'react';
import {
  X, Camera, Upload, Plus, Minus, Trash2,
  Flame, AlertTriangle, Check, Info
} from 'lucide-react';
import { MealType, LoggedFoodItem } from '../types/workout';
import { MEAL_TYPE_CONFIG } from '../data/spanishFoodDatabase';

interface FoodPhotoAiScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMeal: MealType;
  onAddFoods: (meal: MealType, foods: LoggedFoodItem[]) => void;
}

interface DetectedIngredient {
  id: string;
  name: string;
  estimatedGrams: number;
  baseCaloriesPer100g: number;
  baseProteinPer100g: number;
  baseCarbsPer100g: number;
  baseFatPer100g: number;
}

/**
 * Curated example dishes. Their ingredients and macros are fixed data shipped
 * with the app; they are NOT the output of a vision model.
 */
const SAMPLE_DISHES = [
  {
    id: 'dish_chicken_rice',
    title: 'Pechuga de Pollo con Arroz Basmati & Aguacate',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    description: 'Plato balanceado post-entreno con alta proteína y carbohidratos limpios.',
    ingredients: [
      { id: 'ing_1', name: 'Pechuga de pollo a la plancha', estimatedGrams: 180, baseCaloriesPer100g: 165, baseProteinPer100g: 31, baseCarbsPer100g: 0, baseFatPer100g: 3.6 },
      { id: 'ing_2', name: 'Arroz blanco Basmati cocido', estimatedGrams: 200, baseCaloriesPer100g: 130, baseProteinPer100g: 2.7, baseCarbsPer100g: 28.2, baseFatPer100g: 0.3 },
      { id: 'ing_3', name: 'Aguacate Hass', estimatedGrams: 60, baseCaloriesPer100g: 160, baseProteinPer100g: 2.0, baseCarbsPer100g: 8.5, baseFatPer100g: 14.7 },
      { id: 'ing_4', name: 'Aceite de oliva virgen extra (AOVE)', estimatedGrams: 8, baseCaloriesPer100g: 884, baseProteinPer100g: 0, baseCarbsPer100g: 0, baseFatPer100g: 100 }
    ]
  },
  {
    id: 'dish_salmon_potatoes',
    title: 'Salmón Fresco al Horno con Patata Cocida & Espárragos',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
    description: 'Rico en ácidos grasos Omega-3 y micronutrientes esenciales.',
    ingredients: [
      { id: 'ing_5', name: 'Lomo de salmón fresco', estimatedGrams: 180, baseCaloriesPer100g: 208, baseProteinPer100g: 20, baseCarbsPer100g: 0, baseFatPer100g: 13 },
      { id: 'ing_6', name: 'Patatas cocidas con piel', estimatedGrams: 220, baseCaloriesPer100g: 86, baseProteinPer100g: 2, baseCarbsPer100g: 20, baseFatPer100g: 0.1 },
      { id: 'ing_7', name: 'Espárragos verdes a la plancha', estimatedGrams: 100, baseCaloriesPer100g: 20, baseProteinPer100g: 2.2, baseCarbsPer100g: 3.9, baseFatPer100g: 0.1 },
      { id: 'ing_8', name: 'Aceite de oliva virgen extra', estimatedGrams: 10, baseCaloriesPer100g: 884, baseProteinPer100g: 0, baseCarbsPer100g: 0, baseFatPer100g: 100 }
    ]
  },
  {
    id: 'dish_oatmeal_bowl',
    title: 'Bowl de Avena con Proteína Whey, Plátano & Arándanos',
    imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80',
    description: 'Desayuno o merienda anabólica de absorción gradual.',
    ingredients: [
      { id: 'ing_9', name: 'Copos de avena integral', estimatedGrams: 80, baseCaloriesPer100g: 375, baseProteinPer100g: 13.5, baseCarbsPer100g: 60, baseFatPer100g: 7 },
      { id: 'ing_10', name: 'Proteína Whey Isolate', estimatedGrams: 30, baseCaloriesPer100g: 380, baseProteinPer100g: 82, baseCarbsPer100g: 5, baseFatPer100g: 3 },
      { id: 'ing_11', name: 'Plátano maduro en rodajas', estimatedGrams: 100, baseCaloriesPer100g: 89, baseProteinPer100g: 1.1, baseCarbsPer100g: 22.8, baseFatPer100g: 0.3 },
      { id: 'ing_12', name: 'Arándanos silvestres frescos', estimatedGrams: 50, baseCaloriesPer100g: 57, baseProteinPer100g: 0.7, baseCarbsPer100g: 14.5, baseFatPer100g: 0.3 }
    ]
  },
  {
    id: 'dish_eggs_toast',
    title: 'Huevos Revueltos, Tostadas de Centeno & Aceite AOVE',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    description: 'Desayuno rico en colina, proteínas biodisponibles y grasas saludables.',
    ingredients: [
      { id: 'ing_13', name: 'Huevos enteros (3 unidades)', estimatedGrams: 180, baseCaloriesPer100g: 143, baseProteinPer100g: 12.6, baseCarbsPer100g: 0.7, baseFatPer100g: 9.5 },
      { id: 'ing_14', name: 'Pan tostado 100% centeno', estimatedGrams: 80, baseCaloriesPer100g: 250, baseProteinPer100g: 8.5, baseCarbsPer100g: 48, baseFatPer100g: 1.8 },
      { id: 'ing_15', name: 'Aceite de oliva virgen extra', estimatedGrams: 10, baseCaloriesPer100g: 884, baseProteinPer100g: 0, baseCarbsPer100g: 0, baseFatPer100g: 100 }
    ]
  }
];

export const FoodPhotoAiScannerModal: React.FC<FoodPhotoAiScannerModalProps> = ({
  isOpen,
  onClose,
  targetMeal,
  onAddFoods
}) => {
  const [selectedMeal, setSelectedMeal] = useState<MealType>(targetMeal);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedOwnPhoto, setUploadedOwnPhoto] = useState(false);
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[] | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
      setUploadedOwnPhoto(true);
      setSelectedSampleId(null);
      setDetectedIngredients(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof SAMPLE_DISHES[0]) => {
    setPhotoPreview(sample.imageUrl);
    setUploadedOwnPhoto(false);
    setSelectedSampleId(sample.id);
    setDetectedIngredients(sample.ingredients.map(ingredient => ({ ...ingredient })));
  };

  const handleAdjustGrams = (id: string, delta: number) => {
    if (!detectedIngredients) return;
    setDetectedIngredients(prev =>
      prev!.map(ing => {
        if (ing.id === id) {
          const next = Math.max(5, ing.estimatedGrams + delta);
          return { ...ing, estimatedGrams: next };
        }
        return ing;
      })
    );
  };

  const handleDeleteIngredient = (id: string) => {
    if (!detectedIngredients) return;
    setDetectedIngredients(prev => prev!.filter(ing => ing.id !== id));
  };

  const totalCalories = detectedIngredients
    ? Math.round(detectedIngredients.reduce((sum, ing) => sum + (ing.estimatedGrams * ing.baseCaloriesPer100g) / 100, 0))
    : 0;

  const totalProtein = detectedIngredients
    ? Math.round(detectedIngredients.reduce((sum, ing) => sum + (ing.estimatedGrams * ing.baseProteinPer100g) / 100, 0) * 10) / 10
    : 0;

  const totalCarbs = detectedIngredients
    ? Math.round(detectedIngredients.reduce((sum, ing) => sum + (ing.estimatedGrams * ing.baseCarbsPer100g) / 100, 0) * 10) / 10
    : 0;

  const totalFat = detectedIngredients
    ? Math.round(detectedIngredients.reduce((sum, ing) => sum + (ing.estimatedGrams * ing.baseFatPer100g) / 100, 0) * 10) / 10
    : 0;

  const selectedSample = SAMPLE_DISHES.find(dish => dish.id === selectedSampleId) ?? null;

  const handleConfirmAndAdd = () => {
    if (!detectedIngredients || detectedIngredients.length === 0) return;

    const foods: LoggedFoodItem[] = detectedIngredients.map(ing => {
      const cals = Math.round((ing.estimatedGrams * ing.baseCaloriesPer100g) / 100);
      const prot = Math.round(((ing.estimatedGrams * ing.baseProteinPer100g) / 100) * 10) / 10;
      const carb = Math.round(((ing.estimatedGrams * ing.baseCarbsPer100g) / 100) * 10) / 10;
      const fat = Math.round(((ing.estimatedGrams * ing.baseFatPer100g) / 100) * 10) / 10;

      return {
        id: `food_photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        food_id: ing.id,
        name: `${ing.name} (~${ing.estimatedGrams}g)`,
        grams: ing.estimatedGrams,
        calories: cals,
        protein: prot,
        carbs: carb,
        fat: fat
      };
    });

    onAddFoods(selectedMeal, foods);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-xl bg-[#12141e] border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl text-white space-y-4 max-h-full flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Comidas de Ejemplo</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Catálogo local
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Carga los ingredientes y macros de un plato de ejemplo
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">

          {/* Meal Target Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Asignar a la comida:
            </label>
            <div className="flex gap-1.5 p-1 bg-[#181a28] rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
              {MEAL_TYPE_CONFIG.map(cfg => (
                <button
                  key={cfg.type}
                  type="button"
                  onClick={() => setSelectedMeal(cfg.type)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    selectedMeal === cfg.type
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cfg.label.split(' / ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Upload preview */}
          <div className="grid grid-cols-2 gap-2.5">
            <label className="p-3.5 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border border-blue-500/40 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition text-center shadow-md">
              <Camera className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-bold text-white">Hacer Foto con Cámara</span>
              <span className="text-[10px] text-slate-400">Solo vista previa</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <label className="p-3.5 bg-[#181a28] hover:bg-[#202026] border border-slate-700/80 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition text-center shadow-md">
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-xs font-bold text-slate-200">Subir desde Galería</span>
              <span className="text-[10px] text-slate-400">Solo vista previa</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {uploadedOwnPhoto && photoPreview && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  El reconocimiento de comida a partir de una foto propia <b>no está implementado</b>.
                  La imagen solo se muestra como vista previa: elige un plato de ejemplo o registra los
                  alimentos manualmente desde la pantalla de nutrición.
                </span>
              </div>
              <img
                src={photoPreview}
                alt="Vista previa de tu foto"
                className="w-full h-32 object-cover rounded-xl border border-amber-500/20"
              />
            </div>
          )}

          {/* Sample dishes */}
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-semibold">
              Platos de ejemplo incluidos en la app:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_DISHES.map(dish => (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => handleSelectSample(dish)}
                  className={`relative rounded-xl overflow-hidden border-2 text-left p-1 transition ${
                    selectedSampleId === dish.id
                      ? 'border-blue-500 ring-2 ring-blue-500/30'
                      : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={dish.imageUrl} alt={dish.title} className="w-full h-16 object-cover rounded-lg" />
                  <div className="mt-1 px-1">
                    <div className="text-[10px] font-bold text-slate-200 truncate">{dish.title}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Example result */}
          {detectedIngredients && !uploadedOwnPhoto && (
            <div className="space-y-3.5 bg-[#18181c] border border-white/[0.08] p-4 rounded-2xl animate-in fade-in">

              <div className="p-2 bg-amber-500/10 border border-amber-500/40 rounded-lg text-[11px] text-amber-300 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Ejemplo ilustrativo: los ingredientes, pesos y macros pertenecen a la receta de muestra
                  «{selectedSample?.title}», no a un análisis de imagen.
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <div className="text-sm font-black text-white">Estimación nutricional del ejemplo</div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-white tabular-nums">{totalCalories}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">kcal totales</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#121215] p-2 rounded-xl border border-white/[0.04]">
                  <div className="text-[10px] font-bold text-blue-400 uppercase">Proteína</div>
                  <div className="text-base font-black text-white tabular-nums mt-0.5">{totalProtein}g</div>
                </div>
                <div className="bg-[#121215] p-2 rounded-xl border border-white/[0.04]">
                  <div className="text-[10px] font-bold text-amber-400 uppercase">Carbohidratos</div>
                  <div className="text-base font-black text-white tabular-nums mt-0.5">{totalCarbs}g</div>
                </div>
                <div className="bg-[#121215] p-2 rounded-xl border border-white/[0.04]">
                  <div className="text-[10px] font-bold text-rose-400 uppercase">Grasas</div>
                  <div className="text-base font-black text-white tabular-nums mt-0.5">{totalFat}g</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Ingredientes del ejemplo (puedes ajustar el peso):
                </div>

                {detectedIngredients.map(ing => {
                  const ingCalories = Math.round((ing.estimatedGrams * ing.baseCaloriesPer100g) / 100);
                  const ingProtein = Math.round(((ing.estimatedGrams * ing.baseProteinPer100g) / 100) * 10) / 10;

                  return (
                    <div
                      key={ing.id}
                      className="p-2.5 bg-[#121215] border border-white/[0.04] rounded-xl flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white truncate">{ing.name}</div>
                        <div className="text-[11px] text-slate-400 tabular-nums">
                          {ingCalories} kcal · {ingProtein}g P
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAdjustGrams(ing.id, -10)}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                          title="Restar 10g"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="text-xs font-bold tabular-nums min-w-[42px] text-center text-white">
                          {ing.estimatedGrams}g
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAdjustGrams(ing.id, 10)}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                          title="Sumar 10g"
                        >
                          <Plus className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteIngredient(ing.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition ml-1"
                          title="Eliminar alimento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            Cancelar
          </button>

          {detectedIngredients && detectedIngredients.length > 0 ? (
            <button
              type="button"
              onClick={handleConfirmAndAdd}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Añadir {detectedIngredients.length} alimentos de ejemplo</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 bg-slate-800 text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed"
            >
              Elige un plato de ejemplo
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
