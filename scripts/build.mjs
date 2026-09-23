import {mkdir,readdir,readFile,writeFile,cp,rm} from 'node:fs/promises';
import path from 'node:path';

const ROOT=path.resolve('.'), OUT=path.join(ROOT,'dist'), BASE='https://xshawalx.github.io/prompts/';
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const jsonSafe=o=>JSON.stringify(o).replace(/</g,'\\u003c');
const fmt=d=>new Intl.DateTimeFormat('en',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${d}T00:00:00Z`));

await rm(OUT,{recursive:true,force:true});
await mkdir(OUT,{recursive:true});

const contentDir=path.join(ROOT,'content/prompts');
const files=(await readdir(contentDir)).filter(x=>x.endsWith('.json')).sort();
const prompts=[];
for(const f of files) prompts.push(JSON.parse(await readFile(path.join(contentDir,f),'utf8')));

function score(a,b){
  let s=0;
  if(a.category===b.category) s+=4;
  const tags=new Set(a.tags||[]);
  for(const t of b.tags||[]) if(tags.has(t)) s+=2;
  return s;
}

function related(p){
  const explicit=(p.relatedSlugs||[]).map(s=>prompts.find(x=>x.slug===s)).filter(Boolean);
  const rest=prompts
    .filter(x=>x.slug!==p.slug&&!explicit.some(e=>e.slug===x.slug))
    .map(x=>({x,s:score(p,x)}))
    .filter(o=>o.s>0)
    .sort((a,b)=>b.s-a.s)
    .map(o=>o.x);
  return [...explicit,...rest].slice(0,3);
}

function head({title,description,url,ogType='website'}){
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#0d0d0e">
<meta name="color-scheme" content="dark">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Shawal">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="icon" href="/prompts/favicon.svg" type="image/svg+xml">\n<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/prompts/assets/css/styles.css">`;
}

const header=`<body>
<a class="skip-link" href="#main">Skip to main content</a>
<div class="ambient ambient-one" aria-hidden="true"></div>
<div class="ambient ambient-two" aria-hidden="true"></div>
<div class="page-shell">
<header class="topbar" aria-label="Site header">
  <a class="wordmark" href="/" aria-label="Shawal home">Shawal</a>
  <nav class="mini-nav" aria-label="Primary navigation">
    <a href="/prompts/" aria-current="page">Prompts</a>
    <a href="/ugc/">UGC</a>
  </nav>
</header>`;

const footer=`<footer class="footer">
  <p>Shawal <span aria-hidden="true">&middot;</span> @xshawalx</p>
</footer>
</div>`;

function supportSection(index='SUPPORT'){
  return `<section class="support" aria-labelledby="support-title">
    <div>
      <p class="section-index" aria-hidden="true">${esc(index)}</p>
      <h2 id="support-title">Support my work</h2>
      <p>Found something useful? You can support what I&rsquo;m building.</p>
    </div>
    <div class="support-actions">
      <a class="support-link support-link--primary" href="https://www.paypal.com/paypalme/noorshawal" target="_blank" rel="noopener noreferrer" aria-label="Support Shawal via PayPal &mdash; opens in a new tab">PayPal &#8599;</a>
      <a class="support-link" href="https://buymeacoffee.com/xshawalx" target="_blank" rel="noopener noreferrer" aria-label="Support Shawal via Buy Me a Coffee &mdash; opens in a new tab">Buy Me a Coffee &#8599;</a>
    </div>
  </section>`;
}

const indexMeta=prompts.map(({prompt,fields,howToUse,relatedSlugs,...m})=>m);

const home=`${head({
  title:'AI Prompt Library | Shawal',
  description:'Useful AI master prompts you can customize, copy and use.',
  url:BASE
})}
<script type="application/ld+json">${jsonSafe({
  '@context':'http://schema.org',
 '@type':'WebSite',
  name:'Shawal AI Prompt Library',
  url:BASE,
  author:{'@type':'Person',name:'Shawal'}
})}</script>
</head>
${header}
<main id="main">
  <section class="hero">
    <p class="eyebrow">@xshawalx / AI PROMPTS</p>
    <h1>Prompt Library<span aria-hidden="true">.</span></h1>
    <p class="intro">Useful AI master prompts you can customize, copy and use.</p>
    <div class="toolbar">
      <label class="sr-only" for="prompt-search">Search prompts</label>
      <input class="input" id="prompt-search" type="search" placeholder="Search by title, category, tag, use case&hellip;" autocomplete="off">
      <a class="button button-primary" href="#all-prompts">Browse all</a>
    </div>
  </section>

  <section class="section" aria-labelledby="featured-title">
    <div class="section-heading">
      <p class="section-index" aria-hidden="true">01</p>
      <h2 id="featured-title">Featured Prompts</h2>
      <p class="section-copy">Manually curated. No fake popularity or usage counts.</p>
    </div>
    <div class="grid" id="featured-grid"></div>
  </section>

  <section class="section" aria-labelledby="categories-title">
    <div class="section-heading">
      <p class="section-index" aria-hidden="true">02</p>
      <h2 id="categories-title">Categories</h2>
      <p class="section-copy">Only categories containing real published prompts are shown.</p>
    </div>
    <div class="chip-row" id="category-row" aria-label="Prompt categories"></div>
  </section>

  <section class="section" id="all-prompts" aria-labelledby="all-title">
    <div class="section-heading section-heading--split">
      <div>
        <p class="section-index" aria-hidden="true">03</p>
        <h2 id="all-title">All Prompts</h2>
      </div>
      <p class="section-copy" id="result-count">${prompts.length} prompts</p>
    </div>
    <div class="grid" id="all-grid"></div>
  </section>

  ${supportSection('04')}
</main>
${footer}
<script src="/prompts/assets/js/library.js" defer></script>
</body></html>`;

await writeFile(path.join(OUT,'index.html'),home);
await mkdir(path.join(OUT,'data'),{recursive:true});
await writeFile(path.join(OUT,'data/prompts-index.json'),JSON.stringify(indexMeta,null,2));

for(const p of prompts){
  const rel=related(p);
  const url=`${BASE}${p.slug}/`;
  const title=`${p.title} | Shawal`;

  const breadcrumbs={
    '@context':'https://schema.org',
    '@type':'BreadcrumbList',
    itemListElement:[
      {'@type':'ListItem',position:1,name:'Prompt Library',item:BASE},
      {'@type':'ListItem',position:2,name:p.title,item:url}
    ]
  };

  const creative={
    '@context':'https://schema.org',
    '@type':'CreativeWork',
    name:p.title,
    description:p.description,
    url,
    author:{'@type':'Person',name:'Shawal'},
    dateModified:p.updatedAt,
    version:p.version,
    keywords:p.tags||[]
  };

  const formPanel=(p.fields||[]).length
    ? `<section class="panel">
        <p class="panel-kicker">CUSTOMIZE</p>
        <h2>Make it yours</h2>
        <div class="form-grid" id="form-grid"></div>
        <div class="form-actions"><button class="button button-secondary" id="reset-prompt" type="button">Reset</button></div>
        <p class="support-copy">Your entries stay in this browser. They are not uploaded or sent to analytics.</p>
      </section>`
    : `<section class="panel">
        <p class="panel-kicker">READY</p>
        <h2>No setup needed</h2>
        <p class="support-copy support-copy--top">This prompt is ready to copy and use as-is.</p>
        <div class="form-grid" id="form-grid"></div>
      </section>`;

  const how=(p.howToUse?.length)
    ? `<section class="section howto">
        <div class="section-heading">
          <p class="section-index" aria-hidden="true">HOW TO USE</p>
          <h2>Use it in four steps</h2>
        </div>
        <ol>${p.howToUse.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
      </section>`
    : '';

  const relatedHtml=rel.length
    ? `<section class="section related">
        <div class="section-heading">
          <p class="section-index" aria-hidden="true">NEXT</p>
          <h2>Related Prompts</h2>
        </div>
        <div class="grid">${rel.map(x=>`<article class="card">
          <div class="badges"><span class="badge">${esc(x.category)}</span></div>
          <h3>${esc(x.title)}</h3>
          <p>${esc(x.description)}</p>
          <a class="button button-secondary" href="/prompts/${esc(x.slug)}/">Open Prompt</a>
        </article>`).join('')}</div>
      </section>`
    : '';

  const page=`${head({title,description:p.description,url,ogType:'article'})}
<script type="application/ld+json">${jsonSafe(breadcrumbs)}</script>
<script type="application/ld+json">${jsonSafe(creative)}</script>
</head>
${header}
<main id="main">
  <section class="prompt-hero">
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/prompts/">Prompt Library</a><span aria-hidden="true">/</span><span>${esc(p.category)}</span>
    </nav>
    <div class="badges">
      <span class="badge">${esc(p.category)}</span>
      ${p.featured?'<span class="badge badge-solid">Featured</span>':''}
      ${p.isNew?'<span class="badge">New</span>':''}
    </div>
    <h1 class="prompt-title">${esc(p.title)}</h1>
    <p class="prompt-intro">${esc(p.description)}</p>
    <div class="meta-row">
      <span>Who it&rsquo;s for: ${esc(p.audience)}</span>
      <span>Version ${esc(p.version)}</span>
      <span>Updated ${esc(fmt(p.updatedAt))}</span>
    </div>
  </section>

  <section class="detail-grid tool-shell">
    ${formPanel}
    <section class="panel preview-wrap">
      <p class="panel-kicker">PREVIEW</p>
      <h2>Live Master Prompt</h2>
      <div class="preview-actions">
        <button class="button button-primary" id="copy-prompt" type="button">Copy Prompt</button>
        <a class="button button-secondary" id="open-chatgpt" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT</a>
        <button class="button button-quiet" id="share-prompt" type="button">Share Prompt</button>
      </div>
      <pre class="preview" id="prompt-preview" tabindex="0"></pre>
      <p class="support-copy">Required fields must be completed before copying. Optional empty blocks disappear automatically.</p>
    </section>
  </section>

  ${how}
  ${relatedHtml}
  ${supportSection('SUPPORT')}
</main>
${footer}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script id="prompt-data" type="application/json">${jsonSafe(p)}</script>
<script src="/prompts/assets/js/prompt.js" defer></script>
</body></html>`;

  const dir=path.join(OUT,p.slug);
  await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,'index.html'),page);
}

await cp(path.join(ROOT,'assets'),path.join(OUT,'assets'),{recursive:true});\nawait cp(path.join(ROOT,'favicon.svg'),path.join(OUT,'favicon.svg'));
await writeFile(path.join(OUT,'.nojekyll'),'');
await writeFile(path.join(OUT,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
const urls=[BASE,...prompts.map(p=>`${BASE}${p.slug}/`)];
await writeFile(
  path.join(OUT,'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${u}</loc></url>`).join('')}</urlset>`
);

console.log(`Mbuilt ${prompts.length} prompt page(s) to dist/.`);
