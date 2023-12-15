/* pumping colorful */
let rx = 3;
let ry = 3;

osc(3, 0.3, 0)
	.out(o0)

bpm = 140

src(o0)
	.kaleid(4)
	.scale([0.25, 0.2].fast(0.2)
		.ease("easeInOutCubic"))
	.diff(shape(100)
		.scale([0.1, 2].fast(2)
			.smooth())
		.modulate(noise(4, 2))
		.rotate(0, 0.2))
	.rotate(0, -.3)
	.out(o1);

src(o1)
	.blend(src(o2)
		.rotate(() => Math.random() * 0.01), ({
			time
		}) => (Math.sin(time) + 1) / 2 * 0.1 + 0.9)
	.out(o2)

osc(6, 0.2, () => mouse.x/width)
	.diff(src(o3).scale(0.9))
	.scale(({time}) => Math.sin(time/10))
	.modulateKaleid(o2)
	.kaleid(10)
	.mult(o2)
	.out(o3)

render(o3)

metadata = {"index":22,"type":"code","bpm":140,"midi":false,"heat":5,"author":"Alex Szabo"}