#!/usr/bin/env node

process.exit(0);

const fs = require('fs');
const cp = require('child_process');

const lines = fs.readFileSync('version.js').toString().split('\n');

const changedFiles = cp.execSync('git status --porcelain').toString().split('\n').filter(Boolean);

if (changedFiles.length >= 1) {
  console.warn("There are uncommitted changes, please commit/stash them before pushing");
  process.exit(1);
}

if (lines[0].startsWith('/* generated */')) {
  const lastCommitMessage = cp.execSync('git log -1 --pretty=%B').toString().trim();
  const versionJSON = lines[0].split('const version = ')[1];
  const version = JSON.parse(versionJSON);
  if (version.commit === lastCommitMessage) {
    console.log("version.js is up to date");
    process.exit(0);
  }

  lines[0] = `/* generated */ const version = { "date": "${new Date().toISOString()}", "commit": "${lastCommitMessage}" }`;
  fs.writeFileSync('version.js', lines.join('\n'));
  // amend the commit
  cp.execSync('git add version.js');
  cp.execSync('git commit --amend --no-verify -C HEAD');
  console.log("Updated version.js");
} else {
  console.warn("version.js doesn't look not generated, review the pre-push script or the version.js file");
}

process.exit(0);