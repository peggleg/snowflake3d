import ClipperLib from 'clipper-lib';
import earcut from 'earcut';
const SCALE=10000;
// A closed stroked path has real miter joins. Separate butt-ended rectangles
// leave little square notches at each polygon vertex.
export function joinedFrame(points,width){
 const offset=new ClipperLib.ClipperOffset(2,.01*SCALE),paths=[];
 offset.AddPath(points.map(([x,y])=>({X:Math.round(x*SCALE),Y:Math.round(y*SCALE)})),ClipperLib.JoinType.jtMiter,ClipperLib.EndType.etClosedLine);offset.Execute(paths,width*SCALE/2);
 const clip=new ClipperLib.Clipper();clip.AddPaths(paths,ClipperLib.PolyType.ptSubject,true);const tree=new ClipperLib.PolyTree();clip.Execute(ClipperLib.ClipType.ctUnion,tree,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);
 const triangles=[],contours=[];
 for(const outer of tree.Childs()){
  const loops=[outer.Contour(),...outer.Childs().map(c=>c.Contour())],flat=[],holes=[];
  loops.forEach((loop,i)=>{if(i)holes.push(flat.length/2);contours.push(loop.map(p=>[p.X/SCALE,p.Y/SCALE]));for(const p of loop)flat.push(p.X,p.Y);});
  const top=earcut(flat,holes);for(let i=0;i<top.length;i+=3)triangles.push(top.slice(i,i+3).map(j=>[flat[j*2]/SCALE,flat[j*2+1]/SCALE]));
 }
 return {triangles,contours};
}
