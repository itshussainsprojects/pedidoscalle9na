// public/js/client.js

console.log('client.js loaded');

// --- Table code (internal only, not shown to user) ---

function getTableFromUrl() {
  const parts = window.location.pathname.split('/');
  // /c/7 -> ["", "c", "7"]
  if (parts.length >= 3 && parts[1] === 'c') {
    return parts[2];
  }
  return null;
}

const tableCode = getTableFromUrl();
console.log('tableCode detected:', tableCode);

// Hide mesa label completely (we don't want to show raw table numbers)
const mesaLabel = document.getElementById('mesa-label');
if (mesaLabel) {
  mesaLabel.style.display = 'none';
}

// --- State ---

let menuData = null;
let cart = {}; // { [itemId]: { item, qty } }

// --- Load menu from /api/menu ---

async function loadMenu() {
  const container = document.getElementById('menu-categorias');
  if (!container) return;

  container.textContent = 'Cargando menú...';

  try {
    console.log('Fetching /api/menu ...');
    const res = await fetch('/api/menu');
    console.log('Response status for /api/menu:', res.status);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log('Menu data received:', data);
    menuData = data;
    renderMenu();
  } catch (err) {
    console.error('Error cargando menú:', err);
    container.textContent = 'Error cargando menú. Avise al mesero.';
  }
}

// --- Render menu ---

function renderMenu() {
  const container = document.getElementById('menu-categorias');
  if (!container) return;

  container.innerHTML = '';

  if (!menuData || !Array.isArray(menuData.categories)) {
    container.textContent = 'Menú no disponible.';
    return;
  }

  menuData.categories.forEach((cat) => {
    const catDiv = document.createElement('div');
    catDiv.className = 'categoria';

    const header = document.createElement('div');
    header.className = 'categoria-header';

    const title = document.createElement('h4');
    title.textContent = cat.name || 'Sin nombre';

    header.appendChild(title);
    catDiv.appendChild(header);

    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'categoria-items';

    (cat.items || []).forEach((item) => {
      const btn = document.createElement('button');
      btn.className = 'menu-item-btn';
      btn.textContent = item.name || item.id || 'Item';

      btn.addEventListener('click', () => addToCart(item));
      itemsDiv.appendChild(btn);
    });

    catDiv.appendChild(itemsDiv);
    container.appendChild(catDiv);
  });
}

// --- Cart ---

function addToCart(item) {
  if (!item || !item.id) return;
  if (!cart[item.id]) {
    cart[item.id] = { item, qty: 0 };
  }
  cart[item.id].qty += 1;
  renderCart();
}

function renderCart() {
  const list = document.getElementById('cart-items');
  const btnEnviar = document.getElementById('btn-enviar');
  if (!list) return;

  list.innerHTML = '';

  const entries = Object.values(cart);
  if (entries.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Aún no has agregado nada.';
    list.appendChild(li);
    if (btnEnviar) btnEnviar.disabled = true;
    return;
  }

  entries.forEach(({ item, qty }) => {
    const li = document.createElement('li');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${item.name || item.id} x${qty}`;

    const priceSpan = document.createElement('span');
    // No manejamos precios aún porque tu CSV no los tiene
    priceSpan.textContent = '';

    li.appendChild(nameSpan);
    li.appendChild(priceSpan);
    list.appendChild(li);
  });

  if (btnEnviar) btnEnviar.disabled = false;
}

// --- Enviar pedido al backend ---

const btnEnviar = document.getElementById('btn-enviar');
if (btnEnviar) {
  btnEnviar.addEventListener('click', async () => {
    const statusMsg = document.getElementById('status-msg');
    const guestNameInput = document.getElementById('guest-name');

    const items = Object.values(cart).map(({ item, qty }) => ({
      id: item.id,
      name: item.name,
      qty,
    }));

    if (items.length === 0) {
      if (statusMsg) {
        statusMsg.textContent =
          'Agrega algo al pedido antes de enviar.';
      }
      return;
    }

    const payload = {
      tableCode: tableCode || null, // viene del QR, pero no se muestra
      guestName:
        guestNameInput && guestNameInput.value.trim()
          ? guestNameInput.value.trim()
          : null,
      items,
    };

    try {
      btnEnviar.disabled = true;
      if (statusMsg) {
        statusMsg.textContent = 'Enviando pedido...';
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }

      const saved = await res.json();
      console.log('Pedido guardado:', saved);

      if (statusMsg) {
        statusMsg.textContent =
          'Pedido enviado. El mesero lo confirmará.';
      }

      // limpiar carrito y nombre
      cart = {};
      renderCart();
      if (guestNameInput) guestNameInput.value = '';
    } catch (err) {
      console.error('Error enviando pedido:', err);
      if (statusMsg) {
        statusMsg.textContent =
          'No se pudo enviar el pedido. Avise al mesero.';
      }
    } finally {
      btnEnviar.disabled = false;
    }
  });
}

// --- Init ---

function init() {
  console.log('client.js init');
  renderCart();
  loadMenu();
}

// Como el script está al final del body, podemos llamar init() directamente
init();
