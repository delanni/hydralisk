/**
 * Kit for connecting to Amazon DynamoDB
 *
 * Encoded credentials (scripts/encode-credentials.js): both accessKeyId and
 * secretAccessKey encrypted with your password—safe to publish in source.
 */

const PBKDF2_ITERATIONS = 310000;

if (typeof window !== "undefined") {
  window.awsCredentialsEncoded = {
    encoded: true,
    credentialsCiphertext:
      "uWzwhV//QeaoDcds1FvdCCWY6EptwC2pyCqlJDYRBXKIqVriyrx5vUgmvjBbintIAzJQYcAmWAN8VBXGawuYrkJdvIyU221g90kyHZkvtJ5pDqk6RrrxN72NHqAad+KM8f2rOky1Mu5ANL78w0TF3JT5bg==",
    salt: "u9XNXhZ8/WLxr8A1PoBYug==",
    iv: "EnftfLKbFvPBhVLi",
  };
}
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;

const userName = localStorage.getItem("awsCredentials")
  ? JSON.parse(localStorage.getItem("awsCredentials")).name
  : "Unknown";

const metadataDefaults = {
  author: userName,
  midi: false,
  heat: 5,
  tags: [],
};

class Amakit {
  isAuthenticated = false;
  draftCache = [];

  constructor() {
    this.table = "hydralisk-drafts";
    this.AWS = window.AWS;
    if (this.AWS) {
      this.AWS.config.update({ region: "eu-west-1" });
      this.docClient = new this.AWS.DynamoDB.DocumentClient({
        apiVersion: "2012-08-10",
        region: "eu-west-1",
      });
    }
  }

  loadDrafts = async () => {
    try {
      const drafts = await this.getAllDrafts();
      this.draftCache = drafts;
      return drafts;
    } catch (err) {
      console.error("Error loading drafts: ", err);
    }
  };

  getCredentials = () => {
    const fromStorage = JSON.parse(
      localStorage.getItem("awsCredentials") || "null",
    );
    const credentials =
      (typeof window !== "undefined" && window.awsCredentialsEncoded) ||
      fromStorage;
    if (!credentials) return null;
    if (credentials.accessKeyId && credentials.secretAccessKey)
      return credentials;
    if (credentials.encoded && credentials.credentialsCiphertext)
      return credentials;
    return null;
  };

  /**
   * Store pre-encoded credentials blob from scripts/encode-credentials.js.
   * Login will prompt for password to decrypt.
   */
  saveEncodedCredentials = (blob) => {
    if (!blob || !blob.credentialsCiphertext || !blob.salt || !blob.iv) {
      throw new Error("Invalid encoded credentials blob");
    }
    const machineId =
      localStorage.getItem("machineId") ||
      prompt("What is the name of this machine?") ||
      "unknown";
    localStorage.setItem("machineId", machineId);
    const stored = {
      ...blob,
      machineId,
      name: blob.name || "User",
    };
    localStorage.setItem("awsCredentials", JSON.stringify(stored));
    return stored;
  };

  _decryptSecret = async (ciphertextB64, saltB64, ivB64, password) => {
    const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(ciphertextB64), (c) =>
      c.charCodeAt(0),
    );

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"],
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
        tagLength: AUTH_TAG_LEN * 8,
      },
      key,
      ciphertext,
    );

    return new TextDecoder().decode(decrypted);
  };

  saveCredentials = (name, accessKeyId, secretAccessKey) => {
    let machineId =
      localStorage.getItem("machineId") ||
      prompt("What is the name of this machine?") ||
      "unknown";
    localStorage.setItem("machineId", machineId);

    name = name || prompt("What is your name?");
    accessKeyId = accessKeyId || prompt("What is your AWS Access Key ID?");
    secretAccessKey =
      secretAccessKey || prompt("What is your AWS Secret Access Key?");

    const credentials = { name, machineId, accessKeyId, secretAccessKey };
    localStorage.setItem("awsCredentials", JSON.stringify(credentials));

    return credentials;
  };

  login = (doPrompt = true) => {
    let credentials = this.getCredentials();
    // If stored credentials are not the plain key+id shape, drop and re-prompt
    if (credentials && !(credentials.accessKeyId && credentials.secretAccessKey)) {
      localStorage.removeItem("awsCredentials");
      credentials = null;
    }
    if (!credentials) {
      if (!doPrompt) {
        return Promise.reject("No credentials found");
      }
      credentials = this.saveCredentials();
    }

    const applyAndVerify = (accessKeyId, secretAccessKey) => {
      this.AWS.config.update({ accessKeyId, secretAccessKey });
      this.docClient.configure({ credentials: this.AWS.config.credentials });
      return new Promise((resolve, reject) => {
        this.AWS.config.credentials.get((err) => {
          if (err) {
            console.error("Error: ", err);
            if (!credentials.encoded) localStorage.removeItem("awsCredentials");
            reject(err);
          } else {
            this.isAuthenticated = true;
            console.log("Logged in as: ", credentials.name);
            resolve(credentials);
          }
        });
      });
    };

    // TEMPORARILY DISABLED: encoded/password login — falling back to key+id
    // if (credentials.encoded && credentials.credentialsCiphertext) {
    //   const stored = JSON.parse(
    //     localStorage.getItem("awsCredentials") || "null",
    //   );
    //   const defaultPassword = stored?.password || "";
    //   const password =
    //     doPrompt && typeof prompt === "function"
    //       ? prompt("Password (to decrypt credentials):", defaultPassword)
    //       : null;
    //   if (!password)
    //     return Promise.reject("Password required for encoded credentials");
    //
    //   return this._decryptSecret(
    //     credentials.credentialsCiphertext,
    //     credentials.salt,
    //     credentials.iv,
    //     password,
    //   )
    //     .then((json) => {
    //       const { accessKeyId, secretAccessKey } = JSON.parse(json);
    //       return applyAndVerify(accessKeyId, secretAccessKey).then((creds) => {
    //         const toStore = { ...(stored || {}), ...credentials, password };
    //         localStorage.setItem("awsCredentials", JSON.stringify(toStore));
    //         return creds;
    //       });
    //     })
    //     .catch((err) => {
    //       console.error("Decryption failed (wrong password?):", err);
    //       return Promise.reject(err);
    //     });
    // }

    return applyAndVerify(credentials.accessKeyId, credentials.secretAccessKey);
  };

  getDraft = ({ id, name }) => {
    const params = {
      TableName: this.table,
      Key: id ? { id } : { name },
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
  };

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
  };

  processDraftString = (draftString) => {
    let lines = draftString.split("\n");
    let name = "";
    if (lines[0].trim().startsWith("/*") && lines[0].trim().endsWith("*/")) {
      name = this.getCommentValue(lines[0]);
      lines = lines.slice(1);
    } else {
      name = `Random ${Math.floor(Math.random() * 1000)}`;
    }

    let metadata = {};
    try {
      const metadataLine = lines.find((line) =>
        line.trim().startsWith("/* metadata = "),
      );
      metadata = JSON.parse(
        this.getCommentValue(metadataLine).replace("metadata = ", ""),
      );
    } catch (e) {
      console.error("Cannot parse metadata: ", e);
    }
    metadata = {
      ...metadataDefaults,
      ...metadata,
    };

    return {
      name,
      metadata,
      code: lines.join("\n"),
    };
  };

  addDraft = (draftOrString) => {
    let draft = null;

    if (typeof draftOrString === "string") {
      const { name, metadata, code } = this.processDraftString(draftOrString);
      draft = this.shapeDraft({
        name,
        metadata,
        code,
        fullDraft: btoa(draftOrString),
      });
    } else {
      draft = this.shapeDraft(draftOrString);
    }

    const params = {
      TableName: this.table,
      Item: draft,
    };

    return new Promise((resolve, reject) => {
      this.docClient.put(params, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(draft);
        }
      });
    });
  };

  uploadDraftObj = (draft) => {
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
  };

  // Drop by id or name
  dropDraft = ({ id, name }) => {
    const params = {
      TableName: this.table,
      Key: id ? { id } : { name },
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
  };

  generateId = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  getCommentValue = (comment) => {
    const start = comment.indexOf("/*") + 2;
    const end = comment.indexOf("*/");
    return comment.substring(start, end).trim();
  };

  shapeDraft = (draft) => {
    const id = draft.id || this.generateId();
    const name = draft.name || `Random ${Math.floor(Math.random() * 1000)}`;
    const metadata = {
      ...metadataDefaults,
      ...(draft.metadata || {}),
    };
    const code = draft.code.replace(/^\/\* metadata.*$/m, "").trim();
    const fullDraft = btoa(
      `/* ${name} */\n${code}\n/* metadata = ${JSON.stringify(metadata)}*/`,
    );

    return {
      id,
      name,
      metadata,
      fullDraft,
      code,
    };
  };
}

window.amakit = new Amakit();
