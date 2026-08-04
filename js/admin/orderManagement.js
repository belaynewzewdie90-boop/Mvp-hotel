const orderList = document.getElementById("orderList");

const STATUS_FLOW = ["Pending", "Preparing", "Ready", "Served"];

function renderOrders() {
  const orders = DB.get("orders", [])
    .filter((o) => o.status !== "Served")
    .slice()
    .reverse();
  if (!orders.length) {
    orderList.innerHTML = `
      <div class="empty-state">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="12" y2="15"/></svg>
        <p>No orders yet. Orders placed from the customer menu will appear here.</p>
      </div>`;
    return;
  }

  orderList.innerHTML = orders.map(orderRow).join("");
}

function orderRow(order) {
  const items = order.items
    .map((i) => `${esc(i.name)} × ${i.quantity}`)
    .join(", ");
  return `
    <div class="order-row">
      <div class="order-main">
        <div class="order-table-chip">${esc(order.table)}</div>
        <div class="order-info">
          <strong>Table ${esc(order.table)}</strong>
          <small>${items}</small>
          <span class="time-ago">${timeAgo(order.createdAt)}</span>
        </div>
      </div>
      <div class="order-meta">
        ${statusBadge(order.status)}
        <strong class="order-total">${formatSAR(order.total)}</strong>
        ${order.status !== "Served" ? `<button class="btn btn-primary btn-sm" onclick="updateOrderStatus(${order.id})">Advance</button>` : ""}
        <button class="btn btn-sm btn-danger" onclick="deleteOrder(${order.id})" title="Delete">${Icons.trash}</button>
      </div>
    </div>`;
}

function nextStatus(status) {
  const i = STATUS_FLOW.indexOf(status);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : status;
}

function updateOrderStatus(id) {
  const orders = DB.get("orders", []);
  const order = orders.find((entry) => entry.id === id);
  if (!order) return;
  const from = order.status;
  order.status = nextStatus(order.status);
  DB.set("orders", orders);

  if (from === "Pending" && order.status === "Preparing") {
    const { shortages } = DB.consumeOrder(order);
    if (shortages.length) {
      toast(
        `Out of stock: ${shortages.map((s) => `${s.name} (short ${s.shortage})`).join(", ")}. Please restock in Store.`,
        "error",
      );
    } else {
      toast("Ingredients deducted from inventory", "success");
    }
  }

  renderOrders();
  refreshDashboard();
}

async function deleteOrder(id) {
  const order = DB.get("orders", []).find((o) => o.id === id);
  const ok = await confirmModal({
    title: "Delete order?",
    message: `Order for table ${esc(order ? order.table : "?")} will be removed permanently.`,
  });
  if (!ok) return;
  DB.set("orders", DB.get("orders", []).filter((o) => o.id !== id));
  renderOrders();
  refreshDashboard();
  toast("Order deleted", "success");
}

renderOrders();
liveRefresh(() => {
  renderOrders();
  refreshDashboard();
});
