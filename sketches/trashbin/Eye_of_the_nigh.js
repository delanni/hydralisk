/* Eye of the nigh */

var hori = osc(1,1,1)
	.scale([1, 1.5])
var verti = osc(1)
	.rotate([Math.PI / 2, Math.random(), Math.PI / -2, Math.PI / 3, Math.PI / 4 * -3])

hori.blend(verti, [0.1, 0.9].fast(6 / 8)
		.smooth())
	.out(o0)

src(o0)
	.modulate(hori.blend(verti, [-1, 1].fast(0.01)
		.smooth()))
	.out(o1)

src(o1)
	.diff(src(o0)
		.scale(() => Math.sin(time / 10)))
	.out(o2)

src(o2)
	.blend(src(o2))
	.repeat([3, 6], [3, 1, -1, 3, -6])
	.blend(src(o3)
		.scale(1.2).rotate(() => mouse.x / 100))
	.sub(src(o3).scale(1.1).mask(shape([10, 100].smooth()).scale(() => 3 * Math.sin(time/4))))
	.brightness(() => mouse.y/1000)
	.saturate(1.2)
	.hue(() => 1)
	.out(o3)

render(o3)

metadata = {"index":2,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}