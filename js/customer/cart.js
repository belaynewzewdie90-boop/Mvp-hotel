let cart = [];

function addToCart(foodId) {
  const food = DB.get("foods", []).find((item) => item.id === foodId);
  if (!food) return;

  const existing = cart.find((item) => item.id === foodId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...food, quantity: 1 });
  }
  renderCart();
}

function changeQty(foodId, delta) {
  const item = cart.find((c) => c.id === foodId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) removeFromCart(foodId);
  renderCart();
}

function removeFromCart(foodId) {
  cart = cart.filter((c) => c.id !== foodId);
  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const totalEl = document.getElementById("total");
  const countBadge = document.getElementById("cartCount");
  const placeBtn = document.getElementById("placeOrderBtn");

  if (!cart.length) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <p>Your cart is empty.<br />Add something tasty from the menu.</p>
      </div>`;
    totalEl.textContent = "0.00 SAR";
    countBadge.classList.add("hidden");
    placeBtn.disabled = true;
  } else {
    cartItems.innerHTML = cart.map(cartItemHtml).join("");
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalEl.textContent = formatSAR(total);
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    countBadge.textContent = `${count} item${count > 1 ? "s" : ""}`;
    countBadge.classList.remove("hidden");
    placeBtn.disabled = false;
  }

  window.renderMenu && renderMenu();
}

function cartItemHtml(item) {
  return `
    <div class="cart-item">
      <div class="ci-thumb">
        <img src="${esc(item.image)}" alt="${esc(item.name)}"
          onerror="this.onerror=null;this.src='assets/images/placeholder.svg'" />
      </div>
      <div class="ci-main">
        <div class="ci-name">${esc(item.name)}</div>
        <div class="ci-price">${esc(item.price)} SAR each</div>
      </div>
      <div class="mini-stepper">
        <button onclick="changeQty(${item.id}, -1)" aria-label="Decrease">−</button>
        <span class="ms-val">${item.quantity}</span>
        <button onclick="changeQty(${item.id}, 1)" aria-label="Increase">+</button>
      </div>
      <strong class="ci-total">${formatSAR(item.price * item.quantity)}</strong>
      <button class="ci-remove" onclick="removeFromCart(${item.id})" aria-label="Remove" title="Remove">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`;
}

renderCart();
