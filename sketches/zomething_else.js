/* zomething else */

bpm = 140

noise([4, 10].fast(0.01)
		.smooth(), 1, 4)
	.diff(src(o0)
		.mult(osc(1, [-1, 1].smooth(), 0.9)))
	.blend(src(o0)
		.rotate(() => a.fft[0]))
	.mask(shape(100)
		.scale(2.4))
	.out(o0)

src(o0)
	.scale(-1)
	.modulate(src(o1)
		.scale([1, 1.1])
		.rotate([0, Math.PI].fast(0.25)))
	.out(o1)

src(o1)
	.repeat(4, 4)
	.scale(1.5)
	.scroll(() => Math.sin(time * 0.4), () => Math.cos(time * 0.33))
	.diff(src(o0)
		.mask(shape(4)
			.scale(1.2, 0.6)))
	.out(o2)

src(o2)
	.blend(o3, 0.9)
		.add(src(o0)
		.mask(shape(4)
			.scale(1.2, 0.6)), 0.8)
	.diff(o2)
	.out(o3)

render(o3)

/* metadata = {"index":17,"type":"code","bpm":"140","midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */