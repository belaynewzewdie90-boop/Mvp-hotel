export const STATUS_FLOW = ["Pending", "Preparing", "Ready", "Served"];

export function nextStatus(status) {
  const i = STATUS_FLOW.indexOf(status);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : status;
}

export function formatSAR(value) {
  return `${Number(value || 0).toFixed(2)} SAR`;
}

export function timeAgo(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m ago`;
}

export function elapsed(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* Turn a DB-stored image path into a resolvable URL.
   Relative paths like "assets/images/x.svg" resolve against the public dir. */
export function resolveImage(src) {
  const value = String(src || "");
  if (!value) return "/assets/images/placeholder.svg";
  if (/^(https?:|data:|\/)/.test(value)) return value;
  return `/${value}`;
}

export function itemsText(items, sep = ", ") {
  return (items || []).map((i) => `${i.name} × ${i.quantity}`).join(sep);
}

export function parseIngredients(text) {
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

export function ingredientsToText(ingredients) {
  return (ingredients || []).map((ing) => `${ing.name}:${ing.qty}`).join(", ");
}
