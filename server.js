// server.js - Calle Novena (menú desde CSV + flujo cliente → mesero → cocina)
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- MENÚ: leer CSV + promociones ---
const MENU_CSV_PATH = path.join(__dirname, "data", "menu.csv");
const PROMOTIONS_JSON_PATH = path.join(__dirname, "data", "promotions.json");

// Parser simple de CSV: 1ra línea = encabezados, resto = filas
function parseCsvSimple(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1);

  return rows.map((line) => {
    const cols = line.split(",");
    const obj = {};
    header.forEach((key, idx) => {
      obj[key] = (cols[idx] || "").trim();
    });
    return obj;
  });
}

let cachedMenuItems = [];

/**
 * Carga el menú base desde menu.csv y, si existe, agrega
 * las promociones definidas en promotions.json.
 * El resultado final se guarda en cachedMenuItems.
 */
function loadMenuData() {
  let baseItems = [];

  // 1) Menú base desde CSV
  try {
    const csv = fs.readFileSync(MENU_CSV_PATH, "utf8");
    baseItems = parseCsvSimple(csv).map((row, index) => ({
      item_id: row.item_id || row.id || `item_${index}`,
      name_es: row.name_es || row.name || "",
      category: row.category || "",
      notes_kitchen: row.notes_kitchen || row.description || ""
    }));
    console.log(`[MENU] Loaded ${baseItems.length} items from CSV`);
  } catch (err) {
    console.error("[MENU] Error loading CSV:", err.message);
    baseItems = [];
  }

  // 2) Promociones desde JSON (si existe)
  let promoItems = [];
  try {
    if (fs.existsSync(PROMOTIONS_JSON_PATH)) {
      const jsonText = fs.readFileSync(PROMOTIONS_JSON_PATH, "utf8");
      const raw = JSON.parse(jsonText);

      const arr = Array.isArray(raw) ? raw : [];
      promoItems = arr
        .filter((promo) => promo && (promo.active === undefined || promo.active))
        .map((promo, index) => ({
          item_id: promo.item_id || promo.id || `promo_${index}`,
          name_es: promo.name_es || promo.name || "",
          category: promo.category || "Promociones",
          notes_kitchen: promo.notes_kitchen || promo.description || ""
        }));

      console.log(
        `[MENU] Loaded ${promoItems.length} promotions from promotions.json`
      );
    } else {
      console.log("[MENU] promotions.json not found, skipping promotions");
    }
  } catch (err) {
    console.error("[MENU] Error loading promotions:", err.message);
    promoItems = [];
  }

  cachedMenuItems = baseItems.concat(promoItems);
  console.log(
    `[MENU] Final menu ready: ${baseItems.length} base items + ${promoItems.length} promos`
  );
}

// cargar menú al iniciar
loadMenuData();

// Homepage - redirect to client page
app.get("/", (req, res) => {
  res.redirect("/client.html");
});

// endpoints de menú
app.get("/menu", (req, res) => {
  res.json(cachedMenuItems);
});

app.get("/api/menu", (req, res) => {
  res.json({ items: cachedMenuItems });
});

// --- ÓRDENES: en memoria con estados ---
let orders = [];
let nextOrderId = 1;

function findOrder(id) {
  const numId = Number(id);
  if (Number.isNaN(numId)) return null;
  return orders.find((o) => o.id === numId) || null;
}

// Cliente envía pedido → queda "pending_waiter"
app.post("/api/orders", (req, res) => {
  try {
    const body = req.body || {};
    const nowIso = new Date().toISOString();

    const order = {
      id: nextOrderId++,
      created_at: nowIso,
      status: "pending_waiter", // primero mesero
      table: body.table || null,
      name: body.name || null,
      comments: body.comments || null,
      allergies: body.allergies || null,
      items: Array.isArray(body.items) ? body.items : [],
      sent_to_kitchen_at: null,
      ready_at: null,
      delivered_at: null
    };

    orders.push(order);
    console.log("[ORDERS] New order from client:", order);

    res.json({
      ok: true,
      message: `Pedido #${order.id} enviado al mesero.`,
      orderId: order.id
    });
  } catch (err) {
    console.error("Error in POST /api/orders:", err);
    res
      .status(500)
      .json({ ok: false, message: "Error interno al crear la orden." });
  }
});

// listado completo (debug)
app.get("/api/orders", (req, res) => {
  res.json({ orders });
});

// Para pantalla de mesero / cocina
app.get("/api/orders/pending-waiter", (req, res) => {
  res.json({ orders: orders.filter((o) => o.status === "pending_waiter") });
});

app.get("/api/orders/in-kitchen", (req, res) => {
  res.json({ orders: orders.filter((o) => o.status === "in_kitchen") });
});

app.get("/api/orders/ready", (req, res) => {
  res.json({
    orders: orders.filter(
      (o) => o.status === "ready" || o.status === "delivered"
    )
  });
});

// Mesero aprueba → pasa a cocina
app.post("/api/orders/:id/send-to-kitchen", (req, res) => {
  const order = findOrder(req.params.id);
  if (!order) {
    return res
      .status(404)
      .json({ ok: false, message: "Orden no encontrada." });
  }
  order.status = "in_kitchen";
  order.sent_to_kitchen_at = new Date().toISOString();
  console.log("[ORDERS] Order sent to kitchen:", order.id);
  res.json({ ok: true, message: `Pedido #${order.id} enviado a cocina.` });
});

// Cocina marca como listo
app.post("/api/orders/:id/mark-ready", (req, res) => {
  const order = findOrder(req.params.id);
  if (!order) {
    return res
      .status(404)
      .json({ ok: false, message: "Orden no encontrada." });
  }
  order.status = "ready";
  order.ready_at = new Date().toISOString();
  console.log("[ORDERS] Order marked ready:", order.id);
  res.json({ ok: true, message: `Pedido #${order.id} marcado como listo.` });
});

// Mesero marca como entregado
app.post("/api/orders/:id/mark-delivered", (req, res) => {
  const order = findOrder(req.params.id);
  if (!order) {
    return res
      .status(404)
      .json({ ok: false, message: "Orden no encontrada." });
  }
  order.status = "delivered";
  order.delivered_at = new Date().toISOString();
  console.log("[ORDERS] Order marked delivered:", order.id);
  res.json({
    ok: true,
    message: `Pedido #${order.id} marcado como entregado.`
  });
});

// --- Arrancar servidor ---
const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Process ID: ${process.pid}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log it
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Log but don't crash immediately - let PM2 handle restart if needed
});
