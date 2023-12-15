/* Vadim */
speed = 1
const percent = (n, fn) => {
	let store = fn()
	return () => {
		if (Math.random() * 100 < n) store = fn();
		return store;
	}
}
const rx = () => Math.random() - 0.5;

e1 = shape(percent(3, () => Math.floor(Math.random() * 5 + 3)))
	.scroll(percent(3, rx), percent(1, rx))
	.mult(osc(1, 1, 1));
e2 = shape(percent(1, () => Math.floor(Math.random() * 5 + 3)))
	.scroll(percent(1, rx), percent(1, rx))
	.mult(osc(0.2, 2, 0.3));
e3 = shape(percent(1, () => Math.floor(Math.random() * 5 + 3)))
	.scroll(percent(1, rx), percent(1, rx))
	.mult(osc(1, -0.4, 1.3));
e4 = shape(percent(1, () => Math.floor(Math.random() * 5 + 3)))
	.scroll(percent(1, rx), percent(1, rx));

solid(1).hue([-1,0,1].smooth())
	.add(e1, 0.8)
	.add(e2, 0.8)
	.sub(e3, 0.5)
	.sub(e4, 0.5)
	.out(o0)

src(o0)
	.rotate(0.1, 0.1)
	.kaleid(() => mouse.y/height*100)
	.out(o1)

src(o1)
	.repeat(2, 2)
	.diff(src(o1)
		.scale(-0.5))
	.saturate(2)
	.out(o2)

src(o2)
	.add(shape(3)
		.scale([0.1, 0.3].smooth()))
	.blend(src(o3)
		.scale(() => 1.0 + (mouse.x/width / 20)), 0.9)
	.out(o3)

render(o3)

metadata = {"index":28,"type":"code","midi":false,"heat":5,"author":"Alex Szabo"}