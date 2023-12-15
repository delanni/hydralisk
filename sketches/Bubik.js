/* Bubik */
shape(100)
	.diff(shape(100)
		.scale(0.9))
	.scale(1, 0.7)
	.scale(({
		time
	}) => 1 + (time % spb) / spb)
	.out(o0)

bpm = 129
spb = 60 / bpm

src(o0)
	.scroll(() => Math.sin(time + Math.PI) / 2 + 0.5, () => Math.cos(time) / 2 + 0.5, Math.random(), Math.random())
	.scale(0.2)
	.rotate(0, Math.random() / 10)
	.diff(o0)
	.out(o1)

src(o1)
	.blend(src(o1)
		.scale([0, 0.05, 0.5, 0.5].fast(0.1)
			.smooth()))
	.out(o2)

src(o2)
	.diff(src(o2)
		.rotate(-0.01, -0.1)
		.scale(0.1)
		.mult(osc(1, 1, 1)).modulate(noise(2,1), 0.1).invert())
	.blend(src(o2).kaleid(3), 0.1)
	.add(o0)
	.diff(src(o3).contrast([-1,1].fast(0.1).smooth()))
	.out(o3)

render(o3)

metadata = {"index":12,"type":"code","bpm":129,"midi":false,"heat":5,"author":"Alex Szabo"}