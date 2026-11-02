// Immutable version-1 recipe baseline. Decoding must not inherit future UI defaults.
const BASE={seed:'winter-2026',mode:'random',armLayout:'all',centre:'random',centreSize:18,text:'text test',font:'stroke',textLayout:'mirrored',letterSpacing:0,textWeight:.65,textSize:100,textPosition:0,diameter:100,thickness:3,complexity:5,branch:2,fullness:0,pattern:'mixed',printer:'mini'};
const FIELDS=[
 ['mode',['random','text','prompt']],['armLayout',['all','alternating']],
 ['centre',['random','original','solid-star','star-frame','hexagon','hex-frame','circle','ring','rosette','web']],
 ['centreSize'],['text','string'],['font',['stroke','montecarlo','niconne','lato','breeserif','courgette','berkshireswash']],
 ['textLayout',['mirrored','single','flowing']],['letterSpacing'],['textWeight'],['textSize'],['textPosition'],
 ['diameter'],['thickness'],['complexity'],['branch'],['fullness'],['pattern',['mixed','open','lattice']],['printer',['mini','a1']]
];
// Version 2 appends growth style; version-1 field and option order stays pinned.
const V2_FIELDS=[...FIELDS,['growth',['original','airy']]];
const V3_FIELDS=[...V2_FIELDS,['silhouette',['legacy','random','star','fern','crystal','rounded']]];
const V4_FIELDS=[...V2_FIELDS,['silhouette',[...V3_FIELDS.at(-1)[1],'random-all','simple','plates','hex-tips','leaves','needles']]];
const V5_FIELDS=[...V4_FIELDS,['crystalQuality',['original','refined']]];
const utf8=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
function checksum(bytes){let crc=0xffff;for(const b of bytes){crc^=b<<8;for(let i=0;i<8;i++)crc=((crc<<1)^((crc&0x8000)?0x1021:0))&0xffff;}return crc;}
function base64(bytes){let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export function encodeCompact(s){
 const bytes=[5],fields=V5_FIELDS,baseline={...BASE,growth:'original',silhouette:'random',crystalQuality:'refined'};
 const unsigned=value=>{do{const b=value&127;value=Math.floor(value/128);bytes.push(b|(value?128:0));}while(value);};
 const signed=value=>unsigned(value<0?-value*2-1:value*2);
 const string=value=>{const b=utf8.encode(value);unsigned(b.length);bytes.push(...b);};
 if(/^[0-9a-f]{32}$/.test(s.seed)){bytes.push(1);for(let i=0;i<32;i+=2)bytes.push(parseInt(s.seed.slice(i,i+2),16));}
 else{bytes.push(0);string(s.seed);}
 let mask=0;fields.forEach(([key],i)=>{if(!Object.is(s[key],baseline[key]))mask|=1<<i;});unsigned(mask);
 fields.forEach(([key,type],i)=>{
  if(!(mask&(1<<i)))return;const value=s[key];
  if(Array.isArray(type)){bytes.push(type.indexOf(value));return;}
  if(type==='string'){string(value);return;}
  if(!Object.is(value,-0)&&Number.isSafeInteger(value)){bytes.push(0);signed(value);}
  else if(!Object.is(value,-0)&&Math.round(value*100)/100===value){bytes.push(1);signed(Math.round(value*100));}
  else{bytes.push(2);const buffer=new ArrayBuffer(8);new DataView(buffer).setFloat64(0,value,true);bytes.push(...new Uint8Array(buffer));}
 });
 const crc=checksum(bytes);bytes.push(crc>>8,crc&255);return base64(bytes);
}
export function decodeCompact(token){
 if(typeof token!=='string'||token.length<8||token.length>4096||token.length%4===1||!/^[A-Za-z0-9_-]+$/.test(token))throw Error('Invalid compact design link.');
 let bytes;try{bytes=Uint8Array.from(atob(token.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-token.length%4)%4)),c=>c.charCodeAt(0));}catch{throw Error('Invalid compact design link.');}
 if(base64(bytes)!==token)throw Error('Invalid compact design link.');
 const end=bytes.length-2;if(end<3||checksum(bytes.subarray(0,end))!==((bytes[end]<<8)|bytes[end+1]))throw Error('Design link is incomplete or contains a typo.');
 let offset=0;const byte=()=>{if(offset>=end)throw Error('Incomplete design link.');return bytes[offset++];};
 const unsigned=()=>{let value=0,factor=1;for(let i=0;i<5;i++){const b=byte();value+=(b&127)*factor;if(!(b&128))return value;factor*=128;}throw Error('Invalid design number.');};
 const signed=()=>{const n=unsigned();return n%2?-(n+1)/2:n/2;};
 const string=()=>{const length=unsigned();if(length>1024||offset+length>end)throw Error('Invalid design text.');const b=bytes.subarray(offset,offset+length);offset+=length;return decoder.decode(b);};
 const version=byte();if(version!==1&&version!==2&&version!==3&&version!==4&&version!==5)throw Error('Unsupported compact design version.');
 const fields=version===1?FIELDS:version===2?V2_FIELDS:version===3?V3_FIELDS:version===4?V4_FIELDS:V5_FIELDS;
 const s={...BASE,growth:'original',silhouette:version===4?'random-all':version>=3?'random':'legacy',crystalQuality:version===5?'refined':'original'},seedKind=byte();if(seedKind===1){let seed='';for(let i=0;i<16;i++)seed+=byte().toString(16).padStart(2,'0');s.seed=seed;}
 else if(seedKind===0)s.seed=string();else throw Error('Invalid seed encoding.');
 const mask=unsigned();if(mask>=2**fields.length)throw Error('Unsupported design fields.');
 fields.forEach(([key,type],i)=>{
  if(!(mask&(1<<i)))return;
  if(Array.isArray(type)){const value=type[byte()];if(value===undefined)throw Error('Invalid design option.');s[key]=value;return;}
  if(type==='string'){s[key]=string();return;}
  const kind=byte();if(kind===0)s[key]=signed();else if(kind===1)s[key]=signed()/100;else if(kind===2){if(offset+8>end)throw Error('Incomplete design number.');s[key]=new DataView(bytes.buffer,bytes.byteOffset+offset,8).getFloat64(0,true);offset+=8;}else throw Error('Invalid design number.');
 });
 if(offset!==end)throw Error('Unexpected data in design link.');return s;
}
