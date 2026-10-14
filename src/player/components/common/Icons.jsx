import React from 'react';

const Svg = ({ size = 18, filled = true, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke={filled ? undefined : 'currentColor'}
    strokeWidth={filled ? undefined : 2}
  >
    {children}
  </svg>
);

export const ChevronRightIcon = ({ size = 20 }) => (
  <Svg size={size} filled={false}><path d="M9 18l6-6-6-6" /></Svg>
);

export const ChevronLeftIcon = ({ size = 18 }) => (
  <Svg size={size} filled={false}><path d="M15 18l-6-6 6-6" /></Svg>
);

export const PrevIcon = () => (
  <Svg><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></Svg>
);

export const NextIcon = () => (
  <Svg><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></Svg>
);

export const PlayIcon = () => (
  <Svg><path d="M8 5v14l11-7z" /></Svg>
);

export const PauseIcon = () => (
  <Svg><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></Svg>
);

export const ShuffleIcon = () => (
  <Svg>
    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
  </Svg>
);
