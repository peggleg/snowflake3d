import {exportStl,export3mf} from './export.js';
import {encode} from './design.js';
import {zipSync,strToU8} from './zip.js';
export async function exportArchive(meshes,{format='both',origin='',onProgress=()=>{}}={}){
 if(!Array.isArray(meshes)||meshes.length<1||meshes.length>24)throw Error('Choose 1–24 snowflakes to download.');
 if(!['both','stl','3mf'].includes(format))throw Error('Choose STL, 3MF or both.');
 const bad=meshes.findIndex(m=>!m.valid);if(bad>=0)throw Error(`Snowflake ${bad+1} cannot be exported. Fix its text size or build-plate fit first.`);
 const files={},manifest=[];
 for(let i=0;i<meshes.length;i++){
  onProgress(i+1,meshes.length);await new Promise(resolve=>setTimeout(resolve,0));
  const m=meshes[i],name=`${String(i+1).padStart(2,'0')}-snowflake-${m.s.seed.replace(/[^a-z0-9_-]/gi,'_').slice(0,48)}`,names=[];
  if(format!=='3mf'){files[name+'.stl']=exportStl(m);names.push(name+'.stl');}
  if(format!=='stl'){files[name+'.3mf']=export3mf(m);names.push(name+'.3mf');}
  manifest.push({number:i+1,files:names,settings:m.s,url:`${origin}/snowflake?${encode(m.s)}`});
 }
 files['designs.json']=strToU8(JSON.stringify({units:'millimetres',designs:manifest},null,2));
 files['README.txt']=strToU8('Snowflake Workshop\n\nEach numbered ornament is a separate design. STL files contain geometry only. Open each 3MF as a separate Bambu Studio project, check the plate, then slice. The ZIP does not combine ornaments on one plate.\n\nDesign settings and share links are in designs.json.\n');
 return zipSync(files);
}
