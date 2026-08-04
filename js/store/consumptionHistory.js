const consumeList = document.getElementById("consumeList");
const consumeCount = document.getElementById("consumeCount");

function renderConsumptionHistory() {
  const log = DB.get("consumptionLog", []);
  if (!log.length) {
    consumeCount.textContent = "";
    consumeList.innerHTML = `
      <div class="empty-state">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        <p>No ingredients consumed yet. Inventory is deducted automatically when the kitchen starts an order.</p>
      </div>`;
    return;
  }

  consumeCount.textContent = `${log.length} entr${log.length === 1 ? "y" : "ies"}`;
  consumeList.innerHTML = log.slice().reverse().map(consumeRow).join("");
}

function consumeRow(entry) {
  return `
    <div class="order-row">
      <div class="order-main">
        <div class="order-table-chip">${esc(entry.table)}</div>
        <div class="order-info">
          <strong>Order #${esc(entry.orderId)} · Table ${esc(entry.table)}</strong>
          <small>${esc(entry.items)}</small>
          <small style="color:var(--primary-ink)">${Icons.box} Deducted: ${esc(entry.consumed)}</small>
          <span class="time-ago">${timeAgo(entry.createdAt)}</span>
        </div>
      </div>
      ${
        entry.shortages
          ? `<span class="badge badge-Low"><span class="badge-dot"></span>Shortages: ${esc(entry.shortages)}</span>`
          : `<span class="badge badge-Ok"><span class="badge-dot"></span>Stocked</span>`
      }
    </div>`;
}

renderConsumptionHistory();
liveRefresh(renderConsumptionHistory);
