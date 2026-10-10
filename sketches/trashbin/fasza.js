/* fasza */
/ * organelle * /
noise(0.081, 0.016)
	.mask(noise(2.603, 0.006))
	.diff(noise(1.343, 0.126))
	.colorama(0.489)
	.mask(shape(7.307, 0.039)
		.diff(shape(2.6)))
	.add(src(o0)
		.scale(1.417)
		.rotate(Math.PI / 7.57), 0.122)
	.diff(noise(5.633, 0.068)
		.colorama(0.082)
		.hue(() => time / 267.78))
	.out(o0);
src(o0)
	.scroll(() => Math.sin(time / 20.009 + 0.07), () => Math.cos(time / 8.261 - 0.031))
	.rotate(() => Math.sin(time / 8.524) * Math.PI)
	.scale(3.824)
	.blend(o1, 0.02)
	.out(o1);
osc(109.973, 0.019, 1.087)
	.diff(src(o2)
		.scale([0.512, 17.34].fast(0.144 / 5.055)
			.ease(NaN))
		.scale([1.868, 10.445].fast(2.367 / 3.088)
			.ease(NaN))
		.rotate(Math.PI / 0.683))
	.blend(o2, 0.631)
	.out(o2);
src(o1)
	.modulateScale(o2)
	.out(o3);
render(o3);

metadata = {"index":77,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}