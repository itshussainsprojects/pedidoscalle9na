const express = require('express');
const router = express.Router();
const { createClientOrder } = require('../models/orders');

// POST /api/client/orders  (sin auth, cliente QR)
router.post('/client/orders', (req, res) => {
  try {
    const { table_num, items } = req.body;
    const order = createClientOrder({ table_num, items });

    const io = req.app.get('io');
    if (io && order) {
      io.to('waiter').emit('order-updated', order);
      io.to('kitchen').emit('order-updated', order);
      io.to(`table-${order.table_num}`).emit('order-updated', order);
    }

    res.status(201).json(order);
  } catch (err) {
    console.error('Error createClientOrder', err);
    res.status(400).json({ error: err.message || 'Error al crear pedido' });
  }
});

module.exports = router;
