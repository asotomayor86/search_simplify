import React, { useCallback, useMemo, useRef, useState } from "react";

/**
 * Lista vertical con dos zonas:
 *   - CLASIFICADAS (arriba): tareas ordenadas por rango descendente.
 *       Top = mayor rango (más [adjetivo]).
 *       Bottom = menor rango.
 *   - SIN CLASIFICAR (abajo): tareas con `rangos[eje] == null`, en orden de
 *     creación. Cuando todas están clasificadas, esta zona se oculta.
 *
 * Drag-and-drop entre zonas: arrastrar de "sin clasificar" a "clasificadas"
 * asigna rango. Arrastrar de "clasificadas" a "sin clasificar" desclasifica.
 *
 * Callback `onChangeOrden(classifiedIds)` recibe ids de clasificadas en orden
 * de rango 0..K-1 (bottom→top en términos visuales).
 *
 * Notas de implementación para que el drag-and-drop sea fiable:
 *   - ItemFila se define a nivel de módulo (no dentro del padre) para que React
 *     no remonte el componente entre renders, lo que cancelaría el drag activo.
 *   - setDragId se difiere con setTimeout(0) para que el navegador "comprometa"
 *     el dragstart antes de que un re-render mute el DOM.
 */

function ItemFila({
  tarea, section, posicion,
  dragId, dropTarget,
  onDragStart, onDragOver, onDragEnd, onDrop,
  idx,
}) {
  if (!tarea) return null;
  const id = tarea.id;
  const isDragging = dragId === id;
  const isTarget = dropTarget && dropTarget.kind === "item" && dropTarget.section === section && dropTarget.id === id;
  const showBefore = isTarget && dropTarget.before && dragId !== id;
  const showAfter  = isTarget && !dropTarget.before && dragId !== id;
  const esClasificada = section === "cla";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, section, id)}
      onDrop={(e) => onDrop(e, { kind: "item", section, id, before: dropTarget?.before })}
      style={{
        position: "relative",
        display: "flex", alignItems: "center", gap: 8,
        padding: "7px 10px",
        marginTop: idx === 0 ? 0 : 3,
        background: isDragging
          ? "var(--accent-dim)"
          : esClasificada ? "var(--bg-surface-2)" : "var(--bg-surface)",
        border: `1px solid ${isDragging ? "var(--border-accent)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        cursor: "grab",
        opacity: isDragging ? 0.4 : esClasificada ? 1 : 0.85,
        userSelect: "none",
        transition: "background 80ms",
      }}
    >
      {showBefore && (
        <div style={{
          position: "absolute", left: 2, right: 2, top: -3,
          height: 2, background: "var(--accent)", borderRadius: 999,
          pointerEvents: "none",
        }} />
      )}
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
        color: esClasificada ? "var(--accent)" : "var(--text-muted)",
        minWidth: 28, textAlign: "right",
        pointerEvents: "none",
      }}>
        {esClasificada ? `#${posicion}` : "—"}
      </span>
      <span style={{
        flex: 1, fontSize: 13,
        color: tarea.nombre.trim() ? "var(--text-primary)" : "var(--text-muted)",
        fontStyle: tarea.nombre.trim() ? "normal" : "italic",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        pointerEvents: "none",
      }}>
        {tarea.nombre.trim() || "(sin nombre)"}
      </span>
      <span style={{
        color: "var(--text-muted)", fontSize: 14, lineHeight: 1,
        pointerEvents: "none",
      }} title="Arrastra para reordenar">⋮⋮</span>
      {showAfter && (
        <div style={{
          position: "absolute", left: 2, right: 2, bottom: -3,
          height: 2, background: "var(--accent)", borderRadius: 999,
          pointerEvents: "none",
        }} />
      )}
    </div>
  );
}

export default function ListaDragDrop({
  eje,
  tareas,
  onChangeOrden,
  etiquetaArriba,
  etiquetaAbajo,
}) {
  const clasificadasIds = useMemo(
    () =>
      [...tareas]
        .filter((t) => t.rangos[eje] != null)
        .sort((a, b) => b.rangos[eje] - a.rangos[eje]) // top = mayor rango
        .map((t) => t.id),
    [tareas, eje]
  );

  const sinClasificarIds = useMemo(
    () => tareas.filter((t) => t.rangos[eje] == null).map((t) => t.id),
    [tareas, eje]
  );

  const tareaPorId = useMemo(() => {
    const m = new Map();
    for (const t of tareas) m.set(t.id, t);
    return m;
  }, [tareas]);

  const dragIdRef = useRef(null);
  const [dragId, setDragId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const limpiarDrag = useCallback(() => {
    dragIdRef.current = null;
    setDragId(null);
    setDropTarget(null);
  }, []);

  const handleDragStart = useCallback((e, id) => {
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", id); } catch {}
    // Diferimos la actualización de estado para que el navegador
    // confirme el dragstart antes de que un re-render mute el DOM
    // y cancele el drag (problema típico React + HTML5 DnD).
    setTimeout(() => setDragId(id), 0);
  }, []);

  const handleItemDragOver = useCallback((e, section, id) => {
    if (!dragIdRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    setDropTarget((prev) => {
      if (prev && prev.kind === "item" && prev.section === section && prev.id === id && prev.before === before) return prev;
      return { kind: "item", section, id, before };
    });
  }, []);

  const handleSectionDragOver = useCallback((e, section) => {
    if (!dragIdRef.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget((prev) => {
      if (prev && prev.kind === "end" && prev.section === section) return prev;
      return { kind: "end", section };
    });
  }, []);

  const computarNuevoOrden = useCallback((draggingId, target) => {
    let nuevaClasif = clasificadasIds.filter((id) => id !== draggingId);
    if (target.section === "cla") {
      let idx;
      if (target.kind === "end") {
        idx = nuevaClasif.length;
      } else {
        const i = nuevaClasif.indexOf(target.id);
        if (i === -1) idx = nuevaClasif.length;
        else idx = target.before ? i : i + 1;
      }
      nuevaClasif.splice(idx, 0, draggingId);
    }
    return [...nuevaClasif].reverse();
  }, [clasificadasIds]);

  const handleDrop = useCallback((e, target) => {
    if (!dragIdRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const draggingId = dragIdRef.current;
    const t = target || dropTarget;
    limpiarDrag();
    if (!t) return;
    const ids = computarNuevoOrden(draggingId, t);
    const original = [...clasificadasIds].reverse();
    if (ids.length !== original.length || ids.some((id, i) => id !== original[i])) {
      onChangeOrden(ids);
    }
  }, [dropTarget, clasificadasIds, computarNuevoOrden, onChangeOrden, limpiarDrag]);

  const K = clasificadasIds.length;
  const U = sinClasificarIds.length;
  const todasClasificadas = U === 0;
  const claActiva = dropTarget?.section === "cla";
  const sinActiva = dropTarget?.section === "sin";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      overflow: "hidden",
      flex: 1,
      minHeight: 0,
    }}>
      <div style={{
        padding: "8px 12px",
        background: "var(--bg-surface-2)",
        borderBottom: "1px solid var(--border)",
        fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
        letterSpacing: "0.06em",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ color: "var(--accent)" }}>▲</span>
        <span>MÁS {etiquetaArriba}</span>
      </div>

      {/* ── Sección CLASIFICADAS ── */}
      <div
        onDragOver={(e) => handleSectionDragOver(e, "cla")}
        onDrop={(e) => handleDrop(e, { kind: "end", section: "cla" })}
        style={{
          padding: 8, display: "flex", flexDirection: "column",
          background: claActiva && dragId ? "var(--accent-dim)" : "transparent",
          transition: "background 100ms",
          flex: 1,
          minHeight: K > 0 ? 0 : 56,
          overflowY: "auto",
          position: "relative",
        }}
      >
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
          color: "var(--accent)", letterSpacing: "0.06em",
          marginBottom: K > 0 ? 6 : 0,
        }}>
          CLASIFICADAS ({K})
        </div>
        {K === 0 ? (
          <div style={{
            margin: "4px 0", padding: "10px 12px",
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius)",
            fontSize: 11, color: "var(--text-muted)",
            textAlign: "center",
          }}>
            Arrastra tareas aquí para clasificarlas.
          </div>
        ) : (
          clasificadasIds.map((id, idx) => (
            <ItemFila
              key={id}
              idx={idx}
              tarea={tareaPorId.get(id)}
              section="cla"
              posicion={idx + 1}
              dragId={dragId}
              dropTarget={dropTarget}
              onDragStart={handleDragStart}
              onDragEnd={limpiarDrag}
              onDragOver={handleItemDragOver}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>

      {/* ── Separador + sección SIN CLASIFICAR (solo si quedan sin clasificar) ── */}
      {!todasClasificadas && (
        <>
          <div style={{
            padding: "5px 12px",
            background: "var(--bg-surface-3)",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
            letterSpacing: "0.06em",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span>SIN CLASIFICAR</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>{U}</span>
          </div>

          <div
            onDragOver={(e) => handleSectionDragOver(e, "sin")}
            onDrop={(e) => handleDrop(e, { kind: "end", section: "sin" })}
            style={{
              padding: 8, display: "flex", flexDirection: "column",
              background: sinActiva && dragId ? "var(--warning-dim)" : "transparent",
              transition: "background 100ms",
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
            }}
          >
            {sinClasificarIds.map((id, idx) => (
              <ItemFila
                key={id}
                idx={idx}
                tarea={tareaPorId.get(id)}
                section="sin"
                dragId={dragId}
                dropTarget={dropTarget}
                onDragStart={handleDragStart}
                onDragEnd={limpiarDrag}
                onDragOver={handleItemDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </>
      )}

      <div style={{
        padding: "8px 12px",
        background: "var(--bg-surface-2)",
        borderTop: "1px solid var(--border)",
        fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
        letterSpacing: "0.06em",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ color: "var(--text-muted)" }}>▼</span>
        <span>MENOS {etiquetaAbajo}</span>
      </div>
    </div>
  );
}
