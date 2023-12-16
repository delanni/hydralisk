#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/*
This script deconstructs the sketches.json file into individual sketch files.
Individual files can be edited locally, deleted, or even created, then they can be re-combined into a new sketches.json
 file with the `compile.js` script.
*/

async function main() {
  const sketches = await fs.promises.readFile(
    path.join(__dirname, "../sketches.json"),
    "utf-8"
  );
  const sketchesArray = JSON.parse(sketches);

  const sketchesDir = path.join(__dirname, "../sketches");
  await fs.promises.mkdir(sketchesDir, { recursive: true });

  for (let i = 0; i < sketchesArray.length; i++) {
    const sketch = sketchesArray[i];
    const name = (sketch.name || 'Random ' + ((Math.random() * 100000)|0)).trim();
    const fileName = name.replace(/[^a-z0-9]/gi, "_");

    let code = sketch.code;
    if (!code) {
      // it's urlencoded then base64 encoded in the URL:
      const match = sketch.url.match(/code=([^&]+)/);
      if (match) {
        code = decodeURIComponent(match[1]);
        code = Buffer.from(code, "base64").toString("utf-8");
        code = decodeURIComponent(code);
      } else {
        console.warn("no code for", sketch.url);
      }
    }
    
    const metadata = {
      index: i,
      type: "code",
      bpm: sketch.bpm || 0,
      midi: sketch.midi || !!(code && (code.match(/cc\[/) || code.match(/midi\(/))),
      local: sketch.local,
      heat: sketch.heat || 5,
      author: sketch.author || "Anony Mouse",
    };

    const sketchFile = `/* ${name} */
${code}

/* metadata = ${JSON.stringify(metadata)} */`;

    fs.writeFileSync(path.join(sketchesDir, `${fileName}.js`), sketchFile);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
