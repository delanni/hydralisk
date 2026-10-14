import React from 'react';
import { cx } from '../../utils/cx.js';

/** Pill-shaped toggle used for tag filters and mode selectors. */
export function FilterTag({ active, onClick, title, className, children }) {
  return (
    <div className={cx('filter-tag', active && 'active', className)} onClick={onClick} title={title}>
      {children}
    </div>
  );
}
