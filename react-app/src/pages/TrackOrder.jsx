import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDb } from "../context/DbContext";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";
import { formatSAR, itemsText, timeAgo } from "../lib/helpers";
import { getSession, ordersForSession } from "../lib/session";

const STEPS = ["Pending", "Preparing", "Ready", "Served"];
const STEP_LABELS = {
  Pending: "Ordered",
  Preparing: "Preparing",
  Ready: "Ready",
  Served: "Served",
};

const SHADOW = "shadow-[0_6px_16px_-6px_rgba(17,17,17,0.12)]";

function TrackSteps({ order }) {
  const currentIdx = STEPS.indexOf(order.status);
  return (
    <div className="flex items-start gap-1.5">
      {STEPS.map((step, i) => (
        <div
          key={step}
          className={`flex flex-col items-center gap-1.5 text-center ${i > 0 ? "flex-1" : ""}`}
        >
          <div className="flex w-full items-center">
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                i <= currentIdx
                  ? "border-brand bg-brand text-white shadow-[0_0_0_4px_rgba(251,153,28,0.25)]"
                  : "border-gray-300 bg-surface-2"
              } ${i === currentIdx ? "border-brand bg-white" : ""}`}
            >
              {i < currentIdx && <Icon name="check" className="h-3 w-3" />}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`h-[3px] flex-1 rounded-full ${
                  i < currentIdx ? "bg-brand" : "bg-gray-200"
                }`}
              />
            )}
          </div>
          <span
            className={`text-[0.72rem] font-bold uppercase tracking-[0.05em] ${
              i <= currentIdx ? "text-brand-ink" : "text-faint"
            }`}
          >
            {STEP_LABELS[step]}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const table = searchParams.get("table") || "1";
  const { data } = useDb();
  const session = useMemo(() => getSession(table), [table]);

  const { latest, all } = useMemo(() => {
    const orders = ordersForSession(data.orders, table, session.id).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    return { latest: orders[0] || null, all: orders };
  }, [data.orders, table, session.id]);

  const order = latest;
  const done = order?.status === "Served";
  const justPlaced = order?.status === "Pending";

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_500px_at_10%_-10%,rgba(251,153,28,0.14),transparent_55%),#f8f8f8] px-6 py-6 max-sm:px-3.5 max-sm:py-3.5">
      <div className="mx-auto max-w-[620px]">
        <header className="flex flex-wrap items-center gap-3.5 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_6px_16px_-6px_rgba(17,17,17,0.12)]">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-brand to-brand-strong text-white">
            <Icon name="zap" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-brand">
              Grand Plaza Hotel
            </p>
            <h1 className="my-0.5 text-[1.35rem] font-bold tracking-tight text-ink">
              Order Tracking
            </h1>
            <p className="text-[0.85rem] text-muted">
              Live updates straight from the kitchen
            </p>
          </div>
          <div className="ml-auto flex shrink-0 flex-col items-center rounded-[14px] border border-brand/30 bg-brand-soft px-4 py-2.5 text-center max-sm:ml-0 max-sm:w-full max-sm:flex-row max-sm:justify-between">
            <small className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
              Table
            </small>
            <strong className="text-[1.6rem] font-extrabold leading-none text-brand max-sm:text-[1.3rem]">
              {table}
            </strong>
          </div>
        </header>

        {!order && (
          <section className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-[0_6px_16px_-6px_rgba(17,17,17,0.12)]">
            <Icon name="cart" className="h-11 w-11 text-faint opacity-70" />
            <h3 className="text-[1.15rem] font-bold text-ink">
              No active order for table {table}
            </h3>
            <p className="max-w-[340px] text-[0.95rem] text-muted">
              Looks like nothing has been ordered yet from this table. Browse the
              menu to place your order — it will appear here instantly.
            </p>
            <Link
              className="mt-1 flex items-center gap-2 rounded-[10px] bg-gradient-to-b from-amber-400 to-brand px-4 py-2.5 font-semibold text-white shadow-sm transition hover:brightness-105"
              to={`/?table=${table}`}
            >
              <Icon name="menu" className="h-4 w-4" />
              Browse the menu
            </Link>
          </section>
        )}

        {order && (
          <section className={`mt-5 rounded-2xl border border-gray-200 bg-white p-6 ${SHADOW}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-[1.05rem] font-bold">
                <Icon name="zap" className="h-4 w-4" />
                Your Order
              </h2>
              <StatusBadge status={order.status} />
            </div>
            {justPlaced && (
              <div className="mb-3 flex items-center gap-2 rounded-[10px] bg-green-100 px-3.5 py-2.5 text-[0.92rem] font-bold text-green-900">
                <Icon name="check" className="h-4 w-4 text-green-600" />
                Order confirmed — order #{order.id}
              </div>
            )}
            <div className="mb-2.5 flex items-center justify-between text-[0.8rem] font-semibold text-faint">
              <span>Order #{order.id}</span>
              <span>Placed {timeAgo(order.createdAt)}</span>
            </div>
            <div className="mb-2 text-[0.95rem] font-semibold">
              {itemsText(order.items, " · ")}
            </div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[0.9rem] text-muted">Table {order.table}</span>
              <strong>{formatSAR(order.total)}</strong>
            </div>
            <p className="mb-4.5 text-[0.88rem] text-muted">
              {done
                ? "Order complete — enjoy your meal!"
                : "Order received! The kitchen has been notified. We'll update you here as your order progresses."}
            </p>
            <TrackSteps order={order} />
          </section>
        )}

        {all.length > 0 && (
          <section className={`mt-5 rounded-2xl border border-gray-200 bg-white p-5 ${SHADOW}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-[1.05rem] font-bold">Previous Orders</h2>
              <span className="text-[0.9rem] text-muted">
                {all.length === 1 ? "1 order" : `${all.length} orders`}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {all.map((o) => (
                <div
                  className="flex items-center justify-between gap-3.5 rounded-[14px] border border-gray-200 bg-white px-4 py-3.5"
                  key={o.id}
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neutral-900 text-[0.95rem] font-extrabold text-brand">
                      #{o.id}
                    </div>
                    <div className="min-w-0">
                      <strong className="text-[0.95rem]">Order #{o.id}</strong>
                      <small className="mt-0.5 block truncate text-muted">
                        {itemsText(o.items, " · ")}
                      </small>
                      <span className="text-[0.8rem] text-faint">
                        {timeAgo(o.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3.5">
                    <StatusBadge status={o.status} />
                    <strong className="whitespace-nowrap font-extrabold">
                      {formatSAR(o.total)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="mt-4 text-center text-[0.82rem] text-muted">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[0.72rem] font-bold uppercase tracking-[0.05em] text-green-900">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
            Live
          </span>
          &nbsp; This page updates automatically. Keep it open.
        </p>
      </div>
    </div>
  );
}
