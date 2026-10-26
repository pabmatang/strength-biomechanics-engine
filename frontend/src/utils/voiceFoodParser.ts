import { SPANISH_FOOD_DATABASE } from '../data/spanishFoodDatabase';
import { MealType } from '../types/workout';

export interface ParsedFoodResult {
  food_id: string;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface VoiceParsingResponse {
  detectedMeal: MealType;
  items: ParsedFoodResult[];
  rawText: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

/**
 * Intelligent Natural Language Parser for Voice / Audio Food Logging.
 * Parses input strings like:
 * "Comí 200 gramos de pollo y 150 de arroz y 10g de aceite de oliva en el almuerzo"
 * "Para desayunar 3 huevos, 80 gramos de avena y un café con leche"
 */
export function parseFoodVoiceInput(
  input: string, 
  currentHour: number = new Date().getHours(),
  targetMealFallback?: MealType
): VoiceParsingResponse {
  const text = input.toLowerCase().trim();

  // 1. Detect target meal bucket from voice keywords
  let detectedMeal: MealType = targetMealFallback || 'lunch';
  if (text.includes('desayun') || text.includes('por la mañana')) {
    detectedMeal = 'breakfast';
  } else if (text.includes('almuerzo') || text.includes('media mañana')) {
    detectedMeal = 'mid_morning';
  } else if (text.includes('comida') || text.includes('mediodía') || text.includes('almorz')) {
    detectedMeal = 'lunch';
  } else if (text.includes('merien') || text.includes('tarde')) {
    detectedMeal = 'snack';
  } else if (text.includes('cena') || text.includes('cené') || text.includes('noche')) {
    detectedMeal = 'dinner';
  } else if (!targetMealFallback) {
    // Infer based on current hour if no explicit meal requested
    if (currentHour < 11) detectedMeal = 'breakfast';
    else if (currentHour < 13) detectedMeal = 'mid_morning';
    else if (currentHour < 17) detectedMeal = 'lunch';
    else if (currentHour < 20) detectedMeal = 'snack';
    else detectedMeal = 'dinner';
  }

  // 2. Multi-food entity recognition
  const items: ParsedFoodResult[] = [];

  // Split input by conjunctions: " y ", ", ", " con ", " más "
  const phrases = text.split(/(?:,|\s+y\s+|\s+con\s+|\s+más\s+)/i);

  for (const phrase of phrases) {
    const cleanPhrase = phrase.trim();
    if (!cleanPhrase || cleanPhrase.length < 2) continue;

    // Unit-based recognition (e.g. "3 huevos", "2 tostadas", "un vaso de leche", "1 cucharada de aceite")
    let grams = 100; // default 100g if not stated
    let quantityMatched = false;

    // Check specific unit counts
    const unitMatch = cleanPhrase.match(/(\d+)\s*(?:huevos?|unidades?|piezas?)/i);
    if (unitMatch && unitMatch[1]) {
      const units = parseInt(unitMatch[1], 10);
      if (cleanPhrase.includes('huevo')) {
        grams = units * 55; // ~55g per medium egg
        quantityMatched = true;
      }
    }

    if (!quantityMatched) {
      if (cleanPhrase.includes('cucharada')) {
        grams = 12; // 1 tablespoon ~ 12g
        quantityMatched = true;
      } else if (cleanPhrase.includes('vaso') || cleanPhrase.includes('taza')) {
        grams = 200; // ~200ml
        quantityMatched = true;
      }
    }

    // Standard gram/ml regex
    if (!quantityMatched) {
      const gramMatch = cleanPhrase.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|gramos|ml|mililitros)?/i);
      if (gramMatch && gramMatch[1]) {
        const parsedNum = parseFloat(gramMatch[1].replace(',', '.'));
        if (parsedNum > 0 && parsedNum <= 2500) {
          grams = parsedNum;
        }
      }
    }

    // Match food against SPANISH_FOOD_DATABASE with strict boolean parentheses
    const matchedFood = SPANISH_FOOD_DATABASE.find(f => {
      const fName = f.name.toLowerCase();

      if (cleanPhrase.includes('pollo') && f.id === 'food_chicken_breast') return true;
      if (cleanPhrase.includes('pavo') && f.id === 'food_turkey_breast') return true;
      if ((cleanPhrase.includes('ternera') || cleanPhrase.includes('carne picada')) && f.id === 'food_beef_lean') return true;
      if ((cleanPhrase.includes('salmón') || cleanPhrase.includes('salmon')) && f.id === 'food_salmon_fresh') return true;
      if (cleanPhrase.includes('merluza') && f.id === 'food_hake_fillet') return true;
      if ((cleanPhrase.includes('atun') || cleanPhrase.includes('atún')) && f.id === 'food_tuna_canned') return true;
      if ((cleanPhrase.includes('clara') || cleanPhrase.includes('claras')) && f.id === 'food_egg_whites') return true;
      if ((cleanPhrase.includes('huevo') || cleanPhrase.includes('huevos')) && f.id === 'food_egg_whole') return true;
      if (cleanPhrase.includes('queso batido') && f.id === 'food_cottage_cheese_zero') return true;
      if ((cleanPhrase.includes('yogur') || cleanPhrase.includes('yogurt')) && f.id === 'food_greek_yogurt_natural') return true;
      if (cleanPhrase.includes('leche') && f.id === 'food_milk_semi') return true;
      if (cleanPhrase.includes('arroz') && f.id === 'food_white_rice') return true;
      if (cleanPhrase.includes('avena') && f.id === 'food_oats_rolled') return true;
      if ((cleanPhrase.includes('patata') || cleanPhrase.includes('papas')) && f.id === 'food_potatoes_boiled') return true;
      if ((cleanPhrase.includes('boniato') || cleanPhrase.includes('batata')) && f.id === 'food_sweet_potato') return true;
      if ((cleanPhrase.includes('pasta') || cleanPhrase.includes('macarrones')) && f.id === 'food_pasta_wheat') return true;
      if (cleanPhrase.includes('pan') && f.id === 'food_bread_sourdough') return true;
      if ((cleanPhrase.includes('aceite') || cleanPhrase.includes('aove')) && f.id === 'food_olive_oil_extra') return true;
      if (cleanPhrase.includes('aguacate') && f.id === 'food_avocado_fresh') return true;
      if ((cleanPhrase.includes('nueces') || cleanPhrase.includes('nuez')) && f.id === 'food_walnuts') return true;
      if ((cleanPhrase.includes('crema de cacahuete') || cleanPhrase.includes('cacahuete')) && f.id === 'food_peanut_butter_pure') return true;
      if ((cleanPhrase.includes('platano') || cleanPhrase.includes('plátano')) && f.id === 'food_banana') return true;
      if (cleanPhrase.includes('manzana') && f.id === 'food_apple_fuji') return true;
      if ((cleanPhrase.includes('arandano') || cleanPhrase.includes('arándanos')) && f.id === 'food_blueberries') return true;
      if ((cleanPhrase.includes('brocoli') || cleanPhrase.includes('brócoli')) && f.id === 'food_broccoli_steamed') return true;
      if ((cleanPhrase.includes('proteina') || cleanPhrase.includes('proteína') || cleanPhrase.includes('whey') || cleanPhrase.includes('batido')) && f.id === 'food_whey_protein') return true;
      if (cleanPhrase.includes('creatina') && f.id === 'food_creatine_monohydrate') return true;

      // Token word check fallback
      const words = fName.split(' ');
      return words.some(w => w.length > 3 && cleanPhrase.includes(w));
    });

    if (matchedFood && !items.some(it => it.food_id === matchedFood.id)) {
      const ratio = grams / matchedFood.serving_grams;
      items.push({
        food_id: matchedFood.id,
        name: `${matchedFood.name} (${Math.round(grams)}g)`,
        grams: Math.round(grams),
        calories: Math.round(matchedFood.calories_kcal * ratio),
        protein: Math.round(matchedFood.protein_grams * ratio * 10) / 10,
        carbs: Math.round(matchedFood.carbs_grams * ratio * 10) / 10,
        fat: Math.round(matchedFood.fat_grams * ratio * 10) / 10
      });
    }
  }

  // Calculate totals
  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = Math.round(items.reduce((sum, item) => sum + item.protein, 0) * 10) / 10;
  const totalCarbs = Math.round(items.reduce((sum, item) => sum + item.carbs, 0) * 10) / 10;
  const totalFat = Math.round(items.reduce((sum, item) => sum + item.fat, 0) * 10) / 10;

  return {
    detectedMeal,
    items,
    rawText: input,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat
  };
}
