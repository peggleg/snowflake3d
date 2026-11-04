// Experimental export only. Not imported by the website or production exporter.
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {design} from '../snowflake/src/design.js';
import {projectFiles} from '../snowflake/src/export.js';
import {zipSync,strToU8} from '../snowflake/src/zip.js';

const out=resolve(process.argv[2]||'/workspace/snowflake3d-test-downloads');
const samples=[
 ['01-plain-snowflake',{}],
 ['02-flush-ams-text',{centre:'text',centreText:'Xmas',centreJoin:'solid-hex',centreAms:'on'}],
 ['03-open-ams-text',{centre:'text',centreText:'Xmas',centreJoin:'open-hex',centreAms:'on',centreFont:'courgette'}],
 ['04-raised-ams-text',{centre:'text',centreText:'Xmas',centreJoin:'raised-hex',centreAms:'on'}],
];
await mkdir(out,{recursive:true});const archive={},report=[];
for(const [name,settings]of samples){
 const m=design({seed:'profile-free-import-test',centreSize:30,mainColour:'#FFFFFF',centreColour:'#D94A64',...settings});
 assert.ok(m.valid);
 const files=projectFiles(m);
 // Confirm exact source mesh coordinates/faces survive serialization, for each part.
 const parts=m.parts||[m],model=files['3D/3dmodel.model'];
 const objects=[...model.matchAll(/<object id="\d+"[^>]*><mesh><vertices>(.*?)<\/vertices><triangles>(.*?)<\/triangles><\/mesh><\/object>/g)];
 assert.equal(objects.length,parts.length);
 objects.forEach((o,i)=>{
  assert.deepEqual([...o[1].matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].flatMap(v=>v.slice(1).map(Number)),Array.from(parts[i].vertices,n=>n===0?0:n));
  assert.deepEqual([...o[2].matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"\/>/g)].flatMap(v=>v.slice(1).map(Number)),Array.from(parts[i].faces));
 });
 assert.ok(!Object.hasOwn(files,'Metadata/project_settings.config'));
 assert.ok(!/machine_start_gcode|machine_end_gcode|filament_settings_id|printer_settings_id/.test(Object.values(files).join('')));
 const bytes=zipSync(Object.fromEntries(Object.entries(files).map(([k,v])=>[k,strToU8(v)])));
 archive[name+'.3mf']=bytes;await writeFile(resolve(out,name+'.3mf'),bytes);
 report.push({file:name+'.3mf',bytes:bytes.length,parts:parts.length,triangles:parts.map(p=>p.faces.length/3),geometryRoundTrip:'exact',validSourceMesh:m.valid});
}
const readme=`PROFILE-FREE 3MF IMPORT TEST — NOT THE LIVE EXPORT\n\nThese four files contain geometry, standard material colours and named part/extruder assignments. They contain no Bambu printer, process or filament profiles, no machine G-code and no project_settings.config.\n\nIn Bambu Studio:\n1. Select your printer/nozzle and 0.20 mm Standard process. For files 02–04, add two filament slots before importing (white body, pink text).\n2. Open each file separately. Record any warnings and whether your selected printer/process stay selected. If prompted about import mode, record the wording and chosen mode.\n3. Check the Objects list: file 01 should be one object/one part; files 02–04 one object/two parts (body and centre text only). Check centre text is assigned to filament 2; record if you must assign it manually.\n4. Confirm both parts remain aligned. File 02 has flush letters, 03 an open frame, 04 letters raised by 0.6 mm.\n5. Slice and inspect Preview: body on filament 1, only centre letters on filament 2, no floating parts. For raised text, confirm the colour appears only at the top letter layers. Check printer/material-appropriate settings before printing.\n\nPass: printer/process preserved or selectable, dimensions unchanged, aligned parts, correct assignments, successful slice. No print is needed for this first check.\n\nInternal checks confirm exact mesh serialization and absence of embedded profiles/G-code. Actual Bambu Studio import/slice remains to be tested; colour import without project settings is intentionally under evaluation.\n`;
archive['README.txt']=strToU8(readme);archive['internal-checks.json']=strToU8(JSON.stringify(report,null,2));
await writeFile(resolve(out,'README.txt'),readme);
await writeFile(resolve(out,'profile-free-3mf-test.zip'),zipSync(archive));
console.log(JSON.stringify({directory:out,checks:report},null,2));
