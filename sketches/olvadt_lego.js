/* olvadt lego */
bpm = 150;
src(o0)
	.modulateHue(src(o0)
		.scale(midi("green", {min:1.01, max:10})), 1)
	.layer(osc(midi("red", {min:2, max:10}), 0.1, 2)
		.mask(shape(midi("yellow", {min:2, max:4}), midi("yellow", {min:0.003, max:0.3}), 1e-6))
		.rotate(() => 2 * Math.sin(time * 0.5))
        .pixelate(1000,midi("blue", {min:1, max:1000}))
		.color(1, 4, 10, [0,1].fast(2)))
	.out();

/* metadata = {"index":61,"type":"code","bpm":"150","midi":true,"local":false,"heat":5,"author":"Zsolt Liber"} */