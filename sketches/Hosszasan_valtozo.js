/* Hosszasan valtozo */

bpm=140

const s = osc([10,100].fast(0.125).ease("easeInOutCubic"), -0.1, 1)
	.g()
	.color(1, [0, 0.5, 0, 0].fast(0.125)
		.smooth(), [0, 0, 0.5].smooth())

const ripples = s.kaleid([1,5,2,9,3,30].fast(0.125)).invert()

const noize = voronoi([10, 40].fast(0.125)
		.smooth(), 10, 1).modulate(shape([3,4,5]))
	.scale([3, 4])
	.scrollY(0, -0.5)
	.kaleid()
	.rotate(0, 0.1)
	.brightness(0.1)

noize.out(o1)

ripples.out(o0)

noize.mult(ripples,0.3)
	.out(o3)

src(o0)
	.diff(src(o3)
		.scale([0.5, 1.5].fast(0.25).ease("easeInOut"))
		.modulateRotate(src(o1)
			.rotate(0, -0.2)
			.scale([0.2, 3].fast(0.125).smooth())), 0.1)
		.diff(src(o2).brightness([0,0.4].fast(0.01).smooth()), 1)
  .contrast([0.9,1].ease("easeInCubic"))
	.scale(1)
  .out(o2)

render(o2)

metadata = {"index":8,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}