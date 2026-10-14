import React from 'react';
import { useStore } from '../../store/useStore.js';
import { selectCanUndo, selectCanRedo } from '../../store/playerStore.js';
import {
  AUTOMUTATE_MODES, setAutomutateMode, triggerMutation, undoMutation, redoMutation
} from '../../actions/index.js';
import { InfoCard } from '../common/InfoCard.jsx';
import { FilterTag } from '../common/FilterTag.jsx';
import { cx } from '../../utils/cx.js';

export function AutomutateCard() {
  const mode = useStore((s) => s.automutateMode);
  const canUndo = useStore(selectCanUndo);
  const canRedo = useStore(selectCanRedo);
  const isOff = mode === 'off';

  const status = (
    <span id="mutation-status-label" className={cx('sketch-tag', 'status-label', !isOff && 'active')}>
      {mode.toUpperCase() + (isOff ? '' : ' ACTIVE')}
    </span>
  );

  return (
    <InfoCard
      spaced
      title="Automutate / Mutation Modes"
      status={status}
      description="Automatically modify visual parameters and functions over time."
    >
      <div className="card-field">
        <span className="field-label">AUTO-MUTATE INTERVAL</span>
        <div className="tag-filters compact">
          {AUTOMUTATE_MODES.map(({ mode: m, label, title }) => (
            <FilterTag key={m} active={mode === m} title={title} onClick={() => setAutomutateMode(m)}>
              {label}
            </FilterTag>
          ))}
        </div>
      </div>

      <div className="code-actions compact">
        <button className="action-btn compact" id="mutation-undo-btn" onClick={undoMutation} disabled={!canUndo}>
          Undo
        </button>
        <button className="action-btn accent compact grow" onClick={triggerMutation}>Mutate Now</button>
        <button className="action-btn compact" id="mutation-redo-btn" onClick={redoMutation} disabled={!canRedo}>
          Redo
        </button>
      </div>
    </InfoCard>
  );
}
