/* electric universe */
s0.initImage("https://i.imgur.com/Lip0k2c.jpg")

src(s0)
	.scale(0.3)
	.hue(1.59)
	.scroll(0.287, -0.012)
	.scale(4, 1.0)
	.blend(src(o0).scale(() => 1 + Math.sin(time)/20).rotate(() => Math.sin(-time/2)/10),0.7)
	.out(o0);

shape([4, 30].fast(1 / 32)
		.smooth(0.3), 0.2)
	.scale(2, 1)
	.scale(0.5)
	.scroll(0, 0, [-0.01, 0.01].fast(0.1)
		.smooth(), [0.03, 0.05, 0.08].fast(0.1)
		.smooth())
	.rotate(0, 0.3)
	.add(src(o1)
		.scale(0.3)
		.kaleid(10)
		.scale([0.8, 1.3].fast(0.1)
			.smooth()), [0.5, 0.2].fast(0.1)
		.smooth())
	.out(o1)


src(o0)
	.mask(shape(30, 1.1, 0.1))
	.rotate(0.0, -0.2)
	.modulateKaleid(o1, () => Math.sin(time/10)/3)
	.add(src(o2).scale(0.9),()=> (Math.sin(time/7)+1)/4+0.4)
	.kaleid([2,2,2,2,2,2,2,4,6])
	.out(o2)

src(o0)
	.modulate(o1,[-0.8,0.8].fast(1/4).smooth())
	.mask(shape(30, 0.8, 0.1))
	.rotate(0.0, -0.2)
	.diff(src(o2).hue(() => Math.sin(time/100)/10))
	.out(o3)

render(o3)

metadata = {"index":56,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}