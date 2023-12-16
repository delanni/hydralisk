/* csambozimi */
noise(0.2, 0.1, 0.2)
	.out(o0)

src(o0)
	.rotate(0, 0.2)
	.scale(0.1)
	.diff(noise(0.9, 0.1, 0.2))
	.out(o1)

src(o1)
	.modulateScale(o1)
	.pixelate([1000,100].ease())
	.add(src(o2)
		.mult(o3)
		.scale(1.1))
	.out(o2)

osc([10, 3, 15, 9].fast(1 / 16)
				.smooth(0.1), 0.1, 0.9)
			.scroll(0, 0, 0.01, 0.08)
			.kaleid([-2, 2].fast(0.1)
				.smooth()).blend(o3,0.9).out(o3)

render(o2)

metadata = {"index":69,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}