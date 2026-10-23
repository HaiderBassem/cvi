import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/**
 * Interactive 3D backdrop for a project page.
 *
 * - Loaded on demand: this module (and three.js with it) is only fetched on a project page
 *   that has a model, and the GLB only when that page opens.
 * - The *camera* orbits, the model never moves, so the shadow map is rendered once.
 * - No zoom and no pan: the wheel is never captured, so page scrolling stays natural; on touch
 *   screens vertical swipes still scroll, horizontal drags orbit.
 * - Finishes are art-directed here by class (the GLB nodes are named stone / glass / metal /
 *   wood / ground / water / green); the source files carry no textures.
 */

export type ShadingMode = 'solid' | 'clay' | 'blueprint';

export interface BackdropOptions {
  canvas: HTMLCanvasElement;
  /** Element that receives the drag gesture (the hero). */
  stage: HTMLElement;
  reducedMotion: boolean;
}

export interface BackdropModel {
  url: string;
  /** Compressed size, used for the progress bar when the server does not send a length. */
  bytes: number;
}

type Cls = 'stone' | 'glass' | 'metal' | 'wood' | 'ground' | 'water' | 'green';

const PALETTE = {
  stone: { color: '#e6dccb', roughness: 0.74, metalness: 0 },
  glass: { color: '#9cc9ea', roughness: 0.05, metalness: 0.2 },
  metal: { color: '#4b4136', roughness: 0.36, metalness: 0.85 },
  wood: { color: '#6e4b33', roughness: 0.6, metalness: 0 },
  ground: { color: '#141a22', roughness: 0.96, metalness: 0 },
  water: { color: '#1e5c84', roughness: 0.1, metalness: 0.25 },
  green: { color: '#30594a', roughness: 0.92, metalness: 0 },
} as const;

const SKY = '#4cb8f5';

export class BackdropEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.5, 4000);
  private controls: OrbitControls;
  private env: THREE.Texture;
  private hemi = new THREE.HemisphereLight('#cfe6ff', '#26303c', 0.55);
  private sun = new THREE.DirectionalLight('#fff4e4', 2.7);
  private rim = new THREE.DirectionalLight(SKY, 1.5);
  private root = new THREE.Group();

  private meshes: { mesh: THREE.Mesh; cls: Cls; solid: THREE.Material }[] = [];
  private owned: { dispose(): void }[] = [];
  private clayMat = new THREE.MeshStandardMaterial({ color: '#eee8de', roughness: 0.92, metalness: 0 });
  private clayGlass = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4, transparent: true, opacity: 0.35, depthWrite: false });
  private blueprintMat = new THREE.MeshBasicMaterial({
    color: '#08121d',
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    side: THREE.DoubleSide,
  });
  private lineMat = new THREE.LineBasicMaterial({ color: SKY, transparent: true, opacity: 0.2, depthWrite: false });
  private glassMats: THREE.MeshStandardMaterial[] = [];
  private groundFade = { value: new THREE.Vector2(60, 90) };

  private shading: ShadingMode = 'solid';
  private night = false;
  private hasModel = false;
  private disposed = false;
  private raf = 0;
  private dirty = true;
  private frame = 0;
  private scroll = 0;
  private baseShift = 0;
  private viewShiftY = 0;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private dpr: number;
  private minDpr = 1;
  private slowFrames = 0;
  private lastT = 0;
  private home = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  private reduced: boolean;
  private shadowsOn: boolean;
  private mobile: boolean;
  private offResize: () => void;

  constructor(private opts: BackdropOptions) {
    const { canvas, stage } = opts;
    this.reduced = opts.reducedMotion;
    this.mobile = window.matchMedia('(max-width: 767px)').matches || window.matchMedia('(pointer: coarse)').matches;
    this.shadowsOn = !this.mobile;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 1.75);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !this.mobile || this.dpr < 2,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(this.dpr);
    if (this.shadowsOn) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      // Nothing in the scene moves, so the shadow map is rendered once per lighting change.
      this.renderer.shadowMap.autoUpdate = false;
    }

    // Soft studio reflections so stone, glass and metal read as real materials.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = this.env;
    this.scene.environmentIntensity = 0.45;

    this.scene.add(this.hemi, this.sun, this.sun.target, this.rim, this.root);
    if (this.shadowsOn) {
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(2048, 2048);
      this.sun.shadow.bias = -0.0006;
      this.sun.shadow.normalBias = 0.2;
      this.sun.shadow.radius = 3;
    }

    this.controls = new OrbitControls(this.camera, stage);
    const c = this.controls;
    c.enableZoom = false; // by design: the page scrolls, the model turns
    c.enablePan = false;
    c.enableDamping = true;
    c.dampingFactor = 0.07;
    c.rotateSpeed = 0.6;
    c.autoRotate = !this.reduced;
    c.autoRotateSpeed = 0.45;
    c.minPolarAngle = Math.PI * 0.1;
    c.maxPolarAngle = Math.PI * 0.485; // never below the ground
    stage.style.touchAction = 'pan-y'; // vertical swipes keep scrolling the page
    c.addEventListener('change', () => (this.dirty = true));

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
      this.dirty = true;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const onResize = () => this.resize();
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas.parentElement ?? canvas);
    this.offResize = () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };

    this.resize();
    this.applyLighting();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  // ---- loading ------------------------------------------------------------------------
  async load(model: BackdropModel, onProgress: (ratio: number) => void): Promise<void> {
    const res = await fetch(model.url, { credentials: 'same-origin' });
    if (!res.ok || !res.body) throw new Error(`Model request failed (${res.status})`);
    const total = Number(res.headers.get('content-length')) || model.bytes || 0;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (total) onProgress(Math.min(0.97, received / total));
      if (this.disposed) {
        void reader.cancel();
        return;
      }
    }
    const data = new Uint8Array(received);
    let off = 0;
    for (const ch of chunks) {
      data.set(ch, off);
      off += ch.length;
    }

    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.parseAsync(data.buffer, '');
    if (this.disposed) {
      this.disposeObject(gltf.scene);
      return;
    }
    this.mount(gltf.scene);
    onProgress(1);
  }

  private mount(scene: THREE.Group) {
    const bounds = new THREE.Box3();
    const tmp = new THREE.Box3();
    scene.updateMatrixWorld(true);

    scene.traverse((o) => {
      const line = o as THREE.LineSegments;
      if (line.isLineSegments) {
        (line.material as THREE.Material).dispose();
        line.material = this.lineMat;
        line.frustumCulled = false;
        return;
      }
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const cls = ((mesh.material as THREE.Material).name || 'stone') as Cls;
      const solid = this.finish(cls);
      (mesh.material as THREE.Material).dispose();
      mesh.material = solid;
      mesh.castShadow = this.shadowsOn && (cls === 'stone' || cls === 'metal' || cls === 'wood');
      mesh.receiveShadow = this.shadowsOn && cls !== 'glass';
      mesh.renderOrder = cls === 'ground' || cls === 'water' ? -1 : cls === 'glass' ? 2 : 0;
      this.meshes.push({ mesh, cls, solid });
      if (cls !== 'ground' && cls !== 'water' && cls !== 'green') {
        mesh.geometry.computeBoundingBox();
        tmp.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld);
        bounds.union(tmp);
      }
    });

    if (bounds.isEmpty()) bounds.setFromObject(scene);
    this.root.add(scene);
    this.hasModel = true;
    this.frameModel(bounds);
    this.setShading(this.shading);
    this.applyLighting();
    this.dirty = true;
  }

  private finish(cls: Cls): THREE.Material {
    const p = PALETTE[cls] ?? PALETTE.stone;
    const m = new THREE.MeshStandardMaterial({
      color: p.color,
      roughness: p.roughness,
      metalness: p.metalness,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    if (cls === 'glass') {
      m.transparent = true;
      m.opacity = 0.4;
      m.depthWrite = false;
      m.envMapIntensity = 1.8;
      m.emissive = new THREE.Color('#ffb766');
      m.emissiveIntensity = 0;
      this.glassMats.push(m);
    } else if (cls === 'water') {
      m.transparent = true;
      m.opacity = 0.85;
      m.envMapIntensity = 1.4;
    } else if (cls === 'ground') {
      m.transparent = true; // faded to nothing at the rim so the site dissolves into the page
      m.depthWrite = false;
      m.polygonOffset = false;
      m.envMapIntensity = 0.25;
      m.onBeforeCompile = (shader) => {
        shader.uniforms.uFade = this.groundFade;
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vSitePos;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSitePos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vSitePos;\nuniform vec2 uFade;')
          .replace('#include <opaque_fragment>', 'diffuseColor.a *= 1.0 - smoothstep(uFade.x, uFade.y, length(vSitePos.xz));\n#include <opaque_fragment>');
      };
    }
    this.owned.push(m);
    return m;
  }

  /** Aims the camera at the building and sizes the shadow volume to it. */
  private frameModel(box: THREE.Box3) {
    const size = box.getSize(new THREE.Vector3());
    const height = size.y;
    const footprint = Math.hypot(size.x, size.z);
    const flat = height < footprint * 0.06; // a plan or a masterplan: look down on it
    const radius = Math.max(footprint * 0.5 * 0.98, height * 1.05, 26);
    const dist = (radius / Math.sin(THREE.MathUtils.degToRad(this.camera.fov / 2))) * 1.12;

    const target = new THREE.Vector3(0, Math.min(height * 0.38, radius * 0.45), 0);
    const polar = THREE.MathUtils.degToRad(flat ? 46 : 68);
    const azimuth = THREE.MathUtils.degToRad(38);
    const pos = new THREE.Vector3(Math.sin(polar) * Math.sin(azimuth), Math.cos(polar), Math.sin(polar) * Math.cos(azimuth))
      .multiplyScalar(dist)
      .add(target);

    this.camera.position.copy(pos);
    this.camera.near = Math.max(0.5, dist / 200);
    this.camera.far = dist * 12;
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(target);
    this.controls.update();
    this.home.pos.copy(pos);
    this.home.target.copy(target);

    // The ground fades out just beyond the building's reach
    const reach = Math.max(footprint * 0.5 * 1.15, radius * 0.9);
    this.groundFade.value.set(reach * 0.78, reach * 1.32);

    const s = radius * 1.5;
    this.sun.position.set(radius * 1.2, radius * 2.1, radius * 0.9);
    this.sun.target.position.set(0, 0, 0);
    this.rim.position.set(-radius * 1.4, radius * 0.8, -radius * 1.2);
    const cam = this.sun.shadow.camera;
    cam.left = -s;
    cam.right = s;
    cam.top = s;
    cam.bottom = -s;
    cam.near = 1;
    cam.far = radius * 6;
    cam.updateProjectionMatrix();
    this.resize();
  }

  // ---- state -----------------------------------------------------------------------
  setShading(mode: ShadingMode) {
    this.shading = mode;
    for (const { mesh, cls, solid } of this.meshes) {
      if (mode === 'solid') mesh.material = solid;
      else if (mode === 'clay') mesh.material = cls === 'glass' ? this.clayGlass : this.clayMat;
      else mesh.material = this.blueprintMat;
      mesh.visible = !(mode === 'blueprint' && (cls === 'ground' || cls === 'water'));
    }
    this.applyLighting();
  }

  setNight(night: boolean) {
    this.night = night;
    this.applyLighting();
  }

  setAutoRotate(on: boolean) {
    this.controls.autoRotate = on && !this.reduced;
    this.dirty = true;
  }

  /** 0 at the top of the page, 1 once the hero has scrolled away. */
  setScroll(p: number) {
    const next = Math.min(1, Math.max(0, p));
    if (Math.abs(next - this.scroll) < 0.002) return;
    this.scroll = next;
    this.dirty = true;
  }

  resetView() {
    this.camera.position.copy(this.home.pos);
    this.controls.target.copy(this.home.target);
    this.controls.update();
    this.dirty = true;
  }

  private applyLighting() {
    const night = this.night;
    const blue = this.shading === 'blueprint';
    this.hemi.intensity = night ? 0.18 : blue ? 0.3 : 0.55;
    this.hemi.color.set(night ? '#5b86c4' : '#cfe6ff');
    this.sun.intensity = night ? 0.35 : blue ? 0.6 : 2.7;
    this.sun.color.set(night ? '#7d9fe0' : '#fff4e4');
    this.rim.intensity = night ? 2.6 : 1.5;
    this.scene.environmentIntensity = night ? 0.1 : 0.45;
    this.renderer.toneMappingExposure = night ? 1.25 : 1.05;
    for (const g of this.glassMats) g.emissiveIntensity = night ? 1.25 : 0;
    this.lineMat.color.set(blue ? '#5cc2fb' : night ? '#7fd0ff' : SKY);
    this.lineMat.opacity = blue ? 0.95 : night ? 0.38 : this.shading === 'clay' ? 0.24 : 0.2;
    this.blueprintMat.color.set(night ? '#050c15' : '#0a1a2b');
    if (this.shadowsOn) this.renderer.shadowMap.needsUpdate = true;
    this.dirty = true;
  }

  // ---- sizing & loop -----------------------------------------------------------------
  private resize() {
    const parent = this.opts.canvas.parentElement ?? this.opts.canvas;
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Wide screens: the building sits right of the headline. Portrait: it sits above it.
    this.baseShift = w / h > 1.15 ? -w * 0.17 : 0;
    this.viewShiftY = w / h > 1.15 ? 0 : h * 0.14;
    this.applyView(w, h);
    this.dirty = true;
  }

  private applyView(w = this.renderer.domElement.clientWidth, h = this.renderer.domElement.clientHeight) {
    // Parallax from the pointer is a few pixels of view offset: cheap, and it never touches the shadow map.
    const shiftX = this.baseShift * (1 - this.scroll * 0.75) + this.pointer.x * 14;
    const shiftY = this.viewShiftY * (1 - this.scroll) + this.pointer.y * 9;
    this.camera.setViewOffset(w, h, shiftX, shiftY, w, h);
  }

  private loop(now: number) {
    this.raf = requestAnimationFrame(this.loop);
    if (this.disposed || document.hidden || !this.hasModel) return;

    // Past the hero the scene is only a dimmed backdrop: half rate saves battery.
    this.frame++;
    if (this.scroll > 0.85 && this.frame % 2) return;

    this.pointer.x += (this.pointer.tx - this.pointer.x) * 0.06;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * 0.06;
    const moving = Math.abs(this.pointer.tx - this.pointer.x) + Math.abs(this.pointer.ty - this.pointer.y) > 0.001;

    const changed = this.controls.update();
    if (!changed && !moving && !this.dirty) return;
    this.dirty = false;
    this.applyView();
    this.renderer.render(this.scene, this.camera);

    // Adaptive resolution: if frames stay slow, lower the pixel ratio a notch.
    if (this.lastT) {
      const dt = now - this.lastT;
      this.slowFrames = dt > 34 ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 1);
      if (this.slowFrames > 45 && this.dpr > this.minDpr) {
        this.dpr = Math.max(this.minDpr, this.dpr - 0.25);
        this.renderer.setPixelRatio(this.dpr);
        this.slowFrames = 0;
        this.resize();
      }
    }
    this.lastT = now;
  }

  // ---- teardown -------------------------------------------------------------------
  private disposeObject(obj: THREE.Object3D) {
    obj.traverse((o) => {
      const d = o as THREE.Mesh;
      if (d.geometry) d.geometry.dispose();
      const mat = d.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.offResize();
    this.controls.dispose();
    this.disposeObject(this.root);
    this.owned.forEach((m) => m.dispose());
    [this.clayMat, this.clayGlass, this.blueprintMat, this.lineMat].forEach((m) => m.dispose());
    this.sun.shadow.map?.dispose();
    this.env.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
