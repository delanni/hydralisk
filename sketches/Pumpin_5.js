/* Pumpin 5 */
bpm = 170

shape(4).scrollX(0,0.23239).scrollY(0,0.3).kaleid(5)
  .diff(shape(5).scrollX(0, -0.1111).scrollY(0,-Math.random()/10).kaleid(7))
  .rotate(0.3, 0.01)
  .repeat(2,1)
  .out(o0)

src(o0).blend(o1,0.99).rotate(0,[0.001, -0.001].fast(0.004).smooth()).add(o0,0.1).out(o1)

ox = osc(6,-0.1,[0,2].fast(0.01).smooth()).brightness(0.1)

src(o1)
  .mult(ox.saturate(0.2))
  .diff(shape(2).scale(({time})=> 2 * (time%(60/bpm))))
  .out(o2)


src(o2).blend(src(o2).scale(0.99).diff(o1).diff(ox.kaleid(10)), [0,1].fast(0.1).smooth()).out(o3) 

render(o3)

metadata = {"index":34,"type":"code","bpm":"170","midi":false,"heat":5,"author":"Alex Szabo"}