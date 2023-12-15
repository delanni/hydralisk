#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/*
This script compiles individual sketch files from the sketches folder to a single sketches.json file.
 */

async function main() {
  const sketches = [];
  const sketchesFolder = path.join(__dirname, "../sketches");
  const sketchesJsonPath = path.join(__dirname, "../sketches.json");
  const sketchesFiles = fs.readdirSync(sketchesFolder);

  for (let sketchFile of sketchesFiles) {
    const sketchFilePath = path.join(sketchesFolder, sketchFile);
    const sketchFileContent = fs.readFileSync(sketchFilePath, "utf8");
    const sketchFileLines = sketchFileContent.split("\n");
    const sketchName = sketchFileLines[0]
      .replace("/*", "")
      .replace("*/", "")
      .trim();
    const sketchCode = sketchFileLines.slice(1, -1).join("\n");

    let sketchMetaData = {};
    try {
      sketchMetadata = JSON.parse(
        sketchFileLines[sketchFileLines.length - 1].replace("metadata = ", "")
      );
    } catch (err) {
      sketchMetaData = {
        bpm: sketchCode.match(/bpm\s*=(\d+)/)?.[1] || 120,
        midi: !!(sketchCode.match(/cc\[/) || sketchCode.match(/midi\(/)),
      };
    }
    sketches.push({
      name: sketchName,
      type: "code",
      code: sketchFileContent,
      index: sketchMetadata.index ?? 10000 + sketches.length,
      bpm: sketchMetadata.bpm,
      midi: sketchMetadata.midi,
      local: false,
      heat: sketchMetadata.heat || 0,
      author: sketchMetadata.author || "Anony Mouse",
    });
    sketches.sort((a, b) => a.index - b.index);

    // reindex, to drop sparses and fit extras:
    for (let i = 0; i < sketches.length; i++) {
      sketches[i].index = i;
    }
  }

  fs.writeFileSync(sketchesJsonPath, JSON.stringify(sketches, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
