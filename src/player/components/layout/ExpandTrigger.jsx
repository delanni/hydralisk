import React from 'react';
import { useStore } from '../../store/useStore.js';
import { selectExpandTriggerVisible } from '../../store/playerStore.js';
import { toggleCollapse } from '../../actions/index.js';
import { ChevronRightIcon } from '../common/Icons.jsx';
import { cx } from '../../utils/cx.js';

/** Floating button that re-opens the collapsed sidebar. */
export function ExpandTrigger() {
  const visible = useStore(selectExpandTriggerVisible);
  return (
    <div
      id="expand-trigger"
      className={cx('expand-trigger', visible && 'visible')}
      onClick={toggleCollapse}
      title="Show Controls"
    >
      <ChevronRightIcon />
    </div>
  );
}
