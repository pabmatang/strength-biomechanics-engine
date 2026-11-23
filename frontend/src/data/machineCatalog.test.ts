import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MACHINE_CATALOG, type NormalizedMuscleGroup } from './machineCatalog';

const VALID_NORMALIZED_MUSCLES: NormalizedMuscleGroup[] = [
  'Pectoral',
  'Dorsales',
  'Espalda Alta',
  'Lumbares',
  'Hombros',
  'Trapecio',
  'Bíceps',
  'Tríceps',
  'Cuádriceps',
  'Isquiosurales',
  'Glúteo',
  'Aductores',
  'Abductores',
  'Gemelos',
  'Abdomen',
  'Cardio'
];

const COMMERCIAL_BRAND_PREFIXES: Record<string, string | string[]> = {
  Technogym: 'technogym_',
  'Hammer Strength': 'hammer_',
  Panatta: 'panatta_',
  Matrix: 'matrix_',
  Gym80: 'gym80_',
  'Life Fitness': ['lifefitness_', 'cardio_'],
  Eleiko: 'eleiko_',
  'Booty Builder': 'booty_',
  Cybex: 'cybex_',
  Nautilus: 'nautilus_',
  'Titanium Strength': 'titanium_'
};

describe('MACHINE_CATALOG Integrity Police Suite', () => {
  it('1. should contain zero duplicate machine IDs', () => {
    const ids = MACHINE_CATALOG.map(m => m.id);
    const uniqueIds = new Set(ids);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(duplicates, `Duplicate machine IDs found: ${duplicates.join(', ')}`).toEqual([]);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('2. should not have any external URLs (http, https, unsplash) in imageUrl', () => {
    const violations = MACHINE_CATALOG.filter(m => {
      if (!m.imageUrl) return false;
      const url = m.imageUrl.toLowerCase();
      return url.includes('http://') || url.includes('https://') || url.includes('unsplash');
    }).map(m => `${m.id} (${m.brand}): ${m.imageUrl}`);

    expect(violations, `External URLs detected: ${violations.join('; ')}`).toEqual([]);
  });

  it('3. every non-null imageUrl must correspond to an existing local file in public/', () => {
    const publicDir = path.resolve(process.cwd(), 'public');
    const missingFiles: string[] = [];

    MACHINE_CATALOG.forEach(m => {
      if (!m.imageUrl) return;
      const rel = m.imageUrl.startsWith('/') ? m.imageUrl.slice(1) : m.imageUrl;
      const fullPath = path.join(publicDir, rel);
      if (!fs.existsSync(fullPath)) {
        // check alternative extension
        const altExt = fullPath.endsWith('.jpg')
          ? fullPath.slice(0, -4) + '.png'
          : fullPath.endsWith('.png')
          ? fullPath.slice(0, -4) + '.jpg'
          : null;
        if (!altExt || !fs.existsSync(altExt)) {
          missingFiles.push(`${m.id}: expected ${fullPath}`);
        }
      }
    });

    expect(missingFiles, `Missing local image files in public/: ${missingFiles.join('; ')}`).toEqual([]);
  });

  it('4. commercial machines (brand !== Estándar) must never use images with prefixes of other brands', () => {
    const crossBrandViolations: string[] = [];

    MACHINE_CATALOG.forEach(m => {
      if (m.brand === 'Estándar' || !m.imageUrl) return;
      const filename = path.basename(m.imageUrl).toLowerCase();

      for (const [otherBrand, pfx] of Object.entries(COMMERCIAL_BRAND_PREFIXES)) {
        if (otherBrand === m.brand) continue;
        const prefixes = Array.isArray(pfx) ? pfx : [pfx];
        for (const p of prefixes) {
          if (filename.startsWith(p)) {
            crossBrandViolations.push(`${m.brand} machine (${m.id}) uses image ${filename} belonging to ${otherBrand}`);
          }
        }
      }
    });

    expect(crossBrandViolations, `Cross-brand image violations: ${crossBrandViolations.join('; ')}`).toEqual([]);
  });

  it('5. all curveWeights (stretch + mid + shortened) must sum to 1.0 (tolerance ±0.02)', () => {
    const invalidCurves: string[] = [];

    MACHINE_CATALOG.forEach(m => {
      const w = m.profile.curveWeights;
      const sum = w.stretch + w.mid + w.shortened;
      const diff = Math.abs(sum - 1.0);
      if (diff > 0.02) {
        invalidCurves.push(`${m.id} (${m.brand}): sum=${sum.toFixed(3)} [${w.stretch}, ${w.mid}, ${w.shortened}]`);
      }
    });

    expect(invalidCurves, `Invalid curve weights: ${invalidCurves.join('; ')}`).toEqual([]);
  });

  it('6. all muscleGroupLabels must belong strictly to the 16 normalized labels', () => {
    const invalidLabels: string[] = [];

    MACHINE_CATALOG.forEach(m => {
      if (!VALID_NORMALIZED_MUSCLES.includes(m.muscleGroupLabel)) {
        invalidLabels.push(`${m.id}: '${m.muscleGroupLabel}'`);
      }
    });

    expect(invalidLabels, `Inconsistent or unnormalized muscle group labels: ${invalidLabels.join('; ')}`).toEqual([]);
  });

  it('7. commercial machines (brand !== Estándar) must not share the same imageUrl', () => {
    const commercialImageMap = new Map<string, string>();
    const duplicateImageViolations: string[] = [];

    MACHINE_CATALOG.forEach(m => {
      if (m.brand === 'Estándar' || !m.imageUrl) return;

      const existingMachineId = commercialImageMap.get(m.imageUrl);
      if (existingMachineId) {
        duplicateImageViolations.push(
          `Image '${m.imageUrl}' is shared by '${existingMachineId}' and '${m.id}' (${m.brand})`
        );
      } else {
        commercialImageMap.set(m.imageUrl, m.id);
      }
    });

    expect(
      duplicateImageViolations,
      `Shared images detected among commercial machines: ${duplicateImageViolations.join('; ')}`
    ).toEqual([]);
  });
});
