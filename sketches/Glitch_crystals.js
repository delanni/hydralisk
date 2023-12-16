/* Glitch crystals */

const COORDS = [
	[-1, -1],
	[0, -1],
	[1, -1],
	[-1, 0],
	[0, 0],
	[1, 0],
	[-1, 1],
	[0, 1],
	[1, 1]
]

var c = (r = Math.random() * Math.PI - Math.PI / 2) => shape(Math.random() * 4 + 3)
	.scale(1, 2)
	.rotate(r, 0.1 * r)
	.color(() => Math.sin(time * r), 1 - r, (r + Math.random()) % 1)
	.hue(() => time * r / 10)

c(Math.random())
	.blend(c())
	.blend(c())
	.out(o0)

var zy = (i) => src(o0)
	.scale(1 / 3)
	.rotate(0, Math.random() * i - 3)
	.mask(shape(4)
		.scale(1.093))
	.scrollX(1 / 3 * COORDS[i][0])
	.scrollY(1 / 3 * COORDS[i][1])
	.scrollX(0, 0.2)

zy(0)
	.add(zy(1))
	.add(zy(2))
	.add(zy(3))
	.add(zy(4))
	.add(zy(5))
	.add(zy(6))
	.add(zy(7))
	.add(zy(8))
	.out(o1)

src(o0)
	.mult(o1, 0.8)
	.diff(src(o2)
		.blend(src(o2)
			.scale(0.7)), [1, 0, -2].fast(1 / 10)
		.smooth())
	.out(o2)

src(o2)
	.scale(-1.01)
	.scrollX(0, 0.1)
	.brightness(0.3)
	.diff(o2)
	.mult(src(o0)
		.brightness(0.3))
	.add(o2)
	.out(o3)

render(o3)

metadata = {"index":5,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}