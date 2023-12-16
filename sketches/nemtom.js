/* nemtom */
speed=1

shape(4,[1,0.7].fast(2.1).smooth(), 0.1).diff(shape(4,0.9)).scroll(0,0,0.1,-0.12).scale(0.2).kaleid(4).out(o0)

src(o0).blend(src(o1).rotate(0.1,0.21).scale([0.8,0.99].fast(0.9).smooth()), [0.8, 0.99].smooth()).out(o1)

const ring = shape(50,0.4, 0.7).diff(shape(50,0.3, 0.7)).scale([0.8,1].fast(2).smooth(0.8))

src(o1).diff(ring).scale(0.9).diff(o1).brightness(0.2).out(o2)

src(o2).repeat(3,3).diff(o1).diff(o0).out(o3)

render(o3)

metadata = {"index":39,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}