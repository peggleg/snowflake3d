import './style.css';
import {centreLabels} from './centre.js';
import {previewRotation} from './preview-rotation.js';
import {batchSettings} from './batch.js';
import {design,defaults,decode,encode,printers} from './design.js';
import {exportArchive} from './archive.js';
import {exportStl,export3mf} from './export.js';
const $=id=>document.getElementById(id),form=$('settings');let current,history=[],index=-1,batch=[],zipSelection=new Set();
let legacyCentre=new URLSearchParams(location.search).has('v')&&!new URLSearchParams(location.search).has('centre');
let legacySilhouette=/^(A[Qgw]|BA)/.test(new URLSearchParams(location.search).get('d')||'')||new URLSearchParams(location.search).has('v');
const rotation=previewRotation($('preview'),$('flake'),$('view-rotation'),$('rotation-value'),$('reset-view'),$('rotate-left'),$('rotate-right'));
function outline(m){return m.loops.map(loop=>'M'+loop.map(([x,y])=>`${x},${-y}`).join('L')+'Z').join('');}
function zipModels(){const scope=$('zip-scope').value;return scope==='current'?[current]:scope==='selected'?batch.filter(m=>zipSelection.has(m.s.seed)):batch.length?batch:[current];}
function zipSummary(){if(!current)return;const n=zipModels().length;$('download-zip').textContent=n?`Download ${n===1?'design':n+' designs'} ZIP`:'Choose designs for ZIP';$('download-zip').disabled=n===0||!form.checkValidity();$('zip-summary').textContent=n?`${n} ornament${n===1?'':'s'} · ${n*($('zip-format').value==='both'?2:1)} model file${n===1&&$('zip-format').value!=='both'?'':'s'}`:'Tick thumbnails to include individual designs.';}
function gallery(){
 const container=$('batch-gallery'),existing=Array.from(container.children);container.hidden=batch.length<2;while(container.children.length>batch.length)container.lastElementChild.remove();
 batch.forEach((m,i)=>{
  const card=existing[i]||document.createElement('div');card.className='batch-card';
  const button=card.querySelector('.batch-item')||document.createElement('button');button.type='button';button.className='batch-item';button.setAttribute('aria-label',`Select snowflake ${i+1}`);button.setAttribute('aria-pressed',String(m.s.seed===current?.s.seed));
  const svg=button.querySelector('svg')||document.createElementNS('http://www.w3.org/2000/svg','svg'),path=svg.querySelector('path')||document.createElementNS(svg.namespaceURI,'path');svg.setAttribute('viewBox',`${m.bounds.minX-5} ${-m.bounds.maxY-5} ${m.width+10} ${m.height+10}`);svg.setAttribute('aria-hidden','true');path.setAttribute('d',outline(m));path.setAttribute('fill-rule','evenodd');if(!path.parentNode)svg.append(path);
  const label=button.querySelector('span')||document.createElement('span');label.textContent=`${i+1}${m.valid?'':m.issue==='text'?' · Text too small':m.issue==='centreText'?' · Centre too small':' · Too large'}`;if(!svg.parentNode)button.append(svg,label);
  button.onclick=()=>{render(m.s);message(`Snowflake ${i+1} of ${batch.length} selected. Settings and downloads apply to this snowflake.`);};
  const checkLabel=card.querySelector('.zip-check')||document.createElement('label');checkLabel.className='zip-check';const check=checkLabel.querySelector('input')||document.createElement('input');check.type='checkbox';check.checked=zipSelection.has(m.s.seed);check.setAttribute('aria-label',`Include snowflake ${i+1} in ZIP`);check.onchange=()=>{if(check.checked)zipSelection.add(m.s.seed);else zipSelection.delete(m.s.seed);$('zip-scope').value='selected';zipSummary();};if(!check.parentNode)checkLabel.append(check);if(!button.parentNode)card.append(button,checkLabel);if(!card.parentNode)container.append(card);
 });zipSummary();
}
function message(t){$('status').textContent=t;}
function url(s){return `${location.origin}/snowflake?${encode(s)}`;}
function render(s,record=true){
 const m=design(s);current=m;
 if(record){history=history.slice(0,index+1);history.push({...m.s});index++;}
 for(const [k,v] of Object.entries(m.s))form.elements[k].value=v;
 $('centre-ams-control').hidden=$('centre-join-control').hidden=m.s.centre!=='text';
 const ams=m.s.centre==='text'&&m.s.centreAms==='on';$('main-colour-control').hidden=$('centre-colour-control').hidden=$('centre-ams-hint').hidden=!ams;
 $('model-caption').textContent=ams?'ONE PIECE · TWO FILAMENTS · PRINTS FLAT':'ONE PIECE · ONE COLOUR · PRINTS FLAT';
 $('material-swatches').parentElement.hidden=ams;
 $('flake').style.fill=ams?m.s.mainColour:'';
 $('centre-colour').setAttribute('d',m.parts?outline(m.parts[1]):'');$('centre-colour').style.fill=m.s.centreColour;
 $('centre-text-control').hidden=$('centre-font-control').hidden=m.s.centre!=='text';form.elements.centreText.required=m.s.centre==='text';
 $('centre-size-control').hidden=m.s.centre==='original';$('centre-size-value').value=`${m.s.centreSize}%`;
 $('centre-hint').textContent=m.s.centre==='random'?`Seeded choice: ${centreLabels[m.centreKind]}. Generate another to vary it.`:m.s.centre==='original'?'Original centre preserved. Choose Random for a seeded centre variation.':'Centre size scales with the flake. Larger centres can overlap lettering.';
 if(m.s.centre==='text')$('centre-hint').textContent=m.s.centreJoin==='letters'?'Letters join each other, and branches attach directly to the word. Try Courgette or Niconne with mixed-case text for a flowing result.':'The original support bar joins the letters. Increase centre size or shorten the text if the letters are too small.';
 const mixed=m.s.mode==='text'&&m.s.armLayout==='alternating';
 const flowing=m.s.mode==='text'&&m.s.font!=='stroke'&&m.s.textLayout==='flowing';
 const textMode=m.s.mode==='text',scriptMode=textMode&&m.s.font!=='stroke',hasText=m.s.mode!=='random';$('text-control').hidden=$('text-hint').hidden=m.s.mode!=='prompt';$('text-control').firstChild.nodeValue='Pattern description';form.elements.text.required=hasText;
 $('arm-layout-control').hidden=true;
 $('text-weight-control').hidden=true;form.elements.branch.closest('label').hidden=flowing&&!mixed;
 $('font-control').hidden=$('text-size-control').hidden=$('text-position-control').hidden=$('text-layout-control').hidden=$('letter-spacing-control').hidden=true;
 form.elements.text.maxLength=textMode?12:120;form.elements.text.placeholder=textMode?'text test':'e.g. full fern or delicate crystal';
 $('text-hint').textContent=textMode?(scriptMode?(flowing?'Flowing mirrored script, using name case for readability. Reduce letter weight for a more open pattern.':m.s.textLayout==='single'?'One readable word on each arm. Lato and Bree Serif work well with capitals.':'Mirrored copies create a decorative pattern. Use mixed case for script fonts; increase letter spacing if letters merge.'):'Original block lettering repeats in six arms. Longer text needs a larger diameter.'):'Create a repeatable abstract design from up to 120 characters. Try “full fern” or “delicate crystal”. Runs locally; letters are not printed.';
 $('growth-options').hidden=textMode&&!mixed;
 $('growth-control').hidden=false;
 $('fullness-hint').hidden=$('complexity-hint').hidden=$('airy-example').hidden=textMode&&!mixed;
 $('natural-style-control').hidden=true;
 $('silhouette-control').hidden=m.s.growth!=='airy'||(textMode&&!mixed);
 $('complexity-hint').textContent=m.s.growth==='natural'?'Branch angles and lengths vary with the seed. Higher complexity adds finer offshoots.':m.s.growth==='airy'?'Detail is added only where a clear gap remains. Increase diameter or reduce branch thickness to fit finer offshoots.':'10–18 add nested offshoots and tip branches. For finer detail, use a larger diameter or thinner branches.';
 $('fullness-hint').textContent=m.s.growth==='natural'?'Spreads the branches and introduces open crystal panels.':m.s.growth==='airy'?'Fullness spreads the main boughs into the spaces between arms.':'Turn up for broader outer branches and shorter bare tips.';
 for(const name of ['complexity','fullness','pattern'])form.elements[name].closest('label').hidden=textMode&&!mixed;
 form.elements.pattern.closest('label').hidden=(textMode&&!mixed)||m.s.growth!=='original';
 if(textMode&&m.s.growth==='airy')$('text-hint').textContent+=' Airy uses lighter, spaced lettering; letter weight and spacing remain adjustable.';
 if(mixed)$('text-hint').textContent='Three text arms alternate with three snowflake branches. Complexity, fullness and branch thickness adjust the snowflake branches.';
 const extent=m.loops.reduce((r,loop)=>loop.reduce((r,[x,y])=>Math.max(r,Math.hypot(x,y)),r),0)+8;
 $('preview').setAttribute('viewBox',`${-extent} ${-extent} ${extent*2} ${extent*2}`);
 $('flake-depth').parentElement.setAttribute('transform',`translate(0 ${m.s.thickness*.22})`);
 for(const id of ['flake','flake-depth','flake-light'])$(id).setAttribute('d',outline(m));rotation.refresh();
 const match=batch.findIndex(item=>item.s.seed===m.s.seed);if(match>=0)batch[match]=m;gallery();
 $('dimensions').textContent=`${m.width.toFixed(1)} × ${m.height.toFixed(1)} mm`;
 $('text-weight-value').value=`${m.s.textWeight.toFixed(2)} mm`;
 $('letter-spacing-value').value=`${m.s.letterSpacing}%`;
 $('text-size-value').value=`${m.s.textSize}%`;$('text-position-value').value=m.s.textPosition;
 $('complexity-value').value=m.s.complexity;$('fullness-value').value=`${m.s.fullness}%`;$('branch-value').value=`${m.s.branch} mm`;
 $('design-number').textContent=`DESIGN ${index+1}`;
 $('fit').textContent=m.issue==='centreText'?'Centre text is too small to print clearly. Increase centre size or diameter, or use a shorter word.':m.issue==='text'?'Letters are too small to print clearly. Increase diameter, shorten the text or reduce branch thickness.':m.valid?`Fits ${printers[m.s.printer].name} with a 2 mm edge margin.`:`Too large for ${printers[m.s.printer].name}. Reduce diameter or choose A1. Ring is included in this check.`;
 $('stl').disabled=$('three-mf').disabled=!m.valid;$('previous').disabled=index<=0;$('next').disabled=index>=history.length-1;
 window.history.replaceState(null,'',url(m.s));
}
form.addEventListener('input',()=>{if(!form.checkValidity())$('stl').disabled=$('three-mf').disabled=$('download-zip').disabled=true;});
form.addEventListener('change',event=>{try{if(event.target.name==='centre'){const text=form.elements.centre.value==='text';if(text&&current.s.centre!=='text'&&Number(form.elements.centreSize.value)<24)form.elements.centreSize.value='24';form.elements.centreText.required=text;$('centre-text-control').hidden=$('centre-font-control').hidden=!text;}if(event.target.name==='centre')legacyCentre=false;if(['centreFont','centreJoin'].includes(event.target.name)&&form.elements.centreJoin.value==='letters'&&['courgette','niconne','montecarlo'].includes(form.elements.centreFont.value)){const word=form.elements.centreText.value;if(word===word.toUpperCase())form.elements.centreText.value=word.replace(/[A-Z][A-Z']*/g,w=>w[0]+w.slice(1).toLowerCase());}if(event.target.name==='silhouette'){legacySilhouette=false;form.elements.crystalQuality.value=defaults.crystalQuality;}if(event.target.name==='growth'&&form.elements.growth.value==='airy'&&legacySilhouette){form.elements.silhouette.value=defaults.silhouette;legacySilhouette=false;}if(event.target.name==='mode'){const mode=form.elements.mode.value,hasText=mode!=='random';$('text-control').hidden=$('text-hint').hidden=!hasText;form.elements.text.required=hasText;form.elements.text.maxLength=mode==='text'?12:120;if(mode==='text'&&current.s.mode!=='text'){form.elements.font.value='courgette';form.elements.textLayout.value='flowing';form.elements.letterSpacing.value='0';form.elements.textSize.value='110';}if(hasText&&!form.elements.text.value)form.elements.text.value=mode==='text'?'text test':'FULL FERN';if(mode==='text')form.elements.text.value=form.elements.text.value.slice(0,12);}
if(event.target.name==='font'&&['lato','breeserif'].includes(form.elements.font.value)&&!['lato','breeserif'].includes(current.s.font)){form.elements.textLayout.value='single';form.elements.letterSpacing.value='10';}
if(event.target.name==='font'&&['montecarlo','niconne','courgette','berkshireswash'].includes(form.elements.font.value)&&(['lato','breeserif'].includes(current.s.font)||['courgette','berkshireswash'].includes(form.elements.font.value)&&!['courgette','berkshireswash'].includes(current.s.font))){form.elements.textLayout.value='flowing';form.elements.letterSpacing.value='0';form.elements.textSize.value='110';}
if(event.target.name==='armLayout'&&form.elements.armLayout.value==='alternating'){form.elements.complexity.value='6';form.elements.fullness.value='80';form.elements.branch.value='1.2';form.elements.pattern.value='open';}
if(form.elements.mode.value==='text'&&((event.target.name==='mode'&&current.s.mode!=='text')||event.target.name==='growth')){const airy=form.elements.growth.value==='airy';if(form.elements.font.value==='stroke'){if(airy)form.elements.branch.value='1.2';}else{form.elements.letterSpacing.value=airy?'15':'0';form.elements.textSize.value=airy?'100':'110';form.elements.textWeight.value=airy?'0.55':'0.65';}}
if(!form.reportValidity()){$('stl').disabled=$('three-mf').disabled=true;return;}render(Object.fromEntries(new FormData(form)));message('');}catch(e){message(e.message);$('stl').disabled=$('three-mf').disabled=true;}});
$('airy-example').onclick=()=>{legacyCentre=false;legacySilhouette=false;render({...defaults,printer:current.s.printer,growth:'airy',seed:'winter-2026',complexity:18,branch:1.2,fullness:100,centre:'hex-frame',centreSize:18,pattern:'open'});$('reset-view').click();message('Rendered example loaded: broad boughs with protected gaps.');};
$('batch-count').addEventListener('input',()=>{const n=Number($('batch-count').value);$('generate').textContent=n>1?`Generate ${n} snowflakes ✦`:'Generate another ✦';});
$('generate').onclick=async()=>{
 if(!$('batch-count').reportValidity()||!form.reportValidity())return;
 const a=crypto.getRandomValues(new Uint32Array(4)),seed=Array.from(a,x=>x.toString(16).padStart(8,'0')).join('');
 const controls=[...document.querySelectorAll('button,input,select')];controls.forEach(el=>el.disabled=true);
 try{
  const inputs=batchSettings({...current.s,seed,crystalQuality:defaults.crystalQuality,silhouette:legacySilhouette?defaults.silhouette:current.s.silhouette,centre:legacyCentre?'random':current.s.centre},Number($('batch-count').value)),result=[];
  for(let i=0;i<inputs.length;i++){message(`Generating snowflake ${i+1} of ${inputs.length}…`);await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));result.push(design(inputs[i]));}
  batch=result;zipSelection.clear();$('zip-scope').value='all';legacyCentre=false;legacySilhouette=false;
  const first=index+1;history=history.slice(0,first);history.push(...batch.map(m=>({...m.s})));index=first;
  render(batch[0].s,false);message(batch.length===1?'A fresh snowflake, made just here.':`${batch.length} different snowflakes ready. Select one below to refine or download; each is a separate ornament.`);
 }catch(e){message(e.message);}finally{controls.forEach(el=>el.disabled=false);$('previous').disabled=index<=0;$('next').disabled=index>=history.length-1;$('stl').disabled=$('three-mf').disabled=!current.valid;}
};
$('previous').onclick=()=>{if(index>0)render(history[--index],false);};$('next').onclick=()=>{if(index<history.length-1)render(history[++index],false);};
$('zip-scope').onchange=$('zip-format').onchange=zipSummary;
$('download-zip').onclick=async()=>{if(!form.reportValidity())return;const meshes=zipModels().slice();const controls=[...document.querySelectorAll('button,input,select')];controls.forEach(el=>el.disabled=true);try{const bytes=await exportArchive(meshes,{format:$('zip-format').value,origin:location.origin,onProgress:(i,n)=>message(`Preparing ZIP: snowflake ${i} of ${n}…`)});const href=URL.createObjectURL(new Blob([bytes],{type:'application/zip'})),a=document.createElement('a');a.href=href;a.download=`snowflakes-${meshes.length}.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(href),10000);message(`ZIP ready: ${meshes.length} ornament${meshes.length===1?'':'s'}, with settings and share links.`);}catch(e){message(e.message);}finally{controls.forEach(el=>el.disabled=false);$('previous').disabled=index<=0;$('next').disabled=index>=history.length-1;$('stl').disabled=$('three-mf').disabled=!current.valid;zipSummary();}};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(url(current.s));message('Design link copied.');}catch{message('Clipboard unavailable. Copy the design link from your address bar.');}};
for(const [id,format,fn] of [['stl','stl',exportStl],['three-mf','3mf',export3mf]])$(id).onclick=()=>{try{const bytes=fn(current),blob=new Blob([bytes],{type:format==='stl'?'model/stl':'model/3mf'}),href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download=`snowflake-${current.s.seed.replace(/[^a-z0-9_-]/gi,'_')}.${format}`;a.click();setTimeout(()=>URL.revokeObjectURL(href),10000);message(`${format.toUpperCase()} ready. Inspect the slice before printing.`);}catch(e){message(e.message);}};
try{const fresh=!location.search;render(decode(location.search));if(fresh){batch=[current,...Array.from({length:5},(_,i)=>design({...current.s,seed:current.s.seed+'~'+(i+2)}))];history=batch.map(m=>({...m.s}));index=0;render(current.s,false);$('batch-count').dispatchEvent(new Event('input'));}}catch(e){render(defaults);message(`Invalid design link: ${e.message} Loaded the default snowflake.`);}
window.addEventListener('popstate',()=>{try{const fresh=!location.search;render(decode(location.search));if(fresh){batch=[current,...Array.from({length:5},(_,i)=>design({...current.s,seed:current.s.seed+'~'+(i+2)}))];history=batch.map(m=>({...m.s}));index=0;render(current.s,false);$('batch-count').dispatchEvent(new Event('input'));}}catch(e){message(e.message);}});

const materials=[['Hearth','#ffb066','#9fd8f5'],['Copper','#f0b581','#b96b44'],['Pine','#a2dcc5','#438b72'],['Ice','#f2fbff','#8fc6e0'],['Plum','#e5bde0','#936990'],['Cream','#fff6e4','#cfbb96']];
materials.forEach(([name,left,right],i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',name);b.setAttribute('aria-pressed',String(i===0));b.style.background=`linear-gradient(135deg,${left},${right})`;b.onclick=()=>{$('material-left').setAttribute('stop-color',left);$('material-right').setAttribute('stop-color',right);for(const button of $('material-swatches').children)button.setAttribute('aria-pressed',String(button===b));};$('material-swatches').append(b);});
