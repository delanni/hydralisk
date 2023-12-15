/* Szurke pulzalo kaleidoszkop */
bpm = 140

const xo = [1,1,1,1,1,2,3,5]
//const b = shape(xo.fit(4, 8)).rotate(1, 1.1)
const b = osc(3, 1, 0.1).rotate(xo).kaleid([3,10].fast(0.1)).pixelate(3,3).modulateKaleid(o0)

b.scale([0.5, 1].fast(2).ease('easeInCubic')).invert([0,1]).out(o0)

src(o0).repeat(xo, xo).modulateRotate(o0).out(o1)

render(o1)

metadata = {"index":14,"type":"code","bpm":140,"midi":false,"heat":5,"author":"Alex Szabo"}