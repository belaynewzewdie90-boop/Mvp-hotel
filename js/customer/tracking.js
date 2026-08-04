const trackPanel = document.getElementById("trackPanel");

const STEPS = ["Pending", "Preparing", "Ready", "Served"];
const STEP_LABELS = {
  Pending: "Ordered",
  Preparing: "Preparing",
  Ready: "Ready",
  Served: "Served",
};

function getTableNumber() {
  return document.getElementById("tableNumber").textContent || "1";
}

function getTrackedOrder() {
  const orders = DB.get("orders", []).filter(
    (o) => String(o.table) === String(getTableNumber()),
  );
  if (!orders.length) return null;
  return orders.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )[0];
}

function renderTracking() {
  const order = getTrackedOrder();
  const table = getTableNumber();
  const emptyEl = document.getElementById("trackEmpty");
  const fullLink = document.getElementById("trackFullLink");
  if (fullLink) fullLink.href = `track.html?table=${encodeURIComponent(table)}`;

  if (!order) {
    trackPanel.classList.add("hidden");
    if (emptyEl) {
      emptyEl.classList.remove("hidden");
      document.getElementById("emptyTableNum").textContent = table;
      document.getElementById("menuLink").href = `index.html?table=${encodeURIComponent(table)}`;
    }
    return;
  }

  trackPanel.classList.remove("hidden");
  if (emptyEl) emptyEl.classList.add("hidden");

  const currentIdx = STEPS.indexOf(order.status);
  const done = order.status === "Served";
  const justPlaced = order.status === "Pending";
  document.getElementById("trackBadge").innerHTML = statusBadge(order.status);

  const items = order.items
    .map((i) => `${esc(i.name)} × ${i.quantity}`)
    .join(" · ");

  document.getElementById("trackOrderInfo").innerHTML = `
    <div class="track-confirm ${justPlaced ? "" : "hidden"}">
      ${Icons.check}
      <strong>Order confirmed — order #${esc(order.id)}</strong>
    </div>
    <div class="track-ref">
      <span>Order #${esc(order.id)}</span>
      <span>Placed ${timeAgo(order.createdAt)}</span>
    </div>
    <div class="track-items">${items}</div>
    <div class="track-meta">
      <span class="track-table">Table ${esc(order.table)}</span>
      <strong>${formatSAR(order.total)}</strong>
    </div>
    <p class="track-note">${
      done
        ? "Order complete — enjoy your meal!"
        : "Order received! The kitchen has been notified. We'll update you here as your order progresses."
    }</p>`;

  document.getElementById("trackSteps").innerHTML = STEPS.map(
    (step, i) => `
      <div class="track-step ${i <= currentIdx ? "done" : ""} ${i === currentIdx ? "current" : ""}">
        <div class="track-dot"></div>
        <span>${STEP_LABELS[step]}</span>
      </div>${i < STEPS.length - 1 ? `<div class="track-line ${i < currentIdx ? "done" : ""}"></div>` : ""}`,
  ).join("");
}

renderTracking();

window.addEventListener("storage", (e) => {
  if (e.key === DB.storageKey) renderTracking();
});
