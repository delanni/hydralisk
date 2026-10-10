/* Random 54961 */
noise(4, 0.2)
	.color(0.8, 0.7, 0.2)
	.invert()
	.colorama(2, 3)
	.mult(osc(1, 1, 1)
		.kaleid(10))
	.kaleid(4)
	.modulateHue(noise(10, 0.2))
	.out(o0)

render(o0)

/* metadata = {"index":34,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */