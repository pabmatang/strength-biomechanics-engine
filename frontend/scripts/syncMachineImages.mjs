#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicMachinesDir = path.resolve(projectRoot, 'public', 'machines');
const machinesDir = path.resolve(projectRoot, 'src', 'data', 'machines');

const SUPPORTED_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];

// 1. Scan public/machines/
if (!fs.existsSync(publicMachinesDir)) {
  fs.mkdirSync(publicMachinesDir, { recursive: true });
}

const diskFiles = fs.readdirSync(publicMachinesDir);
const imageMap = new Map();

// Helper to rank extension preference (.png > .jpg > .jpeg > .webp)
const extPriority = ext => {
  const lower = ext.toLowerCase();
  if (lower === '.png') return 1;
  if (lower === '.jpg') return 2;
  if (lower === '.jpeg') return 3;
  if (lower === '.webp') return 4;
  return 99;
};

for (const file of diskFiles) {
  const ext = path.extname(file).toLowerCase();
  if (!SUPPORTED_EXTS.includes(ext)) continue;

  const baseName = path.basename(file, path.extname(file));
  const existing = imageMap.get(baseName);

  if (!existing || extPriority(ext) < extPriority(path.extname(existing))) {
    imageMap.set(baseName, file);
  }
}

// 2. Scan and update all src/data/machines/*.ts
const machineFiles = fs.readdirSync(machinesDir).filter(f => f.endsWith('.ts'));

let autoLinkedCount = 0;
let upToDateCount = 0;
let pendingCount = 0;

for (const file of machineFiles) {
  const filePath = path.join(machinesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let fileModified = false;

  // Replace imageUrl for each machine entry
  // Pattern matches id line and captures up to imageUrl line
  const entryRegex = /(id:\s*['"]([^'"]+)['"][\s\S]*?imageUrl:\s*)([^,\n]+)/g;

  content = content.replace(entryRegex, (match, prefix, id, currentValRaw) => {
    const currentVal = currentValRaw.trim().replace(/^['"]|['"]$/g, '');
    const diskImage = imageMap.get(id);

    // Check if currentVal actually exists on disk
    let currentExistsOnDisk = false;
    if (currentVal && currentVal !== 'null') {
      const relPath = currentVal.startsWith('/') ? currentVal.slice(1) : currentVal;
      currentExistsOnDisk = fs.existsSync(path.resolve(projectRoot, 'public', relPath));
    }

    if (diskImage) {
      const expectedUrl = `/machines/${diskImage}`;
      if (!currentExistsOnDisk || currentVal === 'null' || currentVal !== expectedUrl) {
        // Link or update extension
        fileModified = true;
        autoLinkedCount++;
        return `${prefix}'${expectedUrl}'`;
      } else {
        upToDateCount++;
        return match;
      }
    } else {
      // No disk image matching id directly
      if (currentExistsOnDisk) {
        // Valid existing image (e.g. standard machine reusing a representative photo)
        upToDateCount++;
        return match;
      } else {
        // Missing photo
        if (currentVal !== 'null') {
          fileModified = true;
          return `${prefix}null`;
        }
        pendingCount++;
        return match;
      }
    }
  });

  if (fileModified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`[sync] Archivo actualizado: src/data/machines/${file}`);
  }
}

console.log('----------------------------------------------------');
console.log(`Fotos vinculadas automáticamente: ${autoLinkedCount}`);
console.log(`Imágenes ya al día: ${upToDateCount}`);
console.log(`Pendientes sin foto: ${pendingCount}`);
console.log('----------------------------------------------------');
