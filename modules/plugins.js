/**
 * Hydralisk Plugin System
 * Unified module & extension management for Hydralisk.
 */
(function (root) {
  class PluginRegistry {
    constructor() {
      this.plugins = new Map();
      this.state = new Map();
      this.isInitialized = false;
      this.hydraInstance = null;

      // Ambient context object provided to plugins
      this.context = {
        emitter: null,
        state: null,
        hydra: null,
        plugins: this,

        // Ambient variable getters/setters
        get bpm() {
          return root.bpm;
        },
        set bpm(val) {
          root.bpm = val;
        },
        get speed() {
          return root.speed;
        },
        set speed(val) {
          root.speed = val;
        },
        get mySketches() {
          return root.mySketches || [];
        },
        get sketchIdx() {
          return root.sketchIdx || 0;
        },

        // Event shortcuts
        on: (event, handler) => {
          if (this.context.emitter) {
            this.context.emitter.on(event, handler);
          } else if (root.xemitter) {
            root.xemitter.on(event, handler);
          } else {
            console.warn(`[Plugins] emitter not ready when registering listener for ${event}`);
          }
        },
        emit: (event, ...args) => {
          if (this.context.emitter) {
            this.context.emitter.emit(event, ...args);
          } else if (root.xemitter) {
            root.xemitter.emit(event, ...args);
          }
        },

        // State store for plugins
        registerState: (key, initialValue) => {
          if (!this.state.has(key)) {
            this.state.set(key, initialValue);
          }
          return this.state.get(key);
        },
        getState: (key) => this.state.get(key),
        setState: (key, val) => {
          this.state.set(key, val);
          this.context.emit(`state:change:${key}`, val);
        },

        // Convenience helper for publishing symbols/objects to window for sketch availability
        expose: (name, value) => {
          root[name] = value;
        }
      };
    }

    register(plugin) {
      if (!plugin || !plugin.id) {
        console.error("[Plugins] Cannot register invalid plugin", plugin);
        return;
      }
      if (this.plugins.has(plugin.id)) {
        console.warn(`[Plugins] Plugin '${plugin.id}' already registered, overwriting.`);
      }
      this.plugins.set(plugin.id, plugin);
      console.log(`[Plugins] Registered: ${plugin.id} (${plugin.name || plugin.id})`);

      if (typeof plugin.register === "function") {
        try {
          plugin.register(this.context);
        } catch (e) {
          console.error(`[Plugins] Error in register() for '${plugin.id}':`, e);
        }
      }

      // If registered after system init, execute init and onHydraReady hooks immediately
      if (this.isInitialized && typeof plugin.init === "function") {
        try {
          plugin.init(this.context);
        } catch (e) {
          console.error(`[Plugins] Error initializing late plugin '${plugin.id}':`, e);
        }
      }
      if (this.hydraInstance && typeof plugin.onHydraReady === "function") {
        try {
          plugin.onHydraReady(this.hydraInstance, this.context);
        } catch (e) {
          console.error(`[Plugins] Error onHydraReady late plugin '${plugin.id}':`, e);
        }
      }
    }

    get(id) {
      return this.plugins.get(id);
    }

    init(ambientContext = {}) {
      if (ambientContext.emitter) this.context.emitter = ambientContext.emitter;
      if (ambientContext.state) this.context.state = ambientContext.state;
      if (ambientContext.hydra) this.context.hydra = ambientContext.hydra;

      if (!this.context.emitter && root.xemitter) {
        this.context.emitter = root.xemitter;
      }

      this.isInitialized = true;
      console.log("[Plugins] Initializing plugin registry...");

      for (const [id, plugin] of this.plugins.entries()) {
        if (typeof plugin.init === "function") {
          try {
            plugin.init(this.context);
          } catch (e) {
            console.error(`[Plugins] Error initializing '${id}':`, e);
          }
        }
      }
    }

    onHydraReady(hydra) {
      this.hydraInstance = hydra;
      this.context.hydra = hydra;
      console.log("[Plugins] Hydra instance ready, invoking onHydraReady hooks...");

      for (const [id, plugin] of this.plugins.entries()) {
        if (typeof plugin.onHydraReady === "function") {
          try {
            plugin.onHydraReady(hydra, this.context);
          } catch (e) {
            console.error(`[Plugins] Error in onHydraReady for '${id}':`, e);
          }
        }
      }
    }
  }

  root.HydraliskPlugins = new PluginRegistry();
})(typeof window !== "undefined" ? window : globalThis);
