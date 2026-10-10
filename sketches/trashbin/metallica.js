/* metallica */
shape(2, () => Math.cos(time / 10) + 1)
	.diff(src(o0)
		.scroll(0, 0, 0.1, 0.1)
		.kaleid(4))
	.rotate([0, Math.PI / 4, Math.PI / 4 * 2, Math.PI / 4 * 3].smooth(0.05)
		.fast(1 / 8))
	.add(shape(6, 0.3, 0.1)
		.diff(shape(6, 0.1, 0.05)))
	.mask(shape(100, 1))
	.blend(o0, [0.95, 0.9].fast(1 / 8)
		.smooth())
	.out(o0)

osc(11, [0.005,0.001].fast(1/8).smooth(), 1)
	.add(osc(10, 0.001, 0.1)
		.scroll(0.5)
		.kaleid(6)
		.rotate(0, 0.5))
	.diff(shape(100, 0.1, 1))
	.mask(shape(100, 1, 0.1))
	.rotate(0, -0.01)
	.scale(() => 1 + Math.sin(time) / 4)
	.out(o1)

src(o0)
	.mult(o1)
	.out(o2)

src(o2).
	blend(src(o2).diff(src(o3).scale(0.8)), [0,0,0,0,0,0,0,1].smooth(0.2)).out(o3)

render(o3)

metadata = {"index":61,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}