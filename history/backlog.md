# Backlog — PrioMatrix3D

> Se actualiza al cierre de cada sprint. Formato: completadas con fecha, en curso, pendientes, ideas y bugs.

---

## Sprint 1 — Andamiaje + persistencia · ✅ Cerrado 2026-05-26

### Completado
- [x] Estructura de carpetas (`frontend/`, `history/`, `architecture.md`).
- [x] `package.json` con stack: React 18, Vite 5, react-router-dom (HashRouter), zustand, three. Sin papaparse (D-003).
- [x] `npm install` ejecutado — 76 paquetes.
- [x] `vite.config.js` con `viteSingleFile`, `stripCrossorigin`, `base: "./"`, salida `estilos.css`.
- [x] `src/style.css` — copia exacta de `reference/defalult_style.css`.
- [x] `src/state.js` — store Zustand con middleware `persist` (clave `priomatrix3dProject`).
- [x] `src/components/Toast.jsx` — `ToastProvider` + `useToast`.
- [x] `src/App.jsx` — sidebar + ThemeToggle persistente.
- [x] `src/pages/InicioPage.jsx` — tarjeta de identidad y tarjeta de progreso con barras por eje.
- [x] Stubs: `TareasPage`, `ClasificacionPage`, `ResultadoPage`.
- [x] `architecture.md` con decisiones (D-001 a D-005).

---

## Sprint 2 — Gestión de tareas y campos libres · ✅ Cerrado 2026-05-26

### Completado
- [x] Store ampliado: `addCampo`, `renombrarCampo`, `eliminarCampo`, `addTarea`, `editarNombreTarea`, `setCampoTarea`, `eliminarTarea`, `recompactarTodos` (helper interno).
- [x] `components/Modal.jsx` — modal base con cierre por ESC y por overlay.
- [x] `components/CamposLibresEditor.jsx` — CRUD de campos libres con confirmación de borrado (advierte que se pierden valores en tareas).
- [x] `pages/TareasPage.jsx`:
  - Encabezado con contador de tareas/campos, badges de "sin nombre" y "duplicados".
  - Aviso `alert-warning` si <2 (no clasificable) o >100 tareas.
  - Input "Añadir nueva tarea" con `Enter` para enviar.
  - Tabla editable inline: columna `#` + Nombre + una por campo libre + Eliminar.
  - Input rojo si nombre vacío o duplicado (no bloqueante, solo señal visual).
- [x] Toast en cada operación CRUD.

---

## Sprint 3 — Clasificación 3 ejes · ✅ Cerrado 2026-05-26

### Completado
- [x] Store: `setOrdenEje(eje, arrayIds)` (rangos = índice en arrayIds).
- [x] Helper interno `recompactarEje` para mantener rangos contiguos `0..k-1` tras añadir/borrar tareas.
- [x] `components/ListaDragDrop.jsx` — drag-and-drop HTML5 nativo (sin librerías). Indicador visual de "drop line" (línea accent de 2px) entre items. Top de lista = mayor rango; conversión reverse para el store.
- [x] `pages/ClasificacionPage.jsx`:
  - `grid-3` con las tres columnas (DIFICULTAD, CRITICIDAD, FACILIDAD TECNOLÓGICA).
  - Cada columna: cabecera font-mono + badge PENDIENTE/CLASIFICADO + lista + footer "menos [adjetivo]".
  - Si <2 tareas: aviso `alert-warning`. Si 0 tareas: alert-info con link a TAREAS.
  - Pie de página con enlace a RESULTADO.

---

## Sprint 4 — Visualización 3D · ✅ Cerrado 2026-05-26

### Completado
- [x] Store: `setTopN(n)` (clamp 1..1000), `getCoordenadas()`, `getRegionPrioritaria()`.
  - Coordenadas normalizadas: `coord = rango / (N-1)`; si N=1 → 0.5.
  - Distancia euclídea al vértice ideal `(1, 0, 1)`.
  - Desempate en Top-N: distancia ascendente, luego mayor rango de dificultad.
  - Solo entran tareas con los 3 rangos no nulos.
- [x] `components/CuboMatrix3D.jsx` — Three.js + OrbitControls:
  - Cubo wireframe externo (0,0,0)→(1,1,1) en `var(--border)`.
  - Cubo wireframe `IDEAL` accent en (1,0,1) con label.
  - Tres `ArrowHelper` accent + sprites canvas de etiquetas `DIFICULTAD/CRITICIDAD/FACILIDAD`.
  - Esferas: verde + radio mayor si Top-N, gris/opaco si resto.
  - Etiquetas de tarea: solo Top-N por defecto; toggle "Todas".
  - Raycaster + tooltip con nombre, rangos (1-indexados) y distancia.
  - `MutationObserver` sobre `data-theme` para refrescar colores al cambiar tema.
  - Limpieza de geometrías/materiales/sprites en `useEffect` cleanup.
  - `useImperativeHandle` para `resetCamara()`.
- [x] `services/exportar.js` — descarga JSON, descarga CSV (BOM UTF-8, separador `;`, coma decimal).
- [x] `pages/ResultadoPage.jsx`:
  - Si faltan ejes: `alert-warning` con la lista de ejes incompletos y link a CLASIFICACIÓN.
  - `grid-2` (cubo a la izquierda 1.4fr, panel derecho 1fr).
  - Leyenda Top-N / resto / vértice ideal. Checkbox "Todas las etiquetas". Botón "Resetear cámara".
  - Panel: input N (min 1, max nº tareas), botón "Exportar resultado a CSV", tabla priorizada con #/nombre/d/rangos.

---

## Sprint 5 — Import/Export y pulido · ✅ Cerrado 2026-05-26

### Completado
- [x] Store: `cargarProyecto(json)` con validación de `version === "1.0"` y `campos/tareas` como arrays. Saneamiento campo a campo + `recompactarTodos`.
- [x] Store: `exportarProyecto()` devuelve el JSON serializable (refresca `fechaModificacion`).
- [x] `services/exportar.js` ya estaba (S4). Ampliado uso por `descargarJSON` con timestamp en el nombre.
- [x] `components/ImportExportButtons.jsx` — wrapper con confirmación si hay datos al importar; lectura por `FileReader`; gestiona errores con toast.
- [x] `InicioPage` cablea ImportExportButtons + el botón "Exportar CSV" enlaza a `/resultado` (donde está el contexto de la región).
- [x] Verificación final:
  - `npm run build` → `dist/index.html` (697 kB, gzip 192 kB) + `dist/estilos.css` (11 kB).
  - `npm run dev` arranca limpio. HTTP 200 en `/`, `main.jsx`, `App.jsx`, `CuboMatrix3D.jsx` y `three/examples/jsm/controls/OrbitControls.js`.

### Edge cases cubiertos
- 0 tareas en clasificación / resultado → alert-info con link a TAREAS.
- 1 tarea: coord = 0.5 (centro del cubo). Top-N = 1.
- >100 tareas: aviso `alert-warning` en TAREAS.
- Eje incompleto: Resultado bloquea el cubo con `alert-warning` listando los ejes pendientes.
- Importar JSON con datos existentes: confirmación de reemplazo.
- "Reimportar" mismo fichero: input file se resetea (`value = ""`).
- Tareas sin nombre: visibles como `(sin nombre)` y marcadas con badge.
- Duplicados: marcados con badge contador (no bloqueante).

---

## Sprint 6.5 — TAREAS → solo creación + nuevo paso CONSUMO TIEMPO · ✅ Cerrado 2026-05-26

### Completado
- [x] Nav: `TAREAS` sin prefijo numérico. Añadido `1 · CONSUMO TIEMPO` con ruta `/consumo-tiempo`. Total: 5 entradas (INICIO, TAREAS, 1·CONSUMO TIEMPO, 2·CRITICIDAD, 3·FACILIDAD).
- [x] `StepsIndicator` ahora apunta a `/consumo-tiempo` para el paso 1. Label "CONSUMO TIEMPO".
- [x] `TareasPage` reducida a solo creación: contadores, alta, tabla CRUD, campos libres. Sin StepsIndicator, sin viz 1D, sin drag-drop. Link a `/consumo-tiempo` al final.
- [x] Nueva `ConsumoTiempoPage`: grid 2 columnas (viz 1D 1fr / drag-drop 360px), `align-items: stretch`, altura del grid `clamp(420px, calc(100vh - 260px), 640px)` para igualar la altura de ambos paneles.
- [x] `LineaMatrix1D` actualizado:
  - viewBox 1000×480 (más alto, mejor para apilamiento).
  - Margen interno `padInterior = 70`: los puntos no llegan a los extremos del eje (el ideal queda dentro).
  - Acepta `altura` prop; si no se pasa, fluido (flex: 1) para llenar el contenedor.
  - Labels por defecto: `+ CONSUMO` / `− CONSUMO`.
- [x] Labels de eje cambiados: `+ DIFICULTAD` → `+ CONSUMO` en MatrizMatrix2D y CuboMatrix3D.
- [x] Tooltip y tabla priorizada: columna `DIF` → `CONS`; tooltip texto `dif` → `cons`.
- [x] CSV exportado: columna `rango_dificultad` → `rango_consumo_tiempo`.
- [x] InicioPage: barra de progreso `DIFICULTAD` → `CONSUMO TIEMPO`.
- [x] Redirect compatibilidad: `/clasificacion` ahora va a `/consumo-tiempo` (antes `/tareas`).
- [x] Compatibilidad de datos: el campo interno `rangos.dificultad` se mantiene en el modelo. Sin migración necesaria. Documentado en `architecture.md`.
- [x] Build OK: 723 kB (gzip 198 kB). Dev OK en `localhost:5178`, todos los módulos nuevos HTTP 200.

### Notas / consecuencias
- Los CSV nuevos llevan `rango_consumo_tiempo`; los CSV antiguos seguirán teniendo `rango_dificultad`. No es un problema porque son artefactos de salida; cada export es independiente.
- Los JSON de proyectos (interno) siguen con `dificultad` como clave; abrir un proyecto viejo funciona transparentemente.

---

## Sprint 6.4 — Pulido y edge cases · ✅ Cerrado 2026-05-26

### Completado
- [x] Store: `renombrarFicheroActivo(nuevoNombre)` — actualiza nombre del proyecto, escribe nuevo fichero (con sufijo `_2` si hay conflicto), borra el anterior, refresca lista.
- [x] Store: `nuevoProyectoEnCarpeta` ahora devuelve `{ fichero, huboConflicto }` para que la UI pueda diferenciar el toast (success vs info).
- [x] Store: `refrescarProyectosCarpeta` auto-limpia `proyectoActualFichero` si el fichero ya no existe en la carpeta (p. ej. borrado externamente).
- [x] Store: `abrirProyectoDeCarpeta` captura `NotFoundError` y lanza un mensaje legible tras refrescar la lista.
- [x] InicioPage: botones "Renombrar fichero" y "Guardar ahora" dentro de la tarjeta "Proyecto actual" cuando hay proyecto activo. Mostrar timestamp de último guardado.
- [x] Toast info "Ya existía ese nombre. Proyecto creado como X_2.json" cuando hay conflicto al crear.
- [x] Badge `X sin clasificar` en la cabecera de cada visualización (1D, 2D, 3D) cuando hay tareas sin rango en el eje activo.
- [x] `MatrizMatrix2D`: algoritmo greedy de colocación de etiquetas con 6 posiciones candidatas (above, below, +- diagonales). Detecta colisión por bounding box y elige la primera posición libre. Reduce solapamiento visual en N≥10 tareas.
- [x] Build OK: `dist/index.html` 722 kB (gzip 198 kB).

### Notas / no incluido
- Drag-drop horizontal para el paso 1 (línea 1D): postergado. La columna vertical sigue siendo la forma de ordenar; el usuario lee el resultado en la línea horizontal.
- Anti-overlap en `LineaMatrix1D`: el apilamiento vertical por buckets ya funciona; no se ha cambiado.
- Anti-overlap en `CuboMatrix3D`: la rotación del cubo hace que cualquier colocación estática sea inestable. No abordado.
- Sprites del cubo en cambio de tema: sigue sin regenerarse (D-009). Pendiente.

---

## Sprint 6.3 — Pasos didácticos 1D → 2D → 3D · ✅ Cerrado 2026-05-26

### Completado
- [x] Store: `getCoordenadas1D()` (sólo dificultad) y `getCoordenadas2D()` (dif + crit). Coordenadas en `[-0.5, 0.5]`.
- [x] `components/LineaMatrix1D.jsx` — SVG con eje horizontal central, flecha al positivo, marca de origen y vértice IDEAL. Apilamiento vertical anti-overlap. Tooltip con numeral + rango.
- [x] `components/MatrizMatrix2D.jsx` — SVG cuadrado con ejes en cruz, cuadrante IDEAL (inf. dcha.) sombreado en `--success-dim`, marcador IDEAL en `(+0.5, -0.5)`. Tareas en cuadrante ideal con esfera verde, resto en accent.
- [x] `components/StepsIndicator.jsx` — wizard con bubbles 1/2/3, estado `active`/`done`/`pendiente` derivado del store (`tareas.every(t => rangos[eje] != null)`).
- [x] `TareasPage` reescrita: Paso 1 (Steps + counters + add + tabla + 1D viz + drag-drop dificultad).
- [x] `CriticidadPage` nueva: Paso 2 (Steps + 2D viz + drag-drop criticidad). Bloquea si dificultad incompleta.
- [x] `FacilidadPage` nueva: Paso 3 (Steps + cubo 3D + drag-drop facilidad + Top-N panel + CSV). Absorbe lo que era `RESULTADO`.
- [x] `App.jsx`: nav reducido a 4 entradas (`INICIO`, `1·TAREAS`, `2·CRITICIDAD`, `3·FACILIDAD`). Rutas `/clasificacion` y `/resultado` redirigen para compatibilidad.
- [x] Eliminados: `pages/ClasificacionPage.jsx` y `pages/ResultadoPage.jsx`.
- [x] Build OK: `dist/index.html` 718 kB (gzip 197 kB). Dev OK con HTTP 200 en las nuevas páginas y componentes.

### Notas
- El paso 1 (TAREAS) muestra primero el CRUD y luego, debajo, la viz 1D + drag-drop. La viz solo aparece cuando hay ≥2 tareas.
- El paso 2 y 3 bloquean su clasificación si faltan ejes previos, con links de vuelta al paso correspondiente.
- El icono del nav reutiliza los SVG de Heroicons v1 anteriores; los emojis numéricos van en el `label`.
- `RESULTADO` ya no existe como página; la tabla priorizada + N + export CSV viven en la columna derecha de FACILIDAD.

---

## Sprint 6.2 — Coordenadas centradas + numeral #N · ✅ Cerrado 2026-05-26

### Completado
- [x] `getCoordenadas`: coord ∈ `[-0.5, 0.5]` (era `[0, 1]`). Vértice ideal en `(0.5, -0.5, 0.5)`. Distancia equivalente numéricamente; el ranking Top-N no cambia.
- [x] `getCoordenadas` añade campo `numeral` 1-indexado = posición en `state.tareas`. Estable entre vistas.
- [x] `CuboMatrix3D` reescrito:
  - Cubo wireframe centrado en el origen `(-0.5,..) → (0.5,..)`.
  - Ejes como **líneas que pasan por el origen** (de `-0.62` a `+0.62`), no flechas en el borde. Los 8 octantes quedan visualmente separados.
  - Etiquetas `+ DIFICULTAD / + CRITICIDAD / + FACILIDAD` en el extremo positivo; pequeño `−` en el negativo.
  - Vértice IDEAL desplazado a `(0.5, -0.5, 0.5)`. Label `IDEAL` debajo.
  - OrbitControls `target = (0, 0, 0)`, distancia 1.0–5.
- [x] `CuboMatrix3D` acepta prop `mostrarNombres` (default `false`). Default → cada esfera lleva sprite `#N`. ON → sprite con el nombre.
- [x] `ResultadoPage`: botón toggle "Mostrando #N" / "Mostrando nombres" sustituye el viejo checkbox "Todas las etiquetas".
- [x] Tabla priorizada: nueva columna `#` con el numeral, junto a `POS` (posición Top-N).
- [x] CSV de exportación incluye columna `numeral` (`#N`).
- [x] Build OK: `dist/index.html` 709 kB (gzip 195 kB).

### Notas
- El tooltip muestra "#N · nombre" en la primera línea para correlación rápida.
- Eliminado el toggle "Todas las etiquetas" porque ahora todas las esferas llevan label siempre (el #N es corto y legible). Si en pruebas con N>30 se ve saturado, reintroducir.

---

## Sprint 6.1 — Rename + Workspace · ✅ Cerrado 2026-05-26

### Completado
- [x] Rename SEARCH & SIMPLIFY: `package.json`, `index.html` `<title>`, `App.jsx` logo. localStorage migrado de `priomatrix3d*` a `searchSimplify*` vía `migrations.js`.
- [x] `services/idb.js` — wrapper minimal (open / get / set / del).
- [x] `services/workspace.js` — soporte FSA: `seleccionarCarpeta`, `cargarHandleGuardado`, `verificarPermiso`, `pedirPermiso`, `listarProyectos`, `leerProyecto`, `escribirProyecto`, `existeFichero`, `borrarFichero`, `escribirCSV`, `slugFichero`.
- [x] Slice `workspace` en el store (no persistida en localStorage — handle vive en IDB) + acciones: `detectarWorkspace`, `conectarCarpeta`, `reconectarPermiso`, `desconectarCarpeta`, `refrescarProyectosCarpeta`, `abrirProyectoDeCarpeta`, `nuevoProyectoEnCarpeta`, `guardarProyectoActivo`, `borrarProyectoDeCarpeta`.
- [x] `components/WorkspaceStatus.jsx` — bloque del sidebar con 4 estados: sin soporte / sin carpeta / pendiente de permiso / conectada.
- [x] `hooks/useAutoguardado.js` — `useStore.subscribe`, debounce 700 ms, solo escribe si hay handle + permiso + fichero activo.
- [x] `InicioPage` reescrita: card "Nuevo proyecto" y card "Proyectos en la carpeta" (solo modo carpeta). Card de identidad y progreso siempre visibles. Botón "Importar/Exportar JSON" sustituido por el flujo de carpeta.
- [x] CSV export en `ResultadoPage`: escribe el fichero en la carpeta vía `escribirCSV`, refresca la lista. Botón deshabilitado con tooltip si no hay carpeta.
- [x] Removed: `components/ImportExportButtons.jsx`.
- [x] Build OK: `dist/index.html` 712 kB (gzip 195 kB). Dev OK en `localhost:5176` con HTTP 200 en `workspace.js`, `idb.js`, `useAutoguardado.js`, `WorkspaceStatus.jsx`.

### Decisiones (ver `architecture.md` §9 D-010)
- Carpeta opt-in con fallback a localStorage.
- Migración de claves localStorage con `migrations.js` (idempotente).
- Autoguardado debounce 700 ms.
- Export CSV solo con carpeta (la UI lo deshabilita).

### Notas / pulido pendiente
- Cuando se cambia de carpeta con datos en RAM, se mantiene el estado del proyecto activo. Considerar UX para "Guardar en nueva carpeta como…" sin tener que crear un proyecto nuevo desde Inicio.
- Tras reconectar permiso en una carpeta ya conocida, si el handle viejo apuntaba a un fichero que ya no existe, capturar y mostrar mensaje.
- Conflicto de nombres: hoy se añade sufijo `_2`, `_3`… al crear un nuevo proyecto con un nombre que ya existe. Documentar en la UI.

---

## Sprint 6 — Refactor SEARCH & SIMPLIFY (didáctico) · ⏳ En curso (S6.1 cerrado, S6.2–S6.4 pendientes)

Bloque de cambios de mayor alcance solicitado por el usuario. Resumen:

1. **Renombrar** el producto a "SEARCH & SIMPLIFY".
2. **Carpeta de trabajo** seleccionable (File System Access API). Los proyectos se cargan/guardan automáticamente desde esa carpeta. Botón "Exportar" deshabilitado mientras no haya carpeta seleccionada.
3. **Refactor del menú** en pasos didácticos progresivos:
   - **TAREAS** — definición de tareas + clasificación 1D por DIFICULTAD (línea horizontal izquierda → derecha).
   - **CRITICIDAD** — clasificación 2D (DIFICULTAD × CRITICIDAD), matriz con 4 cuadrantes.
   - **FACILIDAD TECNOLÓGICA** — clasificación 3D (cubo, 8 octantes), con panel Top-N (RESULTADO se absorbe aquí).
   - Cada vista muestra **#N** por defecto (numeral estable por orden de creación); botón "Mostrar nombres" en cabecera de cada visualización.
4. **Ejes centrados** (pasan por el origen): cubo `[-0.5, 0.5]` en cada dimensión, no `[0, 1]`. Los 8 octantes (4 cuadrantes en 2D, 2 mitades en 1D) quedan visualmente separados por los ejes.

### Prompt autocontenido para retomar en otra sesión

```
# Sprint 6 — Refactor SEARCH & SIMPLIFY (didáctico)

## Estado actual del repo (mayo 2026)

- Proyecto en `c:/Users/Usuario/Repositorios/search_simplify/`. Lee `architecture.md`,
  `history/backlog.md` y los archivos de `reference/` antes de tocar nada.
- Stack: React 18 + Vite 5 + Zustand (con `persist` → localStorage) + Three.js.
  HashRouter, build a dos ficheros (`dist/index.html` + `dist/estilos.css`).
- 5 sprints completados:
  - Estado modelado en `frontend/src/state.js` (modelo §4 de architecture.md).
  - Páginas en `frontend/src/pages/`: InicioPage, TareasPage (CRUD tabla),
    ClasificacionPage (3 columnas drag-and-drop), ResultadoPage (cubo 3D + Top-N).
  - Componentes en `frontend/src/components/`: ListaDragDrop, CuboMatrix3D,
    CamposLibresEditor, Modal, Toast, ImportExportButtons.

## Cambios a aplicar

### 1. Renombrar a SEARCH & SIMPLIFY
- `package.json` → `"name": "search-simplify"`.
- `index.html` <title>.
- `App.jsx` → `.nav-logo-text` y `.nav-logo-sub`.
- Documentación: `architecture.md`, `history/backlog.md` y cualquier mención de
  "PrioMatrix3D" en el código (grep antes de empezar).
- Mantener clave de localStorage actual (`priomatrix3dProject`) para no romper
  estado persistido del usuario, o añadir migración.

### 2. Carpeta de trabajo (File System Access API)

**Restricción crítica**: la FSA API (`window.showDirectoryPicker`,
`FileSystemDirectoryHandle`) NO funciona en `file://`. Requiere contexto seguro
(https o http://localhost). Decidir con el usuario:
   (a) abandonar el flujo "doble clic sobre dist/index.html" y servir por
       `npm run preview` o un dev server local;
   (b) hacer la función opcional con fallback a localStorage (modo actual);
   (c) empaquetar como Electron/Tauri (mayor esfuerzo).

Propuesta por defecto: **(b)**. La carpeta es opt-in. Si no hay carpeta
seleccionada, todo funciona como ahora (localStorage + import/export manual).

Implementación:
- `services/workspace.js`:
  - `seleccionarCarpeta()` → `showDirectoryPicker({ mode: "readwrite" })`.
  - `guardarHandle(handle)` / `cargarHandle()` vía **IndexedDB** (los handles no
    son serializables a localStorage; sí a IDB).
  - `verificarPermiso(handle)` con `queryPermission` / `requestPermission`.
  - `listarProyectos(handle)` → enumera `.json` en la carpeta.
  - `leerProyecto(handle, nombreFichero)` → JSON.
  - `escribirProyecto(handle, nombreFichero, datos)` → write + close.
- Zustand: nueva slice `workspace` con `handle`, `permisoConcedido`,
  `proyectoActualFichero`. Se persiste el `handle` en IDB (no en localStorage).
- **Autoguardado**: tras cada acción del store que modifique datos, dispara una
  escritura debounced (≥500 ms) al fichero del proyecto activo. Toast solo en
  errores; éxito silencioso (badge "Guardado" en el sidebar).
- UI:
  - Bloque en el sidebar (debajo del logo): "Carpeta: [ninguna] / [ruta]" +
    botón "Seleccionar". Estado del permiso visible (badge OK / Pendiente).
  - InicioPage: selector de proyecto (dropdown de los `.json` de la carpeta),
    botón "Nuevo proyecto" que crea fichero, botón "Exportar JSON" deshabilitado
    si no hay carpeta.
- Manejo de pérdida de permiso (handle invalidado al recargar el navegador):
  pedir re-confirmación con un botón "Reconectar carpeta" cuando el `handle`
  exista pero `queryPermission` retorne "prompt".

### 3. Refactor de la navegación en pasos didácticos

Antes (5 entradas): INICIO / TAREAS / CLASIFICACIÓN / RESULTADO
Después (4 entradas):
   INICIO
   1. TAREAS        — definición + visualización 1D (DIFICULTAD, línea ⇄)
   2. CRITICIDAD    — visualización 2D (DIFICULTAD × CRITICIDAD, 4 cuadrantes)
   3. FACILIDAD     — visualización 3D (cubo, 8 octantes) + panel Top-N

RESULTADO se absorbe en el paso 3 (panel a la derecha). Si quieres mantener
una página RESULTADO aparte solo para el listado priorizado sin cubo,
házmelo saber antes.

Cada página de los pasos 1–3 contiene:
- A la izquierda (o arriba): la visualización (1D / 2D / cubo 3D).
- A la derecha (o debajo): la lista drag-and-drop del eje correspondiente
  (reutilizar ListaDragDrop). En el paso 2 hay DOS listas (las dos clasificadas);
  en el paso 3 hay TRES.
- En la cabecera de la visualización: toggle "Mostrar nombres" (default OFF
  → muestra #N).
- Badge de pasos (`.steps` del design system) en lo alto de las 4 páginas,
  indicando el progreso (TAREAS → CRITICIDAD → FACILIDAD → DONE).

#### Numeración #N
Cada tarea recibe un numeral estable = su posición en `state.tareas` (1-indexada).
Si se elimina una tarea, los numerales se recompactan (igual que los rangos hoy).
El número se muestra siempre como `#<n>` con `font-mono`.

#### Visualización 1D (LineaMatrix1D.jsx)
- Canvas SVG o div con flexbox; recta horizontal con eje DIFICULTAD.
- Origen en el centro de la línea (eje cruza por 0). Mitad izquierda = menos,
  mitad derecha = más.
- Cada tarea: círculo accent + label `#N` debajo (o nombre si toggle ON).
- Tooltip on hover con nombre + rango.
- Si <2 tareas o no clasificado: estado vacío con CTA.

#### Visualización 2D (MatrizMatrix2D.jsx)
- SVG cuadrado con ejes en cruz (líneas que pasan por el centro).
- Etiqueta de cuadrantes (ej.: arriba-derecha = "alto dif + alta crit").
- Tareas como burbujas posicionadas por (x_dif, y_crit) ∈ [-0.5, 0.5]².
- Mismo patrón de label #N / nombre.
- Resaltar el cuadrante "ideal" (alto dif + baja crit) con un fondo accent-dim.

#### Visualización 3D (CuboMatrix3D.jsx — refactor)
- Refactorizar el cubo existente para que las coordenadas sean
  `coord = (rango / (N-1)) - 0.5` ∈ [-0.5, 0.5].
- Cubo wireframe de (-0.5,-0.5,-0.5) a (0.5,0.5,0.5).
- **Ejes pasan por el origen** (no por el borde) → añadir 3 líneas axiales
  desde -0.6 a +0.6 con etiquetas en los extremos positivo y negativo.
- 8 octantes visibles. Resaltar levemente el octante ideal (x>0, y<0, z>0)
  con un cubo wireframe accent-dim opacidad 0.1, o un sombreado.
- Vértice ideal: ahora en `(0.5, -0.5, 0.5)`. Marcador igual que ahora.
- OrbitControls target: `(0, 0, 0)`.
- Sprites de tarea: muestran `#N` por defecto, switch a nombre si toggle ON.
  Para que el cambio sea barato, regenerar el `CanvasTexture` cuando cambia
  el modo (no en cada render).

#### Modelo de datos
- No cambia. `getCoordenadas` se actualiza para devolver coordenadas en
  [-0.5, 0.5]³ y la fórmula de distancia al vértice ideal queda:
  `d = sqrt((0.5 - x)² + (-0.5 - y)² + (0.5 - z)²)` (equivalente a antes
  tras desplazar 0.5).
- Para los pasos 1 y 2 hace falta una variante: `getCoordenadas1D()` y
  `getCoordenadas2D()`, o un parámetro al getter. Decidir según legibilidad.

### 4. Ejes centrados (consecuencia de los pasos 1–3)

Ya cubierto en cada visualización. La conversión a coordenadas centradas
también implica recalcular ratio de cámara, posición inicial OrbitControls
y limpieza del label "IDEAL".

## Decisiones cerradas (confirmadas por el usuario 2026-05-26)

- [x] **Folder de trabajo**: opt-in con fallback a localStorage. Si el navegador
      no soporta FSA API o el usuario no selecciona carpeta, la app funciona
      como hoy. Compatible con `file://`. El export queda deshabilitado solo
      en el sub-flujo "guardar en carpeta"; el export JSON manual permanece
      disponible siempre.
- [x] **RESULTADO**: absorbida en el paso 3 (FACILIDAD). Cubo a la izquierda,
      panel Top-N con tabla priorizada a la derecha. Menú final: 4 entradas
      (INICIO, TAREAS, CRITICIDAD, FACILIDAD).
- [x] **Numeral #N**: estable por orden de creación. Se recompacta al borrar
      tareas. Mismo #N en las tres vistas para una misma tarea.
- [x] **Dirección 1D**: izquierda = menos difícil, derecha = más difícil
      (cartesiano). Coherente con el cubo (`x = +0.5` para máx. dificultad).

## Sprints sugeridos para esta tanda

- **S6.1**: rename + workspace (carpeta + IDB + autoguardado).
- **S6.2**: refactor de coordenadas a [-0.5, 0.5] + nuevo cubo con ejes
            centrados + Sprites con #N / nombre.
- **S6.3**: nuevas páginas y nav (TAREAS-1D, CRITICIDAD-2D, FACILIDAD-3D)
            con sus visualizaciones nuevas.
- **S6.4**: ajuste fino (toggles, contadores, Top-N en el paso 3, edge cases),
            actualización de docs y backlog.

Al cierre de cada sub-sprint: actualizar `architecture.md` y `history/backlog.md`.
```

---

## Ideas / pospuesto

- Modo "presentación" con cubo a pantalla completa.
- Exportar PNG/SVG del cubo desde el canvas Three.js.
- Permitir pesos por eje (afecta la fórmula de distancia).
- StatusBar lateral (D-005): no se ha añadido; el flujo no lo demanda.
- Animación de transición de esferas cuando cambia el orden.
- Memo selectivo en getCoordenadas/getRegionPrioritaria si N crece (>500 tareas).
- Modo light: verificar contraste de sprites de texto (actualmente leen colores en mount; no re-renderizan en cambio de tema).
- `npm audit` (2 vulnerabilidades moderadas en deps transitivas) — revisar antes de un release público.

---

## Bugs conocidos

_(ninguno detectado en build/runtime; pendiente de validación visual del cubo y la tabla en navegador)_
