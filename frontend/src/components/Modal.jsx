import React, { useEffect } from "react";

export default function Modal({ open, onClose, title, children, footer, width = 520 }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn 120ms ease",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width, maxWidth: "92vw", maxHeight: "90vh", overflow: "auto",
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
            color: "var(--text-primary)", letterSpacing: "0.06em",
          }}>
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: "var(--text-muted)",
              cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 0,
            }}
            aria-label="Cerrar"
          >×</button>
        </div>
        <div style={{ padding: 20, flex: 1 }}>{children}</div>
        {footer && (
          <div style={{
            padding: "12px 20px", borderTop: "1px solid var(--border)",
            display: "flex", justifyContent: "flex-end", gap: 8,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
