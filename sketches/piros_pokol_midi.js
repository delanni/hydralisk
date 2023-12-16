/* piros pokol midi */
voronoi(1, 2)
	.color(-1, 200, 300)
	.rotate(1, -0.5)
	.pixelate(8)
	.out(o0)

osc(5, 0.01, 3)
	.rotate(2, 3)
	.kaleid(2)
	.repeat(6)
	.pixelate(midi("green", {min: 10, max: 100}))
	.out(o1)

noise(2)
	.color(-29, 1)
	.colorama()
	.out(o3)

src(o0)
	.modulateRotate(o3, midi("red", {min: 1, max: 10}))
	.diff(o0)
	.mult(src(o1).color(100,0,0), midi(65, {max: 1/0.76}))
	.blend(src(o1).color(3,0,0), midi(66, {max: 1/0.76}))
	.diff(shape(100).mult(src(o1)).scale(midi("green", {min: 0.001, max: 6})))
  .out(o2)

render(o2)

metadata = {"index":22,"type":"code","bpm":0,"midi":true,"heat":5,"author":"Alex Szabo"}