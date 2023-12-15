/* Random 63050 */
bpm = 128
osc(1,0.1,0.4)
	.add(
		shape(4)
	)
	.add(
		shape(4)
		.rotate(Math.PI / 4)
		.scrollX(0.3)
	)
	.rotate(Math.PI / 2, 0.1)
	.scale(0.4)
	.scroll(0.3, 0.3)
	.out(o0)

src(o0)
	.kaleid(2)
	.blend(o0)
	.kaleid(4)
	.repeat(3, 3)
	.scroll(0, 0, 0, 0.4)
	.kaleid([1, 2, 1, 2, 1, 4, 5, 7].fast(2 ** -3))
	.out(o1)

src(o1)
	.mult(osc(10, 1.1, 1)
		.mult(osc(3.2, -1, 0.3))
		.scale(() => Math.sin(time / 10))
		.rotate(0, 0.1), 2)
	.mask(src(o1)
		.contrast(() => a.fft[0] * 5)
		.hue([-1, 1].smooth()))
	.add(noise(2,1).contrast(1)
         .add(shape(4).rotate(0,-Math.PI))
		.scale(0.8)
		.rotate(0, [Math.PI, -Math.PI / 2, Math.PI, -8]))
	.out(o2)

src(o2)
	.blend(src(o3)
		.scale(() => {
			console.log(a.fft[0]);
			return 1 - (a.fft[1] - 0.5) / 10
		}), () => 1 - a.fft[0])
	//.diff(o1)
	.out(o3)

render(o3)

metadata = {"index":29,"type":"code","bpm":128,"midi":false,"heat":5,"author":"Alex Szabo"}