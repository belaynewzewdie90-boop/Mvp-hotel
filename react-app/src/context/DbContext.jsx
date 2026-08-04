import { createContext, useContext, useEffect, useRef, useState } from "react";
import { STORAGE_KEY, apiGet, apiSave, load, save } from "../lib/db";

const DbContext = createContext(null);

const POLL_MS = 4000;

export function DbProvider({ children }) {
  const [data, setData] = useState(() => load());
  const [online, setOnline] = useState(false);
  const dataRef = useRef(data);
  const pushQueue = useRef(Promise.resolve());

  const adopt = (next) => {
    dataRef.current = next;
    setData(next);
    save(next);
  };

  /* Push to the server in order, one request at a time. */
  const pushToServer = (next) => {
    pushQueue.current = pushQueue.current
      .then(() => apiSave(next))
      .catch(() => {});
  };

  /* Initial pull from the shared store; fall back to localStorage if
     the API is unavailable (e.g. local dev). */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const remote = await apiGet();
      if (cancelled) return;
      if (remote) {
        adopt(remote);
        setOnline(true);
      } else {
        const local = load();
        const ok = await apiSave(local);
        if (!cancelled) setOnline(ok);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Same-browser tabs stay in sync instantly via localStorage events. */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        adopt(load());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* Cross-device sync: poll the shared store for changes from other
     browsers and adopt them when they differ. */
  useEffect(() => {
    const timer = setInterval(async () => {
      const remote = await apiGet();
      if (!remote) return;
      const current = dataRef.current;
      if (JSON.stringify(remote) !== JSON.stringify(current)) {
        adopt(remote);
      }
      setOnline(true);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  /* Apply a mutation to the latest data, save locally, and push to the
     shared store. `fn` receives a fresh clone it may mutate. */
  const update = (fn) => {
    const next = structuredClone(dataRef.current);
    fn(next);
    adopt(next);
    pushToServer(next);
  };

  return (
    <DbContext.Provider value={{ data, online, update }}>
      {children}
    </DbContext.Provider>
  );
}

export function useDb() {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error("useDb must be used within a DbProvider");
  return ctx;
}
