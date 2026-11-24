import { describe, it, expect } from 'vitest';
import { parseFoodVoiceInput } from '../utils/voiceFoodParser';
import { validateAiVoiceOutput } from '../utils/schemas';

describe('Nutrition & Voice AI Parser Engine', () => {
  it('correctly detects breakfast meal bucket from voice transcript', () => {
    const input = 'Para el desayuno tomé 80g de avena y 3 huevos';
    const result = parseFoodVoiceInput(input);
    expect(result.detectedMeal).toBe('breakfast');
    expect(result.items.length).toBeGreaterThanOrEqual(1);
  });

  it('correctly detects lunch meal bucket from voice transcript', () => {
    const input = 'Comí 200 gramos de pechuga de pollo y 150g de arroz en la comida';
    const result = parseFoodVoiceInput(input);
    expect(result.detectedMeal).toBe('lunch');
    expect(result.items.some(i => i.name.toLowerCase().includes('pollo'))).toBe(true);
    expect(result.items.some(i => i.name.toLowerCase().includes('arroz'))).toBe(true);
  });

  it('parses unit quantities accurately (e.g. 3 huevos = ~165g)', () => {
    const input = 'Desayuno 3 huevos';
    const result = parseFoodVoiceInput(input);
    const eggItem = result.items.find(i => i.food_id === 'food_egg_whole');
    expect(eggItem).toBeDefined();
    expect(eggItem?.grams).toBe(165);
  });

  it('validates parser output against strict Zod schema', () => {
    const input = 'Cené 200g de salmón fresco con 150g de patatas';
    const result = parseFoodVoiceInput(input);
    const validated = validateAiVoiceOutput(result);
    expect(validated).not.toBeNull();
    expect(validated?.detectedMeal).toBe('dinner');
    expect(validated?.totalCalories).toBeGreaterThan(0);
  });

  it('rejects malformed AI payloads with Zod validation', () => {
    const malformed = {
      detectedMeal: 'invalid_meal_type',
      items: [{ food_id: '', name: '', grams: -50, calories: -200 }],
      totalCalories: -100
    };
    const validated = validateAiVoiceOutput(malformed);
    expect(validated).toBeNull();
  });
});
