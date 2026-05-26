import React, { useState } from "react";
import useStore from "../state";
import { useToast } from "../components/Toast";

function fmtFecha(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtTs(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function EstadoBadge({ estado }) {
  const map = {
    vacio:    { txt: "VACÍO",       bg: "var(--bg-surface-2)", color: "var(--text-muted)", border: "var(--border)" },
    progreso: { txt: "EN PROGRESO", bg: "var(--warning-dim)",  color: "var(--warning)",    border: "rgba(245,158,11,0.4)" },
    completo: { txt: "COMPLETO",    bg: "var(--success-dim)",  color: "var(--success)",    border: "rgba(16,185,129,0.4)" },
  };
  const s = map[estado];
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontFamily: "var(--font-mono)", letterSpacing: "0.05em",
    }}>
      {s.txt}
    </span>
  );
}

function BarraEje({ label, pct }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
        <span>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", color: pct === 100 ? "var(--success)" : "var(--text-secondary)" }}>
          {pct}%
        </span>
      </div>
      <div style={{ height: 6, background: "var(--bg-surface-2)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: pct === 100 ? "var(--success)" : "var(--accent)",
          transition: "width 200ms ease",
        }} />
      </div>
    </div>
  );
}

export default function InicioPage() {
  const toast = useToast();
  const ws = useStore((s) => s.workspace);
  const nombreProyecto = useStore((s) => s.nombreProyecto);
  const setNombreProyecto = useStore((s) => s.setNombreProyecto);
  const nuevoProyectoEnCarpeta = useStore((s) => s.nuevoProyectoEnCarpeta);
  const abrirProyectoDeCarpeta = useStore((s) => s.abrirProyectoDeCarpeta);
  const guardarProyectoActivo = useStore((s) => s.guardarProyectoActivo);
  const borrarProyectoDeCarpeta = useStore((s) => s.borrarProyectoDeCarpeta);
  const tareas = useStore((s) => s.tareas);
  const campos = useStore((s) => s.campos);
  const fechaModificacion = useStore((s) => s.fechaModificacion);

  const renombrarFicheroActivo = useStore((s) => s.renombrarFicheroActivo);

  const [nuevoNombre, setNuevoNombre] = useState("");
  const carpetaOk = !!ws.handle && ws.permiso === "granted";
  const proyectoActivo = ws.proyectoActualFichero;

  const nTareas = tareas.length;
  function pct(eje) {
    if (nTareas === 0) return 0;
    return Math.round(tareas.filter((t) => t.rangos?.[eje] != null).length / nTareas * 100);
  }
  const pctDif = pct("dificultad");
  const pctCrit = pct("criticidad");
  const pctFac = pct("facilidad");

  let estado = "vacio";
  if (nTareas > 0) estado = (pctDif === 100 && pctCrit === 100 && pctFac === 100) ? "completo" : "progreso";

  const successCard = estado === "completo";
  const warningCard = estado === "progreso";

  async function handleNuevo() {
    if (!carpetaOk) {
      toast.warning("Conecta una carpeta de trabajo para crear proyectos.");
      return;
    }
    const nombre = nuevoNombre.trim() || "Proyecto sin nombre";
    try {
      const { fichero, huboConflicto } = await nuevoProyectoEnCarpeta(nombre);
      setNuevoNombre("");
      if (huboConflicto) {
        toast.info(`Ya existía ese nombre. Proyecto creado como ${fichero}.`);
      } else {
        toast.success(`Proyecto creado en ${fichero}.`);
      }
    } catch (e) {
      toast.error("Error al crear: " + (e.message || e));
    }
  }

  async function handleRenombrarFichero() {
    if (!proyectoActivo) return;
    const propuesta = nombreProyecto;
    try {
      const { fichero, huboConflicto, renombrado } = await renombrarFicheroActivo(propuesta);
      if (!renombrado) {
        toast.info("El nombre del fichero ya coincidía.");
      } else if (huboConflicto) {
        toast.info(`Ya existía ese nombre. Fichero renombrado a ${fichero}.`);
      } else {
        toast.success(`Fichero renombrado a ${fichero}.`);
      }
    } catch (e) {
      toast.error("Error al renombrar: " + (e.message || e));
    }
  }

  async function handleGuardarAhora() {
    if (!carpetaOk || !proyectoActivo) return;
    try {
      await guardarProyectoActivo();
      toast.success("Guardado.");
    } catch (e) {
      toast.error("Error al guardar: " + (e.message || e));
    }
  }

  async function handleAbrir(nombreFichero) {
    if (!carpetaOk) return;
    try {
      if (ws.proyectoActualFichero && ws.proyectoActualFichero !== nombreFichero) {
        await guardarProyectoActivo();
      }
      await abrirProyectoDeCarpeta(nombreFichero);
      toast.success(`Abierto ${nombreFichero}.`);
    } catch (e) {
      toast.error("Error al abrir: " + (e.message || e));
    }
  }

  async function handleBorrar(nombreFichero) {
    const ok = window.confirm(`Borrar el fichero ${nombreFichero} de la carpeta. ¿Continuar?`);
    if (!ok) return;
    try {
      await borrarProyectoDeCarpeta(nombreFichero);
      toast.success("Fichero borrado.");
    } catch (e) {
      toast.error("Error al borrar: " + (e.message || e));
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">INICIO</h1>
        <p className="page-subtitle">
          Selecciona la carpeta de trabajo, abre o crea un proyecto y consulta el progreso de clasificación.
        </p>
      </div>

      <div className="page-body">
        {!ws.soportado && (
          <div className="alert alert-warning" style={{ marginBottom: 16 }}>
            Tu navegador no soporta la selección de carpetas. Para guardar y exportar proyectos, abre la app desde
            <span style={{ fontFamily: "var(--font-mono)", margin: "0 4px" }}>http://localhost</span>
            en Chrome o Edge.
          </div>
        )}

        {ws.soportado && !ws.handle && (
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            No hay carpeta de trabajo. Selecciona una en la barra lateral para empezar a guardar proyectos.
            Mientras tanto puedes trabajar, pero <strong>no podrás exportar</strong> tu trabajo fuera del navegador.
          </div>
        )}

        {carpetaOk && (
          <div className="grid-2" style={{ marginBottom: 16 }}>
            {/* ── Crear nuevo proyecto en carpeta ── */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
                    color: "var(--text-primary)", letterSpacing: "0.06em", marginBottom: 2,
                  }}>
                    NUEVO PROYECTO
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Se crea un fichero JSON en la carpeta y se vacía el estado.
                  </div>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Nombre del proyecto</label>
                <input
                  className="form-control"
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleNuevo(); }}
                  placeholder="Ej. Automatización backoffice 2026"
                />
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleNuevo}>
                Crear proyecto
              </button>
            </div>

            {/* ── Lista de proyectos en carpeta ── */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
                    color: "var(--text-primary)", letterSpacing: "0.06em", marginBottom: 2,
                  }}>
                    PROYECTOS EN LA CARPETA
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Ficheros <span style={{ fontFamily: "var(--font-mono)" }}>.json</span> disponibles.
                  </div>
                </div>
                <span className="badge badge-info" style={{ fontFamily: "var(--font-mono)" }}>
                  {ws.proyectos.length}
                </span>
              </div>
              {ws.proyectos.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0" }}>
                  No hay proyectos todavía. Crea uno con el formulario de la izquierda.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 220, overflowY: "auto" }}>
                  {ws.proyectos.map((p) => {
                    const esActual = p.nombre === ws.proyectoActualFichero;
                    return (
                      <div key={p.nombre} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 8px",
                        background: esActual ? "var(--accent-dim)" : "var(--bg-surface-2)",
                        border: `1px solid ${esActual ? "var(--border-accent)" : "var(--border)"}`,
                        borderRadius: "var(--radius)",
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: "var(--font-mono)", fontSize: 12,
                            color: esActual ? "var(--accent)" : "var(--text-primary)",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {p.nombre}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                            {fmtTs(p.modificado)} · {(p.size / 1024).toFixed(1).replace(".", ",")} kB
                          </div>
                        </div>
                        {!esActual && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleAbrir(p.nombre)}>
                            Abrir
                          </button>
                        )}
                        {esActual && (
                          <span className="badge badge-success" style={{ fontFamily: "var(--font-mono)" }}>EDITANDO</span>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => handleBorrar(p.nombre)} title="Borrar fichero">
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid-2">
          {/* ── Identidad del proyecto ── */}
          <div className="card">
            <div className="card-header">
              <div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
                  color: "var(--text-primary)", letterSpacing: "0.06em", marginBottom: 2,
                }}>
                  PROYECTO ACTUAL
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Nombre visible en el cubo y en los CSV exportados.
                </div>
              </div>
              <EstadoBadge estado={estado} />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre del proyecto</label>
              <input
                className="form-control"
                type="text"
                value={nombreProyecto}
                onChange={(e) => setNombreProyecto(e.target.value)}
                placeholder="Ej. Automatización backoffice 2026"
              />
            </div>
            {proyectoActivo && (
              <>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, fontFamily: "var(--font-mono)" }}>
                  Fichero: {proyectoActivo}
                </div>
                {ws.ultimoGuardadoTs && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    Guardado: {fmtTs(ws.ultimoGuardadoTs)}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleRenombrarFichero}
                    title="Renombra el fichero JSON para que coincida con el nombre del proyecto"
                  >
                    Renombrar fichero
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleGuardarAhora}
                    title="Fuerza el guardado inmediato sin esperar al autoguardado"
                  >
                    Guardar ahora
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Progreso ── */}
          <div
            className="card"
            style={{
              borderColor: successCard ? "var(--card-success-border)"
                          : warningCard ? "var(--card-warning-border)" : "var(--border)",
              background:  successCard ? "var(--card-success-bg)"
                          : warningCard ? "var(--card-warning-bg)"     : "var(--bg-surface)",
            }}
          >
            <div className="card-header">
              <div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
                  color: "var(--text-primary)", letterSpacing: "0.06em", marginBottom: 2,
                }}>
                  PROGRESO
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Tareas, campos libres y clasificación.
                </div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                Mod. {fmtFecha(fechaModificacion)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>
                  {nTareas.toLocaleString("es-ES")}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.05em" }}>TAREAS</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
                  {campos.length.toLocaleString("es-ES")}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.05em" }}>CAMPOS</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <BarraEje label="CONSUMO TIEMPO"         pct={pctDif} />
              <BarraEje label="CRITICIDAD"             pct={pctCrit} />
              <BarraEje label="FACILIDAD TECNOLÓGICA"  pct={pctFac} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
