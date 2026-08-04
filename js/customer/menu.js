const menuGrid = document.getElementById("menuGrid");
const searchInput = document.getElementById("searchInput");
const chipRow = document.getElementById("chipRow");

let activeCategory = "All";

function renderChips() {
  const foods = DB.get("foods", []);
  const categories = ["All", ...new Set(foods.map((f) => f.category))];
  chipRow.innerHTML = categories
    .map(
      (cat) =>
        `<button class="chip ${cat === activeCategory ? "active" : ""}" onclick="setCategory('${esc(cat)}')">${esc(cat)}</button>`,
    )
    .join("");
}

function setCategory(cat) {
  activeCategory = cat;
  renderChips();
  renderMenu();
}

function renderMenu() {
  const foods = DB.get("foods", []);
  const query = searchInput.value.toLowerCase();
  const filtered = foods.filter(
    (food) =>
      (activeCategory === "All" || food.category === activeCategory) &&
      food.name.toLowerCase().includes(query),
  );

  menuGrid.innerHTML = filtered.length
    ? filtered.map(foodCard).join("")
    : `<div class="empty-state">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <p>No menu items found.</p>
      </div>`;
}

function foodCard(food) {
  const inCart = cart.find((c) => c.id === food.id);
  const discount =
    food.oldPrice > food.price
      ? Math.round(((food.oldPrice - food.price) / food.oldPrice) * 100)
      : 0;
  const ribbon = discount > 0
    ? `<span class="food-ribbon">-${discount}%</span>`
    : food.new
      ? `<span class="food-ribbon new">New</span>`
      : "";
  const oldPrice = food.oldPrice > food.price
    ? `<span class="price-old">${esc(food.oldPrice)} SAR</span>`
    : "";
  return `
    <article class="food-card">
      <div class="food-media">
        ${ribbon}
        <img src="${esc(food.image)}" alt="${esc(food.name)}"
          onerror="this.onerror=null;this.src='assets/images/placeholder.svg'" />
      </div>
      <div class="food-body">
        <div>
          <h3>${esc(food.name)}</h3>
          <span class="food-cat">${esc(food.category)}</span>
        </div>
        <div class="food-foot">
          <span class="price">${esc(food.price)} SAR${oldPrice}</span>
          ${inCart ? quantityStepper(food.id, inCart.quantity) : `<button class="btn btn-cart btn-sm" onclick="addToCart(${food.id})">Add</button>`}
        </div>
      </div>
    </article>`;
}

function quantityStepper(id, quantity) {
  return `
    <div class="stepper">
      <button onclick="changeQty(${id}, -1)" aria-label="Decrease">−</button>
      <span class="stepper-val">${quantity}</span>
      <button onclick="changeQty(${id}, 1)" aria-label="Increase">+</button>
    </div>`;
}

searchInput.addEventListener("input", renderMenu);
renderChips();
renderMenu();
