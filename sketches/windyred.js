/* windyred */

bpm = 140

const saw = ({
	min = 0,
	max = 1,
	x = 1,
	t
} = {}) => ({
	time
}) => {
	const spb = 60 / bpm * x;
	const p = (time % spb) / spb * (max - min) + min;

	if (t) {
		return t(p);
	} else {
		return p;
	}
}


shape(4)
	.scale(saw({
		min: 0.7,
		max: 1.1
	}))
	.rotate(0, 0.1)
	.color(0.3, 0.03, 0.09)
	//.hue([0, 2].fast(0.05).smooth())
	.add(src(o0)
		.scale([0.8, 1].fast(0.1)
			.smooth()), 0.99)
	.diff(src(o0)
		.scale([0.8, 1].fast(0.2)
			.smooth()))
	.scroll(() => -mouse.x / width * 2, () => -mouse.y / height + 0.5)
	.diff(shape(4)
		.scale([0.3, 0.7].smooth(2)))
	.sub(shape(4)
		.scale(saw({
			min: 0.7,
			max: 1.1
		})), [0, 1].smooth())
	.out(o0)

const mode = [
	Math.sin,
	Math.cos,
	Math.tan,
	x => Math.random()
]
const rand = (e) => e[Math.floor(Math.random() * e.length)];

src(o0)
	.scale(0.8)
	.add(src(o1)
		.mult(osc(1, 1, 1)
			.kaleid(10)), () => mouse.x / width)
	.scale(saw({
		max: 1.7,
		min: 0.7,
		x: 10
	}))
	.diff(src(o0))
	.rotate([Math.random(), Math.random(), Math.random() - 0.5, Math.random(), Math.random() - 0.5], 0.1)
	.out(o1)

src(o1)
	.add(src(o2), 0.1)
	.out(o2)

src(o2)
	.blend(src(o2)
		.kaleid(6))
	.diff(o0)
	.out(o3)

render(o3)

/* metadata = {"index":14,"type":"code","bpm":"140","midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */