import {test} from 'node:test';
import assert from 'node:assert/strict';
import {settings,defaults,encode,decode,design} from '../snowflake/src/design.js';

test('compact links omit defaults, pack generated seeds and retain exact settings',()=>{
 const samples=[defaults,settings({seed:'0123456789abcdef0123456789abcdef'}),settings({seed:'❄️雪flake',mode:'prompt',text:'delicate winter 雪 ❄️',diameter:100.000001,thickness:Math.PI,branch:1.23456789,textWeight:.987654,centreSize:16.73,textPosition:-0}),settings({mode:'text',armLayout:'alternating',font:'courgette',text:'Text Test',textLayout:'flowing',centre:'web',complexity:18,branch:1.2})];
 for(const s of samples){const query=encode(s);assert.ok(query.startsWith('d='));assert.deepEqual(decode('?'+query),s);assert.ok(query.length<new URLSearchParams({v:'1',...s}).toString().length);}
 assert.ok(encode(samples[1]).length<=36);
});
test('all options and numeric ranges survive compact round trips',()=>{
 const options={centreJoin:['bar','letters'],centreAms:['off','on'],mainColour:['#FFFFFF','#123456'],centreColour:['#D94A64','#AABBCC'],growth:['original','airy','natural'],naturalStyle:['random','stellar','fern','plate'],crystalQuality:['original','refined'],silhouette:['random-all','simple','plates','hex-tips','leaves','needles','random','legacy','star','fern','crystal','rounded'],mode:['random','text','prompt'],armLayout:['all','alternating'],centreText:['TEXT','George','2026','A-B'],centreFont:['lato','breeserif','courgette','berkshireswash','niconne','montecarlo'],centre:['text','random','original','solid-star','star-frame','hexagon','hex-frame','circle','ring','rosette','web'],font:['stroke','montecarlo','niconne','lato','breeserif','courgette','berkshireswash'],textLayout:['mirrored','single','flowing'],pattern:['mixed','open','lattice'],printer:['mini','a1']};
 for(const [key,values]of Object.entries(options))for(const value of values){const s=settings({[key]:value});assert.deepEqual(decode(encode(s)),s);}
 for(const value of [-10,-2.15,-0,0,3.3333333333333335,10]){const s=settings({textPosition:value});assert.deepEqual(decode(encode(s)),s);}
 const s=settings({seed:'S'.repeat(128),mode:'prompt',text:'winter '.repeat(17).trim(),diameter:245,thickness:8,complexity:18,branch:4,centreSize:30,fullness:100,textSize:150,letterSpacing:40});assert.deepEqual(decode(encode(s)),s);
});
test('malformed and corrupted compact links fail before geometry generation',()=>{
 const query=encode(settings({seed:'0123456789abcdef0123456789abcdef',complexity:18})),token=query.slice(2);
 for(const bad of ['',token.slice(0,-1),token.slice(0,10),token.slice(0,8)+(token[8]==='A'?'B':'A')+token.slice(9),'!bad!', 'A'.repeat(4097)])assert.throws(()=>decode('?d='+bad));
 assert.throws(()=>decode(query+'&'+query));assert.throws(()=>decode('?v=2&seed=x'));
});
test('legacy design links and compact replacements reproduce identical geometry',()=>{
 for(const query of ['?v=1&seed=winter-2026&diameter=100&complexity=5','?v=1&seed=other&centre=web&complexity=12&branch=1.2','?v=1&mode=text&font=courgette&text=Text+Test&textLayout=flowing&armLayout=alternating&centre=random']){
  const s=decode(query),compact=decode(encode(s));assert.deepEqual(compact,s);assert.deepEqual(design(s).vertices,design(compact).vertices);assert.deepEqual(design(s).faces,design(compact).faces);
 }
 assert.equal(decode('?v=1&seed=winter-2026').centre,'original');
});

test('version 1 compact links retain original growth while version 2 preserves airy recipes',()=>{
 const original=decode('?d=AQALd2ludGVyLTIwMjYAQzk');assert.equal(original.growth,'original');assert.equal(original.seed,'winter-2026');
 const airy=settings({growth:'airy',fullness:100,complexity:18,branch:1.2});assert.deepEqual(decode(encode(airy)),airy);
});

test('version 2 airy links retain their previous silhouette and centre joins',()=>{
 const old=decode('?d=AgALd2ludGVyLTIwMjaEwBcFACQB8AEAyAEBAX7l');
 assert.equal(old.silhouette,'legacy');assert.equal(old.growth,'airy');
 assert.deepEqual(decode(encode(old)),old);
 assert.equal(decode('?d=AQALd2ludGVyLTIwMjYAQzk').silhouette,'legacy');
});
test('version 4 crystal meshes remain reproducible and can be refined in version 5 links',async()=>{
 const {createHash}=await import('node:crypto'),s=decode('?d=BAALd2ludGVyLTIwMjaEwDMFACQB8AEAyAEBCUfh');
 assert.equal(s.crystalQuality,'original');const m=design(s);
 assert.equal(createHash('sha256').update(new Uint8Array(m.vertices.buffer)).update(new Uint8Array(m.faces.buffer)).digest('hex'),'31cab6ec9d478f9ddb1b6622e5c6ac7468886d8ad84fa429d0c5efddb222db65');
 const refined=settings({...s,crystalQuality:'refined'});assert.deepEqual(decode(encode(refined)),refined);assert.notDeepEqual(design(refined).vertices,m.vertices);
});

test('version 9 centre bars retain their exact old geometry while new recipes support direct letter joins',async()=>{
 const {createHash}=await import('node:crypto'),old=decode('?d=CQALd2ludGVyLTIwMjaMgIAMCgAwAgH2rg'),m=design(old);assert.equal(old.centreJoin,'bar');
 assert.equal(createHash('sha256').update(new Uint8Array(m.vertices.buffer)).update(new Uint8Array(m.faces.buffer)).digest('hex'),'609dc45eda298dbc9ba0c4947ef78ff762dba919915ff90cf835c769408014fe');
 const next=settings({...old,centreJoin:'letters'});assert.deepEqual(decode(encode(next)),next);assert.notDeepEqual(design(next).vertices,m.vertices);
});
