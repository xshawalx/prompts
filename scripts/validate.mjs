import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
const dir=path.resolve('content/prompts');
const files=(await readdir(dir)).filter(x=>x.endsWith('.json'));
const slugs=new Set(); let errors=[];
for(const file of files){
  let p; try{p=JSON.parse(await readFile(path.join(dir,file),'utf8'));}catch(e){errors.push(`${file}: invalid JSON`);continue;}
  for(const key of ['slug','title','description','audience','category','tags','featured','version','updatedAt','prompt']) if(p[key]===undefined) errors.push(`${file}: missing ${key}`);
  if(p.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) errors.push(`${file}: invalid slug`);
  if(slugs.has(p.slug)) errors.push(`${file}: duplicate slug ${p.slug}`); slugs.add(p.slug);
  const fieldKeys=new Set();
  for(const f of p.fields||[]){if(fieldKeys.has(f.key))errors.push(`${file}: duplicate field ${f.key}`);fieldKeys.add(f.key);}
  const placeholders=[...String(p.prompt||'').matchAll(/{{(?!#|\/)([a-zA-Z0-9_]+)}}/g)].map(m=>m[1]);
  for(const k of new Set(placeholders)) if(!fieldKeys.has(k)) errors.push(`${file}: placeholder {{${k}}} has no field definition`);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);} console.log(`Validated ${files.length} production prompt record(s).`);
