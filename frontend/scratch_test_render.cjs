const React = require('react');
const ReactDOMServer = require('react-dom/server');
const path = require('path');
const fs = require('fs');
const ts = require('typescript');

// Mock browser globals
global.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  }
};
global.document = {
  createElement: () => ({ relList: { supports: () => true } }),
  querySelectorAll: () => []
};
global.localStorage = global.window.localStorage;

const moduleCache = {};

function customRequire(fromDir, modName) {
  if (modName.startsWith('.')) {
    let resolved = path.resolve(fromDir, modName);
    if (fs.existsSync(resolved + '.ts')) resolved += '.ts';
    else if (fs.existsSync(resolved + '.tsx')) resolved += '.tsx';
    else if (fs.existsSync(resolved + '/index.ts')) resolved += '/index.ts';
    else if (fs.existsSync(resolved + '/index.tsx')) resolved += '/index.tsx';

    return loadTsx(resolved);
  }
  return require(modName);
}

function loadTsx(filePath) {
  if (moduleCache[filePath]) return moduleCache[filePath];

  const code = fs.readFileSync(filePath, 'utf8');
  const js = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React
    }
  }).outputText;

  const m = { exports: {} };
  moduleCache[filePath] = m.exports;

  const req = (name) => customRequire(path.dirname(filePath), name);
  const fn = new Function('require', 'module', 'exports', '__dirname', '__filename', js);
  fn(req, m, m.exports, path.dirname(filePath), filePath);

  moduleCache[filePath] = m.exports;
  return m.exports;
}

try {
  console.log('[*] Testing load of ExerciseDetailModal...');
  const detailModal = loadTsx(path.resolve('src/components/ExerciseDetailModal.tsx'));
  console.log('[+] ExerciseDetailModal loaded');

  // Test rendering ExerciseDetailModal with a sample routine exercise
  const sampleEx = {
    id: 'e1',
    exercise_template_id: 'technogym_pure_chest_press',
    title: 'Technogym Pure Strength - Chest Press',
    brand: 'Technogym',
    muscle_group: 'chest',
    equipment_category: 'machine',
    notes: 'Sillín en punto 4. Rango completo.',
    image_url: '/machines/technogym_pure_chest_press.jpg',
    sets: [
      { id: 's1', index: 1, type: 'warmup', weight_kg: 40, reps: 10, is_completed: false },
      { id: 's2', index: 2, type: 'normal', weight_kg: 80, reps: 8, is_completed: false, previous_weight_kg: 80, previous_reps: 8 }
    ]
  };

  console.log('[*] Testing SSR render of ExerciseDetailModal...');
  const el = React.createElement(detailModal.ExerciseDetailModal, {
    exercise: sampleEx,
    isOpen: true,
    onClose: () => {},
    workoutHistory: []
  });

  const html = ReactDOMServer.renderToString(el);
  console.log('[+] Rendered ExerciseDetailModal successfully! HTML length:', html.length);

  // Test rendering RoutinesScreen
  console.log('[*] Testing load of RoutinesScreen...');
  const routinesScreenMod = loadTsx(path.resolve('src/components/RoutinesScreen.tsx'));
  console.log('[+] RoutinesScreen loaded');

  const routinesEl = React.createElement(routinesScreenMod.RoutinesScreen, {
    routines: [
      {
        id: 'r1',
        title: 'Push Day',
        exercises: [sampleEx]
      }
    ],
    onStartRoutine: () => {},
    onCreateRoutine: () => {},
    onUpdateRoutine: () => {},
    onDeleteRoutine: () => {},
    workoutHistory: []
  });

  const routinesHtml = ReactDOMServer.renderToString(routinesEl);
  console.log('[+] Rendered RoutinesScreen successfully! HTML length:', routinesHtml.length);

} catch (err) {
  console.error('[!] FATAL ERROR DURING RENDER:', err);
}
