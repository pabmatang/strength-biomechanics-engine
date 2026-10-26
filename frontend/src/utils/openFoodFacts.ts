import { FoodItem } from '../types/workout';

// Local cache for fast offline retrieval and avoiding redundant network hits
const CACHE_KEY = 'mia_openfoodfacts_cache_v1';

function getLocalCache(): Record<string, FoodItem> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToLocalCache(key: string, item: FoodItem) {
  try {
    const cache = getLocalCache();
    cache[key] = item;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

/**
 * Categorizes a food product based on keywords in its title or categories
 */
function inferFoodCategory(name: string, categoriesStr: string = ''): FoodItem['category'] {
  const text = `${name} ${categoriesStr}`.toLowerCase();
  if (text.includes('pollo') || text.includes('pavo') || text.includes('atun') || text.includes('atún') || text.includes('carne') || text.includes('pescado') || text.includes('salmon') || text.includes('salmón') || text.includes('ternera') || text.includes('lomo')) {
    return 'meat_fish';
  }
  if (text.includes('leche') || text.includes('queso') || text.includes('yogur') || text.includes('proteina') || text.includes('proteína') || text.includes('caseina') || text.includes('whey') || text.includes('kefir') || text.includes('quark')) {
    return 'dairy';
  }
  if (text.includes('arroz') || text.includes('avena') || text.includes('pan') || text.includes('pasta') || text.includes('cereal') || text.includes('patata') || text.includes('harina')) {
    return 'grains_cereals';
  }
  if (text.includes('aceite') || text.includes('aguacate') || text.includes('nuez') || text.includes('almendra') || text.includes('cacahuete') || text.includes('crema de cacahuete') || text.includes('mantequilla')) {
    return 'fats_oils';
  }
  if (text.includes('manzana') || text.includes('platano') || text.includes('plátano') || text.includes('tomate') || text.includes('espinaca') || text.includes('fruta') || text.includes('verdura') || text.includes('ensalada')) {
    return 'vegetables_fruits';
  }
  if (text.includes('creatina') || text.includes('suplemento') || text.includes('bcaa') || text.includes('glutamina') || text.includes('vitamina')) {
    return 'supplements';
  }
  return 'other';
}

/**
 * Converts OpenFoodFacts raw product object into standardized FoodItem
 */
function mapOffProductToFoodItem(p: any): FoodItem | null {
  if (!p) return null;

  const name = p.product_name_es || p.product_name || p.generic_name_es || p.generic_name;
  if (!name || typeof name !== 'string') return null;

  const nutriments = p.nutriments || {};
  const cals = Number(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal_value'] ?? nutriments['energy-kcal'] ?? 0);
  const prot = Number(nutriments['proteins_100g'] ?? nutriments['proteins_value'] ?? nutriments.proteins ?? 0);
  const carbs = Number(nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates_value'] ?? nutriments.carbohydrates ?? 0);
  const fat = Number(nutriments['fat_100g'] ?? nutriments['fat_value'] ?? nutriments.fat ?? 0);
  const fiber = Number(nutriments['fiber_100g'] ?? nutriments['fiber_value'] ?? nutriments.fiber ?? 0);

  // Clean brand name (Mercadona / Hacendado, Carrefour, Lidl, Alcampo, etc.)
  let brandName = p.brands || '';
  if (brandName.toLowerCase().includes('hacendado')) brandName = 'Mercadona (Hacendado)';
  else if (brandName.toLowerCase().includes('carrefour')) brandName = 'Carrefour';
  else if (brandName.toLowerCase().includes('lidl') || brandName.toLowerCase().includes('milbona')) brandName = 'Lidl (Milbona)';
  else if (brandName.toLowerCase().includes('dia')) brandName = 'Supermercados DIA';
  else if (brandName.toLowerCase().includes('alcampo') || brandName.toLowerCase().includes('auchan')) brandName = 'Alcampo';
  else if (brandName.includes(',')) brandName = brandName.split(',')[0].trim();

  const barcode = p.code || p._id || '';

  return {
    id: `off_${barcode || Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    brand: brandName || 'Marca Comercial',
    serving_description: p.serving_size || '100 g (base)',
    serving_grams: 100,
    calories_kcal: Math.round(cals),
    protein_grams: Math.round(prot * 10) / 10,
    carbs_grams: Math.round(carbs * 10) / 10,
    fat_grams: Math.round(fat * 10) / 10,
    fiber_grams: Math.round(fiber * 10) / 10,
    category: inferFoodCategory(name, p.categories),
    barcode,
    image_url: p.image_front_small_url || p.image_url || p.image_front_url || undefined,
    source: 'openfoodfacts'
  };
}

/**
 * Fetch a product by barcode from OpenFoodFacts free public API (CORS enabled)
 */
export async function fetchProductByBarcode(barcode: string): Promise<FoodItem | null> {
  const cleanCode = barcode.trim().replace(/\s+/g, '');
  if (!cleanCode) return null;

  // Check cache first
  const cache = getLocalCache();
  if (cache[cleanCode]) {
    return cache[cleanCode];
  }

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();

    if (data.status === 1 && data.product) {
      const item = mapOffProductToFoodItem(data.product);
      if (item) {
        saveToLocalCache(cleanCode, item);
        return item;
      }
    }
    return null;
  } catch (err) {
    console.warn('[OpenFoodFacts] Barcode fetch error:', err);
    return null;
  }
}

const SEARCH_QUERY_CACHE = new Map<string, FoodItem[]>();

/**
 * Search products by query term on OpenFoodFacts (Spain filtered)
 * Accelerated with targeted fields filtering and query caching
 */
export async function searchOpenFoodFacts(query: string, externalSignal?: AbortSignal): Promise<FoodItem[]> {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  // Instant in-memory cache hit
  if (SEARCH_QUERY_CACHE.has(q)) {
    return SEARCH_QUERY_CACHE.get(q)!;
  }

  try {
    // Only request essential nutritional and name fields (reduces JSON payload from 2MB to ~30KB)
    const fields = 'code,product_name,product_name_es,generic_name,brands,nutriments,serving_size,image_front_small_url,categories';
    const url = `https://es.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=16&fields=${fields}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // Link external cancellation signal if provided
    if (externalSignal) {
      externalSignal.addEventListener('abort', () => controller.abort());
    }

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();

    if (Array.isArray(data.products)) {
      const results: FoodItem[] = [];
      data.products.forEach((p: any) => {
        const item = mapOffProductToFoodItem(p);
        if (item && item.calories_kcal > 0 && !results.some(r => r.name.toLowerCase() === item.name.toLowerCase() && r.brand === item.brand)) {
          results.push(item);
        }
      });
      // Store in memory cache
      SEARCH_QUERY_CACHE.set(q, results);
      return results;
    }
    return [];
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return [];
    }
    console.warn('[OpenFoodFacts] Search query error:', err);
    return [];
  }
}
