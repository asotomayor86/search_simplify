import { useEffect, useRef } from "react";
import useStore from "../state";

// Campos del estado que activan autoguardado al cambiar.
const CAMPOS_PERSISTIBLES = ["nombreProyecto", "campos", "tareas", "configuracion"];

const DEBOUNCE_MS = 700;

export default function useAutoguardado() {
  const timer = useRef(null);

  useEffect(() => {
    const unsub = useStore.subscribe((estado, prev) => {
      const cambio = CAMPOS_PERSISTIBLES.some((k) => estado[k] !== prev[k]);
      if (!cambio) return;
      const ws = estado.workspace;
      if (!ws.handle || !ws.proyectoActualFichero || ws.permiso !== "granted") return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        useStore.getState().guardarProyectoActivo();
      }, DEBOUNCE_MS);
    });
    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
}
