import {test} from 'node:test';
import assert from 'node:assert/strict';
import {design,settings,defaults,encode,decode} from '../snowflake/src/design.js';
import {exportStl,export3mf,projectFiles} from '../snowflake/src/export.js';
function checkMesh(m){
 const edges=new Map(),adj=new Map();let volume=0;
 for(let i=0;i<m.faces.length;i+=3){const ids=Array.from(m.faces.slice(i,i+3));assert.equal(new Set(ids).size,3);const a=ids.map(id=>Array.from(m.vertices.slice(id*3,id*3+3)));const [p,q,r]=a;const u=q.map((v,k)=>v-p[k]),v=r.map((v,k)=>v-p[k]);assert.ok(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])>1e-10,'nondegenerate');volume+=(p[0]*(q[1]*r[2]-q[2]*r[1])+p[1]*(q[2]*r[0]-q[0]*r[2])+p[2]*(q[0]*r[1]-q[1]*r[0]))/6;
 for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(':');const e=edges.get(key)||{count:0,dir:0};e.count++;e.dir+=a<b?1:-1;edges.set(key,e);if(!adj.has(a))adj.set(a,[]);adj.get(a).push(b);}}
 for(const e of edges.values()){assert.equal(e.count,2,'watertight');assert.equal(e.dir,0,'consistent winding');}assert.ok(volume>0,'outward normals');const seen=new Set(),stack=[0];while(stack.length){const a=stack.pop();if(seen.has(a))continue;seen.add(a);stack.push(...adj.get(a));}assert.equal(seen.size,m.vertices.length/3,'one connected surface');
}
test('seed and all settings round-trip deterministically',()=>{const m=design(defaults);assert.deepEqual(design(decode('?'+encode(defaults))).vertices,m.vertices);assert.notDeepEqual(design({...defaults,seed:'other'}).vertices,m.vertices);assert.deepEqual(decode('?'+encode(defaults)),defaults);});
test('mesh is one watertight solid across seed, pattern and size extremes',()=>{for(let i=0;i<24;i++)for(const pattern of ['mixed','open','lattice'])checkMesh(design({growth:'original',seed:`test-${i}`,diameter:i%2?40:245,thickness:i%2?1:8,branch:i%2?4:1.2,complexity:i%9+1,pattern,printer:'a1'}));});
test('hanging bore stays 4 mm and ring reaches exactly R+7 across sizes',()=>{for(const diameter of [40,100,245]){const m=design({diameter,printer:'a1'});assert.equal(m.bounds.maxY,diameter/2+7);const bore=m.loops.find(l=>l.every(([x,y])=>Math.abs(x)<=2.001&&Math.abs(y-(diameter/2+3))<=2.001));assert.ok(bore);assert.equal(Math.max(...bore.map(p=>p[0]))-Math.min(...bore.map(p=>p[0])),4);}});
test('actual bounds including ring enforce printer margin and block both exports',()=>{const m=design({diameter:245});assert.equal(m.valid,false);assert.throws(()=>exportStl(m));assert.throws(()=>export3mf(m));assert.equal(design({diameter:245,printer:'a1'}).valid,true);assert.throws(()=>settings({diameter:NaN}));assert.throws(()=>settings({printer:'x'}));});
test('STL geometry and profile-free 3MF preserve build-plate placement and saved recipe',()=>{
 const m=design(defaults),bytes=exportStl(m);assert.equal(bytes.length,84+m.faces.length/3*50);assert.equal(new DataView(bytes.buffer).getUint32(80,true),m.faces.length/3);
 for(const [printer,size]of [['mini',180],['a1',256]]){
  const mesh=design({printer}),files=projectFiles(mesh),model=files['3D/3dmodel.model'];
  assert.ok(!Object.hasOwn(files,'Metadata/project_settings.config'));assert.ok(files['Metadata/model_settings.config']);
  assert.ok(!/machine_start_gcode|machine_end_gcode|printer_settings_id|filament_settings_id/.test(Object.values(files).join('')));
  const transform=model.match(/<item objectid="3" transform="([^"]+)"/)[1].split(' ').map(Number),x=(mesh.bounds.minX+mesh.bounds.maxX)/2,y=(mesh.bounds.minY+mesh.bounds.maxY)/2;
  assert.equal(transform[9]+x,size/2);assert.equal(transform[10]+y,size/2);assert.equal(transform[11],0);
  assert.deepEqual(JSON.parse(files['Metadata/snowflake.json']).settings,mesh.s);
  assert.equal(new DataView(export3mf(mesh).buffer).getUint32(0,true),0x04034b50);
 }
});

test('batch generation provides 24 unique reproducible seeds and preserves shared settings',async()=>{
 const {batchSettings}=await import('../snowflake/src/batch.js');
 const batch=batchSettings(defaults,24);
 assert.equal(batch.length,24);assert.equal(new Set(batch.map(s=>s.seed)).size,24);
 assert.deepEqual(batchSettings(defaults,24),batch);
 for(const s of batch){assert.equal(s.diameter,100);assert.equal(s.thickness,3);assert.equal(design(s).valid,true);}
 assert.deepEqual(batchSettings(defaults,1),[defaults]);
 for(const count of [0,25,1.5,NaN])assert.throws(()=>batchSettings(defaults,count));
});

test('zero fullness preserves original v1 geometry and old links',async()=>{
 const {createHash}=await import('node:crypto');const m=design({seed:'winter-2026',centre:'original',growth:'original',branch:2,fullness:0});
 assert.equal(createHash('sha256').update(new Uint8Array(m.vertices.buffer)).update(new Uint8Array(m.faces.buffer)).digest('hex'),'5e0449ed9b97473c088561525191f8243cdb822b6529c9232d4cf81bb99fa99f');
 assert.equal(decode('?v=1&seed=winter-2026').fullness,0);
 const s={...defaults,fullness:80};assert.deepEqual(decode('?'+encode(s)),s);assert.throws(()=>settings({fullness:101}));assert.throws(()=>settings({fullness:NaN}));
});
test('fuller meshes stay connected and closed with fixed ring at dimension extremes',()=>{
 for(const fullness of [10,50,100])for(const pattern of ['mixed','open','lattice'])for(let i=0;i<6;i++){
  const m=design({seed:`full-${i}`,fullness,pattern,diameter:i%2?40:245,branch:i%2?4:1.2,complexity:i%2?1:9,printer:'a1'});checkMesh(m);
  assert.equal(m.bounds.maxY,m.s.diameter/2+7);
  const cy=m.s.diameter/2+3,bore=m.loops.find(l=>l.every(([x,y])=>Math.abs(x)<=2.001&&Math.abs(y-cy)<=2.001));assert.ok(bore);
 }
});
test('Original growth fullness adds material coverage without changing the seed',()=>{
 const open=design({...defaults,growth:'original',branch:2,fullness:0}),full=design({...defaults,growth:'original',branch:2,fullness:100});
 const area=m=>Math.abs(m.loops.reduce((sum,l)=>sum+l.reduce((a,p,i)=>{const q=l[(i+1)%l.length];return a+p[0]*q[1]-q[0]*p[1];},0)/2,0));
 assert.equal(open.s.seed,full.s.seed);assert.ok(area(full)>area(open)*1.3);assert.notDeepEqual(open.vertices,full.vertices);
});

test('readable text supports the alphabet and digits as a connected watertight ornament',()=>{
 for(const text of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')checkMesh(design({mode:'text',text}));
 for(const text of ['JOY','ELLA','A-B','MERRY XMAS','123456789012'])for(const diameter of [40,100,245]){
  const m=design({mode:'text',text,diameter,printer:'a1'});checkMesh(m);assert.equal(m.bounds.maxY,diameter/2+7);
 }
 const small=design({mode:'text',text:'MERRY XMAS',diameter:40});assert.equal(small.issue,'text');assert.throws(()=>export3mf(small));assert.throws(()=>exportStl(small));
 assert.equal(design({mode:'text',text:'MERRY XMAS',diameter:160,printer:'a1'}).valid,true);
 assert.equal(settings({mode:'text',text:' Zoë '}).text,'ZOE');assert.throws(()=>settings({mode:'text',text:'HELLO!'}));assert.throws(()=>settings({mode:'text',text:''}));assert.throws(()=>settings({mode:'text',text:'TOO MANY LETTERS'}));
});
test('text modes reproduce through links and batch settings',async()=>{
 const {batchSettings}=await import('../snowflake/src/batch.js');
 for(const mode of ['text','prompt']){
  const s=settings({mode,text:mode==='text'?'JOY':'full fern'}),m=design(s);
  assert.deepEqual(design(decode('?'+encode(s))).vertices,m.vertices);
  const batch=batchSettings(s,24);assert.ok(batch.every(item=>item.mode===mode&&item.text===s.text));
  const files=projectFiles(m);assert.equal(JSON.parse(files['Metadata/snowflake.json']).settings.text,s.text);
 }
});
test('abstract text changes geometry deterministically and retains a connected printable mesh',()=>{
 for(const text of ['full fern','delicate crystal','dense lace','winter woods'])for(const diameter of [40,100,245])for(const pattern of ['open','lattice']){
  const m=design({mode:'prompt',text,diameter,pattern,printer:'a1',complexity:9});checkMesh(m);assert.equal(m.bounds.maxY,diameter/2+7);
 }
 assert.notDeepEqual(design({mode:'prompt',text:'winter'}).vertices,design({mode:'prompt',text:'summer'}).vertices);
 assert.equal(settings({mode:'random',text:'THIS IS A LONG DESCRIPTION!'}).mode,'random');
});

test('mirrored script fonts create watertight connected name ornaments with a fixed ring',()=>{
 for(const font of ['montecarlo','niconne'])for(const text of ['Melissa','Ella','JOY','Li','A','2026']){
  const m=design({mode:'text',font,text});checkMesh(m);assert.equal(m.bounds.maxY,57);assert.equal(m.s.text,text);
 }
 for(const diameter of [40,245])for(const font of ['montecarlo','niconne']){
  const m=design({mode:'text',font,text:'Melissa',diameter,printer:'a1',textSize:150,textPosition:10});checkMesh(m);assert.equal(m.bounds.maxY,diameter/2+7);
 }
 const s=settings({mode:'text',font:'montecarlo',text:'Melissa',textSize:130,textPosition:-5});assert.deepEqual(decode('?'+encode(s)),s);assert.throws(()=>settings({font:'unknown'}));
});

test('script fonts preserve letter counters and joins across mixed-case words and punctuation',()=>{
 for(const font of ['montecarlo','niconne'])for(const text of ['Abcdef','Ghijkl','Mnopqr','Stuvwx','Yz0123',"O'Neil"]){checkMesh(design({mode:'text',font,text}));}
});

test('clear font layouts are deterministic watertight ornaments with fixed hanging bores',()=>{
 for(const font of ['lato','breeserif'])for(const text of ['GEORGE','George','Ella',"O'Neil",'ABC123'])for(const textLayout of ['single','mirrored']){
  const s=settings({mode:'text',font,text,textLayout,letterSpacing:10}),m=design(s);checkMesh(m);assert.equal(m.bounds.maxY,57);assert.equal(m.valid,true);assert.deepEqual(design(decode('?'+encode(s))).vertices,m.vertices);
  const bore=m.loops.find(l=>l.every(([x,y])=>Math.abs(x)<=2.001&&Math.abs(y-53)<=2.001));assert.ok(bore);
 }
 for(const diameter of [40,245])for(const branch of [1.2,4])checkMesh(design({mode:'text',font:'lato',text:'GEORGE',diameter,branch,textLayout:'single',textSize:140,textPosition:-2,letterSpacing:20,printer:'a1'}));
 assert.notDeepEqual(design({mode:'text',font:'lato',text:'GEORGE',textLayout:'single'}).vertices,design({mode:'text',font:'lato',text:'GEORGE',textLayout:'mirrored'}).vertices);
 assert.throws(()=>settings({textLayout:'bad'}));assert.throws(()=>settings({letterSpacing:41}));
});

test('flowing name snowflakes retain six arms, fixed ring and connected watertight geometry',()=>{
 for(const font of ['montecarlo','niconne'])for(const text of ['GEORGE','Melissa','Ella',"O'Neil",'Joy','Ghijkl'])for(const textWeight of [.5,.8]){
  const m=design({mode:'text',font,text,textLayout:'flowing',textWeight,textSize:110});checkMesh(m);assert.equal(m.bounds.maxY,57);assert.equal(m.valid,true);
  const bore=m.loops.find(l=>l.every(([x,y])=>Math.abs(x)<=2.001&&Math.abs(y-53)<=2.001));assert.ok(bore);
 }
 for(const diameter of [40,245])checkMesh(design({mode:'text',text:'George',font:'montecarlo',textLayout:'flowing',diameter,textSize:150,textPosition:-10,printer:'a1'}));
 const s=settings({mode:'text',text:'GEORGE',font:'montecarlo',textLayout:'flowing',textWeight:.6});assert.equal(s.text,'George');assert.deepEqual(decode('?'+encode(s)),s);assert.deepEqual(design(s).vertices,design(decode('?'+encode(s))).vertices);assert.throws(()=>settings({textWeight:.1}));
});

test('recommended ornamental fonts keep text-test words connected and printable',()=>{
 for(const font of ['courgette','berkshireswash'])for(const text of ['text test','George','Abcdef','Ghijkl',"O'Neil"]){
  const s=settings({mode:'text',font,text,textLayout:'flowing',textWeight:.65,textSize:110}),m=design(s);checkMesh(m);assert.equal(m.valid,true);assert.equal(m.bounds.maxY,57);assert.deepEqual(design(decode('?'+encode(s))).vertices,m.vertices);
 }
 for(const font of ['courgette','berkshireswash'])for(const diameter of [40,245])for(const textWeight of [.5,1.2])checkMesh(design({mode:'text',font,text:'text test',textLayout:'flowing',diameter,textWeight,printer:'a1'}));
});

test('alternating text and branch layouts preserve connectedness, fixed bore and links',async()=>{
 const {batchSettings}=await import('../snowflake/src/batch.js');
 const base={mode:'text',armLayout:'alternating',text:'text test',textLayout:'flowing',textSize:110,textWeight:.65,branch:1.2,complexity:6,fullness:80,pattern:'open'};
 for(const font of ['courgette','berkshireswash','stroke'])for(const diameter of [40,100,245]){
  const s=settings({...base,font,diameter,printer:'a1'}),m=design(s);checkMesh(m);assert.equal(m.bounds.maxY,diameter/2+7);
  const cy=diameter/2+3,bore=m.loops.find(l=>l.every(([x,y])=>Math.abs(x)<=2.001&&Math.abs(y-cy)<=2.001));assert.ok(bore);
  assert.deepEqual(decode('?'+encode(s)),s);assert.deepEqual(design(decode('?'+encode(s))).vertices,m.vertices);
  if(m.valid){assert.ok(exportStl(m).length);assert.equal(JSON.parse(projectFiles(m)['Metadata/snowflake.json']).settings.armLayout,'alternating');}
 }
 const a=design({...base,font:'courgette'}),b=design({...base,font:'courgette',armLayout:'all'});assert.notDeepEqual(a.vertices,b.vertices);
 const variants=batchSettings({...base,font:'courgette'},24);assert.ok(variants.every(s=>s.armLayout==='alternating'));
 assert.throws(()=>settings({armLayout:'bad'}));assert.equal(decode('?v=1&seed=winter-2026').armLayout,'all');
});

test('extended complexity creates connected watertight hierarchical branches at size extremes',()=>{
 for(const complexity of [10,12,15,16,18])for(const diameter of [40,100,245])for(const pattern of ['open','mixed','lattice']){
  const m=design({seed:`crystal-${diameter}`,complexity,diameter,branch:diameter===40?4:1.2,pattern,fullness:60,printer:'a1'});checkMesh(m);assert.equal(m.bounds.maxY,diameter/2+7);
 }
 for(const mode of ['prompt','text']){
  const s=settings({mode,armLayout:'alternating',font:'courgette',textLayout:'flowing',text:mode==='prompt'?'full fern':'text test',complexity:18,branch:1.2}),m=design(s);checkMesh(m);assert.deepEqual(design(decode('?'+encode(s))).vertices,m.vertices);
 }
 const low=design({complexity:9,branch:1.2}),mid=design({complexity:12,branch:1.2}),high=design({complexity:18,branch:1.2});assert.ok(mid.faces.length>low.faces.length);assert.ok(high.faces.length>mid.faces.length);assert.throws(()=>settings({complexity:19}));
});

test('centre styles and seeded random choices produce connected closed ornaments',async()=>{
 const {centreChoices}=await import('../snowflake/src/centre.js');
 for(const centre of centreChoices)for(const diameter of [40,100,245]){
  const m=design({centre,diameter,branch:diameter===40?4:1.2,centreSize:diameter===40?10:30,complexity:12,printer:'a1'});checkMesh(m);assert.equal(m.centreKind,centre);assert.equal(m.bounds.maxY,diameter/2+7);
  const cy=diameter/2+3,bore=m.loops.find(l=>l.every(([x,y])=>Math.abs(x)<=2.001&&Math.abs(y-cy)<=2.001));assert.ok(bore);
 }
 for(const centre of centreChoices){const s=settings({centre,mode:'text',armLayout:'alternating',font:'courgette',textLayout:'flowing',text:'text test',centreSize:30}),m=design(s);checkMesh(m);assert.deepEqual(design(decode('?'+encode(s))).vertices,m.vertices);}
 const kinds=new Set();for(let i=0;i<24;i++){const s=settings({seed:`centre-${i}`}),m=design(s);kinds.add(m.centreKind);assert.equal(design({...s,complexity:15}).centreKind,m.centreKind);}assert.ok(kinds.size>=6);
 assert.equal(defaults.centre,'random');assert.equal(decode('').centre,'random');assert.equal(decode('?v=1&seed=winter-2026').centre,'original');assert.throws(()=>settings({centre:'bad'}));assert.throws(()=>settings({centreSize:31}));
});

test('airy growth reproduces the prototype and remains connected at printer-size extremes',async()=>{
 for(const diameter of [40,100,245])for(const branch of [1.2,2,4])for(const complexity of [6,12,18]){
  const m=design({growth:'airy',seed:`airy-${diameter}-${branch}`,diameter,branch,complexity,fullness:100,centre:'hex-frame',printer:'a1'});checkMesh(m);assert.equal(m.bounds.maxY,diameter/2+7);
 }
 for(const mode of ['prompt','text']){
  const s=settings({growth:'airy',mode,text:mode==='prompt'?'full fern':'text test',armLayout:'alternating',font:'courgette',textLayout:'flowing',complexity:18,fullness:100,branch:1.2}),m=design(s);checkMesh(m);assert.deepEqual(decode(encode(s)),s);assert.deepEqual(design(decode(encode(s))).vertices,m.vertices);assert.equal(JSON.parse(projectFiles(m)['Metadata/snowflake.json']).settings.growth,'airy');
 }
 assert.equal(decode('?v=1&seed=winter-2026').growth,'original');assert.throws(()=>settings({growth:'invalid'}));
});
test('airy fullness spreads material over a wider footprint instead of filling the same arms',()=>{
 const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2);
 const footprint=m=>{const points=m.loops.flat().filter(([x,y])=>Math.hypot(x,y)<=50.5).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lower=[],upper=[];for(const p of points){while(lower.length>=2&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}for(const p of points.slice().reverse()){while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}return area(lower.slice(0,-1).concat(upper.slice(0,-1)));};
 const material=m=>area(m.loops[0])-m.loops.slice(1).reduce((s,p)=>s+area(p),0),s={seed:'winter-2026',silhouette:'rounded',complexity:18,branch:1.2,fullness:100,centre:'hex-frame',pattern:'open'},old=design({...s,growth:'original'}),airy=design({...s,growth:'airy'});
 assert.ok(footprint(airy)>footprint(old)*1.1);assert.ok(material(airy)/footprint(airy)<material(old)/footprint(old)*.9);
});

 test('airy outline families are distinct, reproducible and watertight',async()=>{
 const {resolveSilhouette}=await import('../snowflake/src/airy-growth.js');
 const choices=['star','fern','crystal','rounded'],outlines=[];
 for(const silhouette of choices){
  for(const [diameter,branch] of [[40,4],[100,1.2],[245,1.2]]){
   const s=settings({growth:'airy',silhouette,seed:'outline-check',complexity:18,fullness:100,diameter,branch,printer:'a1'}),m=design(s);
   checkMesh(m);assert.deepEqual(design(decode(encode(s))).vertices,m.vertices);
   if(diameter===100)outlines.push(JSON.stringify(m.loops));
  }
 }
 assert.equal(new Set(outlines).size,4);
 assert.deepEqual([.01,.3,.6,.99].map(n=>resolveSilhouette('random',Array(100).fill(n))),choices);
 });
 test('new airy centre connectors match selected branch width',async()=>{
 const {centrePlan}=await import('../snowflake/src/centre.js');
 for(const branch of [1.2,2,4])for(const choice of ['star-frame','hex-frame','rosette','web']){
  const plan=centrePlan({choice,radius:9,branch,slots:Array(100).fill(.5),matched:true});
  assert.equal(plan.joinWidth,branch);
  checkMesh(design({growth:'airy',silhouette:'star',centre:choice,branch,complexity:18,fullness:100}));
 }
 });

test('reference crystal families remain distinct, closed and connected across settings',async()=>{
 const {crystalFamilies}=await import('../snowflake/src/crystal-arms.js');
 const outlines=[];
 for(const silhouette of crystalFamilies){
  for(const [diameter,branch] of [[40,4],[40,1.2],[100,1.2],[100,4],[245,1.2]])for(const complexity of [1,6,12,18]){
   const s=settings({growth:'airy',silhouette,seed:'reference-family',diameter,branch,complexity,fullness:100,centre:'random',printer:'a1'}),m=design(s);
   checkMesh(m);assert.equal(m.bounds.maxY,diameter/2+7);
   if(diameter===100&&branch===1.2&&complexity===12){outlines.push(JSON.stringify(m.loops));assert.deepEqual(design(decode(encode(s))).vertices,m.vertices);}
  }
  const s=settings({growth:'airy',silhouette,mode:'text',font:'courgette',text:'text test',textLayout:'flowing',armLayout:'alternating',complexity:12,branch:1.2});checkMesh(design(s));
 }
 assert.equal(new Set(outlines).size,crystalFamilies.length);
});
test('expanded random covers all nine families without changing old random recipes',async()=>{
 const {allSilhouettes,resolveSilhouette}=await import('../snowflake/src/airy-growth.js');
 assert.equal(defaults.silhouette,'random');
 assert.deepEqual(allSilhouettes.map((_,i)=>resolveSilhouette('random-all',Array(100).fill((i+.5)/9))),allSilhouettes);
 const old=decode('?d=AwALd2ludGVyLTIwMjaEwBcFACQB8AEAyAEBAVpx');assert.equal(old.silhouette,'random');
 assert.deepEqual(decode(encode(old)),old);
 for(const choice of allSilhouettes)assert.equal(resolveSilhouette(choice,Array(100).fill(.5)),choice);
});
test('default Airy example retains the fuller approved geometry',async()=>{
 const {createHash}=await import('node:crypto');
 const m=design({...defaults,growth:'airy',seed:'winter-2026',complexity:18,branch:1.2,fullness:100,centre:'hex-frame',centreSize:18,pattern:'open'});
 assert.equal(m.s.silhouette,'random');
 assert.equal(createHash('sha256').update(new Uint8Array(m.vertices.buffer)).update(new Uint8Array(m.faces.buffer)).digest('hex'),'e7e1c9f741c338b5b993ac719905adb47c44929b6e6988fe9101b40c8e4c4762');
});

test('every crystal family gains printable detail at higher complexity',async()=>{
 const {crystalFamilies}=await import('../snowflake/src/crystal-arms.js');
 for(const silhouette of crystalFamilies){
  const s={growth:'airy',silhouette,seed:'winter-2026',branch:1.2,fullness:100,centre:'hex-frame'};
  const low=design({...s,complexity:3}),high=design({...s,complexity:18});
  assert.ok(high.faces.length>low.faces.length,`${silhouette} must gain detail`);checkMesh(high);
 }
});
test('natural workshop families export closed connected meshes across seeds and dimensions',()=>{
 for(const naturalStyle of ['random','stellar','fern','plate'])for(const [diameter,branch] of [[40,4],[100,1.6],[245,1.2]])for(const complexity of [1,5,18]){
  const s=settings({growth:'natural',naturalStyle,seed:`natural-${naturalStyle}-${complexity}`,diameter,branch,complexity,fullness:complexity===1?0:100,printer:'a1'}),m=design(s);
  checkMesh(m);assert.equal(m.bounds.maxY,diameter/2+7);assert.deepEqual(design(decode(encode(s))).vertices,m.vertices);
 }
 for(const centre of ['star-frame','hex-frame','rosette','web'])checkMesh(design({growth:'natural',centre,complexity:18,fullness:100,branch:1.2}));
});
test('Airy is the new default and open text presets remain connected printable meshes',()=>{
 assert.equal(defaults.growth,'airy');
 for(const armLayout of ['all','alternating'])for(const font of ['courgette','berkshireswash','lato','breeserif']){
  const s=settings({mode:'text',growth:'airy',font,text:['lato','breeserif'].includes(font)?'Snow':'Text Test',armLayout,textLayout:['lato','breeserif'].includes(font)?'single':'flowing',textWeight:.55,letterSpacing:15,textSize:100,branch:1.2});
  const m=design(s);checkMesh(m);assert.equal(m.valid,true);assert.deepEqual(design(decode(encode(s))).vertices,m.vertices);
 }
});

test('centre text is a connected printable bridge with six branch joins and preserved counters',async()=>{
 for(const centreFont of ['lato','breeserif'])for(const centreText of ['TEXT','LOVE','Julia','2026','A-B'])for(const growth of ['airy','natural','original']){
  const s=settings({centre:'text',centreText,centreFont,growth,centreSize:24,branch:1.2}),m=design(s);checkMesh(m);assert.equal(m.valid,true);assert.equal(m.s.centre,'text');assert.ok(['hex-frame','ring'].includes(m.centreKind));assert.deepEqual(design(decode(encode(s))).vertices,m.vertices);
 }
 for(const [diameter,branch,centreSize]of [[40,4,10],[245,1.2,30]]){const m=design({centre:'text',centreText:'LOVE',diameter,branch,centreSize,printer:'a1'});checkMesh(m);assert.equal(m.bounds.maxY,diameter/2+7);}
 const small=design({centre:'text',centreText:'LONG CENTRE',diameter:40,centreSize:10});assert.equal(small.valid,false);assert.equal(small.issue,'centreText');assert.throws(()=>exportStl(small));assert.throws(()=>export3mf(small));
 assert.throws(()=>settings({centre:'text',centreText:''}));assert.throws(()=>settings({centre:'text',centreText:'bad/text'}));
});
test('all six connected centre fonts keep script details and one closed printable mesh',async()=>{
 const {centreTextFonts}=await import('../snowflake/src/centre-text.js');assert.equal(centreTextFonts.length,6);
 for(const centreFont of centreTextFonts)for(const centreText of ['Love','Julia']){
  const s=settings({centre:'text',centreText,centreFont,centreSize:24,branch:1.2}),m=design(s);checkMesh(m);assert.equal(m.valid,true);assert.deepEqual(design(decode(encode(s))).vertices,m.vertices);
 }
});

test('direct centre-letter joins are connected printable words without the support bar',async()=>{
 const {centreTextFonts}=await import('../snowflake/src/centre-text.js');
 for(const centreFont of centreTextFonts)for(const centreText of ['TEXT','Text','Julia','A-B','O\'Neil','A B']){
  const s=settings({centre:'text',centreText,centreFont,centreJoin:'letters',centreSize:30,branch:1.2}),m=design(s);checkMesh(m);assert.equal(m.valid,true);assert.deepEqual(design(decode(encode(s))).vertices,m.vertices);
 }
 assert.equal(defaults.centreJoin,'open-random');
});
