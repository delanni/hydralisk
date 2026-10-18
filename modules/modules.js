// Barrel file for all Hydralisk modules, plugin registry, and extension plugins

// 1. Initialize Plugin Registry singleton on window
import './plugins.js';

// 2. Import React components and extension plugins
import SketchManager from './sketchManager/index.jsx';
import FeedbackManager from './feedbackModal/index.jsx';
import MasterEffectsManager from './masterEffects/index.jsx';
import ImpromptuMutatorManager from './impromptuMutation/index.jsx';
import './amakit.js';
import './hydrakit.js';
import './midi-mapping.js';
import './hyper-hydra.convolutions.js';
import './three.objects.js';
import './automutate.js';
import './sketchLibrary.js';
import './editorActions.js';
import './hydraliskExtras.js';
import './oblivionGuard.js';
import './settings.js';

window.Modules = {
    SketchManager,
    FeedbackManager,
    MasterEffectsManager,
    ImpromptuMutatorManager
};

if (typeof window !== "undefined" && window.HydraliskPlugins) {
    window.HydraliskPlugins.register({
        id: "sketch-manager",
        name: "React Sketch Manager Modal",
        init(app) {
            if (window.Modules && window.Modules.SketchManager) {
                window.sketchManager = new window.Modules.SketchManager();
                setTimeout(() => window.sketchManager.inject(), 100);
                app.expose("sketchManager", window.sketchManager);
            }
        }
    });

    window.HydraliskPlugins.register({
        id: "impromptu-mutator",
        name: "Impromptu Mutator & MIDI Burst",
        init(app) {
            if (window.Modules && window.Modules.ImpromptuMutatorManager) {
                window.impromptuMutatorManager = new window.Modules.ImpromptuMutatorManager();
                window.impromptuMutatorManager.init(app);
                app.expose("impromptuMutatorManager", window.impromptuMutatorManager);
            }
        }
    });
}
