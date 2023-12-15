/* Pszichedelikus kaleidoszkop 1. */
bpm = 140/2
const c = [0.7, 0.9, 1]
const ease = [-0.1011, 0.1].ease("easeInOutCubic")
const ease2 = [-0.1, 0.1].fast(1.0).smooth().ease("easeInOutCubic")

noise([4, 12].fast(0.1)
		.smooth(), 2)
	.kaleid(3, 5, 9)
	.blend(osc(3, 0.1, -0.8))
	.modulateHue(osc(10, 11, 1))
	.scale([0.1, 1.5].fast(0.04)
		.smooth())
	.rotate(0, 1)
	.scroll(ease, ease2)
	.color(c.offset(2), c.smooth(), c.offset(3)
		.smooth())
	.blend(src(o0)
		.scale([1.001, 1.01].fast(0.01)
			.ease("easeInOutCubic")), [0.8,0.99].fast(0.1).smooth())
	.rotate(0, 0.01)
	.scale([1.01, 0.81].fast(0.1)
		.smooth()).kaleid(6)
	.rotate(0,0.1)
	.out()

metadata = {"index":15,"type":"code","midi":false,"heat":5,"author":"Alex Szabo"}