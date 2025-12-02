// models/orders.js
// Modelo de pedidos en memoria (MVP). No toca SQLite todavía.

let nextId = 1;
const orders = [];
// statuses: 'pending_waiter', 'confirmed', 'ready', 'cancelled';

function createOrder({ tableCode, guestName, items }) {
  const now = new Date();
  const order = {
    id: String(nextId++),
    tableCode: tableCode || null,
    guestName: guestName || null,
    items: items.map((it) => ({
      id: it.id,
      name: it.name || null,
      qty: Number(it.qty) || 1,
    })),
    status: 'pending_waiter',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  orders.push(order);
  return order;
}

function getOrders({ status } = {}) {
  if (!status) return orders.slice();
  return orders.filter((o) => o.status === status);
}

function getOrderById(id) {
  return orders.find((o) => o.id === id);
}

function updateOrderStatus(id, status) {
  const order = getOrderById(id);
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  return order;
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
};
