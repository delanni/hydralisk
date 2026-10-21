/**
 * MIDI Mapping Module Entry Point (Legacy & Direct Re-export)
 * Delegates to the React-based MidiMappingManager in ./midiMapping/index.jsx
 */

import MidiMappingManager, { midiMappingManager } from './midiMapping/index.jsx';
import { midiMappingService } from './midiMapping/midiMappingService.js';

export default MidiMappingManager;
export { midiMappingManager, midiMappingService };
