import React, { useState } from "react";
import useStore from "../state";
import { useToast } from "./Toast";
import Modal from "./Modal";

export default function CamposLibresEditor({ open, onClose }) {
  const toast = useToast();
  const campos = useStore((s) => s.campos);
  const addCampo = useStore((s) => s.addCampo);
  const renombrarCampo = useStore((s) => s.renombrarCampo);
  const eliminarCampo = useStore((s) => s.eliminarCampo);

  const [nuevo, setNuevo] = useState("");

  function handleAdd() {
    const nombre = nuevo.trim();
    if (!nombre) {
      toast.warning("El nombre del campo no puede estar vacío.");
      return;
    }
    if (campos.some((c) => c.nombre.trim().toLowerCase() === nombre.toLowerCase())) {
      toast.warning("Ya existe un campo con ese nombre.");
      return;
    }
    addCampo(nombre);
    setNuevo("");
    toast.success(`Campo "${nombre}" añadido.`);
  }

  function handleDelete(id, nombre) {
    const ok = window.confirm(
      `Eliminar el campo "${nombre}". Se borrarán los valores asignados a este campo en todas las tareas. ¿Continuar?`
    );
    if (!ok) return;
    eliminarCampo(id);
    toast.success(`Campo "${nombre}" eliminado.`);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="EDITAR CAMPOS LIBRES"
      width={560}
      footer={
        <button className="btn btn-secondary btn-sm" onClick={onClose}>
          Cerrar
        </button>
      }
    >
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
        Los campos libres son columnas extra para describir tus tareas (por ejemplo: Área, Responsable, Sistema actual). Se aplican a todas las tareas.
      </p>

      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">Añadir nuevo campo</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="form-control"
            type="text"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="Ej. Área de negocio"
          />
          <button className="btn btn-primary btn-sm" onClick={handleAdd}>
            Añadir
          </button>
        </div>
      </div>

      <div className="divider" />

      {campos.length === 0 ? (
        <div style={{
          padding: 24, textAlign: "center",
          color: "var(--text-muted)", fontSize: 13,
          border: "1px dashed var(--border)", borderRadius: "var(--radius)",
        }}>
          Aún no hay campos libres definidos.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {campos.map((c, i) => (
            <div
              key={c.id}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px",
                background: "var(--bg-surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
            >
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11,
                color: "var(--text-muted)", minWidth: 22,
              }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <input
                className="form-control"
                style={{ flex: 1, padding: "5px 8px", fontSize: 13 }}
                value={c.nombre}
                onChange={(e) => renombrarCampo(c.id, e.target.value)}
              />
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(c.id, c.nombre)}
                title="Eliminar campo"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
