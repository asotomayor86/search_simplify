import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useStore from "../state";
import CuboMatrix3D from "../components/CuboMatrix3D";
import ListaDragDrop from "../components/ListaDragDrop";
import { construirCSV, fmtNum, nombreCSV } from "../services/exportar";
import { escribirCSV } from "../services/workspace";
import { useToast } from "../components/Toast";

// Mapa: nombre del acordeón -> modo del visualizador.
const MODO_POR_ACORDEON = {
  consumo: "1d",
  criticidad: "2d",
  facilidad: "3d",
  resultados: "3d",
};

// Coord centrada: cuando hay K clasificadas de N totales en este eje,
// las tareas se distribuyen alrededor de 0 con paso 1/(N-1).
//   K=1  → posición 0 (centro)
//   K=2  → posiciones ±0.5/(N-1)
//   K=N  → posiciones canónicas {-0.5, ..., +0.5}
function coordCentrada(rango, K, N) {
  if (rango == null || N <= 1) return 0;
  return (rango - (K - 1) / 2) / (N - 1);
}

// Calcula los puntos del visualizador según el modo activo.
// Se incluyen las tareas con AL MENOS dificultad clasificada.
// La fórmula reparte las clasificadas alrededor del centro y las va
// alejando a los extremos a medida que se clasifican más.
function computarPuntos(tareas, modo, topN) {
  const numeralPorId = new Map(tareas.map((t, i) => [t.id, i + 1]));
  const N = tareas.length;
  const K_dif  = tareas.filter((t) => t.rangos.dificultad != null).length;
  const K_crit = tareas.filter((t) => t.rangos.criticidad != null).length;
  const K_fac  = tareas.filter((t) => t.rangos.facilidad  != null).length;

  const conDif = tareas.filter((t) => t.rangos.dificultad != null);

  const en2D = modo === "2d" || modo === "3d";
  const en3D = modo === "3d";

  let puntos = conDif.map((t) => {
    const x = coordCentrada(t.rangos.dificultad, K_dif, N);
    const yReal = coordCentrada(t.rangos.criticidad, K_crit, N);
    const zReal = coordCentrada(t.rangos.facilidad,  K_fac,  N);
    const y = en2D ? yReal : 0;
    const z = en3D ? zReal : 0;
    return {
      id: t.id,
      numeral: numeralPorId.get(t.id),
      nombre: t.nombre,
      x, y, z,
      rangoDificultad: t.rangos.dificultad,
      rangoCriticidad: t.rangos.criticidad,
      rangoFacilidad: t.rangos.facilidad,
      distancia: 0,
      dentroRegion: false,
    };
  });

  if (modo === "2d") {
    // En 2D, top-N por distancia al ideal 2D (0.5, -0.5).
    // Solo tareas con DIF y CRIT clasificadas.
    const con2D = puntos.filter((p) => p.rangoCriticidad != null);
    con2D.forEach((p) => {
      const dx = 0.5 - p.x;
      const dy = -0.5 - p.y;
      p.distancia = Math.sqrt(dx * dx + dy * dy);
    });
    const ordenados = [...con2D].sort((a, b) => {
      if (a.distancia !== b.distancia) return a.distancia - b.distancia;
      return b.rangoDificultad - a.rangoDificultad;
    });
    const tn = Math.min(topN, ordenados.length);
    const idsTop = new Set(ordenados.slice(0, tn).map((p) => p.id));
    puntos = puntos.map((p) => ({ ...p, dentroRegion: idsTop.has(p.id) }));
  } else if (en3D) {
    const completos = puntos.filter(
      (p) => p.rangoCriticidad != null && p.rangoFacilidad != null
    );
    completos.forEach((p) => {
      const dx = 0.5 - p.x;
      const dy = -0.5 - p.y;
      const dz = 0.5 - p.z;
      p.distancia = Math.sqrt(dx * dx + dy * dy + dz * dz);
    });
    const ordenados = [...completos].sort((a, b) => {
      if (a.distancia !== b.distancia) return a.distancia - b.distancia;
      return b.rangoDificultad - a.rangoDificultad;
    });
    const tn = Math.min(topN, ordenados.length);
    const idsTop = new Set(ordenados.slice(0, tn).map((p) => p.id));
    puntos = puntos.map((p) => ({ ...p, dentroRegion: idsTop.has(p.id) }));
  }

  return puntos;
}

// Para la tabla de resultados: TODAS las tareas con los 3 ejes clasificados,
// ordenadas por distancia ascendente. Marca las primeras `topN` con enTopN=true.
function computarRegion(tareas, topN) {
  const numeralPorId = new Map(tareas.map((t, i) => [t.id, i + 1]));
  const completos = tareas.filter(
    (t) => t.rangos.dificultad != null && t.rangos.criticidad != null && t.rangos.facilidad != null
  );
  const n = completos.length;
  const div = n > 1 ? n - 1 : 1;
  const puntos = completos.map((t) => {
    const x = n > 1 ? t.rangos.dificultad / div - 0.5 : 0;
    const y = n > 1 ? t.rangos.criticidad / div - 0.5 : 0;
    const z = n > 1 ? t.rangos.facilidad / div - 0.5 : 0;
    const dx = 0.5 - x, dy = -0.5 - y, dz = 0.5 - z;
    return {
      id: t.id,
      numeral: numeralPorId.get(t.id),
      nombre: t.nombre,
      distancia: Math.sqrt(dx * dx + dy * dy + dz * dz),
      rangoDificultad: t.rangos.dificultad,
      rangoCriticidad: t.rangos.criticidad,
      rangoFacilidad: t.rangos.facilidad,
    };
  });
  puntos.sort((a, b) => {
    if (a.distancia !== b.distancia) return a.distancia - b.distancia;
    return b.rangoDificultad - a.rangoDificultad;
  });
  return puntos.map((p, i) => ({ ...p, posicion: i + 1, enTopN: i < topN }));
}

function PanelAcordeon({ id, titulo, abierto, onToggle, badge, children }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      // El abierto se expande para llenar el espacio disponible de la columna;
      // los cerrados se mantienen a su altura natural (solo cabecera).
      flex: abierto ? "1 1 0" : "0 0 auto",
      minHeight: 0,
      border: `1px solid ${abierto ? "var(--border-accent)" : "var(--border)"}`,
      borderRadius: "var(--radius)",
      background: "var(--bg-surface)",
      overflow: "hidden",
      transition: "border-color 150ms",
    }}>
      <button
        onClick={() => onToggle(id)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 12px",
          background: abierto ? "var(--accent-dim)" : "var(--bg-surface-2)",
          color: abierto ? "var(--accent)" : "var(--text-primary)",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          fontSize: 12, fontWeight: 700,
          letterSpacing: "0.06em",
          textAlign: "left",
          flexShrink: 0,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 14, display: "inline-block", textAlign: "center" }}>
            {abierto ? "▼" : "▶"}
          </span>
          {titulo}
        </span>
        {badge}
      </button>
      {abierto && (
        <div style={{
          flex: 1, minHeight: 0,
          padding: 8, borderTop: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ClasificacionPage() {
  const toast = useToast();
  const tareas = useStore((s) => s.tareas);
  const campos = useStore((s) => s.campos);
  const topN = useStore((s) => s.configuracion.topN);
  const setTopN = useStore((s) => s.setTopN);
  const nombreProyecto = useStore((s) => s.nombreProyecto);
  const setOrdenEjeClasificadas = useStore((s) => s.setOrdenEjeClasificadas);
  const ws = useStore((s) => s.workspace);
  const refrescarProyectosCarpeta = useStore((s) => s.refrescarProyectosCarpeta);

  const cuboRef = useRef(null);
  const [abierto, setAbierto] = useState("consumo");
  const [mostrarNombres, setMostrarNombres] = useState(false);

  const carpetaOk = !!ws.handle && ws.permiso === "granted";

  const modo = MODO_POR_ACORDEON[abierto] || "1d";
  const puntos = useMemo(() => computarPuntos(tareas, modo, topN), [tareas, modo, topN]);
  const region = useMemo(() => computarRegion(tareas, topN), [tareas, topN]);

  const ejeCompleto = (eje) => tareas.length > 0 && tareas.every((t) => t.rangos[eje] != null);
  const dificultadCompleta = ejeCompleto("dificultad");
  const criticidadCompleta = ejeCompleto("criticidad");
  const facilidadCompleta = ejeCompleto("facilidad");
  const todoCompleto = dificultadCompleta && criticidadCompleta && facilidadCompleta;

  const maxN = Math.max(1, tareas.length);

  function handleToggle(id) {
    setAbierto((prev) => (prev === id ? null : id));
  }

  async function handleExportCSV() {
    if (!carpetaOk) {
      toast.warning("Conecta una carpeta de trabajo para exportar.");
      return;
    }
    const topRows = region.filter((p) => p.enTopN);
    if (topRows.length === 0) {
      toast.warning("No hay región prioritaria que exportar.");
      return;
    }
    const filas = topRows.map((p) => {
      const tarea = tareas.find((t) => t.id === p.id);
      const camposExtra = {};
      for (const c of campos) {
        camposExtra[c.nombre] = tarea?.campos?.[c.id] ?? "";
      }
      return {
        posicion: p.posicion,
        numeral: `#${p.numeral}`,
        nombre: p.nombre,
        distancia: fmtNum(p.distancia.toFixed(4)),
        rango_consumo_tiempo: p.rangoDificultad + 1,
        rango_criticidad: p.rangoCriticidad + 1,
        rango_facilidad: p.rangoFacilidad + 1,
        ...camposExtra,
      };
    });
    try {
      const fichero = nombreCSV(nombreProyecto);
      const contenido = construirCSV(filas);
      await escribirCSV(ws.handle, fichero, contenido);
      await refrescarProyectosCarpeta();
      toast.success(`CSV guardado en la carpeta: ${fichero}`);
    } catch (e) {
      toast.error("Error al exportar CSV: " + (e.message || e));
    }
  }

  function Badge({ completo, count }) {
    if (count != null) {
      return <span className="badge badge-info" style={{ fontFamily: "var(--font-mono)" }}>{count}</span>;
    }
    return completo
      ? <span className="badge badge-success" style={{ fontFamily: "var(--font-mono)" }}>OK</span>
      : <span className="badge" style={{ fontFamily: "var(--font-mono)", background: "var(--bg-surface-3)", color: "var(--text-muted)" }}>—</span>;
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">CLASIFICACIÓN</h1>
        <p className="page-subtitle">
          Clasifica las tareas por los 3 ejes. El visualizador se transforma de 1D → 2D → 3D según el desplegable activo.
        </p>
      </div>

      <div className="page-body">
        {tareas.length < 2 && (
          <div className="alert alert-info">
            Necesitas al menos 2 tareas. Vuelve a <Link to="/tareas" style={{ color: "var(--accent)" }}>TAREAS</Link>.
          </div>
        )}

        {tareas.length >= 2 && (
          <>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              gap: 12, marginBottom: 12, flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-primary)" }}>
                  VISUALIZADOR {modo.toUpperCase()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className={mostrarNombres ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                  onClick={() => setMostrarNombres((v) => !v)}
                >
                  {mostrarNombres ? "Mostrando nombres" : "Mostrando #N"}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => cuboRef.current?.resetCamara()}>
                  Resetear cámara
                </button>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 360px",
              gap: 16,
              alignItems: "stretch",
              height: "clamp(440px, calc(100vh - 240px), 760px)",
            }}>
              {/* ── Visualizador + región minimizada ── */}
              <div style={{ position: "relative" }}>
                <CuboMatrix3D
                  ref={cuboRef}
                  puntos={puntos}
                  mostrarNombres={mostrarNombres}
                  modo={modo}
                />

                {/* Pill minimalista de N */}
                <div style={{
                  position: "absolute",
                  top: 8, right: 8,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 999,
                  padding: "3px 8px 3px 10px",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  display: "flex", alignItems: "center", gap: 6,
                  zIndex: 5,
                  boxShadow: "var(--shadow)",
                }}>
                  <span style={{ color: "var(--text-muted)" }}>Top-N</span>
                  <button
                    onClick={() => setTopN(topN - 1)}
                    disabled={topN <= 1}
                    style={{
                      background: "none", border: "none", color: "var(--text-muted)",
                      cursor: topN <= 1 ? "not-allowed" : "pointer",
                      padding: 0, width: 18, height: 18, lineHeight: 1, fontSize: 14,
                    }}
                  >−</button>
                  <span style={{ color: "var(--accent)", fontWeight: 700, minWidth: 14, textAlign: "center" }}>
                    {topN}
                  </span>
                  <button
                    onClick={() => setTopN(topN + 1)}
                    disabled={topN >= maxN}
                    style={{
                      background: "none", border: "none", color: "var(--text-muted)",
                      cursor: topN >= maxN ? "not-allowed" : "pointer",
                      padding: 0, width: 18, height: 18, lineHeight: 1, fontSize: 14,
                    }}
                  >+</button>
                </div>
              </div>

              {/* ── Acordeón a la derecha ── */}
              <div style={{
                display: "flex", flexDirection: "column", gap: 8,
                minHeight: 0,    // Necesario en CSS Grid para que respete la altura del row
                overflow: "hidden",
              }}>
                <PanelAcordeon
                  id="consumo"
                  titulo="1 · CONSUMO DE TIEMPO"
                  abierto={abierto === "consumo"}
                  onToggle={handleToggle}
                  badge={<Badge completo={dificultadCompleta} />}
                >
                  <ListaDragDrop
                    eje="dificultad"
                    tareas={tareas}
                    onChangeOrden={(ids) => setOrdenEjeClasificadas("dificultad", ids)}
                    etiquetaArriba="CONSUMO"
                    etiquetaAbajo="CONSUMO"
                  />
                </PanelAcordeon>

                <PanelAcordeon
                  id="criticidad"
                  titulo="2 · CRITICIDAD"
                  abierto={abierto === "criticidad"}
                  onToggle={handleToggle}
                  badge={<Badge completo={criticidadCompleta} />}
                >
                  {!dificultadCompleta ? (
                    <div className="alert alert-warning" style={{ margin: 0 }}>
                      Primero clasifica el CONSUMO DE TIEMPO.
                    </div>
                  ) : (
                    <ListaDragDrop
                      eje="criticidad"
                      tareas={tareas}
                      onChangeOrden={(ids) => setOrdenEjeClasificadas("criticidad", ids)}
                      etiquetaArriba="CRÍTICA"
                      etiquetaAbajo="CRÍTICA"
                    />
                  )}
                </PanelAcordeon>

                <PanelAcordeon
                  id="facilidad"
                  titulo="3 · FACILIDAD TECNOLÓGICA"
                  abierto={abierto === "facilidad"}
                  onToggle={handleToggle}
                  badge={<Badge completo={facilidadCompleta} />}
                >
                  {(!dificultadCompleta || !criticidadCompleta) ? (
                    <div className="alert alert-warning" style={{ margin: 0 }}>
                      Primero clasifica {!dificultadCompleta && "CONSUMO"}{!dificultadCompleta && !criticidadCompleta && " y "}{!criticidadCompleta && "CRITICIDAD"}.
                    </div>
                  ) : (
                    <ListaDragDrop
                      eje="facilidad"
                      tareas={tareas}
                      onChangeOrden={(ids) => setOrdenEjeClasificadas("facilidad", ids)}
                      etiquetaArriba="FÁCIL"
                      etiquetaAbajo="FÁCIL"
                    />
                  )}
                </PanelAcordeon>

                <PanelAcordeon
                  id="resultados"
                  titulo="4 · RESULTADOS"
                  abierto={abierto === "resultados"}
                  onToggle={handleToggle}
                  badge={<Badge count={region.length} />}
                >
                  {!todoCompleto ? (
                    <div className="alert alert-warning" style={{ margin: 0 }}>
                      Completa los tres ejes para ver la región prioritaria.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 0 }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        Top-{topN} resaltadas. Tabla con todas las tareas clasificadas ({region.length}).
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={handleExportCSV}
                          disabled={region.length === 0 || !carpetaOk}
                          title={!carpetaOk ? "Conecta una carpeta de trabajo para exportar" : undefined}
                        >
                          Exportar Top-{topN} a CSV
                        </button>
                      </div>
                      {!carpetaOk && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          Conecta una carpeta para habilitar la exportación.
                        </div>
                      )}
                      <div className="table-wrap" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>POS</th>
                              <th>#</th>
                              <th>NOMBRE</th>
                              <th>D</th>
                            </tr>
                          </thead>
                          <tbody>
                            {region.map((p) => (
                              <tr key={p.id} style={p.enTopN ? { background: "var(--success-dim)" } : undefined}>
                                <td style={{ color: p.enTopN ? "var(--success)" : "var(--text-muted)", fontWeight: 700 }}>{p.posicion}</td>
                                <td style={{ color: "var(--text-muted)" }}>#{p.numeral}</td>
                                <td style={{ whiteSpace: "normal", maxWidth: 160 }}>
                                  {p.nombre.trim() || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>(sin nombre)</span>}
                                </td>
                                <td>{p.distancia.toFixed(3).replace(".", ",")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </PanelAcordeon>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
