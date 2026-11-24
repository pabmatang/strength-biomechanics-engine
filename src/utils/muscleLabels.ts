export const SPANISH_MUSCLE_NAMES: Record<string, string> = {
  chest: 'Pectoral',
  upper_back: 'Espalda Alta / Media',
  lats: 'Dorsal Ancho',
  shoulders: 'Deltoides / Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebrazos',
  quadriceps: 'Cuádriceps',
  hamstrings: 'Isquios / Femoral',
  glutes: 'Glúteos',
  calves: 'Gemelos',
  abductors: 'Abductores',
  adductors: 'Aductores',
  lower_back: 'Lumbar / Espalda Baja',
  abdominals: 'Abdomen / Core',
  traps: 'Trapecio',
  neck: 'Cuello',
  cardio: 'Cardio & Resistencia',
  full_body: 'Cuerpo Completo',
  other: 'General'
};

/**
 * Converts raw database slugs like 'upper_back', 'rear_deltoids', 'chest'
 * into clean, professional Spanish labels.
 */
export function formatMuscleName(raw?: string): string {
  if (!raw) return 'General';
  const clean = raw.trim().toLowerCase().replace(/[-_]/g, '_');
  if (SPANISH_MUSCLE_NAMES[clean]) {
    return SPANISH_MUSCLE_NAMES[clean];
  }
  // Fallback: replace underscores with spaces and capitalize
  return clean
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
