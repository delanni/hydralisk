/* Shattered world: */
osc(0.1, 1, [0.3, 0.7, 1.5].smooth())
	.rotate(0, 0.3)
	.scale(0.01)
	.repeat(4, 4)
	.modulateScale(src(o0)
		.scale(-1)
		.diff(o0)
		.scale(10))
	.out(o0)

src(o0)
	.kaleid(4)
	.rotate([0, Math.PI / 2, Math.PI, Math.PI / 2 * 3])
	.scale(-0.25)
	.out(o1)

sc = [4, 6, 8, 10]
bubbles = shape(sc)
	.scale([0, 5].fast(0.1)
		.smooth())
	.repeat(3, 3)
	.diff(shape(sc)
		.scale(0.25))
	.rotate(0, 0.1)

zooms = [1, 2, 3, 4].fast(2 ** -4)
src(o1)
	.diff(bubbles)
	.modulateKaleid(bubbles)
	.repeat(zooms, zooms)
	.out(o2)

src(o2)
	.diff(src(o2)
		.scale([0, 10].fast(0.05)
			.smooth())
	)
	//.modulate(noise(1, 0.04))
	.out(o3)

render(o3)

metadata = {"index":26,"type":"code","midi":false,"heat":5,"author":"Alex Szabo"}