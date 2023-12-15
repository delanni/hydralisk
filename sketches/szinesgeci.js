/* szinesgeci */
noise(4,0.1).modulate(noise(4,0.1)).modulate(noise(() => mouse.y/height*6+4,1).rotate(0,0.1)).contrast(() => mouse.y/height*6).out(o0)

src(o0).diff(src(o0).kaleid(5)).diff(src(o0).kaleid(10)).out(o1)

src(o1).mult(osc(() => mouse.x/width*2,() => mouse.x/width,() => mouse.x/width)).saturate(4).blend(src(o2).rotate(() => mouse.y/height)).out(o2)

src(o2).diff(src(o2).scale(-1)).diff(src(o1)).blend(o3,0.95).out(o3)

render(o3)

metadata = {"index":21,"type":"code","midi":false,"heat":5,"author":"Alex Szabo"}