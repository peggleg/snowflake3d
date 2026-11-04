import {test} from 'node:test';
import assert from 'node:assert/strict';
import {design,decode} from '../snowflake/src/design.js';
import {exportArchive} from '../snowflake/src/archive.js';
function entries(bytes){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),out={};let i=0;while(view.getUint32(i,true)===0x04034b50){const n=view.getUint16(i+26,true),extra=view.getUint16(i+28,true),length=view.getUint32(i+18,true),name=new TextDecoder().decode(bytes.slice(i+30,i+30+n)),start=i+30+n+extra;out[name]=bytes.slice(start,start+length);i=start+length;}return out;}
test('ZIP supports 1, 2 and 24 ornaments in each requested export format',async()=>{
 const base=design({seed:'../../same seed',centre:'text',centreText:'LOVE',centreSize:24,complexity:1}),other=design({seed:'other',complexity:1});
 for(const count of [1,2,24])for(const format of ['stl','3mf','both']){
  const meshes=Array.from({length:count},(_,i)=>i%2?other:base),progress=[],files=entries(await exportArchive(meshes,{format,origin:'https://example.test',onProgress:i=>progress.push(i)})),manifest=JSON.parse(new TextDecoder().decode(files['designs.json']));
  assert.equal(manifest.designs.length,count);assert.equal(Object.keys(files).filter(n=>n.endsWith('.stl')).length,format==='3mf'?0:count);assert.equal(Object.keys(files).filter(n=>n.endsWith('.3mf')).length,format==='stl'?0:count);assert.equal(progress.length,count);assert.match(new TextDecoder().decode(files['README.txt']),/without printer, process or filament profiles/);
  for(const [i,item]of manifest.designs.entries()){
   assert.deepEqual(decode(new URL(item.url).search),meshes[i].s);
   for(const name of item.files){assert.ok(!name.includes('/'));const data=files[name];assert.ok(data);if(name.endsWith('.stl'))assert.equal(data.length,84+new DataView(data.buffer,data.byteOffset,data.byteLength).getUint32(80,true)*50);else{const inner=entries(data);assert.ok(inner['3D/3dmodel.model']);assert.ok(!inner['Metadata/project_settings.config']);assert.ok(inner['Metadata/model_settings.config']);assert.ok(!/machine_start_gcode|filament_settings_id/.test(new TextDecoder().decode(data)));}}
  }
 }
});
test('ZIP rejects empty, oversized or invalid collections before producing files',async()=>{
 const m=design({complexity:1}),bad=design({diameter:245});let called=false;
 await assert.rejects(exportArchive([]));await assert.rejects(exportArchive(Array(25).fill(m)));await assert.rejects(exportArchive([m],{format:'pdf'}));await assert.rejects(exportArchive([m,bad],{onProgress:()=>{called=true;}}));assert.equal(called,false);
});
