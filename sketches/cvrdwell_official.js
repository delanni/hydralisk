/* cvrdwell official */
shape(6, [0.3, 1].smooth(0.1), [0.9, 0.8, 0.7, 0.6])
	.mult(osc(10 * Math.random(), [0.5, -1, 1.5, -3], [0.3, 0.8, 2].smooth())
		.kaleid([1, 10, 2].fast(1 / 8)))
	.rotate(Math.PI / 2)
	.diff(src(o0)
		.repeat(3, 3)
		.rotate(Math.PI, [Math.random()/2, -Math.random()/2].fast(1/6))
		.mask(shape(6)
			.invert()))
	.out(o0)

render(o0)

/* metadata = {"index":48,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */