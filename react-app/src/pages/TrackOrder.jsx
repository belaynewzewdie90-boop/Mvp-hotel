import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDb } from "../context/DbContext";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";
import { formatSAR, itemsText, timeAgo } from "../lib/helpers";

const STEPS = ["Pending", "Preparing", "Ready", "Served"];
const STEP_LABELS = {
  Pending: "Ordered",
  Preparing: "Preparing",
  Ready: "Ready",
  Served: "Served",
};

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const table = searchParams.get("table") || "1";
  const { data } = useDb();

  const { latest, all } = useMemo(() => {
    const orders = (data.orders || [])
      .filter((o) => String(o.table) === String(table))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { latest: orders[0] || null, all: orders };
  }, [data.orders, table]);

  const order = latest;
  const currentIdx = order ? STEPS.indexOf(order.status) : -1;
  const done = order?.status === "Served";
  const justPlaced = order?.status === "Pending";

  return (
    <div className="track-page">
      <div className="app-shell track-container">
        <header className="track-header">
          <div className="brand-mark">
            <Icon name="zap" />
          </div>
          <div>
            <p className="eyebrow">Grand Plaza Hotel</p>
            <h1>Order Tracking</h1>
            <p className="subtitle">Live updates straight from the kitchen</p>
          </div>
          <div className="table-chip">
            <small>Table</small>
            <strong>{table}</strong>
          </div>
        </header>

        {!order && (
          <section className="card track-empty">
            <Icon name="cart" />
            <h3>No active order for table {table}</h3>
            <p>
              Looks like nothing has been ordered yet from this table. Browse the
              menu to place your order — it will appear here instantly.
            </p>
            <Link className="btn btn-primary" to={`/?table=${table}`}>
              <Icon name="menu" />
              Browse the menu
            </Link>
          </section>
        )}

        {order && (
          <section className="card track-panel">
            <div className="panel-head">
              <h2>
                <Icon name="zap" />
                Your Order
              </h2>
              <StatusBadge status={order.status} />
            </div>
            <div
              className="track-confirm"
              style={justPlaced ? undefined : { display: "none" }}
            >
              <Icon name="check" />
              <strong>Order confirmed — order #{order.id}</strong>
            </div>
            <div className="track-ref">
              <span>Order #{order.id}</span>
              <span>Placed {timeAgo(order.createdAt)}</span>
            </div>
            <div className="track-items">{itemsText(order.items, " · ")}</div>
            <div className="track-meta">
              <span className="track-table">Table {order.table}</span>
              <strong>{formatSAR(order.total)}</strong>
            </div>
            <p className="track-note">
              {done
                ? "Order complete — enjoy your meal!"
                : "Order received! The kitchen has been notified. We'll update you here as your order progresses."}
            </p>
            <div className="track-steps">
              {STEPS.map((step, i) => (
                <div key={step} style={{ display: "contents" }}>
                  <div
                    className={`track-step ${i <= currentIdx ? "done" : ""} ${i === currentIdx ? "current" : ""}`}
                  >
                    <div className="track-dot" />
                    <span>{STEP_LABELS[step]}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`track-line ${i < currentIdx ? "done" : ""}`} />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {all.length > 0 && (
          <section className="card my-orders-panel">
            <div className="panel-head">
              <h2>Previous Orders</h2>
              <span className="muted">
                {all.length === 1 ? "1 order" : `${all.length} orders`}
              </span>
            </div>
            <div className="list">
              {all.map((o) => (
                <div className="order-row" key={o.id}>
                  <div className="order-main">
                    <div className="order-table-chip">#{o.id}</div>
                    <div className="order-info">
                      <strong>Order #{o.id}</strong>
                      <small>{itemsText(o.items, " · ")}</small>
                      <span className="time-ago">{timeAgo(o.createdAt)}</span>
                    </div>
                  </div>
                  <div className="order-meta">
                    <StatusBadge status={o.status} />
                    <strong className="order-total">{formatSAR(o.total)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="track-foot muted">
          <span className="live-pill">
            <span className="pulse-dot" />
            Live
          </span>
          &nbsp; This page updates automatically. Keep it open.
        </p>
      </div>
    </div>
  );
}
