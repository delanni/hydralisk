import React from 'react';
import { useStore } from '../../store/useStore.js';
import { TABS, switchTab } from '../../actions/index.js';
import { cx } from '../../utils/cx.js';

export function PanelTabs() {
  const currentTab = useStore((s) => s.currentTab);
  return (
    <div className="panel-tabs">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          className={cx('tab-btn', currentTab === id && 'active')}
          data-tab={id}
          onClick={() => switchTab(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Tab body wrapper; all tabs stay mounted so their state survives switching. */
export function TabPanel({ id, children }) {
  const currentTab = useStore((s) => s.currentTab);
  return (
    <div id={`${id}-tab`} className={cx('tab-content', currentTab === id && 'active')}>
      {children}
    </div>
  );
}
