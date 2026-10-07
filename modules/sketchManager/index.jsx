// This is a module for sketch management

// React and ReactDOM are globally defined
import './sketchmanager.css';
import SketchStorage from './sketchstorage.js';
import CollectionStorage, { filterSketchesByCollection } from './collectionStorage.js';
import SketchFieldsEditor from './sketchFieldsEditor.jsx';
import MetadataEditor from './metadataEditor.jsx';
import SketchesList from './sketchesList.jsx';
import ImportExportPanel from './importExportPanel.jsx';
import CollectionsPanel from './collectionsPanel.jsx';
import ConfirmModal from './confirmModal.jsx';
import { dialogService } from './dialogService.js';

// --- Main Modal Component ---
class SketchModal extends React.Component {
    constructor(props) {
        super(props);
        this.sketchStorage = props.sketchStorage;
        this.collectionStorage = props.collectionStorage;
        this.state = {
            activeTab: 'This',
            thisSketchMeta: {
                name: "Untitled Sketch",
                description: "Describe your sketch here."
            },
            newField: { key: '', value: '' },
            sketches: [],
            sketchFilter: "",
            sketchTagFilter: "",
            editingSketchIdx: null,
            collectionVersion: 0,
            remoteDraftNames: new Set(),
            targetCollectionId: ''
        };
    }

    handleTargetCollectionChange = (id) => {
        this.setState({ targetCollectionId: id });
    };

    handleAddSketchToTarget = (collectionId, sketchId) => {
        this.collectionStorage.addSketchToCollection(collectionId, sketchId);
        this.handleCollectionChange();
    };

    handleRemoveSketchFromTarget = (collectionId, sketchId) => {
        this.collectionStorage.removeSketchFromCollection(collectionId, sketchId);
        this.handleCollectionChange();
    };

    handleAddFilteredToTarget = (collectionId, sketchIds) => {
        this.collectionStorage.addMultipleSketchesToCollection(collectionId, sketchIds);
        this.handleCollectionChange();
    };

    handleRemoveFilteredFromTarget = (collectionId, sketchIds) => {
        this.collectionStorage.removeMultipleSketchesFromCollection(collectionId, sketchIds);
        this.handleCollectionChange();
    };

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

    componentDidUpdate(prevProps) {
        if (this.props.visible && !prevProps.visible) {
            this.loadRemoteDraftNames();
        }
    }

    loadRemoteDraftNames = () => {
        const amakit = window.amakit;
        if (!amakit) return;
        amakit.loadDrafts()
            .then((drafts) => {
                const names = new Set((drafts || amakit.draftCache || []).map((d) => d.name));
                this.setState({ remoteDraftNames: names });
            })
            .catch(() => {
                const names = new Set((amakit.draftCache || []).map((d) => d.name));
                this.setState({ remoteDraftNames: names });
            });
    };

    handleDeleteSketch = async (name) => {
        const confirmed = await dialogService.confirm({
            title: 'Delete Sketch',
            message: `Are you sure you want to delete "${name}"?`,
            confirmText: 'Delete',
            isDanger: true
        });
        if (confirmed) {
            this.sketchStorage.deleteSketchByName(name);
            const sketches = this.sketchStorage.getSketches();
            this.setState({ sketches });
            this.props.onApplyCollection?.();
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

    handleUploadSketch = (sketch) => {
        const amakit = window.amakit;
        if (!amakit?.isAuthenticated) {
            window.xemitter?.emit('remote:login');
            return;
        }
        amakit.addDraft(sketch)
            .then(() => {
                this.loadRemoteDraftNames();
            })
            .catch((err) => console.error('Upload failed:', err));
    };

    handleUploadThisSketch = () => {
        const { thisSketchMeta } = this.state;
        const amakit = window.amakit;
        if (!amakit?.isAuthenticated) {
            window.xemitter?.emit('remote:login');
            return;
        }
        amakit.addDraft(thisSketchMeta)
            .then(() => {
                this.loadRemoteDraftNames();
            })
            .catch((err) => console.error('Upload failed:', err));
    };

    renderTabs() {
        const tabs = ['This', 'Sketches', 'Setlists', 'Import/Export'];
        return (
            <div className="modal-tabs">
                {tabs.map((tab) => {
                    const isActive = this.state.activeTab === tab || (tab === 'Setlists' && this.state.activeTab === 'Collections');
                    return (
                        <button
                            key={tab}
                            className={isActive ? 'active' : ''}
                            onClick={() => this.setTab(tab)}
                        >
                            {tab}
                        </button>
                    );
                })}
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
                    <span style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                        <button onClick={this.handleSaveSketch} className="save-sketch-btn">
                            Save
                        </button>
                        <button onClick={this.handleUploadThisSketch} className="save-sketch-btn">
                            Upload
                        </button>
                    </span>
                )}
            </div>
        );
    }

    renderSketchesList() {
        const { collections } = this.collectionStorage ? this.collectionStorage.getCollections() : { collections: [] };
        const activeTarget = this.state.targetCollectionId || (collections[0]?.id || '');

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
                onClick: async () => {
                    const confirmed = await dialogService.confirm({
                        title: 'Clear Local Storage',
                        message: 'Are you sure you want to clear all local sketches? This action cannot be undone.',
                        confirmText: 'Clear All',
                        isDanger: true
                    });
                    if (confirmed) {
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
                collections={collections}
                targetCollectionId={activeTarget}
                onTargetCollectionChange={this.handleTargetCollectionChange}
                onAddSketchToTarget={this.handleAddSketchToTarget}
                onRemoveSketchFromTarget={this.handleRemoveSketchFromTarget}
                onAddFilteredToTarget={this.handleAddFilteredToTarget}
                onRemoveFilteredFromTarget={this.handleRemoveFilteredFromTarget}
                filter={this.state.sketchFilter}
                tagFilter={this.state.sketchTagFilter}
                remoteDraftNames={this.state.remoteDraftNames}
                onFilterChange={this.handleSketchFilterChange}
                onTagFilterChange={this.handleTagFilterChange}
                onEdit={this.handleEditSketch}
                onDelete={this.handleDeleteSketch}
                onUpload={this.handleUploadSketch}
                onRowClick={(sketchInfo) => {
                    window.xemitter.emit('gallery:updateLocalSketches', this.state.sketches);
                    window.xemitter.emit('gallery:loadSketch', sketchInfo);
                }}
                actions={actions}
            />
        );
    }

    renderImportExport() {
        return <ImportExportPanel />;
    }

    handleCollectionChange = () => {
        this.props.onApplyCollection?.();
        this.setState((s) => ({ collectionVersion: (s.collectionVersion || 0) + 1 }));
    };

    renderCollectionsPanel() {
        if (!this.collectionStorage) return null;
        const { activeId } = this.collectionStorage.getCollections();
        return (
            <CollectionsPanel
                collectionStorage={this.collectionStorage}
                sketches={this.state.sketches}
                activeId={activeId}
                onActiveChange={this.handleCollectionChange}
                onCollectionsChange={this.handleCollectionChange}
                onLoadSketch={(sketch) => {
                    window.xemitter.emit('gallery:loadSketch', sketch);
                }}
            />
        );
    }

    renderTabContent() {
        switch (this.state.activeTab) {
            case 'This':
                return this.renderJsonEditor();
            case 'Sketches':
                return this.renderSketchesList();
            case 'Collections':
            case 'Setlists':
                return this.renderCollectionsPanel();
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
class DialogHost extends React.Component {
    constructor(props) {
        super(props);
        this.state = { dialogConfig: null };
    }

    componentDidMount() {
        this.unsubscribe = dialogService.subscribe((config) => {
            this.setState({ dialogConfig: config });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribe) this.unsubscribe();
    }

    handleConfirm = (val) => {
        const resolve = this.state.dialogConfig?.resolve;
        this.setState({ dialogConfig: null });
        if (resolve) resolve(val);
    };

    handleCancel = () => {
        const resolve = this.state.dialogConfig?.resolve;
        this.setState({ dialogConfig: null });
        if (resolve) resolve(false);
    };

    render() {
        const { dialogConfig } = this.state;
        if (!dialogConfig || !dialogConfig.isOpen) return null;

        return (
            <ConfirmModal
                isOpen={dialogConfig.isOpen}
                title={dialogConfig.title}
                message={dialogConfig.message}
                confirmText={dialogConfig.confirmText}
                cancelText={dialogConfig.cancelText}
                isDanger={dialogConfig.isDanger}
                hasInput={dialogConfig.hasInput}
                defaultValue={dialogConfig.defaultValue}
                placeholder={dialogConfig.placeholder}
                onConfirm={this.handleConfirm}
                onCancel={this.handleCancel}
            />
        );
    }
}

class SketchApp extends React.Component {
    constructor(props) {
        super(props);
        this.sketchStorage = new SketchStorage(window.localStorage);
        this.collectionStorage = new CollectionStorage(window.localStorage);
        this.state = { isModalVisible: false };
    }

    applyCollectionFilter = () => {
        const sketches = this.sketchStorage.getSketches();
        const active = this.collectionStorage.getActiveCollection();
        const filtered = active
            ? filterSketchesByCollection(sketches, active.sketchIds)
            : sketches;
        if (window.xemitter) {
            window.xemitter.emit('gallery:updateLocalSketches', filtered);
        }
    };

    toggleModal = () => {
        this.setState((prevState) => ({
            isModalVisible: !prevState.isModalVisible,
        }));
    };

    componentDidMount() {
        this.applyCollectionFilter();
    }

    render() {
        return (
            <div>
                <SketchModal
                    sketchStorage={this.sketchStorage}
                    collectionStorage={this.collectionStorage}
                    visible={this.state.isModalVisible}
                    onClose={this.toggleModal}
                    onApplyCollection={this.applyCollectionFilter}
                />
                <DialogHost />
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