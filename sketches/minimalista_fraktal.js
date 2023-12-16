/* minimalista fraktal */
shape(6, 0.05,[0,0.1,0.4,1.0].fast(1/8).smooth(0.1))
	.color(1,0,0)
	.hue(() => Math.sin(time/10))
	.add(src(o0)
	//.diff(src(o0)
		.scroll(0.005, 0.002, 0.1)
         .hue(0.98)
         .scale(0.95)
		.rotate(Math.PI / 3), 0.8)
	.rotate(0, 0.1)
	.scale([0.99,1, 1.01].smooth())
	// .kaleid(4)
	.out(o0);

src(o0).repeat(3).kaleid(4).out(o1);

render(o1);

metadata = {"index":50,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}