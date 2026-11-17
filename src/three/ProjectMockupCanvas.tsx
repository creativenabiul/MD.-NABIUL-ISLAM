import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface ProjectMockupCanvasProps {
  imageUrl: string;
  title: string;
}

export function ProjectMockupCanvas({ imageUrl, title }: ProjectMockupCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'studio' | 'laptop' | 'mobile'>('studio');
  const viewModeRef = useRef<'studio' | 'laptop' | 'mobile'>('studio');

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
      return;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 480;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0b0e);
    scene.fog = new THREE.FogExp2(0x0b0b0e, 0.04);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 60);
    camera.position.set(1.8, 1.55, 5.2);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const key = new THREE.DirectionalLight(0xffe7ba, 1.8);
    key.position.set(5, 6, 5);
    scene.add(key);

    const hemi = new THREE.HemisphereLight(0xa3b3cc, 0x16120e, 0.55);
    scene.add(hemi);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 2.8;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI * 0.52;

    const aluminumMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e24,
      metalness: 0.88,
      roughness: 0.28,
    });
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4b475,
      metalness: 0.95,
      roughness: 0.18,
      clearcoat: 0.4,
    });

    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x18181f,
      roughness: 0.22,
      metalness: 0.08,
    });

    const disposables: THREE.BufferGeometry[] = [];
    const textureLoader = new THREE.TextureLoader();
    let loadedTexture: THREE.Texture | null = null;
    if (imageUrl) {
      textureLoader.load(
        imageUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          loadedTexture = tex;
          screenMat.map = tex;
          screenMat.color.setHex(0xffffff);
          screenMat.needsUpdate = true;
        },
        undefined,
        () => {}
      );
    }

    // Laptop 3D Assembly (5 parts)
    const laptopGroup = new THREE.Group();
    const baseGeo = new THREE.BoxGeometry(2.8, 0.08, 1.9);
    const trackpadGeo = new THREE.BoxGeometry(0.85, 0.015, 0.55);
    const lidGeo = new THREE.BoxGeometry(2.8, 1.8, 0.06);
    const laptopScreenGeo = new THREE.PlaneGeometry(2.62, 1.62);
    const hingeGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 16);
    disposables.push(baseGeo, trackpadGeo, lidGeo, laptopScreenGeo, hingeGeo);

    const base = new THREE.Mesh(baseGeo, aluminumMat);
    base.position.set(0, 0.04, 0);

    const trackpad = new THREE.Mesh(trackpadGeo, goldMat);
    trackpad.position.set(0, 0.085, 0.55);

    const hinge = new THREE.Mesh(hingeGeo, goldMat);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(0, 0.08, -0.93);

    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.08, -0.94);
    lidPivot.rotation.x = -0.22;

    const lid = new THREE.Mesh(lidGeo, aluminumMat);
    lid.position.set(0, 0.9, 0);
    const laptopScreen = new THREE.Mesh(laptopScreenGeo, screenMat);
    laptopScreen.position.set(0, 0.9, 0.032);
    lidPivot.add(lid, laptopScreen);

    laptopGroup.add(base, trackpad, hinge, lidPivot);
    laptopGroup.position.set(-0.45, -0.5, 0);
    scene.add(laptopGroup);

    // Smartphone 3D Assembly (3 parts)
    const phoneGroup = new THREE.Group();
    const phoneBodyGeo = new THREE.BoxGeometry(0.76, 1.52, 0.07);
    const phoneScreenGeo = new THREE.PlaneGeometry(0.68, 1.42);
    const phoneStandGeo = new THREE.BoxGeometry(0.55, 0.06, 0.45);
    disposables.push(phoneBodyGeo, phoneScreenGeo, phoneStandGeo);

    const phoneBody = new THREE.Mesh(phoneBodyGeo, goldMat);
    phoneBody.position.set(0, 0.78, 0);
    phoneBody.rotation.x = -0.15;

    const phoneScreen = new THREE.Mesh(phoneScreenGeo, screenMat);
    phoneScreen.position.set(0, 0.78, 0.037);
    phoneScreen.rotation.x = -0.15;

    const phoneStand = new THREE.Mesh(phoneStandGeo, aluminumMat);
    phoneStand.position.set(0, 0.03, 0);

    phoneGroup.add(phoneBody, phoneScreen, phoneStand);
    phoneGroup.position.set(1.65, -0.5, 0.45);
    phoneGroup.rotation.y = -0.35;
    scene.add(phoneGroup);

    // Studio Pedestal Plane
    const pedestalGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.12, 48);
    disposables.push(pedestalGeo);
    const pedestal = new THREE.Mesh(pedestalGeo, aluminumMat);
    pedestal.position.set(0.2, -0.56, 0);
    scene.add(pedestal);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    const targetPos = new THREE.Vector3(1.8, 1.55, 5.2);
    const targetLook = new THREE.Vector3(0.2, 0.25, 0);
    let userDragging = false;

    controls.addEventListener('start', () => {
      userDragging = true;
    });

    function animate() {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);

      if (!userDragging) {
        if (viewModeRef.current === 'studio') {
          targetPos.set(1.8, 1.55, 5.2);
          targetLook.set(0.2, 0.25, 0);
        } else if (viewModeRef.current === 'laptop') {
          targetPos.set(-0.45, 0.85, 3.6);
          targetLook.set(-0.45, 0.35, -0.4);
        } else {
          targetPos.set(2.1, 0.75, 2.8);
          targetLook.set(1.65, 0.28, 0.45);
        }

        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPos.x, 4.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPos.y, 4.5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPos.z, 4.5, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, targetLook.x, 4.5, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, targetLook.y, 4.5, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, targetLook.z, 4.5, dt);
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        frameId = window.setTimeout(() => requestAnimationFrame(animate), 80);
      } else {
        frameId = requestAnimationFrame(animate);
      }
    }

    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      disposables.forEach((g) => g.dispose());
      aluminumMat.dispose();
      goldMat.dispose();
      screenMat.dispose();
      envTex.dispose();
      loadedTexture?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [imageUrl]);

  return (
    <div className="relative w-full h-[420px] md:h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-[#0b0b0e]">
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        aria-label={`Interactive 3D laptop and smartphone mockup for ${title}`}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-lg bg-[#111114]/90 border border-white/10">
        {(['studio', 'laptop', 'mobile'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 capitalize ${
              viewMode === mode
                ? 'bg-[#D4B475] text-[#070708]'
                : 'text-[#F5F2EB]/70 hover:text-[#F5F2EB]'
            }`}
          >
            {mode === 'studio' ? 'Full Studio' : mode === 'laptop' ? 'Laptop View' : 'Mobile View'}
          </button>
        ))}
      </div>
    </div>
  );
}
