/* palistati */
shape([3, 4, 100, 2].fast(800), 0.1)
	.rotate([0, 0, 0, Math.PI / 4].fast(800))
	.add(
		shape([3, 4, 100, 2].fast(800), 0.1)
		.rotate([0, 0, 0, Math.PI / 4 * 3].fast(800)))
	.mask(shape(100, 0.1)
		.scale([4].ease('easeInOutCubic')))
	.scale([1, 1, 1, 0.4].fast(800))
	.scale([0.9, 2.5].ease('easeInOutCubic'))
	.out(o0)

src(o0)
	.diff(src(o0)
		.scale(0.8))
	.out(o1)

src(o1)
	.mult(osc(midi("yellow", {min:1,max:10}), 10, midi("yellow", {min:0,max:4})))
	.scroll(() => Math.random() - 0.5, () => Math.random() - 0.5)
	.rotate(() => Math.PI * 2 * Math.random())
	.out(o2)

src(o2)
	.add(src(o3), 0.92)
	.add(src(o3)
		.scale(midi("red", {
			min: 0.80,
			max: 0.99
		})), midi("red", {
			min: 0.01,
			max: 0.06
		}))
	.out(o3)

render(o3)

metadata = {"index":85,"type":"code","bpm":0,"midi":true,"heat":5,"author":"Alex Szabo"}