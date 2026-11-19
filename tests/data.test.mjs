import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=name=>JSON.parse(readFileSync(new URL('../dist/data/'+name+'.json',import.meta.url)));
const data=read('comparison'),history=read('history'),evidence=read('evidence'),transitions=read('mixed-transitions');
const ids=new Map(data.countries.map(c=>[c.id,c]));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} ≠ ${b}`);
test('source fingerprint and coverage are immutable',()=>{
 const raw=new URL('../data/raw/dwrap_index.xlsx',import.meta.url);
 assert.ok(existsSync(raw));assert.equal(createHash('sha256').update(readFileSync(raw)).digest('hex'),data.summary.sourceSha256);
 assert.equal(data.summary.rawRows-data.summary.excludedBenchmarkRows,11484);
 assert.equal(Object.keys(history).length,205);assert.equal(data.countries.length,198);
 assert.ok(!ids.has(998)&&!ids.has(999));
});
test('independently enumerate every qualifying pair and verify published gaps and ordering',()=>{
 const expected=new Set();for(let i=0;i<data.countries.length;i++)for(let j=i+1;j<data.countries.length;j++){
  const a=data.countries[i],b=data.countries[j];if(Math.abs(a.total-b.total)<=.005)expected.add([a.id,b.id].sort((x,y)=>x-y).join('-'));
 }
 assert.equal(expected.size,405);assert.equal(data.pairs.length,expected.size);
 for(const [index,p] of data.pairs.entries()){
  assert.ok(expected.delete([p.a,p.b].sort((a,b)=>a-b).join('-')));near(p.totalGap,Math.abs(ids.get(p.a).total-ids.get(p.b).total));
  for(const f of data.fields)near(p.gaps[f.key],Math.abs(ids.get(p.a).scores[f.key]-ids.get(p.b).scores[f.key]));
  near(p.largestGap,Math.max(...Object.values(p.gaps)));near(p.largestGap,p.gaps[p.largestField]);
  if(index)assert.ok(data.pairs[index-1].largestGap>=p.largestGap);
 }assert.equal(expected.size,0);
});
test('all timeline endpoints exactly match the snapshot, missing years are not invented',()=>{
 let rows=0;for(const [id,observations] of Object.entries(history)){
  rows+=observations.length;const years=observations.map(r=>r.year);assert.equal(new Set(years).size,years.length);
  for(const r of observations)for(const k of ['total',...data.fields.map(f=>f.key)])assert.ok(r[k]>=0&&r[k]<=1);
  const current=ids.get(Number(id)),last=observations.find(r=>r.year===2022);if(current){assert.ok(last);near(last.total,current.total);for(const f of data.fields)near(last[f.key],current.scores[f.key]);}
 }assert.equal(rows,11484);
});
test('mixed direction counts recomputed independently from consecutive annual observations',()=>{
 let changed=0,mixed=0;for(const series of Object.values(history))for(let i=1;i<series.length;i++){
  const a=series[i-1],b=series[i];if(b.year!==a.year+1)continue;
  const differences=data.fields.map(f=>b[f.key]-a[f.key]);if(differences.some(x=>Math.abs(x)>1e-8))changed++;
  if(differences.some(x=>x>1e-8)&&differences.some(x=>x< -1e-8))mixed++;
 }assert.equal(changed,848);assert.equal(mixed,197);assert.equal(transitions.length,mixed);
});
test('legal metadata cannot silently diverge from source values',()=>{
 for(const doc of evidence.evidence){const c=data.countries.find(c=>c.country===doc.country);for(const [k,v] of Object.entries(doc.recorded_codes))assert.equal(c.codes[k],v);assert.match(doc.source_url,/^https:/);assert.ok(doc.pdf_page>0);assert.ok(doc.visible_caveat)}
 const p=data.curated.find(p=>p.key==='movement');assert.equal(p.largestField,'movement');near(p.totalGap,0.0014437487593617626);near(p.largestGap,0.5272429793279994);
});
