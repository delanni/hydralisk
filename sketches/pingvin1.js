/* pingvin1 */
bpm = 155

s0.initImage("https://bazarexonline.com/crm/public/uploads/product_images_1000x1000/1682425789aVx.jpeg")

s1.initImage("https://bazarexonline.com/crm/public/uploads/product_images_1000x1000/1682425789aVx.jpeg")

src(s0).colorama( midi("green", {min: -0.001, max: 1}) ).modulate(noise( midi("blue", {min: 0, max: 6}) )).out(o0)


src(s1).scale([0.7, 1.1].fast(2).smooth()).rotate(midi("red", {min: 0, max:Math.PI * 4})).out(o1)

src(o0).mult(o1, midi("yellow")).out(o2);

src(o2).blend(src(o3).scale([1,1.06]),  midi(65, {min: 0.2, max:0.95})).out(o3)

render(o3);

/* metadata = {"index":65,"type":"code","bpm":"155","midi":true,"local":false,"heat":5,"author":"Zsolt Liber"} */