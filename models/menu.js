// models/menu.js
// Lee el menú real desde data/menu.csv y lo agrupa por categoría.

const fs = require('fs');
const path = require('path');

let cachedMenu = null;

function detectDelimiter(headerLine) {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semiCount = (headerLine.match(/;/g) || []).length;
  return semiCount > commaCount ? ';' : ',';
}

function normalizeHeader(h) {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function loadMenuFromCsv() {
  if (cachedMenu) return cachedMenu;

  const csvPath = path.join(__dirname, '..', 'data', 'menu.csv');
  console.log('DEBUG leyendo menú desde:', csvPath);

  let raw;
  try {
    raw = fs.readFileSync(csvPath, 'utf8');
  } catch (err) {
    console.error('No se pudo leer data/menu.csv:', err);
    cachedMenu = { categories: [] };
    return cachedMenu;
  }

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    console.warn('data/menu.csv está vacío');
    cachedMenu = { categories: [] };
    return cachedMenu;
  }

  const headerLine = lines[0];
  const delimiter = detectDelimiter(headerLine);
  console.log('DEBUG delimitador detectado:', JSON.stringify(delimiter));

  const headersRaw = headerLine.split(delimiter);
  const headers = headersRaw.map(normalizeHeader);
  console.log('DEBUG headers normalizados:', headers);

  const idxItemId = headers.indexOf('item_id');
  const idxCategory = headers.indexOf('category');
  const idxName = headers.indexOf('name_es');
  const idxStation = headers.indexOf('station_ids');
  const idxNotes = headers.indexOf('notes_kitchen');

  if (idxCategory === -1 || idxName === -1) {
    console.error(
      'Cabeceras CSV inesperadas. Esperaba al menos category y name_es. Headers:',
      headers
    );
    cachedMenu = { categories: [] };
    return cachedMenu;
  }

  const categoriesMap = new Map();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols = line.split(delimiter);
    if (cols.length < 2) continue;

    const category = (cols[idxCategory] || 'Otros').trim();
    const name = (cols[idxName] || '').trim();
    if (!name) continue;

    const itemId =
      idxItemId !== -1 ? (cols[idxItemId] || '').trim() : '';
    const station =
      idxStation !== -1 ? (cols[idxStation] || '').trim() : '';
    const notes =
      idxNotes !== -1 ? (cols[idxNotes] || '').trim() : '';

    if (!categoriesMap.has(category)) {
      const id = category
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/gi, '-');

      categoriesMap.set(category, {
        id,
        name: category,
        items: [],
      });
    }

    const cat = categoriesMap.get(category);

    cat.items.push({
      id: itemId || `${cat.id}-${cat.items.length + 1}`,
      name,
      station: station || undefined,
      notes: notes || undefined,
    });
  }

  cachedMenu = {
    categories: Array.from(categoriesMap.values()),
  };

  console.log(
    'DEBUG menú cargado desde CSV. Categorías:',
    cachedMenu.categories.map((c) => `${c.name} (${c.items.length})`)
  );

  return cachedMenu;
}

async function getActiveMenu() {
  return loadMenuFromCsv();
}

module.exports = {
  getActiveMenu,
};
