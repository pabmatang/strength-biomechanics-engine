import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, Plus, Mic, MicOff, Search, Trash2, Calendar, Check, 
  ChevronRight, Sparkles, Utensils, Apple, Info, AlertCircle, ArrowRight,
  Barcode, UtensilsCrossed, ShoppingCart, Beef, Milk, Wheat, Droplets, Zap, Layers, Star, X, Loader2,
  Sunrise, Sun, Moon, Camera
} from 'lucide-react';
import { DailyMealPlan, LoggedFoodItem, MealType, FoodItem, MealBucket } from '../types/workout';
import { SPANISH_FOOD_DATABASE, MEAL_TYPE_CONFIG } from '../data/spanishFoodDatabase';
import { parseFoodVoiceInput, VoiceParsingResponse } from '../utils/voiceFoodParser';
import { searchOpenFoodFacts } from '../utils/openFoodFacts';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { FoodPhotoAiScannerModal } from './FoodPhotoAiScannerModal';

interface FatSecretNutritionScreenProps {
  currentWeightKg: number;
  onUpdateDailyCalories?: (calories: number, protein: number, carbs: number, fat: number) => void;
}

const WEEKDAYS = [
  { key: '2026-10-19', label: 'Lunes', short: 'L', type: 'training' },
  { key: '2026-10-20', label: 'Martes', short: 'M', type: 'training' },
  { key: '2026-10-21', label: 'Miércoles (Hoy)', short: 'X', type: 'training' },
  { key: '2026-10-22', label: 'Jueves', short: 'J', type: 'rest' },
  { key: '2026-10-23', label: 'Viernes', short: 'V', type: 'training' },
  { key: '2026-10-24', label: 'Sábado', short: 'S', type: 'rest' },
  { key: '2026-10-25', label: 'Domingo', short: 'D', type: 'rest' }
];

export const FatSecretNutritionScreen: React.FC<FatSecretNutritionScreenProps> = ({
  currentWeightKg,
  onUpdateDailyCalories
}) => {
  const [selectedDate, setSelectedDate] = useState('2026-10-21');
  const [targetCalories, setTargetCalories] = useState(2250);
  const [targetProtein, setTargetProtein] = useState(Math.round(currentWeightKg * 2.2)); // 2.2g / kg
  const [targetCarbs, setTargetCarbs] = useState(230);
  const [targetFat, setTargetFat] = useState(65);

  // Meal Diary State organized by Day
  const [mealPlans, setMealPlans] = useState<Record<string, DailyMealPlan>>(() => {
    const raw = localStorage.getItem('mia_fatsecret_meals');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    // Default initial meals for today
    return {
      '2026-10-21': {
        date: '2026-10-21',
        target_calories: 2250,
        target_protein: 175,
        target_carbs: 230,
        target_fat: 65,
        meals: [
          {
            meal_type: 'breakfast',
            label: 'Desayuno',
            foods: [
              { id: 'm1', food_id: 'food_oats_rolled', name: 'Copos de Avena integral (80g)', grams: 80, calories: 300, protein: 10.8, carbs: 48, fat: 5.6 },
              { id: 'm2', food_id: 'food_whey_protein', name: 'Proteína Whey (1 cazo - 30g)', grams: 30, calories: 114, protein: 24.5, carbs: 1.5, fat: 0.9 },
              { id: 'm3', food_id: 'food_blueberries', name: 'Arándanos silvestres (60g)', grams: 60, calories: 34, protein: 0.4, carbs: 8.7, fat: 0.2 }
            ]
          },
          {
            meal_type: 'mid_morning',
            label: 'Almuerzo / Media Mañana',
            foods: [
              { id: 'm4', food_id: 'food_banana', name: 'Plátano de Canarias (120g)', grams: 120, calories: 107, protein: 1.3, carbs: 27.4, fat: 0.4 },
              { id: 'm5', food_id: 'food_walnuts', name: 'Nueces naturales (20g)', grams: 20, calories: 130, protein: 3.0, carbs: 2.7, fat: 13.0 }
            ]
          },
          {
            meal_type: 'lunch',
            label: 'Comida Principal',
            foods: [
              { id: 'm6', food_id: 'food_chicken_breast', name: 'Pechuga de Pollo (200g)', grams: 200, calories: 330, protein: 62.0, carbs: 0.0, fat: 7.2 },
              { id: 'm7', food_id: 'food_white_rice', name: 'Arroz blanco Basmati cocido (200g)', grams: 200, calories: 260, protein: 5.4, carbs: 56.4, fat: 0.6 },
              { id: 'm8', food_id: 'food_olive_oil_extra', name: 'Aceite de Oliva AOVE (10g)', grams: 10, calories: 88, protein: 0.0, carbs: 0.0, fat: 10.0 }
            ]
          },
          {
            meal_type: 'snack',
            label: 'Merienda',
            foods: [
              { id: 'm9', food_id: 'food_cottage_cheese_zero', name: 'Queso fresco batido 0% (200g)', grams: 200, calories: 92, protein: 17.0, carbs: 7.0, fat: 0.2 }
            ]
          },
          {
            meal_type: 'dinner',
            label: 'Cena',
            foods: [
              { id: 'm10', food_id: 'food_salmon_fresh', name: 'Salmón fresco al horno (180g)', grams: 180, calories: 374, protein: 36.0, carbs: 0.0, fat: 23.4 },
              { id: 'm11', food_id: 'food_potatoes_boiled', name: 'Patata cocida (200g)', grams: 200, calories: 172, protein: 4.0, carbs: 39.0, fat: 0.2 }
            ]
          }
        ]
      }
    };
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('mia_fatsecret_meals', JSON.stringify(mealPlans));
  }, [mealPlans]);

  // Current day meal plan
  const currentPlan: DailyMealPlan = mealPlans[selectedDate] || {
    date: selectedDate,
    target_calories: targetCalories,
    target_protein: targetProtein,
    target_carbs: targetCarbs,
    target_fat: targetFat,
    meals: MEAL_TYPE_CONFIG.map(cfg => ({
      meal_type: cfg.type,
      label: cfg.label,
      foods: []
    }))
  };

  // Calculate totals for selected date
  const allFoods = currentPlan.meals.flatMap(m => m.foods);
  const totalCalories = allFoods.reduce((sum, f) => sum + f.calories, 0);
  const totalProtein = Math.round(allFoods.reduce((sum, f) => sum + f.protein, 0));
  const totalCarbs = Math.round(allFoods.reduce((sum, f) => sum + f.carbs, 0));
  const totalFat = Math.round(allFoods.reduce((sum, f) => sum + f.fat, 0));
  const remainingCalories = targetCalories - totalCalories;

  // Sync with parent tracker if available
  useEffect(() => {
    if (selectedDate === '2026-10-21' && onUpdateDailyCalories) {
      onUpdateDailyCalories(totalCalories, totalProtein, totalCarbs, totalFat);
    }
  }, [totalCalories, totalProtein, totalCarbs, totalFat, selectedDate]);

  // Voice AI Modal State
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceInputText, setVoiceInputText] = useState('');
  const [parsedVoiceResult, setParsedVoiceResult] = useState<VoiceParsingResponse | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Manual Food Search Modal State
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isPhotoAiModalOpen, setIsPhotoAiModalOpen] = useState(false);
  const [onlineOffFoods, setOnlineOffFoods] = useState<FoodItem[]>([]);
  const [isSearchingOff, setIsSearchingOff] = useState(false);
  const [targetMealType, setTargetMealType] = useState<MealType>('lunch');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [servingGramsInput, setServingGramsInput] = useState<number>(100);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCustomFoodModalOpen, setIsCustomFoodModalOpen] = useState(false);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>(() => {
    try {
      const raw = localStorage.getItem('chance_custom_foods');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Custom food form state
  const [cfName, setCfName] = useState('');
  const [cfBrand, setCfBrand] = useState('');
  const [cfGrams, setCfGrams] = useState(100);
  const [cfCalories, setCfCalories] = useState<number | ''>('');
  const [cfProtein, setCfProtein] = useState<number | ''>('');
  const [cfCarbs, setCfCarbs] = useState<number | ''>('');
  const [cfFat, setCfFat] = useState<number | ''>('');
  const [cfCategory, setCfCategory] = useState<FoodItem['category']>('other');

  const handleSaveCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfName.trim() || cfCalories === '') return;
    const newFood: FoodItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: cfName.trim(),
      brand: cfBrand.trim() || 'Personalizado',
      serving_description: `${cfGrams} g`,
      serving_grams: Number(cfGrams) || 100,
      calories_kcal: Number(cfCalories) || 0,
      protein_grams: Number(cfProtein) || 0,
      carbs_grams: Number(cfCarbs) || 0,
      fat_grams: Number(cfFat) || 0,
      category: cfCategory
    };

    const updated = [newFood, ...customFoods];
    setCustomFoods(updated);
    try {
      localStorage.setItem('chance_custom_foods', JSON.stringify(updated));
    } catch {}

    setSelectedFoodItem(newFood);
    setServingGramsInput(newFood.serving_grams);
    setIsCustomFoodModalOpen(false);
    // Reset form
    setCfName('');
    setCfBrand('');
    setCfCalories('');
    setCfProtein('');
    setCfCarbs('');
    setCfFat('');
  };

  // Helper to render meal SVG icon
  const renderMealIcon = (type: MealType) => {
    switch (type) {
      case 'breakfast':
        return <Sunrise className="w-4 h-4 text-amber-400" />;
      case 'mid_morning':
        return <Sun className="w-4 h-4 text-orange-400" />;
      case 'lunch':
        return <Utensils className="w-4 h-4 text-emerald-400" />;
      case 'snack':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'dinner':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      default:
        return <Utensils className="w-4 h-4 text-blue-400" />;
    }
  };

  // Safe Cleanup for Speech Recognition
  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoiceRecording();
    };
  }, []);

  // Start Voice Dictation pre-targeting a specific meal
  const startVoiceRecordingForMeal = (mealType: MealType) => {
    setTargetMealType(mealType);
    setIsVoiceModalOpen(true);
    setVoiceInputText('');
    setParsedVoiceResult(null);
    setVoiceError(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('El reconocimiento por voz no está disponible en este navegador. Puedes escribir o seleccionar un atajo abajo.');
      return;
    }

    stopVoiceRecording();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'es-ES';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const clean = transcript.trim();
        if (clean) {
          setVoiceInputText(clean);
          const parsed = parseFoodVoiceInput(clean, new Date().getHours(), mealType);
          setParsedVoiceResult(parsed);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Speech Recognition] Error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError('Permiso de micrófono denegado. Habilita el acceso en los ajustes del navegador.');
          setIsListening(false);
        } else if (event.error !== 'no-speech') {
          setVoiceError(`Aviso: ${event.error}. Puedes dictar de nuevo o tocar un atajo abajo.`);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('[Speech Recognition] Start error:', err);
      setVoiceError('No se pudo iniciar el micrófono. Introduce el texto o pulsa un atajo rápido.');
      setIsListening(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (isListening) {
      stopVoiceRecording();
    } else {
      startVoiceRecordingForMeal(targetMealType);
    }
  };

  const handleQuickAddFood = (food: FoodItem) => {
    const newLogged: LoggedFoodItem = {
      id: `logged_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      food_id: food.id,
      name: `${food.name} (${food.serving_grams}g)`,
      grams: food.serving_grams,
      calories: food.calories_kcal,
      protein: food.protein_grams,
      carbs: food.carbs_grams,
      fat: food.fat_grams
    };

    const updatedMeals = currentPlan.meals.map(m => {
      if (m.meal_type === targetMealType) {
        return {
          ...m,
          foods: [...m.foods, newLogged]
        };
      }
      return m;
    });

    setMealPlans(prev => ({
      ...prev,
      [selectedDate]: {
        ...currentPlan,
        meals: updatedMeals
      }
    }));

    setIsSearchModalOpen(false);
  };

  const handleManualVoiceParse = () => {
    if (!voiceInputText.trim()) return;
    const parsed = parseFoodVoiceInput(voiceInputText, new Date().getHours(), targetMealType);
    setParsedVoiceResult(parsed);
  };

  const handleConfirmVoiceAddition = () => {
    if (!parsedVoiceResult || parsedVoiceResult.items.length === 0) return;

    const targetType = targetMealType || parsedVoiceResult.detectedMeal;
    const updatedMeals = currentPlan.meals.map(m => {
      if (m.meal_type === targetType) {
        const newLoggedFoods: LoggedFoodItem[] = parsedVoiceResult.items.map(item => ({
          id: `logged_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          food_id: item.food_id,
          name: item.name,
          grams: item.grams,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        }));
        return {
          ...m,
          foods: [...m.foods, ...newLoggedFoods]
        };
      }
      return m;
    });

    setMealPlans(prev => ({
      ...prev,
      [selectedDate]: {
        ...currentPlan,
        meals: updatedMeals
      }
    }));

    stopVoiceRecording();
    setIsVoiceModalOpen(false);
    setVoiceInputText('');
    setParsedVoiceResult(null);
  };

  const handleDeleteFood = (mealType: MealType, foodId: string) => {
    const updatedMeals = currentPlan.meals.map(m => {
      if (m.meal_type === mealType) {
        return {
          ...m,
          foods: m.foods.filter(f => f.id !== foodId)
        };
      }
      return m;
    });

    setMealPlans(prev => ({
      ...prev,
      [selectedDate]: {
        ...currentPlan,
        meals: updatedMeals
      }
    }));
  };

  const handleAddManualFood = () => {
    if (!selectedFoodItem) return;

    const ratio = servingGramsInput / selectedFoodItem.serving_grams;
    const newLogged: LoggedFoodItem = {
      id: `logged_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      food_id: selectedFoodItem.id,
      name: `${selectedFoodItem.name} (${servingGramsInput}g)`,
      grams: servingGramsInput,
      calories: Math.round(selectedFoodItem.calories_kcal * ratio),
      protein: Math.round(selectedFoodItem.protein_grams * ratio * 10) / 10,
      carbs: Math.round(selectedFoodItem.carbs_grams * ratio * 10) / 10,
      fat: Math.round(selectedFoodItem.fat_grams * ratio * 10) / 10
    };

    const updatedMeals = currentPlan.meals.map(m => {
      if (m.meal_type === targetMealType) {
        return {
          ...m,
          foods: [...m.foods, newLogged]
        };
      }
      return m;
    });

    setMealPlans(prev => ({
      ...prev,
      [selectedDate]: {
        ...currentPlan,
        meals: updatedMeals
      }
    }));

    setIsSearchModalOpen(false);
    setSelectedFoodItem(null);
  };

  const handleAddFoodsFromPhoto = (targetMeal: MealType, foods: LoggedFoodItem[]) => {
    const updatedMeals = currentPlan.meals.map(m => {
      if (m.meal_type === targetMeal) {
        return {
          ...m,
          foods: [...m.foods, ...foods]
        };
      }
      return m;
    });

    setMealPlans(prev => ({
      ...prev,
      [selectedDate]: {
        ...currentPlan,
        meals: updatedMeals
      }
    }));
  };

  // Accelerated asynchronous OpenFoodFacts live lookup with fast debounce & abort
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length >= 3) {
      setIsSearchingOff(true);
      const abortCtrl = new AbortController();
      const timer = setTimeout(async () => {
        try {
          const offResults = await searchOpenFoodFacts(q, abortCtrl.signal);
          setOnlineOffFoods(offResults);
        } catch {
          setOnlineOffFoods([]);
        } finally {
          setIsSearchingOff(false);
        }
      }, 200);
      return () => {
        clearTimeout(timer);
        abortCtrl.abort();
      };
    } else {
      setOnlineOffFoods([]);
      setIsSearchingOff(false);
    }
  }, [searchQuery]);

  const handleProductDetectedFromBarcode = (detected: FoodItem) => {
    setSelectedFoodItem(detected);
    setServingGramsInput(detected.serving_grams || 100);
    setIsSearchModalOpen(true);
  };

  const allAvailableFoods = [...customFoods, ...SPANISH_FOOD_DATABASE, ...onlineOffFoods];

  const filteredFoods = allAvailableFoods.filter(f => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || f.name.toLowerCase().includes(q) || (f.brand && f.brand.toLowerCase().includes(q)) || (f.barcode && f.barcode.includes(q));
    if (!matchesQuery) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'custom') return f.id.startsWith('custom_');
    if (selectedCategory === 'mercadona') {
      return (f.brand && f.brand.toLowerCase().includes('hacendado')) || f.name.toLowerCase().includes('hacendado');
    }
    return f.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Voice AI Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12141e] border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 tabular-nums text-[11px] font-bold border border-emerald-500/30">
              Registro Nutricional
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Dieta Semanal & Macros</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Registro Nutricional & Macros</h2>
          <p className="text-xs text-slate-400">Control de alimentos, cálculo de macros y dictado por voz desde el navegador.</p>
        </div>

        {/* Actions: Barcode Scanner & Big Voice Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTargetMealType('lunch');
              setIsBarcodeScannerOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-2xl font-bold text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center gap-2 transition active:scale-95"
            title="Escanear código de barras de cualquier producto con la cámara"
          >
            <Barcode className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Escanear Barcode</span>
          </button>

          <button
            onClick={toggleVoiceRecording}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/40 ring-4 ring-rose-500/30'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
            }`}
            title="Dicta lo que has comido y se añadirá al registro"
          >
            {isListening ? <MicOff className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            <span>{isListening ? 'Escuchando audio...' : 'Dictar por voz'}</span>
          </button>
        </div>
      </div>

      {/* Weekday Selector Bar */}
      <div className="flex items-center justify-between gap-1.5 bg-[#12141e] p-1.5 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
        {WEEKDAYS.map(day => {
          const isSelected = selectedDate === day.key;
          return (
            <button
              key={day.key}
              onClick={() => setSelectedDate(day.key)}
              className={`flex-1 min-w-[48px] py-2 px-1 rounded-xl flex flex-col items-center gap-0.5 transition ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span className="text-[10px] font-bold uppercase">{day.short}</span>
              <span className="text-xs tabular-nums font-black">{day.key.split('-')[2]}</span>
              <span className={`text-[9px] px-1 rounded ${
                day.type === 'training' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-800/40'
              }`}>
                {day.type === 'training' ? 'Fuerza' : 'Descanso'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Calorie & Macro Target Card (FatSecret Wheel) */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-3xl p-5 shadow-xl text-white space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Balance Calórico del Día</h3>
          </div>
          <div className="text-xs text-zinc-400 tabular-nums">
            Objetivo: <strong className="text-white">{targetCalories} kcal</strong>
          </div>
        </div>

        {/* 3 Main Numbers: Consumidas, Restantes, Progreso */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-[#18181c] p-3 rounded-2xl border border-white/[0.06]">
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Consumidas</div>
            <div className="text-2xl font-black text-white mt-0.5 tabular-nums">{totalCalories}</div>
            <div className="text-[10px] text-zinc-500">kcal</div>
          </div>

          <div className={`p-3 rounded-2xl border ${
            remainingCalories >= 0
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <div className="text-[10px] font-bold uppercase opacity-80">Restantes</div>
            <div className="text-2xl font-black mt-0.5 tabular-nums">
              {remainingCalories >= 0 ? remainingCalories : Math.abs(remainingCalories)}
            </div>
            <div className="text-[10px] opacity-80">
              {remainingCalories >= 0 ? 'kcal disponibles' : 'kcal de superávit'}
            </div>
          </div>

          <div className="bg-[#18181c] p-3 rounded-2xl border border-white/[0.06]">
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Progreso</div>
            <div className="text-2xl font-black text-blue-400 mt-0.5 tabular-nums">
              {Math.min(100, Math.round((totalCalories / targetCalories) * 100))}%
            </div>
            <div className="text-[10px] text-zinc-500">del total</div>
          </div>
        </div>

        {/* Macronutrient Progress Bars - Clean 3 Columns with No Collisions */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {/* Protein */}
          <div className="space-y-1 bg-[#18181c] p-2.5 rounded-xl border border-white/[0.04]">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wide truncate">
              Proteína
            </div>
            <div className="h-1.5 bg-[#09090b] rounded-full overflow-hidden border border-white/[0.06]">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalProtein / targetProtein) * 100)}%` }}
              />
            </div>
            <div className="text-xs font-bold text-zinc-200 tabular-nums">
              {totalProtein} / {targetProtein}g
            </div>
          </div>

          {/* Carbs */}
          <div className="space-y-1 bg-[#18181c] p-2.5 rounded-xl border border-white/[0.04]">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wide truncate">
              Carbohidratos
            </div>
            <div className="h-1.5 bg-[#09090b] rounded-full overflow-hidden border border-white/[0.06]">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalCarbs / targetCarbs) * 100)}%` }}
              />
            </div>
            <div className="text-xs font-bold text-zinc-200 tabular-nums">
              {totalCarbs} / {targetCarbs}g
            </div>
          </div>

          {/* Fat */}
          <div className="space-y-1 bg-[#18181c] p-2.5 rounded-xl border border-white/[0.04]">
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wide truncate">
              Grasas
            </div>
            <div className="h-1.5 bg-[#09090b] rounded-full overflow-hidden border border-white/[0.06]">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalFat / targetFat) * 100)}%` }}
              />
            </div>
            <div className="text-xs font-bold text-zinc-200 tabular-nums">
              {totalFat} / {targetFat}g
            </div>
          </div>
        </div>
      </div>

      {/* Photo example & voice dictation shortcuts */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => {
            setTargetMealType('lunch');
            setIsPhotoAiModalOpen(true);
          }}
          className="p-3 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 border border-cyan-500/30 rounded-2xl flex items-center justify-between text-left group hover:border-cyan-500/50 transition active:scale-95 shadow-lg"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span className="truncate">Ejemplo</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold shrink-0">Plato</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">Datos del plato</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition shrink-0 ml-1" />
        </button>

        <button
          type="button"
          onClick={() => startVoiceRecordingForMeal('lunch')}
          className="p-3 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-blue-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-left group hover:border-emerald-500/50 transition active:scale-95 shadow-lg"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span className="truncate">Dictado</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">Audio</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">Dicta tu comida</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition shrink-0 ml-1" />
        </button>
      </div>

      {/* Meal buckets with per-meal shortcuts */}
      <div className="space-y-4">
        {currentPlan.meals.map(meal => {
          const mealCalories = meal.foods.reduce((sum, f) => sum + f.calories, 0);
          const mealProtein = Math.round(meal.foods.reduce((sum, f) => sum + f.protein, 0));

          return (
            <div key={meal.meal_type} className="bg-[#121215] border border-white/[0.08] rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#18181c] border border-white/[0.06] flex items-center justify-center shrink-0">
                    {renderMealIcon(meal.meal_type)}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{meal.label}</h4>
                    <span className="text-[11px] text-zinc-400 tabular-nums">
                      {mealCalories} kcal · {mealProtein}g proteína
                    </span>
                  </div>
                </div>

                {/* Per-meal actions: example dish, voice dictation & manual search */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetMealType(meal.meal_type);
                      setIsPhotoAiModalOpen(true);
                    }}
                    className="px-2 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 active:scale-95 text-cyan-400 text-xs font-bold border border-cyan-500/30 flex items-center gap-1 transition"
                    title={`Cargar un plato de ejemplo para ${meal.label}`}
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="hidden sm:inline">Ejemplo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startVoiceRecordingForMeal(meal.meal_type)}
                    className="px-2 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1 transition"
                    title={`Dictar alimentos por voz para ${meal.label}`}
                  >
                    <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="hidden sm:inline">Dictado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetMealType(meal.meal_type);
                      setIsSearchModalOpen(true);
                    }}
                    className="px-2 py-1.5 rounded-xl bg-[#18181c] hover:bg-[#202026] active:scale-95 text-blue-400 text-xs font-bold border border-white/[0.08] flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                </div>
              </div>

              {/* Foods List */}
              {meal.foods.length === 0 ? (
                <div className="text-center py-4 text-xs text-zinc-500 border border-dashed border-white/[0.06] rounded-xl">
                  No hay alimentos registrados en {meal.label.toLowerCase()}. Toca <strong className="text-emerald-400 font-semibold">Dictado</strong> para dictar lo que comiste.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {meal.foods.map(food => (
                    <div 
                      key={food.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#18181c] border border-white/[0.04] text-xs group hover:border-white/[0.08] transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span className="text-zinc-200 font-medium truncate">{food.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 tabular-nums flex-shrink-0">
                        <span className="text-zinc-400 text-[11px] hidden sm:inline">
                          P:{food.protein}g · C:{food.carbs}g · G:{food.fat}g
                        </span>
                        <span className="font-bold text-white">{food.calories} kcal</span>
                        <button
                          onClick={() => handleDeleteFood(meal.meal_type, food.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 transition"
                          title="Eliminar alimento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: VOICE FOOD PARSER                                */}
      {/* ======================================================== */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#121215] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Dictado de alimentos por voz</h3>
                  <p className="text-[11px] text-zinc-400">Habla con naturalidad o escribe los alimentos</p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopVoiceRecording();
                  setIsVoiceModalOpen(false);
                }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Meal Selector inside Modal */}
            <div className="bg-[#18181c] p-2.5 rounded-2xl border border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                {renderMealIcon(targetMealType)}
                <span>Destino del registro:</span>
              </span>
              <select
                value={targetMealType}
                onChange={(e) => setTargetMealType(e.target.value as MealType)}
                className="bg-[#121215] border border-white/[0.08] text-white text-xs font-bold rounded-xl px-2.5 py-1 focus:outline-none focus:border-emerald-500"
              >
                {MEAL_TYPE_CONFIG.map(cfg => (
                  <option key={cfg.type} value={cfg.type}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Microphone Listening Status */}
            <div className="flex flex-col items-center justify-center py-4 bg-[#18181c] border border-white/[0.06] rounded-2xl space-y-2">
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition shadow-2xl ${
                  isListening
                    ? 'bg-rose-600 text-white animate-bounce shadow-rose-600/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                <Mic className="w-8 h-8" />
              </button>
              <div className="text-xs font-bold text-zinc-200">
                {isListening ? 'Escuchando en directo... ¡Di lo que has comido!' : 'Toca el micrófono para comenzar'}
              </div>
              <p className="text-[11px] text-zinc-400 text-center max-w-xs">
                Ejemplo: "200 gramos de pechuga de pollo y 150 de arroz con 10g de aceite de oliva"
              </p>
            </div>

            {/* Voice Error Notice if any */}
            {voiceError && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{voiceError}</span>
              </div>
            )}

            {/* Quick Voice Demo Presets (Clean Text, No Emojis) */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] uppercase font-bold text-zinc-500">
                Atajos rápidos de dictado frecuente:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Desayuno: 80g avena y 3 huevos', text: '80 gramos de avena y 3 huevos' },
                  { label: 'Comida: 200g pollo y 150g arroz', text: '200g de pollo y 150g de arroz con aceite' },
                  { label: 'Cena: 200g salmón y patatas', text: '200g de salmón y 200g de patata hervida' }
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setVoiceInputText(sample.text);
                      const parsed = parseFoodVoiceInput(sample.text, new Date().getHours(), targetMealType);
                      setParsedVoiceResult(parsed);
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-[#18181c] hover:bg-[#202026] text-zinc-300 border border-white/[0.06] transition active:scale-95"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text input / Transcription */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Transcripción o Entrada Manual:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voiceInputText}
                  onChange={(e) => setVoiceInputText(e.target.value)}
                  placeholder="ej. 200g pollo y 150g arroz"
                  className="flex-1 bg-[#18181c] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-medium"
                />
                <button
                  onClick={handleManualVoiceParse}
                  className="px-3 py-2 bg-[#18181c] hover:bg-[#202026] text-emerald-400 font-bold text-xs rounded-xl border border-white/[0.08] transition"
                >
                  Procesar texto
                </button>
              </div>
            </div>

            {/* Parsed Result Preview */}
            {parsedVoiceResult && (
              <div className="bg-[#18181c] border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Alimentos detectados en el dictado:
                  </span>
                  <span className="bg-emerald-500/20 px-2 py-0.5 rounded capitalize tabular-nums text-[11px]">
                    Destino: {MEAL_TYPE_CONFIG.find(m => m.type === (targetMealType || parsedVoiceResult.detectedMeal))?.label}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {parsedVoiceResult.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#121215] border border-white/[0.06]">
                      <div>
                        <span className="font-semibold text-zinc-200">{item.name}</span>
                        <div className="text-[10px] text-zinc-400 tabular-nums">
                          P:{item.protein}g · C:{item.carbs}g · G:{item.fat}g
                        </div>
                      </div>
                      <span className="font-bold tabular-nums text-emerald-400">{item.calories} kcal</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs font-bold tabular-nums pt-2 border-t border-white/[0.06] text-zinc-300">
                  <span>Total Calculado:</span>
                  <span className="text-white text-sm">
                    {parsedVoiceResult.totalCalories} kcal (P:{parsedVoiceResult.totalProtein}g)
                  </span>
                </div>

                <button
                  onClick={handleConfirmVoiceAddition}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Añadir a {MEAL_TYPE_CONFIG.find(m => m.type === targetMealType)?.label || 'Diario'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREAR ALIMENTO PERSONALIZADO                      */}
      {/* ======================================================== */}
      {isCustomFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#12141e] border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Nuevo Alimento Personalizado</h3>
                <p className="text-[11px] text-slate-400">Se guardará en este dispositivo</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomFoodModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomFood} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Nombre del Alimento *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Tarta de queso proteica casera"
                  value={cfName}
                  onChange={(e) => setCfName(e.target.value)}
                  className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Marca / Origen</label>
                  <input
                    type="text"
                    placeholder="ej. Casero / Mercadona"
                    value={cfBrand}
                    onChange={(e) => setCfBrand(e.target.value)}
                    className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Porción base (g)</label>
                  <input
                    type="number"
                    min="1"
                    value={cfGrams}
                    onChange={(e) => setCfGrams(Number(e.target.value) || 100)}
                    className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-amber-400">Calorías (kcal) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={cfCalories}
                    onChange={(e) => setCfCalories(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white tabular-nums text-center focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-blue-400">Proteína (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={cfProtein}
                    onChange={(e) => setCfProtein(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white tabular-nums text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-emerald-400">Carbos (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={cfCarbs}
                    onChange={(e) => setCfCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white tabular-nums text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-rose-400">Grasas (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={cfFat}
                    onChange={(e) => setCfFat(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white tabular-nums text-center focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">Categoría</label>
                <select
                  value={cfCategory}
                  onChange={(e: any) => setCfCategory(e.target.value)}
                  className="w-full bg-[#181a28] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="meat_fish">Carnes, Pescados & Huevos</option>
                  <option value="dairy">Lácteos & Postres</option>
                  <option value="grains_cereals">Cereales, Arroz & Pasta</option>
                  <option value="vegetables_fruits">Frutas & Verduras</option>
                  <option value="fats_oils">Grasas & Frutos Secos</option>
                  <option value="supplements">Suplementación Deportiva</option>
                  <option value="other">Platos Preparados / Otros</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Guardar en mi Catálogo</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: SEARCHABLE FATSECRET FOOD DATABASE              */}
      {/* ======================================================== */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#12141e] border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Catálogo Nutricional Inteligente</h3>
                <p className="text-[11px] text-slate-400">
                  Añadiendo a: <strong className="text-emerald-400 capitalize">{MEAL_TYPE_CONFIG.find(m => m.type === targetMealType)?.label}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Search Input, Barcode Scanner & Custom Food Action */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar pollo, arroz, avena, Hacendado, HSN, Burger King..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#181a28] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={() => setIsBarcodeScannerOpen(true)}
                className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap"
                title="Escanear código de barras de cualquier producto con la cámara"
              >
                <Barcode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Escanear</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCustomFoodModalOpen(true)}
                className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear</span>
              </button>
            </div>

            {isSearchingOff && (
              <div className="text-[10px] text-cyan-400 flex items-center gap-1.5 px-1 animate-pulse">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Buscando en catálogo online OpenFoodFacts España (Mercadona, Lidl, Carrefour)...</span>
              </div>
            )}

            {/* Category Filter Pills (Vector SVG Icons, No System Emojis) */}
            <div className="flex-shrink-0 flex items-center gap-1.5 overflow-x-auto py-1.5 px-0.5 no-scrollbar border-b border-slate-800/80 [scrollbar-width:none]">
              {[
                { id: 'all', label: 'Todos', Icon: UtensilsCrossed },
                { id: 'mercadona', label: 'Hacendado', Icon: ShoppingCart },
                { id: 'meat_fish', label: 'Carnes & Pescados', Icon: Beef },
                { id: 'dairy', label: 'Lácteos & Huevos', Icon: Milk },
                { id: 'grains_cereals', label: 'Cereales & Arroz', Icon: Wheat },
                { id: 'vegetables_fruits', label: 'Frutas & Verduras', Icon: Apple },
                { id: 'fats_oils', label: 'Grasas & Frutos', Icon: Droplets },
                { id: 'supplements', label: 'Suplementos', Icon: Zap },
                { id: 'other', label: 'Cadenas & Tapas', Icon: Layers },
                { id: 'custom', label: 'Mis Alimentos', Icon: Star }
              ].map(cat => {
                const IconComponent = cat.Icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-shrink-0 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 border ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold border-blue-400/50 shadow-md shadow-blue-600/30'
                        : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="whitespace-nowrap">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Food Selection List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
              {filteredFoods.map(food => {
                const isSelected = selectedFoodItem?.id === food.id;
                return (
                  <div
                    key={food.id}
                    onClick={() => {
                      setSelectedFoodItem(food);
                      setServingGramsInput(food.serving_grams);
                    }}
                    className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between text-xs gap-3 ${
                      isSelected
                        ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                        : 'hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="font-bold text-slate-200 truncate">{food.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {food.serving_description} · P:{food.protein_grams}g · C:{food.carbs_grams}g · G:{food.fat_grams}g
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-emerald-400 whitespace-nowrap text-right min-w-[70px]">
                        {food.calories_kcal} kcal
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAddFood(food);
                        }}
                        className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 transition active:scale-90"
                        title="Añadir a esta comida con 1 toque"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grams Selector & Confirm */}
            {selectedFoodItem && (
              <div className="pt-3 border-t border-slate-800 space-y-3 bg-[#181a28] p-3 rounded-2xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Cantidad a consumir:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={servingGramsInput}
                      onChange={(e) => setServingGramsInput(parseInt(e.target.value, 10) || 0)}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center tabular-nums font-bold text-white text-xs"
                    />
                    <span className="text-slate-400">gramos</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs tabular-nums bg-slate-900/60 p-2 rounded-xl text-slate-300">
                  <span>
                    Total: <strong className="text-white">
                      {Math.round(selectedFoodItem.calories_kcal * (servingGramsInput / selectedFoodItem.serving_grams))} kcal
                    </strong>
                  </span>
                  <span>
                    P: {(selectedFoodItem.protein_grams * (servingGramsInput / selectedFoodItem.serving_grams)).toFixed(1)}g
                  </span>
                </div>

                <button
                  onClick={handleAddManualFood}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir a {MEAL_TYPE_CONFIG.find(m => m.type === targetMealType)?.label}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CAMERA BARCODE SCANNER (OPENFOODFACTS)          */}
      {/* ======================================================== */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onProductDetected={handleProductDetectedFromBarcode}
      />

      {/* ======================================================== */}
      {/* MODAL 4: AI FOOD PHOTO SCANNER & CALORIE ESTIMATOR       */}
      {/* ======================================================== */}
      <FoodPhotoAiScannerModal
        isOpen={isPhotoAiModalOpen}
        onClose={() => setIsPhotoAiModalOpen(false)}
        targetMeal={targetMealType}
        onAddFoods={handleAddFoodsFromPhoto}
      />

    </div>
  );
};
