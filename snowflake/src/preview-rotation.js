// Preview-only orientation; never part of the design recipe or export mesh.
export function previewRotation(svg,shape,slider,output,reset,left,right){
 let angle=0,drag=null;
 const normalize=value=>((value%360)+360)%360;
 function set(value){angle=normalize(value);shape.setAttribute('transform',`rotate(${angle} 0 0)`);const display=Math.round(angle)%360;slider.value=String(display);output.value=`${display}°`;svg.setAttribute('aria-label',`Snowflake preview rotated ${display} degrees. Drag or use arrow keys to rotate.`);}
 function position(event){const matrix=svg.getScreenCTM();if(!matrix)return null;const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());return {angle:Math.atan2(point.y,point.x)*180/Math.PI,radius:Math.hypot(point.x,point.y)};}
 slider.addEventListener('input',()=>set(Number(slider.value)));
 reset.addEventListener('click',()=>set(0));left.addEventListener('click',()=>set(angle-30));right.addEventListener('click',()=>set(angle+30));
 svg.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();set(angle+(event.key==='ArrowLeft'?-15:15));}else if(event.key==='Home'||event.key==='0'){event.preventDefault();set(0);}});
 svg.addEventListener('pointerdown',event=>{if(!event.isPrimary||event.button!==0)return;const point=position(event);if(!point)return;drag={id:event.pointerId,start:point.angle,angle};svg.setPointerCapture(event.pointerId);svg.classList.add('rotating');svg.focus({preventScroll:true});});
 svg.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;const point=position(event);if(point&&point.radius>2)set(drag.angle+point.angle-drag.start);});
 const finish=event=>{if(drag&&drag.id===event.pointerId){drag=null;svg.classList.remove('rotating');}};
 svg.addEventListener('pointerup',finish);svg.addEventListener('pointercancel',finish);svg.addEventListener('lostpointercapture',finish);
 set(0);return {refresh:()=>set(angle)};
}
