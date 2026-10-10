/* ants in my pants2 */

osc(5,.1).modulate(noise(6),.22).diff(o0)
  	.modulateScrollY(osc(2).modulate(osc().rotate(),.11))
	.scale(.72).color(0.99,1.014,1)
	.kaleid([1,2,2,3,3,3,4,4,4,4,10].fast(0.1).ease('easeInOut'))
	.mult(osc(8,0.1,[0.7,1.3].fast(0.1).smooth()).kaleid(10))
  	.out(o0);

src(o0).mask(shape(6,0.5,0.1)).out(o1);

src(o1).scale([1, 1/3, 1/9, 1/27].fast(0.5).smooth(0.1)).rotate([0, Math.PI/4, Math.PI/2, Math.PI/43].smooth(0.1)).out(o2);

//src(o2).add(o3,0.6).add(o0,0.1).mask(shape(6,0.8, 0.2)).out(o3)
src(o3).diff(o0, 0.1).add(src(o2).mask(shape(6,0.8, [-0.3, 0.5].smooth(0.1)))).contrast(() => 0.8+Math.sin(time)/10).out(o3)

render(o3)
  

/* metadata = {"index":45,"type":"code","bpm":0,"midi":false,"local":false,"heat":5,"author":"Alex Szabo"} */