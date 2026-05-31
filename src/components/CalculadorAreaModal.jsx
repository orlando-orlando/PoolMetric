import { useRef, useState, useEffect, useCallback } from "react";
import "../estilos.css";

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/* =====================================================
   EDGE DETECTION — Canny simplificado sobre ImageData
   Retorna { edges: Uint8Array, magnitude: Float32Array }
   edges: 0 o 255 según si es borde
   magnitude: valor continuo del gradiente (para sub-pixel)
===================================================== */
function detectEdges(imageData, umbral = 30) {
  const { data, width, height } = imageData;

  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }

  // Blur gaussiano 3×3
  const blurred = new Float32Array(width * height);
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, wsum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const nx = x + kx, ny = y + ky;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const w = kernel[(ky + 1) * 3 + (kx + 1)];
            sum += gray[ny * width + nx] * w;
            wsum += w;
          }
        }
      }
      blurred[y * width + x] = sum / wsum;
    }
  }

  // Sobel — guardamos magnitud y ángulo
  const edges     = new Uint8Array(width * height);
  const magnitude = new Float32Array(width * height);
  const angle     = new Float32Array(width * height); // radianes

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const gx =
        -blurred[(y-1)*width+(x-1)] + blurred[(y-1)*width+(x+1)]
        -2*blurred[y*width+(x-1)]   + 2*blurred[y*width+(x+1)]
        -blurred[(y+1)*width+(x-1)] + blurred[(y+1)*width+(x+1)];
      const gy =
        -blurred[(y-1)*width+(x-1)] - 2*blurred[(y-1)*width+x] - blurred[(y-1)*width+(x+1)]
        +blurred[(y+1)*width+(x-1)] + 2*blurred[(y+1)*width+x] + blurred[(y+1)*width+(x+1)];
      const mag = Math.sqrt(gx*gx + gy*gy);
      magnitude[y*width+x] = mag;
      angle[y*width+x]     = Math.atan2(gy, gx);
      edges[y*width+x]     = mag > umbral ? 255 : 0;
    }
  }

  return { edges, magnitude, angle, width, height };
}

/* =====================================================
   NEAREST EDGE con información de normal
   Retorna { x, y, normalAngle } o null
   normalAngle: dirección perpendicular al borde (para offset interior/exterior)
===================================================== */
function nearestEdge(edgeData, wx, wy, radio) {
  const { edges, angle, width, height } = edgeData;
  const cx = Math.round(wx), cy = Math.round(wy);
  const r  = Math.ceil(radio);
  let bestDist = Infinity, best = null;

  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (edges[ny * width + nx] !== 255) continue;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < bestDist) {
        bestDist = d;
        best = { x: nx, y: ny, normalAngle: angle[ny * width + nx] };
      }
    }
  }
  return best;
}

/* =====================================================
   BOUNDING BOX orientado (mínimo rectángulo que envuelve
   el polígono) — para mostrar ancho × alto estimados
===================================================== */
function boundingBoxPoligono(pts) {
  if (pts.length < 2) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  pts.forEach(p => {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  });
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

/* =====================================================
   ÁREA de polígono (Shoelace)
===================================================== */
function areaPoligono(pts) {
  if (pts.length < 3) return 0;
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

/* =====================================================
   COMPONENTE PRINCIPAL
===================================================== */
const CalculadorAreaModal = ({ open, onClose, onConfirm }) => {
  const canvasRef  = useRef(null);
  const imgRef     = useRef(null);
  const edgeDataRef= useRef(null); // { edges, magnitude, angle, width, height }

  const [visible, setVisible]     = useState(open);
  const [imagen, setImagen]       = useState(null);
  const [cerrando, setCerrando]   = useState(false);
  const [cargando, setCargando]   = useState(false);
  const [dragActivo, setDragActivo] = useState(false);

  // Polígono
  const [puntos, setPuntos]               = useState([]);
  const [poligonoCerrado, setPoligonoCerrado] = useState(false);

  // Escala
  const [modoEscala, setModoEscala]       = useState(false);
  const [puntosEscala, setPuntosEscala]   = useState([]);
  const [distanciaReal, setDistanciaReal] = useState("");
  const [escala, setEscala]               = useState(null); // metros/pixel
  const [escalaConfianza, setEscalaConfianza] = useState(null);
  const [escalaPixeles, setEscalaPixeles] = useState(null); // longitud en px de la línea de escala

  // Snap
  const SNAP_RADIO_PANTALLA = 22; // px de pantalla
  const [snapPoint, setSnapPoint]   = useState(null);
  const [snapActivo, setSnapActivo] = useState(false);
  const [cursorMundo, setCursorMundo] = useState(null);

  // Offset de snap: cuántos píxeles de imagen desplazar en dirección normal al borde
  // 0 = centro del trazo (borde detectado), positivo = exterior, negativo = interior
  const [snapOffset, setSnapOffset] = useState(0);

  // Indicador distancia tiempo real
  const [distPx, setDistPx] = useState(null);
  const [distM, setDistM]   = useState(null);

  // Validación cruzada
  const [validacion, setValidacion] = useState(null);
  // { wPx, hPx, wM, hM, areaM, areaRef }
  // areaRef = wM * hM (si polígono es aprox. rectangular)

  // Vista
  const [zoom, setZoom]             = useState(1);
  const [pan, setPan]               = useState({ x: 0, y: 0 });
  const [modoZoom, setModoZoom]     = useState(false);
  const [zoomInicio, setZoomInicio] = useState(null);
  const [zoomRect, setZoomRect]     = useState(null);
  const panStart                    = useRef({ x: 0, y: 0 });
  const mouseDownRef                = useRef(false);
  const spaceDownRef                = useRef(false);
  const justZoomedRef               = useRef(false);
  const [dragIndex, setDragIndex]   = useState(null);

  const MIN_ZOOM = 0.3, MAX_ZOOM = 8;
  const SNAP_DIST_CERRAR = 12; // px pantalla para cerrar polígono

  /* ─── Ciclo de vida ─── */
  useEffect(() => { if (open) { setVisible(true); setCerrando(false); } }, [open]);
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === "Escape") cerrarModal(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  if (!visible) return null;

  /* ─── Wheel zoom ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagen) return;
    const wheel = (e) => {
      e.preventDefault();
      setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + (e.deltaY < 0 ? 0.15 : -0.15))));
    };
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => canvas.removeEventListener("wheel", wheel);
  }, [imagen]);

  /* ─── Teclas ─── */
  useEffect(() => {
    if (!open) return;
    const down = (e) => {
      if (e.code === "Space") { e.preventDefault(); spaceDownRef.current = true; if (canvasRef.current) canvasRef.current.style.cursor = "grab"; }
      if (e.key.toLowerCase() === "z" && !modoZoom) { setModoZoom(true); setZoomInicio(null); setZoomRect(null); }
      if (e.key.toLowerCase() === "a") resetVista();
    };
    const up = (e) => {
      if (e.code === "Space") { spaceDownRef.current = false; if (canvasRef.current) canvasRef.current.style.cursor = "crosshair"; }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [open, modoZoom]);

  /* ─── Cargar imagen + detectar bordes ─── */
  useEffect(() => {
    if (!imagen) return;
    const canvas = canvasRef.current;
    const img    = new Image();
    img.src      = imagen;
    img.onload   = () => {
      canvas.width  = img.width;
      canvas.height = img.height;
      imgRef.current = img;

      const off  = document.createElement("canvas");
      off.width  = img.width; off.height = img.height;
      const octx = off.getContext("2d");
      octx.drawImage(img, 0, 0);
      const imageData = octx.getImageData(0, 0, img.width, img.height);
      const umbral    = Math.max(20, Math.min(55, img.width / 90));
      edgeDataRef.current = detectEdges(imageData, umbral);
      dibujar();
    };
  }, [imagen]);

  /* ─── Redibujar ─── */
  useEffect(() => { if (imgRef.current) dibujar(); },
    [puntos, puntosEscala, zoom, pan, modoZoom, zoomRect, snapPoint, snapActivo, cursorMundo, poligonoCerrado]);

  /* ─── Validación cruzada ─── */
  useEffect(() => {
    if (!escala || puntos.length < 3) { setValidacion(null); return; }
    const bb   = boundingBoxPoligono(puntos);
    const areaM = areaPoligono(puntos) * escala * escala;
    const wM   = bb.w * escala;
    const hM   = bb.h * escala;
    const areaRef = wM * hM; // si fuera un rectángulo perfecto
    setValidacion({ wPx: bb.w, hPx: bb.h, wM, hM, areaM, areaRef });
  }, [puntos, escala]);

  /* ─── Confianza de línea de escala ─── */
  useEffect(() => {
    if (puntosEscala.length !== 2) { setEscalaConfianza(null); return; }
    const dx = Math.abs(puntosEscala[1].x - puntosEscala[0].x);
    const dy = Math.abs(puntosEscala[1].y - puntosEscala[0].y);
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    if (ang < 8) setEscalaConfianza("horizontal");
    else if (ang > 82) setEscalaConfianza("vertical");
    else setEscalaConfianza("diagonal");
  }, [puntosEscala]);

  /* =====================
     Helpers coords
  ===================== */
  const worldToScreen = (wx, wy) => ({ x: wx * zoom + pan.x, y: wy * zoom + pan.y });

  const getWorldPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const sy = (e.clientY - rect.top)  * (canvas.height / rect.height);
    return { x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom };
  };

  /* =====================
     Snap con offset
  ===================== */
  const calcularSnap = useCallback((worldPos) => {
    if (!edgeDataRef.current) return null;
    const radio = SNAP_RADIO_PANTALLA / zoom;
    const hit   = nearestEdge(edgeDataRef.current, worldPos.x, worldPos.y, radio);
    if (!hit) return null;
    if (snapOffset === 0) return hit;
    // Desplazar en dirección normal al borde
    const nx = hit.x + Math.cos(hit.normalAngle) * snapOffset;
    const ny = hit.y + Math.sin(hit.normalAngle) * snapOffset;
    return { x: nx, y: ny, normalAngle: hit.normalAngle };
  }, [zoom, snapOffset]);

  /* =====================
     DIBUJO
  ===================== */
  const dibujar = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext("2d");

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);
    ctx.drawImage(imgRef.current, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    /* Polígono */
    if (puntos.length > 0) {
      ctx.beginPath();
      puntos.forEach((p, i) => {
        const s = worldToScreen(p.x, p.y);
        i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
      });
      if (puntos.length > 2) ctx.closePath();

      if (poligonoCerrado && puntos.length > 2) {
        ctx.fillStyle = "rgba(0,188,212,0.12)";
        ctx.fill();
      }
      ctx.strokeStyle = "#00bcd4"; ctx.lineWidth = 2; ctx.stroke();

      puntos.forEach((p, i) => {
        const s = worldToScreen(p.x, p.y);
        ctx.beginPath();
        ctx.arc(s.x, s.y, i === 0 ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? "#00e5ff" : "#00bcd4"; ctx.fill();
        if (i === 0 && puntos.length > 2 && !poligonoCerrado) {
          ctx.beginPath(); ctx.arc(s.x, s.y, SNAP_DIST_CERRAR, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(0,229,255,0.3)"; ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
        }
      });

      // Línea preview al cursor
      if (!poligonoCerrado && cursorMundo && puntos.length > 0) {
        const last  = worldToScreen(puntos[puntos.length - 1].x, puntos[puntos.length - 1].y);
        const tgt   = (snapActivo && snapPoint) ? worldToScreen(snapPoint.x, snapPoint.y) : worldToScreen(cursorMundo.x, cursorMundo.y);
        ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = "rgba(0,188,212,0.4)"; ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      }

      // Bounding box con dimensiones (si hay escala y validación)
      if (validacion && puntos.length > 2) {
        const bb = boundingBoxPoligono(puntos);
        const tl = worldToScreen(bb.minX, bb.minY);
        const br = worldToScreen(bb.maxX, bb.maxY);
        ctx.save();
        ctx.strokeStyle = "rgba(251,191,36,0.4)"; ctx.lineWidth = 1;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        ctx.setLineDash([]);

        // Etiqueta ancho
        const midX = (tl.x + br.x) / 2;
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(midX - 30, tl.y - 20, 60, 16);
        ctx.fillStyle = "#fbbf24"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
        ctx.fillText(`${validacion.wM.toFixed(2)} m`, midX, tl.y - 7);

        // Etiqueta alto
        const midY = (tl.y + br.y) / 2;
        ctx.save();
        ctx.translate(br.x + 4, midY);
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, -8, 56, 16);
        ctx.fillStyle = "#fbbf24"; ctx.textAlign = "left";
        ctx.fillText(`${validacion.hM.toFixed(2)} m`, 4, 4);
        ctx.restore();

        ctx.restore();
      }
    }

    /* Línea de escala */
    if (puntosEscala.length > 0) {
      ctx.save();
      ctx.strokeStyle = "#ff9800"; ctx.fillStyle = "#ff9800"; ctx.lineWidth = 2;

      if (puntosEscala.length === 2) {
        const s0 = worldToScreen(puntosEscala[0].x, puntosEscala[0].y);
        const s1 = worldToScreen(puntosEscala[1].x, puntosEscala[1].y);
        ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
        const ang = Math.atan2(s1.y - s0.y, s1.x - s0.x) + Math.PI / 2;
        [s0, s1].forEach(p => {
          ctx.beginPath();
          ctx.moveTo(p.x + Math.cos(ang)*7, p.y + Math.sin(ang)*7);
          ctx.lineTo(p.x - Math.cos(ang)*7, p.y - Math.sin(ang)*7);
          ctx.stroke();
        });
        // Etiqueta longitud en px
        const cx2 = (s0.x + s1.x) / 2, cy2 = (s0.y + s1.y) / 2;
        const dPx = Math.hypot(puntosEscala[1].x - puntosEscala[0].x, puntosEscala[1].y - puntosEscala[0].y);
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(cx2 - 36, cy2 - 18, 72, 16);
        ctx.fillStyle = "#ff9800"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
        ctx.fillText(`${dPx.toFixed(1)} px`, cx2, cy2 - 5);
      }

      if (puntosEscala.length === 1 && cursorMundo) {
        const s0  = worldToScreen(puntosEscala[0].x, puntosEscala[0].y);
        const tgt = (snapActivo && snapPoint) ? worldToScreen(snapPoint.x, snapPoint.y) : worldToScreen(cursorMundo.x, cursorMundo.y);
        ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = "rgba(255,152,0,0.5)"; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      }

      puntosEscala.forEach(p => {
        const s = worldToScreen(p.x, p.y);
        ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ff9800"; ctx.fill();
      });
      ctx.restore();
    }

    /* Cursor magnético */
    if (snapActivo && snapPoint) {
      const s  = worldToScreen(snapPoint.x, snapPoint.y);
      const cs = 8;
      ctx.save();
      ctx.strokeStyle = modoEscala ? "#ff9800" : "#00e5ff"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(s.x - cs, s.y); ctx.lineTo(s.x + cs, s.y);
      ctx.moveTo(s.x, s.y - cs); ctx.lineTo(s.x, s.y + cs); ctx.stroke();
      ctx.beginPath(); ctx.arc(s.x, s.y, cs + 4, 0, Math.PI * 2);
      ctx.strokeStyle = modoEscala ? "rgba(255,152,0,0.55)" : "rgba(0,229,255,0.55)";
      ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    } else if (cursorMundo) {
      // Cursor simple cuando no hay snap
      const s  = worldToScreen(cursorMundo.x, cursorMundo.y);
      const cs = 6;
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(s.x - cs, s.y); ctx.lineTo(s.x + cs, s.y);
      ctx.moveTo(s.x, s.y - cs); ctx.lineTo(s.x, s.y + cs); ctx.stroke();
      ctx.restore();
    }

    /* Rectángulo zoom */
    if (modoZoom && zoomInicio && zoomRect) {
      const s0 = worldToScreen(zoomInicio.x, zoomInicio.y);
      const s1 = worldToScreen(zoomRect.x, zoomRect.y);
      ctx.save(); ctx.strokeStyle = "rgba(0,188,212,0.85)";
      ctx.setLineDash([6, 4]); ctx.lineWidth = 1;
      ctx.strokeRect(s0.x, s0.y, s1.x - s0.x, s1.y - s0.y);
      ctx.restore();
    }
  };

  /* =====================
     Mouse handlers
  ===================== */
  const handleMouseDown = (e) => {
    if (spaceDownRef.current) {
      mouseDownRef.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }
    mouseDownRef.current = true;
    if (modoZoom) { const p = getWorldPos(e); setZoomInicio(p); setZoomRect(p); return; }

    const raw = getWorldPos(e);
    for (let i = 0; i < puntos.length; i++) {
      const s  = worldToScreen(puntos[i].x, puntos[i].y);
      const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
      const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const sy = (e.clientY - rect.top)  * (canvas.height / rect.height);
      if (Math.hypot(sx - s.x, sy - s.y) < 10) { setDragIndex(i); return; }
    }
  };

  const handleMouseMove = (e) => {
    const worldPos = getWorldPos(e);
    setCursorMundo(worldPos);
    const snap = calcularSnap(worldPos);
    setSnapPoint(snap); setSnapActivo(!!snap);

    if (modoEscala && puntosEscala.length === 1) {
      const p0  = puntosEscala[0];
      const tgt = snap ?? worldPos;
      const dpx = Math.hypot(tgt.x - p0.x, tgt.y - p0.y);
      setDistPx(dpx.toFixed(1));
      setDistM(escala ? (dpx * escala).toFixed(3) : null);
    } else { setDistPx(null); setDistM(null); }

    if (!mouseDownRef.current) return;
    if (spaceDownRef.current) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y }); return;
    }
    if (modoZoom && zoomInicio) { setZoomRect(worldPos); return; }
    if (dragIndex !== null) {
      const nuevos = [...puntos];
      nuevos[dragIndex] = snap ?? worldPos;
      setPuntos(nuevos);
    }
  };

  const handleMouseUp = () => {
    mouseDownRef.current = false; setDragIndex(null);
    if (modoZoom && zoomInicio && zoomRect) {
      const w = Math.abs(zoomRect.x - zoomInicio.x);
      const h = Math.abs(zoomRect.y - zoomInicio.y);
      if (w > 20 && h > 20) {
        const nuevoZoom = Math.min(canvasRef.current.width / w, canvasRef.current.height / h, MAX_ZOOM);
        const cx = Math.min(zoomInicio.x, zoomRect.x);
        const cy = Math.min(zoomInicio.y, zoomRect.y);
        setPan({ x: -cx * nuevoZoom, y: -cy * nuevoZoom });
        setZoom(nuevoZoom);
      }
      justZoomedRef.current = true;
      setTimeout(() => { justZoomedRef.current = false; }, 50);
    }
    setModoZoom(false); setZoomInicio(null); setZoomRect(null);
  };

  const handleClick = (e) => {
    if (justZoomedRef.current || spaceDownRef.current || modoZoom) return;
    const worldPos = getWorldPos(e);
    const snap     = calcularSnap(worldPos);
    const punto    = snap ?? worldPos;

    if (modoEscala) {
      if (puntosEscala.length < 2) {
        const nuevos = [...puntosEscala, punto];
        setPuntosEscala(nuevos);
        if (puntosEscala.length === 0) {
          // Zoom automático 2.5× al primer punto de escala
          const nuevoZoom = Math.min(zoom * 2.5, MAX_ZOOM);
          const canvas    = canvasRef.current;
          setPan({ x: canvas.width / 2 - punto.x * nuevoZoom, y: canvas.height / 2 - punto.y * nuevoZoom });
          setZoom(nuevoZoom);
        }
      }
      return;
    }

    if (poligonoCerrado) return;

    if (puntos.length > 2) {
      const s0 = worldToScreen(puntos[0].x, puntos[0].y);
      const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
      const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const sy = (e.clientY - rect.top)  * (canvas.height / rect.height);
      if (Math.hypot(sx - s0.x, sy - s0.y) < SNAP_DIST_CERRAR) { setPoligonoCerrado(true); return; }
    }
    setPuntos([...puntos, punto]);
  };

  const calcularEscala = () => {
    if (puntosEscala.length !== 2 || !distanciaReal) return;
    const dx  = puntosEscala[1].x - puntosEscala[0].x;
    const dy  = puntosEscala[1].y - puntosEscala[0].y;
    const pix = Math.sqrt(dx*dx + dy*dy);
    setEscalaPixeles(pix);
    setEscala(parseFloat(distanciaReal) / pix);
    setModoEscala(false); setDistPx(null); setDistM(null);
  };

  const confirmarArea = () => {
    if (!escala || puntos.length < 3) return;
    const areaReal = Math.round(areaPoligono(puntos) * escala * escala * 100) / 100;
    onConfirm(areaReal); onClose();
  };

  const resetVista = () => {
    setZoom(1); setPan({ x: 0, y: 0 });
    setModoZoom(false); setZoomInicio(null); setZoomRect(null);
  };

  const cerrarModal = () => { setCerrando(true); setTimeout(() => { setVisible(false); onClose(); }, 300); };

  const procesarArchivo = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("El archivo supera el tamaño máximo de 10MB"); return; }
    setCargando(true);
    try {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => { setImagen(reader.result); setCargando(false); };
        reader.readAsDataURL(file);
      }
      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const pdf    = await pdfjsLib.getDocument({ data: buffer }).promise;
        const page   = await pdf.getPage(1);
        const scale  = 1400 / page.getViewport({ scale: 1 }).width;
        const vp     = page.getViewport({ scale });
        const c      = document.createElement("canvas");
        c.width = vp.width; c.height = vp.height;
        await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
        setImagen(c.toDataURL()); setCargando(false);
      }
    } catch (err) { console.error(err); alert("Error al procesar el archivo"); setCargando(false); }
  };

  /* ─── Colores de validación ─── */
  const colorConfianza = { horizontal: "#16a34a", vertical: "#16a34a", diagonal: "#ca8a04" };

  /* ─── Desviación área vs bounding box ─── */
  const desviacionPorc = validacion
    ? Math.abs((validacion.areaM - validacion.areaRef) / validacion.areaRef * 100)
    : null;

  /* =====================
     JSX
  ===================== */
  return (
    <div
      className={`modal-overlay-area ${open && !cerrando ? "show" : "hide"}`}
      onClick={cerrarModal}
    >
      <div
        className={`modal-area-calc ${open && !cerrando ? "show" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-area">
          <div className="modal-titulo-grupo">
            <h3>📐 Calculador de área</h3>
            <p className="modal-subtitulo">Sube tu plano en PDF o imagen</p>
          </div>
          <button className="btn-close-area" onClick={cerrarModal}>✕</button>
        </div>

        <div className="modal-content-area">

          {/* ─── Upload ─── */}
          {!imagen && (
            <div
              className={`upload-zone ${dragActivo ? "drag-activo" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragActivo(true); }}
              onDragLeave={() => setDragActivo(false)}
              onDrop={(e) => { e.preventDefault(); setDragActivo(false); procesarArchivo(e.dataTransfer.files[0]); }}
            >
              <input id="file-upload" type="file" accept="image/*,application/pdf"
                style={{ display: "none" }} onChange={(e) => procesarArchivo(e.target.files[0])} />
              <label htmlFor="file-upload" className="upload-label">
                <div className="upload-icon">📄</div>
                <div className="upload-text">
                  <span className="upload-titulo">Arrastra tu archivo aquí </span>
                  <span className="upload-desc">o haz clic para seleccionar</span>
                </div>
                <div className="upload-formatos">PDF, PNG, JPG (máx. 10MB)</div>
              </label>
            </div>
          )}

          {cargando && (
            <div className="loader-overlay">
              <div className="spinner" /><p>Procesando plano…</p>
            </div>
          )}

          {imagen && (
            <>
              {/* ─── Canvas ─── */}
              <div className="canvas-container-area" style={{ position: "relative" }}>
                {/* Badge snap */}
                <div style={{
                  position: "absolute", top: 8, right: 8, zIndex: 10,
                  fontSize: "0.65rem", fontWeight: 600,
                  color: snapActivo ? "#4ade80" : "#64748b",
                  background: snapActivo ? "rgba(74,222,128,0.12)" : "rgba(100,116,139,0.1)",
                  border: `1px solid ${snapActivo ? "rgba(74,222,128,0.3)" : "rgba(100,116,139,0.2)"}`,
                  borderRadius: 8, padding: "3px 8px", transition: "all 0.15s", pointerEvents: "none",
                }}>
                  {snapActivo ? "⊕ snap activo" : "sin snap"}
                </div>
                <canvas
                  ref={canvasRef}
                  className={`canvas-area-dark ${modoZoom ? "zoom-mode" : ""}`}
                  onClick={handleClick}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => {
                    setCursorMundo(null); setSnapPoint(null); setSnapActivo(false);
                    setDistPx(null); setDistM(null);
                  }}
                  style={{ cursor: "none" }}
                />
              </div>

              {/* ─── Panel de área + validación cruzada ─── */}
              {validacion && (
                <div style={{
                  background: "rgba(0,0,0,0.3)", border: "1px solid rgba(0,188,212,0.2)",
                  borderRadius: 10, padding: "10px 16px", margin: "8px 0",
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px",
                }}>
                  {/* Área polígono */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.62rem", color: "#94a3b8", marginBottom: 2 }}>Área trazada</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#00e5ff" }}>
                      {validacion.areaM.toFixed(2)} m²
                    </div>
                  </div>
                  {/* Dimensiones bounding box */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.62rem", color: "#94a3b8", marginBottom: 2 }}>Bounding box</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fbbf24" }}>
                      {validacion.wM.toFixed(2)} × {validacion.hM.toFixed(2)} m
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "#64748b" }}>
                      = {validacion.areaRef.toFixed(2)} m² si rectangular
                    </div>
                  </div>
                  {/* Desviación */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.62rem", color: "#94a3b8", marginBottom: 2 }}>Desviación vs rect.</div>
                    <div style={{
                      fontSize: "0.85rem", fontWeight: 700,
                      color: desviacionPorc < 5 ? "#4ade80" : desviacionPorc < 15 ? "#fbbf24" : "#f87171",
                    }}>
                      {desviacionPorc.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: "0.62rem", color: "#64748b" }}>
                      {desviacionPorc < 5 ? "polígono regular ✓" : desviacionPorc < 15 ? "forma irregular" : "revisar trazado"}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Instrucciones ─── */}
              <div className="instrucciones-area">
                <h4>Instrucciones de uso</h4>
                <ol>

                  {/* PASO 1: Escala */}
                  <li>
                    Define la <strong>escala real</strong> sobre una distancia conocida del plano.
                    <br />
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                      El snap detecta bordes automáticamente. Si la medida sale incorrecta, ajusta el offset de snap.
                    </span>

                    {/* Control offset */}
                    <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Offset snap:</span>
                      {[
                        { label: "Centro trazo", val: 0 },
                        { label: "+2 px (exterior)", val: 2 },
                        { label: "-2 px (interior)", val: -2 },
                        { label: "+4 px", val: 4 },
                        { label: "-4 px", val: -4 },
                      ].map(o => (
                        <button
                          key={o.val}
                          onClick={() => setSnapOffset(o.val)}
                          style={{
                            fontSize: "0.63rem", padding: "2px 7px", borderRadius: 6,
                            border: `1px solid ${snapOffset === o.val ? "#00bcd4" : "rgba(100,116,139,0.3)"}`,
                            background: snapOffset === o.val ? "rgba(0,188,212,0.15)" : "transparent",
                            color: snapOffset === o.val ? "#00e5ff" : "#64748b",
                            cursor: "pointer",
                          }}
                        >{o.label}</button>
                      ))}
                    </div>

                    <div className="acciones-instruccion">
                      <button className="btn-tool-primary" onClick={() => {
                        setModoEscala(true); setPuntosEscala([]);
                        setEscala(null); setEscalaConfianza(null); setEscalaPixeles(null); resetVista();
                      }}>
                        📏 Definir escala
                      </button>
                      {modoEscala && (
                        <div className="escala-inline">
                          <input type="number" placeholder="Distancia (m)" value={distanciaReal}
                            onChange={(e) => setDistanciaReal(e.target.value)} className="input-escala" />
                          <button className="btn-confirmar-escala" onClick={calcularEscala}
                            disabled={puntosEscala.length < 2 || !distanciaReal}>
                            ✓ Confirmar
                          </button>
                        </div>
                      )}
                      {/* Indicador distancia tiempo real */}
                      {modoEscala && puntosEscala.length === 1 && distPx && (
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: "0.5rem",
                          fontSize: "0.72rem", color: "#ff9800", fontWeight: 600,
                          background: "rgba(255,152,0,0.08)", border: "1px solid rgba(255,152,0,0.25)",
                          borderRadius: 8, padding: "3px 10px", marginTop: "0.4rem",
                        }}>
                          <span>📏 {distPx} px</span>
                          {distM && <span style={{ color: "#fbbf24" }}>≈ {distM} m</span>}
                          {snapActivo && <span style={{ color: "#4ade80" }}>⊕ snap</span>}
                        </div>
                      )}
                    </div>

                    {/* Estado escala definida */}
                    {escala && !modoEscala && (
                      <div style={{ marginTop: "0.4rem", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
                        <span className="badge-ok">
                          ✔ {escalaPixeles?.toFixed(1)} px = {distanciaReal} m
                          → {(1/escala).toFixed(2)} px/m
                        </span>
                        {escalaConfianza && (
                          <span style={{
                            fontSize: "0.68rem", fontWeight: 600,
                            color: colorConfianza[escalaConfianza],
                            border: `1px solid ${colorConfianza[escalaConfianza]}40`,
                            borderRadius: 10, padding: "2px 8px",
                          }}>
                            {escalaConfianza === "horizontal" ? "Línea horizontal ✓"
                              : escalaConfianza === "vertical" ? "Línea vertical ✓"
                              : "⚠ Línea diagonal"}
                          </span>
                        )}
                      </div>
                    )}
                    {escalaConfianza === "diagonal" && escala && (
                      <div style={{
                        marginTop: "0.4rem", fontSize: "0.68rem", color: "#ca8a04",
                        background: "rgba(202,138,4,0.08)", border: "1px solid rgba(202,138,4,0.25)",
                        borderRadius: 6, padding: "4px 10px",
                      }}>
                        ⚠ Línea diagonal — para mayor precisión usa una referencia H o V del plano.
                      </div>
                    )}
                  </li>

                  {/* PASO 2: Trazado */}
                  <li>
                    Traza el contorno dando clic en cada vértice. El <strong>área y las dimensiones</strong> se actualizan en tiempo real sobre el plano.
                    <div className="acciones-instruccion">
                      <button className="btn-tool-secondary"
                        onClick={() => { setPuntos([]); setPoligonoCerrado(false); setValidacion(null); }}>
                        🗑️ Limpiar contorno
                      </button>
                      <button className="btn-tool-secondary"
                        onClick={() => { if (puntos.length > 0) { setPuntos(puntos.slice(0,-1)); setPoligonoCerrado(false); } }}
                        disabled={puntos.length === 0}>
                        ↶ Deshacer punto
                      </button>
                    </div>
                  </li>

                  {/* PASO 3: Confirmar */}
                  <li>
                    Verifica que el <strong>bounding box</strong> mostrado en el plano coincida con las dimensiones reales,
                    luego confirma.
                    {escala && (
                      <div className="acciones-instruccion">
                        <button className="btn-confirmar-area-dark" onClick={confirmarArea}
                          disabled={puntos.length < 3}>
                          ✓ Usar esta área
                        </button>
                      </div>
                    )}
                  </li>
                </ol>

                <div className="instrucciones-navegacion">
                  <strong>Navegación</strong>
                  <ul>
                    <li>Scroll: zoom · Tecla A: vista original</li>
                    <li>Tecla Z + arrastrar: zoom por área</li>
                    <li>Space + arrastrar: mover plano</li>
                    <li>Snap detecta bordes — ajusta el offset si el área no coincide</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculadorAreaModal;