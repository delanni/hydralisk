/* Random 32883 */
bpm = 130

const spb = () => 60 / bpm
const linear = (min, max) => v => min + (max - min) * v;
const exponential = (min, max) => v => min + (max - min) ** v;
const saw = (period, fn) => ({
	time
}) => {
	return fn((time % period) / period)
}

shape(3)
	.rotate(0, 3)
	.diff(shape(3)
		//.invert([1, 0.5].smooth())
		//.scale(saw(spb(), linear(0.3, 0.5)))
		.rotate(0, -1))
	.out(o0)


src(o0)
	.blend(src(o1)
		.scale(saw(spb()*16, exponential(-2, 0.1))),  0.9)
	.diff(src(o0)
		.scale(1.4))
	.add(o1, [0.7, 0.9].fast(0.2)
		.smooth())
	.invert([0.5,1].smooth())
	.out(o1)

render(o1)

/* metadata = {"index":38,"type":"code","bpm":130,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */