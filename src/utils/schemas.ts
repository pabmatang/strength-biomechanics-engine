import { z } from 'zod';

/**
 * Zod Schema for Structured Voice AI Food Logging.
 * Guarantees schema integrity and prevents AI hallucinations.
 */
export const ParsedFoodItemSchema = z.object({
  food_id: z.string().min(1),
  name: z.string().min(1),
  grams: z.number().positive().max(3000),
  calories: z.number().nonnegative().max(10000),
  protein: z.number().nonnegative().max(500),
  carbs: z.number().nonnegative().max(1000),
  fat: z.number().nonnegative().max(500)
});

export const VoiceParsingResponseSchema = z.object({
  detectedMeal: z.enum(['breakfast', 'mid_morning', 'lunch', 'snack', 'dinner']),
  items: z.array(ParsedFoodItemSchema),
  rawText: z.string(),
  totalCalories: z.number().nonnegative(),
  totalProtein: z.number().nonnegative(),
  totalCarbs: z.number().nonnegative(),
  totalFat: z.number().nonnegative()
});

export type ValidatedVoiceParsingResponse = z.infer<typeof VoiceParsingResponseSchema>;

/**
 * Zod Schema for Biomechanical Machine Configuration
 */
export const MachineHotspotSchema = z.object({
  id: z.number().int().positive(),
  label: z.string().min(1),
  part_name: z.string().min(1),
  top: z.string().regex(/^\d+(\.\d+)?%$/),
  left: z.string().regex(/^\d+(\.\d+)?%$/),
  biomechanical_purpose: z.string().min(1),
  pro_tip: z.string().optional()
});

export const MachineBiomechanicsSchema = z.object({
  curve_type: z.enum(['lengthened', 'mid_range', 'shortened', 'linear']),
  curve_title: z.string().min(1),
  rating: z.number().min(0).max(10),
  match_summary: z.string().min(1),
  phases: z.array(z.object({
    phase: z.string(),
    pct: z.number().min(0).max(100),
    level: z.string(),
    color: z.string(),
    cue: z.string()
  })).min(3).max(3),
  strength_curve: z.tuple([z.number(), z.number(), z.number()]).optional(),
  resistance_curve: z.tuple([z.number(), z.number(), z.number()]).optional(),
  mismatch_analysis: z.string().optional(),
  gym_hacks: z.object({
    pad_hack: z.string().optional(),
    band_hack: z.string().optional(),
    anthropometric_hack: z.string().optional()
  }).optional(),
  lever_physics: z.string().min(1),
  pro_hack: z.string().min(1),
  hotspots: z.array(MachineHotspotSchema)
});

/**
 * Validates AI responses with fallback resilience
 */
export function validateAiVoiceOutput(data: unknown): ValidatedVoiceParsingResponse | null {
  const result = VoiceParsingResponseSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.warn('[Zod Schema Validation Failed]:', result.error.format());
  return null;
}
