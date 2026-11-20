// ==========================================
// CHΔNCE SUPERUSER RESISTANCE CURVE STORE
// Interactive curve overrides and TypeScript export
// ==========================================

export interface CurveWeights {
  stretch: number;
  mid: number;
  shortened: number;
}

export interface SuperuserCurveOverride {
  id: string;
  name?: string;
  curveWeights: CurveWeights;
  peakZone?: 'stretched' | 'mid' | 'shortened' | 'uniform';
  curveLabel?: string;
  updatedAt: string;
}

const STORAGE_KEY_SUPERUSER = 'mia_is_superuser_mode';
const STORAGE_KEY_OVERRIDES = 'mia_superuser_curve_overrides_v1';
const EVENT_NAME = 'mia_superuser_state_changed';

export function isSuperUserMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_SUPERUSER) === 'true';
  } catch {
    return false;
  }
}

export function setSuperUserMode(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUPERUSER, enabled ? 'true' : 'false');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { isSuperUser: enabled } }));
    }
  } catch (e) {
    console.warn('[Superuser] Error saving mode:', e);
  }
}

export function toggleSuperUserMode(): boolean {
  const next = !isSuperUserMode();
  setSuperUserMode(next);
  return next;
}

export function getAllCurveOverrides(): Record<string, SuperuserCurveOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OVERRIDES);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getCurveOverride(targetId: string): SuperuserCurveOverride | null {
  if (!targetId) return null;
  const all = getAllCurveOverrides();
  return all[targetId] || null;
}

export function saveCurveOverride(
  targetId: string,
  data: {
    name?: string;
    curveWeights: CurveWeights;
    peakZone?: 'stretched' | 'mid' | 'shortened' | 'uniform';
    curveLabel?: string;
  }
): void {
  if (!targetId) return;
  try {
    const all = getAllCurveOverrides();
    // Normalize weights to sum strictly to 1.000
    const sum = data.curveWeights.stretch + data.curveWeights.mid + data.curveWeights.shortened;
    const s = Math.round((data.curveWeights.stretch / sum) * 1000) / 1000;
    const m = Math.round((data.curveWeights.mid / sum) * 1000) / 1000;
    const sh = Math.round((1 - s - m) * 1000) / 1000;

    all[targetId] = {
      id: targetId,
      name: data.name,
      curveWeights: { stretch: s, mid: m, shortened: sh },
      peakZone: data.peakZone,
      curveLabel: data.curveLabel,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(all));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { targetId, override: all[targetId] } }));
    }
  } catch (e) {
    console.warn('[Superuser] Error saving override:', e);
  }
}

export function removeCurveOverride(targetId: string): void {
  if (!targetId) return;
  try {
    const all = getAllCurveOverrides();
    if (all[targetId]) {
      delete all[targetId];
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(all));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { targetId, removed: true } }));
      }
    }
  } catch (e) {
    console.warn('[Superuser] Error removing override:', e);
  }
}

export function exportOverridesAsTypeScript(): string {
  const all = getAllCurveOverrides();
  const entries = Object.values(all);
  if (entries.length === 0) return '// No hay overrides de superusuario guardados.';

  let out = '// Overrides de Superusuario generados desde el calibrador interactivo\n';
  out += 'export const SUPERUSER_CURVE_OVERRIDES = {\n';
  for (const item of entries) {
    out += `  '${item.id}': {\n`;
    if (item.name) out += `    name: ${JSON.stringify(item.name)},\n`;
    out += `    curveWeights: { stretch: ${item.curveWeights.stretch}, mid: ${item.curveWeights.mid}, shortened: ${item.curveWeights.shortened} },\n`;
    if (item.peakZone) out += `    peakZone: '${item.peakZone}',\n`;
    if (item.curveLabel) out += `    curveLabel: ${JSON.stringify(item.curveLabel)},\n`;
    out += `  },\n`;
  }
  out += '};\n';
  return out;
}

// Global hotkey setup: Ctrl + Shift + A
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      const newState = toggleSuperUserMode();
      console.info(`[Superuser] Modo Admin Curvas ${newState ? 'ACTIVADO' : 'DESACTIVADO'}`);
    }
  });
}
