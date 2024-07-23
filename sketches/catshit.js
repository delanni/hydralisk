/* catshit */

bpm = 140 / 4

s0.initImage("https://cataas.com/cat/says/DJANGO x PIGEON?a=x")

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
const mode = [
	Math.sin,
	Math.cos,
	Math.tan,
	x => Math.random()
]
const rand = (e) => e[Math.floor(Math.random() * e.length)];



shape(rand([3,4,5,6]))
	.scale(1.5)
	.scale(saw({
		min: 0.7,
		max: 1.1
	}))
	.rotate(0, 0.1)
	.color(0.3, 0.03, 0.09)
	.hue([0, 2].fast(0.05).smooth())
	.add(src(o0)
		.scale([0.8, 1].fast(0.1)
			.smooth()), 0.99)
	.out(o0)

src(o0)
	.scale(0.8)
	.add(src(o1)
		.diff(osc([10,5,2,-1, 15], [10, 1, 4,0], 2).saturate(0.4)
			.kaleid(10)).brightness(0.1), 0.8)
	.scale(saw({
		max: 1.7,
		min: 0.7,
		x: 10
	}))
	.diff(src(o0))
	.blend(o0,0.1)
	.rotate([Math.random(), Math.random(), Math.random() - 0.5, Math.random(), Math.random() - 0.5], 0.1)
	.add(src(s0).scale(0.3).mask(shape(4)).scale(1.9, 0.9).rotate(-0.2, [Math.random()/10, Math.random()/10].fast(0.25)), 0.99)
  .out(o1)


render(o1)

/* metadata = {"index":18,"type":"code","bpm":"140","midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */