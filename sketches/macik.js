/* macik */
shape(100, 0.5, 0.3)
	.scale(1, height / width)
	.diff(src(o0)
		.scale(0.01)
		.pixelate(100, 100))
	.modulate(o1)
	.out(o0)

osc(100, 0.01, 0.5)
	.contrast(0.5)
	.diff(src(o1)
          .scale(() => 1/(1 + mouse.x /width * 5))
		.rotate(Math.PI / 2, 0.01))
	.scroll(0,0,0.01, 0.02)
	.scale(() => 1 + mouse.x /width * 5)
	.out(o1)

src(o1)
	.modulateScale(src(o0)
                   .rotate(() => mouse.y/height)
		.scroll(0, 0, 0.1, 0.1)
		.repeat(2)
		.kaleid(4)
		.scroll(0, 0, -0.1, -0.1)
		.repeat(2)
		.kaleid(4))
	.out(o2)


render(o2)

/* metadata = {"index":58,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */