import './contact.css';
const form=document.getElementById('contact-form'),send=document.getElementById('send'),status=document.getElementById('contact-status');let token='',widget,busy=false;
const update=()=>{send.disabled=!token||busy;};
function reset(){token='';update();if(widget!==undefined)window.turnstile?.reset(widget);}
async function start(){try{
 const response=await fetch('/api/contact',{cache:'no-store'}),config=await response.json();
 if(!response.ok||!config.available||!config.siteKey)throw Error('The enquiry form is not available yet. Please try again later.');
 await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.onload=resolve;script.onerror=()=>reject(Error('The security check could not load. Please refresh and try again.'));document.head.append(script);});
 widget=window.turnstile.render('#security-check',{sitekey:config.siteKey,action:'privacy-contact',size:'flexible',callback:value=>{token=value;status.textContent='Ready to send.';update();},'expired-callback':()=>{token='';status.textContent='Please complete the security check again.';update();},'error-callback':()=>{token='';status.textContent='The security check failed. Please refresh and try again.';update();}});
 status.textContent='Complete the security check to send your enquiry.';
}catch(e){status.textContent=e.message;}}
form.addEventListener('submit',async event=>{event.preventDefault();if(busy||!token||!form.reportValidity())return;busy=true;update();status.textContent='Submitting your enquiry…';
 try{const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.elements.email.value,message:form.elements.message.value,website:form.elements.website.value,token})});const result=await response.json();if(!response.ok||result.ok!==true)throw Error(result.error||'Unable to submit your enquiry. Please try again.');form.reset();reset();status.textContent=result.message;}
 catch(e){reset();status.textContent=e.message==='Failed to fetch'?'Could not confirm submission. Check your connection before trying again.':e.message;}
 finally{busy=false;update();}
});
start();
