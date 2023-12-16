/* Kartyak szines, midi */
speed = 1
const horizontal = shape(4)
	.scrollX(100, 0.11112)
const vertical = shape(4)
	.rotate(0, 0.3)
	.scrollY(100, 0.8)

horizontal.blend(vertical, ({
		time
	}) => Math.sqrt(Math.sin(time) + 1) / 2)
	.blend(o0, 0.9)
	.out(o0)

shape(4)
	.rotate(Math.PI / 8)
	.repeat([4, 6].fast(0.01)
		.smooth(), [6, 4].fast(0.01)
		.smooth())
	.scrollX(0, 0.25)
	.add(
		shape(4)
		.repeat(4, 4)
		.rotate(Math.PI / 4)
		.scrollY(0, 0.5))
	.out(o1)

src(o1)
	.diff(src(o1)
		.scale(({
			time
		}) => (1 / Math.sin(time / 10)))
		.rotate(({
			time
		}) => time / 10000 % Math.PI))
	.pixelate(midi("red", {min:3, max:400}), midi("red", {min: 3, max: 400}))
	.mult(shape(4).scale(30).color(1,0.4,0.1).colorama(midi("yellow", {min: 0, max: 1})), midi("yellow", {min: 0, max: 1}))
	.out(o2)

src(o0)
	.modulateKaleid(o3)
	.add(o2)
	.diff(o1)
	.blend(o3,midi(65, {max: 1.2}))
	.out(o3)

render(o3)

metadata = {"index":27,"type":"code","bpm":0,"midi":true,"heat":5,"author":"Alex Szabo"}