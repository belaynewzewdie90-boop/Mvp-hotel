const PREFIX = "hotel-customer-session";

/* Each visit (tab / QR scan) gets its own session id so a new guest never
   sees the order history of previous guests. sessionStorage keeps the same
   session alive while the guest navigates between the menu and tracker. */
export function getSession(table) {
  const key = `${PREFIX}:${table}`;
  const raw = sessionStorage.getItem(key);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      /* fall through and mint a fresh session */
    }
  }
  const session = {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
  };
  sessionStorage.setItem(key, JSON.stringify(session));
  return session;
}

export function ordersForSession(orders, table, sessionId) {
  return (orders || []).filter(
    (o) =>
      String(o.table) === String(table) && o.sessionId === sessionId,
  );
}
