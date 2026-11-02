import ClipperLib from 'clipper-lib';
import earcut from 'earcut';
import {conformTriangles} from './triangulate.js';
const SCALE=10000;
const integer=loops=>loops.map(loop=>loop.map(([x,y])=>({X:Math.round(x*SCALE),Y:Math.round(y*SCALE)})));
function boolean(subject,clips,type){const c=new ClipperLib.Clipper();c.StrictlySimple=true;c.AddPaths(subject,ClipperLib.PolyType.ptSubject,true);if(clips.length)c.AddPaths(clips,ClipperLib.PolyType.ptClip,true);const tree=new ClipperLib.PolyTree();c.Execute(type,tree,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);return tree;}
// Each colour is a closed volume, possibly containing multiple disconnected letters.
// Components share their boundary; no second solid overlaps the first.
export function extrudeMaterial(tree,height){
 const vertices=[],faces=[],loops=[];
 const visit=node=>{
  if(node.Contour().length&&!node.IsHole()){
   const contours=[node.Contour(),...node.Childs().filter(c=>c.IsHole()).map(c=>c.Contour())].filter(c=>c.length>=3&&Math.abs(ClipperLib.Clipper.Area(c))>1),group=contours.map(c=>c.map(p=>[p.X/SCALE,p.Y/SCALE])),raw=[],holes=[];
   group.forEach((loop,i)=>{if(i)holes.push(raw.length/2);for(const p of loop)raw.push(...p);});
   const flat=[],unique=new Map(),remap=[];for(let i=0;i<raw.length;i+=2){const key=`${Math.round(raw[i]*SCALE)}:${Math.round(raw[i+1]*SCALE)}`;if(!unique.has(key)){unique.set(key,flat.length/2);flat.push(raw[i],raw[i+1]);}remap.push(unique.get(key));}
   let top=earcut(raw.map(v=>Math.round(v*SCALE)),holes).map(i=>remap[i]);top=conformTriangles(flat,top,true);
   const offset=vertices.length/3,n=flat.length/2;
   for(const z of [0,height])for(let i=0;i<n;i++)vertices.push(flat[i*2],flat[i*2+1],z);
   for(let i=0;i<top.length;i+=3){const [a,b,c]=top.slice(i,i+3);faces.push(offset+a,offset+c,offset+b,offset+a+n,offset+b+n,offset+c+n);}
   let start=0;for(const loop of group){for(let j=0;j<loop.length;j++){const a=offset+remap[start+j],b=offset+remap[start+(j+1)%loop.length];if(a===b)continue;faces.push(a,b,a+n,b,b+n,a+n);}start+=loop.length;}loops.push(...group);
  }
  for(const child of node.Childs())visit(child);
 };
 for(const node of tree.Childs())visit(node);
 return {vertices:new Float64Array(vertices),faces:new Uint32Array(faces),loops};
}
export function centreMaterialParts(loops,letterPaths,height,colours){
 const subject=integer(loops),type=ClipperLib.ClipType;
 // Three integer grid units (0.0003 mm) avoid zero-width contacts where the
 // cleaned ornament boundary and the original offset glyph edge coincide.
 const offset=new ClipperLib.ClipperOffset(2,.25),mask=[];offset.AddPaths(letterPaths,ClipperLib.JoinType.jtRound,ClipperLib.EndType.etClosedPolygon);offset.Execute(mask,3);
 const text=boolean(subject,mask,type.ctIntersection),body=boolean(subject,mask,type.ctDifference);
 const parts=[{...extrudeMaterial(body,height),name:'Snowflake, branch text and connectors',extruder:1,colour:colours[0]}, {...extrudeMaterial(text,height),name:'Centre text only',extruder:2,colour:colours[1]}];
 if(parts.some(p=>!p.faces.length))throw Error('Centre colour needs printable centre letters.');
 return parts;
}
