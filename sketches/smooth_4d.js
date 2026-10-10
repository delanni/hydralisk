/* smooth 4d */
gradient(1, [0.4, 0.2].fast(0.3)
		.smooth(), [0.2, 0.3].smooth())
	.scroll(0, 0, 0.1, 0.21)
	.rotate(0, 0.1)
	.kaleid(100)
	//.pixelate(20, 20)
	.scale([4, 1].fast(0.2).smooth(0.8),[1,2].fast(0.1).smooth(0.3))
	.scroll(0,0, 0.1)
	.blend(o0,0.95)
	.out(o0)

src(o0)
	.diff(shape(4, 0.8, 0.4)
		.pixelate(10, 10)
		.repeat(3,3)
		.rotate(Math.PI / 2, 0.1))
	.out(o1)


src(o1)
	.diff(src(o1)
		.rotate(0, -0.1))
	.diff(src(o1)
		.scale(0.15))
	.out(o2)

src(o2)
	.mask(shape(4, 0.4, 0.6))
	.modulateScale(src(o2).contrast(0.9).scale(10))
	.diff(o2)
	.out(o3)

render(o3)

/* metadata = {"index":43,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */