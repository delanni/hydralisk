/* Random 16122 */
const scaler = Math.max(Math.random(), 0.8);
const kaleoids = Math.floor(Math.random() * 10) + 3;

osc(10, 1, 0.5)
	.kaleid(4)
	.scale(scaler)
	.kaleid(kaleoids)
	.scale(scaler)
	.kaleid(kaleoids)
	.scale(scaler)
	.kaleid(kaleoids)
	.scale(scaler)
	.kaleid(kaleoids)
	.scale(scaler)
	.kaleid(kaleoids)
	.scale(scaler)
	.kaleid(kaleoids)
	.scale(scaler)
	.kaleid(kaleoids)
	.scale(scaler / 2)
	.diff(src(o0)
		.hue(Math.random()))
	.out(o0)

src(o0)
	.blend(src(o1)
		.rotate(0, 0.1), () => Math.sin(time) / 2 + 0.5)
	.out(o1)

src(o1)
	.add(src(o2)
		.mask(shape(100).mult(osc(1,1,1)))
		.scale(t => Math.tan(time % (Math.PI / 2)))
		.saturate(t=>Math.sin(time)), 0.5)
	.mult(o0,-0.4)
	.out(o2)

render(o2)

metadata = {"index":11,"type":"code","midi":false,"heat":5,"author":"Alex Szabo"}