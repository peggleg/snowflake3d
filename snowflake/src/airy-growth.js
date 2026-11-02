// Airy growth: broad sector-filling boughs with collision-checked detail.
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function pointDistance(p,a,b){const v=sub(b,a),l=dot(v,v);if(!l)return dist(p,a);const t=Math.max(0,Math.min(1,dot(sub(p,a),v)/l));return dist(p,[a[0]+v[0]*t,a[1]+v[1]*t]);}
function segmentDistance(a,b,c,d){const cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return 0;return Math.min(pointDistance(a,c,d),pointDistance(b,c,d),pointDistance(c,a,b),pointDistance(d,a,b));}
export function balancedArm({R,w,complexity,fullness,slots,point,line}){
 const gap=Math.max(.9,R*.018),primaryWidth=Math.max(.9,w*.72),secondaryWidth=Math.max(.8,w*.52),thirdWidth=Math.max(.8,w*.4);
 const segments=[{a:[0,0],b:[R,0],width:w,parent:-1}],draw=(a,b,width)=>{for(const side of [-1,1])line(point(a[0],a[1]*side),point(b[0],b[1]*side),width);};
 const inside=(p,width)=>p[1]>=-1e-7&&Math.hypot(...p)+width/2<=R&&p[1]+width/2<=(p[0]-width/2)*Math.tan(Math.PI/6)-gap/(2*Math.cos(Math.PI/6));
 const fits=(a,b,width,parent)=>{
  if(!inside(a,width)||!inside(b,width))return false;
  return segments.every((s,i)=>i===parent||(s.parent===parent&&dist(a,s.a)<.001)||segmentDistance(a,b,s.a,s.b)>=(width+s.width)/2+gap);
 };
 function grow(a,angle,length,width,parent){
  const end=len=>[a[0]+Math.cos(angle)*len,a[1]+Math.sin(angle)*len];
  if(!fits(a,a,width,parent))return null;
  let lo=0,hi=length;
  if(fits(a,end(length),width,parent))lo=length;
  else for(let i=0;i<18;i++){const mid=(lo+hi)/2;if(fits(a,end(mid),width,parent))lo=mid;else hi=mid;}
  if(lo<Math.max(width*2.2,1.8))return null;
  const b=end(lo),id=segments.length;segments.push({a,b,width,parent});draw(a,b,width);return id;
 }
 const roots=complexity<=4?[.3,.56,.8]:complexity<=10?[.27,.43,.59,.75,.9]:[.25,.38,.51,.64,.77,.9];
 const mains=[];
 roots.forEach((t,i)=>{
  const x=R*(t+(slots[i]-.5)*.018),angle=Math.PI/3;
  const sector=x-1.8*gap,radial=(-x+Math.sqrt(Math.max(0,4*(R-primaryWidth)**2-3*x*x)))/2;
  const length=Math.min(sector,radial)*(.68+fullness*.0027)*(.93+slots[10+i]*.07);
  const id=grow([x,0],angle,length,primaryWidth,0);if(id!==null)mains.push(id);
 });
 const secondary=[];
 if(complexity>=4)for(const id of mains){
  const s=segments[id],length=dist(s.a,s.b),rows=complexity<8?[.56]:complexity<13?[.4,.74]:[.28,.52,.76];
  rows.forEach((t,row)=>{
   const a=[s.a[0]+(s.b[0]-s.a[0])*t,s.a[1]+(s.b[1]-s.a[1])*t];
   for(const angle of complexity<7?[0]:[0,Math.PI*2/3]){
    const child=grow(a,angle,length*(.28+slots[30+row]*.1),secondaryWidth,id);if(child!==null)secondary.push(child);
   }
  });
 }
 if(complexity>=13)for(const id of secondary){
  const s=segments[id],angle=Math.atan2(s.b[1]-s.a[1],s.b[0]-s.a[0]),length=dist(s.a,s.b),a=[s.a[0]+(s.b[0]-s.a[0])*.63,s.a[1]+(s.b[1]-s.a[1])*.63];
  for(const turn of complexity>=17?[-1,1]:[1])grow(a,angle+turn*Math.PI/3,length*.48,thirdWidth,id);
 }
 return {segments:segments.length-1,gap};
}
