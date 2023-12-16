/* rotacats midi */

bpm = 140

s0.initImage("https://cataas.com/cat/says/MEOW?a=x")
s1.initImage("https://cataas.com/cat/says/MEOW?a=x")

src(s0).colorama( midi("green", {min: -0.001, max: 1})).modulate(noise(midi("blue", {min: 0, max: 6}))).out(o0)


src(s1).scale([0.7, 1.1].fast(2).smooth()).rotate(midi("red", {min: 0, max:Math.PI * 4})).out(o1)

src(o0).mult(o1, midi("yellow")).out(o2);

src(o2).blend(src(o3).scale([1,1.06]),  midi(65, {min: 0.2, max:0.95})).out(o3)

render(o3);



metadata = {"index":21,"type":"code","bpm":"140","midi":true,"heat":5,"author":"Alex Szabo"}