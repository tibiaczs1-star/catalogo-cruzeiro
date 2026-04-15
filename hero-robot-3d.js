(() => {
  const canvas = document.getElementById("hero-3d-canvas");
  if (!canvas) return;

  const canWebGL = (() => {
    try {
      const test = document.createElement("canvas");
      return !!(test.getContext("webgl") || test.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  })();

  if (!canWebGL) return;

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const tag = document.createElement("script");
      tag.src = src;
      tag.onload = resolve;
      tag.onerror = reject;
      document.head.appendChild(tag);
    });

  const initScene = () => {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf7f9fc, 4, 14);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 1.2, 5.2);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x8ef2e4, 1.2);
    keyLight.position.set(2.8, 3.2, 2.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffc38b, 0.9);
    rimLight.position.set(-3.2, 1.8, -2.8);
    scene.add(rimLight);

    const orbitLight = new THREE.PointLight(0x22d3ee, 1.1, 12);
    orbitLight.position.set(0, 2.2, 2.2);
    scene.add(orbitLight);

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2f3f0,
      roughness: 0.18,
      metalness: 0.65
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x0ea5a4,
      roughness: 0.2,
      metalness: 0.7,
      emissive: 0x0ea5a4,
      emissiveIntensity: 0.2
    });
    const warmMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.35,
      metalness: 0.6,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.15
    });

    const group = new THREE.Group();

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), baseMaterial);
    group.add(core);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.35, 0.07, 16, 120),
      accentMaterial
    );
    ring.rotation.x = Math.PI / 2.6;
    group.add(ring);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.05, 12, 90),
      warmMaterial
    );
    ring2.rotation.y = Math.PI / 2.8;
    group.add(ring2);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 16), accentMaterial);
    antenna.position.set(0, 1.2, 0);
    group.add(antenna);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 24), warmMaterial);
    eye.position.set(0, 0.35, 0.9);
    group.add(eye);

    const eyeGlow = new THREE.PointLight(0xffc38b, 0.8, 3);
    eyeGlow.position.copy(eye.position);
    group.add(eyeGlow);

    scene.add(group);

    const grid = new THREE.GridHelper(12, 24, 0x9fe8e0, 0xd8eef0);
    grid.position.y = -1.2;
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    scene.add(grid);

    let mouseX = 0;
    let mouseY = 0;
    window.addEventListener("mousemove", (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = (event.clientY / window.innerHeight) * 2 - 1;
    });

    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      group.rotation.y = t * 0.35 + mouseX * 0.6;
      group.rotation.x = Math.sin(t * 0.4) * 0.12 + mouseY * 0.25;
      ring.rotation.z = t * 0.8;
      ring2.rotation.x = t * 0.6;
      orbitLight.position.x = Math.sin(t * 0.7) * 1.8;
      orbitLight.position.z = Math.cos(t * 0.7) * 1.8 + 1.2;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  };

  loadScript("https://unpkg.com/three@0.158.0/build/three.min.js")
    .then(initScene)
    .catch(() => {});
})();
