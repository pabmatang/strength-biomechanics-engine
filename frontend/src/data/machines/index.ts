import { TECHNOGYM_MACHINES } from './technogym';
import { HAMMER_STRENGTH_MACHINES } from './hammerStrength';
import { TITANIUM_STRENGTH_MACHINES } from './titaniumStrength';
import { MATRIX_MACHINES } from './matrix';
import { PANATTA_MACHINES } from './panatta';
import { ESTANDAR_MACHINES } from './estandar';
import { LIFE_FITNESS_MACHINES } from './lifeFitness';
import { OTHER_BRANDS_MACHINES } from './otherBrands';
import type { CatalogMachineEntry } from '../machineCatalog';

export {
  TECHNOGYM_MACHINES,
  HAMMER_STRENGTH_MACHINES,
  TITANIUM_STRENGTH_MACHINES,
  MATRIX_MACHINES,
  PANATTA_MACHINES,
  ESTANDAR_MACHINES,
  LIFE_FITNESS_MACHINES,
  OTHER_BRANDS_MACHINES
};

export const ALL_MODULAR_MACHINES: CatalogMachineEntry[] = [
  ...TECHNOGYM_MACHINES,
  ...HAMMER_STRENGTH_MACHINES,
  ...TITANIUM_STRENGTH_MACHINES,
  ...MATRIX_MACHINES,
  ...PANATTA_MACHINES,
  ...ESTANDAR_MACHINES,
  ...LIFE_FITNESS_MACHINES,
  ...OTHER_BRANDS_MACHINES
];
