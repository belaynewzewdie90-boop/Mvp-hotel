const inventoryForm = document.getElementById("inventoryForm");
const inventoryGrid = document.getElementById("inventoryGrid");
const lowStockAlert = document.getElementById("lowStockAlert");

const LOW_STOCK_THRESHOLD = 5;

function renderInventory() {
  const inventory = DB.get("inventory", []);

  if (!inventory.length) {
    inventoryGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        <p>No inventory items yet. Add your first stock item above.</p>
      </div>`;
    lowStockAlert.classList.add("hidden");
    return;
  }

  const lowItems = inventory.filter((i) => i.quantity <= LOW_STOCK_THRESHOLD);
  if (lowItems.length) {
    lowStockAlert.innerHTML = `${Icons.alert}<span>Low stock on ${lowItems.map((i) => `<strong>${esc(i.name)}</strong>`).join(", ")} — consider reordering.</span>`;
    lowStockAlert.classList.remove("hidden");
  } else {
    lowStockAlert.classList.add("hidden");
  }

  inventoryGrid.innerHTML = inventory
    .map(inventoryCard)
    .join("");
}

function inventoryCard(item) {
  const pct = Math.max(0, Math.min(100, (item.quantity / 30) * 100));
  const level =
    item.quantity <= 2
      ? "danger"
      : item.quantity <= LOW_STOCK_THRESHOLD
        ? "warn"
        : "";
  return `
    <div class="inventory-card">
      <div class="inv-head">
        <div>
          <div class="inv-name">${esc(item.name)}</div>
          <div class="inv-meta">${item.quantity <= LOW_STOCK_THRESHOLD ? "⚠ Low stock" : "In stock"}</div>
        </div>
        <span class="badge badge-${item.quantity <= LOW_STOCK_THRESHOLD ? "Low" : "Ok"}"><span class="badge-dot"></span>${item.quantity <= LOW_STOCK_THRESHOLD ? "Low" : "OK"}</span>
      </div>
      <div class="qty-bar"><div class="qty-fill ${level}" style="width:${pct}%"></div></div>
      <div class="inv-foot">
        <div class="stepper-btn">
          <button onclick="adjustQty(${item.id}, -1)" aria-label="Decrease">−</button>
          <span>${item.quantity}</span>
          <button onclick="adjustQty(${item.id}, 1)" aria-label="Increase">+</button>
        </div>
        <button class="btn btn-sm btn-danger" onclick="deleteInventory(${item.id})" title="Delete">${Icons.trash}</button>
      </div>
    </div>`;
}

function adjustQty(id, delta) {
  const inventory = DB.get("inventory", []);
  const item = inventory.find((i) => i.id === id);
  if (!item) return;
  item.quantity = Math.max(0, item.quantity + delta);
  DB.set("inventory", inventory);
  renderInventory();
}

async function deleteInventory(id) {
  const item = DB.get("inventory", []).find((i) => i.id === id);
  const ok = await confirmModal({
    title: "Delete item?",
    message: `"${esc(item ? item.name : "Item")}" will be removed from inventory.`,
  });
  if (!ok) return;
  DB.set("inventory", DB.get("inventory", []).filter((i) => i.id !== id));
  renderInventory();
  toast("Inventory item deleted", "success");
}

inventoryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const inventory = DB.get("inventory", []);
  inventory.push({
    id: Date.now(),
    name: document.getElementById("inventoryName").value.trim(),
    quantity: Number(document.getElementById("inventoryQty").value),
  });
  DB.set("inventory", inventory);
  inventoryForm.reset();
  renderInventory();
  toast("Item added to inventory", "success");
});

renderInventory();
liveRefresh(renderInventory);
