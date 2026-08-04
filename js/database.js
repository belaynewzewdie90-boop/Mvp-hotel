const DB = {
  storageKey: "hotel-management-system-data",

  DEFAULT_INGREDIENTS: {
    "Classic Burger": [
      { name: "Bread Buns", qty: 1 },
      { name: "Cheese", qty: 1 },
    ],
    "Margherita Pizza": [{ name: "Cheese", qty: 2 }],
    "Fresh Lemonade": [],
  },

  load() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      const seed = {
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
      localStorage.setItem(this.storageKey, JSON.stringify(seed));
      return seed;
    }
    const data = JSON.parse(raw);
    this.migrate(data);
    return data;
  },

  migrate(data) {
    if (!Array.isArray(data.foods)) data.foods = [];
    data.foods = data.foods.map((food) => {
      if (Array.isArray(food.ingredients)) return food;
      return { ingredients: this.DEFAULT_INGREDIENTS[food.name] || [], ...food };
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
  },

  get(key, fallback = null) {
    const data = this.load();
    return data[key] ?? fallback;
  },

  save(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  },

  set(key, value) {
    const data = this.load();
    data[key] = value;
    this.save(data);
  },

  add(key, item) {
    const data = this.load();
    data[key] = data[key] || [];
    data[key].push(item);
    this.save(data);
  },

  /* Total ingredient requirement for a set of order items. */
  ingredientNeeds(items) {
    const data = this.load();
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
  },

  /* Human-readable summary, e.g. "Bread Buns ×2, Cheese ×3". */
  ingredientSummary(items) {
    return Object.entries(this.ingredientNeeds(items)).map(
      ([name, qty]) => `${name} ×${qty}`,
    );
  },

  /* Deduct required ingredients from inventory when an order is started.
     Returns { shortages: [{name, shortage}] } for stock that ran out. */
  consumeOrder(order) {
    const data = this.load();
    const needs = this.ingredientNeeds(order.items);
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
    this.save(data);
    return { shortages };
  },
};
