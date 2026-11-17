import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { NABIUL_TYPEFACE } from './nabiulTypeface';

interface HeroCanvasProps {
  enabled?: boolean;
  scrollProgress?: number;
}

const FilmVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    grainIntensity: { value: 0.035 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float grainIntensity;
    varying vec2 vUv;

    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453);
    }

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      float dist = distance(vUv, vec2(0.5));
      float vignette = smoothstep(0.92, 0.25, dist);
      float grain = (random(vUv * 420.0) - 0.5) * grainIntensity;
      vec3 finalColor = base.rgb * mix(0.76, 1.0, vignette) + grain;
      gl_FragColor = vec4(finalColor, base.a);
    }
  `,
};

function createSocialCardTexture(title: string, metric: string, tag: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0e0e12';
  ctx.fillRect(0, 0, 512, 640);

  // Subtle top editorial gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 420);
  grad.addColorStop(0, '#1e1a14');
  grad.addColorStop(1, '#0c0c10');
  ctx.fillStyle = grad;
  ctx.fillRect(24, 24, 464, 340);

  // Champagne gold accent frame
  ctx.strokeStyle = 'rgba(212, 180, 117, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, 464, 592);

  // Abstract golden editorial graphic inside card
  ctx.beginPath();
  ctx.arc(256, 194, 88, 0, Math.PI * 2);
  ctx.strokeStyle = '#d4b475';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(130, 194);
  ctx.lineTo(382, 194);
  ctx.strokeStyle = 'rgba(212, 180, 117, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#d4b475';
  ctx.font = '600 18px sans-serif';
  ctx.fillText(tag.toUpperCase(), 48, 412);

  ctx.fillStyle = '#f5f2eb';
  ctx.font = '600 32px Georgia, serif';
  ctx.fillText(title, 48, 462);

  ctx.fillStyle = '#8c8a84';
  ctx.font = '400 20px sans-serif';
  ctx.fillText(metric, 48, 510);

  // Minimal progress bar
  ctx.fillStyle = '#23232a';
  ctx.fillRect(48, 548, 416, 6);
  ctx.fillStyle = '#d4b475';
  ctx.fillRect(48, 548, 310, 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPhoneFeedTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#09090c';
  ctx.fillRect(0, 0, 512, 1024);

  // Header
  ctx.fillStyle = '#d4b475';
  ctx.font = '600 24px sans-serif';
  ctx.fillText('NABIUL STUDIO', 36, 74);

  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(36, 102);
  ctx.lineTo(476, 102);
  ctx.stroke();

  // Feed post 1
  ctx.fillStyle = '#15151b';
  ctx.fillRect(36, 134, 440, 340);
  ctx.strokeStyle = 'rgba(212, 180, 117, 0.35)';
  ctx.strokeRect(36, 134, 440, 340);

  ctx.fillStyle = '#d4b475';
  ctx.beginPath();
  ctx.arc(256, 260, 68, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f5f2eb';
  ctx.font = '500 24px Georgia, serif';
  ctx.fillText('Brand Identity & Systems', 62, 405);
  ctx.fillStyle = '#8c8a84';
  ctx.font = '400 18px sans-serif';
  ctx.fillText('Creative Direction · Typography', 62, 440);

  // Feed post 2
  ctx.fillStyle = '#15151b';
  ctx.fillRect(36, 510, 440, 260);
  ctx.fillStyle = '#f5f2eb';
  ctx.font = '500 22px Georgia, serif';
  ctx.fillText('n8n AI Workflow Pipeline', 62, 568);

  // Mini bars inside phone
  const heights = [64, 96, 82, 120, 108, 136];
  heights.forEach((h, i) => {
    ctx.fillStyle = i % 2 === 0 ? '#d4b475' : '#3a3730';
    ctx.fillRect(62 + i * 62, 735 - h, 38, h);
  });

  // Bottom bar
  ctx.fillStyle = '#141419';
  ctx.fillRect(36, 840, 440, 120);
  ctx.fillStyle = '#d4b475';
  ctx.font = '600 18px sans-serif';
  ctx.fillText('CREATIVE TECHNOLOGY', 62, 898);
  ctx.fillStyle = '#8c8a84';
  ctx.font = '400 16px sans-serif';
  ctx.fillText('Design · Marketing · Automation', 62, 930);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const _pointerTarget = new THREE.Vector2(0, 0);
const _pointerDamped = new THREE.Vector2(0, 0);

export function HeroCanvas({ enabled = true }: HeroCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [fallbackActive, setFallbackActive] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setFallbackActive(true);
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    const container = mountRef.current;
    if (!container) return;

    // Probe Software WebGL safely
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2') || probe.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setFallbackActive(true);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2)
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = !isSoftwareGl && !isMobile;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070708);
    scene.fog = new THREE.FogExp2(0x070708, 0.032);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.4, isMobile ? 13.5 : 9.8);

    // Studio Environment Reflection (mandatory for brushed champagne gold)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmrem.dispose();

    // 3-Point Studio Lighting Rig + Softboxes
    const keyLight = new THREE.DirectionalLight(0xffe7b8, 2.2);
    keyLight.position.set(6, 7, 8);
    if (!isSoftwareGl && !isMobile) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x9fb4d6, 0x1a1510, 0.55);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xd4b475, 1.8);
    rimLight.position.set(-6, 3, -5);
    scene.add(rimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight(0xffe6b3, 4.0, 6, 2);
      softbox.position.set(0, 5, 4);
      softbox.lookAt(0, 0, 0);
      scene.add(softbox);
    }

    // Shared Luxury PBR Materials
    const champagneGoldMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4b475,
      metalness: 0.96,
      roughness: 0.18,
      anisotropy: 0.8,
      clearcoat: 0.55,
      clearcoatRoughness: 0.12,
    });

    const brushedObsidianMat = new THREE.MeshStandardMaterial({
      color: 0x15151a,
      metalness: 0.85,
      roughness: 0.34,
    });

    const glassCardMat = new THREE.MeshPhysicalMaterial({
      color: 0x19191f,
      metalness: 0.1,
      roughness: 0.14,
      transmission: isSoftwareGl ? 0 : 0.65,
      transparent: true,
      opacity: isSoftwareGl ? 0.55 : 0.95,
      ior: 1.5,
      thickness: 0.35,
      clearcoat: 1.0,
    });

    const disposableGeometries: THREE.BufferGeometry[] = [];
    const disposableMaterials: THREE.Material[] = [champagneGoldMat, brushedObsidianMat, glassCardMat];
    const disposableTextures: THREE.Texture[] = [envTexture];

    // 1. Extruded 3D Name: "Nabiul Islam"
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    const fontLoader = new FontLoader();
    const parsedFont = fontLoader.parse(NABIUL_TYPEFACE as unknown as Parameters<FontLoader['parse']>[0]);
    const textGeo = new TextGeometry('Nabiul Islam', {
      font: parsedFont,
      size: isMobile ? 0.62 : 0.82,
      depth: 0.22,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.032,
      bevelSize: 0.022,
      bevelOffset: 0,
      bevelSegments: 4,
    });
    textGeo.computeBoundingBox();
    textGeo.center();
    disposableGeometries.push(textGeo);

    const nameMesh = new THREE.Mesh(textGeo, champagneGoldMat);
    nameMesh.position.set(isMobile ? 0 : 1.1, 0.35, 0.2);
    nameMesh.castShadow = !isSoftwareGl;
    heroGroup.add(nameMesh);

    // Subtle precision ring behind 3D typography
    const ringGeo = new THREE.TorusGeometry(2.35, 0.014, 16, 96);
    disposableGeometries.push(ringGeo);
    const orbitRing = new THREE.Mesh(ringGeo, champagneGoldMat);
    orbitRing.position.set(isMobile ? 0 : 1.1, 0.35, -0.5);
    orbitRing.rotation.x = Math.PI * 0.12;
    heroGroup.add(orbitRing);

    // 2. Rotating Composite Smartphone Group (5 parts)
    const phoneGroup = new THREE.Group();
    const phoneBodyGeo = new THREE.BoxGeometry(1.12, 2.24, 0.11);
    const phoneBezelGeo = new THREE.BoxGeometry(1.16, 2.28, 0.06);
    const phoneScreenGeo = new THREE.PlaneGeometry(0.98, 2.04);
    const phoneCameraBumpGeo = new THREE.BoxGeometry(0.32, 0.36, 0.04);
    const phoneBtnGeo = new THREE.BoxGeometry(0.03, 0.26, 0.04);
    disposableGeometries.push(phoneBodyGeo, phoneBezelGeo, phoneScreenGeo, phoneCameraBumpGeo, phoneBtnGeo);

    const phoneTex = createPhoneFeedTexture();
    phoneTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    disposableTextures.push(phoneTex);
    const phoneScreenMat = new THREE.MeshStandardMaterial({
      map: phoneTex,
      roughness: 0.18,
      metalness: 0.08,
      emissive: 0x111111,
    });
    disposableMaterials.push(phoneScreenMat);

    const phoneChassis = new THREE.Mesh(phoneBodyGeo, brushedObsidianMat);
    const phoneTrim = new THREE.Mesh(phoneBezelGeo, champagneGoldMat);
    const phoneScreen = new THREE.Mesh(phoneScreenGeo, phoneScreenMat);
    phoneScreen.position.z = 0.058;
    const phoneBump = new THREE.Mesh(phoneCameraBumpGeo, champagneGoldMat);
    phoneBump.position.set(-0.28, 0.78, -0.07);
    const phoneBtn = new THREE.Mesh(phoneBtnGeo, champagneGoldMat);
    phoneBtn.position.set(0.57, 0.3, 0);

    phoneGroup.add(phoneChassis, phoneTrim, phoneScreen, phoneBump, phoneBtn);
    phoneGroup.position.set(isMobile ? -1.4 : 4.2, -0.75, -0.8);
    phoneGroup.rotation.set(0.15, -0.42, 0.08);
    if (!isMobile) {
      scene.add(phoneGroup);
    }

    // 3. Floating Glass-Style Social Media Post Cards (3 composite cards)
    const cardsGroup = new THREE.Group();
    scene.add(cardsGroup);

    const cardSpecs = [
      { title: 'Brand System', metric: 'Editorial Identity', tag: 'Graphic Design', pos: [-3.8, 1.85, -1.6], rot: [0.1, 0.35, -0.06] },
      { title: 'n8n Workflow', metric: 'API · Telegram · Sheets', tag: 'AI Automation', pos: [4.1, 2.05, -2.2], rot: [-0.08, -0.3, 0.05] },
      { title: 'Social Growth', metric: 'Campaign Creative', tag: 'Digital Strategy', pos: [-3.4, -1.7, -1.3], rot: [-0.06, 0.28, 0.07] },
    ];

    const cardFrameGeo = new THREE.BoxGeometry(1.54, 1.92, 0.04);
    const cardFaceGeo = new THREE.PlaneGeometry(1.42, 1.78);
    const cardTrimGeo = new THREE.BoxGeometry(1.58, 0.04, 0.06);
    disposableGeometries.push(cardFrameGeo, cardFaceGeo, cardTrimGeo);

    const cardMeshes: THREE.Group[] = [];
    cardSpecs.forEach((spec, idx) => {
      if (isMobile && idx > 1) return;
      const g = new THREE.Group();
      const glassBacking = new THREE.Mesh(cardFrameGeo, glassCardMat);
      const tex = createSocialCardTexture(spec.title, spec.metric, spec.tag);
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      disposableTextures.push(tex);
      const faceMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.28,
        metalness: 0.1,
      });
      disposableMaterials.push(faceMat);
      const face = new THREE.Mesh(cardFaceGeo, faceMat);
      face.position.z = 0.024;
      const topTrim = new THREE.Mesh(cardTrimGeo, champagneGoldMat);
      topTrim.position.y = 0.96;

      g.add(glassBacking, face, topTrim);
      g.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
      g.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
      cardsGroup.add(g);
      cardMeshes.push(g);
    });

    // 4. 3D Analytics Bars (grow with scroll!)
    const analyticsGroup = new THREE.Group();
    analyticsGroup.position.set(isMobile ? 0 : -2.6, -2.15, -0.9);
    scene.add(analyticsGroup);

    const plinthGeo = new THREE.BoxGeometry(2.3, 0.08, 0.52);
    const barUnitGeo = new THREE.BoxGeometry(0.24, 1.0, 0.24);
    barUnitGeo.translate(0, 0.5, 0);
    disposableGeometries.push(plinthGeo, barUnitGeo);

    const plinth = new THREE.Mesh(plinthGeo, brushedObsidianMat);
    analyticsGroup.add(plinth);

    const analyticsBars: THREE.Mesh[] = [];
    const targetBarHeights = [0.55, 0.92, 0.74, 1.28, 1.05, 1.52];
    targetBarHeights.forEach((_, idx) => {
      const bar = new THREE.Mesh(barUnitGeo, idx % 2 === 0 ? champagneGoldMat : brushedObsidianMat);
      bar.position.set(-0.85 + idx * 0.34, 0.04, 0);
      bar.scale.y = 0.35;
      analyticsGroup.add(bar);
      analyticsBars.push(bar);
    });

    // 5. Molecular Chemistry + Creative Tech Hexagonal Ring Assembly (6-part Group)
    const moleculeGroup = new THREE.Group();
    const hexRingGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.05, 6, 1, true);
    const atomGeo = new THREE.OctahedronGeometry(0.085, 1);
    disposableGeometries.push(hexRingGeo, atomGeo);

    const hexFrame = new THREE.Mesh(hexRingGeo, champagneGoldMat);
    hexFrame.rotation.x = Math.PI / 2;
    moleculeGroup.add(hexFrame);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const node = new THREE.Mesh(atomGeo, i % 2 === 0 ? champagneGoldMat : brushedObsidianMat);
      node.position.set(Math.cos(angle) * 0.52, Math.sin(angle) * 0.52, 0);
      moleculeGroup.add(node);
    }
    moleculeGroup.position.set(isMobile ? 1.5 : -4.4, 0.15, -1.4);
    scene.add(moleculeGroup);

    // 6. Sparse Gold Dust Particles (InstancedMesh)
    const particleCount = isMobile ? 48 : 110;
    const dustGeo = new THREE.OctahedronGeometry(0.025, 0);
    disposableGeometries.push(dustGeo);
    const dustMat = new THREE.MeshStandardMaterial({
      color: 0xe8d2a0,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x453418,
      emissiveIntensity: 0.4,
    });
    disposableMaterials.push(dustMat);

    const dustMesh = new THREE.InstancedMesh(dustGeo, dustMat, particleCount);
    dustMesh.frustumCulled = false;

    const particleMeta: { x: number; y: number; z: number; speed: number; phase: number; scale: number }[] = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < particleCount; i++) {
      const meta = {
        x: (Math.random() - 0.5) * 16,
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 9 - 1.5,
        speed: 0.2 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        scale: 0.6 + Math.random() * 0.9,
      };
      particleMeta.push(meta);
      dummy.position.set(meta.x, meta.y, meta.z);
      dummy.scale.setScalar(meta.scale);
      dummy.updateMatrix();
      dustMesh.setMatrixAt(i, dummy.matrix);
    }
    dustMesh.instanceMatrix.needsUpdate = true;
    dustMesh.computeBoundingSphere();
    scene.add(dustMesh);

    // Post-Processing (GPU only; Software WebGL renders cleanly direct)
    let composer: EffectComposer | null = null;
    let filmPass: ShaderPass | null = null;
    if (!isSoftwareGl && !isMobile) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.28, 0.38, 0.85);
      composer.addPass(bloomPass);
      filmPass = new ShaderPass(FilmVignetteShader);
      composer.addPass(filmPass);
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Event Listeners
    const onPointerMove = (e: PointerEvent) => {
      _pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      _pointerTarget.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let scrollRatio = 0;
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollRatio = THREE.MathUtils.clamp(window.scrollY / max, 0, 1);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer?.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setFallbackActive(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    let frameId = 0;
    let disposed = false;
    const timer = new THREE.Timer();
    timer.connect(document);
    let dampedScroll = 0;

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function renderFrame() {
      if (disposed) return;
      timer.update();
      const dt = Math.min(timer.getDelta(), 0.05);
      const elapsed = timer.getElapsed();

      if (!reducedMotion) {
        _pointerDamped.x = THREE.MathUtils.damp(_pointerDamped.x, _pointerTarget.x, 4.5, dt);
        _pointerDamped.y = THREE.MathUtils.damp(_pointerDamped.y, _pointerTarget.y, 4.5, dt);
        dampedScroll = THREE.MathUtils.damp(dampedScroll, scrollRatio, 4.0, dt);

        // Scroll-driven cinematic camera choreography
        const baseZ = isMobile ? 13.5 : 9.8;
        camera.position.x = _pointerDamped.x * 0.55 + Math.sin(dampedScroll * Math.PI * 1.4) * 1.25;
        camera.position.y = 0.4 + _pointerDamped.y * 0.35 - dampedScroll * 1.6;
        camera.position.z = baseZ - dampedScroll * 2.1;
        camera.lookAt(isMobile ? 0 : 0.4, -dampedScroll * 0.6, 0);

        // Hero 3D name subtle floating & mouse parallax
        nameMesh.rotation.y = _pointerDamped.x * 0.16 + Math.sin(elapsed * 0.45) * 0.05;
        nameMesh.rotation.x = -_pointerDamped.y * 0.09;
        orbitRing.rotation.z = elapsed * 0.12 + dampedScroll * 1.5;

        // Rotating smartphone
        phoneGroup.rotation.y = -0.42 + elapsed * 0.32 + dampedScroll * 1.2;
        phoneGroup.position.y = -0.75 + Math.sin(elapsed * 0.8) * 0.14;

        // Floating glass cards
        cardMeshes.forEach((card, idx) => {
          card.position.y = cardSpecs[idx].pos[1] + Math.sin(elapsed * 0.7 + idx * 1.6) * 0.14;
          card.rotation.y = cardSpecs[idx].rot[1] + _pointerDamped.x * 0.12;
        });

        // Analytics bars grow with scrolling
        analyticsBars.forEach((bar, idx) => {
          const scrollBoost = THREE.MathUtils.clamp(dampedScroll * 3.5, 0.25, 1.0);
          const targetH = targetBarHeights[idx] * (0.45 + scrollBoost * 0.75);
          bar.scale.y = THREE.MathUtils.damp(bar.scale.y, targetH, 5.0, dt);
        });

        // Molecular ring spin
        moleculeGroup.rotation.z = elapsed * 0.25;
        moleculeGroup.rotation.y = Math.sin(elapsed * 0.4) * 0.45;

        // Sparse gold dust drift
        for (let i = 0; i < particleCount; i++) {
          const p = particleMeta[i];
          dummy.position.set(
            p.x + Math.sin(elapsed * p.speed + p.phase) * 0.25,
            p.y + Math.cos(elapsed * p.speed * 0.8 + p.phase) * 0.22,
            p.z
          );
          dummy.rotation.set(elapsed * p.speed, elapsed * 0.4, 0);
          dummy.scale.setScalar(p.scale);
          dummy.updateMatrix();
          dustMesh.setMatrixAt(i, dummy.matrix);
        }
        dustMesh.instanceMatrix.needsUpdate = true;

        if (filmPass) {
          filmPass.uniforms.time.value = elapsed;
        }
      }

      if (composer && !isSoftwareGl) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      if (reducedMotion) return; // Render single static frame for reduced motion

      if (isSoftwareGl) {
        afterDraw(renderFrame);
      } else {
        frameId = requestAnimationFrame(renderFrame);
      }
    }

    renderFrame();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      timer.dispose();
      disposableGeometries.forEach((g) => g.dispose());
      disposableMaterials.forEach((m) => m.dispose());
      disposableTextures.forEach((t) => t.dispose());
      composer?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [enabled]);

  if (fallbackActive) {
    return (
      <div className="absolute inset-0 bg-[#070708] overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 68% 38%, rgba(212,180,117,0.22), transparent 52%), radial-gradient(circle at 22% 72%, rgba(212,180,117,0.10), transparent 46%)',
          }}
        />
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-full" aria-hidden="true" />;
}
