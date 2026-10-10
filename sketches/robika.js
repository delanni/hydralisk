/* robika */
osc(400, 0.01, 0)
	.contrast([1, 2].smooth())
	.mask(osc(200)
		.rotate([Math.PI / 2-1, Math.PI / 2 + 1].smooth(0.1), 0.01))
	.out(o0)

src(o0)
	.mult(src(o0)
		.scale(0.99)
		.mult(osc(1, 1, 2))
		.kaleid(100))
	.brightness(0.01)
	.modulateScale(o3)
	.out(o1)

src(o1)
	.add(src(o2)
		.scale(1.01), 0.5)
	.out(o2)

src(o2)
	.repeat(3, 3)
	.scale(0.3)
	.saturate(3)
	.diff(src(o2).colorama(0.1))
	.scroll(() => Math.sin(time / 10), 0)
	.rotate(() => Math.arcsin(time /10),0.1)
	.scale(3)
	.out(o3)

render(o3)

/* metadata = {"index":67,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */