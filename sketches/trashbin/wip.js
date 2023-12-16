/* wip */
const tx = [0,Math.PI].smooth(0.1);
const yelo = () => solid(1, 1, 0);
const yt = () => shape(3, 0.2)
		.diff(shape(3, 0.2 * 0.9))
		.rotate(tx)
		.mult(yelo())
		.scale(() => 0.5 + time%(60/bpm) * 2 + Math.random()/10,height/width)

solid()
	.mult(gradient(0.2)
		.saturate(0.01))
	.add(yt())
	.blend(src(o0).scale(1,height/width).hue(0.1).rotate(() => Math.random() * Math.PI * 2).scale(() => Math.random()+1), ()=>mouse.y/height * 0.8)
	.add(yt().scale(0.8))
	.out(o0);

src(o1).add(src(o0), () => mouse.x/width).blend(solid(), [0.9,0,0.2,0,0.1,0,0.2,0].fast(8)).out(o1)



render();

metadata = {"index":75,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}