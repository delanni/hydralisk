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

  /**
   * TODO: lepegetes
   * TODO: sorban legyenek
   * TODO: kivalogatni ami kell/nem kell

   * Midi received on cc#87 value:0, channel: 5 RANDOM
hydrakit.js:31 Midi received on cc#88 value:0.7890625, channel: 5 FEL
hydrakit.js:31 Midi received on cc#86 value:0.7890625, channel: 5  LE
   */

  getMIDIMessage = function (midiMessage) {
    const [kind, ccIndex, value] = midiMessage.data;
    const channel = kind & 0b00001111;
    var valNormalized = (value > 64 ? value + 1 : value) / 128.0;
    if (ccIndex !== undefined) {

      if (valNormalized !== 0) {
        if (ccIndex === 87) {
          window.xemitter.emit("editor:randomize", {});
        }
        if (ccIndex === 88) {
          window.xemitter.emit("gallery:nextSketch", {});
        }

        if (ccIndex === 86) {
          window.xemitter.emit("gallery:nextSketch", { backwards: true });
        }
      }

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
  window.onkeypress = (a) => { "Space" == a.code && a.altKey && (a.preventDefault(), 4 === kp.push(a.timeStamp) && (window.bpm = Math.floor(6E4 / ((kp[3] - kp[0]) / 3)), kp.length = 0)); }

  console.log("Hydrakit loaded");
  window.hydrakitReady = true;
})(window.hydrakitReady);


function midi(ccIndex, options = {}) {
  const colorToMidi = {
    "green": 1,
    "blue": 2,
    "yellow": 3,
    "red": 4,
  };
  const { min = 0, max = 1, channel, transform } = options

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

function createLFO({
  frequency = 1, // Frequency in Hz
  amplitude = 1, // Amplitude of the oscillation
  phase = 0, // Phase offset in radians
  waveform = 'sine', // 'sine', 'square', 'sawtooth', 'triangle'
  bpm = undefined,
  trans = undefined,
  t = undefined
} = {}) {
  const transform = trans || t;

  if (bpm) {
    frequency = bpm / 60 * frequency;
  }
  const omega = 2 * Math.PI * frequency; // Angular frequency

  return ({ time }) => {
    let theta = omega * time + phase; // Phase of the oscillator at time t
    let value;

    switch (waveform) {
      case 'sine':
        value = Math.sin(theta);
        break;
      case 'square':
        value = Math.sign(Math.sin(theta));
        break;
      case 'sawtooth':
        value = 2 * (theta / (2 * Math.PI) - Math.floor(1 / 2 + theta / (2 * Math.PI)));
        break;
      case 'triangle':
        value = 2 * Math.abs(2 * (theta / (2 * Math.PI) - Math.floor(1 / 2 + theta / (2 * Math.PI)))) - 1;
        break;
      case 'random':
        value = Math.random() * 2 - 1; // Generates a random value between -1 and 1
        break;
      default:
        throw new Error('Unsupported waveform');
    }

    if (trans) {
      return trans(value * amplitude);
    }
    return value * amplitude;
  };
}

/**
 * @param {number} from 
 * @param {number} to 
 * @returns random number between from and to
 */
function randInt(from, to) {
  return Math.floor(Math.random() * (to - from + 1) + from);
}

/**
 * Balanced random between -0.5 and 0.5
 * @returns random number between -0.5 and 0.5
 */
function rx() {
  return Math.random() - 0.5;
}

const f = (...args) => new Function('return ' + String.raw(...args))

const _xxxStorage = {};
const xxx = target => {
  const callLine = new Error().stack.split("\n")[2];
  const key = callLine.match(/<anonymous>:(\d+:\d+)/)[1];
  if (!_xxxStorage[key]) {
    _xxxStorage[key] = target;
  }
  let current = _xxxStorage[key];
  return () => {
    if (Math.abs(target - current) >= 1 / 30) {
      current += (target - current) / 30;
      _xxxStorage[key] = current;
    } else {
      _xxxStorage[key] = target;
    }
    return current;
  };
};

/**
 * Generate an array of length with a count of hits with values of 1. 
 * @param {number} length The length of the array
 * @param {number} hits This amount of hits will be placed in the array
 * @param {function} map Transform the value of the array
 * @returns {Array} The array with the hits 
 */
const beatPattern = (length, hits, map = e => e) => {
  hits = Math.floor(Math.min(length, hits));
  const a = new Array(Math.floor(length)).fill(0);
  while (Math.floor(hits) > 0) {
    const r = Math.floor(Math.random() * length);
    if (a[r]) {
      continue;
    } else {
      a[r] = 1;
      hits--;
    }
  }
  return a.map(map);
}

/** solid, but with #rrggbb color */
function color(...args) {
  function hexToRgb(hex) {
    if (hex[0] === '#') {
      hex = hex.slice(1)
    }
    const r = (parseInt(`${hex[0]}${hex[1]}`, 16) / 255).toPrecision(4)
    const g = (parseInt(`${hex[2]}${hex[3]}`, 16) / 255).toPrecision(4)
    const b = (parseInt(`${hex[4]}${hex[5]}`, 16) / 255).toPrecision(4)
    return { r, g, b }
  }
  if (args.length === 1) {
    const { r, g, b } = hexToRgb(args[0]);
    return eval(`solid(${r},${g},${b})`);
  } else {
    return eval(`solid(${args[0]},${args[1]},${args[2]})`);
  }
}

