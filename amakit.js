/**
 * Kit for connecting to Amazon DynamoDB
 */

class Amakit {
    constructor() {
        this.table = "hydralisk-drafts";
        this.AWS = window.AWS;
        this.AWS.config.update({ region: 'eu-west-1' });
        this.docClient = new this.AWS.DynamoDB.DocumentClient({
            apiVersion: '2012-08-10',
            region: 'eu-west-1'
        });
    }

    getCredentials = () => {
        const credentials = JSON.parse(localStorage.getItem("awsCredentials") || "null");
        return credentials;
    }

    saveCredentials = (name, accessKeyId, secretAccessKey) => {
        let machineId = localStorage.getItem("machineId") || prompt("What is the name of this machine?") || "unknown";
        localStorage.setItem("machineId", machineId);

        name = name || prompt("What is your name?");
        accessKeyId = accessKeyId || prompt("What is your AWS Access Key ID?");
        secretAccessKey = secretAccessKey || prompt("What is your AWS Secret Access Key?");

        const credentials = { name, machineId, accessKeyId, secretAccessKey };
        localStorage.setItem("awsCredentials", JSON.stringify(credentials));
    }

    login = () => {
        if (!this.getCredentials()) {
            this.saveCredentials();
        }

        const credentials = this.getCredentials();
        this.AWS.config.update({
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey
        });
        this.docClient.configure({
            credentials: this.AWS.config.credentials
        }); 

        // Try the credentials, authenticate
        return new Promise((resolve, reject) => {
            this.AWS.config.credentials.get((err) => {
                if (err) {
                    console.error("Error: ", err);
                    reject(err);
                } else {
                    console.log("Logged in as: ", credentials.name);
                    resolve(credentials);
                }
            });
        });
    }

    getDraft = ({ id, name }) => {
        const params = {
            TableName: this.table,
            Key: id ? { id } : { name }
        };
        return new Promise((resolve, reject) => {
            this.docClient.get(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data.Item);
                }
            });
        });
    }

    getAllDrafts = () => {
        const params = { TableName: this.table };
        return new Promise((resolve, reject) => {
            this.docClient.scan(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    this.allDrafts = data.Items;
                    resolve(data.Items);
                }
            });
        });
    }

    processDraftString = (draftString) => {
        let lines = draftString.split('\n');
        let name = '';
        if (lines[0].trim().startsWith('/*') && lines[0].trim().endsWith('*/')) {
            name = this.getCommentValue(lines[0]);
            lines = lines.slice(1);
        } else {
            name = `Random ${Math.floor(Math.random() * 1000)}`;
        }

        const metadataDefaults = {
            "author": "Unknown",
            "date": new Date().toISOString(),
            "index": -1,
            "type": "code",
            "bpm": 120,
            "midi": false,
            "local": false,
            "heat": 5,
            "tags": []
        }
        let metadata = {};
        try {
            if (lines[lines.length - 1].trim().startsWith('/*') && lines[lines.length - 1].trim().endsWith('*/')) {
                metadata = JSON.parse(this.getCommentValue(lines[lines.length - 1]));
                lines = lines.slice(0, lines.length - 1);
            }
        } catch (e) {
            console.error("Cannot parse metadata: ", e);
        }
        metadata = {
            ...metadataDefaults,
            ...metadata
        }

        return {
            name,
            metadata,
            code: lines.join('\n')
        }
    }

    addDraft = (draftString) => {
        const { name, metadata, code } = this.processDraftString(draftString);
        const draft = {
            id: this.generateId(),
            name,
            code,
            fullDraft: btoa(draftString),
            metadata
        };

        const params = {
            TableName: this.table,
            Item: draft,
        };

        return new Promise((resolve, reject) => {
            this.docClient.put(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    // Drop by id or name
    dropDraft = ({ id, name }) => {
        const params = {
            TableName:
                this.table,
            Key: id ? { id } : { name }
        };
        return new Promise((resolve, reject) => {
            this.docClient.delete(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    generateId = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.floor(Math.random() * 16);
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getCommentValue = (comment) => {
        const start = comment.indexOf('/*') + 2;
        const end = comment.indexOf('*/');
        return comment.substring(start, end).trim();
    }
}

window.amakit = new Amakit();

