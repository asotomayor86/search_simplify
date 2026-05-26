# Arquitectura — SEARCH & SIMPLIFY

> Memoria persistente del proyecto. Se actualiza cada vez que se toma una decisión arquitectónica o estructural.

---

## 1. Propósito

Aplicación SPA de consultoría para priorizar tareas mediante una matriz tridimensional (dificultad × criticidad × facilidad tecnológica). Devuelve la Top-N de tareas más cercanas al vértice ideal `(1, 0, 1)` por distancia euclídea normalizada.

Distribución prevista: dos ficheros estáticos (`dist/index.html` + `dist/estilos.css`) que se abren por doble clic vía `file://` o desde un servidor estático. Sin backend.

---

## 2. Stack

| Capa | Tecnología | Versión |
|---|---|---|
| UI | React | 18.3.1 |
| Build / dev | Vite | 5.4.21 |
| Plugin React | @vitejs/plugin-react | 4.3.4 |
| Bundling final | vite-plugin-singlefile | 2.0.2 |
| Router | react-router-dom (**HashRouter**) | 6.22.3 |
| Estado global | zustand + middleware `persist` | 4.5.2 |
| 3D | three | 0.160.1 |
| Estilos | CSS puro (sin Tailwind ni librerías de componentes) | — |
| Fuentes | DM Sans (UI), JetBrains Mono (mono) | — |

**No se incluyen**: papaparse (la entrada de tareas es manual), Redux/Context (sustituido por Zustand), librerías de drag-and-drop (se usa el API HTML5 nativo).

---

## 3. Estructura de directorios

```
search_simplify/
├── reference/                ← Referencias del proyecto (singular por decisión del usuario; ver §9)
│   ├── defalult_style.css    ← CSS base — INMUTABLE
│   ├── design_references.html
│   ├── do_it_always.md
│   ├── react-vite-zustand-papaparse-css-spa.md
│   └── standard_layout.md
├── history/
│   └── backlog.md            ← actualizado al cierre de cada sprint
├── architecture.md           ← este fichero
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/               ← assets copiados a dist/ tal cual (logo, etc.)
│   └── src/
│       ├── main.jsx          ← entry React
│       ├── App.jsx           ← layout sidebar + router + ThemeToggle
│       ├── style.css         ← copia de defalult_style.css (editable aquí)
│       ├── state.js          ← store Zustand con persist
│       ├── pages/
│       │   ├── InicioPage.jsx
│       │   ├── TareasPage.jsx
│       │   ├── ClasificacionPage.jsx
│       │   └── ResultadoPage.jsx
│       ├── pages/
│       │   ├── InicioPage.jsx          ← carpeta, lista proyectos, nuevo, progreso
│       │   ├── TareasPage.jsx          ← solo creación (CRUD + campos libres)
│       │   ├── ConsumoTiempoPage.jsx   ← Paso 1: viz 1D + drag-drop (eje interno: `dificultad`)
│       │   ├── CriticidadPage.jsx      ← Paso 2: 2D matriz + drag-drop CRITICIDAD
│       │   └── FacilidadPage.jsx       ← Paso 3: cubo 3D + drag-drop FACILIDAD + Top-N
│       ├── components/
│       │   ├── Toast.jsx               ← ToastProvider + useToast
│       │   ├── Modal.jsx               ← Modal base reutilizable
│       │   ├── CamposLibresEditor.jsx  ← CRUD campos libres (modal)
│       │   ├── ListaDragDrop.jsx       ← columna reordenable HTML5
│       │   ├── StepsIndicator.jsx      ← wizard 1/2/3 con estado por eje
│       │   ├── LineaMatrix1D.jsx       ← viz 1D (SVG) por dificultad
│       │   ├── MatrizMatrix2D.jsx      ← viz 2D (SVG) dif × crit, cuadrante ideal
│       │   ├── CuboMatrix3D.jsx        ← motor Three.js (forwardRef + resetCamara)
│       │   └── WorkspaceStatus.jsx     ← bloque del sidebar: estado de carpeta
│       ├── hooks/
│       │   └── useAutoguardado.js      ← debounce 700 ms tras cambios persistibles
│       ├── migrations.js               ← one-shot: priomatrix3d* → searchSimplify*
│       └── services/
│           ├── exportar.js             ← construirCSV / nombreCSV / fmtNum
│           ├── idb.js                  ← wrapper mínimo de IndexedDB
│           └── workspace.js            ← File System Access API + slug
└── dist/                     ← salida del build
    ├── index.html
    └── estilos.css
```

---

## 4. Modelo de datos (Zustand)

```js
{
  version: "1.0",
  nombreProyecto: string,
  fechaCreacion:     ISO string,
  fechaModificacion: ISO string,
  campos: [{ id, nombre }],
  tareas: [{
    id, nombre,
    campos: { [campoId]: string },
    rangos: { dificultad: number|null, criticidad: number|null, facilidad: number|null }
  }],
  configuracion: { topN: 5 }
}
```

Acciones del store:
- **Proyecto**: `nuevoProyecto()`, `setNombreProyecto(n)`, `cargarProyecto(json)`, `exportarProyecto()`.
- **Campos libres**: `addCampo(nombre)`, `renombrarCampo(id, nombre)`, `eliminarCampo(id)` (borra los valores en cada tarea).
- **Tareas**: `addTarea(nombre)`, `editarNombreTarea(id, nombre)`, `setCampoTarea(taskId, campoId, valor)`, `eliminarTarea(id)`.
- **Clasificación**: `setOrdenEje(eje, arrayIds)` — `rangos[eje] = índice en arrayIds`.
- **Configuración**: `setTopN(n)` (clamp 1..1000).

Helpers internos (no exportados): `recompactarEje(tareas, eje)`, `recompactarTodos(tareas)` se ejecutan tras `eliminarTarea` y `cargarProyecto` para que los rangos sean contiguos `0..k-1`.

Derivados:
- `getResumen()` — nº de tareas/campos, % clasificado por eje, fecha de modificación.
- `getCoordenadas()` — array `{ id, nombre, x, y, z, distancia, rangoDif, rangoCrit, rangoFac, dentroRegion }`. Solo tareas con los 3 rangos no nulos. `dentroRegion` marca el Top-N.
- `getRegionPrioritaria()` — `getCoordenadas()` filtrado por `dentroRegion`, ordenado por distancia asc. + desempate por mayor `rangoDif`, con `posicion` 1-indexada.

### Fórmula (coordenadas centradas, S6.2)

- Coord normalizada por eje: `coord = rango / (N - 1) - 0.5`. Si `N = 1` → `0`. Rango ∈ `[-0.5, 0.5]`.
- Vértice ideal: `(x = +0.5, y = -0.5, z = +0.5)`.
- Distancia: `d = sqrt((0.5 - x)² + (-0.5 - y)² + (0.5 - z)²)`. Numéricamente idéntica a la fórmula anterior; la Top-N no cambia, sólo el sistema de coordenadas visible.
- Top-N: las `configuracion.topN` tareas con menor `d`. Desempate por mayor `rangoDif`.

### Numeral #N (S6.2)

Cada tarea recibe un numeral 1-indexado igual a su posición en `state.tareas`. Se exporta como `numeral` en `getCoordenadas` y se muestra por defecto en el cubo (en lugar del nombre). Al eliminar una tarea, los numerales se recompactan junto con los rangos (`recompactarTodos`).

---

## 5. Persistencia

### Tres capas

1. **`localStorage`** (siempre activa). Middleware `persist` de Zustand. Clave `searchSimplifyProject`, `version: 1`. `partialize` excluye la slice `workspace` (los handles no son serializables a `localStorage`). Es la persistencia "scratch": permite cerrar/abrir el navegador sin perder el trabajo en curso aunque no haya carpeta.
2. **`IndexedDB`** (solo si el usuario conecta carpeta). Store `workspace` con la clave `directoryHandle`. Persiste el `FileSystemDirectoryHandle` entre sesiones (los handles SÍ son serializables a IDB vía structured clone).
3. **Sistema de ficheros del usuario** (vía File System Access API). Los proyectos viven como `.json` dentro de la carpeta elegida. El autoguardado escribe ahí con `debounce 700 ms` tras cualquier cambio en `nombreProyecto`, `campos`, `tareas` o `configuracion`.

### Tema

Tema claro/oscuro en `localStorage` con clave `searchSimplifyTheme` (independiente del store).

### Migración

`migrations.js` (importado antes de `state.js`) copia `priomatrix3dProject` → `searchSimplifyProject` y `priomatrix3dTheme` → `searchSimplifyTheme` la primera vez que se ejecuta v0.2 sobre un perfil con datos viejos.

---

## 6. Routing

`HashRouter` (compatible con `file://`). Rutas:

| Ruta | Componente | Estado |
|---|---|---|
| `/` | redirect → `/inicio` | — |
| `/inicio` | `InicioPage` | ✅ |
| `/tareas` | `TareasPage` (solo creación) | ✅ |
| `/consumo-tiempo` | `ConsumoTiempoPage` (Paso 1: 1D) | ✅ |
| `/criticidad` | `CriticidadPage` (Paso 2: 2D) | ✅ |
| `/facilidad` | `FacilidadPage` (Paso 3: 3D + Top-N) | ✅ |
| `/clasificacion` | redirect → `/consumo-tiempo` (compat) | — |
| `/resultado` | redirect → `/facilidad` (compat) | — |
| `*` | redirect → `/inicio` | — |

**Nota sobre nomenclatura**: el campo interno `rangos.dificultad` se mantiene por compatibilidad con proyectos guardados anteriormente. En la UI siempre se presenta como "CONSUMO TIEMPO".

---

## 7. Build

`vite.config.js` clave:
- `base: "./"` — rutas relativas para `file://`.
- `viteSingleFile({ inlinePattern: ["**/*.js"] })` — embebe el JS en `index.html`.
- `stripCrossorigin` plugin — elimina el atributo `crossorigin` del `<link>` del CSS (incompatible con `file://`).
- `cssCodeSplit: false` + `assetFileNames` → un único CSS de salida llamado `estilos.css`.
- `outDir: "../dist"` → ficheros finales fuera de `frontend/`.

Build actual (final S5): `index.html` ≈ 697 kB (gzip 192 kB) — el grueso proviene de Three.js. `estilos.css` ≈ 11 kB.

---

## 8. Convenciones

- **Estilos**: nunca colores hexadecimales en JSX. Siempre `var(--…)`. Solo se edita `frontend/src/style.css`; `reference/defalult_style.css` es inmutable.
- **Idioma**: interfaz en español, formato numérico `es-ES`.
- **Nombres**: páginas `*Page.jsx`, componentes PascalCase, servicios camelCase, clases CSS kebab-case, variables CSS `--kebab-case`.
- **Persistencia explícita**: `partialize` define qué se guarda. Cualquier nuevo campo de datos debe añadirse ahí.

---

## 9. Decisiones registradas

### D-001 — Folder de referencias en singular (`reference/`)
- **Decisión**: mantener `reference/` (singular) tal como existe en el repo.
- **Conflicto resuelto**: `do_it_always.md` y el brief del proyecto piden `references/` (plural). El usuario confirma que `reference/` es la forma correcta.
- **Implicación**: no editar `do_it_always.md` para corregirlo (regla 2 de ese mismo documento sobre no editar archivos inmutables del proyecto). La discrepancia queda documentada aquí.

### D-002 — Persistencia en `localStorage` mediante `persist` de Zustand
- **Decisión**: el estado se guarda automáticamente entre sesiones con `zustand/middleware`.
- **Conflicto resuelto**: el stack guide `react-vite-zustand-papaparse-css-spa.md` dice "el estado vive en RAM, se pierde al recargar". El brief de SEARCH & SIMPLIFY lo invalida explícitamente (§7).
- **Justificación**: el flujo de consultoría implica varias sesiones sobre un mismo proyecto. Perder los rangos al cerrar la pestaña sería inaceptable. El usuario también dispone de Importar/Exportar JSON (S5) como respaldo.

### D-003 — Sin PapaParse
- **Decisión**: se omite la dependencia `papaparse`.
- **Justificación**: las tareas se introducen manualmente (§2 del brief). El export CSV del resultado (S5) se genera con un serializador propio (UTF-8 BOM, separador `;`, compatible con Excel ES).

### D-004 — CSS source = `src/style.css` (no `index.css`)
- **Decisión**: el fichero fuente importado por `main.jsx` se llama `style.css`, no `index.css` como en la plantilla del stack guide.
- **Justificación**: el brief y `do_it_always.md` piden explícitamente copiar `defalult_style.css` → `style.css`. La salida del build sigue siendo `estilos.css` (no afecta a la distribución).

### D-005 — Sin StatusBar lateral en S1
- **Decisión**: el layout se monta como dos columnas (`220px 1fr`) en S1, sin la columna derecha de StatusBar prevista en `standard_layout.md`.
- **Justificación**: el brief marca StatusBar como "opcional". Lo dejamos para S5 si sigue siendo necesario tras ver el flujo completo.

---

### D-006 — Drag-and-drop con HTML5 nativo
- **Decisión**: el reordenamiento de columnas en CLASIFICACIÓN usa los eventos nativos `dragstart`/`dragover`/`drop`, sin librerías externas (react-dnd, dnd-kit, etc.).
- **Justificación**: la operación es simple (reordenar una lista vertical) y la regla 11 del brief lo exige explícitamente. Mantiene el bundle pequeño.
- **Convención de orden**: top visual = mayor rango (`N-1`); bottom = rango `0`. El componente invierte el array antes de invocar `setOrdenEje` para que el índice del array coincida con el rango.

### D-007 — Rangos contiguos via recompactación
- **Decisión**: tras `eliminarTarea` y tras `cargarProyecto`, todos los rangos por eje se recompactan a `0..k-1`.
- **Justificación**: la fórmula `coord = rango/(N-1)` exige rangos contiguos. Sin recompactar, eliminar una tarea dejaría huecos y desplazaría la posición visual de todas las demás respecto al cubo.

### D-008 — CSV español-compatible
- **Decisión**: el export CSV usa separador `;`, BOM UTF-8 y decimales con coma (`0,4123`).
- **Justificación**: compatibilidad directa con Excel ES sin asistente de importación.

### D-010 — Carpeta de trabajo vía File System Access API (Sprint 6.1)
- **Decisión**: la persistencia canónica son ficheros JSON dentro de una carpeta elegida por el usuario. Selección con `window.showDirectoryPicker`, handle persistido en IndexedDB.
- **Fallback**: si el navegador no soporta FSA (`window.showDirectoryPicker` no existe) o el usuario no conecta carpeta, la app funciona con `localStorage` como scratch buffer. La exportación CSV queda deshabilitada con tooltip explicativo.
- **Restricción de contexto**: la FSA API exige contexto seguro (`https://` o `http://localhost`). Distribuir por `file://` sigue funcionando para el modo localStorage; para usar carpeta hay que servir por `npm run preview` o equivalente.
- **Autoguardado**: hook `useAutoguardado` se suscribe al store, hace debounce de 700 ms y escribe el fichero del proyecto activo. Estado del guardado visible en el sidebar (idle / guardando / guardado · HH:MM:SS / error).
- **Permisos**: tras recargar el navegador el handle existe en IDB pero el permiso puede caducar; la UI muestra "PENDIENTE" y un botón "Reconectar" que llama a `requestPermission`.
- **Renombrar/cambiar carpeta**: el botón "Cambiar" del sidebar invoca de nuevo `showDirectoryPicker` y limpia `proyectoActualFichero`. El estado de datos en RAM no se borra; el usuario lo guarda en la nueva carpeta creando proyecto.

### D-009 — Three.js `OrbitControls` vía `three/examples/jsm`
- **Decisión**: `import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"`. Verificado en dev y en build (`viteSingleFile` lo inlinea).
- **Implicación**: el bundle crece a ~700 kB (192 kB gzip). Aceptable para el caso de uso (consultoría) y la distribución (file://).
- **Reactividad al tema**: `MutationObserver` sobre `documentElement[data-theme]` actualiza los colores de líneas, flechas y cubo ideal. Los sprites de texto NO se regeneran en el cambio (evita parpadeo); su color se actualiza solo en próxima recarga. Si el contraste de etiquetas en tema claro queda pobre, regenerar sprites en el observer.

---

## 10. Próximas decisiones pendientes

- **Optimización 3D**: si N>500 tareas, considerar `InstancedMesh` para las esferas o memoizar `getCoordenadas` con un selector seleccionable.
- **StatusBar lateral**: ver D-005. No se ha justificado su necesidad durante el desarrollo; queda pendiente si aparece nueva funcionalidad lateral.
- **Sprites de texto en cambio de tema**: ver D-009. Pendiente decidir si regenerar o asumir el desfase hasta recarga.
