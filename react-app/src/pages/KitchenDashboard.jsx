import { useEffect, useMemo, useRef, useState } from "react";
import { useDb } from "../context/DbContext";
import { useUi } from "../context/UiContext";
import Sidebar from "../components/Sidebar";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import { consumeOrder, ingredientSummary, refundOrder } from "../lib/db";
import { elapsed, formatSAR, nextStatus, timeAgo } from "../lib/helpers";

const COLUMNS = [
  { status: "Pending", label: "New Orders", iconClass: "pending", icon: "bell" },
  { status: "Preparing", label: "Preparing", iconClass: "preparing", icon: "fire" },
  { status: "Ready", label: "Ready to Serve", iconClass: "ready", icon: "check" },
];

function KitchenCard({ order, onAdvance, onMenu }) {
  const { data } = useDb();
  const ingredients = ingredientSummary(data, order.items);
  const done = order.status === "Served";

  return (
    <div
      className={`kitchen-card${done ? " served" : ""}`}
      onContextMenu={done ? undefined : (e) => onMenu(e, order.id)}
    >
      <div className="kc-head">
        <span className="kc-table">
          <Icon name="table" />
          Table {order.table}
        </span>
        <div className="kc-head-right">
          <span className="kc-time">
            <Icon name="clock" />
            <span>{done ? timeAgo(order.createdAt) : elapsed(order.createdAt)}</span>
          </span>
          {!done && (
            <button
              type="button"
              className="btn btn-sm kc-more"
              aria-label="Order actions"
              title="Actions (also via right-click)"
              onClick={(e) => onMenu(e, order.id)}
            >
              <Icon name="menu" />
            </button>
          )}
        </div>
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
      {done ? (
        <div className="served-label">
          <Icon name="check" />
          Served
        </div>
      ) : (
        <button className="btn btn-primary advance" onClick={() => onAdvance(order.id)}>
          {order.status === "Ready"
            ? "Mark Served"
            : order.status === "Pending"
              ? "Start Preparing"
              : "Mark Ready"}
        </button>
      )}
    </div>
  );
}

export default function KitchenDashboard() {
  const { data, update } = useDb();
  const { toast, confirm } = useUi();
  const [, setTick] = useState(0);
  const seenIds = useRef(new Set((data.orders || []).map((o) => o.id)));
  const [menu, setMenu] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const orders = data.orders || [];
  const menuOrder = menu ? orders.find((o) => o.id === menu.id) : null;

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

  const openMenu = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      id,
      x: Math.max(8, Math.min(e.clientX, window.innerWidth - 190)),
      y: Math.max(8, Math.min(e.clientY, window.innerHeight - 130)),
    });
  };

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
    };
  }, [menu]);

  const advance = (id) => {
    setMenu(null);
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
    if (to === "Served") {
      toast(`Order for table ${order.table} marked as served`, "success");
    }
  };

  const cancel = async (id) => {
    setMenu(null);
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const ok = await confirm({
      title: "Cancel order?",
      message: `Cancel the order for table ${order.table} (${formatSAR(order.total)})? Any ingredients already deducted will be returned to stock.`,
      confirmText: "Cancel Order",
    });
    if (!ok) return;
    const hadDeduction = order.status !== "Pending";
    update((d) => {
      const target = d.orders.find((o) => o.id === id);
      if (!target) return;
      if (hadDeduction) refundOrder(d, order);
      target.status = "Cancelled";
    });
    toast(`Order for table ${order.table} cancelled`, "success");
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

  const served = useMemo(
    () =>
      orders
        .filter((o) => o.status === "Served")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6),
    [orders],
  );

  const servedCount = orders.filter((o) => o.status === "Served").length;

  return (
    <div className="dashboard-shell">
      <Sidebar active="/kitchen" title="Kitchen" icon="chefHat" />
      <main className="dashboard-content">
        <div>
          <h1 className="page-title">Kitchen Board</h1>
          <p className="page-sub">Orders update live as they arrive · Right-click a card for actions</p>
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
                  <KitchenCard key={o.id} order={o} onAdvance={advance} onMenu={openMenu} />
                ))
              ) : (
                <EmptyState icon="chefHat" message="No orders here" />
              )}
            </section>
          ))}
        </div>
        <section className="served-strip">
          <div className="kitchen-col-head">
            <div className="col-icon served">
              <Icon name="receipt" />
            </div>
            <h3>Recently Served</h3>
            <span className="count">{servedCount}</span>
          </div>
          {served.length ? (
            <div className="served-cards">
              {served.map((o) => (
                <KitchenCard key={o.id} order={o} onAdvance={advance} onMenu={openMenu} />
              ))}
            </div>
          ) : (
            <EmptyState icon="receipt" message="Served orders appear here, then stay in Admin history" />
          )}
        </section>
      </main>
      {menu && menuOrder && (
        <div
          className="ctx-menu"
          style={{ left: menu.x, top: menu.y }}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="ctx-item" role="menuitem" onClick={() => advance(menuOrder.id)}>
            <Icon name={menuOrder.status === "Ready" ? "check" : menuOrder.status === "Pending" ? "bell" : "fire"} />
            {menuOrder.status === "Ready"
              ? "Mark Served"
              : menuOrder.status === "Pending"
                ? "Start Preparing"
                : "Mark Ready"}
          </button>
          <button className="ctx-item ctx-danger" role="menuitem" onClick={() => cancel(menuOrder.id)}>
            <Icon name="trash" />
            Cancel Order
          </button>
        </div>
      )}
    </div>
  );
}
