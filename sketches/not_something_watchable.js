/* not something watchable */
speed = 1

shape(4, 1, 0.1)
	.diff(shape(4, 0.9))
	.mult(osc(1,1,1).kaleid(10))
	.scroll(0, 0, 0.1, -0.12)
	.scale(0.2)
	.kaleid(4)
	.rotate(0, -0.2)
	.kaleid(6)
	.repeat(2, 1)
	.blend(o0, 0.9)
	.out(o0)

src(o0)
	.rotate(Math.PI / 2)
	.diff(src(o0))
	.kaleid(4)
	.out(o1)

src(o1)
	.diff(o2)
	.diff(src(o0).repeat(4,4))
	.add(src(o0)
		.scale(0.5))
	.out(o2)

src(o2).modulateHue(noise(3,3)).scroll(0,0,0.01).diff(src(o3).scale(-1)).out(o3)


render(o3)

/* metadata = {"index":50,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */