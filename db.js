// db.js
// Conexión SQLite síncrona usando node:sqlite + helper de transacciones

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || './data/calle_novena.db';

let db;

// Helper para obtener ruta absoluta al archivo de DB
function getResolvedPath() {
  return path.isAbsolute(DB_PATH)
    ? DB_PATH
    : path.join(process.cwd(), DB_PATH);
}

function createConnection() {
  const resolvedPath = getResolvedPath();
  const dir = path.dirname(resolvedPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const connection = new DatabaseSync(resolvedPath, {
    enableForeignKeyConstraints: true
  });

  // Añadimos helper de transacciones tipo better-sqlite3
  connection.transaction = function (fn) {
    return function (...args) {
      connection.exec('BEGIN');
      try {
        const result = fn(...args);
        connection.exec('COMMIT');
        return result;
      } catch (err) {
        try {
          connection.exec('ROLLBACK');
        } catch (rollbackErr) {
          console.error('Error en ROLLBACK:', rollbackErr);
        }
        throw err;
      }
    };
  };

  return connection;
}

function initDb() {
  if (!db) {
    db = createConnection();
  }

  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS menu_items (
      item_id TEXT PRIMARY KEY,
      category TEXT,
      name_es TEXT,
      stations TEXT,
      modifier_groups TEXT,
      notes_kitchen TEXT,
      is_promo INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      raw_json TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_num INTEGER,
      state TEXT,
      created_at TEXT,
      submitted_at TEXT,
      waiter_review_at TEXT,
      sent_to_kitchen_at TEXT,
      cooking_at TEXT,
      ready_at TEXT,
      served_at TEXT,
      void_at TEXT,
      void_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      item_id TEXT,
      name_es TEXT,
      category TEXT,
      station TEXT,
      modifiers_json TEXT,
      notes TEXT,
      qty INTEGER DEFAULT 1,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      actor TEXT,
      action TEXT,
      at TEXT,
      meta_json TEXT
    );

    CREATE TABLE IF NOT EXISTS tables (
      table_num INTEGER PRIMARY KEY,
      label TEXT
    );
  `);

  // Inicializar mapa de mesas si está vacío
  const maxTables = parseInt(process.env.TABLES_MAX || '40', 10);
  const row = db.prepare('SELECT COUNT(*) AS c FROM tables').get();
  if (row.c === 0) {
    const insertTable = db.prepare(
      'INSERT INTO tables (table_num, label) VALUES (?, ?)'
    );
    db.exec('BEGIN');
    try {
      for (let i = 1; i <= maxTables; i++) {
        insertTable.run(i, `Mesa ${i}`);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      console.error('Error inicializando tablas:', err);
    }
  }
}

// Borramos órdenes viejas (retención en días)
function cleanupOldOrders(days = 7) {
  if (!db) {
    initDb();
  }
  const cutoff = `-${days} days`;
  db.exec('PRAGMA foreign_keys = ON;');
  const del = db.prepare(`
    DELETE FROM orders
    WHERE created_at IS NOT NULL
      AND datetime(created_at) < datetime('now', ?)
  `);
  del.run(cutoff);
}

module.exports = {
  // Igual que antes: otros módulos usan { db } y/o { initDb }
  get db() {
    if (!db) {
      initDb();
    }
    return db;
  },
  initDb,
  cleanupOldOrders
};