/* crystaline */
shape(4).rotate(0,-0.05).diff(shape(4).rotate(0,0.1).scale(0.9)).blend(src(o0).scroll(0.3).kaleid(2), 0.8).out(o0)

osc(1,1,[1, -1]).kaleid(30).brightness(1.5).mult(src(o0)).out(o1)

osc(200, 0.01, [0.5, 0.1, -0.5].fast(0.3)
		.smooth())
	.rotate([0,0,0,0,0,Math.PI/2, Math.PI/3])
	.contrast([0, 4].fast(0.1)
		.smooth())
	.mult(o1)
	.add(o1)
	.out(o2)

src(o2).repeat(3,3).modulate(src(o2).invert().diff(o0)).out(o3)

render(o3)

metadata = {"index":42,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}