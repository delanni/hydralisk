// src/player/ui.js - Tab switching, collapse panels, mobile HUD detection, Cloud auth UI
import { state } from './state.js';
import { intercomNotify, showError } from './intercom.js';
import { syncPerformanceSettingsToHash } from './settingsSync.js';
import { loadAllSketches } from './sketchManager.js';

export function switchTab(tabId) {
  state.currentTab = tabId;

  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(content => {
    if (content.id === `${tabId}-tab`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

export function isMobileDevice() {
  return window.matchMedia('(max-width: 768px)').matches ||
         ('ontouchstart' in window && window.innerWidth <= 1024) ||
         /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isUIHidden() {
  const panel = document.getElementById('sidebar-panel');
  const shortcuts = document.getElementById('shortcuts-panel');
  if (!panel || !shortcuts) return false;
  return panel.classList.contains('collapsed') && shortcuts.classList.contains('hidden');
}

export function updateTouchActionsUI() {
  const overlay = document.getElementById('touch-actions-overlay');
  const floatingActions = document.getElementById('floating-hud-actions');
  const hudBtn = document.getElementById('touch-actions-hud-btn');
  const floatingBtn = document.getElementById('touch-actions-floating-btn');
  const shortcuts = document.getElementById('shortcuts-panel');
  const intercomBar = document.getElementById('intercom-bar');
  const isMobile = isMobileDevice();
  const hidden = isUIHidden();

  // If HUD is closed / hidden, hide the intercom bar as part of the HUD
  if (intercomBar) {
    intercomBar.classList.toggle('hidden', hidden);
  }

  // On mobile screens, hide QWERTY keyboard shortcuts guide and auto-enable touch mode
  if (isMobile) {
    if (shortcuts) {
      shortcuts.classList.add('hidden');
    }
  }

  if (floatingActions) {
    floatingActions.classList.toggle('visible', hidden || isMobile);
  }
  if (overlay) {
    overlay.classList.toggle('visible', (isMobile || hidden) && state.touchActionsEnabled);
  }
  if (hudBtn) {
    hudBtn.classList.toggle('active', state.touchActionsEnabled);
  }
  if (floatingBtn) {
    floatingBtn.classList.toggle('active', state.touchActionsEnabled);
  }
}

export function toggleCollapse() {
  state.isPanelCollapsed = !state.isPanelCollapsed;
  const panel = document.getElementById('sidebar-panel');
  const trigger = document.getElementById('expand-trigger');

  if (state.isPanelCollapsed) {
    panel.classList.add('collapsed');
    trigger.classList.add('visible');
  } else {
    panel.classList.remove('collapsed');
    trigger.classList.remove('visible');
  }

  updateTouchActionsUI();
  syncPerformanceSettingsToHash();
}

export function toggleTouchActions() {
  state.touchActionsEnabled = !state.touchActionsEnabled;
  updateTouchActionsUI();
  intercomNotify(state.touchActionsEnabled ? "Touch actions enabled" : "Touch actions disabled");
}

export function toggleUI() {
  const panel = document.getElementById('sidebar-panel');
  const shortcuts = document.getElementById('shortcuts-panel');
  const trigger = document.getElementById('expand-trigger');

  const hidden = isUIHidden();

  if (hidden) {
    panel.classList.remove('collapsed');
    shortcuts.classList.remove('hidden');
    trigger.classList.remove('visible');
    state.isPanelCollapsed = false;
    intercomNotify("Interface shown");
  } else {
    panel.classList.add('collapsed');
    shortcuts.classList.add('hidden');
    trigger.classList.remove('visible');
    state.isPanelCollapsed = true;
    intercomNotify("Interface hidden. Press 'H' to show again.");
  }

  updateTouchActionsUI();
  syncPerformanceSettingsToHash();
}

export function openEditorWithCurrentSketch() {
  let sketchName = '';
  if (state.sketchesList && state.sketchesList[state.currentSketchIndex]) {
    sketchName = state.sketchesList[state.currentSketchIndex].name;
  }
  if (!sketchName) {
    try {
      sketchName = localStorage.getItem('lastSelectedSketchName') || '';
    } catch (e) {}
  }
  const targetUrl = sketchName ? `index.html?sketch=${encodeURIComponent(sketchName)}` : 'index.html';
  window.location.href = targetUrl;
}

export function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      showError(`Error enabling fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

export function handleCloudLogin() {
  if (!window.amakit) {
    showError("Amakit module not loaded");
    return;
  }

  window.amakit.login(true)
    .then(() => {
      intercomNotify("Successfully authenticated with Cloud!");
      updateAuthUI(true);
      loadAllSketches();
    })
    .catch((err) => {
      showError(err || "Login failed");
      updateAuthUI(false);
    });
}

export function updateAuthUI(isAuthenticated) {
  const dot = document.getElementById('cloud-status-dot');
  const btn = document.getElementById('cloud-login-btn');
  if (dot && btn) {
    if (isAuthenticated) {
      dot.classList.add('active');
      dot.title = "Connected to Cloud";
      btn.innerText = "Disconnect";
      btn.onclick = () => {
        localStorage.removeItem("awsCredentials");
        if (window.amakit) window.amakit.isAuthenticated = false;
        updateAuthUI(false);
        intercomNotify("Disconnected from Cloud");
        loadAllSketches();
      };
    } else {
      dot.classList.remove('active');
      dot.title = "Not connected to Cloud";
      btn.innerText = "Login to Cloud";
      btn.onclick = () => handleCloudLogin();
    }
  }
}

export function startVolumeMeter() {
  const audioIndicator = document.getElementById('audio-indicator-dot');
  if (!audioIndicator) return;

  function updateMeter() {
    if (window.a && typeof window.a.vol !== 'undefined') {
      audioIndicator.classList.add('active');
      const vol = window.a.vol;

      if (vol > 0.01) {
        audioIndicator.style.transform = `scale(${1 + vol * 0.15})`;
        audioIndicator.title = `Audio reactive active (Vol: ${vol.toFixed(2)})`;
      } else {
        audioIndicator.style.transform = 'scale(1)';
      }
    } else {
      audioIndicator.classList.remove('active');
    }
    requestAnimationFrame(updateMeter);
  }

  updateMeter();
}
