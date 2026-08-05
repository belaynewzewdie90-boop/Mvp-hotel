import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDb } from "../context/DbContext";
import { useUi } from "../context/UiContext";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";
import { formatSAR, itemsText, resolveImage, timeAgo } from "../lib/helpers";
import { getSession, ordersForSession } from "../lib/session";
import qrcode from "../lib/qrcode";

const STEPS = ["Pending", "Preparing", "Ready", "Served"];
const STEP_LABELS = {
  Pending: "Ordered",
  Preparing: "Preparing",
  Ready: "Ready",
  Served: "Served",
};

const SHADOW = "shadow-[0_6px_16px_-6px_rgba(17,17,17,0.12)]";

function useTableQr(table) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const url = `${window.location.origin}${window.location.pathname}?table=${encodeURIComponent(table)}`;
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    setSrc(qr.createDataURL(4, 4));
  }, [table]);
  return src;
}

function Hero({ table }) {
  const qrSrc = useTableQr(table);
  return (
    <header className="relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-tr from-white via-white to-orange-100 px-7 py-7 text-center shadow-[0_6px_16px_-6px_rgba(17,17,17,0.12)] sm:flex-row sm:justify-between sm:text-left">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[50px] -top-[70px] h-[230px] w-[230px] bg-neutral-200/75"
        style={{ clipPath: "polygon(0 0, 100% 28%, 42% 100%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[80px] -right-[60px] h-[260px] w-[260px] bg-neutral-200/75"
        style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
      />
      <div className="relative z-10">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.22em] text-brand">
          Welcome to
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Grand Plaza Hotel
        </h1>
        <p className="mt-1.5 text-muted">
          Scan, browse, and order from your table instantly.
        </p>
      </div>
      <div className="relative z-10 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-center shadow-sm">
        <small className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-muted">
          Your table
        </small>
        <h2 className="my-0.5 text-4xl font-extrabold text-brand">{table}</h2>
        {qrSrc ? (
          <img
            className="mx-auto mt-2.5 block h-[132px] w-[132px] rounded-[10px] border border-gray-200 bg-white p-2 shadow-sm"
            src={qrSrc}
            alt={`QR code for table ${table}`}
          />
        ) : (
          <div
            className="mx-auto mt-2.5 h-[132px] w-[132px] rounded-[10px] border border-gray-200 bg-white p-2 shadow-sm"
            aria-hidden="true"
          />
        )}
        <small className="mt-2 block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted">
          Scan to open your table
        </small>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[0.78rem] font-semibold text-muted">
          <Link to="/login" className="inline-flex items-center gap-1.5 hover:text-brand">
            <Icon name="lock" className="h-3.5 w-3.5" />
            Staff login
          </Link>
          <span aria-hidden="true" className="text-faint">
            ·
          </span>
          <Link
            to={`/track?table=${table}`}
            className="inline-flex items-center gap-1.5 hover:text-brand"
          >
            <Icon name="zap" className="h-3.5 w-3.5" />
            Track order
          </Link>
        </div>
      </div>
    </header>
  );
}

function TrackPanel({ table, sessionId }) {
  const { data } = useDb();
  const latest = useMemo(() => {
    const orders = ordersForSession(data.orders, table, sessionId).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    return orders[0] || null;
  }, [data.orders, table, sessionId]);

  if (!latest) return null;

  const currentIdx = STEPS.indexOf(latest.status);
  const done = latest.status === "Served";
  const justPlaced = latest.status === "Pending";

  return (
    <section
      className={`mt-5 animate-track-in rounded-2xl border border-gray-200 bg-white p-5 ${SHADOW}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[1.05rem] font-bold">
          <Icon name="zap" className="h-4 w-4" />
          Track Your Order
        </h2>
        <span className="flex items-center gap-2">
          <StatusBadge status={latest.status} />
          <Link
            className="rounded-lg px-3 py-1.5 text-[0.85rem] font-semibold text-muted hover:bg-surface-2 hover:text-ink"
            to={`/track?table=${table}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon name="external" className="h-3.5 w-3.5" />
              Full tracker
            </span>
          </Link>
        </span>
      </div>
      {justPlaced && (
        <div className="mb-3 flex items-center gap-2 rounded-[10px] bg-green-100 px-3.5 py-2.5 text-[0.92rem] font-bold text-green-900">
          <Icon name="check" className="h-4 w-4 text-green-600" />
          Order confirmed — order #{latest.id}
        </div>
      )}
      <div className="mb-2.5 flex items-center justify-between text-[0.8rem] font-semibold text-faint">
        <span>Order #{latest.id}</span>
        <span>Placed {timeAgo(latest.createdAt)}</span>
      </div>
      <div className="mb-2 text-[0.95rem] font-semibold">
        {itemsText(latest.items, " · ")}
      </div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[0.9rem] text-muted">Table {latest.table}</span>
        <strong>{formatSAR(latest.total)}</strong>
      </div>
      <p className="mb-4.5 text-[0.88rem] text-muted">
        {done
          ? "Order complete — enjoy your meal!"
          : "Order received! The kitchen has been notified. We'll update you here as your order progresses."}
      </p>
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
    </section>
  );
}

function FoodCard({ food, qty, onAdd, onChangeQty }) {
  const discount =
    food.oldPrice > food.price
      ? Math.round(((food.oldPrice - food.price) / food.oldPrice) * 100)
      : 0;
  const ribbon =
    discount > 0 ? (
      <span className="absolute left-2 top-2 z-10 rounded-md bg-red-600 px-2 py-1 text-[0.72rem] font-bold text-white">
        -{discount}%
      </span>
    ) : food.new ? (
      <span className="absolute left-2 top-2 z-10 rounded-md bg-blue-600 px-2 py-1 text-[0.72rem] font-bold text-white">
        New
      </span>
    ) : null;
  const oldPrice =
    food.oldPrice > food.price ? (
      <span className="ml-1.5 text-[0.78rem] font-medium text-faint line-through">
        {food.oldPrice} SAR
      </span>
    ) : null;

  return (
    <article className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-1.5 transition duration-200 hover:-translate-y-[3px] hover:border-gray-300 hover:shadow-[0_6px_16px_-6px_rgba(17,17,17,0.12)]">
      <div className="relative flex aspect-square items-center justify-center rounded-xl bg-peach p-4">
        {ribbon}
        <img
          className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
          src={resolveImage(food.image)}
          alt={food.name}
          onError={(e) => {
            e.currentTarget.src = "/assets/images/placeholder.svg";
          }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 pb-2.5">
        <div>
          <h3 className="line-clamp-2 min-h-[2.6em] text-[0.95rem] font-semibold leading-snug text-ink">
            {food.name}
          </h3>
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-faint">
            {food.category}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-[1.02rem] font-bold text-brand">
            {food.price} SAR{oldPrice}
          </span>
          {qty ? (
            <div className="inline-flex items-center gap-0.5 rounded-[10px] bg-brand-soft p-[3px]">
              <button
                onClick={() => onChangeQty(food.id, -1)}
                aria-label="Decrease"
                className="grid h-7 w-7 place-items-center rounded-lg bg-white text-[1.05rem] font-extrabold leading-none text-brand-strong shadow-sm transition active:scale-90"
              >
                −
              </button>
              <span className="min-w-[30px] text-center text-[0.95rem] font-extrabold text-brand-ink">
                {qty}
              </span>
              <button
                onClick={() => onChangeQty(food.id, 1)}
                aria-label="Increase"
                className="grid h-7 w-7 place-items-center rounded-lg bg-white text-[1.05rem] font-extrabold leading-none text-brand-strong shadow-sm transition active:scale-90"
              >
                +
              </button>
            </div>
          ) : (
            <button
              className="rounded-lg bg-blue-50 px-3 py-1.5 text-[0.85rem] font-semibold text-blue-600 transition hover:bg-blue-100"
              onClick={() => onAdd(food.id)}
            >
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function MenuPanel({ cart, onAdd, onChangeQty }) {
  const { data } = useDb();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...new Set((data.foods || []).map((f) => f.category))],
    [data.foods],
  );

  const filtered = (data.foods || []).filter(
    (food) =>
      (activeCategory === "All" || food.category === activeCategory) &&
      food.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-5 ${SHADOW}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[1.1rem] font-bold">Menu</h2>
        <div className="relative w-full max-w-[240px] max-sm:w-full">
          <Icon
            name="search"
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          />
          <input
            type="text"
            placeholder="Search dishes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-[10px] border border-gray-300 bg-surface-2 py-2.5 pl-9 pr-3 text-ink transition focus:border-brand focus:bg-white focus:shadow-[0_0_0_3px_rgba(251,153,28,0.18)] focus:outline-none"
          />
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`rounded-full border px-4 py-1.5 text-[0.85rem] font-semibold transition ${
              cat === activeCategory
                ? "border-brand bg-brand text-white"
                : "border-gray-200 bg-white text-muted hover:border-brand hover:bg-brand-soft hover:text-brand"
            }`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {filtered.length ? (
          filtered.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              qty={cart.find((c) => c.id === food.id)?.quantity || 0}
              onAdd={onAdd}
              onChangeQty={onChangeQty}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center gap-2 py-9 text-center text-faint">
            <Icon name="menu" className="h-10 w-10 opacity-60" />
            <p className="text-[0.95rem]">No menu items found.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function CartPanel({ cart, onAdd, onChangeQty, onRemove, onPlaceOrder }) {
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <aside
      className={`flex max-h-[calc(100vh-40px)] flex-col rounded-2xl border border-gray-200 bg-white p-5 lg:sticky lg:top-5 ${SHADOW}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[1.1rem] font-bold">Your Order</h2>
        {count > 0 && (
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-ink">
            {count} item{count > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="flex min-h-[60px] flex-1 flex-col gap-1 overflow-y-auto">
        {cart.length ? (
          cart.map((item) => (
            <div
              className="flex items-center justify-between gap-2.5 border-b border-gray-200 px-1 py-2.5"
              key={item.id}
            >
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-peach p-2">
                <img
                  className="h-full w-full object-contain"
                  src={resolveImage(item.image)}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.src = "/assets/images/placeholder.svg";
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[0.92rem] font-semibold">
                  {item.name}
                </div>
                <div className="text-[0.8rem] text-muted">
                  {item.price} SAR each
                </div>
              </div>
              <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-300">
                <button
                  onClick={() => onChangeQty(item.id, -1)}
                  aria-label="Decrease"
                  className="h-[26px] w-[26px] bg-surface-2 font-bold text-muted transition hover:bg-brand-soft hover:text-brand-strong"
                >
                  −
                </button>
                <span className="min-w-[30px] text-center text-[0.85rem] font-bold">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onChangeQty(item.id, 1)}
                  aria-label="Increase"
                  className="h-[26px] w-[26px] bg-surface-2 font-bold text-muted transition hover:bg-brand-soft hover:text-brand-strong"
                >
                  +
                </button>
              </div>
              <strong className="whitespace-nowrap text-[0.95rem] font-bold text-brand">
                {formatSAR(item.price * item.quantity)}
              </strong>
              <button
                className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-strong active:scale-90"
                onClick={() => onRemove(item.id)}
                aria-label="Remove"
                title="Remove"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 py-5 text-center text-faint">
            <Icon name="cart" className="h-[34px] w-[34px] opacity-55" />
            <p className="text-[0.9rem]">
              Your cart is empty.
              <br />
              Add something tasty from the menu.
            </p>
          </div>
        )}
      </div>
      <div className="mt-3.5 flex flex-col gap-3 border-t border-gray-200 pt-3.5">
        <div className="flex items-center justify-between text-[1.15rem] font-extrabold">
          <span>Total</span>
          <strong>{formatSAR(total)}</strong>
        </div>
        <button
          className="flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-amber-400 to-brand px-4 py-2.5 font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!cart.length}
          onClick={onPlaceOrder}
        >
          Place Order
        </button>
      </div>
    </aside>
  );
}

function MyOrders({ table, sessionId }) {
  const { data } = useDb();
  const orders = ordersForSession(data.orders, table, sessionId).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  if (!orders.length) return null;

  return (
    <section
      className={`mt-5 rounded-2xl border border-gray-200 bg-white p-5 ${SHADOW}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[1.05rem] font-bold">
          <Icon name="receipt" className="h-4 w-4" />
          My Orders
        </h2>
        <span className="text-[0.9rem] text-muted">
          {orders.length === 1 ? "1 order" : `${orders.length} orders`}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {orders.map((order) => (
          <div
            className="flex items-center justify-between gap-3.5 rounded-[14px] border border-gray-200 bg-white px-4 py-3.5"
            key={order.id}
          >
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neutral-900 text-[0.95rem] font-extrabold text-brand">
                #{order.id}
              </div>
              <div className="min-w-0">
                <strong className="text-[0.95rem]">Order #{order.id}</strong>
                <small className="mt-0.5 block truncate text-muted">
                  {itemsText(order.items, " · ")}
                </small>
                <span className="text-[0.8rem] text-faint">
                  {timeAgo(order.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3.5">
              <StatusBadge status={order.status} />
              <strong className="whitespace-nowrap font-extrabold">
                {formatSAR(order.total)}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CustomerMenu() {
  const [searchParams] = useSearchParams();
  const table = searchParams.get("table") || "1";
  const { data, update } = useDb();
  const { toast } = useUi();
  const [cart, setCart] = useState([]);
  const trackRef = useRef(null);
  const session = useMemo(() => getSession(table), [table]);

  const addToCart = (foodId) => {
    const food = (data.foods || []).find((f) => f.id === foodId);
    if (!food) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === foodId);
      if (existing) {
        return prev.map((i) =>
          i.id === foodId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...food, quantity: 1 }];
    });
  };

  const changeQty = (foodId, delta) => {
    setCart((prev) => {
      const item = prev.find((i) => i.id === foodId);
      if (!item) return prev;
      const next = item.quantity + delta;
      if (next <= 0) return prev.filter((i) => i.id !== foodId);
      return prev.map((i) =>
        i.id === foodId ? { ...i, quantity: next } : i,
      );
    });
  };

  const removeFromCart = (foodId) => {
    setCart((prev) => prev.filter((i) => i.id !== foodId));
  };

  const placeOrder = () => {
    if (!cart.length) return;
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const order = {
      id: Date.now(),
      table,
      sessionId: session.id,
      items: cart.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      total,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
    update((d) => {
      d.orders = d.orders || [];
      d.orders.push(order);
    });
    setCart([]);
    toast(`Order #${order.id} placed for table ${table}.`, "success");
    setTimeout(() => {
      trackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  return (
    <div className="min-h-screen bg-neutral-100 px-6 py-6 max-sm:px-3.5 max-sm:py-3.5">
      <div className="mx-auto max-w-[1180px]">
        <Hero table={table} />
        <div ref={trackRef}>
          <TrackPanel table={table} sessionId={session.id} />
        </div>
        <main className="mt-5 grid grid-cols-[2fr_1fr] items-start gap-5 max-lg:grid-cols-1">
          <MenuPanel cart={cart} onAdd={addToCart} onChangeQty={changeQty} />
          <CartPanel
            cart={cart}
            onAdd={addToCart}
            onChangeQty={changeQty}
            onRemove={removeFromCart}
            onPlaceOrder={placeOrder}
          />
        </main>
        <MyOrders table={table} sessionId={session.id} />
      </div>
    </div>
  );
}
