import { createContext, useCallback, useContext, useRef, useState } from "react";
import Icon from "../components/Icon";

const UiContext = createContext(null);

export function UiProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const resolverRef = useRef(null);
  const toastId = useRef(0);

  const toast = useCallback((message, type = "info") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const confirm = useCallback(
    ({ title, message, confirmText = "Delete", danger = true }) => {
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setConfirmState({ title, message, confirmText, danger });
      });
    },
    [],
  );

  const closeConfirm = (result) => {
    setConfirmState(null);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  };

  return (
    <UiContext.Provider value={{ toast, confirm }}>
      {children}
      <div id="toastRegion">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon name={t.type === "success" ? "check" : t.type === "error" ? "alert" : "bell"} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      {confirmState && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeConfirm(false);
          }}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <h3>{confirmState.title}</h3>
            <p>{confirmState.message}</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => closeConfirm(false)}>
                Cancel
              </button>
              <button
                className={`btn ${confirmState.danger ? "btn-danger" : "btn-primary"}`}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used within a UiProvider");
  return ctx;
}
