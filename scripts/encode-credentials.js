#!/usr/bin/env node
/**
 * Encode AWS credentials for humanized username + password login.
 *
 * Both accessKeyId and secretAccessKey are encrypted with your password.
 * Safe to publish in source—only your password unlocks.
 *
 * Usage:
 *   node scripts/encode-credentials.js
 *
 * Output: JSON blob to paste into amakit.saveEncodedCredentials() or store
 * in source code.
 */

import crypto from "crypto";
import readline from "readline";

const PBKDF2_ITERATIONS = 310000;
const SALT_LEN = 16;
const IV_LEN = 12;
const KEY_LEN = 32;

function encodeCredentials(accessKeyId, secretAccessKey, password, name = "User") {
  const salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);

  const key = crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LEN,
    "sha256"
  );

  const payload = JSON.stringify({ accessKeyId, secretAccessKey });
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(payload, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    encoded: true,
    name,
    credentialsCiphertext: Buffer.concat([encrypted, authTag]).toString("base64"),
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
  };
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("Encode AWS credentials for humanized login.\n");
  console.log("Both accessKeyId and secretAccessKey are encrypted.");
  console.log("Safe to publish in source—only your password unlocks.\n");

  const name = await prompt("Display name (e.g. Alex):\n> ");
  const accessKeyId = await prompt("AWS Access Key ID (AKIA...):\n> ");
  const secretAccessKey = await prompt("AWS Secret Access Key:\n> ");
  const password = await prompt("Password (to decrypt on login):\n> ");

  if (!accessKeyId || !secretAccessKey || !password) {
    console.error("All fields are required.");
    process.exit(1);
  }

  const blob = encodeCredentials(
    accessKeyId,
    secretAccessKey,
    password,
    name || "User"
  );

  console.log("\n--- Encoded credentials (paste into amakit.saveEncodedCredentials or localStorage) ---\n");
  console.log(JSON.stringify(blob, null, 2));
  console.log("\n--- End ---");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
