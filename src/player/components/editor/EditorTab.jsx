import React from 'react';
import { useStore } from '../../store/useStore.js';
import { setEditorCode, runCustomCode, resetCustomCode } from '../../actions/index.js';

/** Lightweight code view to inspect/modify the running sketch. */
export function EditorTab() {
  const code = useStore((s) => s.editorCode);
  return (
    <div className="code-container">
      <textarea
        id="editor-textarea"
        className="code-textarea"
        spellCheck={false}
        placeholder="// Write or modify Hydra synth code here..."
        value={code}
        onChange={(e) => setEditorCode(e.target.value)}
      />
      <div className="code-actions">
        <button className="action-btn" onClick={resetCustomCode}>Reset</button>
        <button className="action-btn accent" onClick={runCustomCode}>Run Code</button>
      </div>
    </div>
  );
}
