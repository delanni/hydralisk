/* LSD tunnel */
const rolling = [];

const randomArr = new Array(7).fill(1).map(() => Math.random() * 50)

osc(randomArr.fast(0.25), 0.1, 1)
	.blend(src(o0)
		.rotate(Math.PI / 2, 0.01))
	.scrollX(0, 0.1)
	.out(o0)

src(o0)
	.kaleid(8)
	.repeat(3, 3)
	.out(o1)

src(o1)
	.scale(1.4)
	.mask(shape(4)
		.scale(1.54)
		.rotate(Math.PI / 4))
	.out(o2)

const differ = [o0,o1,o2,o3][Math.floor(Math.random()*4)]

src(o1)
	.diff(o2)
	.mult(shape(100)
		.mult(osc(1, -1, 1))
		.invert())
	.diff(src(differ).scale(() => (mouse.x/width-0.5)*2))
	.saturate(() => mouse.y/height)
	.out(o3)

render(o3)

metadata = {"index":25,"type":"code","midi":false,"heat":5,"author":"Alex Szabo"}