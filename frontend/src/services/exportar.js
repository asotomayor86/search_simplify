// Utilidades para serializar JSON y CSV.

export function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    "-" +
    p(d.getHours()) +
    p(d.getMinutes())
  );
}

export function slug(s) {
  return String(s || "proyecto")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "proyecto";
}

function escaparCSV(valor) {
  const s = valor == null ? "" : String(valor);
  if (/[";\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Construye el contenido CSV (con BOM UTF-8, separador `;`).
 */
export function construirCSV(filas) {
  if (!Array.isArray(filas) || filas.length === 0) {
    throw new Error("No hay datos para exportar.");
  }
  const cabeceras = Object.keys(filas[0]);
  const lineas = [
    cabeceras.map(escaparCSV).join(";"),
    ...filas.map((f) => cabeceras.map((k) => escaparCSV(f[k])).join(";")),
  ];
  const BOM = "﻿";
  return BOM + lineas.join("\r\n");
}

export function nombreCSV(nombreProyecto) {
  return `${slug(nombreProyecto)}_prioridades_${timestamp()}.csv`;
}

export function fmtNum(n) {
  if (n == null || isNaN(n)) return "";
  return String(n).replace(".", ",");
}
