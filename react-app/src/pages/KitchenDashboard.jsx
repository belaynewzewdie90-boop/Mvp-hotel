import { useEffect, useMemo, useRef, useState } from "react";
import { useDb } from "../context/DbContext";
import { useUi } from "../context/UiContext";
import Sidebar from "../components/Sidebar";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import { consumeOrder, ingredientSummary } from "../lib/db";
import { elapsed, formatSAR, nextStatus } from "../lib/helpers";

const COLUMNS = [
  { status: "Pending", label: "New Orders", iconClass: "pending", icon: "bell" },
  { status: "Preparing", label: "Preparing", iconClass: "preparing", icon: "fire" },
  { status: "Ready", label: "Ready to Serve", iconClass: "ready", icon: "check" },
];

function KitchenCard({ order, onAdvance }) {
  const { data } = useDb();
  const ingredients = ingredientSummary(data, order.items);

  return (
    <div className="kitchen-card">
      <div className="kc-head">
        <span className="kc-table">
          <Icon name="table" />
          Table {order.table}
        </span>
        <span className="kc-time">
          <Icon name="clock" />
          <span>{elapsed(order.createdAt)}</span>
        </span>
      </div>
      <div className="kc-items">
        {order.items.map((i, idx) => (
          <div key={idx}>
            <strong>{i.quantity}×</strong> {i.name}
          </div>
        ))}
      </div>
      {ingredients.length > 0 && (
        <div className="kc-ingredients">
          <Icon name="box" />
          <span>
            Deducts:{" "}
            {ingredients.map((i, idx) => (
              <strong key={idx}>{i}</strong>
            ))}
          </span>
        </div>
      )}
      <div className="kc-total">
        <span className="muted">Total</span>
        <span className="total-val">{formatSAR(order.total)}</span>
      </div>
      <button className="btn btn-primary advance" onClick={() => onAdvance(order.id)}>
        {order.status === "Ready"
          ? "Mark Served"
          : order.status === "Pending"
            ? "Start Preparing"
            : "Mark Ready"}
      </button>
    </div>
  );
}

export default function KitchenDashboard() {
  const { data, update } = useDb();
  const { toast } = useUi();
  const [, setTick] = useState(0);
  const seenIds = useRef(new Set((data.orders || []).map((o) => o.id)));

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const orders = data.orders || [];

  /* Notify once when brand-new pending orders appear (across tabs too). */
  useEffect(() => {
    const freshPending = orders.filter(
      (o) => o.status === "Pending" && !seenIds.current.has(o.id),
    );
    if (freshPending.length) {
      const tables = [...new Set(freshPending.map((o) => o.table))];
      toast(
        `New order${tables.length > 1 ? "s" : ""} from table${tables.length > 1 ? "s" : ""} ${tables.join(", ")}`,
        "info",
      );
    }
    seenIds.current = new Set(orders.map((o) => o.id));
  }, [orders, toast]);

  const advance = (id) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const from = order.status;
    const to = nextStatus(from);
    let shortages = [];
    update((d) => {
      const target = d.orders.find((o) => o.id === id);
      if (target) target.status = to;
      if (from === "Pending" && to === "Preparing") {
        shortages = consumeOrder(d, order).shortages;
      }
    });
    if (from === "Pending" && to === "Preparing") {
      if (shortages.length) {
        toast(
          `Ingredients deducted, but out of stock: ${shortages.map((s) => `${s.name} (short ${s.shortage})`).join(", ")}. Please restock in Store.`,
          "error",
        );
      } else {
        toast(`Ingredients deducted from inventory for table ${order.table}`, "success");
      }
    }
    if (to === "Ready") {
      toast(`Order for table ${order.table} is ready to serve`, "success");
    }
  };

  const board = useMemo(
    () =>
      COLUMNS.map((col) => {
        const colOrders = orders
          .filter((o) => o.status === col.status)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return { ...col, colOrders };
      }),
    [orders],
  );

  return (
    <div className="dashboard-shell">
      <Sidebar active="/kitchen" title="Kitchen" icon="chefHat" />
      <main className="dashboard-content">
        <div>
          <h1 className="page-title">Kitchen Board</h1>
          <p className="page-sub">Orders update live as they arrive</p>
        </div>
        <div className="kitchen-board">
          {board.map((col) => (
            <section className="kitchen-col" key={col.status}>
              <div className="kitchen-col-head">
                <div className={`col-icon ${col.iconClass}`}>
                  <Icon name={col.icon} />
                </div>
                <h3>{col.label}</h3>
                <span className="count">{col.colOrders.length}</span>
              </div>
              {col.colOrders.length ? (
                col.colOrders.map((o) => (
                  <KitchenCard key={o.id} order={o} onAdvance={advance} />
                ))
              ) : (
                <EmptyState icon="chefHat" message="No orders here" />
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
