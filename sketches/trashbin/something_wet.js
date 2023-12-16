/* something wet */
s0.initImage("https://i.imgur.com/Lip0k2c.jpg")

src(s0)
	.scale(0.3)
	.scroll(0.287,-0.012)
	.scale(4, 1.0)
	.out(o0);

shape(4, 0.2).scale(2,1).scale(0.5)
	.scroll(0, 0, [-0.1, 0.1].fast(0.1).smooth(), [0.3, 0.5, 0.8].fast(0.1).smooth())
	.rotate(0, 0.3)
	.add(src(o1)
		.scale(0.3)
		.kaleid(10)
		.scale([0.8, 1.3].fast(0.1)
			.smooth()), [0.5, 0.2].fast(0.1)
		.smooth())
	.blend(o1,0.8)
	.out(o1)

src(o0).mask(shape(30,0.8, 0.1)).rotate(0.0,-0.2).modulate(o1,[-0.8, 0.8].fast(0.05).smooth()).out(o2)

render(o3)

metadata = {"index":55,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}