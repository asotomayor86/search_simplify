// Workspace: gestión de la carpeta de trabajo vía File System Access API.
// Requiere contexto seguro (http://localhost o https://). NO funciona con file://.

import { idbDel, idbGet, idbSet } from "./idb";

const KEY_HANDLE = "directoryHandle";

export function soportaFSA() {
  return (
    typeof window !== "undefined" &&
    typeof window.showDirectoryPicker === "function"
  );
}

export async function seleccionarCarpeta() {
  if (!soportaFSA()) {
    throw new Error("Tu navegador no soporta la selección de carpetas (File System Access API).");
  }
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  await idbSet(KEY_HANDLE, handle);
  return handle;
}

export async function cargarHandleGuardado() {
  try {
    return await idbGet(KEY_HANDLE);
  } catch {
    return null;
  }
}

export async function olvidarHandle() {
  try {
    await idbDel(KEY_HANDLE);
  } catch {}
}

export async function verificarPermiso(handle) {
  if (!handle?.queryPermission) return "denied";
  try {
    return await handle.queryPermission({ mode: "readwrite" });
  } catch {
    return "denied";
  }
}

export async function pedirPermiso(handle) {
  if (!handle?.requestPermission) {
    throw new Error("Permiso no disponible en este navegador.");
  }
  return await handle.requestPermission({ mode: "readwrite" });
}

export async function listarProyectos(handle) {
  const items = [];
  for await (const [nombre, h] of handle.entries()) {
    if (h.kind !== "file") continue;
    if (!nombre.toLowerCase().endsWith(".json")) continue;
    let file;
    try {
      file = await h.getFile();
    } catch {
      continue;
    }
    items.push({ nombre, size: file.size, modificado: file.lastModified });
  }
  items.sort((a, b) => b.modificado - a.modificado);
  return items;
}

export async function leerProyecto(handle, nombreFichero) {
  const fh = await handle.getFileHandle(nombreFichero);
  const file = await fh.getFile();
  const txt = await file.text();
  return JSON.parse(txt);
}

export async function escribirProyecto(handle, nombreFichero, datos) {
  const fh = await handle.getFileHandle(nombreFichero, { create: true });
  const w = await fh.createWritable();
  try {
    await w.write(JSON.stringify(datos, null, 2));
  } finally {
    await w.close();
  }
}

export async function existeFichero(handle, nombreFichero) {
  try {
    await handle.getFileHandle(nombreFichero);
    return true;
  } catch {
    return false;
  }
}

export async function borrarFichero(handle, nombreFichero) {
  if (!handle.removeEntry) {
    throw new Error("Borrado no soportado por el navegador.");
  }
  await handle.removeEntry(nombreFichero);
}

export async function escribirCSV(handle, nombreFichero, contenidoConBOM) {
  const fh = await handle.getFileHandle(nombreFichero, { create: true });
  const w = await fh.createWritable();
  try {
    const blob = new Blob([contenidoConBOM], { type: "text/csv;charset=utf-8" });
    await w.write(blob);
  } finally {
    await w.close();
  }
}

// Slug seguro para nombre de fichero (sin extensión)
export function slugFichero(nombre) {
  return String(nombre || "proyecto")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "proyecto";
}
