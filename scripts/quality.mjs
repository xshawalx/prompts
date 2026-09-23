import {readFile} from 'node:fs/promises';
import path from 'node:path';

const ROOT=path.resolve('.');
const files=[
  'scripts/build.mjs',
  'assets/js/library.js',
  'assets/js/prompt.js'
];

const suspicious=[
  '\\u00c2',
  '\\u00e2',
  '\\ufffd'
].map(s=>JSON.parse('"'+s+'"'));

const errors=[];
for(const file of files){
  const text=await readFile(path.join(ROOT,file),'utf8');
  for(const token of suspicious){
    if(text.includes(token)) errors.push(file+' contains suspicious encoding character U+'+token.codePointAt(0).toString(16).toUpperCase());
  }
}

if(errors.length){
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Encoding quality check passed.');
