/* fasza pumpin */
/ * Pumpin 5 * /
bpm = 173.88;
shape(2.2)
	.scrollX(0.161, 0.23239)
	.scrollY(0.01, 0.3)
	.kaleid(2.311)
	.diff(shape(5)
		.scrollX(0.769, -0.184)
		.scrollY(0, -Math.random() / 10)
		.kaleid(1.772))
	.rotate(0.182, 0.004)
	.repeat(1.486, 1)
	.out(o0);
src(o0)
	.blend(o1, 0.99)
	.rotate(0.292, [0, -0.001].fast(0.004)
		.smooth())
	.add(o0, 0.162)
	.out(o1);
ox = osc(6, -0.07, [0, 1.026].fast(0.01)
		.smooth())
	.brightness(0.01);
src(o1)
	.mult(ox.saturate(0.2))
	.diff(shape(2)
		.scale(({
			time
		}) => (2)(time % (64.463 / bpm))))
	.out(o2);
src(o2)
	.blend(src(o2)
		.scale(0.493)
		.diff(o1)
		.diff(ox.kaleid(4.186)), [0.871, 0.994].fast(0.025)
		.smooth())
	.out(o3);
render(o3);

metadata = {"index":70,"type":"code","bpm":"173","midi":false,"heat":5,"author":"Alex Szabo"}