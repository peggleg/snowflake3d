import ClipperLib from 'clipper-lib';
// Branch proportions and angle variation adapted from the supplied workshop HTML.
const types={random:[.75,.4],stellar:[.95,.2],fern:[.5,.3],plate:[1.1,.1]};
function rng(seed){let h=2166136261;for(const c of seed){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}let a=h>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function naturalArm({R,w,complexity,fullness,centreSize,seed,naturalStyle,point,line,add}){
 const random=rng(seed+'|0'),c=R*centreSize/100,[baseAngle,jitter]=types[naturalStyle],n=2+Math.round(Math.min(complexity,10)*.5),gap=Math.max(.9,R*.018),fine=Math.max(.8,w*.72);
 const inside=(p,width)=>Math.hypot(...p)+width/2<=R&&Math.abs(p[1])+width/2+gap<=(p[0]-width/2)*Math.tan(Math.PI/6);
 const cap=(p,width)=>add(Array.from({length:16},(_,i)=>point(p[0]+Math.cos(i*Math.PI/8)*width/2,p[1]+Math.sin(i*Math.PI/8)*width/2)));
 const stroke=(a,b,width)=>{line(point(...a),point(...b),width);cap(a,width);cap(b,width);};
 const pair=(a,b,width)=>{for(const side of [-1,1])stroke([a[0],a[1]*side],[b[0],b[1]*side],width);};
 const fit=(a,b,width)=>{if(inside(b,width))return b;let lo=0,hi=1;for(let i=0;i<18;i++){const t=(lo+hi)/2,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];if(inside(p,width))lo=t;else hi=t;}return[a[0]+(b[0]-a[0])*lo,a[1]+(b[1]-a[1])*lo];};
 const span=R-c,branches=[];
 for(let k=1;k<=n;k++){
  const proportion=random(),deviation=random(),split=random();
  const t=k/(n+.5),x=c+span*t,length=span*(.42*(1-t)+.14)*(.75+proportion*.5)*(1+fullness/160),angle=baseAngle+(deviation-.5)*jitter;
  const a=[x,0],b=fit(a,[x+Math.cos(angle)*length,Math.sin(angle)*length],w);
  if(Math.hypot(b[0]-x,b[1])<w*2)continue;
  pair(a,b,w);branches.push({a,b,length,angle,t});
  if(complexity>4&&split>.25){
   const p=[x+(b[0]-x)*.55,b[1]*.55],sl=length*.38;
   for(const end of [[p[0]+sl*.5,p[1]+sl*.8],[p[0]+sl*.9,p[1]-sl*.2]]){
    const tip=fit(p,end,fine);if(Math.hypot(tip[0]-p[0],tip[1]-p[1])>fine*2)pair(p,tip,fine);
   }
  }
 }
 // Fullness makes open crystal panels, rather than translucent display-only faces.
 for(let i=0;i<branches.length;i++){
  const {a,b}=branches[i];if(fullness===0||i/branches.length>=fullness/100+.15)continue;
  const end=[Math.min(R-w,(a[0]+(b[0]-a[0])*1.9)),0],poly=[a,b,end];
  const contour=poly.map(([x,y])=>({X:Math.round(x*10000),Y:Math.round(y*10000)}));if(!ClipperLib.Clipper.Orientation(contour))contour.reverse();
  const offset=new ClipperLib.ClipperOffset(),open=[];offset.AddPath(contour,ClipperLib.JoinType.jtMiter,ClipperLib.EndType.etClosedPolygon);offset.Execute(open,-(w+gap)*10000);
  if(open.length)pair(b,end,fine);
 }
 // High complexity adds finer structure to the same primary branches.
 if(complexity>10)for(const {a,b} of branches){
  for(const t of complexity>14?[.3,.78]:[.76]){
   const p=[a[0]+(b[0]-a[0])*t,b[1]*t],length=Math.hypot(b[0]-a[0],b[1])*.22;
   const tip=fit(p,[p[0]+length*.6,p[1]+length*.8],fine);
   if(Math.hypot(tip[0]-p[0],tip[1]-p[1])>fine*2)pair(p,tip,fine);
  }
 }
 pair([R*.9,0],[R*.965,R*.04],fine);
}
