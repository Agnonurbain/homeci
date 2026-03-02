import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Box } from 'lucide-react';
import type { Property } from '../services/propertyService';

declare global { interface Window { THREE: any } }

// ─── Couleurs par matériau / type ────────────────────────────────────────────
const TYPE_FACADE: Record<string, number> = {
  appartement: 0xD4C5A9, maison: 0xE8D5B0, villa: 0xF0E8D0,
  terrain: 0x8FBC8F,    hotel: 0xB0C4DE, appart_hotel: 0xB0C4DE,
};
const TYPE_ROOF: Record<string, number> = {
  appartement: 0x909090, maison: 0xC06040,
  villa: 0xA05030,       hotel: 0x607090, appart_hotel: 0x607090,
};
const ROOM_COLORS = [
  0x7BC8A4, 0x7BA8D8, 0xF0C060, 0xD08080,
  0x90B870, 0xC080B0, 0x60B0C8, 0xE89060,
  0x8898D0, 0xA8C880, 0xF08860, 0x70C0C0,
];

// ─── Génère un plan automatique depuis les données du bien ───────────────────
function generateFloorPlan(property: Property) {
  const type      = property.property_type;
  const surface   = property.surface_area ?? property.land_area ?? 80;
  const bedrooms  = property.bedrooms ?? 0;
  const bathrooms = property.bathrooms ?? 0;
  const floors    = type === 'hotel' || type === 'appart_hotel'
    ? Math.max(Math.ceil((property.rooms_count ?? 10) / 8), 2)
    : Math.max(Math.round(surface / 120), 1);
  const floorH    = 2.8;
  const facade    = TYPE_FACADE[type] ?? 0xD4C5A9;
  const roofColor = TYPE_ROOF[type]   ?? 0x909090;
  const flatRoof  = type === 'appartement' || type === 'hotel' || type === 'appart_hotel';

  // Pièces auto-générées selon le type
  const rooms: { nom: string; w: number; d: number }[] = [];

  if (type === 'terrain') {
    return { rooms: [], bw: Math.sqrt(surface), bd: Math.sqrt(surface), floors: 0, floorH, facade, roofColor, flatRoof: true };
  }

  if (type === 'hotel' || type === 'appart_hotel') {
    const rc = property.rooms_count ?? 20;
    const perFloor = Math.ceil(rc / floors);
    for (let i = 0; i < Math.min(perFloor, 8); i++) {
      rooms.push({ nom: `Ch. ${i + 1}`, w: 4, d: 5 });
    }
    rooms.push({ nom: 'Hall', w: 8, d: 6 });
    rooms.push({ nom: 'Restaurant', w: 10, d: 8 });
  } else {
    // Résidentiel
    const sPerRoom = surface / Math.max(bedrooms + bathrooms + 2, 3);
    rooms.push({ nom: 'Salon', w: Math.max(Math.sqrt(sPerRoom * 1.8), 4), d: Math.max(Math.sqrt(sPerRoom * 1.4), 3.5) });
    rooms.push({ nom: 'Cuisine', w: Math.max(Math.sqrt(sPerRoom * 0.8), 2.5), d: Math.max(Math.sqrt(sPerRoom * 0.8), 2.5) });
    for (let i = 0; i < bedrooms; i++) {
      const size = i === 0 ? sPerRoom * 1.1 : sPerRoom * 0.9;
      rooms.push({ nom: i === 0 ? 'Chambre principale' : `Chambre ${i + 1}`, w: Math.max(Math.sqrt(size), 3), d: Math.max(Math.sqrt(size * 0.85), 2.8) });
    }
    for (let i = 0; i < bathrooms; i++) {
      rooms.push({ nom: i === 0 ? 'Salle de bain' : 'SDB 2', w: 2.2, d: 2.8 });
    }
    rooms.push({ nom: 'WC', w: 1.2, d: 2 });
    if (property.furnished) rooms.push({ nom: 'Entrée', w: 2, d: 2 });
  }

  // Layout des pièces en grille
  const bw  = Math.max(Math.ceil(Math.sqrt(surface)), rooms.reduce((s, r) => s + r.w, 0) / Math.ceil(rooms.length / 2));
  const placed: { x: number; z: number; w: number; d: number; nom: string; color: number }[] = [];
  let cx = 0, cz = 0, rowD = 0;
  rooms.forEach((r, i) => {
    if (cx + r.w > bw + 0.5 && cx > 0) { cz += rowD; cx = 0; rowD = 0; }
    placed.push({ x: cx, z: cz, w: r.w, d: r.d, nom: r.nom, color: ROOM_COLORS[i % ROOM_COLORS.length] });
    cx  += r.w;
    rowD = Math.max(rowD, r.d);
  });
  const maxX = placed.reduce((m, r) => Math.max(m, r.x + r.w), bw);
  const maxZ = placed.reduce((m, r) => Math.max(m, r.z + r.d), bw);

  return { rooms: placed, bw: maxX, bd: maxZ, floors, floorH, facade, roofColor, flatRoof };
}

// ─── Chargement Three.js CDN ──────────────────────────────────────────────────
let threeReady = false;
const threeQueue: (() => void)[] = [];
function loadThree(): Promise<void> {
  return new Promise(resolve => {
    if (threeReady || window.THREE) { threeReady = true; resolve(); return; }
    threeQueue.push(resolve);
    if (threeQueue.length > 1) return;
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = () => { threeReady = true; threeQueue.forEach(fn => fn()); };
    s.onerror = () => threeQueue.forEach(fn => fn()); // resolve anyway
    document.head.appendChild(s);
  });
}

interface Property3DViewerProps {
  property: Property;
  height?: number;
}

export function Property3DViewer({ property, height = 460 }: Property3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  // Key pour forcer remount
  const [key, setKey] = useState(0);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let renderer: any, animId: number, disposed = false;
    let phi = 0.75, theta = 0.5;
    let isDragging = false, lastX = 0, lastY = 0;

    const plan = generateFloorPlan(property);
    let radius  = Math.max(plan.bw, plan.bd, plan.floors * plan.floorH) * 2.5 + 6;
    let panX    = plan.bw / 2;
    let panY    = (plan.floors * plan.floorH) / 2;

    loadThree().then(() => {
      if (disposed || !window.THREE) { setStatus('error'); return; }
      const THREE = window.THREE;

      // ── Scène & renderer ──
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xEFF4F8);
      scene.fog = new THREE.FogExp2(0xEFF4F8, 0.008);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      const W = el.clientWidth || 640, H = height;
      renderer.setSize(W, H);
      el.appendChild(renderer.domElement);

      const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 600);
      const updateCam = () => {
        camera.position.set(
          panX + radius * Math.sin(phi) * Math.sin(theta),
          panY + radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.cos(theta)
        );
        camera.lookAt(panX, panY, plan.bd / 2);
      };
      updateCam();

      // ── Lumières ──
      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const sun = new THREE.DirectionalLight(0xFFF5D0, 1.3);
      sun.position.set(30, 50, 30);
      sun.castShadow = true;
      sun.shadow.camera.near = 1; sun.shadow.camera.far = 200;
      sun.shadow.camera.left = -50; sun.shadow.camera.right = 50;
      sun.shadow.camera.top = 50; sun.shadow.camera.bottom = -50;
      sun.shadow.mapSize.set(2048, 2048);
      scene.add(sun);
      scene.add(new THREE.DirectionalLight(0xD0E8FF, 0.35)).position.set(-20, 15, -20);

      const addBox = (w: number, h: number, d: number, color: number, x: number, y: number, z: number, shadow = true) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
        m.position.set(x, y, z);
        if (shadow) { m.castShadow = true; m.receiveShadow = true; }
        scene.add(m);
        return m;
      };

      // ── Sol ──
      const groundColor = property.property_type === 'terrain' ? 0xC8B870 : 0x7AAA6A;
      addBox(200, 0.1, 200, groundColor, 0, -0.05, 0, false);

      if (property.property_type === 'terrain') {
        // Terrain nu avec marqueurs de limite
        const bw = plan.bw, bd = plan.bd;
        addBox(bw + 2, 0.08, bd + 2, 0xD4C890, bw / 2, 0.04, bd / 2, false);
        // Piquets de bornage
        [[0, 0], [bw, 0], [0, bd], [bw, bd]].forEach(([px, pz]) => {
          addBox(0.1, 1.5, 0.1, 0xFF6020, px as number, 0.75, pz as number);
        });
        // Clôture
        for (let x = 0; x <= bw; x += 2) {
          addBox(0.06, 0.8, 0.06, 0xA08060, x, 0.4, 0);
          addBox(0.06, 0.8, 0.06, 0xA08060, x, 0.4, bd);
        }
        setStatus('ready');
      } else {
        // ── Allée ──
        addBox(plan.bw + 6, 0.06, plan.bd + 6, 0xC8BA9A, plan.bw / 2, 0.03, plan.bd / 2, false);

        for (let f = 0; f < plan.floors; f++) {
          const yBase = f * plan.floorH;

          // ── Pièces ──
          plan.rooms.forEach(room => {
            // Sol
            const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(room.w - 0.12, room.d - 0.12), new THREE.MeshLambertMaterial({ color: f === 0 ? 0xEDE0C8 : 0xF5ECD8 }));
            floorMesh.rotation.x = -Math.PI / 2;
            floorMesh.position.set(room.x + room.w / 2, yBase + 0.02, room.z + room.d / 2);
            scene.add(floorMesh);

            // Couleur de la pièce
            const dot = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(room.w * 0.5, 1.2), Math.min(room.d * 0.5, 1.2)), new THREE.MeshLambertMaterial({ color: room.color, transparent: true, opacity: 0.55 }));
            dot.rotation.x = -Math.PI / 2;
            dot.position.set(room.x + room.w / 2, yBase + 0.03, room.z + room.d / 2);
            scene.add(dot);

            // Murs intérieurs fins
            const wMat = new THREE.MeshLambertMaterial({ color: 0xF8F4EE });
            const wH = plan.floorH - 0.06;
            // avant/arrière
            [[room.z], [room.z + room.d]].forEach(([pz]) => {
              addBox(room.w, wH, 0.12, 0xF5F0EA, room.x + room.w / 2, yBase + wH / 2, pz as number);
            });
            // gauche/droite
            [[room.x], [room.x + room.w]].forEach(([px]) => {
              addBox(0.12, wH, room.d, 0xF5F0EA, px as number, yBase + wH / 2, room.z + room.d / 2);
            });
            void wMat;
          });

          // ── Dalle entre étages ──
          if (f < plan.floors - 1) {
            addBox(plan.bw + 0.3, 0.22, plan.bd + 0.3, 0xCCC4B0, plan.bw / 2, (f + 1) * plan.floorH - 0.11, plan.bd / 2);
          }
        }

        // ── Façade extérieure ──
        const ext = 0.28, totalH = plan.floors * plan.floorH;
        [
          [plan.bw + ext * 2, totalH, ext,          plan.bw / 2,        totalH / 2, -ext / 2        ],
          [plan.bw + ext * 2, totalH, ext,          plan.bw / 2,        totalH / 2, plan.bd + ext / 2],
          [ext,               totalH, plan.bd,      -ext / 2,           totalH / 2, plan.bd / 2      ],
          [ext,               totalH, plan.bd,      plan.bw + ext / 2,  totalH / 2, plan.bd / 2      ],
        ].forEach(([w, h, d, x, y, z]) => {
          addBox(w as number, h as number, d as number, plan.facade, x as number, y as number, z as number);
        });

        // ── Fenêtres ──
        const winMat = new THREE.MeshLambertMaterial({ color: 0xADD8F0, transparent: true, opacity: 0.75 });
        const frameMat = new THREE.MeshLambertMaterial({ color: 0xE8E0D0 });
        for (let f2 = 0; f2 < plan.floors; f2++) {
          const wy = f2 * plan.floorH + plan.floorH * 0.55;
          const wCount = Math.max(Math.floor(plan.bw / 3), 1);
          const step = plan.bw / (wCount + 1);
          for (let i = 1; i <= wCount; i++) {
            [[-ext / 2 - 0.01], [plan.bd + ext / 2 + 0.01]].forEach(([pz]) => {
              const win = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.1), winMat);
              win.position.set(i * step, wy, pz as number);
              win.rotation.y = pz as number < 0 ? Math.PI : 0;
              scene.add(win);
              // Cadre
              const fr = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.06), frameMat);
              fr.position.set(i * step, wy, (pz as number < 0 ? -ext - 0.04 : plan.bd + ext + 0.04));
              scene.add(fr);
            });
          }
        }

        // ── Porte d'entrée ──
        const doorMat = new THREE.MeshLambertMaterial({ color: 0x6B4C2A });
        const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 0.08), doorMat);
        door.position.set(plan.bw * 0.35, plan.floorH * 0.44, -ext - 0.05);
        scene.add(door);
        // Poignée
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshLambertMaterial({ color: 0xD4A030 }));
        knob.position.set(plan.bw * 0.35 + 0.35, plan.floorH * 0.35, -ext - 0.1);
        scene.add(knob);

        // ── Toit ──
        const totalH2 = plan.floors * plan.floorH;
        if (plan.flatRoof) {
          addBox(plan.bw + ext * 2 + 0.5, 0.28, plan.bd + ext * 2 + 0.5, plan.roofColor, plan.bw / 2, totalH2 + 0.14, plan.bd / 2);
          // Acrotère
          const ap = [[plan.bw / 2, plan.bd + ext + 0.5], [plan.bw / 2, -ext]] as [number, number][];
          const as2 = [[ext, plan.bd / 2], [plan.bw + ext, plan.bd / 2]] as [number, number][];
          ap.forEach(([px, pz]) => addBox(plan.bw + ext * 2 + 0.5, 0.5, 0.18, plan.facade, px, totalH2 + 0.5, pz));
          as2.forEach(([px, pz]) => addBox(0.18, 0.5, plan.bd + ext * 2, plan.facade, px, totalH2 + 0.5, pz));
        } else {
          const ridgeH = Math.min(plan.bw, plan.bd) * 0.22 + 0.5;
          const overhang = 0.6;
          const hw = plan.bw / 2 + ext + overhang;
          const hd = plan.bd / 2 + ext + overhang;
          const cx = plan.bw / 2, cz = plan.bd / 2;
          const y0 = totalH2, ytop = totalH2 + ridgeH;
          // 2 pans
          [[-1, 1]].forEach(() => {
            const verts = new Float32Array([
              cx - hw, y0, cz - hd,  cx + hw, y0, cz - hd,
              cx + hw - 0.2, ytop, cz, cx - hw + 0.2, ytop, cz,
            ]);
            const geo1 = new THREE.BufferGeometry();
            geo1.setAttribute('position', new THREE.BufferAttribute(verts, 3));
            geo1.setIndex([0,1,2, 0,2,3]);
            geo1.computeVertexNormals();
            scene.add(new THREE.Mesh(geo1, new THREE.MeshLambertMaterial({ color: plan.roofColor, side: THREE.DoubleSide })));
            const verts2 = new Float32Array([
              cx - hw, y0, cz + hd,  cx + hw, y0, cz + hd,
              cx + hw - 0.2, ytop, cz, cx - hw + 0.2, ytop, cz,
            ]);
            const geo2 = new THREE.BufferGeometry();
            geo2.setAttribute('position', new THREE.BufferAttribute(verts2, 3));
            geo2.setIndex([0,2,1, 0,3,2]);
            geo2.computeVertexNormals();
            scene.add(new THREE.Mesh(geo2, new THREE.MeshLambertMaterial({ color: plan.roofColor, side: THREE.DoubleSide })));
            // Pignons
            [[cx - hw, 0], [cx + hw, 1]].forEach(([px]) => {
              const vg = new Float32Array([
                px as number, y0, cz - hd,  px as number, y0, cz + hd,  px as number, ytop, cz,
              ]);
              const gg = new THREE.BufferGeometry();
              gg.setAttribute('position', new THREE.BufferAttribute(vg, 3));
              gg.setIndex([0,1,2]);
              gg.computeVertexNormals();
              scene.add(new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ color: plan.facade, side: THREE.DoubleSide })));
            });
          });
        }

        // ── Végétation ──
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x7A5030 });
        const foliageMat = new THREE.MeshLambertMaterial({ color: 0x3A8040 });
        const treePts = [[-4, -4], [-4, plan.bd + 4], [plan.bw + 4, -4], [plan.bw + 4, plan.bd + 4]];
        treePts.forEach(([tx, tz]) => {
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 2.2, 7), trunkMat);
          trunk.position.set(tx as number, 1.1, tz as number);
          scene.add(trunk);
          const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 7), foliageMat);
          foliage.position.set(tx as number, 3.3, tz as number);
          scene.add(foliage);
        });

        setStatus('ready');
      }

      // ── Rendu ──
      const animate = () => {
        if (disposed) return;
        animId = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      // ── Contrôles souris ──
      const onDown = (e: MouseEvent) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; };
      const onUp   = () => { isDragging = false; };
      const onMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        theta -= dx * 0.007;
        phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi - dy * 0.007));
        lastX = e.clientX; lastY = e.clientY;
        updateCam();
      };
      const onWheel = (e: WheelEvent) => {
        radius = Math.max(4, Math.min(150, radius + e.deltaY * 0.055));
        updateCam(); e.preventDefault();
      };
      const onResize = () => {
        const W2 = el.clientWidth;
        camera.aspect = W2 / height;
        camera.updateProjectionMatrix();
        renderer.setSize(W2, height);
      };
      el.addEventListener('mousedown', onDown);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('mousemove', onMove);
      el.addEventListener('wheel', onWheel, { passive: false });
      el.addEventListener('contextmenu', e => e.preventDefault());
      window.addEventListener('resize', onResize);

      // ── Contrôles tactiles ──
      let lastDist = 0;
      el.addEventListener('touchstart', e => {
        if (e.touches.length === 1) { isDragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }
        if (e.touches.length === 2) lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      });
      el.addEventListener('touchend', () => { isDragging = false; });
      el.addEventListener('touchmove', e => {
        e.preventDefault();
        if (e.touches.length === 1 && isDragging) {
          theta -= (e.touches[0].clientX - lastX) * 0.007;
          phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi - (e.touches[0].clientY - lastY) * 0.007));
          lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
          updateCam();
        }
        if (e.touches.length === 2) {
          const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          radius = Math.max(4, Math.min(150, radius - (d - lastDist) * 0.08));
          lastDist = d; updateCam();
        }
      }, { passive: false });

      return () => {
        disposed = true;
        cancelAnimationFrame(animId);
        renderer.dispose();
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('resize', onResize);
      };
    }).catch(() => setStatus('error'));
  }, [property, height, key]);

  const rooms = generateFloorPlan(property).rooms;

  return (
    <div className="relative rounded-xl overflow-hidden bg-[#EFF4F8]" style={{ height }}>
      <div ref={mountRef} className="w-full h-full" />

      {/* Chargement */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EFF4F8]">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Génération du modèle 3D…</p>
        </div>
      )}

      {status === 'ready' && (
        <>
          {/* Badge */}
          <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow">
            <Box className="w-3 h-3" /> Vue 3D
          </div>

          {/* Légende pièces */}
          {rooms.length > 0 && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg shadow p-2.5 max-w-[150px]">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Pièces</p>
              <div className="space-y-1">
                {rooms.slice(0, 7).map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: `#${ROOM_COLORS[i % ROOM_COLORS.length].toString(16).padStart(6,'0')}` }} />
                    <span className="text-[11px] text-gray-700 truncate">{r.nom}</span>
                  </div>
                ))}
                {rooms.length > 7 && <p className="text-[10px] text-gray-400">+{rooms.length - 7} pièces</p>}
              </div>
            </div>
          )}

          {/* Reset + hint */}
          <button onClick={() => setKey(k => k + 1)}
            className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 rounded-lg shadow flex items-center justify-center text-gray-500 hover:text-purple-600 transition-colors" title="Réinitialiser la vue">
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-3 bg-black/40 text-white text-[11px] px-2.5 py-1 rounded-full">
            🖱 Glisser : tourner · Molette : zoom
          </div>
        </>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#EFF4F8]">
          <p className="text-sm text-gray-400">Viewer 3D indisponible</p>
        </div>
      )}
    </div>
  );
}
