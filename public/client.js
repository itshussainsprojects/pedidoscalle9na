(function () {
  "use strict";

  // Menú de emergencia local
  var FALLBACK_MENU = {
    categories: [
      {
        name: "Piqueos",
        items: [
          { id: "demo-jalea", name: "Jalea mixta", price: 0 },
          { id: "demo-yuquitas", name: "Yuquitas a la huancaina", price: 0 },
          { id: "demo-empanaditas", name: "Empanaditas (aji de gallina / queso / mix)", price: 0 },
          { id: "demo-papas", name: "Papas a la huancaina", price: 0 },
          { id: "demo-patacones", name: "Patacones (10 u)", price: 0 },
          { id: "demo-maduros", name: "Maduros con queso (10 u)", price: 0 },
          { id: "demo-chicharrones", name: "Chicharrones (con papas)", price: 0 }
        ]
      },
      {
        name: "Pastas",
        items: [
          { id: "demo-tallarin-saltado", name: "Tallarin saltado", price: 0 },
          { id: "demo-tallarin-huanca", name: "Tallarin a la huancaina", price: 0 }
        ]
      },
      {
        name: "Fast Food",
        items: [
          { id: "demo-burger", name: "Cheeseburger (Kids)", price: 0 },
          { id: "demo-chicken-fingers", name: "Chicken Fingers", price: 0 }
        ]
      }
    ]
  };

  // Estado del cliente
  var state = {
    tableNumber: null,
    source: "client",
    menuCategories: [],
    orderItems: [] // { id, name, price, quantity }
  };

  document.addEventListener("DOMContentLoaded", function () {
    initClient();
  });

  function initClient() {
    var params = new URLSearchParams(window.location.search);
    var tableParam = params.get("table");
    var sourceParam = params.get("source");

    if (tableParam) {
      var num = parseInt(tableParam, 10);
      if (!isNaN(num) && num > 0) {
        state.tableNumber = num;
      }
    }

    state.source = sourceParam || "client";

    var tableLabel = document.getElementById("current-table-label");
    if (tableLabel) {
      if (state.tableNumber != null) {
        tableLabel.textContent = "Mesa " + state.tableNumber;
      } else {
        tableLabel.textContent = "Mesa no especificada";
      }
    }

    var sendBtn = document.getElementById("send-order-btn");
    if (sendBtn) {
      sendBtn.addEventListener("click", handleSendOrder);
    }

    loadMenu();
  }

  // --------------------------
  // Carga y render del menú
  // --------------------------

  function fetchMenuDataWithFallback() {
    var urls = ["/api/menu/active", "/api/menu", "/menu", "/api/menus"];
    var index = 0;

    return tryNext();

    function tryNext() {
      if (index >= urls.length) {
        console.warn("No se pudo cargar el menú desde el backend. Usando menú local.");
        return Promise.resolve(FALLBACK_MENU);
      }

      var url = urls[index];
      index += 1;

      return fetch(url)
        .then(function (res) {
          if (!res.ok) {
            console.warn("Menu: respuesta no OK en", url, res.status);
            return tryNext();
          }
          return res.json().then(function (data) {
            console.log("Menú cargado desde", url);
            return data;
          });
        })
        .catch(function (err) {
          console.warn("Menu: error intentando", url, err);
          return tryNext();
        });
    }
  }

  function loadMenu() {
    var menuPanel = document.getElementById("menu-panel");
    var menuContent = document.getElementById("menu-content");

    if (!menuContent) return;

    menuContent.innerHTML = "<p>Cargando menú...</p>";

    fetchMenuDataWithFallback()
      .then(function (data) {
        state.menuCategories = normalizeMenuData(data);
        renderMenu(state.menuCategories);
      })
      .catch(function (err) {
        console.error("Error al cargar el menú", err);
        if (menuPanel) {
          menuPanel.innerHTML =
            "<h2>Menú</h2><p>Error al cargar el menú. Intenta recargar la página.</p>";
        } else {
          menuContent.innerHTML =
            "<p>Error al cargar el menú. Intenta recargar la página.</p>";
        }
      });
  }

  function normalizeMenuData(raw) {
    var categories = [];

    if (!raw) return categories;

    if (Array.isArray(raw.categories)) {
      raw.categories.forEach(function (cat) {
        if (!cat) return;
        var name = cat.name || cat.category || "Otros";
        var items = Array.isArray(cat.items) ? cat.items : [];
        categories.push({ name: name, items: items });
      });
      return categories;
    }

    if (Array.isArray(raw)) {
      var map = {};
      raw.forEach(function (item) {
        if (!item) return;
        var catName = item.category || item.categoryName || "Otros";
        if (!map[catName]) {
          map[catName] = [];
        }
        map[catName].push(item);
      });

      Object.keys(map).forEach(function (name) {
        categories.push({ name: name, items: map[name] });
      });

      return categories;
    }

    return categories;
  }

  function renderMenu(categories) {
    var menuContent = document.getElementById("menu-content");
    if (!menuContent) return;

    menuContent.innerHTML = "";

    if (!categories || !categories.length) {
      menuContent.innerHTML = "<p>No hay ítems en el menú.</p>";
      return;
    }

    categories.forEach(function (cat) {
      var section = document.createElement("div");
      section.classList.add("menu-category");

      var title = document.createElement("h3");
      title.textContent = cat.name;
      section.appendChild(title);

      var row = document.createElement("div");
      row.classList.add("menu-items-row");

      (cat.items || []).forEach(function (item) {
        var btn = document.createElement("button");
        btn.classList.add("menu-item-btn");

        var price = 0;
        if (item.price != null) price = Number(item.price) || 0;
        else if (item.basePrice != null) price = Number(item.basePrice) || 0;
        else if (item.price_cents != null) price = Number(item.price_cents) / 100 || 0;

        var name = item.name || item.itemName || (item.title ? item.title : "Item");

        btn.textContent = name;

        btn.addEventListener("click", function () {
          addItemToOrder({
            id: item.id || name,
            name: name,
            price: price
          });
        });

        row.appendChild(btn);
      });

      section.appendChild(row);
      menuContent.appendChild(section);
    });
  }

  // --------------------------
  // Manejo del pedido
  // --------------------------

  function addItemToOrder(item) {
    var existing = state.orderItems.find(function (o) {
      return o.id === item.id && o.name === item.name;
    });

    if (existing) {
      existing.quantity += 1;
    } else {
      state.orderItems.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
      });
    }

    renderOrderSummary();
  }

  function renderOrderSummary() {
    var list = document.getElementById("order-summary");
    var emptyMsg = document.getElementById("order-empty-message");
    var totalSpan = document.getElementById("order-total");

    if (!list || !emptyMsg || !totalSpan) return;

    list.innerHTML = "";

    if (!state.orderItems.length) {
      emptyMsg.style.display = "block";
      totalSpan.textContent = "0.00";
      return;
    }

    emptyMsg.style.display = "none";

    var total = 0;

    state.orderItems.forEach(function (item) {
      var li = document.createElement("li");
      li.classList.add("order-line");

      var lineTotal = (item.price || 0) * (item.quantity || 1);
      total += lineTotal;

      li.textContent =
        (item.quantity || 1) +
        " x " +
        item.name +
        " - $" +
        lineTotal.toFixed(2);

      list.appendChild(li);
    });

    totalSpan.textContent = total.toFixed(2);
  }

  // --------------------------
  // Envío al mesero / backend
  // --------------------------

  function handleSendOrder() {
    var statusMsg = document.getElementById("order-status-message");
    if (statusMsg) statusMsg.textContent = "";

    if (!state.orderItems.length) {
      if (statusMsg) {
        statusMsg.textContent = "No has agregado ningún ítem al pedido.";
      }
      return;
    }

    var nameInput = document.getElementById("order-name");
    var foodNotesInput = document.getElementById("food-notes");
    var allergyInput = document.getElementById("allergy-notes");

    var payload = {
      tableNumber: state.tableNumber,
      customerName: nameInput ? nameInput.value.trim() : "",
      comments: foodNotesInput ? foodNotesInput.value.trim() : "",
      allergies: allergyInput ? allergyInput.value.trim() : "",
      source: state.source || "client",
      items: state.orderItems.map(function (item) {
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        };
      })
    };

    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Respuesta no OK al enviar pedido");
        }
        return res.json();
      })
      .then(function () {
        if (statusMsg) {
          statusMsg.textContent = "Pedido enviado. El mesero lo confirmará.";
        }

        state.orderItems = [];
        renderOrderSummary();
      })
      .catch(function (err) {
        console.error("Error al enviar pedido", err);
        if (statusMsg) {
          statusMsg.textContent =
            "No se pudo enviar el pedido. Intenta de nuevo.";
        }
      });
  }
})();
