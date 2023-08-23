
const fs = require('fs')

const [inputFileName, outputFileName] = process.argv.slice(2);

const sketchesJson = fs.readFileSync(inputFileName||'./sketches.json').toString().trim();
const sketches = JSON.parse(sketchesJson);

const sketchesDeduplicated = Object.values(sketches.reduce((acc, next) => {
    const name = next.name;
    acc[name] = next;
    return acc
}, {}));

const toKeep = ["Alley crystals",
"Zumicubi",
"Burning squares",
"Golyok 2",
"windyred",
"freezenoize",
"zomething else",
"colors and rotating rhombuses",
"Hosszasan valtozo",
"Glitchy Pentagon",
"Fura Fire",
"Random 16122",
"Bubik",
"Feketefeher ugralo akarmi ",
"Szurke pulzalo kaleidoszkop",
"Pszichedelikus kaleidoszkop 1.",
"Kaleidoszkop szines 3",
"Random 19567",
"Deep vortex",
"Random 32883",
"Colorful glitches",
"szinesgeci",
"pumping colorful",
"Midget spinner, CC-vel",
"Pumpin 5",
"LSD tunnel ",
"Shattered world:",
"Random 94354",
"Vadim ",
"Random 63050",
"Fura bines cucc",
"Fraktal",
"Random 63941",
"macska midi",
"rotacats midi",
"piros pokol midi",
"Eye of the nigh 43d midi",
"BKK uleshuzat midi",
"django x pigeon midi",
"Kartyak szines, midi",
"Bubbles midi",
"Eye of the night midi",
"csik midi",
"sargazsolt midi"]

const sketchesFiltered = sketchesDeduplicated.filter(e => toKeep.includes(e.name));

fs.writeFileSync(outputFileName || './sketches_filtered.json', JSON.stringify(sketchesFiltered, null, 2));