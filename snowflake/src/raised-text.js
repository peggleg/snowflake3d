import ClipperLib from 'clipper-lib';
import {extrudeMaterial} from './material-parts.js';
export const RAISED_HEIGHT=.6;
const integer=loops=>loops.map(l=>l.map(([x,y])=>({X:Math.round(x*10000),Y:Math.round(y*10000)})));
function boolean(subject,clips,type){const c=new ClipperLib.Clipper();c.StrictlySimple=true;c.AddPaths(subject,ClipperLib.PolyType.ptSubject,true);if(clips.length)c.AddPaths(clips,ClipperLib.PolyType.ptClip,true);const tree=new ClipperLib.PolyTree();c.Execute(type,tree,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);return tree;}
// One stepped solid: remove the covered top face and the lettering's contact face.
export function raisedTextMesh(loops,letterPaths,height,colours){
 const subject=integer(loops),type=ClipperLib.ClipType,base=extrudeMaterial(boolean(subject,[],type.ctUnion),height),ink=boolean(subject,letterPaths,type.ctIntersection),patch=extrudeMaterial(boolean(subject,letterPaths,type.ctDifference),height),letters=extrudeMaterial(ink,RAISED_HEIGHT);
 for(let i=2;i<letters.vertices.length;i+=3)letters.vertices[i]+=height;
 const vertices=[],faces=[],ids=new Map();
 const add=(mesh,keep)=>{for(let i=0;i<mesh.faces.length;i+=3){const tri=Array.from(mesh.faces.slice(i,i+3)),zs=tri.map(j=>mesh.vertices[j*3+2]);if(!keep(zs))continue;for(const j of tri){const p=Array.from(mesh.vertices.slice(j*3,j*3+3)),key=p.map(v=>Math.round(v*1000000)).join(':');if(!ids.has(key)){ids.set(key,vertices.length/3);vertices.push(...p);}faces.push(ids.get(key));}}};
 add(base,z=>!z.every(v=>v===height));add(patch,z=>z.every(v=>v===height));add(letters,z=>!z.every(v=>v===height));
 return {vertices:new Float64Array(vertices),faces:new Uint32Array(faces),raisedText:letters,parts:[{...base,name:'Snowflake and solid centre',extruder:1,colour:colours[0]},{...letters,name:'Raised centre text',extruder:2,colour:colours[1]}]};
}
