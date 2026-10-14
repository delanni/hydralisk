/**
 * Code mutator.
 * Pure function that randomly swaps a Hydra function for a sibling of the same
 * category, or perturbs a numeric literal.
 */

const CATEGORIES = {
  sources: ['osc', 'shape', 'noise', 'voronoi', 'gradient', 'solid'],
  geometry: ['rotate', 'scale', 'pixelate', 'repeat', 'repeatX', 'repeatY', 'kaleid', 'scroll', 'scrollX', 'scrollY'],
  color: ['posterize', 'shift', 'invert', 'contrast', 'luma', 'thresh', 'color', 'saturate', 'hue', 'colorama'],
  blends: ['add', 'sub', 'mult', 'diff', 'blend', 'mask'],
  modulators: ['modulate', 'modulateScale', 'modulatePixelate', 'modulateRotate', 'modulateKaleid', 'modulateScrollX', 'modulateScrollY', 'modulateHue']
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];

function mutateFunction(code) {
  const found = [];
  Object.entries(CATEGORIES).forEach(([category, funcs]) => {
    funcs.forEach((name) => {
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      let match;
      while ((match = regex.exec(code)) !== null) {
        found.push({ name, index: match.index, category });
      }
    });
  });
  if (found.length === 0) return null;

  const selected = pick(found);
  const others = CATEGORIES[selected.category].filter((f) => f !== selected.name);
  if (others.length === 0) return null;

  const become = pick(others);
  console.log(`Mutator: changing function ${selected.name} to ${become}`);
  return code.substring(0, selected.index) + become + code.substring(selected.index + selected.name.length);
}

function mutateNumber(code) {
  const numRegex = /(?<![\w'"`])(?:\b-?\d+(?:\.\d+)?\b)/g;
  const matches = [...code.matchAll(numRegex)];
  if (matches.length === 0) return code;

  const selected = pick(matches);
  const oldStr = selected[0];
  const oldVal = parseFloat(oldStr);
  const newVal = oldVal === 0
    ? (Math.random() > 0.5 ? 0.5 : -0.5)
    : Math.round(Math.random() * oldVal * 2 * 1000) / 1000;

  console.log(`Mutator: changing number ${oldStr} to ${newVal}`);
  return code.substring(0, selected.index) + String(newVal) + code.substring(selected.index + oldStr.length);
}

export function mutateCode(code, changeTransform = false) {
  if (changeTransform) {
    const mutated = mutateFunction(code);
    if (mutated !== null) return mutated;
  }
  return mutateNumber(code);
}
