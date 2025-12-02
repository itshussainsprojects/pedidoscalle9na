// routes/orderRoutes.js
const express = require('express');
const router = express.Router();

const {
  createOrder,
  getOrders,
  updateOrderStatus,
} = require('../models/orders');

// POST /api/orders
router.post('/orders', (req, res) => {
  const {
    tableCode,
    guestName,
    items,
    comments,
    allergies,
  } = req.body || {};

  console.log('DEBUG POST /api/orders body:', req.body);

  if (!Array.isArray(items) || items.length === 0) {
    console.log('DEBUG createOrder: items vacío');
    return res
      .status(400)
      .json({ error: 'items debe ser un array con al menos 1 elemento' });
  }

  const normalizedItems = items
    .map((it) => ({
      id: it.id,
      name: it.name || null,
      qty: Number(it.qty) || 1,
    }))
    .filter((it) => it.id);

  if (normalizedItems.length === 0) {
    console.log('DEBUG createOrder: ningún item tenía id');
    return res.status(400).json({ error: 'Cada item necesita un id' });
  }

  const order = createOrder({
    tableCode,
    guestName,
    items: normalizedItems,
    // 👇 nuevo: pasamos comentarios y alergias al modelo
    comments: comments || '',
    allergies: allergies || '',
  });

  console.log('DEBUG createOrder: creado', order);
  console.log(
    'DEBUG createOrder: total pedidos ahora =',
    getOrders().length
  );

  // Notificar a meseros y cocina por socket
  const io = req.app.get('io');
  if (io) {
    io.to('waiters').emit('order:new', order);
    io.to('kitchen').emit('order:new', order);
  }

  res.status(201).json(order);
});

// GET /api/orders?status=...
router.get('/orders', (req, res) => {
  const { status } = req.query;
  const orders = getOrders({ status });

  console.log(
    'DEBUG GET /api/orders status =',
    status,
    '->',
    orders.length,
    'pedidos'
  );

  // Si el modelo mete comments/allergies en cada order,
  // aquí salen automáticamente en el JSON.
  res.json({ orders });
});

// PATCH /api/orders/:id/status
router.patch('/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  console.log('DEBUG PATCH /api/orders/:id/status', { id, status });

  const allowed = ['pending_waiter', 'confirmed', 'ready', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'status inválido' });
  }

  const order = updateOrderStatus(id, status);
  if (!order) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  const io = req.app.get('io');
  if (io) {
    io.to('waiters').emit('order:updated', order);
    io.to('kitchen').emit('order:updated', order);
  }

  res.json(order);
});

module.exports = router;
