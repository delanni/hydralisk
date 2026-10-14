export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const roundTo = (value, decimals) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const formatSpeed = (speed) => `${Number(speed || 0).toFixed(1)}x`;
