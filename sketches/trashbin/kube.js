/* kube */
setResolution(2000, 1600)

await loadScript("https://threejs.org/build/three.js")

scene = new THREE.Scene()
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
pointLight = new THREE.PointLight(0xffaacc, 5, 100);
pointLight.position.set(1, 1, 1);
const ambientLight = new THREE.AmbientLight(0x404040, 1); // soft white light
scene.add(ambientLight);

renderer = new THREE.WebGLRenderer()
renderer.setSize(width, height)
geometry = new THREE.BoxGeometry()
material = new THREE.MeshPhongMaterial({
	color: 0x00ff00,
	wireframe: true
})
cube = new THREE.Mesh(geometry, material);
scene.add(cube)
scene.add(pointLight)
camera.position.z = 1.5

// 'update' is a reserved function that will be run every time the main hydra rendering context is updated
update = () => {
	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;
  	cube.position.x = Math.sin(time/8)/0.5;
  	cube.position.y = Math.cos(time/9)/0.8;
  	
    camera.position.z = 3 + Math.abs(Math.sin(time/4))
	if (Math.random() > 0.95) material.wireframe = !material.wireframe;
	renderer.render(scene, camera);
}

s0.init({
	src: renderer.domElement
})

const hues = new Array(16)
	.fill(Math.PI)
	.map(e => e * Math.random() * 0.2);
src(s0)
	.scale(window.innerWidth / window.innerHeight, 1)
	.scale(() => 0.3+a.fft[0])
	.hue(hues)
	.saturate(1.5)
	.out()

src(o0)
	.add(src(o1).hue(0.01)
		.scale([0.8, 0.99].fast(1 / 8)
			.smooth(0.4)), 0.99)
	.blend(solid(),[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1].fast(16),0.3)
	.out(o1)


src(o1)
	.repeat([2, 3].fast(1 / 2), [2, 3].fast(1 / 2))
	.rotate(0.1, 0.1)
	.hue(0.2)
	.diff(src(o1)
		.scale(0.3).hue(0.1).kaleid(8).brightness(.2))
	.out(o2)

src(o2).blend(gradient(1),0.2).brightness(-0.3).mask(src(o1).invert()).add(src(o1),1).out(o3)

render()

metadata = {"index":58,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}