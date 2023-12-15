/* freezenoize */

bpm = 140

noise([4,10].fast(0.01).smooth(), 1, 4)
	.diff(src(o0)
		.mult(osc(1, 1, 0.9)
			.kaleid(10)))
	.out(o0)

src(o0)
	.diff(src(o0)
		.rotate(1, 1))
	.mult(osc(1, 1, 0.4)
		.kaleid(10).brightness(0.8))
	.modulate(noise(4, 4, 4))
	.scale(0.6)
	.out(o1)

src(o1)
	.rotate(0, -1)
	.diff(src(o1)
		.pixelate(()=> Math.sin(time/5) * width / 20, ()=> Math.sin(time/6) * height / 20))
	.out(o2)

src(o2)
	.diff(src(o2).rotate(1,1))
	.mult(src(o0).invert([0,1].fast(0.25).smooth()), -1)
	.blend(o3, () => Math.sin(time/2)/2 + 0.5)
	.blend(o0, () => (mouse.x/width-0.5) % 1)
  .out(o3)

render(o3)

metadata = {"index":5,"type":"code","bpm":"140","midi":false,"heat":5,"author":"Alex Szabo"}