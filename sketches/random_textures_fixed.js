/* random textures-fixed */
const occasionalArray = (length, occasions, a, b) => {
	const arr = new Array(Math.floor(length))
		.fill(a);

	while (occasions-- > 0) {
		const i = Math.floor(Math.random() * length);
		if (arr[i] !== b) arr[i] = b;
		else occasions++;
	}

	return arr;
}

osc(100, 0.01, [0.5, 0.1].fast(0.3)
		.smooth())
	.rotate(occasionalArray(16, 3, 0, Math.PI / 2)
		.fast(4))
	.contrast([0, 4].fast(0.1)
		.smooth())
	.scroll(0, 0, 0.1)
	.out(o0)


solid()
	.add(shape([3, 5, 2, 4, 3, 7])
		.rotate(0, 0.3))
	.kaleid([1, 3, 2])
	.scroll(0, 0, [0.1, 0, -0.1], [0, 0, 0, -0.05, 0, 0.1])
	.add(src(o1)
		.scroll(0.5, [0.5, 0.25, 0, -0.25].smooth(), 0.1), [0, 1].fast(0.25)
		.smooth())
	.out(o1)

src(o1)
	.mult(o0)
	.out(o2)
src(o2)
	.mult(src(o0)
		.rotate(Math.PI / 2))
	.diff(src(o3)
		.scroll([Math.random() / 10, 0, 0, 0, -Math.random() / 10, 0, 0], [0, 0, Math.random() / 10, -Math.random / 10])
		.scale(1.01))
	.contrast([0.6, 1.4].fast(0.1)
		.smooth())
	.scale([0.7, 1, 1.3].fast(1 / 16))
	.out(o3)


render(o3)

metadata = {"index":60,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}