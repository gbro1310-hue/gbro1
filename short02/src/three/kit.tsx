/* 3D kit for the Pompeii bread short: procedural textures, models and camera rig.
   Everything animates only from useCurrentFrame() (passed in as props). */
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { random } from "remotion";

// ---------- procedural textures ----------
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = 1) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

const speckle = (g: CanvasRenderingContext2D, w: number, h: number, n: number, seed: string, cols: string[], size = 2) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[Math.floor(random(`${seed}c${i}`) * cols.length)];
    g.globalAlpha = 0.15 + random(`${seed}a${i}`) * 0.35;
    const s = size * (0.5 + random(`${seed}s${i}`) * 1.5);
    g.fillRect(random(`${seed}x${i}`) * w, random(`${seed}y${i}`) * h, s, s);
  }
  g.globalAlpha = 1;
};

export const useTextures = () =>
  useMemo(() => {
    const plaster = (base: string, seed: string) =>
      canvasTex(512, 512, (g) => {
        g.fillStyle = base;
        g.fillRect(0, 0, 512, 512);
        speckle(g, 512, 512, 9000, seed, ["#ffffff", "#7a5a3a", "#b08a5a", "#5a4030"], 2);
        for (let i = 0; i < 18; i++) {
          g.fillStyle = "rgba(90,60,30,0.07)";
          g.beginPath();
          g.ellipse(random(`${seed}bx${i}`) * 512, random(`${seed}by${i}`) * 512, 40 + random(`${seed}br${i}`) * 90, 20 + random(`${seed}bq${i}`) * 50, 0, 0, Math.PI * 2);
          g.fill();
        }
      });
    const basalt = canvasTex(
      1024,
      1024,
      (g) => {
        g.fillStyle = "#2c2a28";
        g.fillRect(0, 0, 1024, 1024);
        // irregular polygonal paving stones
        for (let r = 0; r < 9; r++)
          for (let c = 0; c < 9; c++) {
            const cx = c * 118 + (r % 2) * 55 + random(`p${r}${c}x`) * 30;
            const cy = r * 118 + random(`p${r}${c}y`) * 30;
            g.beginPath();
            const n = 6;
            for (let k = 0; k < n; k++) {
              const a = (k / n) * Math.PI * 2 + random(`p${r}${c}a${k}`) * 0.5;
              const rr = 48 + random(`p${r}${c}r${k}`) * 16;
              const x = cx + Math.cos(a) * rr;
              const y = cy + Math.sin(a) * rr;
              if (k) g.lineTo(x, y);
              else g.moveTo(x, y);
            }
            g.closePath();
            const v = 70 + Math.floor(random(`p${r}${c}v`) * 35);
            g.fillStyle = `rgb(${v},${v - 4},${v - 8})`;
            g.fill();
          }
        speckle(g, 1024, 1024, 12000, "bas", ["#000", "#999"], 2);
      },
      1,
    );
    const brick = canvasTex(512, 512, (g) => {
      g.fillStyle = "#5a3324";
      g.fillRect(0, 0, 512, 512);
      for (let r = 0; r < 16; r++)
        for (let c = 0; c < 8; c++) {
          const x = c * 64 + (r % 2) * 32;
          const v = random(`b${r}${c}`);
          g.fillStyle = `rgb(${150 + v * 50},${70 + v * 30},${45 + v * 20})`;
          g.fillRect(x + 2, r * 32 + 2, 60, 28);
        }
      speckle(g, 512, 512, 5000, "br", ["#000", "#fff"], 2);
    });
    const wood = canvasTex(512, 512, (g) => {
      g.fillStyle = "#7a4e2c";
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 120; i++) {
        g.strokeStyle = `rgba(${40 + random(`w${i}`) * 40},${20 + random(`w${i}b`) * 20},10,0.35)`;
        g.lineWidth = 1 + random(`w${i}w`) * 3;
        g.beginPath();
        const y = random(`w${i}y`) * 512;
        g.moveTo(0, y);
        for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 6);
        g.stroke();
      }
    });
    const crust = canvasTex(512, 512, (g) => {
      const grd = g.createRadialGradient(256, 256, 20, 256, 256, 300);
      grd.addColorStop(0, "#d8a560");
      grd.addColorStop(1, "#8a5022");
      g.fillStyle = grd;
      g.fillRect(0, 0, 512, 512);
      speckle(g, 512, 512, 7000, "cr", ["#5a2e10", "#f0d090", "#3a1a08"], 3);
    });
    const marble = canvasTex(512, 512, (g) => {
      g.fillStyle = "#e9e5dc";
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 30; i++) {
        g.strokeStyle = "rgba(120,115,110,0.25)";
        g.lineWidth = 1 + random(`m${i}`) * 2;
        g.beginPath();
        let x = random(`mx${i}`) * 512;
        let y = 0;
        g.moveTo(x, y);
        while (y < 512) {
          x += (random(`mm${i}${y}`) - 0.5) * 30;
          y += 20;
          g.lineTo(x, y);
        }
        g.stroke();
      }
    });
    const ash = canvasTex(512, 512, (g) => {
      g.fillStyle = "#8d857c";
      g.fillRect(0, 0, 512, 512);
      speckle(g, 512, 512, 15000, "ash", ["#5a544e", "#bdb5aa", "#3a3632"], 3);
    });
    return {
      plasterA: plaster("#d9c19a", "pa"),
      plasterB: plaster("#c9a274", "pb"),
      plasterRed: plaster("#8f2f22", "pr"),
      basalt,
      brick,
      wood,
      crust,
      marble,
      ash,
    };
  }, []);

export type Tex = ReturnType<typeof useTextures>;

export const textTexture = (lines: string[], opts: { w?: number; h?: number; color?: string; bg?: string; font?: string } = {}) => {
  const { w = 512, h = 256, color = "#2a1a10", bg = "rgba(0,0,0,0)", font = "bold 64px 'DejaVu Serif'" } = opts;
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = color;
    g.font = font;
    g.textAlign = "center";
    g.textBaseline = "middle";
    lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * parseInt(font.match(/(\d+)px/)![1]) * 1.15));
  });
};

// ---------- camera ----------
export const CameraRig: React.FC<{ pos: [number, number, number]; look: [number, number, number]; fov?: number }> = ({ pos, look, fov = 40 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.lookAt(...look);
  });
  return null;
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: number[], b: number[], t: number) => a.map((v, i) => lerp(v, b[i], t)) as [number, number, number];
export const mixColor = (a: string, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t);

// ---------- loaf (8 real segments) ----------
const loafProfile = (r: number, h: number) => {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0.0001, 0)];
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r * Math.cos(a) * (1 + 0.06 * Math.sin(a * 2)), h * Math.sin(a) + 0.02 * r));
  }
  pts.push(new THREE.Vector2(0.0001, h + 0.02 * r));
  return pts.reverse();
};

export const Loaf3D: React.FC<{
  r?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  gap?: number; // 0..1 how deep/visible the 8 cuts are
  spread?: number; // segments pulled apart
  char?: number; // 0..1 charred
  tex: Tex;
  stamp?: THREE.Texture;
}> = ({ r = 1, position = [0, 0, 0], rotation = [0, 0, 0], gap = 1, spread = 0, char = 0, tex, stamp }) => {
  const h = r * 0.55;
  const segs = useMemo(() => {
    const g = 0.025 + 0.06 * gap;
    return Array.from({ length: 8 }).map((_, k) => {
      const start = (k * Math.PI) / 4 + g / 2;
      return { geo: new THREE.LatheGeometry(loafProfile(r, h), 48, start, Math.PI / 4 - g), mid: start + (Math.PI / 4 - g) / 2 };
    });
  }, [r, h, gap]);
  const core = useMemo(() => new THREE.LatheGeometry(loafProfile(r * 0.93, h * 0.9), 64), [r, h]);
  const crustCol = mixColor("#ffffff", "#2a2420", char);
  const crumbCol = mixColor("#efdcb4", "#1c1612", char);
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={core} castShadow receiveShadow>
        <meshStandardMaterial color={crumbCol} roughness={0.95} />
      </mesh>
      {segs.map((s, k) => (
        <mesh
          key={k}
          geometry={s.geo}
          position={[Math.sin(s.mid) * spread * r * 0.35, 0, Math.cos(s.mid) * spread * r * 0.35]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial map={tex.crust} color={crustCol} roughness={0.75 + char * 0.2} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh position={[0, h + 0.02 * r, 0]} castShadow>
        <sphereGeometry args={[r * 0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial map={tex.crust} color={crustCol} roughness={0.8} />
      </mesh>
      {stamp && (
        <mesh position={[0, h + 0.02 * r + r * 0.201, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[r * 0.19, 48]} />
          <meshStandardMaterial map={stamp} transparent roughness={0.9} />
        </mesh>
      )}
    </group>
  );
};

// ---------- people & animals ----------
export const Person3D: React.FC<{
  position?: [number, number, number];
  rotationY?: number;
  tunic?: string;
  walk?: number; // phase
  walking?: boolean;
  scale?: number;
  armsUp?: number;
}> = ({ position = [0, 0, 0], rotationY = 0, tunic = "#9a5a34", walk = 0, walking = false, scale = 1, armsUp = 0 }) => {
  const sw = walking ? Math.sin(walk) * 0.5 : 0;
  const skin = "#c98b5a";
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.11, 0.78, 0]} rotation={[sw * s, 0, 0]}>
          <mesh position={[0, -0.39, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.05, 0.78, 12]} />
            <meshStandardMaterial color={skin} roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.76, 0.04]} castShadow>
            <boxGeometry args={[0.11, 0.05, 0.22]} />
            <meshStandardMaterial color="#4a3020" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.32, 0.85, 20]} />
        <meshStandardMaterial color={tunic} roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.255, 0.025, 8, 24]} />
        <meshStandardMaterial color="#3a2414" roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.25, 1.5, 0]} rotation={[-sw * s - armsUp, 0, s * 0.12]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <capsuleGeometry args={[0.05, 0.5, 4, 10]} />
            <meshStandardMaterial color={skin} roughness={0.8} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.66, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.12, 12]} />
        <meshStandardMaterial color={skin} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.15, 24, 18]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.89, -0.01]} castShadow>
        <sphereGeometry args={[0.158, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.9} />
      </mesh>
    </group>
  );
};

export const Donkey3D: React.FC<{ position?: [number, number, number]; rotationY?: number; walk?: number }> = ({
  position = [0, 0, 0],
  rotationY = 0,
  walk = 0,
}) => {
  const fur = "#6f655c";
  const legs: [number, number, number][] = [
    [0.38, 0, 0.16],
    [0.38, 0, -0.16],
    [-0.38, 0, 0.16],
    [-0.38, 0, -0.16],
  ];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {legs.map((p, i) => (
        <group key={i} position={[p[0], 0.62, p[2]]} rotation={[0, 0, Math.sin(walk + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.35]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.045, 0.62, 10]} />
            <meshStandardMaterial color={fur} roughness={0.95} />
          </mesh>
          <mesh position={[0, -0.6, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.06, 0.06, 10]} />
            <meshStandardMaterial color="#2a2420" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.82, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.27, 0.62, 8, 16]} />
        <meshStandardMaterial color={fur} roughness={0.95} />
      </mesh>
      <mesh position={[0.58, 1.12, 0]} rotation={[0, 0, -0.75]} castShadow>
        <cylinderGeometry args={[0.11, 0.16, 0.5, 12]} />
        <meshStandardMaterial color={fur} roughness={0.95} />
      </mesh>
      <mesh position={[0.82, 1.28, 0]} rotation={[0, 0, -1.9]} castShadow>
        <capsuleGeometry args={[0.12, 0.3, 6, 12]} />
        <meshStandardMaterial color={fur} roughness={0.95} />
      </mesh>
      <mesh position={[0.98, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.1, 16, 12]} />
        <meshStandardMaterial color="#b8aea2" roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.72, 1.55, s * 0.07]} rotation={[s * 0.25, 0, -0.25]} castShadow>
          <coneGeometry args={[0.05, 0.32, 8]} />
          <meshStandardMaterial color={fur} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[-0.62, 0.72, 0]} rotation={[0, 0, -0.5]} castShadow>
        <cylinderGeometry args={[0.025, 0.015, 0.5, 6]} />
        <meshStandardMaterial color="#3a332e" />
      </mesh>
    </group>
  );
};

// ---------- architecture ----------
export const Building: React.FC<{
  position: [number, number, number];
  w: number;
  h: number;
  d?: number;
  tex: Tex;
  variant?: number;
  sign?: THREE.Texture;
  rotationY?: number;
}> = ({ position, w, h, d = 4, tex, variant = 0, sign, rotationY = 0 }) => {
  const wall = variant % 2 ? tex.plasterB : tex.plasterA;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial map={wall} roughness={0.95} />
      </mesh>
      {/* red dado band */}
      <mesh position={[0, 0.5, d / 2 + 0.005]} receiveShadow>
        <planeGeometry args={[w, 1]} />
        <meshStandardMaterial map={tex.plasterRed} roughness={0.95} />
      </mesh>
      {/* shop opening */}
      <mesh position={[0, 1.3, d / 2 + 0.01]}>
        <planeGeometry args={[w * 0.6, 2.6]} />
        <meshStandardMaterial color="#120c08" roughness={1} />
      </mesh>
      {/* masonry counter */}
      <mesh position={[0, 0.5, d / 2 + 0.3]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.62, 1, 0.5]} />
        <meshStandardMaterial map={tex.plasterB} roughness={0.95} />
      </mesh>
      {/* upper windows */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * w * 0.25, h - 1.2, d / 2 + 0.01]}>
          <planeGeometry args={[0.6, 0.8]} />
          <meshStandardMaterial color="#1a120c" />
        </mesh>
      ))}
      {/* beams / balcony */}
      <mesh position={[0, h - 2.1, d / 2 + 0.25]} castShadow>
        <boxGeometry args={[w * 0.9, 0.12, 0.5]} />
        <meshStandardMaterial map={tex.wood} roughness={0.9} />
      </mesh>
      {/* tiled roof */}
      <mesh position={[0, h + 0.35, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[w + 0.4, 0.15, d + 0.8]} />
        <meshStandardMaterial color="#a4482c" roughness={0.85} />
      </mesh>
      {Array.from({ length: Math.floor(w / 0.35) }).map((_, i) => (
        <mesh key={i} position={[-w / 2 + 0.17 + i * 0.35, h + 0.45, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, d + 0.8, 8, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color={i % 3 ? "#b4553a" : "#9a4430"} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {sign && (
        <mesh position={[0, 2.95, d / 2 + 0.02]}>
          <planeGeometry args={[w * 0.7, 0.55]} />
          <meshStandardMaterial map={sign} roughness={0.8} />
        </mesh>
      )}
    </group>
  );
};

export const Street: React.FC<{ tex: Tex; length?: number }> = ({ tex, length = 40 }) => {
  const t = useMemo(() => {
    const c = tex.basalt.clone();
    c.repeat.set(1, length / 6);
    c.needsUpdate = true;
    return c;
  }, [tex, length]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -length / 2 + 6]} receiveShadow>
        <planeGeometry args={[5, length]} />
        <meshStandardMaterial map={t} roughness={0.85} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 3.25, 0.2, -length / 2 + 6]} receiveShadow castShadow>
          <boxGeometry args={[1.5, 0.4, length]} />
          <meshStandardMaterial map={tex.plasterB} color="#bfb3a0" roughness={0.95} />
        </mesh>
      ))}
      {/* Pompeii stepping stones */}
      {[-1.4, 0, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 0.22, -2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.42, 0.45, 0.44, 7]} />
          <meshStandardMaterial color="#6a645c" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

export const Fire: React.FC<{ frame: number; position?: [number, number, number]; scale?: number }> = ({ frame, position = [0, 0, 0], scale = 1 }) => (
  <group position={position} scale={scale}>
    {Array.from({ length: 7 }).map((_, i) => {
      const fl = 1 + 0.25 * Math.sin(frame * 0.5 + i * 1.7) + 0.15 * Math.sin(frame * 1.3 + i);
      return (
        <mesh key={i} position={[(i - 3) * 0.12, 0.25 * fl, Math.sin(i * 2.1) * 0.1]} scale={[1, fl, 1]}>
          <coneGeometry args={[0.1, 0.5, 8]} />
          <meshBasicMaterial color={i % 2 ? "#ffb233" : "#ff6a1e"} transparent opacity={0.9} />
        </mesh>
      );
    })}
    <pointLight position={[0, 0.5, 0.3]} color="#ff8a3a" intensity={6 + Math.sin(frame * 0.7) * 1.5} distance={6} decay={1.6} />
  </group>
);

export const Oven3D: React.FC<{ tex: Tex; frame: number; fire?: boolean; ashLevel?: number }> = ({ tex, frame, fire = true, ashLevel = 0 }) => {
  const facade = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-2.2, 0);
    s.lineTo(2.2, 0);
    s.lineTo(2.2, 3.2);
    s.lineTo(-2.2, 3.2);
    s.lineTo(-2.2, 0);
    const hole = new THREE.Path();
    hole.moveTo(-0.85, 0.6);
    hole.lineTo(0.85, 0.6);
    hole.lineTo(0.85, 1.4);
    hole.absarc(0, 1.4, 0.85, 0, Math.PI, false);
    hole.lineTo(-0.85, 0.6);
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: false });
    const b = tex.brick.clone();
    b.repeat.set(0.5, 0.5);
    b.needsUpdate = true;
    return { g, b };
  }, [tex]);
  return (
    <group>
      <mesh geometry={facade.g} castShadow receiveShadow>
        <meshStandardMaterial map={facade.b} roughness={0.9} />
      </mesh>
      {/* dome behind */}
      <mesh position={[0, 0.6, -1.65]} castShadow receiveShadow>
        <sphereGeometry args={[1.55, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial map={tex.brick} roughness={0.9} side={THREE.BackSide} />
      </mesh>
      {/* oven floor */}
      <mesh position={[0, 0.601, -1.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.2, 3.6]} />
        <meshStandardMaterial color="#3a2a20" roughness={1} />
      </mesh>
      <mesh position={[0, 0.3, -0.8]} receiveShadow castShadow>
        <boxGeometry args={[4.4, 0.6, 3.2]} />
        <meshStandardMaterial map={tex.plasterB} roughness={0.95} />
      </mesh>
      {fire && <Fire frame={frame} position={[0, 0.6, -2.1]} scale={1.1} />}
      {ashLevel > 0 && (
        <mesh position={[0, 0.6 + ashLevel * 1.6, -1.0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.1, 3.5]} />
          <meshStandardMaterial map={tex.ash} roughness={1} />
        </mesh>
      )}
    </group>
  );
};

export const Mill3D: React.FC<{ tex: Tex; rot: number }> = ({ tex, rot }) => {
  const catillus = useMemo(() => {
    const p: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const y = i / 20;
      const r = 0.42 + 0.55 * Math.abs(y - 0.5) * 2;
      p.push(new THREE.Vector2(r, y * 1.9));
    }
    return new THREE.LatheGeometry(p, 48);
  }, []);
  const stone = "#7d7770";
  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.3, 1.4, 0.5, 40]} />
        <meshStandardMaterial map={tex.plasterB} color="#a89c8a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <coneGeometry args={[0.8, 1.5, 40]} />
        <meshStandardMaterial color={stone} roughness={0.9} />
      </mesh>
      <group position={[0, 0.65, 0]} rotation={[0, rot, 0]}>
        <mesh geometry={catillus} castShadow receiveShadow>
          <meshStandardMaterial map={tex.ash} color="#9a948c" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* wooden frame through the waist */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[3.4, 0.14, 0.14]} />
          <meshStandardMaterial map={tex.wood} roughness={0.9} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.6, 0.95, 0]} castShadow>
            <boxGeometry args={[0.14, 0.5, 0.5]} />
            <meshStandardMaterial map={tex.wood} roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export const Volcano: React.FC<{ tex: Tex }> = ({ tex }) => {
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(1.2, 9, 6, 96, 24, true);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const n = (random(`v${Math.round(x * 3)}_${Math.round(z * 3)}_${Math.round(y * 3)}`) - 0.5) * 0.45;
      const a = Math.atan2(z, x);
      const ridge = 0.25 * Math.sin(a * 9) * (1 - (y + 3) / 6);
      const k = 1 + n * 0.25 + ridge * 0.1;
      pos.setXYZ(i, x * k, y + n * 0.3, z * k);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={geo} position={[0, 3, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={tex.ash} color="#7a5a48" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 5.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.25, 32]} />
        <meshBasicMaterial color="#ff5a1a" />
      </mesh>
    </group>
  );
};

export const Bust3D: React.FC<{ tex: Tex; position?: [number, number, number] }> = ({ tex, position = [0, 0, 0] }) => {
  const torso = useMemo(() => {
    const p = [
      [0.0001, 0],
      [0.55, 0],
      [0.55, 0.15],
      [0.42, 0.25],
      [0.45, 0.3],
      [0.62, 0.55],
      [0.7, 0.95],
      [0.55, 1.2],
      [0.18, 1.3],
      [0.15, 1.45],
      [0.0001, 1.45],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(p, 48);
  }, []);
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial map={tex.marble} color="#cfc8bc" roughness={0.5} />
      </mesh>
      <mesh geometry={torso} position={[0, 1.2, 0]} scale={[1, 1, 0.7]} castShadow>
        <meshStandardMaterial map={tex.marble} roughness={0.35} />
      </mesh>
      <mesh position={[0, 2.95, 0]} scale={[1, 1.15, 1.05]} castShadow>
        <sphereGeometry args={[0.33, 32, 24]} />
        <meshStandardMaterial map={tex.marble} roughness={0.35} />
      </mesh>
      <mesh position={[0, 2.92, 0.31]} castShadow>
        <coneGeometry args={[0.05, 0.16, 8]} />
        <meshStandardMaterial map={tex.marble} roughness={0.35} />
      </mesh>
    </group>
  );
};

/** deterministic particles (dust, grain, ash) */
export const Particles: React.FC<{
  count: number;
  seed: string;
  frame: number;
  box: [number, number, number];
  center?: [number, number, number];
  speed?: number;
  size?: number;
  color?: string;
  opacity?: number;
}> = ({ count, seed, frame, box, center = [0, 0, 0], speed = 0.01, size = 0.03, color = "#fff", opacity = 0.8 }) => {
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const arr = useMemo(() => new Float32Array(count * 3), [count]);
  for (let i = 0; i < count; i++) {
    const ph = (random(`${seed}y${i}`) + frame * speed * (0.6 + random(`${seed}s${i}`) * 0.8)) % 1;
    arr[i * 3] = center[0] + (random(`${seed}x${i}`) - 0.5) * box[0] + Math.sin(frame * 0.02 + i) * 0.05;
    arr[i * 3 + 1] = center[1] + box[1] / 2 - ph * box[1];
    arr[i * 3 + 2] = center[2] + (random(`${seed}z${i}`) - 0.5) * box[2];
  }
  geo.setAttribute("position", new THREE.BufferAttribute(arr.slice(), 3));
  return (
    <points geometry={geo}>
      <pointsMaterial size={size} color={color} transparent opacity={opacity} depthWrite={false} />
    </points>
  );
};

/** Spotlight aimed at a specific point. */
export const SpotAt: React.FC<{
  position: [number, number, number];
  target: [number, number, number];
  intensity: number;
  color?: string;
  angle?: number;
  penumbra?: number;
}> = ({ position, target, intensity, color = "#fff", angle = 0.3, penumbra = 0.6 }) => {
  const obj = useMemo(() => new THREE.Object3D(), []);
  obj.position.set(...target);
  obj.updateMatrixWorld();
  return (
    <>
      <primitive object={obj} />
      <spotLight position={position} target={obj} intensity={intensity} color={color} angle={angle} penumbra={penumbra} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
    </>
  );
};
