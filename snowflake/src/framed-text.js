import ClipperLib from 'clipper-lib';
import {centrePlan} from './centre.js';
import {textCentrePlan} from './centre-text.js';
export const framedTextStyles=['solid-random','solid-hex','solid-circle','open-random','open-hex','open-circle','raised-random','raised-hex','raised-circle'];
export function framedTextPlan({text,font,radius,branch,style,slots}){
 const solid=(style.startsWith('solid-')||style.startsWith('raised-')),circular=style.endsWith('circle')||(style.endsWith('random')&&slots[90]>=.5);
 const frame=centrePlan({choice:circular?(solid?'circle':'ring'):(solid?'hexagon':'hex-frame'),radius,branch,slots,matched:true});
 const word=textCentrePlan({text,font,radius:radius*.78,branch,join:'letters'}),paths=[...frame.paths];
 if(!solid){
  paths.push(...word.letterPaths);
  // Attach at the middle of the ink, leaving the space below the word open.
  const crossings=[];for(const c of word.letterPaths)for(let i=0;i<c.length;i++){const a=c[i],b=c[(i+1)%c.length];if((a.Y<=0&&b.Y>0)||(b.Y<=0&&a.Y>0))crossings.push(a.X+(b.X-a.X)*(-a.Y)/(b.Y-a.Y));}
  const inner=radius-frame.rim,edge=circular?inner:inner*Math.sqrt(3)/2,width=Math.max(.8,Math.min(1.2,branch*.65));
  for(const [x,end]of [[Math.min(...crossings)/10000,-edge-frame.rim*.7],[Math.max(...crossings)/10000,edge+frame.rim*.7]]){
   const c=[[Math.min(x,end)-.25,-width/2],[Math.max(x,end)+.25,-width/2],[Math.max(x,end)+.25,width/2],[Math.min(x,end)-.25,width/2]].map(([x,y])=>({X:Math.round(x*10000),Y:Math.round(y*10000)}));if(!ClipperLib.Clipper.Orientation(c))c.reverse();paths.push(c);
  }
 }
 return {...frame,paths,letterPaths:word.letterPaths,printable:word.printable,letterHeight:word.letterHeight};
}
