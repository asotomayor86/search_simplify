import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useStore from "../state";
import { useToast } from "../components/Toast";
import CamposLibresEditor from "../components/CamposLibresEditor";

export default function TareasPage() {
  const toast = useToast();
  const tareas = useStore((s) => s.tareas);
  const campos = useStore((s) => s.campos);
  const addTarea = useStore((s) => s.addTarea);
  const editarNombreTarea = useStore((s) => s.editarNombreTarea);
  const setCampoTarea = useStore((s) => s.setCampoTarea);
  const eliminarTarea = useStore((s) => s.eliminarTarea);

  const [editorAbierto, setEditorAbierto] = useState(false);
  const [nombreNuevaTarea, setNombreNuevaTarea] = useState("");

  const duplicadosIds = useMemo(() => {
    const cuentas = new Map();
    for (const t of tareas) {
      const k = t.nombre.trim().toLowerCase();
      if (!k) continue;
      cuentas.set(k, (cuentas.get(k) ?? 0) + 1);
    }
    const dups = new Set();
    for (const t of tareas) {
      const k = t.nombre.trim().toLowerCase();
      if (k && cuentas.get(k) > 1) dups.add(t.id);
    }
    return dups;
  }, [tareas]);

  function handleAdd() {
    const nombre = nombreNuevaTarea.trim();
    if (!nombre) {
      addTarea("");
      toast.info("Tarea vacía añadida. Edítala en la tabla.");
      return;
    }
    addTarea(nombre);
    setNombreNuevaTarea("");
    toast.success(`Tarea "${nombre}" añadida.`);
  }

  function handleEliminar(id, nombre) {
    const ok = window.confirm(`Eliminar la tarea "${nombre || "(sin nombre)"}". ¿Continuar?`);
    if (!ok) return;
    eliminarTarea(id);
    toast.success("Tarea eliminada.");
  }

  const aviso = (() => {
    if (tareas.length === 0) return null;
    if (tareas.length < 2) return { tipo: "warning", txt: "Necesitas al menos 2 tareas para poder clasificarlas." };
    if (tareas.length > 100) return { tipo: "warning", txt: `Tienes ${tareas.length} tareas. Más de 100 puede dificultar la clasificación.` };
    return null;
  })();

  const sinNombre = tareas.filter((t) => !t.nombre.trim()).length;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">TAREAS</h1>
        <p className="page-subtitle">
          Crea las tareas que vamos a priorizar. La clasificación llega después en{" "}
          <Link to="/consumo-tiempo" style={{ color: "var(--accent)" }}>CONSUMO TIEMPO</Link>.
        </p>
      </div>

      <div className="page-body">
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: 16, flexWrap: "wrap", marginBottom: 16,
        }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--accent)", marginRight: 6 }}>
                {tareas.length}
              </span>
              tareas
            </span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginRight: 6 }}>
                {campos.length}
              </span>
              campos libres
            </span>
            {sinNombre > 0 && <span className="badge badge-warning">{sinNombre} sin nombre</span>}
            {duplicadosIds.size > 0 && <span className="badge badge-warning">{duplicadosIds.size} duplicados</span>}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditorAbierto(true)}>
            Editar campos libres
          </button>
        </div>

        {aviso && (
          <div className={`alert alert-${aviso.tipo}`} style={{ marginBottom: 16 }}>{aviso.txt}</div>
        )}

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Añadir nueva tarea</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="form-control"
                type="text"
                placeholder="Nombre de la tarea"
                value={nombreNuevaTarea}
                onChange={(e) => setNombreNuevaTarea(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              />
              <button className="btn btn-primary btn-sm" onClick={handleAdd}>
                Añadir tarea
              </button>
            </div>
          </div>
        </div>

        {tareas.length === 0 ? (
          <div style={{
            padding: 40, textAlign: "center",
            color: "var(--text-muted)", fontSize: 13,
            border: "1px dashed var(--border)", borderRadius: "var(--radius-lg)",
            background: "var(--bg-surface)",
          }}>
            Aún no hay tareas. Empieza añadiendo la primera arriba.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th style={{ minWidth: 220 }}>NOMBRE</th>
                  {campos.map((c) => (
                    <th key={c.id} style={{ minWidth: 160 }}>{c.nombre.toUpperCase()}</th>
                  ))}
                  <th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {tareas.map((t, i) => {
                  const dup = duplicadosIds.has(t.id);
                  const vacio = !t.nombre.trim();
                  return (
                    <tr key={t.id}>
                      <td style={{ color: "var(--accent)", fontWeight: 700 }}>#{i + 1}</td>
                      <td style={{ padding: 4 }}>
                        <input
                          className="form-control"
                          style={{
                            padding: "5px 8px", fontSize: 13,
                            borderColor: vacio || dup ? "var(--warning)" : "var(--border)",
                          }}
                          value={t.nombre}
                          onChange={(e) => editarNombreTarea(t.id, e.target.value)}
                          placeholder="(sin nombre)"
                          title={dup ? "Nombre duplicado" : vacio ? "Nombre vacío" : ""}
                        />
                      </td>
                      {campos.map((c) => (
                        <td key={c.id} style={{ padding: 4 }}>
                          <input
                            className="form-control"
                            style={{ padding: "5px 8px", fontSize: 13 }}
                            value={t.campos[c.id] ?? ""}
                            onChange={(e) => setCampoTarea(t.id, c.id, e.target.value)}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: "right", padding: 4 }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleEliminar(t.id, t.nombre)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tareas.length >= 2 && (
          <div style={{ marginTop: 20, fontSize: 12, color: "var(--text-muted)" }}>
            Cuando termines de definirlas, pasa a{" "}
            <Link to="/consumo-tiempo" style={{ color: "var(--accent)" }}>CONSUMO TIEMPO</Link> para clasificar.
          </div>
        )}
      </div>

      <CamposLibresEditor open={editorAbierto} onClose={() => setEditorAbierto(false)} />
    </>
  );
}
