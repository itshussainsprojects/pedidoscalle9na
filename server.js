// server.js - Calle Novena (MongoDB + full CRUD)
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const connectDB = require("./config/database");
const Order = require("./models/Order");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// --- Auto-cleanup: Delete orders older than 24 hours ---
async function cleanupOldOrders() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await Order.deleteMany({
      created_at: { $lt: twentyFourHoursAgo }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🗑️ Cleaned up ${result.deletedCount} orders older than 24 hours`);
    }
  } catch (err) {
    console.error('❌ Error cleaning up old orders:', err);
  }
}

// Run cleanup every hour
setInterval(cleanupOldOrders, 60 * 60 * 1000); // 1 hour

// Run cleanup on server start
cleanupOldOrders();

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

// --- ÓRDENES: MongoDB con CRUD completo ---

// CREATE: Cliente envía pedido → queda "pending_waiter"
app.post("/api/orders", async (req, res) => {
  try {
    const body = req.body || {};

    // Validate items
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: "El pedido debe tener al menos un ítem." 
      });
    }

    // Create order
    const order = new Order({
      table: body.table || null,
      name: body.name || null,
      comments: body.comments || null,
      allergies: body.allergies || null,
      items: body.items,
      status: "pending_waiter"
    });

    await order.save();
    
    console.log(`[ORDERS] New order created: #${order.orderNumber}`);

    res.json({
      ok: true,
      message: `Pedido #${order.orderNumber} enviado al mesero.`,
      orderId: order.orderNumber,
      order: order.toJSON()
    });
  } catch (err) {
    console.error("Error in POST /api/orders:", err);
    res.status(500).json({ 
      ok: false, 
      message: "Error interno al crear la orden.",
      error: err.message 
    });
  }
});

// READ: Listado completo (debug/admin)
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ created_at: -1 })
      .lean();
    
    res.json({ 
      ok: true,
      orders: orders.map(o => ({
        ...o,
        id: o._id.toString(),
        _id: undefined
      }))
    });
  } catch (err) {
    console.error("Error in GET /api/orders:", err);
    res.status(500).json({ 
      ok: false, 
      message: "Error al obtener órdenes.",
      error: err.message 
    });
  }
});

// READ: Para pantalla de mesero - Pedidos pendientes
app.get("/api/orders/pending-waiter", async (req, res) => {
  try {
    const orders = await Order.find({ status: "pending_waiter" })
      .sort({ created_at: -1 })
      .lean();
    
    res.json({ 
      ok: true,
      orders: orders.map(o => ({
        ...o,
        id: o._id.toString(),
        _id: undefined
      }))
    });
  } catch (err) {
    console.error("Error in GET /api/orders/pending-waiter:", err);
    res.status(500).json({ 
      ok: false, 
      message: "Error al obtener pedidos pendientes.",
      error: err.message 
    });
  }
});

// READ: Para pantalla de cocina - Pedidos en cocina
app.get("/api/orders/in-kitchen", async (req, res) => {
  try {
    const orders = await Order.find({ status: "in_kitchen" })
      .sort({ sent_to_kitchen_at: -1 })
      .lean();
    
    res.json({ 
      ok: true,
      orders: orders.map(o => ({
        ...o,
        id: o._id.toString(),
        _id: undefined
      }))
    });
  } catch (err) {
    console.error("Error in GET /api/orders/in-kitchen:", err);
    res.status(500).json({ 
      ok: false, 
      message: "Error al obtener pedidos en cocina.",
      error: err.message 
    });
  }
});

// READ: Pedidos listos o entregados
app.get("/api/orders/ready", async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: { $in: ["ready", "delivered"] } 
    })
      .sort({ ready_at: -1 })
      .lean();
    
    res.json({ 
      ok: true,
      orders: orders.map(o => ({
        ...o,
        id: o._id.toString(),
        _id: undefined
      }))
    });
  } catch (err) {
    console.error("Error in GET /api/orders/ready:", err);
    res.status(500).json({ 
      ok: false, 
      message: "Error al obtener pedidos listos.",
      error: err.message 
    });
  }
});

// UPDATE: Mesero aprueba → pasa a cocina
app.post("/api/orders/:id/send-to-kitchen", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        ok: false, 
        message: "Orden no encontrada." 
      });
    }

    order.status = "in_kitchen";
    order.sent_to_kitchen_at = new Date();
    await order.save();
    
    console.log(`[ORDERS] Order #${order.orderNumber} sent to kitchen`);
    
    res.json({ 
      ok: true, 
      message: `Pedido #${order.orderNumber} enviado a cocina.`,
      order: order.toJSON()
    });
  } catch (err) {
    console.error("Error in send-to-kitchen:", err);
    res.status(500).json({ 
      ok: false, 
      message: "Error al enviar a cocina.",
      error: err.message 
    });
  }
});

// UPDATE: Cocina marca como listo
app.post("/api/orders/:id/mark-ready", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        ok: false, 
        message: "Orden no encontrada." 
      });
    }

    order.status = "ready";
    order.ready_at = new Date();
    await order.save();
    
    console.log(`[ORDERS] Order #${order.orderNumber} marked ready`);
    
    res.json({ 
      ok: true, 
      message: `Pedido #${order.orderNumber} marcado como listo.`,
      order: order.toJSON()
    });
  } catch (err) {
    console.error("Error in mark-ready:", err);
    res.status(500).json({ 
      ok: false, 
      message: "Error al marcar como listo.",
      error: err.message 
    });
  }
});

// UPDATE: Mesero marca como entregado
app.post("/api/orders/:id/mark-delivered", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        ok: false, 
        message: "Orden no encontrada." 
      });
    }

    order.status = "delivered";
    order.delivered_at = new Date();
    await order.save();
    
    console.log(`[ORDERS] Order #${order.orderNumber} marked delivered`);
    
    res.json({
      ok: true,
      message: `Pedido #${order.orderNumber} marcado como entregado.`,
      order: order.toJSON()
    });
  } catch (err) {
    console.error("Error in mark-delivered:", err);
    res.status(500).json({ 
      ok: false, 
      message: "Error al marcar como entregado.",
      error: err.message 
    });
  }
});

// DELETE: Cancelar/eliminar orden
app.delete("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        ok: false, 
        message: "Orden no encontrada." 
      });
    }

    const orderNum = order.orderNumber;
    await Order.findByIdAndDelete(req.params.id);
    
    console.log(`[ORDERS] Order #${orderNum} deleted`);
    
    res.json({
      ok: true,
      message: `Pedido #${orderNum} eliminado.`
    });
  } catch (err) {
    console.error("Error in delete order:", err);
    res.status(500).json({ 
      ok: false, 
      message: "Error al eliminar la orden.",
      error: err.message 
    });
  }
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
