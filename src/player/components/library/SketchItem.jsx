import React from 'react';
import { playSketch } from '../../actions/index.js';
import { cx } from '../../utils/cx.js';

export const SketchItem = React.memo(function SketchItem({ sketch, index, active }) {
  const tags = (sketch.metadata?.tags || []).join(', ');
  return (
    <div className={cx('sketch-item', active && 'active')} onClick={() => playSketch(index)}>
      <div className="sketch-item-info">
        <span className="sketch-item-name">{sketch.name}</span>
        <span className="sketch-item-meta">{`by ${sketch.author} ${tags ? `• ${tags}` : ''}`}</span>
      </div>
      <div className="sketch-item-indicator" />
    </div>
  );
});
