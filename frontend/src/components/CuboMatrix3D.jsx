import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function cssVar(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function leerColores() {
  return {
    border:    cssVar("--border",         "#153050"),
    accent:    cssVar("--accent",         "#009ee1"),
    success:   cssVar("--success",        "#10b981"),
    muted:     cssVar("--text-muted",     "#466a84"),
    primary:   cssVar("--text-primary",   "#ddeef8"),
    secondary: cssVar("--text-secondary", "#7aafc9"),
  };
}

function makeLabelSprite(text, color, opcs = {}) {
  const { fontSize = 56, weight = 700, escala = 0.0025 } = opcs;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = `${weight} ${fontSize}px JetBrains Mono, monospace`;
  const w = Math.ceil(ctx.measureText(text).width);
  canvas.width = Math.max(64, w + 24);
  canvas.height = Math.ceil(fontSize * 1.4);
  ctx.font = `${weight} ${fontSize}px JetBrains Mono, monospace`;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 12, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(canvas.width * escala, canvas.height * escala, 1);
  sprite.userData.dispose = () => { tex.dispose(); mat.dispose(); };
  return sprite;
}

function makeAxisLine(p0, p1, color) {
  const geom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...p0),
    new THREE.Vector3(...p1),
  ]);
  const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 1 });
  const line = new THREE.Line(geom, mat);
  line.userData.dispose = () => { geom.dispose(); mat.dispose(); };
  return line;
}

// Posiciones de cámara por modo
const CAM_POSES = {
  "1d": { pos: new THREE.Vector3(0, 0, 2.4), look: new THREE.Vector3(0, 0, 0) },
  "2d": { pos: new THREE.Vector3(0, 0, 2.4), look: new THREE.Vector3(0, 0, 0) },
  "3d": { pos: new THREE.Vector3(2.3, 0.9, 1.7), look: new THREE.Vector3(0, 0, 0) },
};

// Para una etiqueta numeral, devuelve un offset 3D según el modo, así no se
// solapa con la esfera. En 2D y 3D, hacia +Y; en 1D, también hacia +Y (arriba).
function offsetLabel(modo) {
  if (modo === "3d") return new THREE.Vector3(0, 0.07, 0);
  return new THREE.Vector3(0, 0.08, 0);
}

// ── Componente ────────────────────────────────────────────────────────────────

const CuboMatrix3D = forwardRef(function CuboMatrix3D(
  { puntos, mostrarNombres = false, modo = "3d" },
  ref
) {
  const mountRef = useRef(null);
  const ctxRef = useRef(null);
  const modoRef = useRef(modo);
  const [tooltip, setTooltip] = useState(null);

  useImperativeHandle(ref, () => ({
    resetCamara() {
      const c = ctxRef.current;
      if (!c) return;
      const pose = CAM_POSES[modoRef.current] || CAM_POSES["3d"];
      c.camTargetPos.copy(pose.pos);
      c.camTargetLook.copy(pose.look);
      c.transicionando = true;
    },
  }));

  // ── Setup único ────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const colores = leerColores();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    const inicio = CAM_POSES[modo] || CAM_POSES["3d"];
    camera.position.copy(inicio.pos);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.cursor = "grab";

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(inicio.look);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.0;
    controls.maxDistance = 5;
    controls.enabled = modo === "3d";
    controls.update();

    // ── Cubo wireframe externo ─────────────────────────
    const cubeGeom = new THREE.BoxGeometry(1, 1, 1);
    const edges = new THREE.EdgesGeometry(cubeGeom);
    const cubeMat = new THREE.LineBasicMaterial({ color: new THREE.Color(colores.border), transparent: true, opacity: 0 });
    const cubeLines = new THREE.LineSegments(edges, cubeMat);
    cubeLines.position.set(0, 0, 0);
    scene.add(cubeLines);

    // ── Ejes (3 líneas por el origen) ──────────────────
    const ejeLen = 0.62;
    const axisX = makeAxisLine([-ejeLen, 0, 0], [ejeLen, 0, 0], colores.accent);
    const axisY = makeAxisLine([0, -ejeLen, 0], [0, ejeLen, 0], colores.accent);
    const axisZ = makeAxisLine([0, 0, -ejeLen], [0, 0, ejeLen], colores.accent);
    axisX.material.opacity = 1;
    axisY.material.opacity = 0;
    axisZ.material.opacity = 0;
    scene.add(axisX, axisY, axisZ);

    // ── Etiquetas de eje ───────────────────────────────
    const AX = { fontSize: 32, escala: 0.0011 };
    const labelDifPos  = makeLabelSprite("+ CONSUMO",      colores.primary, AX);
    labelDifPos.position.set( 0.78, 0, 0);
    const labelDifNeg  = makeLabelSprite("−",              colores.muted,   AX);
    labelDifNeg.position.set(-0.65, 0, 0);

    const labelCritPos = makeLabelSprite("+ CRITICIDAD",   colores.primary, AX);
    labelCritPos.position.set(0, 0.72, 0);
    const labelCritNeg = makeLabelSprite("−",              colores.muted,   AX);
    labelCritNeg.position.set(0, -0.65, 0);

    const labelFacPos  = makeLabelSprite("+ FACILIDAD",    colores.primary, AX);
    labelFacPos.position.set(0, 0, 0.78);
    const labelFacNeg  = makeLabelSprite("−",              colores.muted,   AX);
    labelFacNeg.position.set(0, 0, -0.65);
    labelDifPos.material.opacity = 1; labelDifNeg.material.opacity = 1;
    labelCritPos.material.opacity = 0; labelCritNeg.material.opacity = 0;
    labelFacPos.material.opacity = 0;  labelFacNeg.material.opacity = 0;
    scene.add(labelDifPos, labelDifNeg, labelCritPos, labelCritNeg, labelFacPos, labelFacNeg);

    // ── Marco 2D (cuadrado outline en plano XY, mismo color del cubo) ──
    // Visible en 1D y 2D, invisible en 3D (donde el cubo wireframe toma el relevo).
    const marcoGeom = new THREE.PlaneGeometry(1, 1);
    const marcoEdges = new THREE.EdgesGeometry(marcoGeom);
    const marcoMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(colores.border),
      transparent: true,
      opacity: 0.85,
    });
    const marco2D = new THREE.LineSegments(marcoEdges, marcoMat);
    marco2D.position.set(0, 0, 0);
    scene.add(marco2D);

    // ── Vértice ideal 2D (cuadrado plano en XY) ──────
    const ideal2DGeom = new THREE.PlaneGeometry(0.07, 0.07);
    const ideal2DEdges = new THREE.EdgesGeometry(ideal2DGeom);
    const ideal2DMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(colores.accent),
      transparent: true,
      opacity: 0,
    });
    const ideal2D = new THREE.LineSegments(ideal2DEdges, ideal2DMat);
    ideal2D.position.set(0.5, -0.5, 0);
    scene.add(ideal2D);

    // ── Vértice ideal 3D (cubo wireframe) ──
    const idealGeom = new THREE.BoxGeometry(0.07, 0.07, 0.07);
    const idealEdges = new THREE.EdgesGeometry(idealGeom);
    const idealMat = new THREE.LineBasicMaterial({ color: new THREE.Color(colores.accent), transparent: true, opacity: 0 });
    const idealCube = new THREE.LineSegments(idealEdges, idealMat);
    idealCube.position.set(0.5, -0.5, 0.5);
    scene.add(idealCube);

    // Etiqueta IDEAL — su posición y opacidad cambian con el modo
    const idealLabel = makeLabelSprite("IDEAL", colores.accent, AX);
    idealLabel.position.set(0.5, -0.6, 0);
    idealLabel.material.opacity = 0;
    scene.add(idealLabel);

    // ── Grupos dinámicos ───────────────────────────────
    const spheresGroup = new THREE.Group();
    const labelsGroup = new THREE.Group();
    const sphereById = new Map(); // id -> mesh
    const labelById = new Map();  // id -> sprite
    scene.add(spheresGroup, labelsGroup);

    // ── Resize ─────────────────────────────────────────
    function onResize() {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);
    onResize();

    // ── Raycaster + tooltip ────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function onPointerMove(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      const lx = e.clientX - rect.left;
      const ly = e.clientY - rect.top;
      pointer.x = (lx / rect.width) * 2 - 1;
      pointer.y = -(ly / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(spheresGroup.children, false);
      if (hits.length > 0) {
        setTooltip({ x: lx, y: ly, data: hits[0].object.userData.datos });
        renderer.domElement.style.cursor = "pointer";
      } else {
        setTooltip(null);
        renderer.domElement.style.cursor = modoRef.current === "3d" ? "grab" : "default";
      }
    }
    function onPointerLeave() { setTooltip(null); }
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

    // ── Loop con interpolaciones (lerp) ────────────────
    const ctx = {
      scene, camera, renderer, controls,
      spheresGroup, labelsGroup, sphereById, labelById,
      cubeLines, marco2D, ideal2D, idealCube, idealLabel,
      axes: [axisX, axisY, axisZ],
      axisLabels: { difPos: labelDifPos, difNeg: labelDifNeg, critPos: labelCritPos, critNeg: labelCritNeg, facPos: labelFacPos, facNeg: labelFacNeg },
      colores,
      // Targets de transición
      camTargetPos: inicio.pos.clone(),
      camTargetLook: inicio.look.clone(),
      transicionando: false,
      // Lista de objetos cuya opacidad se anima
      fadeables: [],
    };
    // Registrar fadeables
    ctx.fadeables.push(
      cubeLines, axisY, axisZ, marco2D,
      labelCritPos, labelCritNeg, labelFacPos, labelFacNeg,
      ideal2D, idealCube, idealLabel
    );
    ctxRef.current = ctx;

    let rafId;
    function loop() {
      // ─ Cámara: lerp si está transicionando ─
      if (ctx.transicionando) {
        camera.position.lerp(ctx.camTargetPos, 0.08);
        controls.target.lerp(ctx.camTargetLook, 0.08);
        camera.lookAt(controls.target);
        const dist = camera.position.distanceTo(ctx.camTargetPos);
        if (dist < 0.01) {
          camera.position.copy(ctx.camTargetPos);
          controls.target.copy(ctx.camTargetLook);
          ctx.transicionando = false;
          controls.enabled = modoRef.current === "3d";
        }
      }
      if (controls.enabled) controls.update();

      // ─ Esferas y labels: lerp hacia su targetPos ─
      for (const mesh of spheresGroup.children) {
        const t = mesh.userData.targetPos;
        if (t) mesh.position.lerp(t, 0.14);
      }
      for (const sprite of labelsGroup.children) {
        const t = sprite.userData.targetPos;
        if (t) sprite.position.lerp(t, 0.14);
      }

      // ─ Etiqueta IDEAL: lerp posición (entre 2D z=0 y 3D z=0.5) ─
      const idealLT = ctx.idealLabel.userData.targetPos;
      if (idealLT) {
        ctx.idealLabel.position.lerp(idealLT, 0.1);
      }

      // ─ Opacidad: lerp hacia targetOpacity ─
      for (const obj of ctx.fadeables) {
        const target = obj.userData.targetOpacity ?? 1;
        if (obj.material) {
          const cur = obj.material.opacity;
          if (Math.abs(cur - target) > 0.005) {
            obj.material.opacity = cur + (target - cur) * 0.12;
          } else {
            obj.material.opacity = target;
          }
          obj.visible = obj.material.opacity > 0.01;
        }
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(loop);
    }
    loop();

    // ── Observer de tema ───────────────────────────────
    const themeObs = new MutationObserver(() => {
      const c = ctxRef.current;
      if (!c) return;
      const col = leerColores();
      c.colores = col;
      c.cubeLines.material.color.set(col.border);
      c.marco2D.material.color.set(col.border);
      c.ideal2D.material.color.set(col.accent);
      c.idealCube.material.color.set(col.accent);
      c.axes.forEach((l) => l.material.color.set(col.accent));
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      themeObs.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      controls.dispose();
      cubeGeom.dispose(); edges.dispose(); cubeMat.dispose();
      idealGeom.dispose(); idealEdges.dispose(); idealMat.dispose();
      ideal2DGeom.dispose(); ideal2DEdges.dispose(); ideal2DMat.dispose();
      marcoGeom.dispose(); marcoEdges.dispose(); marcoMat.dispose();
      idealLabel.userData.dispose?.();
      [axisX, axisY, axisZ].forEach((l) => l.userData.dispose?.());
      Object.values(ctx.axisLabels).forEach((s) => s.userData.dispose?.());
      spheresGroup.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      labelsGroup.children.forEach((s) => s.userData.dispose?.());
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      ctxRef.current = null;
    };
  }, []);

  // ── Cambio de modo: actualiza targets de cámara y opacidades ──
  useEffect(() => {
    const c = ctxRef.current;
    if (!c) return;
    modoRef.current = modo;

    // Cámara: nuevo destino
    const pose = CAM_POSES[modo] || CAM_POSES["3d"];
    c.camTargetPos.copy(pose.pos);
    c.camTargetLook.copy(pose.look);
    c.transicionando = true;
    c.controls.enabled = false;

    // Opacidades
    const t = (vis) => (vis ? 1 : 0);
    const enXY = modo === "2d" || modo === "3d";
    const en1D2D = modo === "1d" || modo === "2d";
    const en3D = modo === "3d";
    const en2D = modo === "2d";

    c.axes[1].userData.targetOpacity = t(enXY); // Y
    c.axes[2].userData.targetOpacity = t(en3D); // Z

    c.axisLabels.critPos.userData.targetOpacity = t(enXY);
    c.axisLabels.critNeg.userData.targetOpacity = t(enXY);
    c.axisLabels.facPos.userData.targetOpacity = t(en3D);
    c.axisLabels.facNeg.userData.targetOpacity = t(en3D);

    c.cubeLines.userData.targetOpacity = en3D ? 0.85 : 0;
    c.marco2D.userData.targetOpacity = en1D2D ? 0.85 : 0;
    c.ideal2D.userData.targetOpacity = en2D ? 1 : 0;
    c.idealCube.userData.targetOpacity = en3D ? 1 : 0;
    c.idealLabel.userData.targetOpacity = enXY ? 1 : 0;

    // Posición del label IDEAL: en 2D z=0; en 3D z=0.5
    c.idealLabel.userData.targetPos = new THREE.Vector3(0.5, -0.6, en3D ? 0.5 : 0);

    // Cursor por defecto cuando no se está sobre una esfera
    if (c.renderer?.domElement) {
      c.renderer.domElement.style.cursor = modo === "3d" ? "grab" : "default";
    }
  }, [modo]);

  // ── Diff por id de las esferas (mantiene continuidad visual) ──
  useEffect(() => {
    const c = ctxRef.current;
    if (!c) return;
    const { spheresGroup, labelsGroup, sphereById, labelById, colores } = c;

    // Mismo radio para todas las esferas; el top-N se distingue solo por color.
    const RADIO = 0.025;
    const idsNuevos = new Set(puntos.map((p) => p.id));

    // Eliminar esferas y labels cuya id ya no está
    for (const [id, mesh] of [...sphereById.entries()]) {
      if (!idsNuevos.has(id)) {
        mesh.geometry?.dispose();
        mesh.material?.dispose();
        spheresGroup.remove(mesh);
        sphereById.delete(id);
      }
    }
    for (const [id, sprite] of [...labelById.entries()]) {
      if (!idsNuevos.has(id)) {
        sprite.userData.dispose?.();
        labelsGroup.remove(sprite);
        labelById.delete(id);
      }
    }

    const ofs = offsetLabel(modoRef.current);

    for (const p of puntos) {
      const isTop = !!p.dentroRegion;
      let mesh = sphereById.get(p.id);
      if (!mesh) {
        const geom = new THREE.SphereGeometry(RADIO, 18, 14);
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(isTop ? colores.success : colores.accent),
          transparent: true,
          opacity: 1,
        });
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(p.x, p.y, p.z);
        spheresGroup.add(mesh);
        sphereById.set(p.id, mesh);
      } else {
        // Mantiene la geometría; solo se actualiza el color.
        mesh.material.color.set(isTop ? colores.success : colores.accent);
      }
      mesh.userData.targetPos = new THREE.Vector3(p.x, p.y, p.z);
      mesh.userData.datos = p;

      // Label sprite
      const textoEsperado = mostrarNombres ? (p.nombre.trim() || `#${p.numeral}`) : `#${p.numeral}`;
      let sprite = labelById.get(p.id);
      const textoActual = sprite?.userData.texto;
      const colorEsperado = isTop ? colores.success : colores.secondary;
      if (!sprite || textoActual !== textoEsperado) {
        if (sprite) {
          sprite.userData.dispose?.();
          labelsGroup.remove(sprite);
        }
        sprite = makeLabelSprite(textoEsperado, colorEsperado, { fontSize: 36, escala: 0.0013 });
        sprite.userData.texto = textoEsperado;
        sprite.position.set(p.x + ofs.x, p.y + ofs.y, p.z + ofs.z);
        labelsGroup.add(sprite);
        labelById.set(p.id, sprite);
      }
      sprite.userData.targetPos = new THREE.Vector3(p.x + ofs.x, p.y + ofs.y, p.z + ofs.z);
    }
  }, [puntos, mostrarNombres]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            background: "var(--bg-surface)",
            border: `1px solid ${tooltip.data?.dentroRegion ? "rgba(16,185,129,0.4)" : "var(--border)"}`,
            borderRadius: "var(--radius)",
            padding: "8px 10px",
            fontSize: 12,
            color: "var(--text-primary)",
            pointerEvents: "none",
            boxShadow: "var(--shadow)",
            maxWidth: 280,
            zIndex: 10,
          }}
        >
          <div style={{
            fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12,
            color: tooltip.data?.dentroRegion ? "var(--success)" : "var(--text-primary)",
            marginBottom: 4,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            #{tooltip.data.numeral} · {tooltip.data.nombre.trim() || "(sin nombre)"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "2px 10px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            <span>cons</span><span>#{tooltip.data.rangoDificultad + 1}</span>
            {tooltip.data.rangoCriticidad != null && <><span>crit</span><span>#{tooltip.data.rangoCriticidad + 1}</span></>}
            {tooltip.data.rangoFacilidad != null && <><span>fac</span><span>#{tooltip.data.rangoFacilidad + 1}</span></>}
            {tooltip.data.distancia != null && tooltip.data.distancia > 0 && <><span>d</span><span>{tooltip.data.distancia.toFixed(3).replace(".", ",")}</span></>}
          </div>
        </div>
      )}
    </div>
  );
});

export default CuboMatrix3D;
