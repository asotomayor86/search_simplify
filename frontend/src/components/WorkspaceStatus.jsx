import React, { useEffect } from "react";
import useStore from "../state";
import { useToast } from "./Toast";

function fmtHora(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function WorkspaceStatus() {
  const toast = useToast();
  const ws = useStore((s) => s.workspace);
  const detectar = useStore((s) => s.detectarWorkspace);
  const conectar = useStore((s) => s.conectarCarpeta);
  const reconectar = useStore((s) => s.reconectarPermiso);
  const desconectar = useStore((s) => s.desconectarCarpeta);

  useEffect(() => {
    detectar().catch((e) => console.error("detectarWorkspace:", e));
  }, [detectar]);

  async function handleConectar() {
    try {
      await conectar();
      toast.success("Carpeta conectada.");
    } catch (e) {
      if (e?.name !== "AbortError") {
        toast.error("No se pudo conectar la carpeta: " + (e.message || e));
      }
    }
  }

  async function handleReconectar() {
    try {
      await reconectar();
    } catch (e) {
      toast.error("No se pudo restaurar el permiso: " + (e.message || e));
    }
  }

  async function handleDesconectar() {
    const ok = window.confirm("Desvincular la carpeta de trabajo. El proyecto en curso seguirá en el navegador. ¿Continuar?");
    if (!ok) return;
    await desconectar();
    toast.info("Carpeta desconectada.");
  }

  const baseStyle = {
    padding: "10px 14px",
    borderTop: "1px solid var(--border)",
    fontSize: 11,
    color: "var(--text-muted)",
    display: "flex", flexDirection: "column", gap: 6,
  };

  if (!ws.soportado) {
    return (
      <div style={baseStyle}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-muted)" }}>
          CARPETA
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
          Tu navegador no soporta selección de carpetas. Usa Chrome o Edge sobre <span style={{ fontFamily: "var(--font-mono)" }}>http://localhost</span>.
        </div>
      </div>
    );
  }

  if (!ws.handle) {
    return (
      <div style={baseStyle}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-muted)" }}>
          CARPETA
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
          Sin carpeta seleccionada. Los datos se quedan solo en el navegador y no se pueden exportar.
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleConectar} style={{ width: "100%", justifyContent: "center" }}>
          Seleccionar carpeta…
        </button>
      </div>
    );
  }

  if (ws.permiso !== "granted") {
    return (
      <div style={baseStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "var(--warning)" }}>
            CARPETA · PENDIENTE
          </span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={ws.nombreCarpeta}>
          {ws.nombreCarpeta}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={handleReconectar}>
            Reconectar
          </button>
          <button className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }} onClick={handleDesconectar} title="Desvincular">
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Conectada con permiso
  const map = {
    idle:      { color: "var(--text-muted)", txt: "Listo" },
    guardando: { color: "var(--accent)",     txt: "Guardando…" },
    guardado:  { color: "var(--success)",    txt: `Guardado · ${fmtHora(ws.ultimoGuardadoTs)}` },
    error:     { color: "var(--error)",      txt: "Error al guardar" },
  };
  const estado = map[ws.estadoGuardado] || map.idle;

  return (
    <div style={baseStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "var(--success)" }}>
          CARPETA · OK
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: estado.color }} title={ws.ultimoErrorGuardado || estado.txt}>
          {estado.txt}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={ws.nombreCarpeta}>
        📁 {ws.nombreCarpeta}
      </div>
      {ws.proyectoActualFichero && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "var(--font-mono)" }} title={ws.proyectoActualFichero}>
          ↳ {ws.proyectoActualFichero}
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={handleConectar}>
          Cambiar
        </button>
        <button className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }} onClick={handleDesconectar} title="Desvincular">
          ✕
        </button>
      </div>
    </div>
  );
}
