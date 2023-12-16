/* Bubbles midi */
var x = 0;
var y = 0;
bpm = 140;
n1 = noise(14, 2, 10)
	.contrast(5)
	.invert([0, 0.1, 0, 0.2].fast(0.2)
		.ease("easeInOutQuart"))
	.scale([1.542, 1.2, 1, 0.37].fast(2)
		.ease("easeInOutCubic"))
	.kaleid(3)
	.rotate(3.14 / 8, 0.1);
n2 = noise(7, 2, 10)
	.invert([0, 0.1, 0, 0.6].fast(0.008)
		.ease("easeInOutQuart"))
	.scale([1, 1.2].fast(2)
		.ease("easeInOutCubic"))
	.rotate(-3.14 / 8, -0.12);
n1.blend(n2, [0.855, 1].fast(1.204 ** -5)
		.smooth())
	.out(o0);
voronoi(15.386, 2, [1, 2, 3, 5, 10].fast(0.125)
		.smooth())
	.mult(osc(1, 0.084, 1))
	.saturate([0.1, 0.9].fast(0.2)
		.smooth())
	.brightness(0.4)
	.blend(src(o1), [0.95, 0.99].fast(0.125)
		.smooth())
	.out(o1);
src(o0)
	.modulateScale(src(o1))
	.modulateRotate(src(o1)
		.rotate(0.1, 0.1))
	.add(src(o2), 0.5)
	.mult(src(o1))
	.out(o2);
src(o2)
	.rotate(0, 0.1)
	.scale(midi("red", {min:0, max: 3, transform: Math.sin}))
	.add(src(o2), 0.453)
	.out(o3);
render(o3);

/* metadata = {"index":4,"type":"code","bpm":"140","midi":true,"local":false,"heat":5,"author":"Alex Szabo"} */