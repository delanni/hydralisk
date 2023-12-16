/* valami urhajos */
const KALEID_BASE = () => Math.floor(4);

shape(KALEID_BASE, 0.4, () => Math.abs(5 - (time % 10)) * 0.02)
	.scale([1, 1.8].fast(1 / 4)
		.smooth(), height / width)
	.mult(solid([0, 1].smooth(), 0.5, 1)
		.hue(() => (time / 10) % (Math.PI * 2)))
	.scroll(0, 0, 0.1, 0.15)
	.out(o0)

src(o0)
	.scroll(0, 0, -0.1, -0.15)
	.scale(1 / 10)
	.rotate(0, -0.1)
	.mask(src(o0))
	.add(src(o1)
		.scale(1.05), 0.8)
	.out(o1)

src(o1)
	.repeat(2, 2)
	.kaleid(KALEID_BASE)
	.rotate(0.2)
	.diff(src(o2)
		.scale([0.9, 0.9, 1.05]).blend(solid(0,0,0), [1,1,1,0].smooth(0.7)))
	.out(o2)

src(o1)
	.scale(1 / 10)
	.hue(Math.PI * 1.5)
	.layer(o2)
	.out(o3)

render(o3)

metadata = {"index":79,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}