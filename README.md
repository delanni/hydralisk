# hydralisk
A customized build of Olivia Jack's Hydra

The code is on the [gh-pages](https://github.com/delanni/hydralisk/tree/gh-pages) branch, it's hosted at: https://delanni.github.io/hydralisk

Extra features:
 - tap tempo: ALT + Space (at least 4 beats, but keep tapping :) )
 - auto-mutate: CTRL + (1,2,3,4,5, 0) - for (every beat, every other beat, every 4 beats..., 0 => stop automutate)
 - undo 5x: CMD + [ (helpful if the auto-mutate screws up the state)
 - quick save / quick load: CMD + S / CMD + L 
 - speed dial: CTRL + (7,8,9) - for (slower, 1x, faster)
 - reverse speed: CTRL + SHIFT + 8
 - save sketch: floppy disc
 - browse local sketches: CTRL + SHIFT + C
 - full screen: CTRL + SHIFT + G
 - extra functions: createLFO({ amplitude, phase, trans, waveform }), beatPattern(length, hits, transform), color(hexCode)
 - midi binds: midi(ccIndex, {min,max,channel,transform}), where ccIndex="b1" ("b2",... will bind to the first, second... changed cc value for easy bind)
 - work in progress: upload and download sketches
