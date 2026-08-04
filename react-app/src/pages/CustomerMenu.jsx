import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDb } from "../context/DbContext";
import { useUi } from "../context/UiContext";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";
import { formatSAR, itemsText, resolveImage, timeAgo } from "../lib/helpers";
import qrcode from "../lib/qrcode";

const STEPS = ["Pending", "Preparing", "Ready", "Served"];
const STEP_LABELS = {
  Pending: "Ordered",
  Preparing: "Preparing",
  Ready: "Ready",
  Served: "Served",
};

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
    <header className="hero">
      <div>
        <p className="eyebrow">Welcome to</p>
        <h1>Grand Plaza Hotel</h1>
        <p className="subtitle">Scan, browse, and order from your table instantly.</p>
      </div>
      <div className="hero-card">
        <small>Your table</small>
        <h2>{table}</h2>
        {qrSrc ? (
          <img
            className="table-qr"
            src={qrSrc}
            alt={`QR code for table ${table}`}
          />
        ) : (
          <div className="table-qr" aria-hidden="true" />
        )}
        <small className="qr-hint">Scan to open your table</small>
        <Link to="/login">
          <Icon name="lock" />
          Staff login
        </Link>
        <span aria-hidden="true" style={{ color: "var(--faint)" }}>
          ·
        </span>
        <Link to={`/track?table=${table}`}>
          <Icon name="zap" />
          Track order
        </Link>
      </div>
    </header>
  );
}

function TrackPanel({ table }) {
  const { data } = useDb();
  const latest = useMemo(() => {
    const orders = (data.orders || [])
      .filter((o) => String(o.table) === String(table))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return orders[0] || null;
  }, [data.orders, table]);

  if (!latest) return null;

  const currentIdx = STEPS.indexOf(latest.status);
  const done = latest.status === "Served";
  const justPlaced = latest.status === "Pending";

  return (
    <section className="card track-panel">
      <div className="panel-head">
        <h2>
          <Icon name="zap" />
          Track Your Order
        </h2>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <StatusBadge status={latest.status} />
          <Link className="btn btn-sm btn-ghost" to={`/track?table=${table}`}>
            <Icon name="external" />
            Full tracker
          </Link>
        </span>
      </div>
      <div className="track-confirm" style={justPlaced ? undefined : { display: "none" }}>
        <Icon name="check" />
        <strong>Order confirmed — order #{latest.id}</strong>
      </div>
      <div className="track-ref">
        <span>Order #{latest.id}</span>
        <span>Placed {timeAgo(latest.createdAt)}</span>
      </div>
      <div className="track-items">{itemsText(latest.items, " · ")}</div>
      <div className="track-meta">
        <span className="track-table">Table {latest.table}</span>
        <strong>{formatSAR(latest.total)}</strong>
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
  );
}

function FoodCard({ food, qty, onAdd, onChangeQty }) {
  const discount =
    food.oldPrice > food.price
      ? Math.round(((food.oldPrice - food.price) / food.oldPrice) * 100)
      : 0;
  const ribbon =
    discount > 0 ? (
      <span className="food-ribbon">-{discount}%</span>
    ) : food.new ? (
      <span className="food-ribbon new">New</span>
    ) : null;
  const oldPrice =
    food.oldPrice > food.price ? (
      <span className="price-old">{food.oldPrice} SAR</span>
    ) : null;

  return (
    <article className="food-card">
      <div className="food-media">
        {ribbon}
        <img
          src={resolveImage(food.image)}
          alt={food.name}
          onError={(e) => {
            e.currentTarget.src = "/assets/images/placeholder.svg";
          }}
        />
      </div>
      <div className="food-body">
        <div>
          <h3>{food.name}</h3>
          <span className="food-cat">{food.category}</span>
        </div>
        <div className="food-foot">
          <span className="price">
            {food.price} SAR{oldPrice}
          </span>
          {qty ? (
            <div className="stepper">
              <button onClick={() => onChangeQty(food.id, -1)} aria-label="Decrease">
                −
              </button>
              <span className="stepper-val">{qty}</span>
              <button onClick={() => onChangeQty(food.id, 1)} aria-label="Increase">
                +
              </button>
            </div>
          ) : (
            <button className="btn btn-cart btn-sm" onClick={() => onAdd(food.id)}>
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
    <section className="menu-panel card">
      <div className="section-head">
        <h2>Menu</h2>
        <div className="search-box">
          <Icon name="search" />
          <input
            type="text"
            placeholder="Search dishes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="chip-row">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`chip ${cat === activeCategory ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="menu-grid">
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
          <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
            <Icon name="menu" />
            <p>No menu items found.</p>
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
    <aside className="cart-panel card">
      <div className="section-head">
        <h2>Your Order</h2>
        {count > 0 && (
          <span id="cartCount" className="badge badge-Pending">
            {count} item{count > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="cart-items">
        {cart.length ? (
          cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <div className="ci-thumb">
                <img
                  src={resolveImage(item.image)}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.src = "/assets/images/placeholder.svg";
                  }}
                />
              </div>
              <div className="ci-main">
                <div className="ci-name">{item.name}</div>
                <div className="ci-price">{item.price} SAR each</div>
              </div>
              <div className="mini-stepper">
                <button onClick={() => onChangeQty(item.id, -1)} aria-label="Decrease">
                  −
                </button>
                <span className="ms-val">{item.quantity}</span>
                <button onClick={() => onChangeQty(item.id, 1)} aria-label="Increase">
                  +
                </button>
              </div>
              <strong className="ci-total">
                {formatSAR(item.price * item.quantity)}
              </strong>
              <button
                className="ci-remove"
                onClick={() => onRemove(item.id)}
                aria-label="Remove"
                title="Remove"
              >
                <Icon name="x" />
              </button>
            </div>
          ))
        ) : (
          <div className="cart-empty">
            <Icon name="cart" />
            <p>
              Your cart is empty.
              <br />
              Add something tasty from the menu.
            </p>
          </div>
        )}
      </div>
      <div className="cart-summary">
        <div className="summary-row total">
          <span>Total</span>
          <strong id="total">{formatSAR(total)}</strong>
        </div>
        <button
          id="placeOrderBtn"
          className="btn btn-primary"
          disabled={!cart.length}
          onClick={onPlaceOrder}
        >
          Place Order
        </button>
      </div>
    </aside>
  );
}

function MyOrders({ table }) {
  const { data } = useDb();
  const orders = (data.orders || [])
    .filter((o) => String(o.table) === String(table))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!orders.length) return null;

  return (
    <section className="card my-orders-panel">
      <div className="panel-head">
        <h2>
          <Icon name="receipt" />
          My Orders
        </h2>
        <span className="muted">
          {orders.length === 1 ? "1 order" : `${orders.length} orders`}
        </span>
      </div>
      <div className="list">
        {orders.map((order) => (
          <div className="order-row" key={order.id}>
            <div className="order-main">
              <div className="order-table-chip">#{order.id}</div>
              <div className="order-info">
                <strong>Order #{order.id}</strong>
                <small>{itemsText(order.items, " · ")}</small>
                <span className="time-ago">{timeAgo(order.createdAt)}</span>
              </div>
            </div>
            <div className="order-meta">
              <StatusBadge status={order.status} />
              <strong className="order-total">{formatSAR(order.total)}</strong>
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
    <div className="app-shell customer-page">
      <Hero table={table} />
      <div ref={trackRef}>
        <TrackPanel table={table} />
      </div>
      <main className="customer-layout">
        <MenuPanel cart={cart} onAdd={addToCart} onChangeQty={changeQty} />
        <CartPanel
          cart={cart}
          onAdd={addToCart}
          onChangeQty={changeQty}
          onRemove={removeFromCart}
          onPlaceOrder={placeOrder}
        />
      </main>
      <MyOrders table={table} />
    </div>
  );
}
