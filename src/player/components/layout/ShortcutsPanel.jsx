import React from 'react';
import { useStore } from '../../store/useStore.js';
import { selectShortcutsHidden } from '../../store/playerStore.js';
import { cx } from '../../utils/cx.js';

const SHORTCUTS = [
  { keys: ['Alt+Space'], label: 'Tap Tempo' },
  { keys: ['←', '→'], label: 'Navigate' },
  { keys: ['Cmd+]'], label: 'Next' },
  { keys: ['R'], label: 'Shuffle' },
  { keys: ['H'], label: 'Toggle HUD' },
  { keys: ['T'], label: 'Touch Actions' },
  { keys: ['F'], label: 'Fullscreen' },
  { keys: ['⌘⇧F'], label: 'Feedback' }
];

/** Floating keyboard shortcuts guide (desktop only). */
export function ShortcutsPanel() {
  const hidden = useStore(selectShortcutsHidden);
  return (
    <div id="shortcuts-panel" className={cx('shortcuts-panel', hidden && 'hidden')}>
      {SHORTCUTS.map(({ keys, label }) => (
        <span key={label}>
          {keys.map((key, i) => (
            <React.Fragment key={key}>
              {i > 0 && ' '}
              <span className="shortcut-key">{key}</span>
            </React.Fragment>
          ))}
          {` ${label}`}
        </span>
      ))}
    </div>
  );
}
