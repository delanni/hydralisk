/* tye dye */
osc(100, 0.01, 1.288)
	.kaleid(100)
	.diff(src(o0)
		.scale(0.9))
	.scroll(0, 0.1)
	.rotate(0, 0.03)
	.out(o0);

src(o0)
	.rotate(0, 0.4)
	.scroll(0, 1)
	.scale(10)
	.out(o1)

src(o2)
	.scale([1.005, 1.03].smooth())
	.diff(shape([3, 4, 5, 7]).rotate(0,0.1)
		.scale([0.1, 0.4, 0.2]))
	.contrast(100)
	.scroll(0.5, 0.5)
	.kaleid([2,-3,4,-5,6,2,4,6,-3,5].fast(1/8).smooth(0.1))
	.blend(o2, [0.98, 0.99].fast(1 / 16)
		.smooth(0.8))
	.out(o2)

src(o2)
	.mult(src(o1)
		.mask(shape(100, 1, 0.3)))
	.out(o3)

render(o3)

metadata = {"index":73,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}