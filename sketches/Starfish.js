/* Starfish */
shape(3)
	.scale(0.5)
	.scroll(-30)
	.blend(shape(100)
		.scrollY(10))
	.scale(0.4)
	.repeat(10, 10)
	.mult(osc(1,1,1))
	.blend(shape(3).scroll(0))
	.rotate(0, 0.1)
	.kaleid(5)
	.rotate(0, 0.1)
	.add(src(o0), 0.99)
	.out(o0)

render(o0)

/* metadata = {"index":31,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */