/* veni vidi */
noise(10, 0.1, 1)
	.diff(noise(10.5, 0.1, 1))
	.contrast(20)
	.rotate(40)
	.kaleid(4)
	.mult(gradient(0))
	.colorama(3)
	.saturate(0)
	.contrast(100)
	.scroll(0, 0, 0.003, -0.002)
	.scale(10)
	.pixelate([1000,100,1000].fast(1/8).smooth(0.1),[1000,400].fast(1/6).smooth(0.1))
	.out(o0)

src(o0)
	.add(src(o0).scale(-0.5).rotate(Math.PI/2).scale(() => time%(60/bpm)).kaleid(4),[0,1].fast(1/16).smooth(0.5))
	.mult(gradient(0.4)
		.mult(osc(100, 0.1, 1).modulate(o0))
		.kaleid(10).repeat(2,2)
		.saturate(1.3))
	.out(o1)

src(o1).add(gradient(0.17,0.65,0.49).hue(()=>time/100).rotate(0,0.1).mask(src(o0).invert())).out(o2)

render(o2)

/* metadata = {"index":72,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */