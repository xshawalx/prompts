const BASE = '/prompts/';
const state = { prompts: [], query: '', category: 'All' };
const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function searchable(p) {
  return [p.title,p.description,p.category,p.audience,...(p.tags||[]),...(p.useCases||[])].join(' ').toLowerCase();
}
function card(p) {
  return `<article class="card">
    <div class="badges"><span class="badge">${esc(p.category)}</span>${p.featured?'<span class="badge badge-solid">Featured</span>':''}${p.isNew?'<span class="badge">New</span>':''}</div>
    <h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>
    <a class="button button-secondary" href="${BASE}${encodeURIComponent(p.slug)}/">Open Prompt</a>
  </article>`;
}
function render() {
  const q = state.query.trim().toLowerCase();
  const filtered = state.prompts.filter(p => (state.category==='All'||p.category===state.category) && (!q||searchable(p).includes(q)));
  const all = document.querySelector('#all-grid');
  const featured = document.querySelector('#featured-grid');
  const count = document.querySelector('#result-count');
  if (count) count.textContent = `${filtered.length} prompt${filtered.length===1?'':'s'}`;
  if (all) all.innerHTML = filtered.length ? filtered.map(card).join('') : `<div class="empty">No prompts match this search yet.</div>`;
  const fp = state.prompts.filter(p=>p.featured).slice(0,6);
  if (featured) {
    featured.innerHTML = fp.length ? fp.map(card).join('') : `<div class="empty">Featured prompts will appear here when you mark real prompt records with <strong>featured: true</strong>.</div>`;
  }
}
function renderCategories() {
  const root = document.querySelector('#category-row');
  const categories = ['All', ...new Set(state.prompts.map(p=>p.category).filter(Boolean))];
  root.innerHTML = categories.map(c=>`<button class="chip" type="button" data-category="${esc(c)}" aria-pressed="${c==='All'}">${esc(c)}</button>`).join('');
  root.addEventListener('click', e=>{
    const b=e.target.closest('[data-category]'); if(!b) return;
    state.category=b.dataset.category;
    root.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    render();
  });
}
async function init() {
  try {
    const res = await fetch(`${BASE}data/prompts-index.json`, {cache:'no-store'});
    state.prompts = res.ok ? await res.json() : [];
  } catch { state.prompts=[]; }
  renderCategories(); render();
  const search=document.querySelector('#prompt-search');
  search?.addEventListener('input',()=>{state.query=search.value; render();});
}
init();
