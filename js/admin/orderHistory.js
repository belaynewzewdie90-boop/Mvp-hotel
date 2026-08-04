const histSearch = document.getElementById("histSearch");
const histStatus = document.getElementById("histStatus");
const histSummary = document.getElementById("histSummary");
const histList = document.getElementById("histList");

function renderHistSummary(orders) {
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  histSummary.innerHTML = `
    <div class="hist-stat"><span>Orders</span><strong>${orders.length}</strong></div>
    <div class="hist-stat"><span>Served</span><strong>${orders.filter((o) => o.status === "Served").length}</strong></div>
    <div class="hist-stat"><span>Revenue</span><strong>${formatSAR(totalRevenue)}</strong></div>`;
}

function renderHistList() {
  const orders = DB.get("orders", []);
  const query = histSearch.value.trim().toLowerCase();
  const status = histStatus.value;

  const filtered = orders
    .filter((o) => !status || o.status === status)
    .filter((o) => {
      if (!query) return true;
      return (
        String(o.table).toLowerCase().includes(query) ||
        String(o.id).includes(query) ||
        (o.items || []).some((i) => i.name.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  renderHistSummary(filtered);

  if (!filtered.length) {
    histList.innerHTML = `
      <div class="empty-state">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="12" y2="15"/></svg>
        <p>No orders match your filters.</p>
      </div>`;
    return;
  }

  histList.innerHTML = filtered.map(histRow).join("");
}

function histRow(order) {
  const items = (order.items || [])
    .map((i) => `${esc(i.name)} × ${i.quantity}`)
    .join(", ");
  return `
    <div class="order-row">
      <div class="order-main">
        <div class="order-table-chip">${esc(order.table)}</div>
        <div class="order-info">
          <strong>#${esc(order.id)} · Table ${esc(order.table)}</strong>
          <small>${items}</small>
          <span class="time-ago">${timeAgo(order.createdAt)}</span>
        </div>
      </div>
      <div class="order-meta">
        ${statusBadge(order.status)}
        <strong class="order-total">${formatSAR(order.total)}</strong>
        <button class="btn btn-sm btn-danger" onclick="deleteHistoryOrder(${order.id})" title="Delete">${Icons.trash}</button>
      </div>
    </div>`;
}

async function deleteHistoryOrder(id) {
  const ok = await confirmModal({
    title: "Delete order?",
    message: `This order (#${id}) will be removed from history permanently.`,
  });
  if (!ok) return;
  DB.set("orders", DB.get("orders", []).filter((o) => o.id !== id));
  renderHistList();
  renderOrders();
  refreshDashboard();
  toast("Order removed from history", "success");
}

histSearch.addEventListener("input", renderHistList);
histStatus.addEventListener("change", renderHistList);

renderHistList();
liveRefresh(renderHistList);
