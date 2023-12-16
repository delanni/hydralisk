/* fraktaliko */
osc(10, 0.1, 0.5)
	.kaleid(100)
	.diff(src(o0)
		.scale([0.95, 1.01].fast(1 / 4)
			.ease('easeInOutCubic'))
		.rotate(0.1))
	.out(o0)

src(o0)
	.rotate(0, 0.1)
	.mask(shape(100, 1))
	.out(o1)

src(o1)
	.repeat(2, 1)
	.diff(src(o2)
		.scale(1.1)
		.rotate(0.01))
	.rotate(0, 0.04)
	.out(o2)

src(o2)
	.blend(o1, [0, 1].fast(1 / 32)
		.smooth(0.1))
	.out(o3)

render(o3)

metadata = {"index":63,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}