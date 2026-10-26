import { describe, it, expect } from 'vitest';
import { 
  calculateBMR, 
  calculateNeatCalories, 
  calculateStrengthTrainingCalories, 
  calculateCardioDailyCalories, 
  calculateTDEE, 
  calculateGoalCaloriesWithCardio 
} from '../utils/fitness';

describe('Energy Balance, Metabolism & Cardio in Weight Management', () => {
  it('accurately computes Basal Metabolic Rate (BMR) with Mifflin-St Jeor formula', () => {
    // Male: 78 kg, 178 cm, 26 years
    // BMR = 10 * 78 + 6.25 * 178 - 5 * 26 + 5 = 780 + 1112.5 - 130 + 5 = 1767.5 -> 1768 kcal
    const bmrMale = calculateBMR(78, 178, 26, true);
    expect(bmrMale).toBe(1768);

    // Female: 60 kg, 165 cm, 28 years
    // BMR = 10 * 60 + 6.25 * 165 - 5 * 28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330 kcal
    const bmrFemale = calculateBMR(60, 165, 28, false);
    expect(bmrFemale).toBe(1330);
  });

  it('calculates Non-Exercise Activity Thermogenesis (NEAT) from daily steps', () => {
    expect(calculateNeatCalories(0)).toBe(0);
    expect(calculateNeatCalories(5000)).toBe(200);
    expect(calculateNeatCalories(10000)).toBe(400);
    expect(calculateNeatCalories(15000)).toBe(600);
  });

  it('calculates daily averaged resistance training caloric burn', () => {
    // 60 min session * 6.5 kcal/min = 390 kcal/session
    // 4 days/week = 1560 kcal/week -> / 7 = 222.8 -> 223 kcal/day
    const gymDaily = calculateStrengthTrainingCalories(60, 4);
    expect(gymDaily).toBe(223);
  });

  it('calculates daily averaged cardio caloric expenditure from weekly minutes', () => {
    // 60 min/week at 9.2 kcal/min = 552 kcal/week -> / 7 = ~79 kcal/day
    const cardio60 = calculateCardioDailyCalories(60, 9.2);
    expect(cardio60).toBe(79);

    // 120 min/week = 1104 kcal/week -> / 7 = ~158 kcal/day
    const cardio120 = calculateCardioDailyCalories(120, 9.2);
    expect(cardio120).toBe(158);

    // 0 min/week = 0
    expect(calculateCardioDailyCalories(0)).toBe(0);
  });

  it('integrates all energy expenditure components into total daily expenditure (TDEE)', () => {
    const tdeeResult = calculateTDEE({
      weightKg: 78,
      heightCm: 178,
      age: 26,
      dailySteps: 10000,
      strengthDays: 4,
      strengthMinutes: 60,
      weeklyCardioMinutes: 90 // ~118 kcal/day
    });

    expect(tdeeResult.bmr).toBe(1768);
    expect(tdeeResult.neat).toBe(400);
    expect(tdeeResult.gymDailyKcal).toBe(223);
    expect(tdeeResult.cardioDailyKcal).toBe(118);
    // Subtotal: 1768 + 400 + 223 + 118 = 2509 kcal
    // TEF 8% = 201 kcal -> TDEE = 2710 kcal
    expect(tdeeResult.tdee).toBe(2710);
  });

  describe('Cardio Integration in Weight Loss (Bajada de Peso / Cut)', () => {
    it('allows higher food intake during fat loss when cardio is performed', () => {
      const baseTdee = 2500;
      const cardioDailyKcal = 200; // e.g. 150 min cardio per week (~200 kcal/day)
      const tdeeWithCardio = baseTdee + cardioDailyKcal; // 2700 kcal

      // Same targeted deficit of -400 kcal
      const recWithoutCardio = calculateGoalCaloriesWithCardio(baseTdee, 'cut', 0, 400);
      const recWithCardio = calculateGoalCaloriesWithCardio(tdeeWithCardio, 'cut', cardioDailyKcal, 400);

      // Without cardio: eats 2100 kcal
      expect(recWithoutCardio.targetCalories).toBe(2100);
      // With cardio: can eat 2300 kcal (200 kcal more food!) while maintaining the exact same fat loss rate
      expect(recWithCardio.targetCalories).toBe(2300);
      expect(recWithCardio.netDailyBalance).toBe(-400);
      expect(recWithCardio.cardioImpactSummary).toContain('+200 kcal/día');
    });

    it('predicts safe weekly rate of fat loss (~0.36 kg/week for -400 kcal deficit)', () => {
      const rec = calculateGoalCaloriesWithCardio(2600, 'cut', 100, 400);
      // (-400 * 7) / 7700 = -0.36 kg/week
      expect(rec.weeklyWeightChangeKg).toBe(-0.36);
    });
  });

  describe('Cardio Integration in Weight Maintenance (Mantenimiento)', () => {
    it('adjusts maintenance intake upward to match cardio expenditure and prevent weight loss', () => {
      const tdee = 2650;
      const cardioDailyKcal = 180;
      const rec = calculateGoalCaloriesWithCardio(tdee, 'maintain', cardioDailyKcal);

      expect(rec.targetCalories).toBe(2650);
      expect(rec.netDailyBalance).toBe(0);
      expect(rec.weeklyWeightChangeKg).toBe(0);
      expect(rec.cardioImpactSummary).toContain('Para mantener el peso intacto');
    });
  });

  describe('Cardio Integration in Muscle Gain / Bulking (Subida de Peso)', () => {
    it('compensates cardio burn so the anabolic surplus is never lost', () => {
      const baseTdeeWithoutCardio = 2400;
      const cardioDailyKcal = 150;
      const tdeeWithCardio = baseTdeeWithoutCardio + cardioDailyKcal; // 2550 kcal

      // Target clean surplus of +250 kcal
      const rec = calculateGoalCaloriesWithCardio(tdeeWithCardio, 'bulk', cardioDailyKcal, 250);

      // Must eat 2550 + 250 = 2800 kcal (fully compensating the 150 kcal of cardio)
      expect(rec.targetCalories).toBe(2800);
      expect(rec.netDailyBalance).toBe(250);
      // (+250 * 7) / 7700 = +0.23 kg/week of controlled lean gain
      expect(rec.weeklyWeightChangeKg).toBe(0.23);
      expect(rec.cardioImpactSummary).toContain('Para subir peso de forma limpia haciendo cardio');
    });
  });
});
