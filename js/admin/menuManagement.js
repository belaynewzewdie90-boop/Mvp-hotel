const menuForm = document.getElementById("menuForm");
const menuList = document.getElementById("menuList");
const menuSubmitBtn = document.getElementById("menuSubmitBtn");
const menuFormHint = document.getElementById("menuFormHint");

let editingId = null;

function saveFoods(foods) {
  DB.set("foods", foods);
  renderMenuList();
  refreshDashboard();
}

function renderMenuList() {
  const foods = DB.get("foods", []);
  if (!foods.length) {
    menuList.innerHTML = `
      <div class="empty-state">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <p>No menu items yet. Add your first dish above.</p>
      </div>`;
    return;
  }

  menuList.innerHTML = `
    <table class="menu-table">
      <thead>
        <tr>
          <th></th>
          <th>Name</th>
          <th>Category</th>
          <th>Price</th>
          <th style="text-align:right">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${foods.map(menuRow).join("")}
      </tbody>
    </table>`;
}

function menuRow(food) {
  return `
    <tr>
      <td><img class="thumb" src="${esc(food.image)}" alt="" onerror="this.onerror=null;this.src='assets/images/placeholder.svg'" /></td>
      <td><strong>${esc(food.name)}</strong></td>
      <td><span class="food-tag">${esc(food.category)}</span></td>
      <td><strong>${esc(food.price)} SAR</strong></td>
      <td>
        <div class="row-actions">
          <button class="btn btn-sm" onclick="startEditFood(${food.id})" title="Edit">${Icons.edit}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteFood(${food.id})" title="Delete">${Icons.trash}</button>
        </div>
      </td>
    </tr>`;
}

async function deleteFood(id) {
  const food = DB.get("foods", []).find((f) => f.id === id);
  const ok = await confirmModal({
    title: "Delete item?",
    message: `"${esc(food ? food.name : "Item")}" will be removed from the menu and can no longer be ordered.`,
  });
  if (!ok) return;
  saveFoods(DB.get("foods", []).filter((f) => f.id !== id));
  toast("Item deleted from menu", "success");
}

function parseIngredients(text) {
  return (text || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, qty] = part.split(":").map((s) => s.trim());
      return { name, qty: Math.max(1, Number(qty) || 1) };
    })
    .filter((ing) => ing.name);
}

function ingredientsToText(ingredients) {
  return (ingredients || []).map((ing) => `${ing.name}:${ing.qty}`).join(", ");
}

function startEditFood(id) {
  const food = DB.get("foods", []).find((f) => f.id === id);
  if (!food) return;
  editingId = id;
  document.getElementById("foodName").value = food.name;
  document.getElementById("foodPrice").value = food.price;
  document.getElementById("foodCategory").value = food.category;
  document.getElementById("foodIngredients").value = ingredientsToText(food.ingredients);
  document.getElementById("foodImage").value = food.image || "";
  menuSubmitBtn.textContent = "Save Changes";
  menuFormHint.textContent = "Editing existing dish";
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.getElementById("foodName").focus();
}

function cancelEdit() {
  editingId = null;
  menuForm.reset();
  menuSubmitBtn.textContent = "Add Item";
  menuFormHint.textContent = "Add a new dish";
}

menuForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const foods = DB.get("foods", []);
  const name = document.getElementById("foodName").value.trim();
  const price = Number(document.getElementById("foodPrice").value);
  const category = document.getElementById("foodCategory").value.trim();
  const ingredients = parseIngredients(
    document.getElementById("foodIngredients").value,
  );
  const image = document.getElementById("foodImage").value.trim() || "assets/images/placeholder.svg";

  if (editingId) {
    const food = foods.find((f) => f.id === editingId);
    if (food) {
      Object.assign(food, { name, price, category, image, ingredients });
      DB.set("foods", foods);
      toast("Item updated", "success");
    }
    cancelEdit();
  } else {
    foods.push({ id: Date.now(), name, price, category, image, ingredients });
    DB.set("foods", foods);
    toast(`"${esc(name)}" added to the menu`, "success");
    menuForm.reset();
  }

  renderMenuList();
  refreshDashboard();
});

renderMenuList();
liveRefresh(() => {
  renderMenuList();
  refreshDashboard();
});
