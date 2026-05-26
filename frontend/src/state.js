import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  soportaFSA,
  seleccionarCarpeta,
  cargarHandleGuardado,
  olvidarHandle,
  verificarPermiso,
  pedirPermiso,
  listarProyectos,
  leerProyecto,
  escribirProyecto,
  existeFichero,
  borrarFichero,
  slugFichero,
} from "./services/workspace";

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2, 11) + "-" + Date.now().toString(36);
}

function nowIso() {
  return new Date().toISOString();
}

function estadoVacio() {
  const ts = nowIso();
  return {
    version: "1.0",
    nombreProyecto: "Proyecto sin nombre",
    fechaCreacion: ts,
    fechaModificacion: ts,
    campos: [],
    tareas: [],
    configuracion: { topN: 5 },
  };
}

function workspaceVacio() {
  return {
    soportado: false,
    handle: null,
    nombreCarpeta: "",
    permiso: "unknown", // 'unknown' | 'granted' | 'prompt' | 'denied'
    proyectoActualFichero: null,
    proyectos: [],
    estadoGuardado: "idle", // 'idle' | 'guardando' | 'guardado' | 'error'
    ultimoErrorGuardado: null,
    ultimoGuardadoTs: null,
  };
}

const EJES = ["dificultad", "criticidad", "facilidad"];

// Recompacta los rangos de un eje: tareas ya clasificadas en ese eje
// reciben índices 0..k-1 según su rango actual. Tareas con rango null
// permanecen null.
function recompactarEje(tareas, eje) {
  const clasificadas = tareas
    .filter((t) => t.rangos[eje] != null)
    .sort((a, b) => a.rangos[eje] - b.rangos[eje])
    .map((t) => t.id);
  const idToRank = new Map(clasificadas.map((id, i) => [id, i]));
  return tareas.map((t) => ({
    ...t,
    rangos: {
      ...t.rangos,
      [eje]: idToRank.has(t.id) ? idToRank.get(t.id) : null,
    },
  }));
}

function recompactarTodos(tareas) {
  let out = tareas;
  for (const eje of EJES) out = recompactarEje(out, eje);
  return out;
}

function tareaVacia(nombre = "") {
  return {
    id: uuid(),
    nombre,
    campos: {},
    rangos: { dificultad: null, criticidad: null, facilidad: null },
  };
}

const useStore = create(
  persist(
    (set, get) => ({
      ...estadoVacio(),
      workspace: workspaceVacio(),

      // ── Proyecto ──────────────────────────────────────
      nuevoProyecto() {
        set({ ...estadoVacio() });
      },

      setNombreProyecto(nombre) {
        set({ nombreProyecto: nombre, fechaModificacion: nowIso() });
      },

      cargarProyecto(json) {
        // Validación mínima
        if (!json || typeof json !== "object") throw new Error("JSON inválido");
        if (json.version !== "1.0") throw new Error(`Versión no soportada: ${json.version}`);
        if (!Array.isArray(json.campos) || !Array.isArray(json.tareas)) {
          throw new Error("Estructura inválida: faltan campos o tareas");
        }
        // Saneamos cada tarea para asegurar la forma esperada
        const campos = json.campos.map((c) => ({
          id: c.id || uuid(),
          nombre: String(c.nombre ?? ""),
        }));
        const tareas = json.tareas.map((t) => ({
          id: t.id || uuid(),
          nombre: String(t.nombre ?? ""),
          campos: t.campos && typeof t.campos === "object" ? { ...t.campos } : {},
          rangos: {
            dificultad: t.rangos?.dificultad ?? null,
            criticidad: t.rangos?.criticidad ?? null,
            facilidad: t.rangos?.facilidad ?? null,
          },
        }));
        set({
          version: "1.0",
          nombreProyecto: String(json.nombreProyecto ?? "Proyecto sin nombre"),
          fechaCreacion: String(json.fechaCreacion ?? nowIso()),
          fechaModificacion: nowIso(),
          campos,
          tareas: recompactarTodos(tareas),
          configuracion: {
            topN: Number(json.configuracion?.topN) || 5,
          },
        });
      },

      exportarProyecto() {
        const s = get();
        return {
          version: "1.0",
          nombreProyecto: s.nombreProyecto,
          fechaCreacion: s.fechaCreacion,
          fechaModificacion: nowIso(),
          campos: s.campos,
          tareas: s.tareas,
          configuracion: s.configuracion,
        };
      },

      // ── Campos libres ─────────────────────────────────
      addCampo(nombre) {
        const id = uuid();
        set((s) => ({
          campos: [...s.campos, { id, nombre: String(nombre || "").trim() || "Nuevo campo" }],
          fechaModificacion: nowIso(),
        }));
        return id;
      },

      renombrarCampo(id, nombre) {
        set((s) => ({
          campos: s.campos.map((c) => (c.id === id ? { ...c, nombre: String(nombre) } : c)),
          fechaModificacion: nowIso(),
        }));
      },

      eliminarCampo(id) {
        set((s) => ({
          campos: s.campos.filter((c) => c.id !== id),
          // Borramos también el valor del campo en cada tarea
          tareas: s.tareas.map((t) => {
            if (!(id in t.campos)) return t;
            const next = { ...t.campos };
            delete next[id];
            return { ...t, campos: next };
          }),
          fechaModificacion: nowIso(),
        }));
      },

      // ── Tareas ────────────────────────────────────────
      addTarea(nombre = "") {
        const t = tareaVacia(String(nombre).trim());
        set((s) => ({
          tareas: [...s.tareas, t],
          fechaModificacion: nowIso(),
        }));
        return t.id;
      },

      editarNombreTarea(id, nombre) {
        set((s) => ({
          tareas: s.tareas.map((t) => (t.id === id ? { ...t, nombre: String(nombre) } : t)),
          fechaModificacion: nowIso(),
        }));
      },

      setCampoTarea(taskId, campoId, valor) {
        set((s) => ({
          tareas: s.tareas.map((t) =>
            t.id === taskId
              ? { ...t, campos: { ...t.campos, [campoId]: String(valor) } }
              : t
          ),
          fechaModificacion: nowIso(),
        }));
      },

      eliminarTarea(id) {
        set((s) => {
          const tareas = s.tareas.filter((t) => t.id !== id);
          return {
            tareas: recompactarTodos(tareas),
            fechaModificacion: nowIso(),
          };
        });
      },

      // ── Clasificación ─────────────────────────────────
      // Asigna rangos 0..arrayIds.length-1 a las tareas en arrayIds. Las tareas
      // no incluidas conservan su rango actual en este eje.
      setOrdenEje(eje, arrayIds) {
        if (!EJES.includes(eje)) throw new Error(`Eje desconocido: ${eje}`);
        set((s) => {
          const idToRank = new Map(arrayIds.map((id, i) => [id, i]));
          const tareas = s.tareas.map((t) => ({
            ...t,
            rangos: {
              ...t.rangos,
              [eje]: idToRank.has(t.id) ? idToRank.get(t.id) : t.rangos[eje],
            },
          }));
          return { tareas, fechaModificacion: nowIso() };
        });
      },

      // Acción destructiva: las tareas en classifiedIds reciben rangos 0..K-1.
      // CUALQUIER tarea no incluida tendrá rango = null en este eje.
      // Esto permite clasificar progresivamente arrastrando una a una y
      // también desclasificar moviendo una tarea fuera del conjunto.
      setOrdenEjeClasificadas(eje, classifiedIds) {
        if (!EJES.includes(eje)) throw new Error(`Eje desconocido: ${eje}`);
        set((s) => {
          const idToRank = new Map(classifiedIds.map((id, i) => [id, i]));
          const tareas = s.tareas.map((t) => ({
            ...t,
            rangos: {
              ...t.rangos,
              [eje]: idToRank.has(t.id) ? idToRank.get(t.id) : null,
            },
          }));
          return { tareas, fechaModificacion: nowIso() };
        });
      },

      // ── Configuración ─────────────────────────────────
      setTopN(n) {
        const v = Math.max(1, Math.min(1000, Math.floor(Number(n) || 1)));
        set((s) => ({
          configuracion: { ...s.configuracion, topN: v },
          fechaModificacion: nowIso(),
        }));
      },

      // ── Workspace (carpeta de trabajo) ────────────────
      async detectarWorkspace() {
        const soportado = soportaFSA();
        set((s) => ({ workspace: { ...s.workspace, soportado } }));
        if (!soportado) return;
        let handle;
        try {
          handle = await cargarHandleGuardado();
        } catch {
          handle = null;
        }
        if (!handle) return;
        const permiso = await verificarPermiso(handle);
        set((s) => ({
          workspace: { ...s.workspace, handle, nombreCarpeta: handle.name, permiso },
        }));
        if (permiso === "granted") {
          await get().refrescarProyectosCarpeta();
        }
      },

      async conectarCarpeta() {
        const handle = await seleccionarCarpeta();
        set((s) => ({
          workspace: {
            ...s.workspace,
            handle,
            nombreCarpeta: handle.name,
            permiso: "granted",
            proyectoActualFichero: null,
            estadoGuardado: "idle",
          },
        }));
        await get().refrescarProyectosCarpeta();
      },

      async reconectarPermiso() {
        const { workspace } = get();
        if (!workspace.handle) return;
        const p = await pedirPermiso(workspace.handle);
        set((s) => ({ workspace: { ...s.workspace, permiso: p } }));
        if (p === "granted") await get().refrescarProyectosCarpeta();
      },

      async desconectarCarpeta() {
        await olvidarHandle();
        set((s) => ({
          workspace: { ...workspaceVacio(), soportado: s.workspace.soportado },
        }));
      },

      async refrescarProyectosCarpeta() {
        const { workspace } = get();
        if (!workspace.handle || workspace.permiso !== "granted") return;
        try {
          const proyectos = await listarProyectos(workspace.handle);
          const ficheroActivo = workspace.proyectoActualFichero;
          const sigueExistiendo = ficheroActivo
            ? proyectos.some((p) => p.nombre === ficheroActivo)
            : true;
          set((s) => ({
            workspace: {
              ...s.workspace,
              proyectos,
              proyectoActualFichero: sigueExistiendo ? s.workspace.proyectoActualFichero : null,
              estadoGuardado: sigueExistiendo ? s.workspace.estadoGuardado : "idle",
            },
          }));
        } catch (e) {
          console.error("refrescarProyectosCarpeta:", e);
        }
      },

      async abrirProyectoDeCarpeta(nombreFichero) {
        const { workspace } = get();
        if (!workspace.handle) throw new Error("No hay carpeta de trabajo.");
        let json;
        try {
          json = await leerProyecto(workspace.handle, nombreFichero);
        } catch (e) {
          if (e?.name === "NotFoundError") {
            await get().refrescarProyectosCarpeta();
            throw new Error(`El fichero ${nombreFichero} ya no existe en la carpeta.`);
          }
          throw e;
        }
        get().cargarProyecto(json);
        set((s) => ({
          workspace: {
            ...s.workspace,
            proyectoActualFichero: nombreFichero,
            estadoGuardado: "guardado",
            ultimoGuardadoTs: Date.now(),
            ultimoErrorGuardado: null,
          },
        }));
      },

      async nuevoProyectoEnCarpeta(nombreProyecto) {
        const { workspace } = get();
        if (!workspace.handle) throw new Error("No hay carpeta de trabajo.");
        const slug = slugFichero(nombreProyecto);
        const ficheroDeseado = `${slug}.json`;
        let fichero = ficheroDeseado;
        let n = 1;
        while (await existeFichero(workspace.handle, fichero)) {
          n += 1;
          fichero = `${slug}_${n}.json`;
        }
        const huboConflicto = fichero !== ficheroDeseado;
        get().nuevoProyecto();
        get().setNombreProyecto(nombreProyecto || "Proyecto sin nombre");
        const datos = get().exportarProyecto();
        await escribirProyecto(workspace.handle, fichero, datos);
        set((s) => ({
          workspace: {
            ...s.workspace,
            proyectoActualFichero: fichero,
            estadoGuardado: "guardado",
            ultimoGuardadoTs: Date.now(),
            ultimoErrorGuardado: null,
          },
        }));
        await get().refrescarProyectosCarpeta();
        return { fichero, huboConflicto };
      },

      async renombrarFicheroActivo(nuevoNombreProyecto) {
        const { workspace } = get();
        if (!workspace.handle) throw new Error("No hay carpeta de trabajo.");
        if (!workspace.proyectoActualFichero) throw new Error("No hay fichero activo.");
        get().setNombreProyecto(nuevoNombreProyecto || "Proyecto sin nombre");
        const slug = slugFichero(nuevoNombreProyecto);
        const ficheroDeseado = `${slug}.json`;
        if (ficheroDeseado === workspace.proyectoActualFichero) {
          // Solo cambia el nombre lógico; el fichero ya coincide.
          await get().guardarProyectoActivo();
          return { fichero: ficheroDeseado, huboConflicto: false, renombrado: false };
        }
        let fichero = ficheroDeseado;
        let n = 1;
        while (await existeFichero(workspace.handle, fichero)) {
          n += 1;
          fichero = `${slug}_${n}.json`;
        }
        const huboConflicto = fichero !== ficheroDeseado;
        const datos = get().exportarProyecto();
        await escribirProyecto(workspace.handle, fichero, datos);
        const viejo = workspace.proyectoActualFichero;
        try {
          await borrarFichero(workspace.handle, viejo);
        } catch (e) {
          console.warn("No se pudo borrar el fichero viejo al renombrar:", e);
        }
        set((s) => ({
          workspace: {
            ...s.workspace,
            proyectoActualFichero: fichero,
            estadoGuardado: "guardado",
            ultimoGuardadoTs: Date.now(),
            ultimoErrorGuardado: null,
          },
        }));
        await get().refrescarProyectosCarpeta();
        return { fichero, huboConflicto, renombrado: true };
      },

      async guardarProyectoActivo() {
        const { workspace } = get();
        if (!workspace.handle || !workspace.proyectoActualFichero) return;
        if (workspace.permiso !== "granted") return;
        set((s) => ({ workspace: { ...s.workspace, estadoGuardado: "guardando" } }));
        try {
          const datos = get().exportarProyecto();
          await escribirProyecto(workspace.handle, workspace.proyectoActualFichero, datos);
          set((s) => ({
            workspace: {
              ...s.workspace,
              estadoGuardado: "guardado",
              ultimoGuardadoTs: Date.now(),
              ultimoErrorGuardado: null,
            },
          }));
        } catch (e) {
          console.error("guardarProyectoActivo:", e);
          set((s) => ({
            workspace: {
              ...s.workspace,
              estadoGuardado: "error",
              ultimoErrorGuardado: e.message || String(e),
            },
          }));
        }
      },

      async borrarProyectoDeCarpeta(nombreFichero) {
        const { workspace } = get();
        if (!workspace.handle) throw new Error("No hay carpeta de trabajo.");
        await borrarFichero(workspace.handle, nombreFichero);
        const esActual = workspace.proyectoActualFichero === nombreFichero;
        set((s) => ({
          workspace: {
            ...s.workspace,
            proyectoActualFichero: esActual ? null : s.workspace.proyectoActualFichero,
          },
        }));
        if (esActual) get().nuevoProyecto();
        await get().refrescarProyectosCarpeta();
      },

      // ── Derivados ─────────────────────────────────────
      getResumen() {
        const { tareas, campos, fechaModificacion, nombreProyecto } = get();
        const n = tareas.length;
        function pct(eje) {
          if (n === 0) return 0;
          const c = tareas.filter((t) => t.rangos?.[eje] != null).length;
          return Math.round((c / n) * 100);
        }
        return {
          nombreProyecto,
          nTareas: n,
          nCampos: campos.length,
          pctDificultad: pct("dificultad"),
          pctCriticidad: pct("criticidad"),
          pctFacilidad: pct("facilidad"),
          fechaModificacion,
        };
      },

      // Devuelve [{ id, numeral, nombre, x, y, z, distancia, dentroRegion, ... }]
      // Solo incluye tareas con los 3 rangos no nulos.
      // Coordenadas en [-0.5, 0.5] (ejes pasan por el origen).
      // Vértice ideal: (x = +0.5, y = -0.5, z = +0.5).
      getCoordenadas() {
        const { tareas, configuracion } = get();
        const numeralPorId = new Map(tareas.map((t, i) => [t.id, i + 1]));
        const completas = tareas.filter(
          (t) =>
            t.rangos.dificultad != null &&
            t.rangos.criticidad != null &&
            t.rangos.facilidad != null
        );
        const n = completas.length;
        const div = n > 1 ? n - 1 : 1; // si n=1 → coord = 0 (centro)
        const puntos = completas.map((t) => {
          const x = n > 1 ? t.rangos.dificultad / div - 0.5 : 0;
          const y = n > 1 ? t.rangos.criticidad / div - 0.5 : 0;
          const z = n > 1 ? t.rangos.facilidad / div - 0.5 : 0;
          // Distancia al vértice ideal (0.5, -0.5, 0.5). Equivalente numéricamente
          // a la fórmula previa con coords en [0,1]; sólo cambia el sistema visual.
          const dx = 0.5 - x;
          const dy = -0.5 - y;
          const dz = 0.5 - z;
          const distancia = Math.sqrt(dx * dx + dy * dy + dz * dz);
          return {
            id: t.id,
            numeral: numeralPorId.get(t.id),
            nombre: t.nombre,
            x, y, z,
            distancia,
            rangoDificultad: t.rangos.dificultad,
            rangoCriticidad: t.rangos.criticidad,
            rangoFacilidad: t.rangos.facilidad,
          };
        });
        // Top-N por distancia ascendente, desempate por mayor dificultad
        const ordenadas = [...puntos].sort((a, b) => {
          if (a.distancia !== b.distancia) return a.distancia - b.distancia;
          return b.rangoDificultad - a.rangoDificultad;
        });
        const topN = Math.min(configuracion.topN, ordenadas.length);
        const idsTop = new Set(ordenadas.slice(0, topN).map((p) => p.id));
        return puntos.map((p) => ({ ...p, dentroRegion: idsTop.has(p.id) }));
      },

      // Coordenadas para la vista 1D (paso CONSUMO TIEMPO).
      // Devuelve [{ id, numeral, nombre, x, rangoDificultad }] con x ∈ [-0.5, 0.5].
      // Solo incluye tareas con rangoDificultad no nulo.
      // Nota: el campo `dificultad` se mantiene en el modelo de datos por compatibilidad
      // con proyectos existentes. La UI lo presenta como "CONSUMO TIEMPO".
      getCoordenadas1D() {
        const { tareas } = get();
        const numeralPorId = new Map(tareas.map((t, i) => [t.id, i + 1]));
        const completas = tareas.filter((t) => t.rangos.dificultad != null);
        const n = completas.length;
        const div = n > 1 ? n - 1 : 1;
        return completas.map((t) => ({
          id: t.id,
          numeral: numeralPorId.get(t.id),
          nombre: t.nombre,
          x: n > 1 ? t.rangos.dificultad / div - 0.5 : 0,
          rangoDificultad: t.rangos.dificultad,
        }));
      },

      // Coordenadas 2D (paso CRITICIDAD). Devuelve tareas con CONSUMO TIEMPO y CRITICIDAD clasificadas.
      // Coords (x, y) ∈ [-0.5, 0.5]^2. Vértice ideal: (+0.5, -0.5).
      getCoordenadas2D() {
        const { tareas } = get();
        const numeralPorId = new Map(tareas.map((t, i) => [t.id, i + 1]));
        const completas = tareas.filter(
          (t) => t.rangos.dificultad != null && t.rangos.criticidad != null
        );
        const n = completas.length;
        const div = n > 1 ? n - 1 : 1;
        return completas.map((t) => ({
          id: t.id,
          numeral: numeralPorId.get(t.id),
          nombre: t.nombre,
          x: n > 1 ? t.rangos.dificultad / div - 0.5 : 0,
          y: n > 1 ? t.rangos.criticidad / div - 0.5 : 0,
          rangoDificultad: t.rangos.dificultad,
          rangoCriticidad: t.rangos.criticidad,
        }));
      },

      getRegionPrioritaria() {
        const coords = get().getCoordenadas();
        return coords
          .filter((p) => p.dentroRegion)
          .sort((a, b) => {
            if (a.distancia !== b.distancia) return a.distancia - b.distancia;
            return b.rangoDificultad - a.rangoDificultad;
          })
          .map((p, i) => ({ ...p, posicion: i + 1 }));
      },
    }),
    {
      name: "searchSimplifyProject",
      version: 1,
      partialize: (s) => ({
        version: s.version,
        nombreProyecto: s.nombreProyecto,
        fechaCreacion: s.fechaCreacion,
        fechaModificacion: s.fechaModificacion,
        campos: s.campos,
        tareas: s.tareas,
        configuracion: s.configuracion,
      }),
    }
  )
);

export { uuid, nowIso, EJES };
export default useStore;
