/* zodiakus */
const alap = () => shape([2, 2, 3, 3, 4, 4, 4, 4, 5, 5, 6, 6, 6, 6].smooth(0.1), 0.1, 0.9)
	.diff(shape([2, 2, 3, 3, 4, 4, 4, 4, 5, 5, 6, 6, 6, 6, 2, 2].smooth(0.1), 0.9, 0.1))
	.scale(0.3, height / width);

spb = 60 / bpm;
spb5 = 5 * spb;

alap()
	.scale(() => (time % spb5) / spb5 * 17)
	.add(alap()
		.scale(() => ((time + 1 * spb) % spb5) / spb5 * 17))
	.add(alap()
		.scale(() => ((time + 2 * spb) % spb5) / spb5 * 17))
	.add(alap()
		.scale(() => ((time + 3 * spb) % spb5) / spb5 * 17))
	.add(alap()
		.scale(() => ((time + 4 * spb) % spb5) / spb5 * -17))
	.out(o0)

src(o0)
	.scale(0.25)
	.diff(o1)
	.out(o2)

src(o0)
	.diff(src(o2)
		.mult(osc(1, 1, 1))
		.kaleid(2)
		.rotate(() => Math.arcsin(time))
		.scale([1, 0.25].fast(1 / 8)
			.smooth()))
	.mask(alap()
		.scale(3))
	.out(o1)

src(o2)
	.blend(src(o1)
		.scale(1), () => Math.sin(time))
	.diff(o0)
	.out(o3)

render(o3)

metadata = {"index":1,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}