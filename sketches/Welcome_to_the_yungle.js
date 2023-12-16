/* Welcome to the yungle */

osc(1.1, -1, 4)
	.rotate(0, 0.2)
	.out(o0)

src(o0)
	.repeat(10, 10)
	.diff(o0)
	.out(o1)

src(o1)
	.scale(() => Math.sin(time / 10) * 100)
	.out(o2)

src(o1)
	.mult(src(o1)
		.rotate(Math.PI / 2))
	.add(o1)
	.rotate(0, -0.2)
	.out(o2)


src(o2)
	.blend(src(o2)
		.scale(4), [0.1, 0.9].fast(0.1).smooth())
	.diff(src(o2)
		.scrollY(0, Math.PI / 10)
		.scale(0.3))
	.diff(src(o0)).diff(o1)
	.mult(src(o0)
		.rotate(0, 0.2))
	.diff(o1)
	.out(o3)

render(o3)

/* metadata = {"index":11,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */