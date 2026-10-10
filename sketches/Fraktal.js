/* Fraktal */

setResolution(2000, 1600)
bpm = 129
shape(4)
	.scale(1.7)
	.diff(shape(4)
		.scale(1.5))
	.out(o0)

src(o1)
	.add(src(o1)
		.repeat(3, 3)
		.scale(0.54), .2)
	.add(o0)
	.mask(shape(4)
		.scale(1.7))
	.out(o1)

src(o1).mult(noise(4,1).mult(osc(1,1,1))).scale(() => {
		var v = (time % p / p);
		return Math.sin(v) * 4.7 + 1
	}).rotate([Math.PI,0].fast(0.3).smooth()).saturate(4).out(o2)

var p = 60 / bpm * 2;
src(o1).mult(noise(5,1).mult(osc(3,1.1,1.1).brightness(0.1)))
	.scale(() => {
		var v = (time % p / p);
		return Math.sin(v) * 4.7 + 1
	})
	.add(o3, 0.9)
	.mult(src(o2).invert().brightness(0.01))
	//.diff(src(o0).scale([0,1].smooth()))
	.out(o3)


render(o3)

/* metadata = {"index":21,"type":"code","bpm":"129","midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */