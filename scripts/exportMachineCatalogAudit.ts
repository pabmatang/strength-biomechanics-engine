import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MACHINE_CATALOG, CatalogMachineEntry } from '../src/data/machineCatalog';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const docsDir = path.resolve(projectRoot, 'docs');
const publicDir = path.resolve(projectRoot, 'public');

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Check if image actually exists on disk or is a valid remote URL
function checkImageExists(imageUrl?: string): boolean {
  if (!imageUrl) return false;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return true;
  const rel = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
  const full = path.join(publicDir, rel);
  if (fs.existsSync(full)) return true;
  if (full.endsWith('.jpg')) {
    const alt = full.slice(0, -4) + '.png';
    if (fs.existsSync(alt)) return true;
  } else if (full.endsWith('.png')) {
    const alt = full.slice(0, -4) + '.jpg';
    if (fs.existsSync(alt)) return true;
  }
  return false;
}

// Sort: Brand -> Muscle Group -> Model Name
const sortedMachines = [...MACHINE_CATALOG].sort((a, b) => {
  const brandCompare = a.brand.localeCompare(b.brand);
  if (brandCompare !== 0) return brandCompare;
  const muscleCompare = a.muscleGroupLabel.localeCompare(b.muscleGroupLabel);
  if (muscleCompare !== 0) return muscleCompare;
  return a.modelName.localeCompare(b.modelName);
});

// Statistics
const totalMachines = sortedMachines.length;
const machinesWithImages = sortedMachines.filter(m => m.imageUrl && checkImageExists(m.imageUrl)).length;
const machinesWithoutImages = totalMachines - machinesWithImages;

const brandCounts: Record<string, number> = {};
sortedMachines.forEach(m => {
  brandCounts[m.brand] = (brandCounts[m.brand] || 0) + 1;
});

// ==========================================
// 1. GENERATE CATALOGO_MAQUINAS_REVISION.md
// ==========================================
let md = `# Auditoría y Catálogo Completo de Máquinas Biomecánicas (MIA)

Documento de auditoría técnica generado automáticamente el **${new Date().toLocaleDateString('es-ES', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}**.

## 📊 Resumen Estadístico
- **Total de Máquinas Catalogadas:** \`${totalMachines}\`
- **Con Imagen Local Verificada:** \`${machinesWithImages} (${Math.round((machinesWithImages / totalMachines) * 100)}%)\`
- **Sin Imagen Local (Placeholder):** \`${machinesWithoutImages}\`
- **Desglose por Fabricante:**
${Object.entries(brandCounts)
  .map(([brand, count]) => `  - **${brand}:** \`${count}\` máquinas`)
  .join('\n')}

---

## 📋 Tabla Maestra de Máquinas

| ID Interno | Marca & Línea | Nombre Comercial | Grupo Muscular | Carga & Trayectoria | Perfil de Resistencia (\`Est / Med / Aco\`) | Imagen Referenciada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;

sortedMachines.forEach(m => {
  const hasImg = checkImageExists(m.imageUrl);
  const imgLabel = hasImg ? `✅ \`${m.imageUrl}\`` : `⚠️ *Sin imagen local*`;
  const p = m.profile;
  const w = p.curveWeights;
  const estPct = Math.round(w.stretch * 100);
  const medPct = Math.round(w.mid * 100);
  const acoPct = Math.round(w.shortened * 100);
  const curveText = `**${estPct}% / ${medPct}% / ${acoPct}%**<br>*${p.curveLabel || p.peakZone}*`;
  const loadText = `${p.loadType}<br>\`${p.pathType || 'linear'}\``;

  md += `| \`${m.id}\` | **${m.brand}**<br><small>${m.line || '-'}</small> | ${m.modelName}<br><small>(\`${m.canonicalExerciseType}\`)</small> | **${m.muscleGroupLabel}** | ${loadText} | ${curveText} | ${imgLabel} |\n`;
});

const mdPath = path.join(docsDir, 'CATALOGO_MAQUINAS_REVISION.md');
fs.writeFileSync(mdPath, md, 'utf-8');
console.log(`Saved Markdown audit to: ${mdPath}`);

// ==========================================
// 2. GENERATE catalogo_maquinas_revision.html
// ==========================================
const html = `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MIA · Catálogo Visual de Máquinas Biomecánicas</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              technogym: '#f59e0b',
              hammer: '#ef4444',
              panatta: '#06b6d4',
              nautilus: '#3b82f6',
              cybex: '#8b5cf6',
              matrix: '#10b981',
              gym80: '#ec4899',
              lifefitness: '#0284c7',
              bootybuilder: '#d946ef',
              eleiko: '#eab308',
              estandar: '#14b8a6'
            }
          }
        }
      }
    }
  </script>
  <style>
    body { background-color: #0b0d17; color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif; }
    .card-glow:hover { box-shadow: 0 10px 25px -5px rgba(6, 182, 212, 0.15), 0 8px 10px -6px rgba(6, 182, 212, 0.1); }
  </style>
</head>
<body class="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen">

  <!-- Header -->
  <header class="mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/20">
          M
        </div>
        <div>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Catálogo Oficial de Máquinas
            <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              v2.0 Biomecánica
            </span>
          </h1>
          <p class="text-xs sm:text-sm text-slate-400">
            Revisión visual interactiva de curvas de resistencia y asignación de imágenes
          </p>
        </div>
      </div>
    </div>

    <!-- Stats Ribbon -->
    <div class="flex items-center gap-3 text-xs bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
      <div class="px-2">
        <div class="text-[10px] uppercase font-bold text-slate-400">Total Máquinas</div>
        <div class="text-lg font-black font-mono text-cyan-400" id="stat-total">${totalMachines}</div>
      </div>
      <div class="w-px h-8 bg-slate-800"></div>
      <div class="px-2">
        <div class="text-[10px] uppercase font-bold text-slate-400">Con Imagen</div>
        <div class="text-lg font-black font-mono text-emerald-400">${machinesWithImages}</div>
      </div>
      <div class="w-px h-8 bg-slate-800"></div>
      <div class="px-2">
        <div class="text-[10px] uppercase font-bold text-slate-400">Sin Imagen</div>
        <div class="text-lg font-black font-mono ${machinesWithoutImages > 0 ? 'text-amber-400' : 'text-slate-500'}">${machinesWithoutImages}</div>
      </div>
    </div>
  </header>

  <!-- Filters Ribbon -->
  <section class="space-y-3 mb-8 bg-slate-900/60 border border-slate-800/80 p-4 rounded-3xl backdrop-blur-sm">
    <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
      <!-- Search Input -->
      <div class="relative w-full sm:w-80">
        <input
          type="text"
          id="search-input"
          placeholder="Buscar por modelo, ID o ejercicio..."
          class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
        />
      </div>

      <!-- Quick Reset -->
      <button
        onclick="resetFilters()"
        class="text-xs text-slate-400 hover:text-cyan-400 underline transition whitespace-nowrap self-end sm:self-center"
      >
        Restablecer filtros
      </button>
    </div>

    <!-- Brand Filter Pills -->
    <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60" id="brand-filters">
      <button onclick="setBrandFilter('all')" class="brand-btn active px-3 py-1 rounded-xl text-xs font-bold bg-cyan-600 text-white transition" data-brand="all">
        Todas (${totalMachines})
      </button>
      ${Object.entries(brandCounts)
        .map(
          ([brand, count]) => `
      <button onclick="setBrandFilter('${brand}')" class="brand-btn px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition" data-brand="${brand}">
        ${brand} (${count})
      </button>`
        )
        .join('')}
    </div>

    <!-- Muscle Filter Pills -->
    <div class="flex flex-wrap items-center gap-1.5 pt-1" id="muscle-filters">
      <button onclick="setMuscleFilter('all')" class="muscle-btn active px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-700 text-white transition" data-muscle="all">
        Todos los músculos
      </button>
      ${Array.from(new Set(sortedMachines.map(m => m.muscleGroupLabel)))
        .sort()
        .map(
          mg => `
      <button onclick="setMuscleFilter('${mg}')" class="muscle-btn px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-950 text-slate-400 hover:text-white transition border border-slate-800" data-muscle="${mg}">
        ${mg}
      </button>`
        )
        .join('')}
    </div>
  </section>

  <!-- Machines Cards Grid -->
  <main class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="machines-grid">
    ${sortedMachines
      .map(m => {
        const hasImg = checkImageExists(m.imageUrl);
        const p = m.profile;
        const w = p.curveWeights;
        const estPct = Math.round(w.stretch * 100);
        const medPct = Math.round(w.mid * 100);
        const acoPct = Math.round(w.shortened * 100);

        // SVG Mini Curve coordinates (0..100 horizontal, 0..40 vertical inverted)
        // High percentage = lower Y coordinate in SVG
        const yStretch = 36 - (w.stretch / 0.6) * 28;
        const yMid = 36 - (w.mid / 0.6) * 28;
        const yShort = 36 - (w.shortened / 0.6) * 28;

        const brandLower = m.brand.toLowerCase();
        const brandBadgeClass =
          brandLower.includes('technogym') ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
          brandLower.includes('hammer') ? 'bg-red-500/15 text-red-300 border-red-500/30' :
          brandLower.includes('panatta') ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' :
          brandLower.includes('nautilus') ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
          brandLower.includes('cybex') ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' :
          brandLower.includes('matrix') ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
          brandLower.includes('gym80') ? 'bg-pink-500/15 text-pink-300 border-pink-500/30' :
          brandLower.includes('life') ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' :
          brandLower.includes('booty') ? 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30' :
          brandLower.includes('eleiko') ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' :
          'bg-teal-500/15 text-teal-300 border-teal-500/30';

        const rawImg = m.imageUrl || '';
        const isRemote = rawImg.startsWith('http://') || rawImg.startsWith('https://');
        const localRelativeSrc = `../public${rawImg}`;
        const primarySrc = isRemote ? rawImg : localRelativeSrc;

        return `
    <article
      class="machine-card card-glow bg-[#131625] border border-slate-800 rounded-3xl p-4 flex flex-col justify-between transition duration-200"
      data-brand="${m.brand}"
      data-muscle="${m.muscleGroupLabel}"
      data-search="${(m.modelName + ' ' + m.id + ' ' + m.canonicalExerciseType + ' ' + m.brand).toLowerCase()}"
    >
      <div>
        <!-- Top Media Container -->
        <div class="relative w-full h-44 rounded-2xl bg-[#0c0e1a] border border-slate-800/80 overflow-hidden flex items-center justify-center mb-3.5">
          ${
            hasImg
              ? `<img 
                   src="${primarySrc}" 
                   alt="${m.modelName}" 
                   class="w-full h-full object-contain p-2" 
                   loading="lazy" 
                   onerror="if(!this.dataset.fallbackTried){this.dataset.fallbackTried='1';this.src='${rawImg}';}else if(!this.dataset.extTried){this.dataset.extTried='1';if(this.src.endsWith('.png')){this.src=this.src.replace('.png','.jpg');}else if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.png');}}" 
                 />`
              : `<div class="text-center p-4">
                  <div class="w-10 h-10 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-1.5 font-bold">📷</div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">Sin imagen asignada</span>
                </div>`
          }

          <!-- Muscle Badge -->
          <span class="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700/80 backdrop-blur-sm">
            ${m.muscleGroupLabel}
          </span>
        </div>

        <!-- Brand & Line -->
        <div class="flex items-center gap-1.5 mb-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${brandBadgeClass}">
            ${m.brand}
          </span>
          ${m.line ? `<span class="text-[11px] text-slate-400 font-medium">· ${m.line}</span>` : ''}
        </div>

        <!-- Model Name -->
        <h3 class="text-base font-bold text-white leading-snug mb-1">
          ${m.modelName}
        </h3>

        <!-- Canonical Exercise ID -->
        <div class="text-[10px] font-mono text-cyan-400 mb-3 flex items-center gap-1">
          <span class="text-slate-500">ID canónico:</span>
          <code>${m.canonicalExerciseType}</code>
        </div>
      </div>

      <!-- Resistance Profile Section -->
      <div class="pt-3 border-t border-slate-800/80 space-y-2">
        <div class="flex items-center justify-between text-[11px]">
          <span class="font-bold text-cyan-300">${p.curveLabel || p.peakZone}</span>
          <span class="text-slate-400 font-mono">${estPct}% / ${medPct}% / ${acoPct}%</span>
        </div>

        <!-- Mini SVG Curve -->
        <div class="w-full h-11 bg-slate-950/80 rounded-xl p-1 border border-slate-800/80">
          <svg viewBox="0 0 100 40" class="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="grad-${m.id}" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#06b6d4" />
                <stop offset="50%" stop-color="#3b82f6" />
                <stop offset="100%" stop-color="#8b5cf6" />
              </linearGradient>
            </defs>
            <path
              d="M 10,${yStretch} Q 50,${yMid} 90,${yShort}"
              fill="none"
              stroke="url(#grad-${m.id})"
              stroke-width="2.5"
              stroke-linecap="round"
            />
            <circle cx="10" cy="${yStretch}" r="3" fill="#06b6d4" />
            <circle cx="50" cy="${yMid}" r="3" fill="#3b82f6" />
            <circle cx="90" cy="${yShort}" r="3" fill="#8b5cf6" />
          </svg>
        </div>

        <p class="text-[10px] text-slate-400 leading-tight">
          ${p.resistanceCurveDescription || 'Perfil adaptado al brazo de momento articular.'}
        </p>

        <!-- Technical Footer -->
        <div class="flex items-center justify-between text-[9px] text-slate-500 pt-1 font-mono">
          <span>${p.loadType}</span>
          <span>${p.pathType || 'linear'}</span>
          <span>${m.id}</span>
        </div>
      </div>
    </article>`;
      })
      .join('')}
  </main>

  <footer class="mt-12 text-center text-xs text-slate-500 border-t border-slate-800 pt-6">
    MIA Biomechanical Engine · Auditoría de Maquinaria y Perfiles Fisiológicos
  </footer>

  <script>
    let activeBrand = 'all';
    let activeMuscle = 'all';
    let searchQuery = '';

    const cards = document.querySelectorAll('.machine-card');
    const searchInput = document.getElementById('search-input');

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterCards();
    });

    function setBrandFilter(brand) {
      activeBrand = brand;
      document.querySelectorAll('.brand-btn').forEach(btn => {
        if (btn.getAttribute('data-brand') === brand) {
          btn.className = 'brand-btn active px-3 py-1 rounded-xl text-xs font-bold bg-cyan-600 text-white transition';
        } else {
          btn.className = 'brand-btn px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition';
        }
      });
      filterCards();
    }

    function setMuscleFilter(muscle) {
      activeMuscle = muscle;
      document.querySelectorAll('.muscle-btn').forEach(btn => {
        if (btn.getAttribute('data-muscle') === muscle) {
          btn.className = 'muscle-btn active px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-700 text-white transition';
        } else {
          btn.className = 'muscle-btn px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-950 text-slate-400 hover:text-white transition border border-slate-800';
        }
      });
      filterCards();
    }

    function resetFilters() {
      activeBrand = 'all';
      activeMuscle = 'all';
      searchQuery = '';
      searchInput.value = '';
      setBrandFilter('all');
      setMuscleFilter('all');
    }

    function filterCards() {
      let visibleCount = 0;
      cards.forEach(card => {
        const brand = card.getAttribute('data-brand');
        const muscle = card.getAttribute('data-muscle');
        const search = card.getAttribute('data-search');

        const matchBrand = activeBrand === 'all' || brand === activeBrand;
        const matchMuscle = activeMuscle === 'all' || muscle === activeMuscle;
        const matchSearch = !searchQuery || search.includes(searchQuery);

        if (matchBrand && matchMuscle && matchSearch) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });
      document.getElementById('stat-total').innerText = visibleCount;
    }
  </script>
</body>
</html>
`;

const htmlPath = path.join(docsDir, 'catalogo_maquinas_revision.html');
fs.writeFileSync(htmlPath, html, 'utf-8');
console.log(`Saved HTML visual catalog to: ${htmlPath}`);
console.log(`Audit complete: ${totalMachines} machines processed.`);
