import { describe, it, expect } from 'vitest';
import { 
  getMuscleStrengthCurve10, 
  resolveJointMovement, 
  MUSCLE_STRENGTH_PROFILES 
} from '../utils/musclePhysiology';
import { 
  computeMachineTorqueCurve, 
  analyzeBiomechanicsMatch, 
  MACHINE_MECHANICAL_SPECS, 
  type MachineMechanicalSpec 
} from '../utils/machinePhysicsEngine';

describe('Muscle Physiology & Joint Movements', () => {
  it('resolves joint movement correctly for key exercises', () => {
    expect(resolveJointMovement('back', 'Technogym Pure Strength Pulldown')).toBe('shoulder_extension_adduction');
    expect(resolveJointMovement('chest', 'Technogym Pure Chest Press')).toBe('horizontal_adduction');
    expect(resolveJointMovement('quadriceps', 'Extensiones de rodilla')).toBe('knee_extension');
    expect(resolveJointMovement('glutes', 'Technogym Hip Thrust')).toBe('hip_extension');
    expect(resolveJointMovement('upper_back', 'Technogym Selection Wide Row')).toBe('horizontal_abduction');
  });

  it('provides a valid 10-point curve with realistic biomechanical values (0 to 100%)', () => {
    const latCurve = getMuscleStrengthCurve10('shoulder_extension_adduction');
    expect(latCurve).toHaveLength(10);
    // Peak in mid-range (~30-50%), drops off in full shortening
    expect(latCurve[2]).toBeGreaterThan(latCurve[0]);
    expect(latCurve[9]).toBeLessThan(latCurve[2]); // Active insufficiency at full shortening
    expect(latCurve[9]).toBeLessThanOrEqual(50);
  });

  it('reflects gluteus ascending force capacity profile', () => {
    const gluteCurve = getMuscleStrengthCurve10('hip_extension');
    expect(gluteCurve).toHaveLength(10);
    // Ascending profile: more torque capacity near lockout
    expect(gluteCurve[8]).toBeGreaterThan(gluteCurve[0]);
  });
});

describe('Machine Kinematics & Physics Engine (τ = F · L · sin θ)', () => {
  it('computes plate-loaded lever torque using sin(theta)', () => {
    const spec: MachineMechanicalSpec = {
      transmission_type: 'plate_loaded_lever',
      theta_start: 35, // starting at 35 degrees to vertical
      theta_end: 90,   // reaches perpendicular (90 degrees) to gravity at end
      path: 'converging',
      stability: 'high'
    };

    const curve = computeMachineTorqueCurve(spec);
    expect(curve).toHaveLength(10);
    // As theta approaches 90 deg, sin(theta) reaches maximum (1.0 -> 100%)
    expect(curve[0]).toBeLessThan(curve[9]);
    expect(curve[9]).toBe(100);
  });

  it('computes constant torque for circular cable pulleys', () => {
    const spec: MachineMechanicalSpec = {
      transmission_type: 'cable_constant_cam',
      theta_start: 30,
      theta_end: 70,
      path: 'linear',
      stability: 'high'
    };

    const curve = computeMachineTorqueCurve(spec);
    expect(curve).toHaveLength(10);
    // Cable pulleys maintain near flat resistance (~90-95%)
    const maxVal = Math.max(...curve);
    const minVal = Math.min(...curve);
    expect(maxVal - minVal).toBeLessThanOrEqual(10);
  });

  it('automatically detects shortening mismatch on Technogym Pure Chest Press', () => {
    const spec = MACHINE_MECHANICAL_SPECS['technogym_pure_chest_press'];
    expect(spec).toBeDefined();

    const muscle = getMuscleStrengthCurve10('horizontal_adduction');
    const machine = computeMachineTorqueCurve(spec);
    const match = analyzeBiomechanicsMatch(muscle, machine, spec);

    // Machine reaches 100% torque at end (theta=90°), while pectoral drops to 44%
    expect(match.shortening_mismatch).toBe(true);
    expect(match.badge_label).toContain('Acortamiento');
    expect(match.primary_hack).toContain('acortamiento');
    expect(match.band_hack).toContain('Bandas');
  });

  it('identifies high match alignment when curves follow joint capacity', () => {
    const spec: MachineMechanicalSpec = {
      transmission_type: 'cable_variable_cam',
      theta_start: 30,
      theta_end: 60,
      path: 'converging',
      stability: 'high'
    };

    const muscle = getMuscleStrengthCurve10('shoulder_flexion');
    const machine = computeMachineTorqueCurve(spec);
    const match = analyzeBiomechanicsMatch(muscle, machine, spec);

    expect(match.match_score).toBeGreaterThan(75);
    expect(match.mismatch_delta).toHaveLength(10);
  });

  it('correctly models Technogym Pure & Hammer plate-loaded rows and pulldowns seat dependence', () => {
    const spec = MACHINE_MECHANICAL_SPECS['technogym_pure_pulldown'] || MACHINE_MECHANICAL_SPECS['technogym_pure_low_row'];
    expect(spec).toBeDefined();

    const muscle = getMuscleStrengthCurve10('shoulder_extension_adduction');

    // Standard seat (#1-#5): Ascending curve
    const standardMachine = computeMachineTorqueCurve(spec, 'standard', true);
    expect(standardMachine[0]).toBeLessThan(70);
    expect(standardMachine[9]).toBe(100);

    const standardMatch = analyzeBiomechanicsMatch(muscle, standardMachine, spec, 'standard', true);
    expect(standardMatch.badge_label).toContain('Ascendente');

    // Low seat (#6-#12) or unilateral away from pad: Bell-shaped curve (80% -> 100% -> 80%)
    const lowSeatMachine = computeMachineTorqueCurve(spec, 'low_or_unilateral', true);
    expect(lowSeatMachine[0]).toBe(80);
    expect(lowSeatMachine[4]).toBe(100);
    expect(lowSeatMachine[8]).toBe(80);

    const lowSeatMatch = analyzeBiomechanicsMatch(muscle, lowSeatMachine, spec, 'low_or_unilateral', true);
    expect(lowSeatMatch.is_optimized).toBe(true);
    expect(lowSeatMatch.badge_label).toContain('Campana');
  });

  it('correctly models Technogym Pure T-Bar Row in standard steps vs floor standing postures', () => {
    const spec = MACHINE_MECHANICAL_SPECS['technogym_pure_t_bar_row'];
    expect(spec).toBeDefined();

    const muscle = getMuscleStrengthCurve10('shoulder_extension_adduction');

    // Standard steps posture: starts at ~45 deg (71%), ascends to 90 deg (100%)
    const machineStandard = computeMachineTorqueCurve(spec, 'standard', false, 'standard_steps');
    expect(machineStandard[0]).toBe(71);
    expect(machineStandard[9]).toBe(100);

    const matchStandard = analyzeBiomechanicsMatch(muscle, machineStandard, spec, 'standard', false, 'standard_steps');
    expect(matchStandard.badge_label).toContain('Ascendente');
    expect(matchStandard.shortening_mismatch).toBe(true);

    // Floor standing posture (separado / pies en suelo): starts horizontal at 90 deg (100%), drops to ~71%
    const machineStanding = computeMachineTorqueCurve(spec, 'standard', false, 'floor_standing');
    expect(machineStanding[0]).toBe(100);
    expect(machineStanding[9]).toBeLessThan(75);

    const matchStanding = analyzeBiomechanicsMatch(muscle, machineStanding, spec, 'standard', false, 'floor_standing');
    expect(matchStanding.badge_label).toContain('Descendente');
    expect(matchStanding.is_optimized).toBe(true);
  });
});
