/* colors and rotating rhombuses */

bpm = 170

shape(4).mult(osc(8,() => Math.sin(time/10)/10,2)).out(o0)

src(o0).scale(() => Math.sin(time) + 1).out(o1)

src(o0).diff(src(o1).scale(() => Math.sin(time/4) + 1).rotate(1.1, 0.9)).out(o2)

src(o2).blend(src(o3), 0.9).scale([0.5,2]).add(o2, 0.1).scrollX(0,0.2).layer(o2).out(o3)

render(o3)

metadata = {"index":17,"type":"code","bpm":"170","midi":false,"heat":5,"author":"Alex Szabo"}