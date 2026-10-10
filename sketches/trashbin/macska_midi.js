/* macska midi */

bpm = 140 / 4

s0.initImage("https://cataas.com/cat/says/MEOW?a=x")
src(s0).colorama( midi("b0", {min: -0.001, max: 1}) ).modulate(noise( midi("b1", {min: 0, max: 6}) )).out(o0)



metadata = {"index":20,"type":"code","bpm":"140","midi":true,"heat":5,"author":"Alex Szabo"}