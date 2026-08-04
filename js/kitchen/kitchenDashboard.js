const kitchenBoard = document.getElementById("kitchenBoard");

const COLUMNS = [
  { status: "Pending", label: "New Orders", iconClass: "pending", icon: Icons.bell },
  { status: "Preparing", label: "Preparing", iconClass: "preparing", icon: Icons.fire },
  { status: "Ready", label: "Ready to Serve", iconClass: "ready", icon: Icons.check },
];

let seenIds = new Set(DB.get("orders", []).map((o) => o.id));

function renderKitchenOrders() {
  const orders = DB.get("orders", []);

  kitchenBoard.innerHTML = COLUMNS.map((col) => {
    const colOrders = orders
      .filter((o) => o.status === col.status)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return `
      <section class="kitchen-col">
        <div class="kitchen-col-head">
          <div class="col-icon ${col.iconClass}">${col.icon}</div>
          <h3>${col.label}</h3>
          <span class="count">${colOrders.length}</span>
        </div>
        ${colOrders.length ? colOrders.map((o) => kitchenCard(o)).join("") : `<div class="empty-state"><p>No orders here</p></div>`}
      </section>`;
  }).join("");
}

function kitchenCard(order) {
  const items = order.items
    .map((i) => `<strong>${i.quantity}×</strong> ${esc(i.name)}`)
    .join("<br />");
  const ingredients = DB.ingredientSummary(order.items);
  const isNew = !seenIds.has(order.id);
  const action =
    order.status === "Ready"
      ? `<button class="btn btn-primary advance" onclick="updateKitchenStatus(${order.id})">Mark Served</button>`
      : `<button class="btn btn-primary advance" onclick="updateKitchenStatus(${order.id})">${order.status === "Pending" ? "Start Preparing" : "Mark Ready"}</button>`;

  return `
    <div class="kitchen-card ${isNew ? "flash" : ""}">
      <div class="kc-head">
        <span class="kc-table">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
          Table ${esc(order.table)}
        </span>
        <span class="kc-time">${Icons.clock}<span data-elapsed="${order.id}">${elapsed(order.createdAt)}</span></span>
      </div>
      <div class="kc-items">${items}</div>
      ${
        ingredients.length
          ? `<div class="kc-ingredients">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></svg>
              <span>Deducts: ${ingredients.map((i) => `<strong>${esc(i)}</strong>`).join(" · ")}</span>
            </div>`
          : ""
      }
      <div class="kc-total">
        <span class="muted">Total</span>
        <span class="total-val">${formatSAR(order.total)}</span>
      </div>
      ${action}
    </div>`;
}

function renderWithNotification() {
  const orders = DB.get("orders", []);
  const newOrders = orders.filter(
    (o) => o.status === "Pending" && !seenIds.has(o.id),
  );
  if (newOrders.length) {
    const tables = [...new Set(newOrders.map((o) => o.table))];
    toast(
      `New order${tables.length > 1 ? "s" : ""} from table${tables.length > 1 ? "s" : ""} ${tables.join(", ")}`,
      "info",
    );
  }
  renderKitchenOrders();
  seenIds = new Set(orders.map((o) => o.id));
}

renderKitchenOrders();
liveRefresh(renderWithNotification);

setInterval(() => {
  document.querySelectorAll("[data-elapsed]").forEach((el) => {
    const order = DB.get("orders", []).find((o) => o.id === Number(el.dataset.elapsed));
    if (order) el.textContent = elapsed(order.createdAt);
  });
}, 1000);
