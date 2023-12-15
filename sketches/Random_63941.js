/* Random 63941 */
bpm = 120
const cycleTime = 60 / bpm
const ratio = window.innerHeight / window.innerWidth

shape(4)
	.scale(1, ratio)
	.scale(() => Math.sin(time / 10)/3)
	.repeat(5, 5)
	.scroll(0.5, 0, 0.13, 0.33013921128931)
	.kaleid([5, 5, 5, 7, 5, 5, 5, 9])
	.scroll(0,0,0.1)
	.add(noise(4, 2)
		.mask(shape(4)
			.rotate(0, 0.1)
			.scale(1, ratio)))
	.out(o0)

src(o0)
	.mult(osc(10, -0.1, 0.8)
		.kaleid(20))
	.blend(o1,0.9)
	.out(o1)

src(o1)
	.add(src(o1)
		.scroll([-1, 2].fast(0.1)
			.smooth())
		.rotate(0, 0.1)
		.repeat(3, 3)
		.scale(-0.05).rotate(0,0.1))
	.out(o2)

src(o2)
	.kaleid(4)
	.add(src(o2).rotate(0,0.2))
	.modulateRotate(noise(4, 0.2).kaleid(4), -0.1)
	.blend(o2, 0.7)
	.kaleid(10)
	.saturate(5)

	.out(o3)

render(o3)

metadata = {"index":32,"type":"code","bpm":120,"midi":false,"heat":5,"author":"Alex Szabo"}