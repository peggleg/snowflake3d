import ClipperLib from 'clipper-lib';
const SCALE=10000;
function union(paths){const c=new ClipperLib.Clipper();c.AddPaths(paths,ClipperLib.PolyType.ptSubject,true);const tree=new ClipperLib.PolyTree();c.Execute(ClipperLib.ClipType.ctUnion,tree,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);return tree;}
function mainOutline(paths){const roots=union(paths).Childs().slice().sort((a,b)=>Math.abs(ClipperLib.Clipper.Area(b.Contour()))-Math.abs(ClipperLib.Clipper.Area(a.Contour())));return roots[0]?.Contour().map(p=>[p.X/SCALE,p.Y/SCALE]);}
function overlap(a,b){const c=new ClipperLib.Clipper(),out=[];c.AddPaths(a,ClipperLib.PolyType.ptSubject,true);c.AddPaths(b,ClipperLib.PolyType.ptClip,true);c.Execute(ClipperLib.ClipType.ctIntersection,out,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);return Math.abs(out.reduce((s,p)=>s+ClipperLib.Clipper.Area(p),0))>1;}
function nearestPair(a,b){let best=Infinity,pair;const project=(p,q,r,reverse)=>{const dx=r[0]-q[0],dy=r[1]-q[1],len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,((p[0]-q[0])*dx+(p[1]-q[1])*dy)/len)):0,v=[q[0]+t*dx,q[1]+t*dy],d=(p[0]-v[0])**2+(p[1]-v[1])**2;if(d<best){best=d;pair=reverse?[v,p]:[p,v];}};for(const p of a)for(let i=0;i<b.length;i++)project(p,b[i],b[(i+1)%b.length],false);for(const p of b)for(let i=0;i<a.length;i++)project(p,a[i],a[(i+1)%a.length],true);return pair;}
// Connect the ink of adjacent letters, not their bounding boxes or a long rail.
export function wordConnectors(groups,width){
 const curves=[];let previous=null;
 for(const paths of groups){
  const outline=mainOutline(paths);if(!outline)continue;
  if(previous&&!overlap(previous.paths,paths)){
   const [a,b]=nearestPair(previous.outline,outline),length=Math.hypot(b[0]-a[0],b[1]-a[1]),bend=Math.min(width*.6,length*.22),control=[(a[0]+b[0])/2,(a[1]+b[1])/2-bend];
   curves.push(Array.from({length:13},(_,i)=>{const t=i/12,u=1-t;return[u*u*a[0]+2*u*t*control[0]+t*t*b[0],u*u*a[1]+2*u*t*control[1]+t*t*b[1]];}));
  }
  previous={paths,outline};
 }
 return curves;
}
