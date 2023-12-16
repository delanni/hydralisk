/* kolorado */
voronoi(6, 0.1, 6)
	.mult(osc(5, 0, 1))
	.diff(voronoi(4, 0.4, 4))
	.diff(voronoi(2, 0.2, 2))
	.pixelate(6, 6)
	.add(src(o0)
		.scroll(0, 0, 0.1), 0.4)
	.scroll(0,0,0.05)
	.out(o0)

src(o0)
	.kaleid(4)
	.diff(src(o0)
		.scale([0.5, 0.42].smooth(0.1))
		.kaleid(2))
	.out(o1)

src(o0)
	.modulate(o1)
		.scale(() => 1 + Math.sin(time)/4)
	.blend(src(o2).scale(1.01), 0.95)
	.out(o2)

noise([4,8].fast(1/8).smooth(0.1), 1)
	.scale(() => 1 + Math.sin(time)/4)
	.rotate([0,0.1,-0.5].fast(1/8).smooth(0.1))
	.pixelate([20,1000,100,100,1000, 1000].fast(1/8).smooth(0.1),[20,1000,100,100,1000, 1000].fast(1/8).smooth(0.1))
	.thresh(0.1)
	.kaleid([8,10,12].fast(1/32))
	.brightness([0,1].fast(1/16).smooth(0.1))
	.mult(o2)
	//.blend(src(o3).scale([0.99,1,1.001].fast(1/3)),[0.95,0.5,0.1,0.5])
	.out(o3)

render(o3)

/* metadata = {"index":55,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */