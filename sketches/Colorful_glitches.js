/* Colorful glitches */
bpm = 130

const beats = (b) => 60 / bpm * b
const linear = (min, max) => v => min + (max - min) * v;
const exponential = (min, max) => v => min + (max - min) ** v;
const saw = (period, fn) => ({
	time
}) => {
	return fn((time % period) / period)
}


shape(100)
.diff(shape(3).rotate(0,0.1).scale(saw(beats(32), linear(0,0.9))))
	.scale(0.3)
	.blend(src(o0)
		.scale(1.04), [0.93, 0.968, 0.98].smooth())
	.out(o0)

src(o0)
	.mult(osc(4, 1, 10))
	.modulateRotate(src(o1)
		.scale([0.1, .4].fast(0.1)
			.smooth())
		.rotate(0.1, 0.2)
		.invert())
	.out(o1)

src(o1)
	.scale([-.2, 0.1].fast(0.05)
		.smooth())
	.rotate(0.1, 0.1)
	.modulate(noise(40, 0.3))
	.add(o1, -0.2)
	.diff(src(o2).scale(-0.3))
	.out(o2)

src(o1).add(o2, 0.7).out(o3)

render(o3)

metadata = {"index":20,"type":"code","bpm":130,"midi":false,"heat":5,"author":"Alex Szabo"}