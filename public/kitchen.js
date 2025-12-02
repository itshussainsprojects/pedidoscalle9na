// public/kitchen.js
// Versión simple para ti: copiar TODO esto y pegarlo en el archivo.

(function () {
  // Estados finales: cuando un pedido ya no debe aparecer en cocina
  var FINAL_STATUSES = ["ready", "delivered", "served", "completed", "closed", "entregado", "cancelled"];


  // Lista de endpoints que vamos a probar, en orden
  var ENDPOINTS = [
    "/api/orders/kitchen",
    "/api/kitchen/orders",
    "/api/kitchen",
    "/api/orders/waiter",
    "/api/waiter/orders",
    "/api/orders"
  ];

  var socket = null;

  // -------------------------
  // INICIO
  // -------------------------

  init();

  function init() {
    setupSocket();
    loadKitchenOrders();

    // Actualizar los timers cada segundo
    setInterval(updateAllTimers, 1000);
  }

  // -------------------------
  // SOCKET.IO (si existe)
  // -------------------------

  function setupSocket() {
    try {
      if (window.io) {
        socket = io();

        socket.on("orderCreated", function (data) {
          console.log("Socket orderCreated", data);
          loadKitchenOrders();
        });

        socket.on("orderUpdated", function (data) {
          console.log("Socket orderUpdated", data);
          loadKitchenOrders();
        });

        socket.on("orderDeleted", function (data) {
          console.log("Socket orderDeleted", data);
          loadKitchenOrders();
        });
      } else {
        console.warn("Socket.io no encontrado. Cocina funcionará solo con recarga.");
      }
    } catch (e) {
      console.warn("Error inicializando socket en cocina:", e);
    }
  }

  // -------------------------
  // CARGA DE PEDIDOS
  // -------------------------

  function loadKitchenOrders() {
    // Empezamos probando el primer endpoint
    fetchFromEndpointIndex(0);
  }

  function fetchFromEndpointIndex(index) {
    if (index >= ENDPOINTS.length) {
      console.error("No se pudo cargar pedidos de cocina desde ningún endpoint");
      renderOrders([]);
      return;
    }

    var url = ENDPOINTS[index];

    fetch(url)
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Respuesta no OK: " + res.status);
        }
        return res.json();
      })
      .then(function (data) {
        console.log("Cocina usando endpoint:", url, data);

        var rawOrders = extractOrdersArray(data);
        var orders = normalizeAndFilterOrders(rawOrders);

        renderOrders(orders);
      })
      .catch(function (err) {
        console.warn("Fallo endpoint cocina:", url, err);
        // probamos el siguiente endpoint
        fetchFromEndpointIndex(index + 1);
      });
  }

  // Toma la respuesta del backend y saca un array de "raw orders"
  function extractOrdersArray(data) {
    if (!data) return [];

    // Si ya es array, listo
    if (Array.isArray(data)) return data;

    var result = [];

    if (Array.isArray(data.orders)) result = result.concat(data.orders);
    if (Array.isArray(data.kitchenOrders)) result = result.concat(data.kitchenOrders);
    if (Array.isArray(data.pending)) result = result.concat(data.pending);
    if (Array.isArray(data.inKitchen)) result = result.concat(data.inKitchen);
    if (Array.isArray(data.ready)) result = result.concat(data.ready);

    // Extra: por si el backend manda más arrays raros
    for (var key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
      var val = data[key];
      if (Array.isArray(val)) {
        result = result.concat(val);
      }
    }

    return result;
  }

  // Normaliza, deduplica y quita estados finales
  function normalizeAndFilterOrders(rawArray) {
    var orders = [];
    for (var i = 0; i < rawArray.length; i++) {
      var o = normalizeOrder(rawArray[i]);
      if (o) orders.push(o);
    }

    // Quitar duplicados por id
    orders = dedupeOrders(orders);

    // Dejar solo pedidos activos (no entregados/cerrados)
    var active = [];
    for (var j = 0; j < orders.length; j++) {
      var status = orders[j].status || "";
      if (status && FINAL_STATUSES.indexOf(status) !== -1) {
        continue;
      }
      active.push(orders[j]);
    }

    return active;
  }

  // -------------------------
  // NORMALIZAR UN PEDIDO
  // -------------------------

  function normalizeOrder(raw) {
    if (!raw) return null;

    var id = raw.id || raw.orderId || raw._id || null;

    // Intentamos encontrar el número de mesa en varios nombres posibles
    var tableNumber =
      raw.tableNumber ||
      raw.table_number ||
      raw.table ||
      raw.mesa ||
      raw.mesa_id ||
      raw.table_id ||
      null;

    var customerName =
      raw.customerName ||
      raw.clientName ||
      raw.client ||
      raw.name ||
      null;

    var status = raw.status || raw.state || "";

    // Ítems del pedido
    var itemsRaw = raw.items || raw.orderItems || raw.line_items || [];
    var items = [];
    if (Array.isArray(itemsRaw)) {
      for (var i = 0; i < itemsRaw.length; i++) {
        var it = itemsRaw[i] || {};
        items.push({
          name: it.name || it.itemName || it.title || "Producto",
          quantity: Number(it.quantity || it.qty || 1)
        });
      }
    }

    // Momento de inicio en cocina (o al menos de creación)
    var timeStart =
      raw.inKitchenAt ||
      raw.kitchenStartedAt ||
      raw.kitchen_start_time ||
      raw.enteredKitchenAt ||
      raw.createdAt ||
      raw.created_at ||
      null;

    return {
      id: id,
      tableNumber: tableNumber,
      customerName: customerName,
      status: status,
      items: items,
      timeStart: timeStart
    };
  }

  // Quita pedidos duplicados (mismo id)
  function dedupeOrders(orders) {
    var seen = {};
    var result = [];

    for (var i = 0; i < orders.length; i++) {
      var o = orders[i];
      if (!o) continue;

      var key = o.id || (o.tableNumber + "-" + (o.timeStart || i));

      if (!seen[key]) {
        seen[key] = true;
        result.push(o);
      }
    }

    return result;
  }

  // -------------------------
  // RENDER EN PANTALLA
  // -------------------------

  function getContainer() {
    var el =
      document.getElementById("preparation-list") ||
      document.getElementById("kitchen-orders") ||
      document.getElementById("orders-container");

    if (!el) {
      el = document.createElement("div");
      el.id = "preparation-list";
      document.body.appendChild(el);
    }

    return el;
  }

  function renderOrders(orders) {
    var container = getContainer();
    container.innerHTML = "";

    if (!orders || orders.length === 0) {
      var empty = document.createElement("p");
      empty.textContent = "No hay pedidos activos en cocina.";
      container.appendChild(empty);
      return;
    }

    for (var i = 0; i < orders.length; i++) {
      var card = buildOrderCard(orders[i]);
      container.appendChild(card);
    }
  }

  function buildOrderCard(order) {
    var card = document.createElement("div");
    card.className = "order-card";

    if (order.id) {
      card.setAttribute("data-order-id", order.id);
    }

    // -------- mesa --------
    var tableText = order.tableNumber != null ? String(order.tableNumber) : "?";

    if (order.tableNumber == null) {
      console.warn("Pedido sin tableNumber en cocina:", order);
    }

    var title = document.createElement("h2");
    title.className = "order-table";
    title.textContent = "Mesa " + tableText;
    card.appendChild(title);

    // -------- cliente --------
    if (order.customerName) {
      var pName = document.createElement("p");
      pName.className = "order-client";
      pName.textContent = "Cliente: " + order.customerName;
      card.appendChild(pName);
    }

    // -------- items --------
    if (order.items && order.items.length > 0) {
      var pItems = document.createElement("p");
      pItems.className = "order-items";

      var parts = [];
      for (var i = 0; i < order.items.length; i++) {
        var it = order.items[i];
        var qty = it.quantity || 1;
        var name = it.name || "Producto";
        parts.push(qty + " x " + name);
      }

      pItems.textContent = parts.join(", ");
      card.appendChild(pItems);
    }

    // -------- tiempo / tarde --------
    var timeP = document.createElement("p");
    timeP.className = "order-time";

    if (order.timeStart) {
      timeP.setAttribute("data-start", order.timeStart);
    }

    // minutos objetivo (ej: 15)
    timeP.setAttribute("data-target-minutes", "15");
    timeP.textContent = "Tiempo: 00:00 / 15 min";
    card.appendChild(timeP);

    var lateP = document.createElement("p");
    lateP.className = "order-late-label";
    card.appendChild(lateP);

    var sinceP = document.createElement("p");
    sinceP.className = "order-since";
    if (order.timeStart) {
      var d = new Date(order.timeStart);
      if (!isNaN(d.getTime())) {
        var hours = d.getHours();
        var mins = d.getMinutes();
        if (hours < 10) hours = "0" + hours;
        if (mins < 10) mins = "0" + mins;
        sinceP.textContent = "En cocina desde: " + hours + ":" + mins;
      }
    }
    card.appendChild(sinceP);

    return card;
  }

  // -------------------------
  // TIMERS
  // -------------------------

  function updateAllTimers() {
    var nodes = document.querySelectorAll(".order-time");
    var now = Date.now();

    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var startStr = el.getAttribute("data-start");
      if (!startStr) continue;

      var start = new Date(startStr).getTime();
      if (isNaN(start)) continue;

      var diffMs = now - start;
      if (diffMs < 0) diffMs = 0;

      var totalSeconds = Math.floor(diffMs / 1000);
      var minutes = Math.floor(totalSeconds / 60);
      var seconds = totalSeconds % 60;

      var mStr = minutes < 10 ? "0" + minutes : String(minutes);
      var sStr = seconds < 10 ? "0" + seconds : String(seconds);

      var targetStr = el.getAttribute("data-target-minutes") || "15";
      var targetMinutes = parseInt(targetStr, 10);
      if (isNaN(targetMinutes)) targetMinutes = 15;

      el.textContent = "Tiempo: " + mStr + ":" + sStr + " / " + targetMinutes + " min";

      var lateLabel = el.parentNode.querySelector(".order-late-label");
      if (lateLabel) {
        if (minutes > targetMinutes) {
          lateLabel.textContent = "TARDE";
          el.parentNode.classList.add("order-late");
        } else {
          lateLabel.textContent = "";
          el.parentNode.classList.remove("order-late");
        }
      }
    }
  }
})();
