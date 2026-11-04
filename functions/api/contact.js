const MAX_BODY=16000;
const emailPattern=/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/;
const validEmail=value=>typeof value==='string'&&value.length<=254&&!/[\s\r\n]/.test(value)&&emailPattern.test(value);
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'}});
function ready(env){return /^[a-f0-9]{32}$/i.test(env.CONTACT_ACCOUNT_ID||'')&&validEmail(env.CONTACT_TO_EMAIL)&&validEmail(env.CONTACT_FROM_EMAIL)&&!!env.CONTACT_EMAIL_TOKEN&&!!env.TURNSTILE_SECRET_KEY&&!!env.TURNSTILE_SITE_KEY;}
async function readBody(request){
 const reader=request.body?.getReader();if(!reader)throw Error('empty');const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY){await reader.cancel();throw Error('large');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
export function contactHandler(fetcher=fetch){return async({request,env})=>{
 const url=new URL(request.url);
 if(request.method==='GET')return reply({available:ready(env),siteKey:ready(env)?env.TURNSTILE_SITE_KEY:null});
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
 if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return reply({error:'Please submit this form from this website.'},403);
 if(!ready(env))return reply({error:'The enquiry form is not available yet. Please try again later.'},503);
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
  if(!sent.ok)return reply({error:'We could not submit your enquiry. Please try again later.'},502);
  const delivered=await sent.json(),accepted=[...(delivered.result?.delivered||[]),...(delivered.result?.queued||[])];
  if(delivered.success!==true||!accepted.includes(env.CONTACT_TO_EMAIL))return reply({error:'We could not submit your enquiry. Please try again later.'},502);
  return reply({ok:true,message:'Your enquiry has been submitted. We will reply to the email address you provided.'});
 }catch{return reply({error:'We could not confirm submission. Please try again later.'},503);}
};}
export const onRequest=context=>contactHandler()(context);
