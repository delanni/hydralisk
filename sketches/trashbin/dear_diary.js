/* dear diary */
shape(6, [0.05, 0.01].smooth())
	.scroll(0, 0, 0.1, 0.3)
	.add(src(o0)
		.scroll([0.001, 0.0087, -0.001].map(e => Math.random() * 5), [0.003, -0.007, -0.015, 0.001].map(e => Math.random() * 5))
		.rotate(new Array(30)
			.fill(0)
			.map(() => (Math.random() / 20) * Math.PI)
			.smooth(0.1))
		.brightness([-0.4, 0, -0.02, -0.05, -0.2, 0, 0.001, 0].smooth(0.1)))
	.out(o0)

src(o0)
	.mult(osc([1, 10].fast(0.01)
		.smooth(), 0, 0.9).hue(() => Math.sin(time)/50))
	.out(o1)

src(o1)
	.repeat(3)
	.kaleid([2, 6, 4, 2, 6, 4, 6, 4, 8].fast(1 / 8))
	.rotate([Math.PI / 4, 0, Math.PI / 2, 0, Math.PI / 3].fast(1 / 8))
	.add(src(o2), () => 0.8 + Math.sin(time * 10) / 10)
	.out(o2)

src(o2)
	.blend(src(o1).scale([1/3, 1/6, 5/6].fast(1/8).smooth(0.1)).rotate([0,1,2,3].fast(1/16)).add(o3,0.3), [0,1].fast(1/32).smooth(0.1))
	.out(o3)

render(o3)

metadata = {"index":68,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}