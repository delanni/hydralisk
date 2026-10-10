/* magic */
osc(50, (Math.random() - 0.5)/4, 0.9)
	.mult(src(o0)
		.rotate(0.2, 0.3), 0.4)
	.out(o0)

src(o0)
	.diff(src(o0)
		.scale(1.3)
		.rotate(0, -0.3))
	.scale(({
		time
	}) => Math.sin(time / 10) + 1.5)
	.diff(src(o1)
		.modulateRotate(o0))
	.modulate(noise(0.3, 0.3))
	.out(o1)

src(o1)
	.diff(shape(({
		time
	}) => shape(Math.cos(time) * 3 + 3)))
	.blend(o2, 0.9)
	.out(o2)

src(o2)
	.add(shape([4,7,4,5],0.3,0.1).rotate(0, 5).repeat(3,3).modulate(noise(0.3,0.3).rotate(0, 0.3)))
	.mult(src(o0).scroll(0,0,-0.1,0.2), [0,2].fast(0.3).smooth())
	.diff(src(o1).modulateHue(src(o1)))
	.out(o3)

render(o3)

/* metadata = {"index":57,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */