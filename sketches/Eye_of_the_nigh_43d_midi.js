/* Eye of the nigh 43d midi */

var hori = osc(2, 2, 5)
	.scale([1, 1.5]);
var verti = osc(1.95, 2, 2)
	.rotate([Math.PI / 2.104, Math.random(), Math.PI / -2, Math.PI / 3, Math.PI / 6.636 * -1.758]);
hori.blend(verti, [0.014, 1.013].fast(6 / 0.441)
		.smooth())
	.out(o0);
src(o0)
	.modulate(hori.blend(verti, [-0.14, 1].fast(0.01)
		.smooth()))
	.out(o1);
src(o1)
	.diff(src(o0)
		.scale(() => Math.sin(time / 6.66)))
	.out(o2);
src(o2)
	.blend(src(o2))
	.repeat([3, 6], [5.21, 1, -1.565, 3, -1.233])
	.blend(src(o3)
		.kaleid(midi('yellow', {min: 1, max: 8}))
        .kaleid(2)
		.scale(0.549))
	.sub(src(o3)
		.scale(1.028)
		.mask(shape([10, 58.096].smooth())
			.scale(() => 9 * Math.sin(time / 15.154))), 0.7)
	.sub(src(o3)
		.scale(0.158)
		.mask(shape([5, 18.356].smooth())
			.scale(() => 7 * Math.sin(time / 12.192))), 0.35)
	.brightness(midi("red", {min: -0.1, max: 1}))
	.saturate(1.626)
	.hue(() => Math.sin(time))
	.blend(src(o3), 0.9)
	.out(o3);
render(o3);

metadata = {"index":35,"type":"code","bpm":0,"midi":true,"heat":5,"author":"Alex Szabo"}