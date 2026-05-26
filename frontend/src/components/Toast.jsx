import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ToastCtx = createContext(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const remove = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tipo, mensaje, ms = 3500) => {
      const id = ++counter.current;
      setToasts((ts) => [...ts, { id, tipo, mensaje }]);
      if (ms > 0) setTimeout(() => remove(id), ms);
      return id;
    },
    [remove]
  );

  const api = {
    success: (m, ms) => push("success", m, ms),
    error:   (m, ms) => push("error",   m, ms),
    info:    (m, ms) => push("info",    m, ms),
    warning: (m, ms) => push("warning", m, ms),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  return (
    <div className={`toast toast-${toast.tipo}`}>
      <span className="toast-dot" />
      <span className="toast-msg">{toast.mensaje}</span>
      <button className="toast-close" onClick={onClose} aria-label="Cerrar">×</button>
    </div>
  );
}
