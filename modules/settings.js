/**
 * Performance State Hash Fragment Settings Module for Hydralisk
 * Encodes/decodes player performance state (BPM, HUD visibility, Automutate mode, Speed)
 * Protocol format: #(<key>[a-z])(<value>[a-z0-9][0-9]*)|(<key>[a-z])(<value>[a-z0-9][0-9]*)
 */

export class PlayerSettings {
  constructor() {
    this.keyMap = {
      b: "bpm",
      h: "hud",
      m: "automutate",
      s: "speed"
    };
    this.reverseKeyMap = {
      bpm: "b",
      hud: "h",
      automutate: "m",
      speed: "s"
    };
  }

  /**
   * Decode URL fragment string into a settings object
   * @param {string} hashStr e.g. "#b120|h1|m4|s10"
   * @returns {object} decoded settings object e.g. { bpm: 120, hud: 1, automutate: '4', speed: 1.0 }
   */
  decode(hashStr = typeof window !== "undefined" ? window.location.hash : "") {
    const settings = {};
    if (!hashStr) return settings;

    let raw = hashStr.startsWith("#") ? hashStr.substring(1) : hashStr;
    if (!raw) return settings;

    const pairs = raw.split("|");

    for (const pair of pairs) {
      if (!pair) continue;
      // Match protocol: key [a-z] followed by value [a-z0-9][0-9]*
      const match = pair.match(/^([a-z])([a-z0-9][0-9]*)$/i);
      if (match) {
        const keyChar = match[1].toLowerCase();
        const rawVal = match[2];
        const settingsKey = this.keyMap[keyChar] || keyChar;

        if (settingsKey === "bpm") {
          const num = parseInt(rawVal, 10);
          if (!isNaN(num)) settings[settingsKey] = num;
        } else if (settingsKey === "hud") {
          settings[settingsKey] = rawVal === "1" ? 1 : 0;
        } else if (settingsKey === "automutate") {
          settings[settingsKey] = rawVal;
        } else if (settingsKey === "speed") {
          const num = parseInt(rawVal, 10);
          if (!isNaN(num)) settings[settingsKey] = num / 10;
        } else {
          settings[settingsKey] = rawVal;
        }
      }
    }

    return settings;
  }

  /**
   * Encode settings object into a URL fragment string
   * @param {object} settings e.g. { bpm: 120, hud: 1, automutate: '4', speed: 1.0 }
   * @returns {string} e.g. "#b120|h1|m4|s10"
   */
  encode(settings = {}) {
    const pairs = [];

    if (typeof settings.bpm === "number" && !isNaN(settings.bpm)) {
      pairs.push(`b${settings.bpm}`);
    }

    if (typeof settings.hud !== "undefined") {
      pairs.push(`h${settings.hud ? 1 : 0}`);
    }

    if (settings.automutate) {
      pairs.push(`m${settings.automutate}`);
    }

    if (typeof settings.speed === "number" && !isNaN(settings.speed)) {
      const speedVal = Math.round(settings.speed * 10);
      pairs.push(`s${speedVal}`);
    }

    return "#" + pairs.join("|");
  }

  /**
   * Update browser location.hash with current settings without reloading/scrolling
   * @param {object} settings
   */
  syncToHash(settings = {}) {
    if (typeof window === "undefined" || !window.history || !window.history.replaceState) return;
    const hash = this.encode(settings);
    const url = new URL(window.location);
    url.hash = hash;
    window.history.replaceState(null, "", url.toString());
  }
}

// Instantiate singleton
export const playerSettings = new PlayerSettings();

if (typeof window !== "undefined") {
  window.playerSettings = playerSettings;

  if (window.HydraliskPlugins) {
    window.HydraliskPlugins.register({
      id: "player-settings",
      name: "Player Performance State Fragment Encoder/Decoder",
      init(app) {
        app.expose("playerSettings", playerSettings);
      }
    });
  }
}
