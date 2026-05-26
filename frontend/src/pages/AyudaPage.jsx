import React from "react";
import { Link } from "react-router-dom";

function Seccion({ titulo, children }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
        color: "var(--accent)", letterSpacing: "0.06em",
        marginBottom: 12,
      }}>
        {titulo}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

function Eje({ color, nombre, pregunta, descripcion }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 6,
      padding: 12,
      background: "var(--bg-surface-2)",
      border: `1px solid var(--border)`,
      borderLeft: `3px solid ${color}`,
      borderRadius: "var(--radius)",
    }}>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
        color, letterSpacing: "0.06em",
      }}>
        {nombre}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
        <em>{pregunta}</em>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
        {descripcion}
      </div>
    </div>
  );
}

function Tecla({ children }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 11,
      padding: "1px 6px",
      background: "var(--bg-surface-2)",
      border: "1px solid var(--border)",
      borderRadius: 4,
      color: "var(--accent)",
    }}>
      {children}
    </span>
  );
}

export default function AyudaPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">AYUDA</h1>
        <p className="page-subtitle">
          Cómo usar SEARCH &amp; SIMPLIFY para priorizar candidatos a automatización.
        </p>
      </div>

      <div className="page-body">
        <Seccion titulo="¿QUÉ HACE ESTA HERRAMIENTA?">
          <p>
            Te ayuda a responder una pregunta concreta: <strong>de todas las tareas que se podrían automatizar, ¿cuáles abordo primero?</strong>
          </p>
          <p style={{ marginTop: 8 }}>
            Las mejores candidatas son las que <strong>consumen mucho tiempo humano</strong>, son <strong>poco críticas</strong> (si fallan, no hay catástrofe) y son <strong>tecnológicamente fáciles</strong> de abordar con las herramientas actuales. La herramienta te lleva a clasificar tus tareas en estos tres ejes y te muestra cuáles están más cerca de ese rincón ideal.
          </p>
        </Seccion>

        <Seccion titulo="FLUJO DE TRABAJO">
          <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>
              <strong><Link to="/inicio" style={{ color: "var(--accent)" }}>INICIO</Link></strong> — Conecta una carpeta de trabajo y crea (o abre) un proyecto.
            </li>
            <li>
              <strong><Link to="/tareas" style={{ color: "var(--accent)" }}>TAREAS</Link></strong> — Define la lista de tareas y, si quieres, campos libres extra (Área, Responsable, etc.).
            </li>
            <li>
              <strong><Link to="/clasificacion" style={{ color: "var(--accent)" }}>CLASIFICACIÓN</Link></strong> — Clasifica las tareas en los tres ejes y consulta la región prioritaria.
            </li>
          </ol>
        </Seccion>

        <Seccion titulo="LOS TRES EJES">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Eje
              color="var(--accent)"
              nombre="1 · CONSUMO DE TIEMPO"
              pregunta="¿Cuánto tiempo humano cuesta hacer esta tarea hoy?"
              descripcion="Más tiempo consume → mejor candidata. Si ya la haces en un minuto, automatizarla aporta poco."
            />
            <Eje
              color="var(--accent)"
              nombre="2 · CRITICIDAD"
              pregunta="¿Cuánto importa si esta tarea sale mal?"
              descripcion="Menos crítica → mejor candidata. Una tarea con consecuencias graves si falla pide más cautela; mejor empezar por las menos críticas."
            />
            <Eje
              color="var(--accent)"
              nombre="3 · FACILIDAD TECNOLÓGICA"
              pregunta="¿Cómo de fácil es automatizarla con las herramientas actuales?"
              descripcion="Más fácil → mejor candidata. Una integración compleja te llevará semanas; un script simple, horas."
            />
          </div>
        </Seccion>

        <Seccion titulo="EL VÉRTICE IDEAL">
          <p>
            El cuadrado/cubo verde marcado como <strong style={{ color: "var(--success)" }}>IDEAL</strong> es la combinación perfecta:
            <strong> alto consumo + baja criticidad + alta facilidad</strong>. Las tareas más cercanas a ese rincón son las mejores candidatas a automatización.
          </p>
          <p style={{ marginTop: 8 }}>
            En el panel "Top-N" puedes ajustar cuántas tareas quieres considerar como región prioritaria. Aparecen en verde dentro del visualizador.
          </p>
        </Seccion>

        <Seccion titulo="CÓMO CLASIFICAR (DRAG-AND-DROP)">
          <p>
            En cada desplegable verás dos zonas:
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            <li><strong>CLASIFICADAS</strong>: tareas ya ordenadas. Top = más [atributo].</li>
            <li><strong>SIN CLASIFICAR</strong>: pendientes (se oculta cuando ya están todas).</li>
          </ul>
          <p style={{ marginTop: 8 }}>
            Arrastra de "sin clasificar" a "clasificadas" (o entre items para reordenar). Para desclasificar una tarea, arrástrala de vuelta a "sin clasificar".
          </p>
          <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
            La primera tarea que clasifiques aparecerá en el centro del eje. Conforme añadas más, se irán separando hacia los extremos.
          </p>
        </Seccion>

        <Seccion titulo="EL VISUALIZADOR SE TRANSFORMA">
          <p>El mismo visualizador cambia de modo según el desplegable activo:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            <li><strong>1D</strong> — Línea horizontal mientras clasificas <em>consumo de tiempo</em>.</li>
            <li><strong>2D</strong> — Superficie con cuatro cuadrantes al añadir <em>criticidad</em>. Aparece el IDEAL.</li>
            <li><strong>3D</strong> — Cubo con ocho octantes al añadir <em>facilidad</em>. El IDEAL queda en su rincón.</li>
          </ul>
          <p style={{ marginTop: 8 }}>
            En 3D puedes <strong>rotar</strong> el cubo con el ratón. En 1D y 2D la cámara queda fija de frente.
          </p>
        </Seccion>

        <Seccion titulo="CARPETA DE TRABAJO">
          <p>
            Cuando conectas una carpeta (Chrome o Edge sobre <Tecla>localhost</Tecla>) la app:
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>Lista los proyectos <Tecla>.json</Tecla> que hay en ella.</li>
            <li>Guarda automáticamente tus cambios (autoguardado debounced).</li>
            <li>Permite exportar el resultado a CSV (Top-N).</li>
          </ul>
          <p style={{ marginTop: 8 }}>
            Sin carpeta, los datos se guardan en el navegador (<Tecla>localStorage</Tecla>) pero no podrás exportarlos fuera.
          </p>
        </Seccion>

        <Seccion titulo="ATAJOS Y TRUCOS">
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>
              <strong>Hover</strong> sobre una tarea en el visualizador para ver su detalle (numeral, nombre y rangos).
            </li>
            <li>
              <strong>Botón "Mostrando #N / Mostrando nombres"</strong>: alterna entre los numerales y los nombres completos en las etiquetas.
            </li>
            <li>
              <strong>Pill "Top-N"</strong> arriba a la derecha del visor: cambia cuántas tareas se consideran prioritarias.
            </li>
            <li>
              <strong>Renombrar fichero</strong> en INICIO: alinea el nombre del fichero JSON con el nombre del proyecto.
            </li>
            <li>
              El número <Tecla>#N</Tecla> de cada tarea es estable: corresponde a su orden de creación en TAREAS, no a su clasificación.
            </li>
          </ul>
        </Seccion>
      </div>
    </>
  );
}
