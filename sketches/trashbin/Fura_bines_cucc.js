/* Fura bines cucc */
var bins = 5

a.setBins(bins);
var swo = n => () => Math.sin(time /10+ n**2) / 2 + 0.3

var omg = solid(0, 0, 0);
var sx = [];
for (var n = 0; n < bins; n++) {
	let nn = n;
	omg = omg.add(shape(4, 0.05)
		.scale(() => 1 + Math.sqrt(a.fft[nn]) * bins)
		.scrollX((1 / bins * nn - 0.5))
		.scale(0.8)
		.mult(solid(swo(n), swo(n * 1.1 + 0.2), swo(n * -0.9 + 4)))

	);
}

omg.scrollY(0.6)
	.out(o0);

src(o0)
	.blend(src(o1)
		.scrollY(0.01), 0.93)
	.add(o0)
	.out(o1)

src(o1)
	.diff(src(o1)
		.scale(-1.1)
		.scrollX(() => Math.sin(time) / 10))
	.add(src(o0)
		.scrollY(-0.6))
	.out(o2)

//src(o2).scale(0.7).rotate(Math.PI/4,0.01).kaleid(4).diff(src(o3).brightness(-0.01)).out(o3)
const stdDev = (x) => {
	var avg = x.reduce((a, b) => a + b, 0) / x.length;
	var dev = x.reduce((a, b) => a + Math.pow(avg - b, 2), 0);
	return Math.sqrt(dev)
}

src(o2)
	.scale(-0.7)
	.kaleid(4)
	.diff(src(o3).invert(() => stdDev(a.fft)).saturate(1)).out(o3)

		render(o3);

metadata = {"index":30,"type":"code","midi":false,"heat":5,"author":"Alex Szabo"}