import { useState } from "react";
import { useDb } from "../context/DbContext";
import { useUi } from "../context/UiContext";
import Sidebar from "../components/Sidebar";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import { timeAgo } from "../lib/helpers";

const LOW_STOCK_THRESHOLD = 5;

function LowStockAlert({ lowItems }) {
  if (!lowItems.length) return null;
  return (
    <div className="alert-banner">
      <Icon name="alert" />
      <span>
        Low stock on {lowItems.map((i, idx) => (
          <strong key={i.id}>
            {i.name}
            {idx < lowItems.length - 1 ? ", " : ""}
          </strong>
        ))}{" "}
        — consider reordering.
      </span>
    </div>
  );
}

function InventoryPanel() {
  const { data, update } = useDb();
  const { toast, confirm } = useUi();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");

  const inventory = data.inventory || [];

  const addItem = (e) => {
    e.preventDefault();
    update((d) => {
      d.inventory.push({
        id: Date.now(),
        name: name.trim(),
        quantity: Number(qty),
      });
    });
    setName("");
    setQty("");
    toast("Item added to inventory", "success");
  };

  const adjustQty = (id, delta) => {
    update((d) => {
      const item = d.inventory.find((i) => i.id === id);
      if (item) item.quantity = Math.max(0, item.quantity + delta);
    });
  };

  const deleteItem = async (id) => {
    const item = inventory.find((i) => i.id === id);
    const ok = await confirm({
      title: "Delete item?",
      message: `"${item ? item.name : "Item"}" will be removed from inventory.`,
    });
    if (!ok) return;
    update((d) => {
      d.inventory = d.inventory.filter((i) => i.id !== id);
    });
    toast("Inventory item deleted", "success");
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Inventory</h2>
      </div>
      <form className="stack-form" onSubmit={addItem}>
        <input
          className="input"
          placeholder="Item name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input"
          type="number"
          min="1"
          placeholder="Quantity"
          required
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Add Item
        </button>
      </form>
      {inventory.length ? (
        <div className="inventory-grid">
          {inventory.map((item) => {
            const pct = Math.max(0, Math.min(100, (item.quantity / 30) * 100));
            const level =
              item.quantity <= 2
                ? "danger"
                : item.quantity <= LOW_STOCK_THRESHOLD
                  ? "warn"
                  : "";
            const low = item.quantity <= LOW_STOCK_THRESHOLD;
            return (
              <div className="inventory-card" key={item.id}>
                <div className="inv-head">
                  <div>
                    <div className="inv-name">{item.name}</div>
                    <div className="inv-meta">
                      {low ? "⚠ Low stock" : "In stock"}
                    </div>
                  </div>
                  <span className={`badge badge-${low ? "Low" : "Ok"}`}>
                    <span className="badge-dot" />
                    {low ? "Low" : "OK"}
                  </span>
                </div>
                <div className="qty-bar">
                  <div className={`qty-fill ${level}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="inv-foot">
                  <div className="stepper-btn">
                    <button onClick={() => adjustQty(item.id, -1)} aria-label="Decrease">
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => adjustQty(item.id, 1)} aria-label="Increase">
                      +
                    </button>
                  </div>
                  <button
                    className="btn btn-sm btn-danger"
                    title="Delete"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon="box" message="No inventory items yet. Add your first stock item above." />
      )}
    </section>
  );
}

function ConsumptionHistory() {
  const { data } = useDb();
  const log = data.consumptionLog || [];

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Consumption History</h2>
        {log.length > 0 && (
          <span className="muted">
            {log.length} entr{log.length === 1 ? "y" : "ies"}
          </span>
        )}
      </div>
      <div className="list">
        {log.length ? (
          log
            .slice()
            .reverse()
            .map((entry) => (
              <div className="order-row" key={entry.id}>
                <div className="order-main">
                  <div className="order-table-chip">{entry.table}</div>
                  <div className="order-info">
                    <strong>
                      Order #{entry.orderId} · Table {entry.table}
                    </strong>
                    <small>{entry.items}</small>
                    <small style={{ color: "var(--primary-ink)" }}>
                      <Icon name="box" /> Deducted: {entry.consumed}
                    </small>
                    <span className="time-ago">{timeAgo(entry.createdAt)}</span>
                  </div>
                </div>
                {entry.shortages ? (
                  <span className="badge badge-Low">
                    <span className="badge-dot" />
                    Shortages: {entry.shortages}
                  </span>
                ) : (
                  <span className="badge badge-Ok">
                    <span className="badge-dot" />
                    Stocked
                  </span>
                )}
              </div>
            ))
        ) : (
          <EmptyState
            icon="box"
            message="No ingredients consumed yet. Inventory is deducted automatically when the kitchen starts an order."
          />
        )}
      </div>
    </section>
  );
}

export default function StoreDashboard() {
  const { data } = useDb();
  const inventory = data.inventory || [];
  const lowItems = inventory.filter((i) => i.quantity <= LOW_STOCK_THRESHOLD);

  return (
    <div className="dashboard-shell">
      <Sidebar active="/store" title="Store & Inventory" icon="box" />
      <main className="dashboard-content">
        <div>
          <h1 className="page-title">Store Inventory</h1>
          <p className="page-sub">Track stock levels and reorder on time</p>
        </div>
        <LowStockAlert lowItems={lowItems} />
        <InventoryPanel />
        <ConsumptionHistory />
      </main>
    </div>
  );
}
