import React from 'react';
import { useStore } from '../../store/useStore.js';
import { cx } from '../../utils/cx.js';
import { PanelHeader } from './PanelHeader.jsx';
import { PanelTabs, TabPanel } from './PanelTabs.jsx';
import { LibraryTab } from '../library/LibraryTab.jsx';
import { EditorTab } from '../editor/EditorTab.jsx';
import { PerformanceTab } from '../performance/PerformanceTab.jsx';
import { PlaybackControls } from '../playback/PlaybackControls.jsx';

/** Floating control drawer: header, tabs and playback footer. */
export function Sidebar() {
  const collapsed = useStore((s) => s.panelCollapsed);

  return (
    <div id="sidebar-panel" className={cx('sidebar-panel', collapsed && 'collapsed')}>
      <PanelHeader />
      <PanelTabs />
      <div className="panel-body">
        <TabPanel id="library"><LibraryTab /></TabPanel>
        <TabPanel id="editor"><EditorTab /></TabPanel>
        <TabPanel id="performance"><PerformanceTab /></TabPanel>
      </div>
      <PlaybackControls />
    </div>
  );
}
