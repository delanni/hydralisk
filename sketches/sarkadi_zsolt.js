/* sarkadi zsolt */
var nx = 10

spb = 60 / bpm

noise(nx, nx / 4)
	.diff(noise(nx, nx / 4)
		.scale(0.9)
		.rotate(0, 0.4))
	.mask(shape(100, 1, 1))
	.modulateScale(shape(100)
		.scale(() => 2 * (1 - (time % spb) / spb)))
	.blend(src(o0).scale(1.1))
	.out(o0)

osc(10, 0.4, 0.6)
	.add(osc(10, 0.5, 0.6))
	.saturate(0.1)
	.kaleid([4, 100].fast(1 / 32)
		.smooth())
	.mult(shape(2, [0, 1].smooth())
		.modulate(o0)
		.rotate([Math.PI / 4, Math.PI / 4 * 2, Math.PI / 4 * 3, Math.PI / 4].smooth(0.2))
		.mult(gradient(1), 2)
		.brightness(0.8)
		.rotate(0, 0.4)
		.kaleid(4))
	.scale([1, 0.3].fast(1 / 16)
		.smooth(0.2))
	.out(o1)

src(o0)
	.mult(o1)
	.diff(src(o1)
		.scale(1.01))
	.add(src(o2)
		.rotate(0, 0.3), 0.3)
	.out(o2)

render(o2)

metadata = {"index":64,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}