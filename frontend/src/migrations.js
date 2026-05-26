// Migraciones one-shot que se ejecutan en el arranque, antes de inicializar el
// store de Zustand. Idempotentes: si la clave nueva ya existe, no hacen nada.

function migrarClave(viejo, nuevo) {
  try {
    if (typeof localStorage === "undefined") return;
    if (localStorage.getItem(nuevo) != null) return;
    const v = localStorage.getItem(viejo);
    if (v == null) return;
    localStorage.setItem(nuevo, v);
    localStorage.removeItem(viejo);
  } catch {}
}

// PrioMatrix3D → Search & Simplify (Sprint 6.1)
migrarClave("priomatrix3dProject", "searchSimplifyProject");
migrarClave("priomatrix3dTheme", "searchSimplifyTheme");
