import {access,readFile,copyFile} from 'node:fs/promises';
await copyFile(new URL('../data/editorial/evidence.json',import.meta.url),new URL('../dist/data/evidence.json',import.meta.url));
for(const file of ['index.html','styles.css','app.js','data/comparison.json','data/history.json','data/evidence.json'])await access(new URL('../dist/'+file,import.meta.url));
const data=JSON.parse(await readFile(new URL('../dist/data/comparison.json',import.meta.url)));
if(data.summary.countryYearRows!==11484)throw new Error('Unexpected data version');
console.log('Static build ready: dist/ (no package downloads or data mutations).');
