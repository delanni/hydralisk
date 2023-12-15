/* Feketefeher ugralo akarmi */
bpm = 130

const xo = [1,1,1,1,1,2,3,5]
const blendy = [0.1, 0.1, 0.1, 0.5, 0.9, 0.99]
const kaleids = [4, 6, 5, 7, 6, 8, 9]

shape(4).scale([0.5, 3].fast(2).ease('easeInCubic')).invert([0,1]).out(o0)

src(o0).repeat(xo, xo).mult(src(o0).rotate(xo, 0.4).kaleid(kaleids), 0.9).blend(src(o1).rotate([0.01,-0.01].fast(0.1)), blendy.smooth()).out(o1)

render(o1)

metadata = {"index":13,"type":"code","bpm":130,"midi":false,"heat":5,"author":"Alex Szabo"}