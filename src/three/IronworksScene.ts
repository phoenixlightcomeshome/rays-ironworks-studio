import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { ThreeMFLoader } from 'three/addons/loaders/3MFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import {
  ConfiguratorState,
  FINISHES,
  LEAF_CATALOG,
  MATERIALS,
  POWDERS,
  PartArea,
  PicketAccentType,
  ScrollStyleType,
  getActiveSupplierSpecs,
  getEffectivePicketInches,
  getPicketLayoutStats,
} from '../types/configurator';

import {
  RELIEF_GRID,
  RELIEF_SEGMENTS,
  UploadedPhoto3D,
  getCachedPhotoRelief,
} from '../utils/photoRelief';

export type { UploadedPhoto3D };

export type SceneInteractionMode = 'rotate' | 'select' | 'draw' | 'accent';

function detectSoftwareGl(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function makeCanvasTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  srgb = false,
  maxAnisotropy = 1,
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) draw(ctx, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAnisotropy;
  return t;
}

function createBrushedTexture(maxAniso: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    (g, s) => {
      g.fillStyle = '#8a8a8a';
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 900; i++) {
        const y = Math.random() * s;
        const x = Math.random() * s;
        const len = 20 + Math.random() * 90;
        g.strokeStyle =
          Math.random() > 0.5
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(0,0,0,0.12)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + len, y + (Math.random() - 0.5) * 2);
        g.stroke();
      }
    },
    false,
    maxAniso,
  );
}

function createHammeredTexture(maxAniso: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    (g, s) => {
      g.fillStyle = '#808080';
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 130; i++) {
        const x = Math.random() * s;
        const y = Math.random() * s;
        const r = 4 + Math.random() * 12;
        const grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(0,0,0,0.3)');
        grad.addColorStop(0.7, 'rgba(255,255,255,0.12)');
        grad.addColorStop(1, 'rgba(128,128,128,0)');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
    },
    false,
    maxAniso,
  );
}

function createSpangleTexture(maxAniso: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    (g, s) => {
      g.fillStyle = '#8c8c8c';
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 90; i++) {
        const x = Math.random() * s;
        const y = Math.random() * s;
        const r = 5 + Math.random() * 14;
        const shade = 100 + Math.floor(Math.random() * 90);
        g.fillStyle = `rgba(${shade},${shade},${shade},0.55)`;
        g.beginPath();
        g.moveTo(x, y - r);
        g.lineTo(x + r * 0.9, y + r * 0.4);
        g.lineTo(x - r * 0.9, y + r * 0.4);
        g.closePath();
        g.fill();
      }
    },
    false,
    maxAniso,
  );
}

function createWoodTexture(maxAniso: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    (g, s) => {
      g.fillStyle = '#8b5a34';
      g.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 2) {
        const wave = Math.sin(y * 0.14) * 14 + Math.cos(y * 0.04) * 8;
        const shade = Math.floor(110 + wave + (Math.random() - 0.5) * 20);
        g.fillStyle = `rgb(${Math.min(255, shade + 24)},${Math.max(40, shade - 20)},${Math.max(20, shade - 55)})`;
        g.fillRect(0, y, s, 2);
      }
      for (let i = 0; i < 240; i++) {
        g.fillStyle = 'rgba(40,20,10,0.16)';
        g.fillRect(Math.random() * s, Math.random() * s, 18 + Math.random() * 45, 1);
      }
    },
    true,
    maxAniso,
  );
}

function createCortenTexture(maxAniso: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    (g, s) => {
      g.fillStyle = '#8b4524';
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 900; i++) {
        const v = Math.random();
        g.fillStyle =
          v > 0.65
            ? 'rgba(180,92,42,0.28)'
            : v > 0.3
              ? 'rgba(92,40,18,0.28)'
              : 'rgba(210,122,58,0.18)';
        g.fillRect(Math.random() * s, Math.random() * s, 3 + Math.random() * 8, 2 + Math.random() * 5);
      }
    },
    true,
    maxAniso,
  );
}

function createPaverTexture(maxAniso: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    512,
    (g, s) => {
      g.fillStyle = '#8f8a80';
      g.fillRect(0, 0, s, s);
      const n = 4;
      const cell = s / n;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const v = 138 + Math.floor(Math.random() * 22);
          g.fillStyle = `rgb(${v},${v - 4},${v - 12})`;
          g.fillRect(i * cell + 3, j * cell + 3, cell - 6, cell - 6);
          g.fillStyle = 'rgba(0,0,0,0.08)';
          g.fillRect(i * cell + 3, j * cell + cell - 12, cell - 6, 6);
        }
      }
      for (let k = 0; k < 500; k++) {
        g.fillStyle =
          Math.random() > 0.5
            ? 'rgba(0,0,0,0.05)'
            : 'rgba(255,255,255,0.05)';
        g.fillRect(Math.random() * s, Math.random() * s, 2, 2);
      }
    },
    true,
    maxAniso,
  );
}

function createGrassTexture(maxAniso: number): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    (g, s) => {
      g.fillStyle = '#40592c';
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 2600; i++) {
        const v = Math.random();
        g.fillStyle =
          v > 0.6
            ? 'rgba(120,150,70,0.35)'
            : v > 0.3
              ? 'rgba(30,50,20,0.35)'
              : 'rgba(70,100,45,0.3)';
        g.fillRect(Math.random() * s, Math.random() * s, 2, 2 + Math.random() * 3);
      }
    },
    true,
    maxAniso,
  );
}

function createSkyTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#6f9cc0');
    grad.addColorStop(0.45, '#a9bfce');
    grad.addColorStop(0.72, '#d9cfae');
    grad.addColorStop(1.0, '#e8d9b8');
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 512);
    const sun = g.createRadialGradient(760, 110, 0, 760, 110, 190);
    sun.addColorStop(0, 'rgba(255,240,200,0.85)');
    sun.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = sun;
    g.fillRect(0, 0, 1024, 512);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function createSignFaceTexture(maxAniso: number): {
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
} {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');
  if (g) {
    g.fillStyle = '#20242a';
    g.fillRect(0, 0, 1024, 512);
    g.strokeStyle = '#C9883D';
    g.lineWidth = 8;
    g.strokeRect(20, 20, 984, 472);
    g.fillStyle = '#F2EFE8';
    g.font = "700 84px 'Oswald', sans-serif";
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('YOUR NAME HERE', 512, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  return { canvas: c, texture: t };
}

function createPerforatedPanelTexture(
  pattern: string,
  maxAniso: number,
): THREE.CanvasTexture {
  return makeCanvasTexture(
    256,
    (g, s) => {
      g.fillStyle = '#c8ccd2';
      g.fillRect(0, 0, s, s);
      g.fillStyle = '#141518';
      if (
        pattern === 'perforated-straight' ||
        pattern === 'perforated-staggered' ||
        pattern === 'perforated-round-straight' ||
        pattern === 'perforated-round-staggered'
      ) {
        const isStaggered =
          pattern === 'perforated-staggered' ||
          pattern === 'perforated-round-staggered';
        const step = 28;
        for (let row = 0; row * step < s + step; row++) {
          const offset = isStaggered && row % 2 === 1 ? step * 0.5 : 0;
          for (let col = -1; col * step < s + step; col++) {
            g.beginPath();
            g.arc(col * step + offset, row * step, 7.5, 0, Math.PI * 2);
            g.fill();
          }
        }
      } else if (pattern === 'perforated-square') {
        const step = 32;
        for (let row = 0; row * step < s; row++) {
          for (let col = 0; col * step < s; col++) {
            g.fillRect(col * step + 7, row * step + 7, 18, 18);
          }
        }
      } else if (pattern === 'perforated-slotted') {
        const rowStep = 24;
        const colStep = 64;
        for (let row = 0; row * rowStep < s + rowStep; row++) {
          const offset = row % 2 === 1 ? colStep * 0.5 : 0;
          for (let col = -1; col * colStep < s + colStep; col++) {
            const x = col * colStep + offset + 10;
            const y = row * rowStep + 6;
            g.beginPath();
            g.roundRect(x, y, 42, 11, 5.5);
            g.fill();
          }
        }
      } else if (
        pattern === 'expanded' ||
        pattern === 'expanded-metal' ||
        pattern === 'flattened-expanded'
      ) {
        const isFlat = pattern === 'flattened-expanded';
        g.strokeStyle = isFlat ? '#dde2e8' : '#cfd5dc';
        g.lineWidth = isFlat ? 6.5 : 5;
        g.fillStyle = '#141417';
        g.fillRect(0, 0, s, s);
        const w = isFlat ? 36 : 32;
        const h = isFlat ? 20 : 18;
        for (let row = -1; row * h < s + h; row++) {
          const ox = row % 2 === 0 ? 0 : w / 2;
          for (let col = -1; col * w < s + w; col++) {
            const cx = col * w + ox;
            const cy = row * h;
            g.beginPath();
            g.moveTo(cx, cy - h / 2);
            g.lineTo(cx + w / 2, cy);
            g.lineTo(cx, cy + h / 2);
            g.lineTo(cx - w / 2, cy);
            g.closePath();
            g.stroke();
          }
        }
      } else if (pattern === 'grating' || pattern === 'bar-grating') {
        g.fillStyle = '#16171b';
        g.fillRect(0, 0, s, s);
        g.fillStyle = '#c4c9d1';
        for (let y = 0; y < s; y += 22) g.fillRect(0, y, s, 6);
        g.fillStyle = '#9aa1ab';
        for (let x = 0; x < s; x += 48) g.fillRect(x, 0, 5, s);
      } else if (pattern === 'interweave') {
        g.fillStyle = '#141518';
        g.fillRect(0, 0, s, s);
        const step = 24;
        for (let x = 0; x < s; x += step) {
          g.fillStyle = '#b4bac4';
          g.fillRect(x, 0, 5, s);
        }
        for (let y = 0; y < s; y += step) {
          g.fillStyle = '#d4d9e0';
          g.fillRect(0, y, s, 5);
          // Over/under weave highlight knuckles
          for (let x = 0; x < s; x += step) {
            if ((Math.round(x / step) + Math.round(y / step)) % 2 === 0) {
              g.fillStyle = '#9298a3';
              g.fillRect(x - 1, y - 1, 7, 7);
            }
          }
        }
      } else if (pattern === 'intercrimp' || pattern === 'lock-crimp') {
        const isLock = pattern === 'lock-crimp';
        g.fillStyle = '#15161a';
        g.fillRect(0, 0, s, s);
        const step = isLock ? 32 : 28;
        g.strokeStyle = '#c8cdd6';
        g.lineWidth = isLock ? 4 : 3.5;
        for (let x = 0; x < s; x += step) {
          g.beginPath();
          for (let y = 0; y <= s; y += 7) {
            const wave = isLock ? 0 : Math.sin((y / step) * Math.PI * 2) * 2.5;
            if (y === 0) g.moveTo(x + wave, y);
            else g.lineTo(x + wave, y);
          }
          g.stroke();
        }
        for (let y = 0; y < s; y += step) {
          g.beginPath();
          for (let x = 0; x <= s; x += 7) {
            const wave = isLock ? 0 : Math.cos((x / step) * Math.PI * 2) * 2.5;
            if (x === 0) g.moveTo(x, y + wave);
            else g.lineTo(x, y + wave);
          }
          g.stroke();
        }
        if (isLock) {
          g.fillStyle = '#e0e5ec';
          for (let x = 0; x < s; x += step) {
            for (let y = 0; y < s; y += step) {
              g.fillRect(x - 4, y - 4, 8, 8);
            }
          }
        }
      } else if (pattern === 'flat-top-mesh') {
        g.fillStyle = '#17181c';
        g.fillRect(0, 0, s, s);
        g.fillStyle = '#d8dde4';
        const step = 22;
        for (let x = 0; x < s; x += step) g.fillRect(x, 0, 5, s);
        for (let y = 0; y < s; y += step) g.fillRect(0, y, s, 5);
      } else if (pattern === 'louvered-slats') {
        g.fillStyle = '#17191d';
        g.fillRect(0, 0, s, s);
        for (let y = 0; y < s; y += 26) {
          const grad = g.createLinearGradient(0, y, 0, y + 20);
          grad.addColorStop(0, '#dde1e7');
          grad.addColorStop(0.7, '#9ba2ad');
          grad.addColorStop(1, '#4c515a');
          g.fillStyle = grad;
          g.fillRect(0, y + 2, s, 18);
        }
      } else {
        // generic wire mesh
        g.fillStyle = '#18181c';
        g.fillRect(0, 0, s, s);
        g.strokeStyle = '#c0c5ce';
        g.lineWidth = 3;
        for (let p = 0; p < s; p += 20) {
          g.beginPath();
          g.moveTo(p, 0);
          g.lineTo(p, s);
          g.stroke();
          g.beginPath();
          g.moveTo(0, p);
          g.lineTo(s, p);
          g.stroke();
        }
      }
    },
    true,
    maxAniso,
  );
}

type MaterialPair = { main: THREE.Material; dark: THREE.Material };

export class IronworksScene {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private modelGroup: THREE.Group;
  private keyLight: THREE.DirectionalLight;
  private groundDisc: THREE.Mesh;
  private grassPlane: THREE.Mesh;
  private gardenWall: THREE.Mesh;

  private envTexture: THREE.Texture | null = null;
  private texBrushed: THREE.CanvasTexture;
  private texHammered: THREE.CanvasTexture;
  private texSpangle: THREE.CanvasTexture;
  private texWood: THREE.CanvasTexture;
  private texCorten: THREE.CanvasTexture;
  private signCanvas: HTMLCanvasElement;
  private texSign: THREE.CanvasTexture;
  private panelPatternTextures = new Map<string, THREE.CanvasTexture>();
  private signImgCache = new Map<string, HTMLImageElement>();
  private model3dCache = new Map<string, THREE.Object3D>();
  private model3dLoading = new Set<string>();
  private settingTextures: THREE.Texture[] = [];

  private raycaster = new THREE.Raycaster();
  private pointerDownPos: { x: number; y: number } | null = null;

  private isSoftwareGl: boolean;
  private rafId = 0;
  private timerId = 0;
  private renderBusy = false;
  private renderDirty = false;
  private recording = false;
  private disposed = false;
  private currentState: ConfiguratorState;
  private uploadedPhoto: UploadedPhoto3D | null = null;
  private photoTextureCache = new Map<string, THREE.CanvasTexture>();

  private onContextLostCb?: () => void;
  private onContextRestoredCb?: () => void;
  private onSelectPartCb?: (area: PartArea) => void;
  private onSelectPicketCb?: (picketIndex: number) => void;
  private onPhotoLoadErrorCb?: (message: string) => void;
  private interactionMode: SceneInteractionMode = 'rotate';

  constructor(
    canvas: HTMLCanvasElement,
    initialState: ConfiguratorState,
    callbacks?: {
      onContextLost?: () => void;
      onContextRestored?: () => void;
      onSelectPart?: (area: PartArea) => void;
      onSelectPicket?: (picketIndex: number) => void;
      onPhotoLoadError?: (message: string) => void;
    },
  ) {
    this.canvas = canvas;
    this.currentState = initialState;
    this.onContextLostCb = callbacks?.onContextLost;
    this.onContextRestoredCb = callbacks?.onContextRestored;
    this.onSelectPartCb = callbacks?.onSelectPart;
    this.onSelectPicketCb = callbacks?.onSelectPicket;
    this.onPhotoLoadErrorCb = callbacks?.onPhotoLoadError;
    this.isSoftwareGl = detectSoftwareGl();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.setClearColor(0x8db2cc, 1);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && !initialState.simple;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8db2cc);
    this.camera = new THREE.PerspectiveCamera(42, 2, 0.1, 220);
    this.camera.position.set(10, 7, 14);

    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const roomEnv = new RoomEnvironment();
      this.envTexture = pmrem.fromScene(roomEnv, 0.04).texture;
      this.scene.environment = this.envTexture;
      roomEnv.dispose();
      pmrem.dispose();
    } catch {
      this.envTexture = null;
    }

    this.scene.add(new THREE.HemisphereLight(0xbfd4e6, 0x3a2f26, 0.58));
    this.keyLight = new THREE.DirectionalLight(0xffe0b3, 1.18);
    this.keyLight.position.set(9, 15, 7);
    this.keyLight.castShadow = !this.isSoftwareGl && !initialState.simple;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 60;
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    const fill = new THREE.DirectionalLight(0x9db8d6, 0.38);
    fill.position.set(-9, 6, -7);
    this.scene.add(fill);

    const bounce = new THREE.PointLight(0xffc98a, 0.35, 34);
    bounce.position.set(0, 2.5, 8);
    this.scene.add(bounce);

    this.texBrushed = createBrushedTexture(maxAniso);
    this.texHammered = createHammeredTexture(maxAniso);
    this.texSpangle = createSpangleTexture(maxAniso);
    this.texWood = createWoodTexture(maxAniso);
    this.texCorten = createCortenTexture(maxAniso);
    const signFace = createSignFaceTexture(maxAniso);
    this.signCanvas = signFace.canvas;
    this.texSign = signFace.texture;

    const skyTex = createSkyTexture();
    this.settingTextures.push(skyTex);
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(90, 24, 16),
      new THREE.MeshBasicMaterial({
        map: skyTex,
        side: THREE.BackSide,
        fog: false,
      }),
    );
    this.scene.add(sky);
    this.scene.fog = new THREE.Fog(0xd8cfb4, 34, 85);

    const grassTex = createGrassTexture(maxAniso);
    grassTex.repeat.set(10, 10);
    this.settingTextures.push(grassTex);
    this.grassPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshStandardMaterial({
        map: grassTex,
        roughness: 1,
        metalness: 0,
      }),
    );
    this.grassPlane.rotation.x = -Math.PI / 2;
    this.grassPlane.position.y = -0.02;
    this.grassPlane.receiveShadow = true;
    this.scene.add(this.grassPlane);

    const paverTex = createPaverTexture(maxAniso);
    paverTex.repeat.set(4, 4);
    this.settingTextures.push(paverTex);
    this.groundDisc = new THREE.Mesh(
      new THREE.CircleGeometry(17, 48),
      new THREE.MeshStandardMaterial({
        map: paverTex,
        roughness: 0.95,
        metalness: 0,
      }),
    );
    this.groundDisc.rotation.x = -Math.PI / 2;
    this.groundDisc.receiveShadow = true;
    this.scene.add(this.groundDisc);

    this.gardenWall = new THREE.Mesh(
      new THREE.BoxGeometry(46, 4.2, 0.7),
      new THREE.MeshStandardMaterial({
        color: 0xb3a184,
        roughness: 0.92,
        metalness: 0,
      }),
    );
    this.gardenWall.position.set(0, 2.1, -15);
    this.gardenWall.castShadow = true;
    this.gardenWall.receiveShadow = true;
    this.gardenWall.visible = !initialState.simple;
    this.scene.add(this.gardenWall);

    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.52;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 70;
    this.controls.autoRotateSpeed = 2.4;
    this.syncControlsState();
    this.controls.addEventListener('change', () => {
      if (!this.recording && !this.controls.autoRotate) {
        this.requestRender();
      }
    });

    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.resize(false);
    this.buildPiece(initialState, true);
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
    if (this.canvas.clientWidth > 0 && this.canvas.clientHeight > 0) {
      if (!this.currentState.frozenView) {
        this.controls.update();
      }
      this.renderer.render(this.scene, this.camera);
    }
    this.startLoop();
  }

  private syncControlsState() {
    const frozen = Boolean(this.currentState.frozenView);
    this.controls.autoRotate =
      !this.isSoftwareGl && Boolean(this.currentState.turntable) && !frozen;
    this.controls.enabled = !frozen && this.interactionMode !== 'draw';
  }

  public setInteractionMode(mode: SceneInteractionMode) {
    this.interactionMode = mode;
    this.syncControlsState();
  }

  public refreshSignFonts() {
    if (this.disposed) return;
    if (this.currentState.piece === 'sign-frame' || this.currentState.showSign) {
      this.drawSignFaceCanvas(this.currentState);
      this.requestRender();
    }
  }

  private handlePointerDown = (e: PointerEvent) => {
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.pointerDownPos) return;
    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    this.pointerDownPos = null;
    if (Math.hypot(dx, dy) > 8) return;
    if (this.interactionMode === 'draw') return;

    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.modelGroup.children, true);
    if (!hits.length) return;

    if (this.interactionMode === 'accent') {
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj && obj.userData.picketIndex === undefined) {
        obj = obj.parent;
      }
      if (obj && obj.userData.picketIndex !== undefined) {
        this.onSelectPicketCb?.(Number(obj.userData.picketIndex));
      }
      return;
    }

    if (!this.onSelectPartCb) return;
    let obj: THREE.Object3D | null = hits[0].object;
    while (obj && !obj.userData.partArea) {
      obj = obj.parent;
    }
    const area = obj?.userData.partArea as PartArea | undefined;
    if (area) {
      this.onSelectPartCb(area);
    }
  };

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.stopLoop();
    this.onContextLostCb?.();
  };

  private handleContextRestored = () => {
    if (this.uploadedPhoto) {
      this.buildPhotoReliefPiece(this.uploadedPhoto, false);
    } else {
      this.buildPiece(this.currentState);
    }
    this.resize();
    this.startLoop();
    this.onContextRestoredCb?.();
  };

  private buildMaterialPair(
    state: ConfiguratorState,
    overrideHex?: string | null,
  ): MaterialPair {
    const m = MATERIALS[state.material];
    const f = FINISHES[state.finish];
    const effectiveHex = overrideHex || state.customColor;

    // Glass physical material when glass material is chosen and not painted opaque
    if (m.isGlass && (!effectiveHex || state.finish === 'natural')) {
      const glassColor = effectiveHex
        ? new THREE.Color(effectiveHex).getHex()
        : m.color;
      const main = new THREE.MeshPhysicalMaterial({
        color: glassColor,
        roughness: 0.08,
        metalness: 0.05,
        transmission: 0.6,
        transparent: true,
        opacity: 0.48,
        ior: 1.5,
        reflectivity: 0.9,
        envMap: this.envTexture,
        envMapIntensity: 1.4,
      });
      const dark = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(glassColor).multiplyScalar(0.8),
        roughness: 0.12,
        metalness: 0.1,
        transmission: 0.42,
        transparent: true,
        opacity: 0.6,
        ior: 1.5,
        envMap: this.envTexture,
        envMapIntensity: 1.2,
      });
      return { main, dark };
    }

    // Wood grain material when wood material is chosen
    if (m.isWood && (state.finish === 'natural' || state.finish === 'clear-coat' || effectiveHex)) {
      const tint = effectiveHex
        ? new THREE.Color(effectiveHex).getHex()
        : 0xffffff;
      const main = new THREE.MeshStandardMaterial({
        color: tint,
        map: this.texWood,
        bumpMap: this.texWood,
        bumpScale: 0.008,
        roughness: state.finish === 'clear-coat' ? 0.38 : 0.72,
        metalness: 0.0,
        envMap: this.envTexture,
        envMapIntensity: 0.6,
      });
      const dark = new THREE.MeshStandardMaterial({
        color: new THREE.Color(tint).multiplyScalar(0.72),
        map: this.texWood,
        bumpMap: this.texWood,
        bumpScale: 0.008,
        roughness: 0.78,
        metalness: 0.0,
        envMap: this.envTexture,
        envMapIntensity: 0.5,
      });
      return { main, dark };
    }

    // Corten weathered steel
    if (m.texture === 'corten' && !effectiveHex && state.finish === 'natural') {
      const main = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: this.texCorten,
        bumpMap: this.texCorten,
        bumpScale: 0.01,
        roughness: 0.85,
        metalness: 0.28,
        envMap: this.envTexture,
        envMapIntensity: 0.65,
      });
      const dark = new THREE.MeshStandardMaterial({
        color: 0xb8b0a8,
        map: this.texCorten,
        bumpMap: this.texCorten,
        bumpScale: 0.01,
        roughness: 0.9,
        metalness: 0.22,
        envMap: this.envTexture,
        envMapIntensity: 0.55,
      });
      return { main, dark };
    }

    let color: number;
    if (effectiveHex) {
      color = new THREE.Color(effectiveHex).getHex();
    } else if (state.finish === 'powder-coat') {
      color = POWDERS[state.powder].color;
    } else if (f.color !== null) {
      color = f.color;
    } else {
      color = m.color;
    }

    const texKind = f.texture || m.texture;
    const bumpMap =
      texKind === 'hammered'
        ? this.texHammered
        : texKind === 'spangle'
          ? this.texSpangle
          : this.texBrushed;

    const metalness =
      state.finish === 'natural' ? m.metalness : f.metalness;
    const roughness =
      state.finish === 'natural' ? m.roughness : f.roughness;

    const main = new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness,
      roughnessMap: bumpMap,
      bumpMap,
      bumpScale: 0.005,
      envMap: this.envTexture,
      envMapIntensity: 1.05,
    });

    const darkColor = new THREE.Color(color).multiplyScalar(0.68);
    const dark = new THREE.MeshStandardMaterial({
      color: darkColor,
      metalness,
      roughness: Math.min(0.88, roughness + 0.08),
      roughnessMap: bumpMap,
      bumpMap,
      bumpScale: 0.005,
      envMap: this.envTexture,
      envMapIntensity: 0.9,
    });

    return { main, dark };
  }

  private getAreaMatResolver(state: ConfiguratorState) {
    const cache = new Map<PartArea, MaterialPair>();
    return (area: PartArea): MaterialPair => {
      const cached = cache.get(area);
      if (cached) return cached;
      const pair = this.buildMaterialPair(state, state.areaColors[area] || null);
      cache.set(area, pair);
      return pair;
    };
  }

  private tagArea<T extends THREE.Object3D>(obj: T, area: PartArea): T {
    obj.traverse((child) => {
      child.userData.partArea = area;
    });
    return obj;
  }

  private addBox(
    parent: THREE.Object3D,
    mat: THREE.Material,
    area: PartArea,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
  ) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    this.tagArea(m, area);
    parent.add(m);
    return m;
  }

  private addCyl(
    parent: THREE.Object3D,
    mat: THREE.Material,
    area: PartArea,
    rt: number,
    rb: number,
    h: number,
    x: number,
    y: number,
    z: number,
    seg = 20,
  ) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    this.tagArea(m, area);
    parent.add(m);
    return m;
  }

  private addSph(
    parent: THREE.Object3D,
    mat: THREE.Material,
    area: PartArea,
    r: number,
    x: number,
    y: number,
    z: number,
  ) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    this.tagArea(m, area);
    parent.add(m);
    return m;
  }

  private addTorus(
    parent: THREE.Object3D,
    mat: THREE.Material,
    area: PartArea,
    R: number,
    t: number,
    x: number,
    y: number,
    z: number,
    arc = Math.PI * 2,
  ) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(R, t, 12, 28, arc), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    this.tagArea(m, area);
    parent.add(m);
    return m;
  }

  private makeFinial(
    parent: THREE.Object3D,
    mat: THREE.Material,
    type: string,
    x: number,
    y: number,
    z: number,
  ) {
    if (type === 'none') return;
    if (type === 'ball') {
      this.addCyl(parent, mat, 'finials', 0.09, 0.12, 0.22, x, y + 0.11, z, 12);
      this.addSph(parent, mat, 'finials', 0.2, x, y + 0.38, z);
    } else if (type === 'spear') {
      this.addCyl(parent, mat, 'finials', 0.08, 0.12, 0.2, x, y + 0.1, z, 12);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 16), mat);
      cone.position.set(x, y + 0.46, z);
      cone.castShadow = true;
      this.tagArea(cone, 'finials');
      parent.add(cone);
    } else if (type === 'scroll') {
      const t = this.addTorus(
        parent,
        mat,
        'finials',
        0.16,
        0.05,
        x,
        y + 0.22,
        z,
        Math.PI * 1.5,
      );
      t.rotation.z = Math.PI * 0.75;
    } else if (type === 'flat-cap') {
      this.addBox(parent, mat, 'finials', 0.56, 0.07, 0.56, x, y + 0.015, z);
      this.addBox(parent, mat, 'finials', 0.64, 0.08, 0.64, x, y + 0.08, z);
    } else if (type === 'pyramid-cap') {
      this.addBox(parent, mat, 'finials', 0.62, 0.08, 0.62, x, y + 0.04, z);
      const pyr = new THREE.Mesh(new THREE.ConeGeometry(0.43, 0.3, 4), mat);
      pyr.rotation.y = Math.PI / 4;
      pyr.position.set(x, y + 0.23, z);
      pyr.castShadow = true;
      this.tagArea(pyr, 'finials');
      parent.add(pyr);
    } else if (type === 'squared-dome-cap') {
      this.addBox(parent, mat, 'finials', 0.62, 0.08, 0.62, x, y + 0.04, z);
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
        mat,
      );
      dome.position.set(x, y + 0.08, z);
      dome.castShadow = true;
      this.tagArea(dome, 'finials');
      parent.add(dome);
    } else if (type === 'ball-collar-cap') {
      this.addBox(parent, mat, 'finials', 0.6, 0.08, 0.6, x, y + 0.04, z);
      this.addCyl(parent, mat, 'finials', 0.14, 0.22, 0.14, x, y + 0.15, z, 14);
      this.addCyl(parent, mat, 'finials', 0.1, 0.1, 0.1, x, y + 0.25, z, 14);
      this.addSph(parent, mat, 'finials', 0.21, x, y + 0.44, z);
    } else if (type === 'acorn-cap') {
      this.addBox(parent, mat, 'finials', 0.6, 0.07, 0.6, x, y + 0.035, z);
      this.addCyl(parent, mat, 'finials', 0.16, 0.22, 0.14, x, y + 0.14, z, 14);
      const cup = this.addTorus(parent, mat, 'finials', 0.17, 0.055, x, y + 0.22, z);
      cup.rotation.x = Math.PI / 2;
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 14), mat);
      nut.scale.set(0.95, 1.45, 0.95);
      nut.position.set(x, y + 0.36, z);
      nut.castShadow = true;
      this.tagArea(nut, 'finials');
      parent.add(nut);
      const nib = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 10), mat);
      nib.position.set(x, y + 0.61, z);
      this.tagArea(nib, 'finials');
      parent.add(nib);
    } else if (type === 'pineapple-cap') {
      this.addBox(parent, mat, 'finials', 0.62, 0.08, 0.62, x, y + 0.04, z);
      this.addCyl(parent, mat, 'finials', 0.12, 0.2, 0.12, x, y + 0.14, z, 12);
      const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 1), mat);
      body.scale.set(0.9, 1.38, 0.9);
      body.position.set(x, y + 0.44, z);
      body.castShadow = true;
      this.tagArea(body, 'finials');
      parent.add(body);
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 6), mat);
        leaf.position.set(x + Math.cos(ang) * 0.07, y + 0.72, z + Math.sin(ang) * 0.07);
        leaf.rotation.z = -Math.cos(ang) * 0.35;
        leaf.rotation.x = Math.sin(ang) * 0.35;
        this.tagArea(leaf, 'finials');
        parent.add(leaf);
      }
    } else if (type === 'urn-cap') {
      this.addBox(parent, mat, 'finials', 0.6, 0.08, 0.6, x, y + 0.04, z);
      const pts = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.18, 0.0),
        new THREE.Vector2(0.1, 0.1),
        new THREE.Vector2(0.22, 0.28),
        new THREE.Vector2(0.2, 0.42),
        new THREE.Vector2(0.11, 0.5),
        new THREE.Vector2(0.16, 0.56),
        new THREE.Vector2(0.05, 0.64),
        new THREE.Vector2(0.0, 0.68),
      ];
      const urn = new THREE.Mesh(new THREE.LatheGeometry(pts, 18), mat);
      urn.position.set(x, y + 0.08, z);
      urn.castShadow = true;
      this.tagArea(urn, 'finials');
      parent.add(urn);
    } else if (type === 'pagoda-cap') {
      this.addBox(parent, mat, 'finials', 0.62, 0.07, 0.62, x, y + 0.035, z);
      const tier1 = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.18, 4), mat);
      tier1.rotation.y = Math.PI / 4;
      tier1.position.set(x, y + 0.16, z);
      tier1.castShadow = true;
      this.tagArea(tier1, 'finials');
      parent.add(tier1);
      const tier2 = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.2, 4), mat);
      tier2.rotation.y = Math.PI / 4;
      tier2.position.set(x, y + 0.31, z);
      tier2.castShadow = true;
      this.tagArea(tier2, 'finials');
      parent.add(tier2);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 4), mat);
      spire.rotation.y = Math.PI / 4;
      spire.position.set(x, y + 0.48, z);
      this.tagArea(spire, 'finials');
      parent.add(spire);
    } else if (type === 'pinnacle-cap') {
      this.addBox(parent, mat, 'finials', 0.62, 0.08, 0.62, x, y + 0.04, z);
      this.addBox(parent, mat, 'finials', 0.46, 0.08, 0.46, x, y + 0.12, z);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.62, 4), mat);
      spire.rotation.y = Math.PI / 4;
      spire.position.set(x, y + 0.46, z);
      spire.castShadow = true;
      this.tagArea(spire, 'finials');
      parent.add(spire);
    } else if (type === 'colonial-cap') {
      this.addBox(parent, mat, 'finials', 0.66, 0.07, 0.66, x, y + 0.035, z);
      this.addBox(parent, mat, 'finials', 0.54, 0.07, 0.54, x, y + 0.105, z);
      this.addBox(parent, mat, 'finials', 0.42, 0.07, 0.42, x, y + 0.175, z);
      this.addSph(parent, mat, 'finials', 0.12, x, y + 0.25, z);
    }
  }

  private makeScroll(
    parent: THREE.Object3D,
    mat: THREE.Material,
    size: number,
    x: number,
    y: number,
    z: number,
    scrollStyle: ScrollStyleType = 's-scroll',
  ) {
    const g = new THREE.Group();
    if (scrollStyle === 'c-scroll') {
      const c = this.addTorus(g, mat, 'scrolls', size * 0.52, size * 0.1, 0, 0, 0, Math.PI * 1.45);
      c.rotation.z = -Math.PI * 0.22;
      this.addSph(g, mat, 'scrolls', size * 0.14, size * 0.36, size * 0.35, 0);
      this.addSph(g, mat, 'scrolls', size * 0.14, size * 0.36, -size * 0.35, 0);
    } else if (scrollStyle === 'double-scroll') {
      [-size * 0.3, size * 0.3].forEach((ox, idx) => {
        const arc = this.addTorus(g, mat, 'scrolls', size * 0.38, size * 0.09, ox, 0, 0, Math.PI * 1.3);
        arc.rotation.z = idx === 0 ? Math.PI * 0.35 : -Math.PI * 0.65;
      });
    } else if (scrollStyle === 'ribbon-scroll') {
      const a = this.addTorus(g, mat, 'scrolls', size * 0.48, size * 0.13, -size * 0.26, size * 0.26, 0, Math.PI);
      a.scale.z = 2.1;
      const b = this.addTorus(g, mat, 'scrolls', size * 0.48, size * 0.13, size * 0.26, -size * 0.26, 0, Math.PI);
      b.rotation.z = Math.PI;
      b.scale.z = 2.1;
    } else if (scrollStyle === 'scroll-leaf' || scrollStyle === 'waterleaf-scroll') {
      const a = this.addTorus(g, mat, 'scrolls', size * 0.48, size * 0.1, -size * 0.26, size * 0.26, 0, Math.PI);
      a.rotation.z = 0;
      const b = this.addTorus(g, mat, 'scrolls', size * 0.48, size * 0.1, size * 0.26, -size * 0.26, 0, Math.PI);
      b.rotation.z = Math.PI;
      this.makeLeaf(g, mat, size * 0.34, 0, 0.04, 0.05, 0.55);
      if (scrollStyle === 'waterleaf-scroll') {
        this.makeLeaf(g, mat, size * 0.3, -size * 0.36, -size * 0.1, 0.05, -0.8);
        this.makeLeaf(g, mat, size * 0.3, size * 0.36, size * 0.1, 0.05, 2.3);
      }
    } else if (scrollStyle === 'snub-end-s') {
      const a = this.addTorus(g, mat, 'scrolls', size * 0.48, size * 0.1, -size * 0.26, size * 0.26, 0, Math.PI * 1.15);
      a.rotation.z = 0;
      const b = this.addTorus(g, mat, 'scrolls', size * 0.48, size * 0.1, size * 0.26, -size * 0.26, 0, Math.PI * 1.15);
      b.rotation.z = Math.PI;
      this.addSph(g, mat, 'scrolls', size * 0.16, -size * 0.62, size * 0.15, 0);
      this.addSph(g, mat, 'scrolls', size * 0.16, size * 0.62, -size * 0.15, 0);
    } else if (scrollStyle === 'fishtail-s') {
      const a = this.addTorus(g, mat, 'scrolls', size * 0.48, size * 0.1, -size * 0.25, size * 0.25, 0, Math.PI);
      a.rotation.z = 0;
      const b = this.addTorus(g, mat, 'scrolls', size * 0.48, size * 0.1, size * 0.25, -size * 0.25, 0, Math.PI);
      b.rotation.z = Math.PI;
      const f1 = this.addBox(g, mat, 'scrolls', size * 0.28, size * 0.14, size * 0.22, -size * 0.68, size * 0.22, 0);
      f1.rotation.z = 0.5;
      const f2 = this.addBox(g, mat, 'scrolls', size * 0.28, size * 0.14, size * 0.22, size * 0.68, -size * 0.22, 0);
      f2.rotation.z = 0.5;
    } else if (scrollStyle === 'beveled-scroll') {
      const a = this.addTorus(g, mat, 'scrolls', size * 0.5, size * 0.12, -size * 0.26, size * 0.26, 0, Math.PI);
      a.scale.z = 1.6;
      const b = this.addTorus(g, mat, 'scrolls', size * 0.5, size * 0.12, size * 0.26, -size * 0.26, 0, Math.PI);
      b.rotation.z = Math.PI;
      b.scale.z = 1.6;
      const centerCollar = this.addBox(g, mat, 'scrolls', size * 0.24, size * 0.24, size * 0.24, 0, 0, 0);
      centerCollar.rotation.z = Math.PI / 4;
    } else if (scrollStyle === 'heart-scroll') {
      const l = this.addTorus(g, mat, 'scrolls', size * 0.34, size * 0.09, -size * 0.3, size * 0.22, 0, Math.PI * 1.25);
      l.rotation.z = 0.2;
      const r = this.addTorus(g, mat, 'scrolls', size * 0.34, size * 0.09, size * 0.3, size * 0.22, 0, Math.PI * 1.25);
      r.rotation.z = Math.PI - 0.2 - Math.PI * 1.25;
      const tailL = this.addBox(g, mat, 'scrolls', size * 0.1, size * 0.62, size * 0.1, -size * 0.26, -size * 0.22, 0);
      tailL.rotation.z = 0.45;
      const tailR = this.addBox(g, mat, 'scrolls', size * 0.1, size * 0.62, size * 0.1, size * 0.26, -size * 0.22, 0);
      tailR.rotation.z = -0.45;
    } else if (scrollStyle === 'triple-spiral') {
      this.addTorus(g, mat, 'scrolls', size * 0.32, size * 0.08, 0, size * 0.36, 0, Math.PI * 1.6);
      this.addTorus(g, mat, 'scrolls', size * 0.28, size * 0.08, -size * 0.36, -size * 0.24, 0, Math.PI * 1.6);
      this.addTorus(g, mat, 'scrolls', size * 0.28, size * 0.08, size * 0.36, -size * 0.24, 0, Math.PI * 1.6);
    } else if (scrollStyle === 'vine-scroll') {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-size * 0.55, -size * 0.55, 0),
        new THREE.Vector3(-size * 0.15, size * 0.25, 0),
        new THREE.Vector3(size * 0.25, -size * 0.15, 0),
        new THREE.Vector3(size * 0.58, size * 0.55, 0),
      ]);
      const vine = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, size * 0.07, 8), mat);
      vine.castShadow = true;
      g.add(vine);
      this.makeLeaf(g, mat, size * 0.3, -size * 0.22, size * 0.25, 0.04, 0.6);
      this.makeLeaf(g, mat, size * 0.3, size * 0.26, -size * 0.12, 0.04, -0.7);
      this.addTorus(g, mat, 'scrolls', size * 0.2, size * 0.06, size * 0.42, size * 0.42, 0, Math.PI * 1.5);
    } else if (scrollStyle === 'bell-scroll') {
      const l = this.addTorus(g, mat, 'scrolls', size * 0.46, size * 0.095, -size * 0.28, 0, 0, Math.PI * 1.15);
      l.rotation.z = -Math.PI * 0.55;
      const r = this.addTorus(g, mat, 'scrolls', size * 0.46, size * 0.095, size * 0.28, 0, 0, Math.PI * 1.15);
      r.rotation.z = Math.PI * 0.45;
      this.addBox(g, mat, 'scrolls', size * 0.22, size * 0.16, size * 0.2, 0, size * 0.38, 0);
      this.addBox(g, mat, 'scrolls', size * 0.22, size * 0.16, size * 0.2, 0, -size * 0.38, 0);
    } else if (scrollStyle === 'collar-double-c') {
      const l = this.addTorus(g, mat, 'scrolls', size * 0.42, size * 0.09, -size * 0.26, 0, 0, Math.PI * 1.4);
      l.rotation.z = Math.PI * 0.3;
      const r = this.addTorus(g, mat, 'scrolls', size * 0.42, size * 0.09, size * 0.26, 0, 0, Math.PI * 1.4);
      r.rotation.z = -Math.PI * 0.7;
      this.addBox(g, mat, 'scrolls', size * 0.26, size * 0.32, size * 0.24, 0, 0, 0);
    } else {
      const a = this.addTorus(
        g,
        mat,
        'scrolls',
        size * 0.5,
        size * 0.11,
        -size * 0.28,
        size * 0.28,
        0,
        Math.PI,
      );
      a.rotation.z = 0;
      const b = this.addTorus(
        g,
        mat,
        'scrolls',
        size * 0.5,
        size * 0.11,
        size * 0.28,
        -size * 0.28,
        0,
        Math.PI,
      );
      b.rotation.z = Math.PI;
    }
    g.position.set(x, y, z);
    this.tagArea(g, 'scrolls');
    parent.add(g);
    return g;
  }

  private makeRing(
    parent: THREE.Object3D,
    mat: THREE.Material,
    R: number,
    x: number,
    y: number,
    z: number,
  ) {
    return this.addTorus(parent, mat, 'scrolls', R, 0.06, x, y, z);
  }

  private makeLeaf(
    parent: THREE.Object3D,
    mat: THREE.Material,
    size: number,
    x: number,
    y: number,
    z: number,
    rotZ = 0,
  ) {
    const shape = new THREE.Shape();
    shape.moveTo(0, -size);
    shape.quadraticCurveTo(size * 0.55, -size * 0.2, 0, size);
    shape.quadraticCurveTo(-size * 0.55, -size * 0.2, 0, -size);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: size * 0.08,
      bevelEnabled: false,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.z = rotZ;
    m.castShadow = true;
    this.tagArea(m, 'scrolls');
    parent.add(m);
    return m;
  }

  private makeCatalogLeaf(
    parent: THREE.Object3D,
    mat: THREE.Material,
    shapeKind: 'acanthus' | 'grape' | 'oak' | 'maple' | 'ivy' | 'floral' | 'spear' | 'double',
    size: number,
    x: number,
    y: number,
    z: number,
    rotZ = 0,
  ) {
    const g = new THREE.Group();
    if (shapeKind === 'double') {
      this.makeCatalogLeaf(g, mat, 'acanthus', size * 0.88, -size * 0.22, 0, 0, 0.42);
      this.makeCatalogLeaf(g, mat, 'acanthus', size * 0.88, size * 0.22, 0, 0, -0.42);
      this.addBox(g, mat, 'scrolls', size * 0.24, size * 0.18, size * 0.18, 0, -size * 0.55, 0.03);
    } else if (shapeKind === 'ivy') {
      const stem = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -size * 0.9, 0),
        new THREE.Vector3(-size * 0.22, -size * 0.2, 0),
        new THREE.Vector3(size * 0.2, size * 0.45, 0),
        new THREE.Vector3(0, size * 0.95, 0),
      ]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(stem, 14, size * 0.05, 8), mat);
      tube.castShadow = true;
      g.add(tube);
      this.makeLeaf(g, mat, size * 0.42, -size * 0.26, -size * 0.15, 0.03, 0.65);
      this.makeLeaf(g, mat, size * 0.42, size * 0.28, size * 0.3, 0.03, -0.6);
      this.makeLeaf(g, mat, size * 0.36, 0.02, size * 0.88, 0.03, 0.1);
    } else {
      const s = new THREE.Shape();
      if (shapeKind === 'acanthus') {
        s.moveTo(0, -size);
        s.lineTo(size * 0.38, -size * 0.55);
        s.lineTo(size * 0.22, -size * 0.35);
        s.lineTo(size * 0.52, -size * 0.05);
        s.lineTo(size * 0.26, size * 0.2);
        s.lineTo(size * 0.44, size * 0.55);
        s.quadraticCurveTo(size * 0.2, size * 0.85, 0, size * 1.05);
        s.quadraticCurveTo(-size * 0.2, size * 0.85, -size * 0.44, size * 0.55);
        s.lineTo(-size * 0.26, size * 0.2);
        s.lineTo(-size * 0.52, -size * 0.05);
        s.lineTo(-size * 0.22, -size * 0.35);
        s.lineTo(-size * 0.38, -size * 0.55);
        s.closePath();
      } else if (shapeKind === 'oak') {
        s.moveTo(0, -size);
        s.bezierCurveTo(size * 0.45, -size * 0.7, size * 0.15, -size * 0.45, size * 0.48, -size * 0.25);
        s.bezierCurveTo(size * 0.52, 0.0, size * 0.18, size * 0.1, size * 0.45, size * 0.38);
        s.bezierCurveTo(size * 0.38, size * 0.68, size * 0.15, size * 0.85, 0, size);
        s.bezierCurveTo(-size * 0.15, size * 0.85, -size * 0.38, size * 0.68, -size * 0.45, size * 0.38);
        s.bezierCurveTo(-size * 0.18, size * 0.1, -size * 0.52, 0.0, -size * 0.48, -size * 0.25);
        s.bezierCurveTo(-size * 0.15, -size * 0.45, -size * 0.45, -size * 0.7, 0, -size);
      } else if (shapeKind === 'maple' || shapeKind === 'grape') {
        const w = shapeKind === 'grape' ? 0.75 : 0.85;
        s.moveTo(0, -size * 0.85);
        s.lineTo(size * 0.12, -size * 0.45);
        s.lineTo(size * w * 0.75, -size * 0.45);
        s.lineTo(size * w * 0.42, -size * 0.05);
        s.lineTo(size * w, size * 0.25);
        s.lineTo(size * 0.32, size * 0.38);
        s.lineTo(0, size * 0.98);
        s.lineTo(-size * 0.32, size * 0.38);
        s.lineTo(-size * w, size * 0.25);
        s.lineTo(-size * w * 0.42, -size * 0.05);
        s.lineTo(-size * w * 0.75, -size * 0.45);
        s.lineTo(-size * 0.12, -size * 0.45);
        s.closePath();
      } else if (shapeKind === 'spear') {
        s.moveTo(0, -size);
        s.quadraticCurveTo(size * 0.32, -size * 0.35, size * 0.18, size * 0.3);
        s.lineTo(0, size * 1.15);
        s.lineTo(-size * 0.18, size * 0.3);
        s.quadraticCurveTo(-size * 0.32, -size * 0.35, 0, -size);
      } else {
        // floral / ornamental
        s.moveTo(0, -size * 0.9);
        s.bezierCurveTo(size * 0.65, -size * 0.45, size * 0.6, size * 0.35, 0, size * 0.95);
        s.bezierCurveTo(-size * 0.6, size * 0.35, -size * 0.65, -size * 0.45, 0, -size * 0.9);
      }
      const geo = new THREE.ExtrudeGeometry(s, {
        depth: size * 0.11,
        bevelEnabled: true,
        bevelThickness: size * 0.02,
        bevelSize: size * 0.02,
        bevelSegments: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      g.add(mesh);
      // Center forged vein rib
      this.addCyl(g, mat, 'scrolls', size * 0.025, size * 0.05, size * 1.45, 0, -size * 0.05, size * 0.08, 6);
    }
    g.position.set(x, y, z);
    g.rotation.z = rotZ;
    this.tagArea(g, 'scrolls');
    parent.add(g);
    return g;
  }

  private makeBranch(
    parent: THREE.Object3D,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    len: number,
  ) {
    const g = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(len * 0.3, len * 0.25, 0),
      new THREE.Vector3(len * 0.7, len * 0.2, 0),
      new THREE.Vector3(len, len * 0.45, 0),
    ]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.05, 8), mat);
    tube.castShadow = true;
    g.add(tube);
    this.makeLeaf(g, mat, len * 0.22, len * 0.35, len * 0.3, 0.06, 0.7);
    this.makeLeaf(g, mat, len * 0.22, len * 0.65, len * 0.28, 0.06, -0.5);
    this.makeLeaf(g, mat, len * 0.2, len * 0.95, len * 0.5, 0.06, 0.3);
    g.position.set(x, y, z);
    this.tagArea(g, 'scrolls');
    parent.add(g);
    return g;
  }

  private makeMedallion(
    parent: THREE.Object3D,
    mat: THREE.Material,
    R: number,
    x: number,
    y: number,
    z: number,
  ) {
    const g = new THREE.Group();
    const disc = this.addCyl(g, mat, 'scrolls', R, R, 0.07, 0, 0, 0, 28);
    disc.rotation.x = Math.PI / 2;
    this.addTorus(g, mat, 'scrolls', R * 0.78, 0.045, 0, 0, 0.05);
    const hub = this.addSph(g, mat, 'scrolls', R * 0.22, 0, 0, 0.06);
    hub.scale.z = 0.5;
    g.position.set(x, y, z);
    this.tagArea(g, 'scrolls');
    parent.add(g);
    return g;
  }

  private makeRosette(
    parent: THREE.Object3D,
    mat: THREE.Material,
    R: number,
    x: number,
    y: number,
    z: number,
  ) {
    const g = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      this.makeLeaf(
        g,
        mat,
        R * 0.55,
        Math.cos(ang) * R * 0.45,
        Math.sin(ang) * R * 0.45,
        0,
        ang - Math.PI / 2,
      );
    }
    this.addSph(g, mat, 'scrolls', R * 0.24, 0, 0, 0.04);
    g.position.set(x, y, z);
    this.tagArea(g, 'scrolls');
    parent.add(g);
  }

  private makeBasket(
    parent: THREE.Object3D,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
  ) {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.45, 0),
        new THREE.Vector3(Math.cos(ang) * 0.24, -0.15, Math.sin(ang) * 0.24),
        new THREE.Vector3(Math.cos(ang + 0.7) * 0.24, 0.15, Math.sin(ang + 0.7) * 0.24),
        new THREE.Vector3(0, 0.45, 0),
      ]);
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.035, 6), mat);
      m.castShadow = true;
      g.add(m);
    }
    g.position.set(x, y, z);
    this.tagArea(g, 'pickets');
    parent.add(g);
  }

  private makeTwistedBar(
    parent: THREE.Object3D,
    mat: THREE.Material,
    h: number,
    x: number,
    y: number,
    z: number,
  ) {
    const g = new THREE.Group();
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const segH = h / steps;
      const seg = this.addBox(
        g,
        mat,
        'pickets',
        0.16,
        segH * 1.05,
        0.16,
        0,
        -h / 2 + segH * (i + 0.5),
        0,
      );
      seg.rotation.y = (i / steps) * Math.PI * 2;
    }
    g.position.set(x, y, z);
    this.tagArea(g, 'pickets');
    parent.add(g);
  }

  private makeFleurDeLis(
    parent: THREE.Object3D,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
  ) {
    const g = new THREE.Group();
    this.makeLeaf(g, mat, 0.36, 0, 0.36, 0, 0);
    this.makeLeaf(g, mat, 0.26, -0.22, 0.22, 0, 0.65);
    this.makeLeaf(g, mat, 0.26, 0.22, 0.22, 0, -0.65);
    this.addBox(g, mat, 'finials', 0.34, 0.09, 0.12, 0, 0.08, 0);
    g.position.set(x, y, z);
    this.tagArea(g, 'finials');
    parent.add(g);
  }

  private makePost(
    parent: THREE.Object3D,
    getArea: (a: PartArea) => MaterialPair,
    style: string,
    finial: string,
    x: number,
    h: number,
    z: number,
  ) {
    const postMat = getArea('posts');
    const finMat = getArea('finials');
    if (style === 'round') {
      this.addCyl(parent, postMat.dark, 'posts', 0.26, 0.3, h, x, h / 2, z, 16);
    } else if (style === 'ornate') {
      this.addBox(parent, postMat.dark, 'posts', 0.5, h, 0.5, x, h / 2, z);
      this.addBox(parent, finMat.main, 'finials', 0.64, 0.18, 0.64, x, h * 0.72, z);
      this.addBox(parent, finMat.main, 'finials', 0.64, 0.14, 0.64, x, h * 0.3, z);
    } else if (style === 'i-beam') {
      this.addBox(parent, postMat.dark, 'posts', 0.44, h, 0.09, x, h / 2, z + 0.19);
      this.addBox(parent, postMat.dark, 'posts', 0.44, h, 0.09, x, h / 2, z - 0.19);
      this.addBox(parent, postMat.main, 'posts', 0.09, h, 0.32, x, h / 2, z);
    } else if (style === 'w-beam') {
      this.addBox(parent, postMat.dark, 'posts', 0.64, h, 0.1, x, h / 2, z + 0.23);
      this.addBox(parent, postMat.dark, 'posts', 0.64, h, 0.1, x, h / 2, z - 0.23);
      this.addBox(parent, postMat.main, 'posts', 0.11, h, 0.42, x, h / 2, z);
    } else if (style === 'rectangle') {
      this.addBox(parent, postMat.dark, 'posts', 0.38, h, 0.68, x, h / 2, z);
    } else if (style === 'octagon') {
      const oct = this.addCyl(parent, postMat.dark, 'posts', 0.3, 0.3, h, x, h / 2, z, 8);
      oct.rotation.y = Math.PI / 8;
    } else if (style === 'triangle') {
      const tri = this.addCyl(parent, postMat.dark, 'posts', 0.34, 0.34, h, x, h / 2, z, 3);
      tri.rotation.y = Math.PI / 6;
    } else if (style === 'angle-iron') {
      this.addBox(parent, postMat.dark, 'posts', 0.5, h, 0.09, x, h / 2, z - 0.2);
      this.addBox(parent, postMat.main, 'posts', 0.09, h, 0.5, x - 0.2, h / 2, z);
    } else if (style === 'channel-post') {
      this.addBox(parent, postMat.dark, 'posts', 0.52, h, 0.09, x, h / 2, z - 0.2);
      this.addBox(parent, postMat.main, 'posts', 0.09, h, 0.44, x - 0.215, h / 2, z);
      this.addBox(parent, postMat.main, 'posts', 0.09, h, 0.44, x + 0.215, h / 2, z);
    } else if (style === 'c-channel') {
      this.addBox(parent, postMat.dark, 'posts', 0.52, h, 0.09, x, h / 2, z - 0.21);
      this.addBox(parent, postMat.main, 'posts', 0.09, h, 0.46, x - 0.215, h / 2, z);
      this.addBox(parent, postMat.main, 'posts', 0.09, h, 0.46, x + 0.215, h / 2, z);
      this.addBox(parent, postMat.dark, 'posts', 0.14, h, 0.07, x - 0.16, h / 2, z + 0.21);
      this.addBox(parent, postMat.dark, 'posts', 0.14, h, 0.07, x + 0.16, h / 2, z + 0.21);
    } else if (style === 'hss-tube') {
      this.addBox(parent, postMat.dark, 'posts', 0.54, h, 0.54, x, h / 2, z);
      this.addBox(parent, postMat.main, 'posts', 0.58, 0.08, 0.58, x, h - 0.04, z);
    } else if (style === 'custom') {
      this.addBox(parent, postMat.dark, 'posts', 0.52, h, 0.52, x, h / 2, z);
      this.addBox(parent, finMat.main, 'finials', 0.6, 0.12, 0.6, x, h * 0.2, z);
      this.addBox(parent, finMat.main, 'finials', 0.6, 0.12, 0.6, x, h * 0.5, z);
      this.addBox(parent, finMat.main, 'finials', 0.6, 0.12, 0.6, x, h * 0.8, z);
    } else {
      this.addBox(parent, postMat.dark, 'posts', 0.5, h, 0.5, x, h / 2, z);
    }
    this.makeFinial(parent, finMat.main, finial, x, h, z);
  }

  private applyCatalogDecor(
    state: ConfiguratorState,
    getArea: (a: PartArea) => MaterialPair,
    cx: number,
    cy: number,
    spanW: number,
    topY: number,
    z: number,
  ) {
    const g = this.modelGroup;
    const scrollMat = getArea('scrolls').main;
    const finMat = getArea('finials').main;
    const picketMat = getArea('pickets').main;

    if (state.decor.scrolls && state.style !== 'scroll') {
      this.makeScroll(g, scrollMat, 1.0, cx - spanW * 0.22, cy, z, state.scrollStyle);
      this.makeScroll(g, scrollMat, 1.0, cx + spanW * 0.22, cy, z, state.scrollStyle);
    }
    if (state.decor.rings) {
      this.makeRing(g, scrollMat, 0.45, cx - spanW * 0.24, cy + 0.15, z);
      this.makeRing(g, scrollMat, 0.45, cx + spanW * 0.24, cy + 0.15, z);
    }
    if (state.decor.leaves) {
      this.makeBranch(g, scrollMat, cx - spanW * 0.28, cy - 0.55, z, Math.min(1.6, spanW * 0.32));
    }
    if (state.decor.medallion) {
      this.makeMedallion(g, scrollMat, 0.5, cx, cy + 0.1, z);
    }
    if (state.decor.rosettes) {
      this.makeRosette(g, scrollMat, 0.4, cx - spanW * 0.26, cy + 0.45, z);
      this.makeRosette(g, scrollMat, 0.4, cx + spanW * 0.26, cy + 0.45, z);
    }
    if (state.decor.baskets) {
      this.makeBasket(g, picketMat, cx - spanW * 0.16, cy, z * 0.5);
      this.makeBasket(g, picketMat, cx + spanW * 0.16, cy, z * 0.5);
    }
    if (state.decor.twistedBars) {
      const barH = Math.max(1.5, state.height - 1.0);
      [-spanW * 0.32, 0, spanW * 0.32].forEach((ox) => {
        this.makeTwistedBar(g, picketMat, barH, cx + ox, cy, z * 0.4);
      });
    }
    if (state.decor.spearheadFinials) {
      const count = Math.max(3, Math.min(13, Math.round(spanW * 1.1)));
      for (let i = 0; i < count; i++) {
        const sx = cx - spanW * 0.44 + (i * spanW * 0.88) / Math.max(1, count - 1);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.42, 12), finMat);
        cone.position.set(sx, topY + 0.21, 0);
        cone.castShadow = true;
        this.tagArea(cone, 'finials');
        g.add(cone);
      }
    }
    if (state.decor.fleurDeLis) {
      this.makeFleurDeLis(g, finMat, cx, topY, 0);
      if (spanW > 5) {
        this.makeFleurDeLis(g, finMat, cx - spanW * 0.35, topY, 0);
        this.makeFleurDeLis(g, finMat, cx + spanW * 0.35, topY, 0);
      }
    }
    if (state.decor.collars) {
      [-spanW * 0.24, 0, spanW * 0.24].forEach((ox) => {
        this.addBox(g, finMat, 'finials', 0.32, 0.22, 0.26, cx + ox, cy + 0.45, z * 0.35);
        this.addBox(g, finMat, 'finials', 0.32, 0.22, 0.26, cx + ox, cy - 0.45, z * 0.35);
      });
    }
    if (state.decor.leafSprays) {
      this.makeBranch(g, scrollMat, cx + spanW * 0.14, cy - 0.65, z, 1.3);
      this.makeLeaf(g, scrollMat, 0.35, cx + spanW * 0.1, cy + 0.25, z, -0.5);
    }

    // Multi-select King Architectural & IMS Leaf Catalog selections
    if (state.selectedLeaves && state.selectedLeaves.length > 0) {
      const count = state.selectedLeaves.length;
      const leafSpan = Math.min(spanW * 0.78, Math.max(1.6, count * 1.15));
      state.selectedLeaves.forEach((leafId, idx) => {
        const spec = LEAF_CATALOG.find((l) => l.id === leafId);
        if (!spec) return;
        const frac = count === 1 ? 0.5 : idx / (count - 1);
        const lx = cx - leafSpan / 2 + frac * leafSpan;
        const ly = cy + (idx % 2 === 0 ? 0.22 : -0.22);
        const tilt = idx % 2 === 0 ? 0.22 : -0.22;
        this.makeCatalogLeaf(g, scrollMat, spec.shapeKind, 0.42, lx, ly, z + 0.04, tilt);
      });
    }
  }

  private getPanelPatternMaterial(
    state: ConfiguratorState,
    baseMat: THREE.Material,
    patternOverride?: string,
  ): THREE.Material {
    const { panelOpt } = getActiveSupplierSpecs(state);
    const hint = patternOverride || panelOpt.patternHint;
    if (!hint || hint === 'solid' || hint === 'solid-panel') return baseMat;
    let tex = this.panelPatternTextures.get(hint);
    if (!tex) {
      tex = createPerforatedPanelTexture(
        hint,
        this.renderer.capabilities.getMaxAnisotropy(),
      );
      tex.repeat.set(3, 3);
      this.panelPatternTextures.set(hint, tex);
    }
    return new THREE.MeshStandardMaterial({
      color: (baseMat as THREE.MeshStandardMaterial).color?.getHex?.() ?? 0x8a8f98,
      map: tex,
      roughness: 0.45,
      metalness: 0.72,
      envMap: this.envTexture,
      envMapIntensity: 0.95,
    });
  }

  private renderPicketAccent(
    parent: THREE.Object3D,
    finialMat: THREE.Material,
    accent: PicketAccentType,
    thicknessFt: number,
    y: number,
  ) {
    const r = Math.max(0.11, thicknessFt * 1.15);
    if (accent === 'knuckle') {
      const collarTop = new THREE.Mesh(
        new THREE.TorusGeometry(r * 0.9, r * 0.28, 10, 20),
        finialMat,
      );
      collarTop.rotation.x = Math.PI / 2;
      collarTop.position.set(0, y + r * 0.72, 0);
      this.tagArea(collarTop, 'finials');
      parent.add(collarTop);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(r * 1.15, 16, 12), finialMat);
      bulb.scale.set(1, 0.88, 1);
      bulb.position.set(0, y, 0);
      bulb.castShadow = true;
      this.tagArea(bulb, 'finials');
      parent.add(bulb);

      const collarBot = new THREE.Mesh(
        new THREE.TorusGeometry(r * 0.9, r * 0.28, 10, 20),
        finialMat,
      );
      collarBot.rotation.x = Math.PI / 2;
      collarBot.position.set(0, y - r * 0.72, 0);
      this.tagArea(collarBot, 'finials');
      parent.add(collarBot);
    } else if (accent === 'emblem') {
      const badge = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 1.9, r * 1.9, thicknessFt * 1.65, 8),
        finialMat,
      );
      badge.rotation.x = Math.PI / 2;
      badge.position.set(0, y, 0);
      badge.castShadow = true;
      this.tagArea(badge, 'finials');
      parent.add(badge);

      const rimF = new THREE.Mesh(
        new THREE.TorusGeometry(r * 1.35, r * 0.22, 8, 20),
        finialMat,
      );
      rimF.position.set(0, y, thicknessFt * 0.84);
      this.tagArea(rimF, 'finials');
      parent.add(rimF);

      const rimB = rimF.clone();
      rimB.position.set(0, y, -thicknessFt * 0.84);
      this.tagArea(rimB, 'finials');
      parent.add(rimB);
    } else if (accent === 'leaf') {
      this.makeLeaf(parent, finialMat, r * 2.1, -r * 0.95, y + r * 0.35, 0, 0.65);
      this.makeLeaf(parent, finialMat, r * 2.1, r * 0.95, y + r * 0.35, 0, -0.65);
      const wrap = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.85, r * 0.85, r * 0.7, 12),
        finialMat,
      );
      wrap.position.set(0, y, 0);
      this.tagArea(wrap, 'finials');
      parent.add(wrap);
    }
  }

  private buildPicketUnit(
    parent: THREE.Object3D,
    picketMat: THREE.Material,
    finialMat: THREE.Material,
    picketStyle: ConfiguratorState['picketStyle'],
    thicknessFt: number,
    height: number,
    x: number,
    centerY: number,
    z: number,
    picketIndex?: number,
    accents: PicketAccentType[] = [],
    isSelected = false,
  ) {
    const unitGroup = new THREE.Group();
    const t = Math.max(0.06, Math.min(0.45, thicknessFt));
    if (picketStyle === 'round') {
      this.addCyl(unitGroup, picketMat, 'pickets', t * 0.55, t * 0.55, height, x, centerY, z, 12);
    } else if (picketStyle === 'twisted' || picketStyle === 'double-twist') {
      const steps = picketStyle === 'double-twist' ? 14 : 10;
      const g = new THREE.Group();
      for (let i = 0; i < steps; i++) {
        const segH = height / steps;
        const seg = this.addBox(
          g,
          picketMat,
          'pickets',
          t * 1.1,
          segH * 1.04,
          t * 1.1,
          0,
          -height / 2 + segH * (i + 0.5),
          0,
        );
        seg.rotation.y = (i / steps) * Math.PI * (picketStyle === 'double-twist' ? 4 : 2);
      }
      if (picketStyle === 'double-twist') {
        this.addBox(g, finialMat, 'finials', t * 1.65, t * 1.35, t * 1.65, 0, 0, 0);
      }
      g.position.set(x, centerY, z);
      unitGroup.add(g);
    } else if (picketStyle === 'hammered') {
      this.addBox(unitGroup, picketMat, 'pickets', t * 1.08, height, t * 0.9, x, centerY, z);
      const notches = 5;
      for (let k = 0; k < notches; k++) {
        const ny = centerY - height * 0.38 + (k * height * 0.76) / (notches - 1);
        this.addBox(unitGroup, finialMat, 'pickets', t * 1.32, 0.08, t * 1.18, x, ny, z);
      }
    } else if (picketStyle === 'single-basket' || picketStyle === 'double-basket') {
      this.addBox(unitGroup, picketMat, 'pickets', t, height, t * 0.85, x, centerY, z);
      if (picketStyle === 'single-basket') {
        this.makeBasket(unitGroup, finialMat, x, centerY, z);
      } else {
        this.makeBasket(unitGroup, finialMat, x, centerY - height * 0.22, z);
        this.makeBasket(unitGroup, finialMat, x, centerY + height * 0.22, z);
      }
    } else if (picketStyle === 'single-knuckle' || picketStyle === 'double-knuckle') {
      this.addBox(unitGroup, picketMat, 'pickets', t, height, t * 0.85, x, centerY, z);
      const kg = new THREE.Group();
      kg.position.set(x, centerY, z);
      if (picketStyle === 'single-knuckle') {
        this.renderPicketAccent(kg, finialMat, 'knuckle', t, 0);
      } else {
        this.renderPicketAccent(kg, finialMat, 'knuckle', t, -height * 0.22);
        this.renderPicketAccent(kg, finialMat, 'knuckle', t, height * 0.22);
      }
      unitGroup.add(kg);
    } else if (picketStyle === 'belly') {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, centerY + height / 2, z),
        new THREE.Vector3(x, centerY + height * 0.12, z + 0.04),
        new THREE.Vector3(x, centerY - height * 0.25, z + Math.min(0.45, height * 0.11)),
        new THREE.Vector3(x, centerY - height * 0.42, z + Math.min(0.22, height * 0.06)),
        new THREE.Vector3(x, centerY - height / 2, z),
      ]);
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, Math.max(0.045, t * 0.55), 8), picketMat);
      m.castShadow = true;
      this.tagArea(m, 'pickets');
      unitGroup.add(m);
    } else if (picketStyle === 'scroll-picket') {
      this.addBox(unitGroup, picketMat, 'pickets', t, height, t * 0.85, x, centerY, z);
      this.makeScroll(unitGroup, finialMat, Math.min(0.45, height * 0.14), x, centerY, z, 'c-scroll');
    } else {
      this.addBox(unitGroup, picketMat, 'pickets', t, height, t * 0.85, x, centerY, z);
    }

    const topY = centerY + height / 2;
    if (picketStyle === 'spearhead') {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(0.08, t * 0.8), 0.34, 12),
        finialMat,
      );
      cone.position.set(x, topY + 0.16, z);
      cone.castShadow = true;
      this.tagArea(cone, 'finials');
      unitGroup.add(cone);
    } else if (picketStyle === 'ball-top') {
      this.addSph(unitGroup, finialMat, 'finials', Math.max(0.08, t * 0.72), x, topY + 0.08, z);
    }

    if (accents.length > 0) {
      const accentGroup = new THREE.Group();
      accentGroup.position.set(x, centerY, z);
      const count = accents.length;
      const spanY = Math.min(height * 0.58, count * 0.7);
      accents.forEach((acc, aIdx) => {
        const ay =
          count === 1 ? 0 : -spanY / 2 + (aIdx * spanY) / Math.max(1, count - 1);
        this.renderPicketAccent(accentGroup, finialMat, acc, t, ay);
      });
      unitGroup.add(accentGroup);
    }

    if (isSelected) {
      const selMat = new THREE.MeshStandardMaterial({
        color: 0xe8a317,
        emissive: 0xc9883d,
        emissiveIntensity: 0.75,
        roughness: 0.3,
        metalness: 0.4,
        transparent: true,
        opacity: 0.45,
      });
      const selHalo = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(0.24, t * 2.5), height + 0.08, Math.max(0.24, t * 2.5)),
        selMat,
      );
      selHalo.position.set(x, centerY, z);
      unitGroup.add(selHalo);
    }

    if (picketIndex !== undefined) {
      unitGroup.traverse((child) => {
        child.userData.picketIndex = picketIndex;
        if (!child.userData.partArea) {
          child.userData.partArea = 'pickets';
        }
      });
    }

    parent.add(unitGroup);
  }

  private buildInfillBay(
    state: ConfiguratorState,
    getArea: (a: PartArea) => MaterialPair,
    cx: number,
    cy: number,
    spanW: number,
    bayH: number,
    z: number,
    picketIndexOffset = 0,
  ) {
    const g = this.modelGroup;
    const picketMat = getArea('pickets').main;
    const finialMat = getArea('finials').main;
    const panelMat = getArea('panels').main;
    const scrollMat = getArea('scrolls').main;
    const { barOpt } = getActiveSupplierSpecs(state);
    const effectivePicketIn = getEffectivePicketInches(state);
    const picketThickFt = Math.max(0.065, Math.min(0.42, (effectivePicketIn / 12) * 1.8));
    const barThickFt = Math.max(0.09, Math.min(0.45, (barOpt.inches / 12) * 1.35));

    if (state.style === 'scroll' || state.infillPattern === 'scroll-panel') {
      const nScroll = Math.max(1, Math.round(spanW / 2.2));
      for (let s = 0; s < nScroll; s++) {
        const sx = cx - spanW / 2 + ((s + 0.5) * spanW) / nScroll;
        this.makeScroll(
          g,
          scrollMat,
          Math.min(1.5, bayH * 0.48),
          sx,
          cy,
          z,
          state.scrollStyle,
        );
      }
      return;
    }

    const pattern =
      state.infillPattern ||
      (state.style === 'horizontal'
        ? 'horizontal-bars'
        : state.style === 'solid'
          ? 'solid-panel'
          : 'vertical-pickets');

    if (pattern === 'horizontal-bars') {
      const rows = Math.max(3, Math.round(bayH * 1.6));
      for (let r = 0; r < rows; r++) {
        const ry = cy - bayH / 2 + ((r + 0.5) * bayH) / rows;
        this.addBox(g, picketMat, 'pickets', spanW, barThickFt, Math.max(0.09, barThickFt * 0.7), cx, ry, z);
      }
    } else if (pattern === 'louvered-slats') {
      const rows = Math.max(5, Math.round(bayH * 2.5));
      for (let r = 0; r < rows; r++) {
        const ry = cy - bayH / 2 + ((r + 0.5) * bayH) / rows;
        const slat = this.addBox(g, panelMat, 'panels', spanW - 0.1, 0.05, 0.24, cx, ry, z);
        slat.rotation.x = 0.48;
      }
    } else if (
      pattern === 'solid-panel' ||
      pattern === 'interweave' ||
      pattern === 'intercrimp' ||
      pattern === 'lock-crimp' ||
      pattern === 'flat-top-mesh' ||
      pattern === 'perforated-round-staggered' ||
      pattern === 'perforated-round-straight' ||
      pattern === 'perforated-square' ||
      pattern === 'perforated-slotted' ||
      pattern === 'expanded-metal' ||
      pattern === 'flattened-expanded' ||
      pattern === 'bar-grating'
    ) {
      const mat = this.getPanelPatternMaterial(
        state,
        panelMat,
        pattern === 'solid-panel' ? undefined : pattern,
      );
      this.addBox(g, mat, 'panels', spanW, bayH, 0.1, cx, cy, z);
    } else if (pattern === 'diamond-lattice') {
      const cols = Math.max(2, Math.round(spanW / 1.4));
      const cellW = spanW / cols;
      const diagLen = Math.hypot(cellW, bayH);
      const angle = Math.atan2(bayH, cellW);
      for (let i = 0; i < cols; i++) {
        const bx = cx - spanW / 2 + (i + 0.5) * cellW;
        const barA = this.addBox(g, picketMat, 'pickets', diagLen, Math.max(0.06, picketThickFt * 0.7), 0.08, bx, cy, z);
        barA.rotation.z = angle;
        const barB = this.addBox(g, picketMat, 'pickets', diagLen, Math.max(0.06, picketThickFt * 0.7), 0.08, bx, cy, z);
        barB.rotation.z = -angle;
      }
    } else if (pattern === 'basketweave') {
      const vCount = Math.max(3, Math.floor((spanW * 12) / Math.max(3, state.picketSpacing * 1.4)));
      for (let i = 0; i < vCount; i++) {
        const vx = cx - spanW / 2 + ((i + 0.5) * spanW) / vCount;
        this.addBox(g, picketMat, 'pickets', picketThickFt * 0.9, bayH, 0.06, vx, cy, z + (i % 2 === 0 ? 0.02 : -0.02));
      }
      const hRows = Math.max(3, Math.round(bayH * 1.6));
      for (let r = 0; r < hRows; r++) {
        const ry = cy - bayH / 2 + ((r + 0.5) * bayH) / hRows;
        this.addBox(g, picketMat, 'pickets', spanW, picketThickFt * 0.85, 0.06, cx, ry, z + (r % 2 === 0 ? -0.02 : 0.02));
      }
    } else if (pattern === 'sunburst') {
      const rays = Math.max(7, Math.round(spanW * 1.4));
      const originY = cy - bayH / 2 + 0.15;
      for (let i = 0; i < rays; i++) {
        const frac = rays === 1 ? 0.5 : i / (rays - 1);
        const topX = cx - spanW * 0.45 + frac * spanW * 0.9;
        const topY = cy + bayH / 2 - 0.1;
        const dx = topX - cx;
        const dy = topY - originY;
        const len = Math.hypot(dx, dy);
        const bar = this.addBox(
          g,
          picketMat,
          'pickets',
          Math.max(0.065, picketThickFt * 0.75),
          len,
          0.08,
          (cx + topX) / 2,
          (originY + topY) / 2,
          z,
        );
        bar.rotation.z = -Math.atan2(dx, dy);
      }
      this.makeRing(g, finialMat, Math.min(spanW, bayH) * 0.22, cx, originY + 0.2, z);
    } else {
      // vertical-pickets
      const pickets = Math.max(
        2,
        Math.floor((spanW * 12) / Math.max(2, state.picketSpacing)),
      );
      for (let i = 0; i < pickets; i++) {
        const globalIdx = picketIndexOffset + i;
        const px = cx - spanW / 2 + ((i + 0.5) * spanW) / pickets;
        const accents = state.picketAccents?.[globalIdx] || [];
        const isSel = state.selectedPicketIndex === globalIdx;
        this.buildPicketUnit(
          g,
          picketMat,
          finialMat,
          state.picketStyle,
          picketThickFt,
          bayH,
          px,
          cy,
          z,
          globalIdx,
          accents,
          isSel,
        );
      }
    }
  }

  private cloneWithFreshGeometry(obj: THREE.Object3D, mat: THREE.Material): THREE.Group {
    const wrapper = new THREE.Group();
    const copy = obj.clone(true);
    copy.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry = mesh.geometry.clone();
          mesh.geometry.computeVertexNormals();
        }
        mesh.material = mat;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    wrapper.add(copy);
    return wrapper;
  }

  private triggerModel3dLoad(url: string, ext: string) {
    if (this.model3dCache.has(url) || this.model3dLoading.has(url)) return;
    this.model3dLoading.add(url);

    const onLoaded = (obj: THREE.Object3D) => {
      this.model3dLoading.delete(url);
      if (this.disposed) return;
      this.model3dCache.set(url, obj);
      this.buildPiece(this.currentState, true);
      this.requestRender();
    };
    const onErr = () => {
      this.model3dLoading.delete(url);
    };

    try {
      if (ext === 'stl') {
        new STLLoader().load(
          url,
          (geo) => onLoaded(new THREE.Mesh(geo)),
          undefined,
          onErr,
        );
      } else if (ext === 'obj') {
        new OBJLoader().load(url, (obj) => onLoaded(obj), undefined, onErr);
      } else if (ext === 'gltf' || ext === 'glb') {
        new GLTFLoader().load(url, (gltf) => onLoaded(gltf.scene), undefined, onErr);
      } else if (ext === 'ply') {
        new PLYLoader().load(
          url,
          (geo) => onLoaded(new THREE.Mesh(geo)),
          undefined,
          onErr,
        );
      } else if (ext === '3mf') {
        new ThreeMFLoader().load(url, (obj) => onLoaded(obj), undefined, onErr);
      } else if (ext === 'fbx') {
        new FBXLoader().load(url, (obj) => onLoaded(obj), undefined, onErr);
      } else {
        this.model3dLoading.delete(url);
      }
    } catch {
      this.model3dLoading.delete(url);
    }
  }

  private buildSampleArtOverlay(
    state: ConfiguratorState,
    getArea: (a: PartArea) => MaterialPair,
    cx: number,
    cy: number,
    availW: number,
    availH: number,
    zFront: number,
  ) {
    const art = state.sampleArt;
    if (!art) return;
    const panelMat = getArea('panels').main;
    const g = this.modelGroup;
    const size = Math.max(0.8, Math.min(availW * 0.62, availH * 0.68));

    if (art.kind === 'model3d' && art.downloadUrl) {
      const cached = this.model3dCache.get(art.downloadUrl);
      if (!cached) {
        this.triggerModel3dLoad(art.downloadUrl, (art.fileExt || '').toLowerCase());
      } else {
        const modelWrap = this.cloneWithFreshGeometry(cached, panelMat);
        const box = new THREE.Box3().setFromObject(modelWrap);
        const sz = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(sz);
        box.getCenter(center);
        const maxDim = Math.max(0.001, sz.x, sz.y, sz.z);
        const targetSize = Math.max(1.2, Math.min(availW * 0.72, availH * 0.78));
        const scale = targetSize / maxDim;
        modelWrap.scale.setScalar(scale);
        modelWrap.position.set(
          cx - center.x * scale,
          cy - center.y * scale,
          zFront + (sz.z * scale) * 0.5 + 0.08,
        );
        this.tagArea(modelWrap, 'panels');
        g.add(modelWrap);
      }
      return;
    }

    if (art.showRelief3D && art.heightmap && art.heightmapSize) {
      const n = art.heightmapSize;
      const geo = new THREE.PlaneGeometry(size, size, n - 1, n - 1);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const hmVal = art.heightmap[i] ?? 0;
        pos.setZ(i, hmVal * 0.28);
      }
      geo.computeVertexNormals();
      const relief = new THREE.Mesh(geo, panelMat);
      relief.position.set(cx, cy, zFront + 0.06);
      relief.castShadow = true;
      relief.receiveShadow = true;
      this.tagArea(relief, 'panels');
      g.add(relief);

      // Backing plate behind relief
      this.addBox(
        g,
        getArea('panels').dark,
        'panels',
        size + 0.08,
        size + 0.08,
        0.08,
        cx,
        cy,
        zFront + 0.01,
      );
    } else if (art.useOutlineCut && art.cutSegments?.length) {
      // Raised flat plasma-cut wireframe bars on front face
      const x0 = cx - size / 2;
      const y0 = cy - size / 2;
      art.cutSegments.slice(0, 260).forEach(([ax, ay, bx, by]) => {
        const p1 = new THREE.Vector3(x0 + ax * size, y0 + ay * size, zFront + 0.05);
        const p2 = new THREE.Vector3(x0 + bx * size, y0 + by * size, zFront + 0.05);
        const len = p1.distanceTo(p2);
        if (len < 0.005) return;
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(len, 0.035, 0.06),
          panelMat,
        );
        bar.position.copy(p1).add(p2).multiplyScalar(0.5);
        bar.rotation.z = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        this.tagArea(bar, 'panels');
        g.add(bar);
      });
    }
  }

  private buildAttachedSignPlaque(
    state: ConfiguratorState,
    getArea: (a: PartArea) => MaterialPair,
    cx: number,
    cy: number,
    plaqueW: number,
    plaqueH: number,
    z: number,
  ) {
    if (!state.showSign || state.piece === 'sign-frame') return;
    const g = this.modelGroup;
    const railMat = getArea('rails');
    this.drawSignFaceCanvas(state);

    const face = new THREE.Mesh(
      new THREE.BoxGeometry(plaqueW, plaqueH, 0.08),
      new THREE.MeshStandardMaterial({
        map: this.texSign,
        roughness: 0.55,
        metalness: 0.35,
        envMap: this.envTexture,
        envMapIntensity: 0.75,
      }),
    );
    face.position.set(cx, cy, z);
    face.castShadow = true;
    face.receiveShadow = true;
    this.tagArea(face, 'panels');
    g.add(face);

    const border = 0.09;
    this.addBox(g, railMat.dark, 'rails', plaqueW + border * 2, border, 0.12, cx, cy + plaqueH / 2 + border / 2, z);
    this.addBox(g, railMat.dark, 'rails', plaqueW + border * 2, border, 0.12, cx, cy - plaqueH / 2 - border / 2, z);
    this.addBox(g, railMat.dark, 'rails', border, plaqueH + border * 2, 0.12, cx - plaqueW / 2 - border / 2, cy, z);
    this.addBox(g, railMat.dark, 'rails', border, plaqueH + border * 2, 0.12, cx + plaqueW / 2 + border / 2, cy, z);
  }

  private buildGate(
    state: ConfiguratorState,
    getArea: (a: PartArea) => MaterialPair,
  ) {
    const w = state.width;
    const h = state.height;
    const g = this.modelGroup;
    const leaves = state.leaves === 'double' ? 2 : 1;
    const leafW = leaves === 2 ? w / 2 - 0.15 : w;
    const centers = leaves === 2 ? [-w / 4, w / 4] : [0];
    const railMat = getArea('rails');
    const baseMat = getArea('base');
    const { perLeafPickets } = getPicketLayoutStats(state);

    this.makePost(g, getArea, state.postStyle, state.finial, -w / 2 - 0.25, h, 0);
    this.makePost(g, getArea, state.postStyle, state.finial, w / 2 + 0.25, h, 0);
    this.addBox(g, baseMat.dark, 'base', 0.85, 0.09, 0.85, -w / 2 - 0.25, 0.045, 0);
    this.addBox(g, baseMat.dark, 'base', 0.85, 0.09, 0.85, w / 2 + 0.25, 0.045, 0);

    if (leaves === 2) {
      this.addBox(g, railMat.dark, 'rails', 0.3, h, 0.34, 0, h / 2, 0);
    }

    centers.forEach((cx, leafIdx) => {
      this.addBox(g, railMat.dark, 'rails', leafW, 0.45, 0.28, cx, h - 0.225, 0);
      this.addBox(g, railMat.dark, 'rails', leafW, 0.45, 0.28, cx, 0.225, 0);
      this.buildInfillBay(
        state,
        getArea,
        cx,
        h / 2,
        leafW,
        h - 0.5,
        0,
        leafIdx * perLeafPickets,
      );
    });

    this.applyCatalogDecor(state, getArea, 0, h * 0.5, w, h, 0.16);
    this.buildSampleArtOverlay(state, getArea, 0, h * 0.5, w, h - 0.6, 0.12);
    this.buildAttachedSignPlaque(
      state,
      getArea,
      0,
      h * 0.52,
      Math.min(w * 0.58, 5.2),
      Math.min(h * 0.34, 2.2),
      0.24,
    );
  }

  private buildRailing(
    state: ConfiguratorState,
    getArea: (a: PartArea) => MaterialPair,
  ) {
    const L = state.width;
    const H = state.height;
    const g = this.modelGroup;
    const railMat = getArea('rails');
    const baseMat = getArea('base');

    if (state.topRail === 'round') {
      const rail = this.addCyl(g, railMat.dark, 'rails', 0.13, 0.13, L, 0, H, 0, 16);
      rail.rotation.z = Math.PI / 2;
    } else if (state.topRail === 'cap') {
      this.addBox(g, railMat.dark, 'rails', L, 0.14, 0.55, 0, H - 0.07, 0);
      this.addBox(g, railMat.main, 'rails', L, 0.1, 0.4, 0, H - 0.19, 0);
    } else {
      this.addBox(g, railMat.dark, 'rails', L, 0.18, 0.35, 0, H - 0.09, 0);
    }

    this.addBox(g, railMat.dark, 'rails', L, 0.16, 0.2, 0, 0.35, 0);

    const spacing = state.postSpacing;
    const nSeg = Math.max(1, Math.round(L / spacing));
    const step = L / nSeg;
    for (let i = 0; i <= nSeg; i++) {
      const x = -L / 2 + i * step;
      this.makePost(g, getArea, state.postStyle, state.finial, x, H, 0);
      this.addBox(g, baseMat.dark, 'base', 0.6, 0.07, 0.6, x, 0.035, 0);
    }

    this.buildInfillBay(state, getArea, 0, (H + 0.35) / 2, L, H - 0.55, 0, 0);

    this.applyCatalogDecor(state, getArea, 0, (H + 0.35) / 2, L, H, 0.14);
    this.buildSampleArtOverlay(state, getArea, 0, (H + 0.35) / 2, L, H - 0.5, 0.1);
    this.buildAttachedSignPlaque(
      state,
      getArea,
      0,
      (H + 0.35) / 2,
      Math.min(L * 0.42, 4.2),
      Math.min((H - 0.55) * 0.68, 1.8),
      0.22,
    );
  }

  private buildSculptureBase(
    state: ConfiguratorState,
    getArea: (a: PartArea) => MaterialPair,
  ) {
    const w = state.width;
    const h = state.height;
    const d = state.depth;
    const g = this.modelGroup;
    const baseMat = getArea('base');
    const railMat = getArea('rails');
    const panelMat = getArea('panels');

    this.addBox(g, baseMat.dark, 'base', w + 0.5, 0.3, d + 0.5, 0, 0.15, 0);
    if (state.style === 'column') {
      this.addCyl(g, baseMat.main, 'base', w * 0.42, w * 0.48, h - 0.6, 0, 0.3 + (h - 0.6) / 2, 0, 24);
      this.addCyl(g, railMat.dark, 'rails', w * 0.55, w * 0.55, 0.22, 0, h - 0.11, 0, 24);
    } else if (state.style === 'tapered') {
      const tap = this.addCyl(g, baseMat.main, 'base', w * 0.36, w * 0.5, h - 0.6, 0, 0.3 + (h - 0.6) / 2, 0, 4);
      tap.rotation.y = Math.PI / 4;
      tap.scale.z = d / w;
      this.addBox(g, railMat.dark, 'rails', w * 0.9, 0.22, d * 0.9, 0, h - 0.11, 0);
    } else {
      this.addBox(g, baseMat.main, 'base', w, h - 0.6, d, 0, 0.3 + (h - 0.6) / 2, 0);
      this.addBox(g, railMat.dark, 'rails', w + 0.24, 0.22, d + 0.24, 0, h - 0.11, 0);
    }

    const formY = h;
    const arc1 = this.addTorus(g, panelMat.main, 'panels', 0.55, 0.07, 0, formY + 0.7, 0, Math.PI * 1.2);
    arc1.rotation.z = Math.PI * 0.15;
    const arc2 = this.addTorus(g, panelMat.main, 'panels', 0.4, 0.06, 0.1, formY + 1.05, 0, Math.PI);
    arc2.rotation.z = -Math.PI * 0.4;
    this.addSph(g, panelMat.main, 'panels', 0.22, -0.15, formY + 1.35, 0);
    this.addCyl(g, panelMat.main, 'panels', 0.06, 0.09, 0.9, 0, formY + 0.45, 0, 10);

    this.applyCatalogDecor(state, getArea, 0, h * 0.5, w, h, d / 2 + 0.06);
    this.buildSampleArtOverlay(state, getArea, 0, h * 0.5, w, h - 0.5, d / 2 + 0.02);
    this.buildAttachedSignPlaque(
      state,
      getArea,
      0,
      h * 0.5,
      Math.max(0.9, w * 0.78),
      Math.max(0.55, h * 0.4),
      d / 2 + 0.08,
    );
  }

  private drawSignFaceCanvas(state: ConfiguratorState) {
    const ctx = this.signCanvas.getContext('2d');
    if (!ctx) return;
    const W = this.signCanvas.width;
    const H = this.signCanvas.height;

    const panelBg =
      state.areaColors.panels ||
      state.customColor ||
      (state.finish === 'powder-coat' ? POWDERS[state.powder].swatch : null) ||
      FINISHES[state.finish].swatch ||
      '#20242a';

    ctx.fillStyle = panelBg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#c9883d';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Design Picture layer
    if (state.signPicture?.previewUrl) {
      const url = state.signPicture.previewUrl;
      let img = this.signImgCache.get(url);
      if (!img) {
        img = new Image();
        img.onload = () => {
          if (!this.disposed) {
            this.drawSignFaceCanvas(this.currentState);
            this.requestRender();
          }
        };
        img.src = url;
        this.signImgCache.set(url, img);
      }
      if (img.complete && img.naturalWidth > 0) {
        const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
        const drawH = Math.max(40, Math.min(H * 0.9, state.signPicture.scale * H));
        const drawW = drawH * aspect;
        const dx = state.signPicture.x * W - drawW / 2;
        const dy = state.signPicture.y * H - drawH / 2;
        ctx.drawImage(img, dx, dy, drawW, drawH);
      }
    }

    // Lettering layer (respects typed vs hand-drawn switch)
    if (state.signLetteringMode === 'hand-drawn') {
      if (state.signStrokes && state.signStrokes.length > 0) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        state.signStrokes.forEach((stroke) => {
          if (!stroke.points.length) return;
          ctx.strokeStyle = stroke.color || '#e8a317';
          ctx.lineWidth = Math.max(2, stroke.width * 2);
          ctx.beginPath();
          stroke.points.forEach(([nx, ny], idx) => {
            const sx = nx * W;
            const sy = ny * H;
            if (idx === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.stroke();
        });
      } else {
        ctx.fillStyle = 'rgba(242, 239, 232, 0.45)';
        ctx.font = "600 32px 'Source Sans 3', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HAND-DRAWN SIGN MODE', W / 2, H / 2);
      }
    } else {
      const text = state.signText.trim();
      if (text) {
        const pxSize = Math.round(Math.max(24, Math.min(180, state.signFontSize * 2)));
        ctx.fillStyle = state.signTextColor || '#f2efe8';
        ctx.font = `700 ${pxSize}px ${state.signFont || "'Oswald', sans-serif"}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lines = text.split(/\r?\n/).slice(0, 3);
        const baseCenterY = state.signPicture?.previewUrl ? H * 0.72 : H * 0.5;
        const lineHeight = pxSize * 1.15;
        const startY = baseCenterY - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, idx) => {
          ctx.fillText(line, W / 2, startY + idx * lineHeight, W - 84);
        });
      }
    }

    this.texSign.needsUpdate = true;
  }

  private buildSignFrame(
    state: ConfiguratorState,
    getArea: (a: PartArea) => MaterialPair,
  ) {
    const w = state.width;
    const h = state.height;
    const g = this.modelGroup;
    const railMat = getArea('rails');
    const baseMat = getArea('base');

    this.makePost(g, getArea, state.postStyle, state.finial, -w / 2 - 0.3, h, 0);
    this.makePost(g, getArea, state.postStyle, state.finial, w / 2 + 0.3, h, 0);
    this.addBox(g, baseMat.dark, 'base', 0.85, 0.08, 0.85, -w / 2 - 0.3, 0.04, 0);
    this.addBox(g, baseMat.dark, 'base', 0.85, 0.08, 0.85, w / 2 + 0.3, 0.04, 0);

    const panelH = h * 0.62;
    const panelY = h * 0.56;
    this.drawSignFaceCanvas(state);

    const face = new THREE.Mesh(
      new THREE.BoxGeometry(w, panelH, 0.1),
      new THREE.MeshStandardMaterial({
        map: this.texSign,
        roughness: 0.55,
        metalness: 0.35,
        envMap: this.envTexture,
        envMapIntensity: 0.75,
      }),
    );
    face.position.set(0, panelY, 0);
    face.castShadow = true;
    face.receiveShadow = true;
    this.tagArea(face, 'panels');
    g.add(face);

    this.addBox(g, railMat.dark, 'rails', w + 0.24, 0.16, 0.16, 0, panelY + panelH / 2 + 0.08, 0);
    this.addBox(g, railMat.dark, 'rails', w + 0.24, 0.16, 0.16, 0, panelY - panelH / 2 - 0.08, 0);
    this.addBox(g, railMat.dark, 'rails', 0.16, panelH + 0.24, 0.16, -w / 2 - 0.12, panelY, 0);
    this.addBox(g, railMat.dark, 'rails', 0.16, panelH + 0.24, 0.16, w / 2 + 0.12, panelY, 0);

    if (state.style === 'arch') {
      const arch = this.addTorus(g, railMat.dark, 'rails', w / 2 + 0.1, 0.09, 0, panelY + panelH / 2 + 0.08, 0, Math.PI);
      arch.rotation.z = 0;
    }

    this.applyCatalogDecor(state, getArea, 0, panelY, w, panelY + panelH / 2 + 0.15, 0.14);
    this.buildSampleArtOverlay(state, getArea, 0, panelY, w, panelH, 0.07);
  }

  private buildPatioCover(
    state: ConfiguratorState,
    getArea: (a: PartArea) => MaterialPair,
  ) {
    const span = state.width;
    const depth = state.depth;
    const h = state.height;
    const g = this.modelGroup;
    const railMat = getArea('rails');
    const picketMat = getArea('pickets');
    const panelMat = getArea('panels');
    const baseMat = getArea('base');

    const nPosts = span > 14 ? 3 : 2;
    for (let i = 0; i < nPosts; i++) {
      const px = -span / 2 + (i * span) / (nPosts - 1);
      this.makePost(g, getArea, state.postStyle, state.finial, px, h, -depth / 2);
      this.makePost(g, getArea, state.postStyle, state.finial, px, h, depth / 2);
      this.addBox(g, baseMat.dark, 'base', 0.7, 0.08, 0.7, px, 0.04, -depth / 2);
      this.addBox(g, baseMat.dark, 'base', 0.7, 0.08, 0.7, px, 0.04, depth / 2);
    }

    [-depth / 2, depth / 2].forEach((z) => {
      this.addBox(g, railMat.dark, 'rails', span + 0.6, 0.5, 0.35, 0, h + 0.25, z);
    });
    this.addBox(g, railMat.dark, 'rails', 0.35, 0.5, depth + 0.6, -span / 2, h + 0.25, 0);
    this.addBox(g, railMat.dark, 'rails', 0.35, 0.5, depth + 0.6, span / 2, h + 0.25, 0);

    if (state.style === 'slats') {
      const n = Math.max(4, Math.round(span / 1.4));
      for (let s = 0; s < n; s++) {
        const sx = -span / 2 + ((s + 0.5) * span) / n;
        this.addBox(g, picketMat.main, 'pickets', 0.28, 0.12, depth + 0.9, sx, h + 0.62, 0);
      }
    } else {
      this.addBox(g, panelMat.main, 'panels', span + 1.0, 0.14, depth + 1.0, 0, h + 0.6, 0);
      this.addBox(g, railMat.dark, 'rails', span + 1.1, 0.1, depth + 1.1, 0, h + 0.5, 0);
    }

    this.applyCatalogDecor(state, getArea, 0, h + 0.25, span, h + 0.65, depth / 2 + 0.24);
    this.buildSampleArtOverlay(state, getArea, 0, h * 0.5, span * 0.5, h * 0.5, depth / 2 + 0.05);
    this.buildAttachedSignPlaque(
      state,
      getArea,
      0,
      h + 0.25,
      Math.min(span * 0.45, 5.5),
      1.2,
      depth / 2 + 0.28,
    );
  }

  private disposeGroup(group: THREE.Group) {
    group.traverse((o) => {
      if ((o as THREE.Mesh).geometry) {
        (o as THREE.Mesh).geometry.dispose();
      }
      const mat = (o as THREE.Mesh).material;
      if (mat) {
        (Array.isArray(mat) ? mat : [mat]).forEach((m) => m.dispose());
      }
    });
    while (group.children.length) {
      group.remove(group.children[0]);
    }
  }

  private frameCamera() {
    const box3 = new THREE.Box3().setFromObject(this.modelGroup);
    const sphere = box3.getBoundingSphere(new THREE.Sphere());
    if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) return;

    const { center, radius } = sphere;
    const fov = (this.camera.fov * Math.PI) / 180;
    let dist = (radius / Math.tan(fov / 2)) * 1.3;
    dist = Math.max(
      dist,
      (radius / (Math.tan(fov / 2) * Math.max(this.camera.aspect, 0.4))) * 1.3,
    );
    const dir = this.camera.position.clone().sub(this.controls.target);
    if (dir.lengthSq() < 0.01) dir.set(1, 0.42, 1.25);
    dir.normalize();

    this.camera.position.copy(center).addScaledVector(dir, dist);
    this.camera.position.y = Math.max(
      this.camera.position.y,
      center.y + radius * 0.2,
    );
    this.controls.target.copy(center);

    const s = radius + 4;
    this.keyLight.shadow.camera.left = -s;
    this.keyLight.shadow.camera.right = s;
    this.keyLight.shadow.camera.top = s;
    this.keyLight.shadow.camera.bottom = -s;
    this.keyLight.shadow.camera.updateProjectionMatrix();
    this.controls.update();
  }

  public update(nextState: ConfiguratorState) {
    const pieceChanged =
      nextState.piece !== this.currentState.piece ||
      nextState.sizeMode !== this.currentState.sizeMode;
    const simpleChanged = nextState.simple !== this.currentState.simple;
    const turntableChanged = nextState.turntable !== this.currentState.turntable;
    const frozenChanged = nextState.frozenView !== this.currentState.frozenView;

    this.currentState = nextState;

    if (simpleChanged) {
      this.renderer.setPixelRatio(
        this.isSoftwareGl || nextState.simple
          ? 1
          : Math.min(window.devicePixelRatio || 1, 2),
      );
      this.renderer.shadowMap.enabled = !this.isSoftwareGl && !nextState.simple;
      this.keyLight.castShadow = !this.isSoftwareGl && !nextState.simple;
      this.gardenWall.visible = !nextState.simple;
      this.groundDisc.visible = true;
    }

    if (turntableChanged || frozenChanged) {
      this.syncControlsState();
      if (this.controls.autoRotate) {
        this.startLoop();
      } else {
        this.stopLoop();
      }
    }

    // Never reframe camera if 3D view is frozen!
    // When an uploaded photo 3D relief is active, keep displaying the photo model
    // while configurator state updates continue driving the other studio tabs.
    if (!this.uploadedPhoto) {
      this.buildPiece(nextState, pieceChanged && !nextState.frozenView);
    }
    if (!this.controls.autoRotate) {
      this.requestRender();
    }
  }

  public setUploadedPhoto(photo: UploadedPhoto3D | null) {
    if (this.disposed) return;
    const prevPhoto = this.uploadedPhoto;
    this.uploadedPhoto = photo;

    if (!photo) {
      if (prevPhoto !== null) {
        this.buildPiece(this.currentState, !this.currentState.frozenView);
        if (!this.controls.autoRotate) {
          this.requestRender();
        }
      }
      return;
    }

    // If only 2D dimensions or scale calibration changed, keep the existing 3D mesh untouched
    if (
      prevPhoto &&
      prevPhoto.dataUrl === photo.dataUrl &&
      prevPhoto.reliefDepth === photo.reliefDepth &&
      this.modelGroup.children.length > 0
    ) {
      return;
    }

    const urlChanged = !prevPhoto || prevPhoto.dataUrl !== photo.dataUrl;
    this.buildPhotoReliefPiece(photo, urlChanged && !this.currentState.frozenView);
  }

  private buildPhotoReliefPiece(photo: UploadedPhoto3D, reframe: boolean) {
    const entry = getCachedPhotoRelief(photo.dataUrl, () => {
      if (this.disposed || this.uploadedPhoto?.dataUrl !== photo.dataUrl) return;
      const loaded = getCachedPhotoRelief(photo.dataUrl);
      if (!loaded) {
        this.onPhotoLoadErrorCb?.(
          'Could not decode photo pixel data for the 3D relief model.',
        );
        return;
      }
      this.buildPhotoReliefFromCache(
        loaded,
        this.uploadedPhoto.reliefDepth,
        !this.currentState.frozenView,
      );
      if (!this.controls.autoRotate) {
        this.requestRender();
      }
    });

    if (entry) {
      this.buildPhotoReliefFromCache(entry, photo.reliefDepth, reframe);
      if (!this.controls.autoRotate) {
        this.requestRender();
      }
    }
  }

  private getOrCreatePhotoTexture(
    dataUrl: string,
    texCanvas: HTMLCanvasElement,
  ): THREE.CanvasTexture {
    const existing = this.photoTextureCache.get(dataUrl);
    if (existing) return existing;
    const texture = new THREE.CanvasTexture(texCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;
    if (this.photoTextureCache.size >= 4) {
      const oldest = this.photoTextureCache.keys().next().value;
      if (oldest !== undefined) {
        this.photoTextureCache.get(oldest)?.dispose();
        this.photoTextureCache.delete(oldest);
      }
    }
    this.photoTextureCache.set(dataUrl, texture);
    return texture;
  }

  private buildPhotoReliefFromCache(
    entry: {
      dataUrl: string;
      aspect: number;
      lum: Float32Array;
      texCanvas: HTMLCanvasElement;
    },
    reliefDepth: number,
    reframe: boolean,
  ) {
    this.disposeGroup(this.modelGroup);

    const maxSpan = 7.6;
    const planeW =
      entry.aspect >= 1 ? maxSpan : Math.max(2.2, maxSpan * 0.85 * entry.aspect);
    const planeH =
      entry.aspect >= 1 ? Math.max(2.2, maxSpan / entry.aspect) : maxSpan * 0.85;
    const centerY = planeH / 2 + 0.35;
    const backingThickness = 0.28;
    const depth = Math.max(0, Math.min(2.5, reliefDepth));

    const SEG = RELIEF_SEGMENTS;
    const GRID = RELIEF_GRID;
    const frontGeo = new THREE.PlaneGeometry(planeW, planeH, SEG, SEG);
    const pos = frontGeo.attributes.position as THREE.BufferAttribute;

    for (let y = 0; y < GRID; y++) {
      // Taper outer 2-vertex border down to 0 so edges seal cleanly against backing plate
      const edgeY = Math.min(y, GRID - 1 - y);
      const yFade = edgeY === 0 ? 0 : edgeY === 1 ? 0.55 : 1;
      for (let x = 0; x < GRID; x++) {
        const edgeX = Math.min(x, GRID - 1 - x);
        const xFade = edgeX === 0 ? 0 : edgeX === 1 ? 0.55 : 1;
        const idx = y * GRID + x;
        const lum = entry.lum[idx];
        pos.setZ(idx, lum * depth * Math.min(xFade, yFade));
      }
    }
    pos.needsUpdate = true;
    frontGeo.computeVertexNormals();

    const texture = this.getOrCreatePhotoTexture(entry.dataUrl, entry.texCanvas);
    const frontMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.54,
      metalness: 0.14,
      envMap: this.envTexture,
      envMapIntensity: 0.7,
    });
    const frontMesh = new THREE.Mesh(frontGeo, frontMat);
    frontMesh.position.set(0, centerY, backingThickness / 2 - 0.005);
    frontMesh.castShadow = true;
    frontMesh.receiveShadow = true;
    this.modelGroup.add(frontMesh);

    // Solid backing plate / edge thickness so side views have physical plaque depth
    const backGeo = new THREE.BoxGeometry(
      planeW + 0.06,
      planeH + 0.06,
      backingThickness,
    );
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x22252b,
      roughness: 0.48,
      metalness: 0.78,
      envMap: this.envTexture,
      envMapIntensity: 0.9,
    });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.position.set(0, centerY, 0);
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;
    this.modelGroup.add(backMesh);

    this.modelGroup.rotation.y = 0;
    if (reframe) this.frameCamera();
  }

  private buildPiece(state: ConfiguratorState, reframe = true) {
    this.disposeGroup(this.modelGroup);
    const getArea = this.getAreaMatResolver(state);

    if (state.piece === 'gate') this.buildGate(state, getArea);
    else if (state.piece === 'railing') this.buildRailing(state, getArea);
    else if (state.piece === 'sculpture-base')
      this.buildSculptureBase(state, getArea);
    else if (state.piece === 'sign-frame') this.buildSignFrame(state, getArea);
    else if (state.piece === 'patio-cover') this.buildPatioCover(state, getArea);

    this.modelGroup.rotation.y = 0;
    if (reframe) this.frameCamera();
  }

  public resize(triggerRender = true) {
    if (this.disposed) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    const pr = this.renderer.getPixelRatio();
    const sizeChanged =
      this.canvas.width !== Math.round(w * pr) ||
      this.canvas.height !== Math.round(h * pr);
    if (sizeChanged) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
    if (triggerRender && !this.controls.autoRotate) {
      this.requestRender();
    }
  }

  private afterDraw(cb: () => void) {
    try {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        this.timerId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      let polls = 0;
      const poll = () => {
        if (this.disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        polls += 1;
        const st = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED && polls < 40) {
          this.timerId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.timerId = window.setTimeout(cb, 80);
        }
      };
      this.timerId = window.setTimeout(poll, 5);
    } catch {
      this.timerId = window.setTimeout(cb, 80);
    }
  }

  public requestRender() {
    if (this.disposed || this.recording) return;
    if (this.renderBusy) {
      this.renderDirty = true;
      return;
    }
    this.renderBusy = true;
    this.rafId = requestAnimationFrame(() => {
      if (this.disposed) return;
      this.renderDirty = false;
      this.resize(false);
      if (this.canvas.clientWidth > 0 && this.canvas.clientHeight > 0) {
        if (!this.currentState.frozenView) {
          this.controls.update();
        }
        this.renderer.render(this.scene, this.camera);
      }
      const done = () => {
        this.renderBusy = false;
        if (
          this.renderDirty ||
          (!this.isSoftwareGl && this.controls.autoRotate && !this.currentState.frozenView)
        ) {
          this.requestRender();
        }
      };
      if (this.isSoftwareGl) this.afterDraw(done);
      else done();
    });
  }

  private startLoop() {
    this.stopLoop();
    if (this.isSoftwareGl || !this.controls.autoRotate || this.currentState.frozenView) {
      this.requestRender();
      return;
    }
    const tick = () => {
      if (this.disposed || this.recording) return;
      this.resize(false);
      if (this.canvas.clientWidth > 0 && this.canvas.clientHeight > 0) {
        if (!this.currentState.frozenView) {
          this.controls.update();
        }
        this.renderer.render(this.scene, this.camera);
      }
      if (this.controls.autoRotate && !this.currentState.frozenView) {
        this.rafId = requestAnimationFrame(tick);
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopLoop() {
    cancelAnimationFrame(this.rafId);
    clearTimeout(this.timerId);
    this.rafId = 0;
    this.timerId = 0;
    this.renderBusy = false;
    this.renderDirty = false;
  }

  public captureStill(): Promise<Blob | null> {
    return new Promise((resolve) => {
      try {
        const aspect =
          this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight);
        const w = 1600;
        const h = Math.round(w / aspect);
        const prevPR = this.renderer.getPixelRatio();
        const prevW = this.canvas.clientWidth;
        const prevH = this.canvas.clientHeight;

        this.renderer.setPixelRatio(1);
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.render(this.scene, this.camera);

        this.canvas.toBlob((blob) => {
          this.renderer.setPixelRatio(prevPR);
          this.renderer.setSize(prevW, prevH, false);
          this.camera.aspect = prevW / Math.max(1, prevH);
          this.camera.updateProjectionMatrix();
          this.renderer.render(this.scene, this.camera);
          resolve(blob);
        }, 'image/png');
      } catch {
        resolve(null);
      }
    });
  }

  public exportStl(): Blob | null {
    try {
      const exportGroup = this.modelGroup.clone(true);
      exportGroup.scale.setScalar(12);
      exportGroup.rotation.set(0, 0, 0);
      exportGroup.updateMatrixWorld(true);

      const exporter = new STLExporter();
      const result = exporter.parse(exportGroup, { binary: true }) as unknown;
      if (result instanceof ArrayBuffer) {
        return new Blob([result], { type: 'model/stl' });
      }
      if (ArrayBuffer.isView(result)) {
        const bytes = new Uint8Array(
          result.buffer,
          result.byteOffset,
          result.byteLength,
        );
        return new Blob([bytes.slice()], { type: 'model/stl' });
      }
      if (typeof result === 'string') {
        return new Blob([result], { type: 'model/stl' });
      }
      return null;
    } catch {
      return null;
    }
  }

  public recordTurntable(
    onProgress: (sec: number) => void,
    onDone: (blob: Blob | null, ext: string, error?: string) => void,
  ) {
    if (
      typeof MediaRecorder === 'undefined' ||
      !this.canvas.captureStream
    ) {
      onDone(
        null,
        'webm',
        'Video recording is not available in this browser — use “Still PNG” instead. The still shows your configured piece from the current angle.',
      );
      return;
    }

    const cands: Array<[string, string]> = [
      ['video/webm;codecs=vp9', 'webm'],
      ['video/webm;codecs=vp8', 'webm'],
      ['video/webm', 'webm'],
      ['video/mp4;codecs=avc1.42E01E', 'mp4'],
      ['video/mp4', 'mp4'],
      ['', 'webm'],
    ];

    let pick: { mime: string; ext: string } | null = null;
    for (const [mime, ext] of cands) {
      try {
        if (MediaRecorder.isTypeSupported(mime)) {
          pick = { mime, ext };
          break;
        }
      } catch {
        // continue
      }
    }

    if (!pick) {
      onDone(
        null,
        'webm',
        'Video recording is not available in this browser — use “Still PNG” instead. The still shows your configured piece from the current angle.',
      );
      return;
    }

    const wasAuto = this.controls.autoRotate;
    this.controls.autoRotate = false;
    this.controls.enabled = false;
    this.recording = true;
    this.stopLoop();
    this.modelGroup.rotation.y = 0;

    const stream = this.canvas.captureStream(30);
    const chunks: Blob[] = [];
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(
        stream,
        pick.mime
          ? { mimeType: pick.mime, videoBitsPerSecond: 8_000_000 }
          : { videoBitsPerSecond: 8_000_000 },
      );
    } catch {
      this.recording = false;
      this.controls.autoRotate = wasAuto;
      this.syncControlsState();
      this.startLoop();
      onDone(
        null,
        'webm',
        'Video recording could not start in this browser — use “Still PNG” instead.',
      );
      return;
    }

    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size) chunks.push(ev.data);
    };

    rec.onstop = () => {
      this.recording = false;
      this.modelGroup.rotation.y = 0;
      this.controls.autoRotate = wasAuto;
      this.syncControlsState();
      this.renderer.render(this.scene, this.camera);
      this.startLoop();

      const blob = new Blob(chunks, { type: pick!.mime || 'video/webm' });
      if (!blob.size) {
        onDone(
          null,
          pick!.ext,
          'The video came out empty in this browser — use “Still PNG” instead.',
        );
        return;
      }
      onDone(blob, pick!.ext);
    };

    const DUR = 8000;
    const start = performance.now();
    rec.start(250);

    const tickRec = (now: number) => {
      if (this.disposed) {
        try {
          rec.stop();
        } catch {
          // ignore
        }
        return;
      }
      const t = (now - start) / DUR;
      if (t >= 1) {
        this.modelGroup.rotation.y = 0;
        this.renderer.render(this.scene, this.camera);
        try {
          rec.stop();
        } catch {
          // ignore
        }
        return;
      }
      this.modelGroup.rotation.y = t * Math.PI * 2;
      this.renderer.render(this.scene, this.camera);
      onProgress(Math.min(8, Math.max(1, Math.ceil(t * 8))));
      requestAnimationFrame(tickRec);
    };
    requestAnimationFrame(tickRec);
  }

  public dispose() {
    this.disposed = true;
    this.stopLoop();
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.removeEventListener(
      'webglcontextrestored',
      this.handleContextRestored,
    );
    this.disposeGroup(this.modelGroup);
    this.scene.traverse((o) => {
      if ((o as THREE.Mesh).geometry) {
        (o as THREE.Mesh).geometry.dispose();
      }
      const mat = (o as THREE.Mesh).material;
      if (mat) {
        (Array.isArray(mat) ? mat : [mat]).forEach((m) => m.dispose());
      }
    });
    this.texBrushed.dispose();
    this.texHammered.dispose();
    this.texSpangle.dispose();
    this.texWood.dispose();
    this.texCorten.dispose();
    this.texSign.dispose();
    this.panelPatternTextures.forEach((t) => t.dispose());
    this.panelPatternTextures.clear();
    this.photoTextureCache.forEach((t) => t.dispose());
    this.photoTextureCache.clear();
    this.signImgCache.clear();
    this.model3dCache.forEach((obj) => this.disposeGroup(obj as THREE.Group));
    this.model3dCache.clear();
    this.settingTextures.forEach((t) => t.dispose());
    this.envTexture?.dispose();
    this.controls.dispose();
    this.renderer.dispose();
  }
}
