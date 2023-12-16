/* friki fraki */
const r = () => Math.floor(Math.random() * Math.random() * Math.random() * 40);
const rd = () => Math.random() - 0.5;

const s = new Array(10)
	.fill(0)
	.map(_ => shape(r())
		.scale(rd())
		.rotate(rd(), rd())
        .scroll(0,0,rd(),rd())
		.mult(osc(r(), rd(), Math.random())));

const all = (blendMode, head, x) => {
	let rx = head;

	for (var i = 0; i < x.length; i++) {
		rx = rx[blendMode](x[i], 0.4);
	}
	return rx;
}

all('add', solid(), s)
	.out(o0);

src(o0).add(o1,0.4).mult(src(o0).rotate(0, rd())).out(o1)

src(o1).diff(src(o1).scale([0.9,1].fast(20).smooth(0.5))).add(o1).out(o2)

src(o2).scroll(0,0,rd(),rd()).rotate(rd()/10).scale(({t}) => t/10%3).diff(o2).add(src(o0).kaleid([4,8,16,32,64,128]), 0.3).out(o3)

render(o3)

metadata = {"index":43,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}