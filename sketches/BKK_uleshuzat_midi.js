/* BKK uleshuzat midi */
const noiseC = 10 + (Math.random() * 10)
const moveSpeed = 1

const a = Math.random() / 2;
const b = 0.8 - a;

bpm = 140

n1 = noise(noiseC, moveSpeed)
	.color(1, a, b)
	.rotate(0, 0.3)
n2 = noise(noiseC, moveSpeed)
	.color(a, 1, b)
	.rotate(0, 0.2)
n3 = noise(noiseC, moveSpeed)
	.color(a, b, 1)
	.rotate(0, 0.1)

noise(noiseC, moveSpeed)
	.color(0, 0, 1)
	.rotate(0, 0.1)
	.out(o2)

cx = solid()
	.blend(n1, [1, 1, 0, 1, 1, 0].offset(0)
		.smooth())
	.blend(n2, [0, 1, 1, 0, 1, 1].offset(1)
		.smooth())
	.blend(n3, [1, 0, 1, 0, 1].offset(2)
		.smooth())

solid()
	.add(cx)
	.blend(src(o3)
		.scale([0.9, 3].fast(2 ** -4)
			.smooth(), 0.9))
	.saturate(1.1)
	.colorama()
	.diff(src(o3).blend(o2, [0,1].fast(0.1).smooth()))
	.invert(() => Math.sin(time/20))
	.blend(src(o3).scale(1.1).rotate(midi("red", {min:-0.1, max:0.2})), midi(65, {min: 0.0, max:0.9}))
	.out(o3)


render(o3)

metadata = {"index":36,"type":"code","bpm":"140","midi":true,"heat":5,"author":"Alex Szabo"}