/* Deep vortex */
bpm=150
shape(3)
	.scale([0.5])
	.scroll(-30)
	.blend(shape(108.241)
		.scrollY(15.377))
	.scale(()=>mouse.y/height)
	.repeat(18.979, 16.74)
	.mult(osc(1.227, 1, 1.503))
	.blend(shape(4.952)
		.scroll(0))
	.rotate(0, 0.1)
	.kaleid(54)
	.rotate(0.158, 0.054)
	.add(src(o0), 0.97)
	.out(o0);

shape(100)
	.sub(shape(3)
		.scale(0.4))
	.brightness([0, 0.1].smooth())
	.blend(src(o1)
		.scale(1.01)
		.rotate(0.01), 0.99)
	.out(o1)

src(o0)
	.modulateRotate(o1)
	.diff(o1)
	.out(o2);

src(o2).blend(o3,()=>mouse.x/width * 0.99).out(o3)

render(o3)

metadata = {"index":18,"type":"code","bpm":150,"midi":false,"heat":5,"author":"Alex Szabo"}