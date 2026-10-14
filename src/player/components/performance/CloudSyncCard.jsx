import React from 'react';
import { useStore } from '../../store/useStore.js';
import { loginToCloud, logoutFromCloud } from '../../actions/index.js';
import { InfoCard } from '../common/InfoCard.jsx';
import { StatusDot } from '../common/StatusDot.jsx';

export function CloudSyncCard() {
  const authenticated = useStore((s) => s.cloudAuthenticated);
  return (
    <InfoCard
      spaced
      title="Cloud Synchronization"
      status={
        <StatusDot
          id="cloud-status-dot"
          active={authenticated}
          title={authenticated ? 'Connected to Cloud' : 'Not connected to Cloud'}
        />
      }
      description="Access your saved sketches from the cloud database."
    >
      <button id="cloud-login-btn" className="action-btn" onClick={authenticated ? logoutFromCloud : loginToCloud}>
        {authenticated ? 'Disconnect' : 'Login to Cloud'}
      </button>
    </InfoCard>
  );
}
