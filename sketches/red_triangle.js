/* red triangle */
shape(3)
	.diff(shape(3)
		.scale(0.9))
	.add(src(o0)
         .scroll(0,0,0.05)
         .kaleid(4)
		.repeat(3, 3)
		.scroll([-0.2, 0, 0.3].ease('linear'), [0.3, 0.6, 0.9, 0.6].ease('linear'), 0.3, -0.2)
		.rotate(0, 0.1), [0.4,0.6].smooth())
	.add(src(o0)
		.scale(0.5)
		.rotate([0, 0.3, .68, 0.89, 1.3, 1.6]), 0.3)
	.out(o0)

src(o0)
	.contrast(2)
	.modulateScale(o0,[-10,10].ease('linear'))
	.modulateRotate(o0,[-4,4].fast(0.8).smooth())
	.add(shape(3))
	.mult(osc(1, 1, 0).mult(solid(1,0,0)))
	.blend(o1,0.9)
	.add(o0,0.4)
	.out(o1)

render(o1)

/* metadata = {"index":56,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */