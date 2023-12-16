/* nether portal */
osc(100, 0.1, 0.9)
	.modulate(osc(100, 0.01, 0)
		.rotate(0.0, 0.1)
		.scale(10))
	.out(o0)

src(o0)
	.r()
	.mult(solid(1))
	.diff(src(o1)
		.scale(1, () => Math.sin(time)))
	.modulateScale(shape(100)
		.mask(shape(4)
			.scroll(0, -0.2))
		.scale(5))
	.add(src(o1).scroll(0.5),0.3)
	.out(o1)

shape(4, 0.8, 0.1)
	.diff(src(o2)
		.blend(solid(0), [0, 1].smooth(0.2))
		.mult(noise(3, 0.3)))
	.kaleid([10, 8, 6, 5, 4].fast(1/4))
	.scroll([0.1,0.2,0.3, 0.2, 0.1].fast(1/2).smooth(0.2), 0.1,Math.random()/10-0.05,Math.random()/10-0.05)
	.kaleid(2)
	.blend(src(o2).scale(-1).scale(0.8).invert(),[0,0,0,0.8, 0, 0, 0, -0.3].smooth(0.2))
	.blend(src(o2).scale(0.9),0.8)
	.colorama()
	.blend(shape(4,2),[0,0,0,0.6].fast(1/2).smooth(0.2))
	.out(o2)

src(o1).layer(o1,0)
	.add(src(o1).scale(-1).invert().mask(o0),[-1,1].fast(1/8).smooth())
	.hue(() => Math.sin(time/10)/10)
	.mult(src(o2).scale([1/2, 1/3, 1/4, 1/5, 1/6, 1/4].fast(1/3).smooth()))
	.add(src(o1).scale(1.1),0.2)
	.mult(o2,1.5)
	.out(o3)

render(o3)

metadata = {"index":66,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}