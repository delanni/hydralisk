/* Random 94354 */
// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// by Olivia Jack
// https://ojack.github.io

bpm = 120
osc(100, 0.1, 1)
	.hue(0.5)
	.brightness(-0.2)
	.out(o0)

src(o0)
	.add(src(o0)
		.scale(-1.1), 0.99)
	.out(o1)

src(o1)
	.diff(src(o0)
		.contrast([-0.9, 0.9].fast(0.3)
			.smooth())
		.rotate(Math.PI / 2, 0.01))
	.out(o2)

shape(3)
	.scale(1, 0.7)
	.scroll(0, 0, Math.random(), Math.random())
	.repeat(3, 3)
	.scale([-0.5, 0.2].fast(0.01)
		.smooth())
	.add(shape(4)
		.scale(1, [0.6, 1.1].smooth())
		.rotate(0, 0.1)
		.scroll(0, 0, Math.random(), Math.random())
		.kaleid(4)
		.repeat(2, 2)
		.scale(-0.8))
	.kaleid(8)
	.diff(src(o2)
		.rotate(0.4))
	.blend(o3, [0.2,0.5,0.99, 0.8,].fast(0.125))
	.modulate(noise(2,0.1),[0,0.05,0,0.1]).kaleid(4)
	.out(o3)

render(o3)

metadata = {"index":27,"type":"code","bpm":120,"midi":false,"heat":5,"author":"Olivia Jack"}