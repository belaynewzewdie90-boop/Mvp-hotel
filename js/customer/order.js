function placeOrder() {
  if (!cart.length) return;

  const tableNumber = document.getElementById("tableNumber").textContent;
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = {
    id: Date.now(),
    table: tableNumber,
    items: cart.map((item) => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
    total,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  const orders = DB.get("orders", []);
  orders.push(order);
  DB.set("orders", orders);

  cart = [];
  renderCart();
  window.renderTracking && renderTracking();
  window.renderMyOrders && renderMyOrders();

  const trackPanel = document.getElementById("trackPanel");
  if (trackPanel) {
    trackPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  toast(`Order #${order.id} placed for table ${tableNumber}.`, "success");
}

document.getElementById("placeOrderBtn").addEventListener("click", placeOrder);
