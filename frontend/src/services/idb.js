// Wrapper mínimo de IndexedDB para persistir el FileSystemDirectoryHandle.
// Los handles NO son serializables a localStorage, sí a IDB (structured clone).

const DB_NAME = "searchSimplify";
const STORE = "workspace";
const VERSION = 1;

function abrir() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function txStore(modo) {
  const db = await abrir();
  return db.transaction(STORE, modo).objectStore(STORE);
}

export async function idbGet(key) {
  const s = await txStore("readonly");
  return new Promise((res, rej) => {
    const r = s.get(key);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function idbSet(key, value) {
  const s = await txStore("readwrite");
  return new Promise((res, rej) => {
    const r = s.put(value, key);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
}

export async function idbDel(key) {
  const s = await txStore("readwrite");
  return new Promise((res, rej) => {
    const r = s.delete(key);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
}
