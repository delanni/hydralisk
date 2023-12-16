/* tye2 */
/ * tye dye * /
osc(100, 0.01, 1.288)
	.kaleid(100)
	.diff(src(o0)
		.scale(0.7))
	.scroll(0, 0.1)
	.rotate(0, 0.003)
	.out(o0);

src(o0)
	.rotate(0, 0.04)
	.scroll(0, 1)
	.scale([2.5, 10].fast(0.1).smooth())
	.blend(o1, 0.9)
	.out(o1);

osc(100, 0.1, 0.1)
	.mult(osc(100, -0.1, 0.92)
		.rotate(() => Math.sin(time / 10) + Math.PI / 2))
	.diff(src(o2)
		.scale(0.9))
	.scroll(() => Math.sin(time/10)/10, () => Math.cos(time/10)/10)
	.out(o2)

src(o2)
	.add(src(o2))
	.mult(src(o1)
		.blend(solid(1, 1, 1), [0, 0, 0, 1].smooth(0.1)
			.fast(1 / 16)))
	.scale(1.4)
	.modulateHue(o0,0.5)
	.out(o3)

render(o3);

metadata = {"index":74,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}