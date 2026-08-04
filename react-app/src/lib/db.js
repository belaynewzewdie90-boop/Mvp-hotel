export const STORAGE_KEY = "hotel-management-system-data";

export const DEFAULT_INGREDIENTS = {
  "Classic Burger": [
    { name: "Bread Buns", qty: 1 },
    { name: "Cheese", qty: 1 },
  ],
  "Margherita Pizza": [{ name: "Cheese", qty: 2 }],
  "Fresh Lemonade": [],
};

export function seedData() {
  return {
    foods: [
      {
        id: 1,
        name: "Classic Burger",
        price: 45,
        oldPrice: 60,
        new: false,
        category: "Main",
        image: "assets/images/burger.svg",
        ingredients: [
          { name: "Bread Buns", qty: 1 },
          { name: "Cheese", qty: 1 },
        ],
      },
      {
        id: 2,
        name: "Margherita Pizza",
        price: 60,
        oldPrice: 75,
        new: false,
        category: "Main",
        image: "assets/images/pizza.svg",
        ingredients: [{ name: "Cheese", qty: 2 }],
      },
      {
        id: 3,
        name: "Fresh Lemonade",
        price: 20,
        oldPrice: 25,
        new: true,
        category: "Drinks",
        image: "assets/images/drinks.svg",
        ingredients: [],
      },
    ],
    inventory: [
      { id: 1, name: "Bread Buns", quantity: 30 },
      { id: 2, name: "Cheese", quantity: 20 },
    ],
    users: [
      { id: 1, username: "admin", password: "admin123", role: "admin" },
      {
        id: 2,
        username: "kitchen",
        password: "kitchen123",
        role: "kitchen",
      },
    ],
    orders: [],
    consumptionLog: [],
  };
}

export function migrate(data) {
  if (!Array.isArray(data.foods)) data.foods = [];
  data.foods = data.foods.map((food) => {
    if (Array.isArray(food.ingredients)) return food;
    return { ingredients: DEFAULT_INGREDIENTS[food.name] || [], ...food };
  });
  data.foods = data.foods.map((food) => {
    food.oldPrice =
      food.oldPrice ?? Math.round((Number(food.price || 0) * 1.2) / 5) * 5;
    if (food.new == null) food.new = false;
    return food;
  });
  if (!Array.isArray(data.consumptionLog)) data.consumptionLog = [];
  if (Array.isArray(data.orders)) {
    data.orders = data.orders.map((order) => {
      if (order.status === "Completed") order.status = "Served";
      return order;
    });
  }
}

export function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = seedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  const data = JSON.parse(raw);
  migrate(data);
  return data;
}

export function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* Total ingredient requirement for a set of order items. */
export function ingredientNeeds(data, items) {
  const foods = data.foods || [];
  const needs = {};
  (items || []).forEach((item) => {
    const food = foods.find((f) => f.id === item.id);
    if (!food || !Array.isArray(food.ingredients)) return;
    food.ingredients.forEach((ing) => {
      const need = (Number(ing.qty) || 0) * (Number(item.quantity) || 1);
      if (need > 0) needs[ing.name] = (needs[ing.name] || 0) + need;
    });
  });
  return needs;
}

/* Human-readable summary, e.g. "Bread Buns ×2, Cheese ×3". */
export function ingredientSummary(data, items) {
  return Object.entries(ingredientNeeds(data, items)).map(
    ([name, qty]) => `${name} ×${qty}`,
  );
}

/* Deduct required ingredients from inventory when an order is started.
   Mutates the passed `data` object. Returns { shortages: [{name, shortage}] }. */
export function consumeOrder(data, order) {
  const needs = ingredientNeeds(data, order.items);
  if (!Object.keys(needs).length) return { shortages: [] };

  const inventory = data.inventory || [];
  const shortages = [];
  Object.entries(needs).forEach(([name, qty]) => {
    const stock = inventory.find((i) => i.name === name);
    if (stock) {
      const consumed = Math.min(stock.quantity, qty);
      stock.quantity -= consumed;
      if (consumed < qty) shortages.push({ name, shortage: qty - consumed });
    } else {
      shortages.push({ name, shortage: qty });
    }
  });

  data.consumptionLog = data.consumptionLog || [];
  data.consumptionLog.push({
    id: Date.now(),
    orderId: order.id,
    table: order.table,
    items: (order.items || [])
      .map((i) => `${i.name} × ${i.quantity}`)
      .join(", "),
    consumed: Object.entries(needs)
      .map(([name, qty]) => `${name} ×${qty}`)
      .join(", "),
    shortages: shortages
      .map((s) => `${s.name} (short ${s.shortage})`)
      .join(", "),
    createdAt: new Date().toISOString(),
  });
  if (data.consumptionLog.length > 200) {
    data.consumptionLog = data.consumptionLog.slice(-200);
  }

  data.inventory = inventory;
  return { shortages };
}
