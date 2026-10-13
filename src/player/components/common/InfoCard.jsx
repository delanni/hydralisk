import React from 'react';
import { cx } from '../../utils/cx.js';

/** Glass card with an optional title row, status slot and description. */
export function InfoCard({ title, status, description, spaced, children }) {
  return (
    <div className={cx('info-card', spaced && 'spaced')}>
      {title && (
        <div className="card-header">
          <span className="info-label card-title">{title}</span>
          {status}
        </div>
      )}
      {description && <p className="card-description">{description}</p>}
      {children}
    </div>
  );
}
