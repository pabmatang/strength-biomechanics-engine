import { describe, it, expect } from 'vitest';
import {
  classifyMachineResistanceProfile,
  computeResistanceSimilarity
} from './machinePhysicsEngine';

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
});