/* Burning squares */
shape(4)
	.scale(1, height / width)
	.modulate(noise(4,2,4), [0,1].fast(0.1).smooth())
	.mult(osc(1,0.1,1).kaleid(10))
	.rotate(0,-0.15)
	.out(o0)

src(o0)
	.blend(src(o0)
		.scale(0.8)
		.rotate(0.3, 0.4))
	.blend(src(o1)
		.scroll(0.2)
		.kaleid(4))
	.out(o1)

src(o1)
	.add(src(o1)
		.scale(0.9))
	.add(src(o1)
		.scale(0.8))
	.add(src(o1)
		.scale(0.7))
	.rotate(0, -0.2)
	.diff(src(o1)
		.scale(() => Math.log(Math.min(3000, Math.max(0.4, Math.tan(time / 10) * Math.cos(time/10/2))))))
	.out(o2)

src(o2).diff(src(o3).repeat(3,3).kaleid(4).rotate(0.1,0.1)).out(o3)

render(o3)

/* metadata = {"index":6,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */