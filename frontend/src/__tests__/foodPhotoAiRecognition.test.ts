import { describe, it, expect } from 'vitest';
import { LoggedFoodItem, MealType } from '../types/workout';

interface DetectedIngredient {
  id: string;
  name: string;
  estimatedGrams: number;
  baseCaloriesPer100g: number;
  baseProteinPer100g: number;
  baseCarbsPer100g: number;
  baseFatPer100g: number;
}

function calculatePlateTotals(ingredients: DetectedIngredient[]) {
  const calories = Math.round(ingredients.reduce((sum, ing) => sum + (ing.estimatedGrams * ing.baseCaloriesPer100g) / 100, 0));
  const protein = Math.round(ingredients.reduce((sum, ing) => sum + (ing.estimatedGrams * ing.baseProteinPer100g) / 100, 0) * 10) / 10;
  const carbs = Math.round(ingredients.reduce((sum, ing) => sum + (ing.estimatedGrams * ing.baseCarbsPer100g) / 100, 0) * 10) / 10;
  const fat = Math.round(ingredients.reduce((sum, ing) => sum + (ing.estimatedGrams * ing.baseFatPer100g) / 100, 0) * 10) / 10;

  return { calories, protein, carbs, fat };
}

function adjustIngredientGrams(ingredients: DetectedIngredient[], id: string, delta: number): DetectedIngredient[] {
  return ingredients.map(ing => {
    if (ing.id === id) {
      const nextGrams = Math.max(5, ing.estimatedGrams + delta);
      return { ...ing, estimatedGrams: nextGrams };
    }
    return ing;
  });
}

function mapToLoggedFoods(ingredients: DetectedIngredient[]): LoggedFoodItem[] {
  return ingredients.map(ing => {
    const cals = Math.round((ing.estimatedGrams * ing.baseCaloriesPer100g) / 100);
    const prot = Math.round(((ing.estimatedGrams * ing.baseProteinPer100g) / 100) * 10) / 10;
    const carb = Math.round(((ing.estimatedGrams * ing.baseCarbsPer100g) / 100) * 10) / 10;
    const fat = Math.round(((ing.estimatedGrams * ing.baseFatPer100g) / 100) * 10) / 10;

    return {
      id: `food_photo_${Date.now()}_${ing.id}`,
      food_id: ing.id,
      name: `${ing.name} (~${ing.estimatedGrams}g)`,
      grams: ing.estimatedGrams,
      calories: cals,
      protein: prot,
      carbs: carb,
      fat: fat,
      time: '14:30'
    };
  });
}

describe('AI Food Photo Recognition & Calorie Estimation Engine', () => {
  const samplePlate: DetectedIngredient[] = [
    { id: 'ing_chicken', name: 'Pechuga de pollo a la plancha', estimatedGrams: 200, baseCaloriesPer100g: 165, baseProteinPer100g: 31, baseCarbsPer100g: 0, baseFatPer100g: 3.6 },
    { id: 'ing_rice', name: 'Arroz blanco cocido', estimatedGrams: 200, baseCaloriesPer100g: 130, baseProteinPer100g: 2.7, baseCarbsPer100g: 28.2, baseFatPer100g: 0.3 },
    { id: 'ing_oil', name: 'Aceite de oliva virgen extra', estimatedGrams: 10, baseCaloriesPer100g: 884, baseProteinPer100g: 0, baseCarbsPer100g: 0, baseFatPer100g: 100 }
  ];

  it('correctly calculates total calories and macronutrients for a detected plate', () => {
    const totals = calculatePlateTotals(samplePlate);

    // 200g chicken: 330 kcal, 62g protein, 0g carbs, 7.2g fat
    // 200g rice: 260 kcal, 5.4g protein, 56.4g carbs, 0.6g fat
    // 10g olive oil: 88.4 kcal, 0g protein, 0g carbs, 10g fat
    // Total kcal: ~678 kcal
    expect(totals.calories).toBe(678);
    expect(totals.protein).toBeCloseTo(67.4, 1);
    expect(totals.carbs).toBeCloseTo(56.4, 1);
    expect(totals.fat).toBeCloseTo(17.8, 1);
  });

  it('dynamically recalculates nutrition when the user adjusts ingredient grams', () => {
    // Increase rice by +50g (from 200g to 250g)
    const adjusted = adjustIngredientGrams(samplePlate, 'ing_rice', 50);
    const totals = calculatePlateTotals(adjusted);

    // 250g rice = 325 kcal (delta +65 kcal)
    expect(totals.calories).toBe(743);
    expect(totals.carbs).toBeCloseTo(70.5, 1);
  });

  it('prevents grams from dropping below 5g minimum threshold', () => {
    const reduced = adjustIngredientGrams(samplePlate, 'ing_oil', -20);
    expect(reduced.find(i => i.id === 'ing_oil')?.estimatedGrams).toBe(5);
  });

  it('correctly recalculates totals when an ingredient is removed from detection', () => {
    // Remove olive oil (10g = ~88 kcal, 10g fat)
    const filtered = samplePlate.filter(i => i.id !== 'ing_oil');
    const totals = calculatePlateTotals(filtered);

    expect(totals.calories).toBe(590);
    expect(totals.fat).toBeCloseTo(7.8, 1);
  });

  it('maps detected plate ingredients to LoggedFoodItem array with proper keys', () => {
    const logged = mapToLoggedFoods(samplePlate);
    expect(logged.length).toBe(3);
    expect(logged[0].name).toContain('Pechuga de pollo');
    expect(logged[0].calories).toBe(330);
    expect(logged[0].protein).toBe(62);
    expect(logged[0].time).toBe('14:30');
  });

  it('supports accurate macro profiles for diverse meals (breakfast oats, salmon dinner, etc.)', () => {
    const salmonDinner: DetectedIngredient[] = [
      { id: 'ing_salmon', name: 'Salmón fresco', estimatedGrams: 180, baseCaloriesPer100g: 208, baseProteinPer100g: 20, baseCarbsPer100g: 0, baseFatPer100g: 13 },
      { id: 'ing_potatoes', name: 'Patatas cocidas', estimatedGrams: 200, baseCaloriesPer100g: 86, baseProteinPer100g: 2, baseCarbsPer100g: 20, baseFatPer100g: 0.1 }
    ];

    const dinnerTotals = calculatePlateTotals(salmonDinner);
    // Salmon 180g = 374 kcal, 36g prot, 23.4g fat
    // Potatoes 200g = 172 kcal, 4g prot, 40g carbs, 0.2g fat
    expect(dinnerTotals.calories).toBe(546);
    expect(dinnerTotals.protein).toBeCloseTo(40, 1);
    expect(dinnerTotals.carbs).toBeCloseTo(40, 1);
    expect(dinnerTotals.fat).toBeCloseTo(23.6, 1);
  });
});
