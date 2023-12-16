/* Eye of the night midi */

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
		.scale(1.2).rotate(midi("red", {min: -Math.PI+0.1, max: Math.PI-0.1})))
	.sub(src(o3).scale(1.1).mask(shape([10, 100].smooth()).scale(() => 3 * Math.sin(time/4))))
	.brightness(midi("yellow", {min: -0.001, max: 1}))
	.saturate(1.2)
	.hue(() => 1)
	.out(o3)

render(o3)

metadata = {"index":29,"type":"code","bpm":0,"midi":true,"heat":5,"author":"Alex Szabo"}