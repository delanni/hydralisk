/* rotisz */
osc(5, 0.1, 1.1)
	.rotate(0,0.1)
	.pixelate(50,50)
	.hue(() => time/10)
	.out(o0)

src(o0).diff(src(o0).rotate(Math.PI/2)).kaleid(6).brightness(0.5).mult(src(o0)).invert().out(o1)

src(o0).rotate(Math.PI).out(o3)

src(o1).rotate(Math.PI).out(o2)


render()

metadata = {"index":52,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}