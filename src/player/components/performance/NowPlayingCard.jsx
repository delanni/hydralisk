import React from 'react';
import { useStore } from '../../store/useStore.js';
import { usePulse } from '../../hooks/usePulse.js';
import { cx } from '../../utils/cx.js';

function InfoRow({ label, children, stacked }) {
  return (
    <div className={cx('info-row', stacked && 'stacked')}>
      <span className="info-label">{label}</span>
      {children}
    </div>
  );
}

export function NowPlayingCard() {
  const nowPlaying = useStore((s) => s.nowPlaying);
  const mutationPulse = useStore((s) => s.mutationPulse);
  const flashing = usePulse(mutationPulse, 300);

  return (
    <div className="info-card">
      <InfoRow label="Active Sketch">
        <span id="playing-sketch-name" className={cx('info-value', flashing && 'flash')}>
          {nowPlaying?.name ?? '—'}
        </span>
      </InfoRow>
      <InfoRow label="Author">
        <span id="playing-sketch-author" className="info-value">{nowPlaying?.author ?? '—'}</span>
      </InfoRow>
      <InfoRow label="Base Tempo">
        <span id="playing-sketch-bpm" className="info-value">{nowPlaying ? `${nowPlaying.bpm} BPM` : '—'}</span>
      </InfoRow>
      <InfoRow label="Tags" stacked>
        <div id="playing-sketch-tags" className="sketch-tags">
          {(nowPlaying?.tags || []).map((tag) => (
            <span key={tag} className="sketch-tag">{tag}</span>
          ))}
        </div>
      </InfoRow>
    </div>
  );
}
