const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (v,n=3) => v == null ? 'No observation' : v.toFixed(n);
const commas = n=>n.toLocaleString('en-US');
let data,history,evidence,selected;
let countries;
const names = p => `${countries.get(p.a).country} × ${countries.get(p.b).country}`;
const label = key => data.fields.find(f=>f.key===key)?.label || 'Overall index';
const pairKey = p=>[p.a,p.b].sort((a,b)=>a-b).join('-');
const seriesLegend = (a,b,extra='')=>`<span class="series-a"><i class="dot"></i>${esc(a.country)}${extra?' · '+extra:''}</span><span class="series-b"><i class="dot b"></i>${esc(b.country)}</span>`;

async function init(){
 [data,history,evidence]=await Promise.all(['comparison','history','evidence'].map(async name=>{const embedded=document.getElementById('embedded-'+name);if(embedded)return JSON.parse(embedded.textContent);const r=await fetch(`data/${name}.json`);if(!r.ok)throw Error(`Cannot load ${name}`);return r.json()}));
 countries=new Map(data.countries.map(c=>[c.id,c]));
 const initial=data.curated.find(p=>p.key==='movement');
 $('#hero-a').textContent=fmt(countries.get(initial.a).total,4);$('#hero-b').textContent=fmt(countries.get(initial.b).total,4);
 $('#pair-select').innerHTML=data.pairs.map(p=>`<option value="${pairKey(p)}">${esc(names(p))} · largest gap: ${label(p.largestField)}</option>`).join('');
 $('#pair-rule').textContent=`${commas(data.summary.qualifyingPairs)} pairs · overall gap ≤ ${fmt(data.summary.pairTolerance)} · ordered by largest field gap`;
 $('#pair-select').addEventListener('change',e=>choosePair(data.pairs.find(p=>pairKey(p)===e.target.value)));
 document.querySelectorAll('[data-case]').forEach(b=>b.addEventListener('click',()=>choosePair(data.curated.find(p=>p.key===b.dataset.case))));
 $('#country-search').addEventListener('input',renderMatrix);$('#matrix-sort').addEventListener('change',renderMatrix);
 $('#history-field').addEventListener('change',renderHistory);$('#year').addEventListener('input',renderHistory);
 const s=data.summary;
 $('#selection-method').textContent=`For ${s.lastYear}, we test all ${commas(s.possiblePairs)} unordered pairs among ${s.currentEntities} country entities. ${commas(s.qualifyingPairs)} pairs have an absolute overall ICW difference no larger than ${s.pairTolerance}. For each, we calculate the absolute difference in each of the five fields.`;
 $('#audit-summary').textContent=`The original workbook has ${commas(s.rawRows)} rows. Excluding ${s.excludedBenchmarkRows} rows for the Convention/Protocol and theoretical-maximum benchmarks leaves ${commas(s.countryYearRows)} country-year observations. There are ${s.historicalEntities} distinct country entities across ${s.firstYear}–${s.lastYear}, and ${s.currentEntities} in ${s.lastYear}.`;
 $('#coverage-note').textContent=`The panel is unbalanced: entities enter and leave the record. ${s.historicalEntities} entities across the entire period does not mean ${s.historicalEntities} countries in every year. We keep ${s.currentEntities} entities in the ${s.lastYear} comparison and do not substitute the catalog’s headline count of 193.`;
 $('#source-hash').textContent=s.sourceSha256;
 choosePair(initial);
}
function choosePair(p){
 selected=p;$('#pair-select').value=pairKey(p);
 document.querySelectorAll('[data-case]').forEach(b=>{const active=pairKey(data.curated.find(c=>c.key===b.dataset.case))===pairKey(p);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 const a=countries.get(p.a),b=countries.get(p.b);
 $('#pair-title').textContent=`${a.country} and ${b.country}`;
 $('#pair-legend').innerHTML=seriesLegend(a,b);
 // Existing marks retain their positions during updates, allowing a brief traceable transition.
 if(!$('#profile').children.length){$('#profile').innerHTML='<div class="profile-axis"><span>0</span><span>0.25</span><span>0.50</span><span>0.75</span><span>1</span></div>'+data.fields.map(f=>`<div class="profile-row" data-field="${f.key}"><div class="profile-label"></div><div class="track"><div class="gap-line"></div><span class="mark a"></span><span class="mark b"></span></div><div class="value-pair"></div></div>`).join('')}
 for(const f of data.fields){const r=$(`[data-field="${f.key}"]`),av=a.scores[f.key],bv=b.scores[f.key];r.classList.toggle('is-largest',f.key===p.largestField);r.querySelector('.profile-label').innerHTML=`${esc(f.label)}${f.key===p.largestField?'<small>Largest field gap</small>':''}`;r.querySelector('.mark.a').style.setProperty('--value',`${av*100}%`);r.querySelector('.mark.b').style.setProperty('--value',`${bv*100}%`);r.querySelector('.gap-line').style.setProperty('--left',`${Math.min(av,bv)*100}%`);r.querySelector('.gap-line').style.setProperty('--width',`${p.gaps[f.key]*100}%`);r.querySelector('.value-pair').innerHTML=`<span class="series-a">${fmt(av)}</span><span class="series-b">${fmt(bv)}</span>`;r.setAttribute('aria-label',`${f.label}: ${a.country} ${fmt(av,6)}, ${b.country} ${fmt(bv,6)}, absolute gap ${fmt(p.gaps[f.key],6)}`)}
 $('#pair-takeaway').innerHTML=`Their overall scores are <strong>${fmt(a.total,4)}</strong> and <strong>${fmt(b.total,4)}</strong>, a gap of <strong>${fmt(p.totalGap,4)}</strong>. Their widest field difference is <strong>${esc(label(p.largestField).toLowerCase())}: ${fmt(p.largestGap,4)}</strong>.`;
 renderEvidence();renderMatrix();renderHistory();
}
function renderEvidence(){
 const p=selected,a=countries.get(p.a),b=countries.get(p.b),movement=data.curated.find(c=>c.key==='movement'),coverage=data.curated.find(c=>c.key==='coverage');
 if(pairKey(p)===pairKey(movement)){
  const docs=evidence.evidence;
  $('#evidence-title').textContent='A general guarantee. A permission requirement.';
  $('#evidence-content').innerHTML=`<p class="evidence-intro">Movement is the largest field gap for this pair. Within that field, the legal language makes one distinction tangible: an explicit general right to move, and a requirement for permission under a residence order.</p><div class="quote-grid">${docs.map((d,i)=>`<article class="quote-card ${i?'b':''}"><span class="country ${i?'country-b':'country-a'}">${esc(d.country)}</span><blockquote>“${esc(d.quote)}”</blockquote><a class="source-link" href="${esc(d.source_url)}#page=${d.pdf_page}" target="_blank" rel="noopener">${esc(d.document)} · §${i?'21(b)':'41'} ↗</a><p>PDF page ${d.pdf_page}. ${i?'Original English statutory language; ellipsis omits intervening wording. Legislation as at 19 March 1999; reproduction checked through January 2024.':'Ministry of the Interior English translation; amendments through 1163/2019. Only Finnish and Swedish are legally binding.'}</p><p><strong>Who is covered?</strong> ${esc(d.context)}</p></article>`).join('')}</div><h3>Now inspect the codes, including their limits.</h3><div style="overflow-x:auto"><table class="code-table"><thead><tr><th>Recorded variable</th><th>Finland</th><th>Namibia</th></tr></thead><tbody>${['move','move_cond','camp'].map(key=>`<tr><td><code>${key}</code></td>${[countries.get(movement.a),countries.get(movement.b)].map(c=>`<td><span class="code-value">${c.codes[key]}</span> — ${esc(evidence.codebook[key][c.codes[key]])}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="small">Labels paraphrase the September 2024 codebook, PDF pages 13–14. They describe the recorded classification, not our independent certification of the law.</p><div class="evidence-caveat"><strong>The exception belongs beside the quote.</strong> Finland’s same law also permits individual reception-centre residence and reporting orders (§§117a/120a, PDF pages 90–92). The general guarantee does not independently validate <code>move_cond = 2</code>. Namibia’s quoted offence applies to people served with a §20 residence order. Both records have <code>camp = 1</code>.</div><p class="small">These excerpts illustrate the settlement component. Movement also includes travel and identification documents. No single clause explains the whole ${fmt(p.largestGap,4)} gap. The source versions support a historical provision comparison, not a complete certification of all law in force in 2022.</p>`;
 }else if(pairKey(p)===pairKey(coverage)){
  const d=evidence.philippines_2022_audit_case,ph=data.countries.find(c=>c.country==='Philippines');
  $('#evidence-title').textContent='Sometimes the words challenge the score.';
  $('#evidence-content').innerHTML=`<span class="status">Unresolved source-coverage issue</span><p class="evidence-intro">The largest field gap for Austria–Philippines is services. The Philippines record has a services index of <strong>${fmt(ph.scores.services,4)}</strong> and <code>health = ${ph.codes.health}</code>. That is not enough to conclude that the country provided no health protections.</p><div class="quote-grid"><article class="quote-card"><span class="country">What the supplied row names</span><h3>Department Circular No. 058 (2012)</h3><p>The policy-title field lists the refugee and stateless status determination procedure. It does not name Executive Order 163.</p><p><strong>Exact workbook title:</strong> ${esc(ph.policy)}</p></article><article class="quote-card b"><span class="country">A contemporaneous document</span><blockquote>“${esc(d.quote)}”</blockquote><a class="source-link" href="${d.url}" target="_blank" rel="noopener">Executive Order 163 · §4(b) ↗</a><p>Signed 28 February 2022. Original English. POCs means persons of concern, as defined by the order. Official Gazette publication: 7 March 2022. <a href="${d.pdf_url}" target="_blank" rel="noopener">Read the PDF mirror ↗</a></p></article></div><div class="evidence-caveat"><strong>A question for the data’s curators.</strong> The order directs institutions to improve access. Its absence from the policy-title field raises a coverage question; it does not establish why it was omitted, how it was treated in coding, or how services were implemented. We preserve the published scores and do not attribute the entire services gap to this document.</div><p>This is why the article needs a two-way evidence trail: legal language can clarify a comparison, and it can reveal where that comparison needs further investigation.</p>`;
 }else{
  $('#evidence-title').textContent='A numerical lead, awaiting a close reading.';
  $('#evidence-content').innerHTML=`<p class="evidence-intro">${esc(a.country)} and ${esc(b.country)} have their largest field difference in ${esc(label(p.largestField).toLowerCase())}. This MVP has not verified excerpts for this pair. The score alone cannot establish which clauses account for that difference.</p><div class="quote-grid"><div><h3>${esc(a.country)} · recorded policy title</h3><p>${esc(a.policy)}</p></div><div><h3>${esc(b.country)} · recorded policy title</h3><p>${esc(b.policy)}</p></div></div><p class="small">Choose Finland × Namibia for the curated movement comparison, or Austria × Philippines for the source-coverage audit. Titles are source metadata, not verified statements of current law.</p>`;
 }
}
function renderMatrix(){
 const q=$('#country-search').value.trim().toLowerCase(),sort=$('#matrix-sort').value;
 const rows=data.countries.filter(c=>c.country.toLowerCase().includes(q)).sort((a,b)=>sort==='country'?a.country.localeCompare(b.country):(sort==='total'?b.total-a.total:b.scores[sort]-a.scores[sort])||a.country.localeCompare(b.country));
 $('#matrix-count').textContent=`Showing ${rows.length} of ${data.countries.length} country entities · 2022`;
 $('#matrix tbody').innerHTML=rows.map(c=>{const hasPair=data.pairs.some(p=>p.a===c.id||p.b===c.id);return `<tr class="${[selected.a,selected.b].includes(c.id)?'selected':''}"><td><button data-country="${c.id}" ${hasPair?'':'disabled'} title="${hasPair?'Open this country’s most divergent close-score pair':'No pair within the 0.005 tolerance'}">${esc(c.country)}</button></td><td>${fmt(c.total)}</td>${data.fields.map(f=>{const v=c.scores[f.key],light=96-v*64;return `<td style="background:hsl(188 24% ${light}%);color:${v>.57?'#fff':'#21373d'}" title="${esc(c.country)} · ${f.label}: ${fmt(v,6)}">${fmt(v)}</td>`}).join('')}</tr>`}).join('') || '<tr><td colspan="7">No matching countries. Try another name.</td></tr>';
 $('#matrix tbody').querySelectorAll('button:not(:disabled)').forEach(b=>b.addEventListener('click',()=>{choosePair(data.pairs.find(p=>p.a===Number(b.dataset.country)||p.b===Number(b.dataset.country)));$('#compare').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}));
}
function renderHistory(){
 const field=$('#history-field').value,year=Number($('#year').value),a=countries.get(selected.a),b=countries.get(selected.b);$('#year-label').textContent=year;
 const W=1020,H=315,L=45,R=20,T=15,B=35,x=y=>L+(y-1951)/71*(W-L-R),y=v=>T+(1-v)*(H-T-B);
 const path=rows=>{let d='',prev;for(const r of rows){if(!prev||r.year!==prev.year+1)d+=` M${x(r.year)},${y(r[field])}`;else d+=` H${x(r.year)} V${y(r[field])}`;prev=r}return d};
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label(field))} for ${esc(a.country)} and ${esc(b.country)}, 1951 to 2022">`;
 for(const v of [0,.25,.5,.75,1])svg+=`<line x1="${L}" y1="${y(v)}" x2="${W-R}" y2="${y(v)}" stroke="#d8dfdc"/><text x="${L-10}" y="${y(v)+4}" text-anchor="end">${v}</text>`;
 for(const yr of [1951,1970,1990,2010,2022])svg+=`<text x="${x(yr)}" y="${H-10}" text-anchor="middle">${yr}</text>`;
 svg+=`<line x1="${x(year)}" x2="${x(year)}" y1="${T}" y2="${H-B}" stroke="#7e9197" stroke-dasharray="3 4"/>`;
 [a,b].forEach((c,i)=>{const rows=history[c.id]||[],r=rows.find(r=>r.year===year);svg+=`<path d="${path(rows)}" fill="none" stroke="${i?'#ac542a':'#176b87'}" stroke-width="2.5" ${i?'stroke-dasharray="6 3"':''}/>`;if(r)svg+=i?`<rect x="${x(year)-4}" y="${y(r[field])-4}" width="8" height="8" fill="#ac542a"/>`:`<circle cx="${x(year)}" cy="${y(r[field])}" r="4" fill="#176b87"/>`});
 $('#history-chart').innerHTML=svg+'</svg>';
 $('#history-readout').innerHTML=[a,b].map((c,i)=>{const r=history[c.id]?.find(r=>r.year===year);return `<span class="series-${i?'b':'a'}"><i class="dot ${i?'b':''}"></i>${esc(c.country)} · ${year}: <strong>${r?fmt(r[field],4):'No observation'}</strong></span>`}).join('');
}
init().catch(error=>{console.error(error);const e=$('#load-error');e.hidden=false;e.textContent='The data could not load. Refresh the page or serve this project over HTTP rather than opening index.html directly.'});
