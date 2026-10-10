/* palistation */
shape([3, 4, 100, 2].fast(800), 0.1)
	.rotate([0, 0, 0, Math.PI / 4].fast(800))
	.add(
		shape([3, 4, 100, 2].fast(800), 0.1)
		.rotate([0, 0, 0, Math.PI / 4 * 3].fast(800)))
	.mask(shape(100, 0.1)
		.scale([4, 0.9].ease('easeInOutCubic')))
	.scale([1, 1, 1, 0.4].fast(800))
	.scale([0.9, 4].ease('easeInOutCubic'))
	.out(o0)

src(o0).diff(src(o0).scale(0.8)).out(o1)

src(o1)
	.mult(osc(1, 10, 10))
	.scroll(() => Math.random() - 0.5, () => Math.random() - 0.5)
	.rotate(() => Math.PI * 2 * Math.random())
	.out(o2)

src(o2)
	.add(src(o3), 0.95)
	.out(o3)

render(o3)

/* metadata = {"index":63,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */