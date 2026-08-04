import { createContext, useContext, useEffect, useRef, useState } from "react";
import { STORAGE_KEY, load, save } from "../lib/db";

const DbContext = createContext(null);

export function DbProvider({ children }) {
  const [data, setData] = useState(() => load());
  const dataRef = useRef(data);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        const next = load();
        dataRef.current = next;
        setData(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* Apply a mutation to the latest persisted data, save, and re-render.
     `fn` receives a fresh object it may mutate; return it (or a replacement). */
  const update = (fn) => {
    const current = load();
    const next = fn(current) || current;
    save(next);
    dataRef.current = next;
    setData(next);
  };

  return (
    <DbContext.Provider value={{ data, update }}>{children}</DbContext.Provider>
  );
}

export function useDb() {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error("useDb must be used within a DbProvider");
  return ctx;
}
