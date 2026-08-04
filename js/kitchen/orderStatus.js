const STATUS_FLOW = ["Pending", "Preparing", "Ready", "Served"];

function nextStatus(status) {
  const i = STATUS_FLOW.indexOf(status);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : status;
}

function updateKitchenStatus(id) {
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
        `Ingredients deducted, but out of stock: ${shortages.map((s) => `${s.name} (short ${s.shortage})`).join(", ")}. Please restock in Store.`,
        "error",
      );
    } else {
      toast(`Ingredients deducted from inventory for table ${order.table}`, "success");
    }
  }

  renderKitchenOrders();
  if (order.status === "Ready") {
    toast(`Order for table ${order.table} is ready to serve`, "success");
  }
}

function elapsed(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
