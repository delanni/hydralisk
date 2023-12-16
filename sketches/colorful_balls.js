/* colorful balls */
shape(4)
	.scale(1, 0.6)
	.add(shape(100, 0.6, 0.3)
		.scale(1, 0.7)
		.repeat(3, 3))
	.diff(shape(4)
		.scale(1, 0.6)
		.scale(0.7))
	.mult(osc(10, 0.1, Math.random()+0.5)
		.kaleid(100))
	.out(o0)

src(o0).blend(src(o1)
		.scale(({
			time
		}) => Math.abs(Math.sin(time/3) + 1)+0.3), ({time}) => Math.sin(time)).out(o1)

src(o1).mult(src(o0).add(src(o0).rotate(Math.PI/4,0.3).scale(0.3))).modulateScale(src(o1).scale([1,0.7].fast(0.1).smooth(0.6))).out(o2)

src(o2).add(src(o2).blend(src(o3)).scale(0.98)).out(o3)

render(o3)

/* metadata = {"index":46,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */