/* Zumicubi */

var c1 = shape(4)
	.scale(() => Math.sin(time /60 * Math.tan(time/69)) * 3)
	.mult(osc(1, 1, 1)
		.rotate(Math.PI / 2))

c1.out(o0)

src(o0)
	.diff(src(o0)
		.scale(1.1))
	.out(o1)

src(o1)
	.add(src(o1)
		.scale(0.1, 3), 0.91)
	.blend(src(o2), 0.8)
	.blend(src(o2)
		.rotate(Math.PI / 2))
	.diff(src(o2)
		.mult(osc(1, 1, 2)))
	.add(src(o1))
	.sub(src(o0))
	.out(o2)

src(o2)
	.add(src(o3)
		.scale(0.9)
         .scrollX(() => Math.sin(time))
         
         .scrollY(() => Math.cos(time * .9))
		.rotate(0.0, Math.random() * 0.1 - 0.05), [-1, 1].fast(0.4)
		.smooth(0.9))
.add(src(o2))
	.out(o3)

render(o3)

metadata = {"index":1,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}