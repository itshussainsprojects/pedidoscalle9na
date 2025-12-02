// waiter.js - Pantalla de Meseros Calle Novena
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  console.log('DEBUG waiter: DOMContentLoaded');

  const API_BASE = '/api';

  const pendingList = document.getElementById('pending-list');    // pedidos por aprobar
  const kitchenList = document.getElementById('confirmed-list');  // pedidos en cocina
  const readyList = document.getElementById('ready-list');        // pedidos entregados

  const manualForm = document.getElementById('manual-order-form');
  const manualInput = document.getElementById('manual-table');

  if (!pendingList || !kitchenList || !readyList) {
    console.error('ERROR waiter: faltan contenedores en el HTML');
    return;
  }

  // ----- Mesero abre el menú de una mesa (/c/<mesa>) -----
  if (manualForm && manualInput) {
    manualForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = manualInput.value.trim();
      if (!code) return;
      window.open(`/c/${encodeURIComponent(code)}`, '_blank');
    });
  }

  // Estado local
  const ordersById = new Map(); // id -> order

  // ---------- Helpers ----------
  function formatItems(items) {
    if (!Array.isArray(items) || !items.length) return 'Sin ítems';
    return items.map((it) => `${it.qty} x ${it.name}`).join(', ');
  }

  function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDurationMinutes(minutes) {
    const totalSeconds = Math.max(0, Math.floor(minutes * 60));
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  // misma regla que en cocina
  function getDeadlineMinutes(order) {
    const items = order.items || [];
    if (!items.length) return 15;

    let maxDeadline = 0;

    for (const it of items) {
      const name = (it.name || '').toLowerCase();

      const isBurger =
        name.includes('hamburguesa') ||
        name.includes('burger');

      const prepTime = isBurger ? 12 : 15;
      if (prepTime > maxDeadline) maxDeadline = prepTime;
    }

    return maxDeadline || 15;
  }

  function mapStatus(status) {
    switch (status) {
      case 'pending_waiter':
        return 'Pendiente de mesero';
      case 'confirmed':
        return 'En cocina';
      case 'ready':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status || '';
    }
  }

  // --- NUEVO: mostrar comentarios y alergias ---
  function appendNotes(card, order) {
    const hasComments = order.comments && String(order.comments).trim() !== '';
    const hasAllergies = order.allergies && String(order.allergies).trim() !== '';

    if (!hasComments && !hasAllergies) return;

    const notesDiv = document.createElement('div');
    notesDiv.style.marginTop = '0.35rem';
    notesDiv.style.fontSize = '0.85rem';
    notesDiv.style.opacity = '0.9';

    if (hasComments) {
      const c = document.createElement('div');
      c.textContent = `Comentarios: ${order.comments}`;
      notesDiv.appendChild(c);
    }

    if (hasAllergies) {
      const a = document.createElement('div');
      a.textContent = `Alergias: ${order.allergies}`;
      a.style.fontWeight = 'bold';
      a.style.color = '#ff9999';
      notesDiv.appendChild(a);
    }

    card.appendChild(notesDiv);
  }

  // ---------- Render ----------
  function renderAll() {
    const all = Array.from(ordersById.values());
    console.log('DEBUG waiter: renderAll, total =', all.length);

    const pending = all.filter((o) => o.status === 'pending_waiter');
    const kitchen = all.filter((o) => o.status === 'confirmed');
    const ready = all.filter((o) => o.status === 'ready');

    renderPending(pending);
    renderKitchen(kitchen);
    renderReady(ready);
  }

  function renderPending(orders) {
    pendingList.innerHTML = '';

    if (!orders.length) {
      const p = document.createElement('p');
      p.textContent = 'No hay pedidos por aprobar.';
      p.style.opacity = '0.7';
      pendingList.appendChild(p);
      return;
    }

    orders
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .forEach((order) => {
        const card = document.createElement('article');
        card.className = 'order-card';
        card.style.border = '1px solid #444';
        card.style.borderRadius = '8px';
        card.style.padding = '0.75rem 1rem';
        card.style.marginBottom = '0.75rem';
        card.style.background = '#111';

        const title = document.createElement('h4');
        title.textContent = `Mesa ${order.tableCode || '-'}`;
        card.appendChild(title);

        const guest = document.createElement('div');
        guest.textContent = order.guestName
          ? `Cliente: ${order.guestName}`
          : 'Cliente sin nombre';
        guest.style.fontSize = '0.9rem';
        guest.style.opacity = '0.85';
        card.appendChild(guest);

        const itemsDiv = document.createElement('div');
        itemsDiv.style.marginTop = '0.25rem';
        itemsDiv.textContent = formatItems(order.items);
        card.appendChild(itemsDiv);

        // NUEVO: notas
        appendNotes(card, order);

        const meta = document.createElement('div');
        meta.style.display = 'flex';
        meta.style.justifyContent = 'space-between';
        meta.style.marginTop = '0.35rem';
        meta.style.fontSize = '0.85rem';
        meta.style.opacity = '0.8';

        const timeSpan = document.createElement('span');
        timeSpan.textContent = formatTime(order.createdAt);
        meta.appendChild(timeSpan);

        const statusSpan = document.createElement('span');
        statusSpan.textContent = mapStatus(order.status);
        meta.appendChild(statusSpan);

        card.appendChild(meta);

        const buttonRow = document.createElement('div');
        buttonRow.style.marginTop = '0.5rem';
        buttonRow.style.display = 'flex';
        buttonRow.style.gap = '0.5rem';

        const approveBtn = document.createElement('button');
        approveBtn.textContent = 'Enviar a cocina';
        approveBtn.style.cursor = 'pointer';
        approveBtn.onclick = () => updateStatus(order.id, 'confirmed');

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.opacity = '0.8';
        cancelBtn.onclick = () => {
          const ok = window.confirm('¿Cancelar este pedido?');
          if (ok) updateStatus(order.id, 'cancelled');
        };

        buttonRow.appendChild(approveBtn);
        buttonRow.appendChild(cancelBtn);
        card.appendChild(buttonRow);

        pendingList.appendChild(card);
      });
  }

  function renderKitchen(orders) {
    kitchenList.innerHTML = '';

    if (!orders.length) {
      const p = document.createElement('p');
      p.textContent = 'No hay pedidos en cocina.';
      p.style.opacity = '0.7';
      kitchenList.appendChild(p);
      return;
    }

    const now = Date.now();

    orders
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .forEach((order) => {
        const card = document.createElement('article');
        card.className = 'order-card';
        card.style.border = '1px solid #444';
        card.style.borderRadius = '8px';
        card.style.padding = '0.75rem 1rem';
        card.style.marginBottom = '0.75rem';
        card.style.background = '#111';

        const title = document.createElement('h4');
        title.textContent = `Mesa ${order.tableCode || '-'}`;
        card.appendChild(title);

        const guest = document.createElement('div');
        guest.textContent = order.guestName
          ? `Cliente: ${order.guestName}`
          : 'Cliente sin nombre';
        guest.style.fontSize = '0.9rem';
        guest.style.opacity = '0.85';
        card.appendChild(guest);

        const itemsDiv = document.createElement('div');
        itemsDiv.style.marginTop = '0.25rem';
        itemsDiv.textContent = formatItems(order.items);
        card.appendChild(itemsDiv);

        // NUEVO: notas
        appendNotes(card, order);

        const meta = document.createElement('div');
        meta.style.display = 'flex';
        meta.style.justifyContent = 'space-between';
        meta.style.marginTop = '0.35rem';
        meta.style.fontSize = '0.85rem';
        meta.style.opacity = '0.8';

        const timeSpan = document.createElement('span');
        timeSpan.textContent = formatTime(order.createdAt);
        meta.appendChild(timeSpan);

        const statusSpan = document.createElement('span');
        statusSpan.textContent = 'En cocina';
        meta.appendChild(statusSpan);

        card.appendChild(meta);

        // ----- Timer / atraso -----
        const baseTime = new Date(order.updatedAt || order.createdAt).getTime();
        const elapsedMinutes = (now - baseTime) / 60000;
        const deadline = getDeadlineMinutes(order);
        const elapsedText = formatDurationMinutes(elapsedMinutes);

        const timeRow = document.createElement('div');
        timeRow.style.marginTop = '0.35rem';
        timeRow.style.fontSize = '0.85rem';
        timeRow.style.opacity = '0.9';
        timeRow.textContent = `Tiempo: ${elapsedText} / ${deadline} min`;
        card.appendChild(timeRow);

        const lateLabel = document.createElement('div');
        lateLabel.style.marginTop = '0.25rem';
        lateLabel.style.fontSize = '0.9rem';
        lateLabel.style.fontWeight = 'bold';

        const isLate = elapsedMinutes >= deadline;

        if (isLate) {
          lateLabel.textContent = 'TARDE';
          card.style.borderColor = '#ff5555';
          card.style.background = '#330000';
          card.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.7)';
        } else {
          lateLabel.textContent = 'En preparación';
        }

        card.appendChild(lateLabel);

        const buttonRow = document.createElement('div');
        buttonRow.style.marginTop = '0.5rem';

        const readyBtn = document.createElement('button');
        readyBtn.textContent = 'Marcar entregado';
        readyBtn.style.cursor = 'pointer';
        readyBtn.onclick = () => updateStatus(order.id, 'ready'); // ready = entregado

        buttonRow.appendChild(readyBtn);
        card.appendChild(buttonRow);

        kitchenList.appendChild(card);
      });
  }

  function renderReady(orders) {
    readyList.innerHTML = '';

    if (!orders.length) {
      const p = document.createElement('p');
      p.textContent = 'No hay pedidos entregados.';
      p.style.opacity = '0.7';
      readyList.appendChild(p);
      return;
    }

    orders
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .forEach((order) => {
        const card = document.createElement('article');
        card.className = 'order-card';
        card.style.border = '1px solid #4caf50';
        card.style.borderRadius = '8px';
        card.style.padding = '0.75rem 1rem';
        card.style.marginBottom = '0.75rem';
        card.style.background = '#102a12';

        const title = document.createElement('h4');
        title.textContent = `Mesa ${order.tableCode || '-'}`;
        card.appendChild(title);

        const guest = document.createElement('div');
        guest.textContent = order.guestName
          ? `Cliente: ${order.guestName}`
          : 'Cliente sin nombre';
        guest.style.fontSize = '0.9rem';
        guest.style.opacity = '0.9';
        card.appendChild(guest);

        const itemsDiv = document.createElement('div');
        itemsDiv.style.marginTop = '0.25rem';
        itemsDiv.textContent = formatItems(order.items);
        card.appendChild(itemsDiv);

        // NUEVO: notas
        appendNotes(card, order);

        const meta = document.createElement('div');
        meta.style.display = 'flex';
        meta.style.justifyContent = 'space-between';
        meta.style.marginTop = '0.35rem';
        meta.style.fontSize = '0.85rem';
        meta.style.opacity = '0.9';

        const timeSpan = document.createElement('span');
        timeSpan.textContent = formatTime(order.createdAt);
        meta.appendChild(timeSpan);

        const statusSpan = document.createElement('span');
        statusSpan.textContent = 'Entregado';
        meta.appendChild(statusSpan);

        card.appendChild(meta);

        readyList.appendChild(card);
      });
  }

  // ---------- API ----------
  async function loadOrders() {
    console.log('DEBUG waiter: loadOrders()');
    try {
      const res = await fetch(`${API_BASE}/orders`);
      console.log('DEBUG waiter: /api/orders status =', res.status);

      if (!res.ok) {
        console.error('ERROR waiter: HTTP', res.status);
        return;
      }

      const data = await res.json();
      console.log('DEBUG waiter: respuesta cruda =', data);

      const list = Array.isArray(data) ? data : (data.orders || []);
      console.log('DEBUG waiter: lista procesada length =', list.length);

      ordersById.clear();
      list.forEach((o) => {
        if (!o || o.id == null) return;
        ordersById.set(String(o.id), o);
      });

      renderAll();
    } catch (err) {
      console.error('ERROR waiter: loadOrders()', err);
    }
  }

  async function updateStatus(id, status) {
    console.log('DEBUG waiter: updateStatus', id, status);
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      console.log('DEBUG waiter: PATCH status =', res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error('ERROR waiter PATCH:', text);
        alert('Error actualizando el pedido.');
        return;
      }

      const updated = await res.json();
      console.log('DEBUG waiter: pedido actualizado =', updated);

      if (updated && updated.id != null) {
        ordersById.set(String(updated.id), updated);
        renderAll();
      }
    } catch (err) {
      console.error('ERROR waiter: updateStatus()', err);
      alert('No se pudo actualizar el pedido.');
    }
  }

  // ---------- Socket.io ----------
  function setupSocket() {
    if (typeof io === 'undefined') {
      console.warn('DEBUG waiter: socket.io NO cargado, solo HTTP.');
      return;
    }

    const socket = io({
      query: { role: 'waiter' }
    });

    window._waiterSocket = socket;

    socket.on('connect', () => {
      console.log('DEBUG waiter: socket conectado', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('DEBUG waiter: socket desconectado');
    });

    socket.on('order:created', (order) => {
      console.log('Socket waiter order:created', order);
      if (!order || order.id == null) return;
      ordersById.set(String(order.id), order);
      renderAll();
    });

    socket.on('order:updated', (order) => {
      console.log('Socket waiter order:updated', order);
      if (!order || order.id == null) return;
      ordersById.set(String(order.id), order);
      renderAll();
    });
  }

  // ---------- Init ----------
  try {
    setupSocket();
  } catch (e) {
    console.error('ERROR waiter: setupSocket()', e);
  }

  loadOrders();

  // AUTO-REFRESH: recargar pedidos cada 10 segundos
  setInterval(() => {
    loadOrders();
  }, 10000);
});
