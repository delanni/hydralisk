/* something */
const r = () => Math.random() - 0.5;
osc(40, .002, 0.34)
	.blend(src(o0)
		.rotate(() => Math.sin((time * Math.PI / 3) % Math.PI / 2), 0.02)
		.scroll(0.2, 0, 0.1)
		.scale([1.0, 1.1].ease('linear')))
	.out(o0);

src(o0)
	.repeat([1.5, 1, 1, 1, 1, 1, 1, 1, 3, 4], [1, 2])
	.mult(osc(40, -0.02, 1.0)
		.scale(4)
		.rotate([1, 2, 3, 4, 5, 6].map(e => e * Math.PI / 6)))
	.modulateScale(noise(30, 0.3, 3), [0, 0, 0, 0.3].smooth(0.3))
	.out(o1)

const sx =()=> shape([4, 3],0.3,() => time%0.3)
		.rotate(r(),0.3)
		.scale(r())
		.scroll(0, 0, r(), r()).sub(o3);

solid(r(), r(), r())
	.add(sx())
.add(sx())
.add(sx())
.add(sx())
.add(sx())
.add(sx())
.add(sx())
.add(sx())
	.blend(src(o2).scale(0.4).rotate(Math.PI/3),[0,0.4,0.2,0.5].smooth(0.2))
	.out(o2)


//src(o0).add(o2).out(o3)
//src(o1).add(o2).out(o3)
src(o1).mult(src(o2).invert()).blend(src(o2),0.3).out(o3)
src(o3).add(o1).diff(src(o3).modulate(o0)).out(o3)
//src(o3).blend(o0).diff(o1).out(o3)
src(o2).diff(src(o1).scale(() => time%(60/bpm1)/1).mult(o0,0.4)).out(o3)
src(o2).blend(src(o2).scale(() => time%(60/bpm1)/1).mult(o0,0.1)).out(o3)

src(o2).add(shape(100,0.5).invert(()=>Math.sin(time%3))).scale(() => time%(60/bpm1)/1-0.5).blend(src(o0).repeat(4).rotate(0,3)).modulateRotate(src(o3),-1).out(o3)


render(o3)

metadata = {"index":49,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}