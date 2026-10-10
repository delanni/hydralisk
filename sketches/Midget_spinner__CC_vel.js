/* Midget spinner, CC-vel */
bpm = 170

shape(midi("yellow", {min: 3, max: 10, transform: Math.floor}))
	.rotate(0, [0.3, -0.3].fast(0.01).smooth())
	.diff(shape(3)
		.scale([0.4,0.6].fast(2).smooth())
		.rotate(0, -2))
	.mult(osc(2, 0.1, 1)
		.kaleid(10))
	.scale(midi("red", {min:0, max: 3}))
	.out(o0)


const saw = (period, min, max) => ({
	time
}) => {}

src(o0)
	.blend(src(o1)
		.scale(1), 0.9)
	.diff(src(o0)
		.scale(1.4))
	.add(o1, 0.1)
	.invert(() => cc[65]>0.5 ? 1: 0)
	.out(o1)

src(o1)
	.blend(src(o2)
		.scale([1.01,0.99].ease("easeInOutCubic")), 0.99)
	.diff(src(o1)
		.blend(solid()
			.brightness(0), [0.0, 0.3].fast(0.1)
			.smooth()))
	.out(o2)

src(o2).add(src(o1)).diff(o0).blend(src(o3).scale(0.99),[0.9,0.99].fast(0.1).smooth()).rotate(0,[0, 0.01].fast(0.01).smooth()).out(o3)

render(o3)

/* metadata = {"index":33,"type":"code","bpm":"170","midi":true,"local":false,"heat":5,"author":"Alex Szabo"} */