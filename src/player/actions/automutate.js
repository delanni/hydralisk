/**
 * Automutate & mutation history actions.
 * The automutate clock itself lives in the `useAutomutateClock` hook, which
 * re-schedules whenever the mode or the BPM changes.
 */
import { getState, setState, MUTATION_HISTORY_LIMIT } from '../store/playerStore.js';
import { notify } from '../services/intercom.js';
import { evaluate } from '../services/hydraEngine.js';
import { mutateCode } from '../services/mutator.js';

export const AUTOMUTATE_MODES = [
  { mode: 'off', label: 'Off' },
  { mode: '1', label: '1b', title: '1x per beat' },
  { mode: '2', label: '2b', title: '1x per 1/2 bar (2 beats)' },
  { mode: '4', label: '4b', title: '1x per 1 bar (4 beats)' },
  { mode: '8', label: '8b', title: '1x per 2 bars (8 beats)' },
  { mode: '16', label: '16b', title: '1x per 4 bars (16 beats)' }
];

export function beatsForMode(mode) {
  const beats = parseInt(mode, 10);
  return [1, 2, 4, 8, 16].includes(beats) ? beats : 1;
}

export function setAutomutateMode(mode, quiet = false) {
  setState((s) => ({
    automutateMode: mode,
    selectedAutomutateMode: mode !== 'off' ? mode : s.selectedAutomutateMode
  }));

  if (quiet) return;
  if (mode === 'off') {
    notify('Auto-Mutate disabled');
  } else {
    const beats = beatsForMode(mode);
    notify(`Auto-Mutate active (every ${beats === 1 ? 'beat' : beats + ' beats'})`);
  }
}

export function toggleMobileAutomutate() {
  const { automutateMode, selectedAutomutateMode } = getState();
  setAutomutateMode(automutateMode === 'off' ? selectedAutomutateMode : 'off');
}

/** Start a fresh history for a newly loaded sketch. */
export function resetMutationHistory(code) {
  setState({ mutationHistory: [code], mutationHistoryIndex: 0 });
}

export function pushMutationHistory(code) {
  const { mutationHistory, mutationHistoryIndex } = getState();
  const history = mutationHistory.slice(0, mutationHistoryIndex + 1);
  history.push(code);
  if (history.length > MUTATION_HISTORY_LIMIT) history.shift();
  setState({ mutationHistory: history, mutationHistoryIndex: history.length - 1 });
}

export function triggerMutation() {
  const currentCode = getState().editorCode;
  const newCode = mutateCode(currentCode, Math.random() > 0.5);
  if (newCode === currentCode) return;

  try {
    evaluate(newCode, 'hydra-mutated-sketch');
    setState((s) => ({ editorCode: newCode, mutationPulse: s.mutationPulse + 1 }));
    pushMutationHistory(newCode);
  } catch (err) {
    console.error('Mutation evaluation failed:', err);
  }
}

function jumpHistory(offset, message) {
  const { mutationHistory, mutationHistoryIndex } = getState();
  const index = mutationHistoryIndex + offset;
  if (index < 0 || index >= mutationHistory.length) return;

  const code = mutationHistory[index];
  setState({ mutationHistoryIndex: index });
  evaluate(code, 'hydra-mutated-sketch');
  setState({ editorCode: code });
  notify(message);
}

export const undoMutation = () => jumpHistory(-1, 'Mutation undone');

export const redoMutation = () => jumpHistory(1, 'Mutation redone');
