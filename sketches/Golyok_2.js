/* Golyok 2 */

function generateFMWave(time, periodLength) {
	// Calculate the angular frequency (2 * pi / periodLength)
	const angularFrequency = (2 * Math.PI + periodLength) / periodLength;

	// Calculate the frequency modulation factor (sin(time))
	const modulationFactor = Math.sin(time * 2 + periodLength) / 60;

	// Calculate the instantaneous frequency
	const instantaneousFrequency = angularFrequency * modulationFactor;

	// Calculate the value of the sinusoid at the current time
	const amplitude = 1; // You can adjust the amplitude as needed
	const waveValue = amplitude * Math.sin(instantaneousFrequency * time);

	return waveValue;
}

const o = (periodLength, r = 1) => ({
	time
}) => generateFMWave(time / 5, periodLength) / 4 * r;

shape(60)
	.scale([0.4 * Math.random(), 0.7])
	.scrollX(o(Math.random() * 10, Math.random() + 1))
	.scrollY(o(Math.random() * 10, Math.random() + 1))
	.add(shape(60)
		.scale(0.4)
		.scrollX(o(Math.random() * 10, Math.random()))
		.scrollY(o(Math.random() * 10, Math.random())))

	.add(shape(60)
		.scale(0.4 * Math.random())
		.scrollX(o(Math.random() * 10))
		.scrollY(o(Math.random() * 10)))

	.add(shape(60)
		.scale(0.4 * Math.random())
		.scrollX(o(Math.random() * 10))
		.scrollY(o(Math.random() * 10)))

	.out(o0)

src(o0)
	.scale([0.5, 1, 0.8, 1, 0.7].smooth())
	.blend(src(o0))
	.blend(src(o1)
		.color(0.8, 0.6, 0.3)
		.hue(() => mouse.y / height))
	.add(o1, () => mouse.x / width - 0.2)
	.blend(shape(3)
		.kaleid(5), () => mouse.y / height - 1)
	.out(o1)

src(o1)
	.scale([0.9, 0.99].smooth())
	.blend(src(o2)
		.rotate([0.1, -0.3].smooth(), 0.01))
	.out(o2)

src(o1)
	.mult(src(o2)
		.scale(1.1), 0.1)
	.diff(src(o2)
		//.kaleid(4)
    )
	.out(o2)

src(o2)
	.invert()
	.diff(src(o2)
		.scale(1.1)
		.rotate(0.2, 0.1))
	.invert()
	.blend(o3)
	.scale([1, 1.1])
	.out(o3)

render(o3)

metadata = {"index":3,"type":"code","bpm":0,"midi":false,"heat":5,"author":"Alex Szabo"}