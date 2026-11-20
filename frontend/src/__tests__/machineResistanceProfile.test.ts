import { describe, it, expect } from 'vitest';
import {
  classifyMachineResistanceProfile,
  computeResistanceSimilarity
} from '../utils/machinePhysicsEngine';
import {
  calculateStimulatingSetFactor,
  formatMuscleTarget
} from '../components/VideoPoseAnalysisModal';

describe('Machine Physics Engine - Resistance Profile & Similarity', () => {
  it('classifies approaches_vertical_loss as stretched peak profile with normalized weights', () => {
    const profile = classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss',
      pathType: 'converging_arc',
      machineBrandGuess: 'Hammer Strength',
      machineModelGuess: 'Iso-Lateral Chest Press'
    });

    expect(profile.peakZone).toBe('stretched');
    expect(profile.curveWeights.stretch).toBeGreaterThan(profile.curveWeights.shortened);
    expect(profile.curveWeights.stretch).toBeGreaterThan(0.5);

    const totalWeight =
      profile.curveWeights.stretch +
      profile.curveWeights.mid +
      profile.curveWeights.shortened;
    expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.005);
    expect(profile.resistanceCurveDescription).toContain('vertical');
  });

  it('classifies opens_to_horizontal_gain as shortened peak profile', () => {
    const profile = classifyMachineResistanceProfile({
      loadType: 'lever_arm',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'diverging_arc'
    });

    expect(profile.peakZone).toBe('shortened');
    expect(profile.curveWeights.shortened).toBeGreaterThan(profile.curveWeights.stretch);
    expect(profile.curveWeights.shortened).toBeGreaterThan(0.45);

    const totalWeight =
      profile.curveWeights.stretch +
      profile.curveWeights.mid +
      profile.curveWeights.shortened;
    expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.005);
  });

  it('modulates opens_to_horizontal_gain with converging arc into smoothed ascending curve (25% / 38% / 37%)', () => {
    const linearProfile = classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'linear_fixed'
    });

    const convergentProfile = classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'opens_to_horizontal_gain',
      pathType: 'convergent'
    });

    // Convergent must increase stretch and reduce gap with shortened
    expect(convergentProfile.curveWeights.stretch).toBeGreaterThan(linearProfile.curveWeights.stretch);
    expect(convergentProfile.curveWeights.stretch).toBeCloseTo(0.25, 2);
    expect(convergentProfile.curveWeights.mid).toBeCloseTo(0.38, 2);
    expect(convergentProfile.curveWeights.shortened).toBeCloseTo(0.37, 2);

    const linearGap = linearProfile.curveWeights.shortened - linearProfile.curveWeights.stretch;
    const convGap = convergentProfile.curveWeights.shortened - convergentProfile.curveWeights.stretch;
    expect(convGap).toBeLessThan(linearGap);
    expect(convergentProfile.curveLabel).toBe('Ascendente suavizado (Convergente)');
    expect(convergentProfile.resistanceCurveDescription).toContain('aplana la curva');
  });

  it('classifies eccentric_cam_drop as mid peak profile', () => {
    const profile = classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'eccentric_cam_drop'
    });

    expect(profile.peakZone).toBe('mid');
    expect(profile.curveWeights.mid).toBeGreaterThan(profile.curveWeights.stretch);
    expect(profile.curveWeights.mid).toBeGreaterThan(profile.curveWeights.shortened);
  });

  it('classifies circular_cam_constant and linear_neutral as uniform profile', () => {
    const p1 = classifyMachineResistanceProfile({
      loadType: 'cable_pulley',
      pivotBehavior: 'circular_cam_constant'
    });
    expect(p1.peakZone).toBe('uniform');

    const p2 = classifyMachineResistanceProfile({
      loadType: 'smith_guided',
      pivotBehavior: 'linear_neutral'
    });
    expect(p2.peakZone).toBe('uniform');
  });

  it('computes high similarity for identical profiles and low similarity for opposite profiles', () => {
    const pressHammer = classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss'
    });

    const pressTechnogym = classifyMachineResistanceProfile({
      loadType: 'plate_loaded',
      pivotBehavior: 'approaches_vertical_loss'
    });

    const lateralRaiseCam = classifyMachineResistanceProfile({
      loadType: 'selectorized_stack',
      pivotBehavior: 'opens_to_horizontal_gain'
    });

    const highSim = computeResistanceSimilarity(pressHammer, pressTechnogym);
    expect(highSim).toBeGreaterThanOrEqual(95);

    const lowSim = computeResistanceSimilarity(pressHammer, lateralRaiseCam);
    expect(lowSim).toBeLessThan(50);
  });

  describe('7-Stimulating-Reps Window Model', () => {
    it('returns factor 1.0 for >= 7 reps with RIR 0-1', () => {
      const res = calculateStimulatingSetFactor(8, 1);
      expect(res.factor).toBe(1.0);
      expect(res.repFactor).toBe(1.0);
      expect(res.label).toContain('Máximo estímulo');
    });

    it('scales proportionally when reps < 7', () => {
      // 5 reps, RIR 2: repFactor = 5/7 = ~0.71428, rirFactor = 0.90 -> factor = 0.6429
      const res = calculateStimulatingSetFactor(5, 2);
      expect(res.repFactor).toBeCloseTo(5 / 7, 3);
      expect(res.rirFactor).toBe(0.90);
      expect(res.factor).toBeCloseTo(0.6429, 3);
    });

    it('returns 0.0 for RIR >= 5 and labels as warmup/technique', () => {
      const res = calculateStimulatingSetFactor(10, 5);
      expect(res.factor).toBe(0.0);
      expect(res.label).toBe('Serie de aproximación / técnica');
    });

    it('handles RIR 4 as light stimulus (0.45 * rep_factor)', () => {
      const res = calculateStimulatingSetFactor(7, 'RIR 4');
      expect(res.factor).toBe(0.45);
      expect(res.label).toBe('Estímulo ligero / aproximación');
    });

    it('translates muscle group IDs cleanly to Spanish', () => {
      expect(formatMuscleTarget('pectorals')).toBe('Pectoral');
      expect(formatMuscleTarget('glutes')).toBe('Glúteo');
      expect(formatMuscleTarget('quads')).toBe('Cuádriceps');
      expect(formatMuscleTarget('hamstrings')).toBe('Isquiosurales');
      expect(formatMuscleTarget('back')).toBe('Espalda');
      expect(formatMuscleTarget('lats')).toBe('Dorsal');
    });
  });
});