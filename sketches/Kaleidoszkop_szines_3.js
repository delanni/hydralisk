/* Kaleidoszkop szines 3 */
bpm = 140/2
const c = [0.7, 0.9, 1]
const ease = [-0.1011, 0.1].fast(0.5).ease("easeInOutCubic")
const ease2 = [-0.1, 0.1].fast(0.5).smooth().ease("easeInOutCubic")

noise([4, 12].fast(0.1)
		.smooth(), 2)
	.kaleid(3, 5, 9)
	.blend(osc(3, 0.1, -0.8))
	.modulateHue(osc(10, 11, 1))
	.scale([0.01, 1].fast(0.1)
		.smooth())
	.rotate(0, 1)
	.scroll(ease, ease2)
	.color(c.offset(2), c.smooth(), c.offset(3)
		.smooth())
	.diff(src(o0)
		.scale([1.001, 1.01].fast(0.01)
			.ease("easeInOutCubic")), 0.09)
	.rotate(0, 0.01)
	.scale([1.01, 0.04].fast(0.1)
		.smooth()).scrollY(0,0.1)
	.scale([0.05, 0.2, 0.5, 1, 2].fast(0.05).smooth())
.kaleid([5,9].fast(0.2).smooth()).rotate(0, 0.3)
	.out()

/* metadata = {"index":27,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */