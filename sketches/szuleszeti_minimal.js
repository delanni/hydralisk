/* szuleszeti minimal */
const randarray = (size, base, variance) => {
	const a = new Array(Math.floor(size));
	return a.fill(base)
		.map(e => e + (Math.random() * variance) - 0.5 * variance);
}

const BASE_SHAPE = [5, 3, 5, 8, 4, 6, 7];
const OFFSET = ()=>0.4;

shape(BASE_SHAPE, 0.4)
	.rotate(0, 0.1)
	.scroll(OFFSET, OFFSET)
	.kaleid(4)
	.mult(osc(30, 0.01, 0.5)
		.kaleid(6))
	.diff(src(o0)
		.scale(randarray(10, 0.95, 0.1)
			.smooth(0.1))
		.rotate(randarray(13, 0, 0.05)
			.smooth(0.1)))
	.mask(shape(BASE_SHAPE, 0.4)
		.rotate(0, 0.1)
		.scroll(OFFSET, OFFSET)
		.kaleid(4))
	.out(o0)

src(o0)
	.scale(randarray(4, 1 / 2, 0.4)
		.smooth(0.05))
	.scroll(0, 0, randarray(10, 0, 0.3)
		.fast(1 / 8)
		.smooth(0.1), randarray(9, 0, 0.2)
		.fast(1 / 16)
		.smooth(0.1))
	.out(o1)

src(o1)
	.scale([1 / 10, 1/4].fast(1/16))
	.contrast(10)
	.kaleid(4)
	.rotate(Math.PI / 4)
	.layer(src(o0).blend(o1, [0,1].fast(1/8).smooth(0.1)), 0.9)
	.out(o2)

render(o2)

/* metadata = {"index":69,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */