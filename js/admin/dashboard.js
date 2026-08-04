function refreshDashboard() {
  const orders = DB.get("orders", []);
  const foods = DB.get("foods", []);
  const today = new Date().toDateString();

  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === today,
  );
  const sales = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  document.getElementById("todaySales").textContent = formatSAR(sales);
  document.getElementById("pendingOrders").textContent = orders.filter(
    (o) => o.status === "Pending" || o.status === "Preparing",
  ).length;
  document.getElementById("menuCount").textContent = foods.length;
  document.getElementById("totalOrders").textContent = orders.length;
}

refreshDashboard();
liveRefresh(refreshDashboard);
