const MAX_BODY=16000;
const emailPattern=/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/;
const validEmail=value=>typeof value==='string'&&value.length<=254&&!/[\s\r\n]/.test(value)&&emailPattern.test(value);
const mailFailure=(status,code)=>reply({error:`We could not submit your enquiry. Please try again later. Reference: EMAIL_${status}_${code}.`},502);
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'}});
const settingNames=['CONTACT_ACCOUNT_ID','CONTACT_TO_EMAIL','CONTACT_FROM_EMAIL','CONTACT_EMAIL_TOKEN','TURNSTILE_SECRET_KEY','TURNSTILE_SITE_KEY'];
const cleanSettings=env=>Object.fromEntries(settingNames.map(name=>[name,typeof env[name]==='string'?env[name].trim():'']));
export function contactConfigurationIssues(env){
 const issues=[];
 for(const name of settingNames){const value=env[name];if(!value)issues.push({name,reason:'missing'});else if(name==='CONTACT_ACCOUNT_ID'&&!/^[a-f0-9]{32}$/i.test(value))issues.push({name,reason:'expected 32 hexadecimal characters'});else if((name==='CONTACT_TO_EMAIL'||name==='CONTACT_FROM_EMAIL')&&!validEmail(value))issues.push({name,reason:'invalid email format'});}
 return issues;
}
async function readBody(request){
 const reader=request.body?.getReader();if(!reader)throw Error('empty');const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY){await reader.cancel();throw Error('large');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
export function contactHandler(fetcher=fetch,{warn=(...args)=>console.warn(...args),now=Date.now}={}){
 let lastWarning=-Infinity,lastSignature='';
 return async({request,env})=>{
 env=cleanSettings(env);
 const issues=contactConfigurationIssues(env),available=issues.length===0;
 function reportConfiguration(){
  const signature=JSON.stringify(issues),time=now();
  if(issues.length&&(signature!==lastSignature||time-lastWarning>=60000)){
   // Names and validation categories only. Never log values, requests or correspondence.
   warn('Snowflake3D contact configuration incomplete',signature);lastWarning=time;lastSignature=signature;
  }
 }
 const url=new URL(request.url);
 if(request.method==='GET'){reportConfiguration();return reply({available,siteKey:available?env.TURNSTILE_SITE_KEY:null});}
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
 if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return reply({error:'Please submit this form from this website.'},403);
 if(!available){reportConfiguration();return reply({error:'The enquiry form is not available yet. Please try again later.'},503);}
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))return reply({error:'Invalid submission format.'},415);
 if(Number(request.headers.get('Content-Length'))>MAX_BODY)return reply({error:'Your message is too long.'},413);
 let data;try{data=await readBody(request);}catch(e){return reply({error:e.message==='large'?'Your message is too long.':'Invalid submission.'},e.message==='large'?413:400);}
 if(!data||typeof data!=='object'||Array.isArray(data))return reply({error:'Invalid submission.'},400);
 const email=typeof data.email==='string'?data.email.trim():'',message=typeof data.message==='string'?data.message.trim():'';
 if(!validEmail(email)||message.length<10||message.length>5000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(message))return reply({error:'Enter a valid email address and a message of 10–5,000 characters.'},400);
 if(data.website)return reply({error:'Unable to submit this enquiry.'},400);
 if(typeof data.token!=='string'||!data.token.length||data.token.length>2048)return reply({error:'Complete the security check and try again.'},400);
 try{
  const verification=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:data.token}),signal:AbortSignal.timeout(10000)});
  if(!verification.ok)return reply({error:'The security check is unavailable. Please try again.'},503);
  const result=await verification.json();
  if(result.success!==true||result.hostname!==url.hostname||result.action!=='privacy-contact')return reply({error:'The security check expired or failed. Please try again.'},400);
  // Fixed server-side addresses; never turn this into an arbitrary-recipient relay.
  const sent=await fetcher(`https://api.cloudflare.com/client/v4/accounts/${env.CONTACT_ACCOUNT_ID}/email/sending/send`,{method:'POST',headers:{Authorization:`Bearer ${env.CONTACT_EMAIL_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({to:env.CONTACT_TO_EMAIL,from:env.CONTACT_FROM_EMAIL,subject:'Snowflake3D privacy enquiry',text:`Reply address: ${email}\n\n${message}`}),signal:AbortSignal.timeout(15000)});
  let delivered;try{delivered=await sent.json();}catch{return mailFailure(sent.status,'INVALID_RESPONSE');}
  const providerCode=delivered?.errors?.find?.(e=>Number.isInteger(e?.code)&&e.code>0&&e.code<1000000)?.code||'UNSPECIFIED';
  if(!sent.ok||delivered?.success!==true)return mailFailure(sent.status,providerCode);
  const accepted=[...(Array.isArray(delivered.result?.delivered)?delivered.result.delivered:[]),...(Array.isArray(delivered.result?.queued)?delivered.result.queued:[])];
  const matches=value=>typeof value==='string'&&value.toLowerCase()===env.CONTACT_TO_EMAIL.toLowerCase();
  if(!accepted.some(matches))return mailFailure(sent.status,Array.isArray(delivered.result?.permanent_bounces)&&delivered.result.permanent_bounces.some(matches)?'BOUNCED':'DELIVERY_STATUS');
  return reply({ok:true,message:'Your enquiry has been submitted. We will reply to the email address you provided.'});
 }catch{return reply({error:'We could not confirm submission. Please try again later.'},503);}
};}
const handler=contactHandler();
export const onRequest=context=>handler(context);
