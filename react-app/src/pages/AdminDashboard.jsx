import { useMemo, useState } from "react";
import { useDb } from "../context/DbContext";
import { useUi } from "../context/UiContext";
import Sidebar from "../components/Sidebar";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import {
  formatSAR,
  ingredientsToText,
  itemsText,
  nextStatus,
  parseIngredients,
  resolveImage,
  timeAgo,
} from "../lib/helpers";
import { consumeOrder } from "../lib/db";

function StatCard({ icon, tone, label, value }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon name={icon} />
      </div>
      <div>
        <h3>{label}</h3>
        <p>{value}</p>
      </div>
    </div>
  );
}

function StatsGrid() {
  const { data } = useDb();
  const orders = data.orders || [];
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === today,
  );
  const sales = todayOrders.reduce((s, o) => s + Number(o.total || 0), 0);

  return (
    <section className="stats-grid">
      <StatCard icon="coin" tone="green" label="Today's Sales" value={formatSAR(sales)} />
      <StatCard
        icon="clock"
        tone="amber"
        label="Pending Orders"
        value={orders.filter((o) => o.status === "Pending" || o.status === "Preparing").length}
      />
      <StatCard icon="menu" tone="blue" label="Menu Items" value={(data.foods || []).length} />
      <StatCard icon="receipt" tone="red" label="Total Orders" value={orders.length} />
    </section>
  );
}

function MenuManagement() {
  const { data, update } = useDb();
  const { toast, confirm } = useUi();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    ingredients: "",
    image: "",
  });

  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", price: "", category: "", ingredients: "", image: "" });
  };

  const startEdit = (food) => {
    setEditingId(food.id);
    setForm({
      name: food.name,
      price: food.price,
      category: food.category,
      ingredients: ingredientsToText(food.ingredients),
      image: food.image || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const price = Number(form.price);
    const category = form.category.trim();
    const ingredients = parseIngredients(form.ingredients);
    const image =
      form.image.trim() || "/assets/images/placeholder.svg";

    update((d) => {
      if (editingId) {
        const food = d.foods.find((f) => f.id === editingId);
        if (food) {
          Object.assign(food, { name, price, category, image, ingredients });
        }
      } else {
        d.foods.push({
          id: Date.now(),
          name,
          price,
          category,
          image,
          ingredients,
        });
      }
    });
    toast(editingId ? "Item updated" : `"${name}" added to the menu`, "success");
    resetForm();
  };

  const deleteFood = async (id) => {
    const food = (data.foods || []).find((f) => f.id === id);
    const ok = await confirm({
      title: "Delete item?",
      message: `"${food ? food.name : "Item"}" will be removed from the menu and can no longer be ordered.`,
    });
    if (!ok) return;
    update((d) => {
      d.foods = d.foods.filter((f) => f.id !== id);
    });
    toast("Item deleted from menu", "success");
  };

  return (
    <section className="panel admin-panel">
      <div className="panel-head">
        <h2>Menu Management</h2>
        <span className="muted">{editingId ? "Editing existing dish" : "Add a new dish"}</span>
      </div>
      <form className="stack-form" onSubmit={handleSubmit}>
        <input className="input" placeholder="Food name" required value={form.name} onChange={setField("name")} />
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          placeholder="Price (SAR)"
          required
          value={form.price}
          onChange={setField("price")}
        />
        <input
          className="input"
          placeholder="Category (e.g. Main)"
          required
          value={form.category}
          onChange={setField("category")}
        />
        <input
          className="input"
          placeholder="Ingredients (e.g. Bread Buns:1, Cheese:1)"
          value={form.ingredients}
          onChange={setField("ingredients")}
        />
        <input
          className="input"
          placeholder="Image URL (optional)"
          value={form.image}
          onChange={setField("image")}
        />
        <button type="submit" className="btn btn-primary">
          {editingId ? "Save Changes" : "Add Item"}
        </button>
        {editingId && (
          <button type="button" className="btn" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>
      <div>
        {(data.foods || []).length ? (
          <table className="menu-table">
            <thead>
              <tr>
                <th />
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data.foods || []).map((food) => (
                <tr key={food.id}>
                  <td>
                    <img
                      className="thumb"
                      src={resolveImage(food.image)}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = "/assets/images/placeholder.svg";
                      }}
                    />
                  </td>
                  <td>
                    <strong>{food.name}</strong>
                  </td>
                  <td>
                    <span className="food-tag">{food.category}</span>
                  </td>
                  <td>
                    <strong>{food.price} SAR</strong>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-sm"
                        title="Edit"
                        onClick={() => startEdit(food)}
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        title="Delete"
                        onClick={() => deleteFood(food.id)}
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState icon="menu" message="No menu items yet. Add your first dish above." />
        )}
      </div>
    </section>
  );
}

function OrderManagement() {
  const { data, update } = useDb();
  const { toast, confirm } = useUi();
  const orders = (data.orders || [])
    .filter((o) => o.status !== "Served" && o.status !== "Cancelled")
    .slice()
    .reverse();

  const updateStatus = (id) => {
    const order = (data.orders || []).find((o) => o.id === id);
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
    if (shortages.length) {
      toast(
        `Out of stock: ${shortages.map((s) => `${s.name} (short ${s.shortage})`).join(", ")}. Please restock in Store.`,
        "error",
      );
    } else if (from === "Pending" && to === "Preparing") {
      toast("Ingredients deducted from inventory", "success");
    }
  };

  const deleteOrder = async (id) => {
    const order = (data.orders || []).find((o) => o.id === id);
    const ok = await confirm({
      title: "Delete order?",
      message: `Order for table ${order ? order.table : "?"} will be removed permanently.`,
    });
    if (!ok) return;
    update((d) => {
      d.orders = d.orders.filter((o) => o.id !== id);
    });
    toast("Order deleted", "success");
  };

  return (
    <section className="panel admin-panel">
      <div className="panel-head">
        <h2>Order Management</h2>
      </div>
      <div className="list">
        {orders.length ? (
          orders.map((order) => (
            <div className="order-row" key={order.id}>
              <div className="order-main">
                <div className="order-table-chip">{order.table}</div>
                <div className="order-info">
                  <strong>Table {order.table}</strong>
                  <small>{itemsText(order.items)}</small>
                  <span className="time-ago">{timeAgo(order.createdAt)}</span>
                </div>
              </div>
              <div className="order-meta">
                <StatusBadge status={order.status} />
                <strong className="order-total">{formatSAR(order.total)}</strong>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => updateStatus(order.id)}
                >
                  Advance
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  title="Delete"
                  onClick={() => deleteOrder(order.id)}
                >
                  <Icon name="trash" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon="receipt"
            message="No orders yet. Orders placed from the customer menu will appear here."
          />
        )}
      </div>
    </section>
  );
}

function OrderHistory() {
  const { data, update } = useDb();
  const { toast, confirm } = useUi();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data.orders || [])
      .filter((o) => !status || o.status === status)
      .filter((o) => {
        if (!q) return true;
        return (
          String(o.table).toLowerCase().includes(q) ||
          String(o.id).includes(q) ||
          (o.items || []).some((i) => i.name.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data.orders, query, status]);

  const totalRevenue = filtered.reduce((s, o) => s + Number(o.total || 0), 0);

  const deleteOrder = async (id) => {
    const ok = await confirm({
      title: "Delete order?",
      message: `This order (#${id}) will be removed from history permanently.`,
    });
    if (!ok) return;
    update((d) => {
      d.orders = d.orders.filter((o) => o.id !== id);
    });
    toast("Order removed from history", "success");
  };

  return (
    <section className="panel admin-panel">
      <div className="panel-head">
        <h2>Order History</h2>
      </div>
      <div className="hist-filters">
        <div className="search-box">
          <Icon name="search" />
          <input
            className="input"
            type="text"
            placeholder="Search table or order #"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Preparing">Preparing</option>
          <option value="Ready">Ready</option>
          <option value="Served">Served</option>
        </select>
      </div>
      <div className="hist-summary">
        <div className="hist-stat">
          <span>Orders</span>
          <strong>{filtered.length}</strong>
        </div>
        <div className="hist-stat">
          <span>Served</span>
          <strong>{filtered.filter((o) => o.status === "Served").length}</strong>
        </div>
        <div className="hist-stat">
          <span>Revenue</span>
          <strong>{formatSAR(totalRevenue)}</strong>
        </div>
      </div>
      <div className="list">
        {filtered.length ? (
          filtered.map((order) => (
            <div className="order-row" key={order.id}>
              <div className="order-main">
                <div className="order-table-chip">{order.table}</div>
                <div className="order-info">
                  <strong>
                    #{order.id} · Table {order.table}
                  </strong>
                  <small>{itemsText(order.items)}</small>
                  <span className="time-ago">{timeAgo(order.createdAt)}</span>
                </div>
              </div>
              <div className="order-meta">
                <StatusBadge status={order.status} />
                <strong className="order-total">{formatSAR(order.total)}</strong>
                <button
                  className="btn btn-sm btn-danger"
                  title="Delete"
                  onClick={() => deleteOrder(order.id)}
                >
                  <Icon name="trash" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState icon="receipt" message="No orders match your filters." />
        )}
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  return (
    <div className="dashboard-shell">
      <Sidebar active="/admin" title="Admin Panel" icon="lock" />
      <main className="dashboard-content">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Overview of today's activity</p>
        </div>
        <StatsGrid />
        <MenuManagement />
        <OrderManagement />
        <OrderHistory />
      </main>
    </div>
  );
}
