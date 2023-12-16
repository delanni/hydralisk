/* stuff */
const rx = () => Math.random() - 0.5;
const x = () => shape(10, rx(), [0.9, 0.3].smooth())
	.mult(osc(11, -1, [1 + rx(), -1 + rx()].smooth())
		.kaleid(100))
	.scale([0.3,0.5 * Math.random()].fast(0.2).smooth())
	.scroll(0, 0, rx(), rx())
	.rotate([rx(),rx()].fast(1/2 * Math.floor(Math.random() * 4)).smooth(),rx());

speed=1

x()
	.add(x())
	.add(x())
	.add(x())
	.add(x())
	.add(x())
	.rotate(0,1)
	.out(o0)

src(o0).add(src(o1).brightness(-0.1),0.99).out(o1)

src(o1).blend(src(o2).scale(1.1),0.9).out(o2)

src(o1).add(src(o2).scale(0.9)).scale(1.1).rotate(0,1).scroll(0,0,-1).kaleid(2).diff(src(o1).scale(1.1)).out(o3)

render(o3)

/* metadata = {"index":64,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */