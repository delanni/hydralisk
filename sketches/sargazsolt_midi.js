/* sargazsolt midi */
await s0.initImage("https://mir-s3-cdn-cf.behance.net/project_modules/max_3840/41cb4d174834185.64a933ad1680c.png")

var cc = Array(128)
	.fill(0.5);

col=0.1
pressed=0

src(s0)
	.scale(midi("red", {min:0.1, max:2}))
	.color(-1, 200, 300)
	.rotate(1, -0.5)
	.pixelate(midi("blue", {min: 10, max:800}))
	.colorama(0.1)
	.out(o0)

osc(5, 0.01, 3)
	.rotate(2, 3)
	.kaleid(2)
	.repeat(midi("yellow", {min: 1, max:6}))
	.pixelate(10)
	.colorama(0.0003)
	.diff(shape(4)
		.rotate(2, -2, ))
	.out(o1)

src(o0)
	.modulateRotate(o1, 5)
	.blend(o2,() =>cc[4] )
	.modulate(shape(4)
		.rotate(2, -2))
	.out(o2)

render(o2)


/* metadata = {"index":37,"type":"code","bpm":0,"midi":true,"local":false,"heat":5,"author":"Alex Szabo"} */