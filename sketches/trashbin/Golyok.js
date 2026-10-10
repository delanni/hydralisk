/* Golyok */

function generateFMWave(time, periodLength) {
  // Calculate the angular frequency (2 * pi / periodLength)
  const angularFrequency = (2 * Math.PI + periodLength) / periodLength;

  // Calculate the frequency modulation factor (sin(time))
  const modulationFactor = Math.sin(time2+periodLength)/60;

  // Calculate the instantaneous frequency
  const instantaneousFrequency = angularFrequency * modulationFactor;

  // Calculate the value of the sinusoid at the current time
  const amplitude = 1; // You can adjust the amplitude as needed
  const waveValue = amplitude * Math.sin(instantaneousFrequency * time);

  return waveValue;
}

const o = (periodLength) => ({time}) => generateFMWave(time/5, periodLength) / 4;

shape(60).scale(0.4).scrollX(o(Math.random() * 10)).scrollY(o(Math.random() * 10))
.add(shape(60).scale(0.4).scrollX(o(Math.random() * 10)).scrollY(o(Math.random() * 10)))

.add(shape(60).scale(0.4).scrollX(o(Math.random() * 10)).scrollY(o(Math.random() * 10)))

.add(shape(60).scale(0.4).scrollX(o(Math.random() * 10)).scrollY(o(Math.random() * 10)))
  
  
  .out(o0)


render(o0)

metadata = {"index":10,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}