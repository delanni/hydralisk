window.threeObjects = {
  init: function () {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    this.light = new THREE.PointLight(0xffffff, 1, 100);
    this.light.position.set(10, 10, 10);
    this.scene.add(this.light);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(width, height);
    this.camera.position.z = 1.5;
  },

  cube: function () {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
    return cube;
  },

  orbital: function (count = 10) {
    const cubes = [];
    const phaseStep = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      const phase = i * phaseStep;
      const size = Math.random();
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        emissive: Math.random() * 0xffffff,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = Math.cos(phase);
      cube.position.y = Math.sin(phase);
      this.scene.add(cube);
      cubes.push(cube);
    }
    cubes.animate = function () {
      this.forEach((cube, index) => {
        const phase = index * phaseStep + Date.now() * 0.001;
        cube.position.x = Math.cos(phase);
        cube.position.y = Math.sin(phase);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      });
    };
    return cubes;
  },
};

// 'update' is a reserved function that will be run every time the main hydra rendering context is updated
update = () => {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
};
