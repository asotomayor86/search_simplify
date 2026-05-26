# Do It Always — Instrucciones permanentes para Claude Code

Estas reglas se aplican **siempre**, en cada nuevo paso de sprint y en cada sesión de trabajo sobre el proyecto. No requieren recordatorio por parte del usuario.

---

## 1. Respetar las referencias de layout y estilo

Antes de construir o modificar cualquier elemento del layout, **consulta obligatoriamente** los siguientes archivos ubicados en la carpeta `references/` del proyecto:

- `references/standard_layout.md` — directrices de estructura y layout.
- `references/desing_references.md` — referencias de diseño y estilo visual.

Toda decisión sobre maquetación, jerarquía visual, espaciados, tipografía, componentes y patrones de UI debe ser coherente con lo definido en esos documentos. Si detectas un conflicto entre lo solicitado y las referencias, señálalo antes de implementar.

---

## 2. Inicialización de estilos al comenzar un proyecto

Al inicio de **cada proyecto nuevo**:

1. Localiza el archivo `default_style.css`.
2. Haz una **copia** del mismo y colócala junto al archivo principal del proyecto.
3. Nombra la copia exactamente `style.css`.
4. A partir de ese momento, todas las modificaciones de estilo se realizan sobre `style.css`. **Nunca** se edita `default_style.css`.

---

## 3. Mantener un backlog vivo

Crea y mantén actualizado un archivo `backlog.md` dentro de una carpeta llamada `history/` en la raíz del proyecto:

- Ruta: `history/backlog.md`.
- Si la carpeta `history/` no existe, créala.
- Registra en el backlog: tareas pendientes, tareas en curso, tareas completadas (con fecha), ideas pospuestas y bugs conocidos.
- **Actualízalo al final de cada paso de sprint**, sin esperar a que se solicite.

---

## 4. Documentar la arquitectura

Crea y mantén actualizado un archivo `architecture.md` que sirva de contexto para sesiones futuras. Este documento es la **memoria persistente** del proyecto.

Debe reflejar:

- Estructura general del desarrollo (módulos, carpetas, componentes principales).
- Stack tecnológico y dependencias relevantes.
- Decisiones de arquitectura importantes y su justificación.
- Convenciones y patrones adoptados.
- Puntos de integración y flujos de datos clave.

**Actualízalo cada vez que se tome una decisión arquitectónica relevante o se introduzca un cambio estructural**, sin esperar a que se solicite.

---

## Resumen operativo por sprint

En cada nuevo paso de sprint, Claude Code debe:

1. Revisar `references/standard_layout.md` y `references/desing_references.md` antes de tocar layout.
2. Verificar que `style.css` existe (si es proyecto nuevo, generarlo desde `default_style.css`).
3. Actualizar `history/backlog.md` al cerrar el paso.
4. Actualizar `architecture.md` si hubo decisiones o cambios estructurales.
