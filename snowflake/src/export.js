import {geometryProjectFiles} from './ams-project.js';
import {zipSync,strToU8} from './zip.js';
import {stlBytes} from './stl.js';
import {printers,encode} from './design.js';
export function exportStl(mesh){if(!mesh.valid)throw Error('Ornament is not printable with these settings. Check the build plate and text size.');const bytes=stlBytes(mesh);bytes.fill(0,0,80);bytes.set(strToU8('Snowflake ornament v1; millimetres'));return bytes;}
export function projectFiles(m){
 if(!m.valid)throw Error('Ornament is not printable with these settings. Check the build plate and text size.');
 const files=geometryProjectFiles(m,{size:printers[m.s.printer].size,name:m.parts?'Snowflake with centre text':'Snowflake'});
 files['Metadata/snowflake.json']=JSON.stringify({generator:'snowflake-v1',settings:m.s,query:encode(m.s)});
 return files;
}
export function export3mf(m){return zipSync(Object.fromEntries(Object.entries(projectFiles(m)).map(([k,v])=>[k,strToU8(v)])));}
