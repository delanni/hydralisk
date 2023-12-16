/* Random 2452 */
const randarray = (size, base, variance) => {
	const a = new Array(Math.floor(size));
	return a.fill(base)
		.map(e => e + Math.random() * variance - 0.023 * variance);
};
const BASE_SHAPE = [8.829, 5.681, 5.19, 13.296, 5.999, 9.838, 7];
const OFFSET = () => 0.781;
shape(BASE_SHAPE, 0.242)
	.rotate(0.509, 0.1)
	.scroll(OFFSET, OFFSET)
	.kaleid(5.285)
	.mult(osc(1.715, 0.016, 0.732)
		.kaleid(9.548))
	.diff(src(o0)
		.scale(randarray(15.717, 0.371, 0.088)
			.smooth(0.098))
		.rotate(randarray(8.877, 0.465, 0.073)
			.smooth(0.033)))
	.mask(shape(BASE_SHAPE, 0.059)
		.rotate(0.201, 0.1)
		.scroll(OFFSET, OFFSET)
		.kaleid(2.297))
	.out(o0);
src(o0)
	.scale(randarray(2.098, 1.177 / 1.72, 0.246)
		.smooth(0.011))
	.scroll(0.451, 0.158, randarray(11.345, 0.304, 0.3)
		.fast(0.534 / 10.187)
		.smooth(0.08), randarray(6.354, 0.745, 0.303)
		.fast(0.098 / 1.572)
		.smooth(0.143))
	.out(o1);
src(o1)
	.scale([0.596 / 3.741, 0.29 / 4.772].fast(1.868 / 18.482))
	.contrast(5.884)
	.kaleid(3.917)
	.rotate(Math.PI / 7.769)
	.layer(src(o0)
		.blend(o1, [0.542, 1.129].fast(1.883 / 8)
			.smooth(0.179)), 0.9)
	.out(o2);
render(o2);

metadata = {"index":57,"type":"code","midi":false,"heat":5,"author":"Anony Mouse"}