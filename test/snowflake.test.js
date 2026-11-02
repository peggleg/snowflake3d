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
test('mesh is one watertight solid across seed, pattern and size extremes',()=>{for(let i=0;i<24;i++)for(const pattern of ['mixed','open','lattice'])checkMesh(design({seed:`test-${i}`,diameter:i%2?40:245,thickness:i%2?1:8,branch:i%2?4:1.2,complexity:i%9+1,pattern,printer:'a1'}));});
test('hanging bore stays 4 mm and ring reaches exactly R+7 across sizes',()=>{for(const diameter of [40,100,245]){const m=design({diameter,printer:'a1'});assert.equal(m.bounds.maxY,diameter/2+7);const bore=m.loops.find(l=>l.every(([x,y])=>Math.abs(x)<=2.001&&Math.abs(y-(diameter/2+3))<=2.001));assert.ok(bore);assert.equal(Math.max(...bore.map(p=>p[0]))-Math.min(...bore.map(p=>p[0])),4);}});
test('actual bounds including ring enforce printer margin and block both exports',()=>{const m=design({diameter:245});assert.equal(m.valid,false);assert.throws(()=>exportStl(m));assert.throws(()=>export3mf(m));assert.equal(design({diameter:245,printer:'a1'}).valid,true);assert.throws(()=>settings({diameter:NaN}));assert.throws(()=>settings({printer:'x'}));});
test('STL length and complete project archive settings',()=>{const m=design(defaults),bytes=exportStl(m);assert.equal(bytes.length,84+m.faces.length/3*50);assert.equal(new DataView(bytes.buffer).getUint32(80,true),m.faces.length/3);for(const printer of ['mini','a1']){const files=projectFiles(design({printer})),p=JSON.parse(files['Metadata/project_settings.config']);assert.equal(p.sparse_infill_pattern,'gyroid');assert.equal(p.sparse_infill_density,'8%');assert.equal(p.wall_loops,'2');assert.equal(p.top_shell_layers,'3');assert.equal(p.bottom_shell_layers,'3');assert.equal(p.top_shell_thickness,'0');assert.equal(p.bottom_shell_thickness,'0');assert.ok(p.machine_start_gcode);assert.ok(p.machine_end_gcode);assert.ok(Object.keys(p).length>400);assert.ok(files['Metadata/model_settings.config']);assert.ok(files['3D/3dmodel.model'].includes('transform='));assert.equal(new DataView(export3mf(m).buffer).getUint32(0,true),0x04034b50);}});

test('batch generation provides 24 unique reproducible seeds and preserves shared settings',async()=>{
 const {batchSettings}=await import('../snowflake/src/batch.js');
 const batch=batchSettings(defaults,24);
 assert.equal(batch.length,24);assert.equal(new Set(batch.map(s=>s.seed)).size,24);
 assert.deepEqual(batchSettings(defaults,24),batch);
 for(const s of batch){assert.equal(s.diameter,100);assert.equal(s.thickness,3);assert.equal(design(s).valid,true);}
 assert.deepEqual(batchSettings(defaults,1),[defaults]);
 for(const count of [0,25,1.5,NaN])assert.throws(()=>batchSettings(defaults,count));
});
