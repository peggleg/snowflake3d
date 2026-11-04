import {test} from 'node:test';
import assert from 'node:assert/strict';
import ClipperLib from 'clipper-lib';
import {design,encode,decode} from '../snowflake/src/design.js';
import {projectFiles,exportStl,export3mf} from '../snowflake/src/export.js';
import {framedTextPlan} from '../snowflake/src/framed-text.js';
import {textCentrePlan,centreTextFonts} from '../snowflake/src/centre-text.js';
function volume(m){let v=0;for(let i=0;i<m.faces.length;i+=3){const [a,b,c]=Array.from(m.faces.slice(i,i+3),j=>Array.from(m.vertices.slice(j*3,j*3+3)));v+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;}return v;}
function closed(m){const edges=new Map(),used=new Set();for(let i=0;i<m.faces.length;i+=3){const ids=Array.from(m.faces.slice(i,i+3));assert.equal(new Set(ids).size,3);const [a,b,c]=ids.map(j=>Array.from(m.vertices.slice(j*3,j*3+3))),u=b.map((n,j)=>n-a[j]),v=c.map((n,j)=>n-a[j]);assert.ok(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])>1e-10,'nondegenerate faces');for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(':');const e=edges.get(key)||[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);used.add(a);}}for(const [n,d]of edges.values()){assert.equal(n,2,'closed part');assert.equal(d,0,'oriented part');}assert.equal(used.size,m.vertices.length/3);assert.ok(volume(m)>0);}
const int=loops=>loops.map(l=>l.map(([x,y])=>({X:Math.round(x*10000),Y:Math.round(y*10000)})));
function intersectionArea(a,b){const c=new ClipperLib.Clipper(),out=[];c.AddPaths(a,ClipperLib.PolyType.ptSubject,true);c.AddPaths(b,ClipperLib.PolyType.ptClip,true);c.Execute(ClipperLib.ClipType.ctIntersection,out,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);return Math.abs(out.reduce((s,p)=>s+ClipperLib.Clipper.Area(p),0))/1e8;}
test('AMS partitions only the centre glyphs into two closed non-overlapping materials',()=>{
 for(const centreFont of centreTextFonts)for(const armLayout of ['all','alternating']){
  const s={centre:'text',centreText:'Love',centreSize:24,centreFont,centreAms:'on',mainColour:'#FFFFFF',centreColour:'#D94A64',mode:'text',text:'Joy',font:'courgette',textLayout:'flowing',armLayout,branch:1.2};
  const m=design(s),plain=design({...s,centreAms:'off'});assert.equal(m.valid,true);assert.equal(m.parts.length,2);for(const p of m.parts)closed(p);
  assert.deepEqual(m.vertices,plain.vertices);assert.deepEqual(m.faces,plain.faces);assert.deepEqual(exportStl(m),exportStl(plain));
  const sum=m.parts.reduce((v,p)=>v+volume(p),0);assert.ok(Math.abs(sum-volume(m))<1e-3,'same material volume within the integer-grid tolerance');assert.ok(intersectionArea(int(m.parts[0].loops),int(m.parts[1].loops))<1e-8,'no overlapping colours');
  const plan=framedTextPlan({text:m.s.centreText,font:centreFont,style:m.s.centreJoin,radius:12,branch:1.2,slots:Array(100).fill(.3)}),colouredArea=volume(m.parts[1])/m.s.thickness;
  const offset=new ClipperLib.ClipperOffset(2,.25),allowed=[];offset.AddPaths(plan.letterPaths,ClipperLib.JoinType.jtRound,ClipperLib.EndType.etClosedPolygon);offset.Execute(allowed,4);
  assert.ok(Math.abs(intersectionArea(int(m.parts[1].loops),allowed)-colouredArea)<1e-5,'colour confined to glyphs within the integer-grid tolerance');
  for(let i=0;i<m.parts[1].vertices.length;i+=3)assert.ok(Math.hypot(m.parts[1].vertices[i],m.parts[1].vertices[i+1])<12,'no branch lettering in colour 2');
  assert.deepEqual(decode(encode(m.s)),m.s);
 }
});
test('Bambu project is one aligned object with two named filament-assigned parts',()=>{
 for(const printer of ['mini','a1']){const m=design({centre:'text',centreText:'LOVE',centreSize:24,centreAms:'on',mainColour:'#AABBCC',centreColour:'#FF0022',printer}),files=projectFiles(m),config=JSON.parse(files['Metadata/project_settings.config']),model=files['3D/3dmodel.model'],metadata=files['Metadata/model_settings.config'];
  assert.deepEqual(config.filament_colour,['#AABBCC','#FF0022']);assert.equal(config.filament_settings_id.length,2);assert.equal(config.filament_type.length,2);assert.equal(config.nozzle_temperature.length,2);assert.equal(config.fan_max_speed.length,2);assert.equal(config.nozzle_diameter.length,1,'one physical nozzle');assert.equal(config.single_extruder_multi_material,'1');assert.equal(config.enable_prime_tower,'1');assert.equal(config.sparse_infill_density,'8%');assert.equal(config.wall_loops,'2');
  assert.match(model,/<object id="3" type="model"><components>/);assert.equal((model.match(/<component objectid=/g)||[]).length,2);assert.equal((model.match(/<item objectid=/g)||[]).length,1);assert.match(model,/<item objectid="3"/);assert.match(metadata,/<part id="1"[^]*?key="extruder" value="1"/);assert.match(metadata,/<part id="2"[^]*?key="name" value="Centre text only"[^]*?key="extruder" value="2"/);assert.ok(export3mf(m).length>1000);
 }
});
test('AMS is opt-in, inactive without centre text, and existing projects stay single-filament',()=>{
 for(const s of [{},{centre:'text',centreText:'LOVE',centreSize:24},{centre:'hex-frame',centreAms:'on'}]){const m=design(s);assert.equal(m.parts,null);assert.deepEqual(JSON.parse(projectFiles(m)['Metadata/project_settings.config']).filament_colour,['#FFFFFF']);}
 assert.equal(decode('?d=BgALd2ludGVyLTIwMjYAO64').centreAms,'off');
});
test('AMS material separation stays closed across body sizes, branch widths and thicknesses',()=>{
 for(const [diameter,branch,thickness,centreSize]of [[40,1.2,1,30],[100,4,8,30],[245,1.2,3,24]])for(const centreFont of ['lato','courgette','montecarlo']){
  const m=design({centre:'text',centreText:diameter===40?'A':'2026',centreFont,centreSize,centreAms:'on',diameter,branch,thickness,printer:'a1'});assert.equal(m.valid,true);for(const p of m.parts)closed(p);assert.ok(Math.abs(m.parts.reduce((v,p)=>v+volume(p),0)-volume(m))<.01);
 }
});
test('AMS parts stay closed with joined crystal frames',()=>{
 for(const silhouette of ['hex-tips','plates','leaves']){const m=design({centre:'text',centreText:'LOVE',centreSize:24,centreAms:'on',silhouette,growth:'airy',complexity:18,fullness:100,branch:1.2});assert.equal(m.valid,true);for(const p of m.parts)closed(p);assert.ok(Math.abs(m.parts.reduce((v,p)=>v+volume(p),0)-volume(m))<1e-3);}
});

test('solid and open text centres export closed AMS parts and reproduce saved recipes',()=>{
 for(const centreJoin of ['solid-random','solid-hex','solid-circle','open-random','open-hex','open-circle'])for(const centreFont of centreTextFonts)for(const centreText of ['Xmas','Love','A B']){
  const m=design({centre:'text',centreJoin,centreFont,centreText,centreSize:26,centreAms:'on',seed:'frame-tests',branch:1.6});
  assert.equal(m.valid,true);closed(m);for(const p of m.parts)closed(p);
  assert.ok(Math.abs(m.parts.reduce((v,p)=>v+volume(p),0)-volume(m))<.001);
  assert.deepEqual(decode(encode(m.s)),m.s);assert.ok(export3mf(m).length>1000);
 }
 const solid=design({centre:'text',centreJoin:'solid-hex',centreSize:26});assert.equal(solid.s.centreAms,'on');
 const open=design({centre:'text',centreJoin:'open-hex',centreSize:26});assert.equal(open.s.centreAms,'off');assert.equal(open.parts,null);
});

test('open framed words leave clear space below the letters without a support beam',()=>{
 for(const style of ['open-hex','open-circle']){
  const p=framedTextPlan({text:'Xmas',font:'courgette',radius:13,branch:1.6,style,slots:Array(100).fill(.3)});
  const bottom=Math.min(...p.letterPaths.flat().map(v=>v.Y))/10000;
  const gap=int([[[-6,bottom-.8],[6,bottom-.8],[6,bottom-.3],[-6,bottom-.3]]]);
  assert.equal(intersectionArea(p.paths,gap),0,'no material under the word');
 }
});
test('framed AMS parts repair fine branch point contacts across seeded crystal families',()=>{
 for(let i=0;i<8;i++)for(const centreJoin of ['solid-random','open-random']){
  const m=design({seed:'frame-seed-'+i,centre:'text',centreJoin,centreText:'Xmas',centreFont:'courgette',centreSize:26,centreAms:'on',silhouette:['fern','hex-tips','random','plates'][i%4],complexity:10,fullness:50});
  closed(m);m.parts.forEach(closed);assert.ok(Math.abs(m.parts.reduce((s,p)=>s+volume(p),0)-volume(m))<.001);
 }
});

test('raised text is a closed stepped solid with optional aligned AMS parts',()=>{
 for(const centreJoin of ['raised-random','raised-hex','raised-circle'])for(const centreFont of centreTextFonts)for(const centreAms of ['off','on']){
  const m=design({centre:'text',centreJoin,centreFont,centreText:'Xmas',centreSize:26,centreAms});assert.equal(m.valid,true);closed(m);
  const adj=new Map();for(let i=0;i<m.faces.length;i+=3)for(let j=0;j<3;j++){const a=m.faces[i+j],b=m.faces[i+(j+1)%3];if(!adj.has(a))adj.set(a,[]);adj.get(a).push(b);}const seen=new Set(),stack=[0];while(stack.length){const a=stack.pop();if(seen.has(a))continue;seen.add(a);stack.push(...adj.get(a));}assert.equal(seen.size,m.vertices.length/3,'one connected stepped surface');
  const z=Array.from(m.vertices).filter((_,i)=>i%3===2);assert.equal(Math.min(...z),0);assert.equal(Math.max(...z),3.6);
  assert.deepEqual(decode(encode(m.s)),m.s);assert.ok(exportStl(m).length>1000);assert.ok(export3mf(m).length>1000);
  if(centreAms==='on'){m.parts.forEach(closed);assert.ok(Math.abs(m.parts.reduce((s,p)=>s+volume(p),0)-volume(m))<.001);const textZ=Array.from(m.parts[1].vertices).filter((_,i)=>i%3===2);assert.equal(Math.min(...textZ),3);assert.equal(Math.max(...textZ),3.6);}else assert.equal(m.parts,null);
 }
});
