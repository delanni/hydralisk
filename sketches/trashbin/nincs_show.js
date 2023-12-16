/* nincs show */
noise([10, 40].fast(1 / 8)
		.smooth(0.05), 0.01)
	.kaleid(4)
	.mult(gradient(1)
          	.hue(() => Math.PI * mouse.y/height)
          	.saturate(()=>1-mouse.y/height)
		.scroll(0, 0, 0.1)
		.kaleid(100))
	.pixelate(150, 50)
	.contrast(() => 100 * mouse.x/width)
	.diff(src(o0)
		.scale(1 / 2)
		.rotate(Math.PI / 2))
	.invert()
	.add(o0, 0.8)
	.out(o0)

src(o0)
	.add(src(o1)
		.scale(1.1)
		.pixelate(10, 10), 0.3)
	.add(src(o1)
		.scale(1.06)
		.pixelate(100, 100), 0.3)
	.saturate(1.4)
	.out(o1)

src(o1).add(src(o1).scale(1/3), () => mouse.y/height *0.5).out(o2)

render(o2)

metadata = {"index":76,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}