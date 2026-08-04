const myOrdersPanel = document.getElementById("myOrdersPanel");
const myOrdersList = document.getElementById("myOrdersList");
const myOrdersCount = document.getElementById("myOrdersCount");

function renderMyOrders() {
  const orders = DB.get("orders", [])
    .filter((o) => String(o.table) === String(getTableNumber()))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!orders.length) {
    myOrdersPanel.classList.add("hidden");
    return;
  }
  myOrdersPanel.classList.remove("hidden");
  myOrdersCount.textContent =
    orders.length === 1 ? "1 order" : `${orders.length} orders`;

  myOrdersList.innerHTML = orders.map(myOrderRow).join("");
}

function myOrderRow(order) {
  const items = (order.items || [])
    .map((i) => `${esc(i.name)} × ${i.quantity}`)
    .join(" · ");
  return `
    <div class="order-row">
      <div class="order-main">
        <div class="order-table-chip">#${esc(order.id)}</div>
        <div class="order-info">
          <strong>Order #${esc(order.id)}</strong>
          <small>${items}</small>
          <span class="time-ago">${timeAgo(order.createdAt)}</span>
        </div>
      </div>
      <div class="order-meta">
        ${statusBadge(order.status)}
        <strong class="order-total">${formatSAR(order.total)}</strong>
      </div>
    </div>`;
}

renderMyOrders();

window.addEventListener("storage", (e) => {
  if (e.key === DB.storageKey) renderMyOrders();
});
