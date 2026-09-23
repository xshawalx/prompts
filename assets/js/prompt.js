const DATA = JSON.parse(document.querySelector('#prompt-data')?.textContent || '{}');
const STORAGE_PREFIX='xshawalx-prompt:';
const TTL=7*24*60*60*1000;
const values={};
const errors={};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function analytics(eventName){
  window.dispatchEvent(new CustomEvent('xshawalx:analytics',{detail:{event:eventName,slug:DATA.slug}}));
  if (window.xshawalxAnalytics?.track) window.xshawalxAnalytics.track(eventName,{slug:DATA.slug});
}
function storageKey(){return STORAGE_PREFIX+DATA.slug;}
function loadSaved(){
  try{const raw=localStorage.getItem(storageKey()); if(!raw)return; const saved=JSON.parse(raw); if(Date.now()-saved.savedAt>TTL){localStorage.removeItem(storageKey());return;} Object.assign(values,saved.values||{});}catch{}
}
function save(){try{localStorage.setItem(storageKey(),JSON.stringify({savedAt:Date.now(),values}));}catch{}}
function defaultFor(f){if(values[f.key]!==undefined)return values[f.key]; if(f.default!==undefined)return f.default; return f.type==='checkbox'?false:f.type==='multi-select'?[]:'';}
function inputFor(f){
  const id=`field-${f.key}`; const val=defaultFor(f); const req=f.required||f.type==='required-text';
  const attrs=`id="${id}" data-key="${esc(f.key)}" ${req?'aria-required="true"':''}`;
  if(f.type==='textarea') return `<textarea ${attrs} rows="4" placeholder="${esc(f.placeholder||'')}">${esc(val)}</textarea>`;
  if(f.type==='dropdown') return `<select ${attrs}><option value="">Select</option>${(f.options||[]).map(o=>`<option value="${esc(o)}" ${val===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
  if(f.type==='multi-select') return `<div class="choice-grid">${(f.options||[]).map((o,i)=>`<label class="choice"><input type="checkbox" data-multi-key="${esc(f.key)}" value="${esc(o)}" ${(Array.isArray(val)&&val.includes(o))?'checked':''}> <span>${esc(o)}</span></label>`).join('')}</div>`;
  if(f.type==='radio') return `<div class="choice-grid">${(f.options||[]).map((o,i)=>`<label class="choice"><input type="radio" name="${esc(f.key)}" data-radio-key="${esc(f.key)}" value="${esc(o)}" ${val===o?'checked':''}> <span>${esc(o)}</span></label>`).join('')}</div>`;
  if(f.type==='checkbox') return `<label class="choice"><input type="checkbox" ${attrs} ${val?'checked':''}> <span>${esc(f.help||f.label)}</span></label>`;
  const typeMap={number:'number',date:'date',range:'range',url:'url'}; const type=typeMap[f.type]||'text';
  return `<input class="input" type="${type}" ${attrs} value="${esc(val)}" placeholder="${esc(f.placeholder||'')}" ${f.min!==undefined?`min="${f.min}"`:''} ${f.max!==undefined?`max="${f.max}"`:''} ${f.step!==undefined?`step="${f.step}"`:''}>`;
}
function renderForm(){
  const root=document.querySelector('#form-grid'); if(!root)return;
  if(!DATA.fields?.length){root.innerHTML='<p class="support-copy">This prompt is ready to use as-is. No customization required.</p>'; return;}
  root.innerHTML=DATA.fields.map(f=>{
    const required=f.required||f.type==='required-text';
    const help=f.help&&f.type!=='checkbox'?`<p class="field-help">${esc(f.help)}</p>`:'';
    const error=`<p class="field-error" id="error-${esc(f.key)}" aria-live="polite"></p>`;
    if(f.type==='multi-select'||f.type==='radio') return `<fieldset class="field" data-field="${esc(f.key)}"><legend>${esc(f.label)}${required?' *':''}</legend>${inputFor(f)}${help}${error}</fieldset>`;
    if(f.type==='checkbox') return `<div class="field" data-field="${esc(f.key)}">${inputFor(f)}${error}</div>`;
    return `<div class="field" data-field="${esc(f.key)}"><label for="field-${esc(f.key)}">${esc(f.label)}${required?' *':''}</label>${inputFor(f)}${help}${error}</div>`;
  }).join('');
  bindInputs();
}
function bindInputs(){
  document.querySelectorAll('[data-key]').forEach(el=>el.addEventListener('input',()=>{
    values[el.dataset.key]=el.type==='checkbox'?el.checked:el.value; save(); update();
  }));
  document.querySelectorAll('[data-multi-key]').forEach(el=>el.addEventListener('change',()=>{
    const k=el.dataset.multiKey; values[k]=[...document.querySelectorAll(`[data-multi-key="${CSS.escape(k)}"]:checked`)].map(x=>x.value); save(); update();
  }));
  document.querySelectorAll('[data-radio-key]').forEach(el=>el.addEventListener('change',()=>{values[el.dataset.radioKey]=el.value; save(); update();}));
}
function currentValue(f){
  const v=values[f.key]!==undefined?values[f.key]:defaultFor(f);
  if(Array.isArray(v)) return v.join(', ');
  if(typeof v==='boolean') return v?'Yes':'No';
  const text=String(v??'').trim();
  if(!text && (f.required||f.type==='required-text')) return `[Enter ${f.label.toLowerCase()}]`;
  return text;
}
function rawValue(f){
  return values[f.key]!==undefined?values[f.key]:defaultFor(f);
}

function validate(){
  let ok=true;
  for(const f of DATA.fields||[]){
    const required=f.required||f.type==='required-text'; const v=rawValue(f);
    const empty=Array.isArray(v)?v.length===0:(typeof v==='boolean'?false:String(v??'').trim()==='');
    errors[f.key]=required&&empty?`Enter ${f.label.toLowerCase()}.`:'';
    const target=document.querySelector(`#error-${CSS.escape(f.key)}`); if(target) target.textContent=errors[f.key];
    if(errors[f.key]) ok=false;
  }
  return ok;
}
function compile(){
  let out=String(DATA.prompt||'');
  out=out.replace(/{{#if\s+([a-zA-Z0-9_]+)}}([\s\S]*?){{\/if}}/g,(m,key,body)=>{
    const f=(DATA.fields||[]).find(x=>x.key===key); const v=f?currentValue(f):''; return v?body.replaceAll(`{{${key}}}`,v):'';
  });
  for(const f of DATA.fields||[]) out=out.replaceAll(`{{${f.key}}}`,currentValue(f));
  return out.replace(/\n{3,}/g,'\n\n').trim();
}
function update(){validate(); const p=document.querySelector('#prompt-preview'); if(p)p.textContent=compile();}
async function copyText(text){
  try{await navigator.clipboard.writeText(text);return true;}catch{}
  const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.focus(); ta.select(); const ok=document.execCommand('copy'); ta.remove(); return ok;
}
function toast(msg){const t=document.querySelector('#toast'); if(!t)return; t.textContent=msg; t.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.classList.remove('show'),1500);}
async function onCopy(){if(!validate()){document.querySelector('.field-error:not(:empty)')?.scrollIntoView({behavior:'smooth',block:'center'});return;} if(await copyText(compile())){toast('Copied ✓'); analytics('prompt_copy');}}
async function onShare(){
  const share={title:DATA.title,text:DATA.description,url:location.href};
  if(navigator.share){try{await navigator.share(share);analytics('share_prompt');return;}catch(e){if(e.name==='AbortError')return;}}
  if(await copyText(location.href)){toast('Link copied ✓'); analytics('share_prompt');}
}
function reset(){for(const k of Object.keys(values))delete values[k]; localStorage.removeItem(storageKey()); renderForm(); update(); toast('Reset');}
loadSaved(); renderForm(); update(); analytics('prompt_view');
document.querySelector('#copy-prompt')?.addEventListener('click',onCopy);
document.querySelector('#share-prompt')?.addEventListener('click',onShare);
document.querySelector('#reset-prompt')?.addEventListener('click',reset);
document.querySelector('#open-chatgpt')?.addEventListener('click',()=>analytics('open_chatgpt'));
