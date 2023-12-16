/* Fura Fire */
bpm=130
shape(5.89)
	.scroll(0.113, -0.3)
	.rotate(-2.6)
	.mult(osc(30, -0.05, 0.734).kaleid(10)
		.rotate(Math.PI / 2.263))
	.kaleid(.67).blend(src(o0).scale(0.9))
	.scale(0.759)
	.rotate(0.009, 0.206)
	.modulate(o2,0.04)
	.out(o0);
src(o0)
	.scale(0.021)
	.out(o1);
solid()
	.add(noise([3,4].smooth(2), 0.117)
		.repeat(4,4)
		.rotate(Math.PI / 2))
	.out(o2);
src(o1)
	.modulate(o2,1)
	.blend(src(o3).scale(1.001),0.9)
	.add(o0,[0.1,.3].fast(0.1).smooth())
	.out(o3);

render(o3);

/* metadata = {"index":20,"type":"code","bpm":130,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */