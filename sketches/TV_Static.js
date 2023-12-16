/* TV Static */
const longRandomQueue = (n, d = 0) => new Array(n)
	.fill(0)
	.map(_ => Math.random() + d);

const jumpyCircle = (s = 0.4, a = 0.4, b = 0.2, r = 0.1, d = 0.5) => shape(100, 0.4, a)
	.diff(shape(100, s, b))
	.scale(longRandomQueue(31)
		.smooth(r))
	.scrollX(longRandomQueue(11, -d)
		.smooth(r))
	.scrollY(longRandomQueue(13, -d)
		.smooth(r))

const combine = (...x) => {
	const [h, ...t] = x;
	if (t.length) {
		return h.diff(combine(...t));
	} else {
		return h;
	}
}

const repeat = (n, f) => {
	const ox = [];
	while (n-- > 0) {
		ox.push(f());
	}
	return ox;
}

combine(...repeat(8, () => jumpyCircle(0.2, 0.1, 0.3, 0.3)))
	.out(o0)

const oscColor = 4;

osc(3, 1, oscColor)
	.mult(osc([2, 5].fast(2 ** -3)
			.smooth(), -2, oscColor / 3)
		.rotate(Math.PI / 2, 0.1))
	.scale(-0.01)
	//.kaleid(6)
	.modulateRotate(src(o0)
		.scale(-1))
	.out(o1)

src(o1)
	.repeat(3, 3)
	.rotate(Math.PI / 2)
	.blend(src(o0), 0.9)
	.mult(o1, 1.5)
	.add(o2, 0.9)
	.out(o2)

src(o2)
	.add(shape(100, 0.3, 0.3)
		.diff(shape(100, 0.2, 0.3)))
	.diff(src(o3)
		.scale([0.99, 1.01])
		.modulateHue(src(o1)))
	.out(o3)


render(o3)

metadata = {"index":37,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}