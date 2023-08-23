// register WebMIDI
((alreadyInitialized) => {
  if (alreadyInitialized) {
    console.log("Hydrakit already loaded");
    return;
  }
  
  navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  
  function onMIDISuccess(midiAccess) {
    console.log(midiAccess);
    for (var input of midiAccess.inputs.values()) {
      input.onmidimessage = getMIDIMessage;
    }
  }
  
  function onMIDIFailure() {
    console.log('Could not access your MIDI devices.');
  }
  
  //create an array to hold our cc values and init to a normalized value
  window.cc = Array(128).fill(0.5);
  window.ccc = Array(16).fill(1).map(() => Array(128).fill(0.5));
  window.ccbind = [];
  
  getMIDIMessage = function(midiMessage) {
    const [kind, ccIndex, value] = midiMessage.data;
    const channel = kind & 0b00001111;
    var valNormalized = (value > 64 ? value + 1 : value) / 128.0;
    if (ccIndex !== undefined) {
      console.log(
        'Midi received on cc#' + ccIndex + ' value:' + valNormalized +
        ', channel: ' + channel);    // uncomment to monitor incoming Midi
      cc[ccIndex] = valNormalized;
      ccc[channel][ccIndex] = valNormalized;
  
      if (!ccbind.includes(ccIndex)) {
        console.log(`${ccIndex} bound to b${ccbind.length}`);
        ccbind.push(ccIndex)
      }
    }
  };

  var kp = [];
  window.onkeypress = (a) => {"Space" == a.code && a.altKey && (a.preventDefault(), 4 === kp.push(a.timeStamp) && (window.bpm = Math.floor(6E4 / ((kp[3] - kp[0]) / 3)), kp.length = 0));}

  console.log("Hydrakit loaded");
  window.hydrakitReady = true;
})(window.hydrakitReady);


function midi(ccIndex, options = {}) {
  const colorToMidi = {
    "green": 0,
    "blue": 2,
    "yellow": 3,
    "red":4,
  };
  const {min=0, max=1, channel, transform} = options

  return () => {
    let localIndex = ccIndex
    if (typeof ccIndex === "string" && ccIndex.match(/b\d/)) {
      localIndex = ccbind[Number(ccIndex[1])]

      if (localIndex === undefined) return min
    } else if (typeof ccIndex === "string") {
      localIndex = colorToMidi[ccIndex];
    }

    const ccArr = channel !== undefined ? ccc[channel] : cc;
    const value = ccArr[localIndex] * (max - min) + min;
    if (transform) {
      return transform(value)
    } else {
      return value;
    }
  };
}

const saw = ({
	min = 0,
	max = 1,
	x = 1,
	t
} = {}) => ({
	time
}) => {
	const spb = 60 / bpm * x;
	const p = (time % spb) / spb * (max - min) + min;

	if (t) {
		return t(p);
	} else {
		return p;
	}
}