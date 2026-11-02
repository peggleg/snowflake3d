// Higher complexity adds stable, nested offshoots to the original seeded branches.
// Detail widths have a 0.8 mm floor for flat printing with a 0.4 mm nozzle.
export function branchDetail({radius:R,width,level,slots,point,line}){
 const secondWidth=Math.max(.8,width*.55),thirdWidth=Math.max(.8,width*.38);
 const draw=(a,b,w)=>line(point(...a),point(...b),w);
 const grow=(start,angle,length,w)=>{
  let end=[start[0]+Math.cos(angle)*length,start[1]+Math.sin(angle)*length];
  const limit=R-width/2;
  if(Math.hypot(...end)>limit){const t=Math.max(0,(limit-Math.hypot(...start))/length);end=[start[0]+(end[0]-start[0])*t,start[1]+(end[1]-start[1])*t];}
  if(Math.hypot(end[0]-start[0],end[1]-start[1])<w*1.15)return null;
  draw(start,end,w);return end;
 };
 const branch=(a,b,index)=>{
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),side=Math.sign(dy)||1;
  const rows=[{t:.55,threshold:1},{t:.8,threshold:3},{t:.3,threshold:5}];
  rows.forEach(({t,threshold},row)=>{
   if(level<threshold)return;
   const start=[a[0]+dx*t,a[1]+dy*t],n=level>=threshold+1?2:1;
   for(let k=0;k<n;k++){
    const angle=k===0?0:side*Math.PI/3;
    const size=Math.max(secondWidth*1.65,length*(.32+slots[40+index%10]*.13)*(1-t*.25));
    const end=grow(start,angle,size,secondWidth);
    if(!end||level<7+row)return;
    const c=[start[0]+(end[0]-start[0])*.6,start[1]+(end[1]-start[1])*.6];
    const turn=k===0?side:-side;
    grow(c,angle+turn*Math.PI/3,Math.max(thirdWidth*2.1,size*.48),thirdWidth);
   }
  });
 };
 for(let j=0;j<9;j++){
  const t=.16+j*.068+(slots[j]-.5)*.035,base=R*t,len=R*(.10+slots[10+j]*.14)*(1-t),slope=.65+slots[20+j]*.6;
  for(const side of [-1,1])branch([base,0],[Math.min(R-width,base+len),side*len*slope],j);
 }
 // Fill the previously bare tips with progressively smaller outer boughs.
 for(let j=0;j<3;j++){
  if(level<1+j*2)continue;
  const base=R*(.77+j*.075),length=R*(.1-j*.022);
  for(const side of [-1,1]){
   const a=[base,0],b=[base+length*.65,side*length*.75];
   draw(a,b,secondWidth);
   if(level>=4)branch(a,b,j+6);
  }
 }
}
