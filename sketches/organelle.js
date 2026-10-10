/* organelle */
noise(3, 0.1)
	.mask(noise(2, 0.1))
	.diff(noise(1, 0.1))
	.colorama(1)
	.mask(shape(4, 0.5)
		.diff(shape(4)))
	.add(src(o0)
		.scale(1.1)
		.rotate(Math.PI / 4), 0.6)
	.diff(noise(3, 0.1)
		.colorama(1)
		.hue(() => time / 100))
	.out(o0)

src(o0)
	.scroll(
		() => Math.sin(time / 10 + 0.3),
		() => Math.cos(time / 12 - 0.1)
	)
	.rotate(() => Math.sin(time / 10) * Math.PI)
	.scale(3)
	.blend(o1, 0.95)
	.out(o1)

osc(100, 0, 0)
	.diff(src(o2)
		.scale([3, 9].fast(1 / 8).ease('easeInOutCubic'))
              .scale([3, 9].fast(1 / 8).ease('easeInOutCubic'))
		.rotate(Math.PI / 2))
	.blend(o2,0.97)
	.out(o2)

src(o1)
	.modulateScale(o2)
	.out(o3)

render(o3)

/* metadata = {"index":62,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */