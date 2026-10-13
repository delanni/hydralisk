import React from 'react';
import { cx } from '../../utils/cx.js';

export const StatusDot = React.forwardRef(function StatusDot({ active, midiActive, title, id }, ref) {
  return (
    <div
      ref={ref}
      id={id}
      className={cx('status-dot', active && 'active', midiActive && 'midi-active')}
      title={title}
    />
  );
});
