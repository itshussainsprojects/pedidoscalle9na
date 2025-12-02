// Importador de menú desde CSV usando rutas del .env

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { db, initDb } = require('../db');

function resolvePath(p) {
  if (!p) return null;
  if (path.isAbsolute(p)) return p;
  return path.join(process.cwd(), p);
}

function main() {
  initDb();

  const csvEnv = process.env.MENU_CSV_URL || './data/menu.csv';
  const modifiersEnv = process.env.MODIFIERS_JSON_URL || './data/modifiers.json';

  const csvPath = resolvePath(csvEnv);
  const modifiersPath = resolvePath(modifiersEnv);

  if (!fs.existsSync(csvPath)) {
    console.error(`[import-menu] No encuentro el CSV en: ${csvPath}`);
    process.exit(1);
  }

  console.log(`[import-menu] Usando CSV: ${csvPath}`);
  console.log(`[import-menu] Usando modifiers: ${modifiersPath}`);

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  // Limpiamos tabla de menú
  db.prepare('DELETE FROM menu_items').run();

  const insertStmt = db.prepare(`
    INSERT INTO menu_items (
      item_id,
      category,
      name_es,
      stations,
      modifier_groups,
      notes_kitchen,
      is_promo,
      active,
      raw_json
    ) VALUES (
      @item_id,
      @category,
      @name_es,
      @stations,
      @modifier_groups,
      @notes_kitchen,
      @is_promo,
      @active,
      @raw_json
    )
  `);

  let countTotal = 0;
  let countActive = 0;

  const tx = db.transaction(() => {
    for (const row of records) {
      countTotal += 1;

      const activeField = String(row.active || '').toLowerCase().trim();
      const isActive =
        activeField === 'true' ||
        activeField === '1' ||
        activeField === 'sí' ||
        activeField === 'si';

      if (!isActive) continue;

      countActive += 1;

      const stations = (row.station_ids || row.stations || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .join(',');

      const modifierGroups = (row.modifier_group_ids || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .join(',');

      insertStmt.run({
        item_id: row.item_id,
        category: row.category,
        name_es: row.name_es,
        stations,
        modifier_groups: modifierGroups,
        notes_kitchen: row.notes_kitchen || '',
        is_promo: row.is_promo ? 1 : 0,
        active: isActive ? 1 : 0,
        raw_json: JSON.stringify(row)
      });
    }
  });

  tx();

  console.log(`[import-menu] Filas CSV totales: ${countTotal}`);
  console.log(`[import-menu] Items activos importados: ${countActive}`);
  console.log('[import-menu] Listo.');
}

main();
