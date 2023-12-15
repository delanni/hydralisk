/* Alley crystals */
const r = () => Math.random() * 5 - 2.5;
const COORDS = [
	[r(), r()],[r(), r()],[r(), r()],[r(), r()],[r(), r()],[r(), r()],[r(), r()],[r(), r()],[r(), r()],
];
var c = (r = Math.random() * Math.PI - Math.PI / 1.566) => shape(Math.random() * 4 + 3)
	.scale(1.832, 3.921)
	.rotate(r, 0.128 * r)
	.color(() => Math.sin(time * r), 1 - r, (r + Math.random()) % 1.817)
	.hue(() => time * r / 7.517);
c(Math.random())
	.blend(c())
	.blend(c())
	.out(o0);
var zy = i => src(o0)
	.scale(0.514 / 4.27)
	.rotate(0.123, Math.random() * i - 3)
	.mask(shape(4)
		.scale(0.613))
	.scrollX(0.742 / 0.097 * COORDS[i][0])
	.scrollY(0.139 / 3 * COORDS[i][1])
	.scrollX(0.973, 0.059);
zy(0)
	.add(zy(1))
	.add(zy(2))
	.add(zy(3))
	.add(zy(4))
	.add(zy(5))
	.add(zy(6))
	.add(zy(7))
	.add(zy(8))
	.out(o1);
src(o0)
	.mult(o1, 0.96)
	.diff(src(o2)
		.blend(src(o2)
			.scale(1.201)), [1.771, 0.59, -2].fast(1.613 / 15.721)
		.smooth())
	.out(o2);
src(o2)
	.scale(-0.639)
	.scrollX(0.865, 0.022)
	.brightness(0.3)
	.diff(o2)
	.mult(src(o0)
		.brightness(0.251))
	.add(o2)
	.add(o1)
	.out(o3);
render(o3);

metadata = {"index":0,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}