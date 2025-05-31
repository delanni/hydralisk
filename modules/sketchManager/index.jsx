// This is a module for sketch management

// React and ReactDOM are globally defined
import './sketchManager.css';
import SketchStorage from './sketchstorage.js';
import SketchFieldsEditor from './sketchFieldsEditor.jsx';
import MetadataEditor from './metadataEditor.jsx';
import SketchesList from './sketchesList.jsx';
import ImportExportPanel from './importExportPanel.jsx';

// --- Main Modal Component ---
class SketchModal extends React.Component {
    constructor(props) {
        super(props);
        this.sketchStorage = props.sketchStorage;
        this.state = {
            activeTab: 'This',
            thisSketchMeta: {
                name: "Untitled Sketch",
                description: "Describe your sketch here."
            },
            newField: { key: '', value: '' },
            sketches: [],
            sketchFilter: "",
            sketchTagFilter: "", // <-- add tag filter state
            editingSketchIdx: null
        };
    }

    setTab = (tab) => {
        this.setState({ activeTab: tab });
    };

    handleFieldChange = (key, value) => {
        this.setState(prevState => ({
            thisSketchMeta: {
                ...prevState.thisSketchMeta,
                [key]: value
            }
        }));
    };

    handleMetadataFieldChange = (key, value) => {
        const parseInput = (input) => {
            try {
                return JSON.parse(input);
            } catch {
                return input;
            }
        };
        const metadata = typeof this.state.thisSketchMeta.metadata === "object" && this.state.thisSketchMeta.metadata !== null
            ? this.state.thisSketchMeta.metadata
            : {};
        this.setState(prevState => ({
            thisSketchMeta: {
                ...prevState.thisSketchMeta,
                metadata: {
                    ...metadata,
                    [key]: parseInput(value)
                }
            }
        }));
    };

    handleRemoveMetadataField = (key) => {
        const metadata = typeof this.state.thisSketchMeta.metadata === "object" && this.state.thisSketchMeta.metadata !== null
            ? this.state.thisSketchMeta.metadata
            : {};
        const updated = { ...metadata };
        delete updated[key];
        this.setState(prevState => ({
            thisSketchMeta: {
                ...prevState.thisSketchMeta,
                metadata: updated
            }
        }));
    };

    handleNewFieldChange = (e) => {
        const { name, value } = e.target;
        this.setState(prevState => ({
            newField: { ...prevState.newField, [name]: value }
        }));
    };

    handleAddMetadataField = () => {
        const { key, value } = this.state.newField;
        const metadata = typeof this.state.thisSketchMeta.metadata === "object" && this.state.thisSketchMeta.metadata !== null
            ? this.state.thisSketchMeta.metadata
            : {};
        if (!key || metadata.hasOwnProperty(key)) return;
        const parseInput = (input) => {
            try {
                return JSON.parse(input);
            } catch {
                return input;
            }
        };
        this.setState(prevState => ({
            thisSketchMeta: {
                ...prevState.thisSketchMeta,
                metadata: {
                    ...metadata,
                    [key]: parseInput(value)
                }
            },
            newField: { key: '', value: '' }
        }));
    };

    handleSketchFilterChange = (e) => {
        this.setState({ sketchFilter: e.target.value });
    };

    handleTagFilterChange = (e) => {
        this.setState({ sketchTagFilter: e.target.value });
    };

    componentDidMount() {
        // Load sketches from storage on mount
        this.setState({
            sketches: this.sketchStorage.getSketches()
        });
    }

    handleDeleteSketch = (name) => {
        if (window.confirm(`Delete "${name}"?`)) {
            this.sketchStorage.deleteSketchByName(name);
            const sketches = this.sketchStorage.getSketches();
            this.setState({
                sketches,
            });
            window.xemitter.emit('gallery:updateLocalSketches', sketches);
        }
    };

    handleEditSketch = (name, idx) => {
        const sketch = this.state.sketches.find(s => s.name === name);
        // Load the sketch's metadata into the editor
        this.setState({
            thisSketchMeta: { ...sketch },
            editingSketchIdx: idx,
            activeTab: 'This'
        });
        window.xemitter.emit('gallery:loadSketch', sketch);
    };

    handleSaveSketch = () => {
        const { editingSketchIdx, thisSketchMeta, sketches } = this.state;
        if (editingSketchIdx == null) return;
        // Update the sketch in the array and localStorage
        const updatedSketches = [...sketches];
        updatedSketches[editingSketchIdx] = {
            ...updatedSketches[editingSketchIdx],
            ...thisSketchMeta
        };
        this.sketchStorage.localStorage.setItem(
            this.sketchStorage.storageKey,
            JSON.stringify(updatedSketches)
        );
        this.setState({
            sketches: updatedSketches
        });
    };

    handleKeepFiltered = (filteredSketches) => {
        // only update the sketches set locally
        window.xemitter.emit('gallery:updateLocalSketches', filteredSketches);
    };

    renderTabs() {
        const tabs = ['This', 'Sketches', 'Import/Export'];
        return (
            <div className="modal-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        className={this.state.activeTab === tab ? 'active' : ''}
                        onClick={() => this.setTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        );
    }

    renderJsonEditor() {
        const { thisSketchMeta, newField, editingSketchIdx } = this.state;
        const fixedFields = [
            "name",
            "code",
            "fullDraft",
            "id",
            "local"
        ];
        const metadata = typeof thisSketchMeta.metadata === "object" && thisSketchMeta.metadata !== null
            ? thisSketchMeta.metadata
            : {};

        return (
            <div>
                <SketchFieldsEditor
                    fields={fixedFields}
                    values={thisSketchMeta}
                    onChange={this.handleFieldChange}
                />
                <MetadataEditor
                    metadata={metadata}
                    newField={newField}
                    onFieldChange={this.handleMetadataFieldChange}
                    onRemove={this.handleRemoveMetadataField}
                    onNewFieldChange={this.handleNewFieldChange}
                    onAddField={this.handleAddMetadataField}
                />
                {editingSketchIdx !== null && (
                    <button onClick={this.handleSaveSketch} className="save-sketch-btn">
                        Save
                    </button>
                )}
            </div>
        );
    }

    renderSketchesList() {
        const actions = [
            {
                label: "Keep these",
                onClick: (filtered, isFiltering) => {
                    this.handleKeepFiltered(filtered);
                },
                disabled: (filtered, isFiltering) => filtered.length === 0
            },
            {
                label: "Clear all local!",
                onClick: () => {
                    if (window.confirm("Are you sure you want to clear all local sketches? This cannot be undone.")) {
                        this.sketchStorage.deleteAll();
                        this.setState({ sketches: [] });
                        window.xemitter.emit('gallery:updateLocalSketches', []);
                    }
                }
            }
        ];
        return (
            <SketchesList
                sketches={this.state.sketches}
                filter={this.state.sketchFilter}
                tagFilter={this.state.sketchTagFilter}
                onFilterChange={this.handleSketchFilterChange}
                onTagFilterChange={this.handleTagFilterChange}
                onEdit={this.handleEditSketch}
                onDelete={this.handleDeleteSketch}
                onRowClick={(sketchInfo) => {
                    window.xemitter.emit('gallery:loadSketch', sketchInfo);
                }}
                actions={actions}
            />
        );
    }

    renderImportExport() {
        return <ImportExportPanel />;
    }

    renderTabContent() {
        switch (this.state.activeTab) {
            case 'This':
                return this.renderJsonEditor();
            case 'Sketches':
                return this.renderSketchesList();
            case 'Import/Export':
                return this.renderImportExport();
            default:
                return null;
        }
    }

    render() {
        if (!this.props.visible) {
            return null;
        }

        return (
            <div id="sketchman-popup" className="modal">
                <div className="modal-content">
                    <div className="modal-header">
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                            <h5 style={{ margin: 0 }}>Sketch Manager</h5>
                            <span className="close-button" onClick={this.props.onClose}>&times;</span>
                        </div>
                    </div>
                    {this.renderTabs()}
                    <div className="modal-body">
                        {this.renderTabContent()}
                    </div>
                </div>
            </div>
        );
    }
}

// Main App Component
class SketchApp extends React.Component {
    constructor(props) {
        super(props);
        this.sketchStorage = new SketchStorage(window.localStorage);
        this.state = { isModalVisible: false };
    }

    toggleModal = () => {
        // if (this.state.isModalVisible) {
        //     window.xemitter.emit('gallery:updateLocalSketches', this.sketchStorage.getSketches());
        // }
        this.setState((prevState) => ({
            isModalVisible: !prevState.isModalVisible,
        }));
    };

    render() {
        return (
            <div>
                <SketchModal
                    sketchStorage={this.sketchStorage}
                    visible={this.state.isModalVisible}
                    onClose={this.toggleModal}
                />
            </div>
        );
    }
}

export default class SketchManager {
    constructor(appInstance) {
        this.appInstance = appInstance;
    }

    inject() {
        let appContainer = document.getElementById("sketchman-app");

        if (!appContainer) {
            const body = document.body;
            const host = document.createElement('div');
            host.id = 'sketchman-app';
            body.appendChild(host);
            appContainer = host;
        }

        const appInstance = ReactDOM.render(<SketchApp />, appContainer);
        this.appInstance = appInstance;
        this.appContainer = appContainer;
    }

    togglePopup() {
        if (this.appInstance) {
            this.appInstance.toggleModal();
        } else {
            console.error("SketchManager is not initialized with an app instance");
        }
    }
}