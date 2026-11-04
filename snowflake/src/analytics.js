import './analytics.css';
import {measurementId as savedId} from './analytics-config.js';
import {CONSENT_KEY,CONSENT_MS,CONSENT_DAYS,readConsent,safeEvent} from './analytics-policy.js';
const id=String(import.meta.env.VITE_GA_MEASUREMENT_ID||savedId).trim();
const configured=/^G-[A-Z0-9]{6,20}$/.test(id);
const hosts=['snowflake3d.com','www.snowflake3d.com','preview.snowflake3d.pages.dev'];
const allowedHost=hosts.includes(location.hostname)||(import.meta.env.VITE_ANALYTICS_LOCAL_TEST==='true'&&['127.0.0.1','localhost'].includes(location.hostname));
let choice=null,active=false,loaded=false,allowTracking=false,initialized=false,expires=0,persisted=false,expiryTimer;
let channel=null;try{if(typeof BroadcastChannel==='function')channel=new BroadcastChannel('sf3d-privacy-choice');}catch{/* Cross-tab sync is optional; focus/expiry checks still apply. */}
const common=()=>({page_location:location.origin+'/snowflake',page_referrer:'',page_title:'Snowflake workshop'});
function stored(){try{const raw=document.cookie.split(';').map(v=>v.trim()).find(v=>v.startsWith(CONSENT_KEY+'='));if(!raw)return null;const decoded=decodeURIComponent(raw.slice(CONSENT_KEY.length+1)),value=readConsent(decoded);if(value)expires=JSON.parse(decoded).expires;return value;}catch{return null;}}
function save(value){choice=value;expires=Date.now()+CONSENT_MS;try{document.cookie=`${CONSENT_KEY}=${encodeURIComponent(JSON.stringify({version:1,choice:value,expires}))}; Max-Age=${CONSENT_MS/1000}; Path=/; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;persisted=stored()===value;}catch{persisted=false;}channel?.postMessage('changed');}
function watchExpiry(){clearTimeout(expiryTimer);if(!active)return;const remaining=expires-Date.now();if(remaining<=0){choice=null;stop();location.reload();return;}expiryTimer=setTimeout(watchExpiry,Math.min(remaining,2147483647));}
function clearCookies(){
 try{for(const item of document.cookie.split(';')){const name=item.trim().split('=')[0];if(!/^sf3d_ga(?:_|$)/.test(name))continue;document.cookie=`${name}=; Max-Age=0; Path=/; SameSite=Lax`;}}catch{/* Browser storage can be blocked. */}
}
function stop(){active=false;clearTimeout(expiryTimer);if(configured)window['ga-disable-'+id]=true;clearCookies();}
function start(){
 if(active||!allowTracking||!configured||!allowedHost||choice!=='granted')return;
 active=true;loaded=true;window['ga-disable-'+id]=false;window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments);};
 // These commands and the Google script exist only after affirmative consent.
 window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 window.gtag('set',{...common(),url_passthrough:false,ads_data_redaction:true});
 window.gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 window.gtag('js',new Date());
 window.gtag('config',id,{...common(),send_page_view:false,ignore_referrer:true,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_prefix:'sf3d',cookie_domain:'none',cookie_expires:CONSENT_MS/1000,cookie_update:false,cookie_flags:'SameSite=Lax;Secure',...(location.hostname==='preview.snowflake3d.pages.dev'?{debug_mode:true}:{})});
 const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);script.referrerPolicy='no-referrer';script.onerror=()=>{active=false;};document.head.append(script);
 watchExpiry();track('page_view');
}
export function track(name,input){
 if(!active||choice!=='granted'||!allowTracking)return;
 if(Date.now()>=expires||(persisted&&stored()!=='granted')){choice=null;stop();return;}
 const event=safeEvent(name,input);if(event){try{window.gtag('event',event.name,{...common(),...event.params,send_to:id});}catch{stop();}}
}
export function initAnalytics({allowTracking:pageTracking=true}={}){
 if(initialized)return;initialized=true;allowTracking=pageTracking;choice=stored();persisted=choice!==null;if(choice!=='granted')stop();
 const dialog=document.createElement('dialog');dialog.className='cookie-dialog';dialog.setAttribute('aria-labelledby','cookie-title');
 dialog.innerHTML=`<h2 id="cookie-title">Your privacy choices</h2><p>Optional Google Analytics helps us understand visits, generated designs and downloads. Your entered text, design recipes and enquiry details are excluded from our analytics events.</p><p>Accepting allows first-party analytics cookies for up to ${CONSENT_DAYS} days. Rejecting leaves the generator fully usable. You can change your choice here at any time.</p><p class="cookie-detail">The enquiry page is not tracked. <a href="/analytics" target="_blank" rel="noopener noreferrer">Analytics &amp; cookie information</a></p><p id="cookie-state" class="cookie-detail"></p><div class="cookie-actions"><button type="button" data-choice="denied">Reject analytics</button><button type="button" data-choice="granted">Accept analytics</button></div><button type="button" class="cookie-close">Close without changing</button>`;
 document.body.append(dialog);
 const show=()=>{dialog.querySelector('#cookie-state').textContent=configured&&allowedHost?'Current choice: '+(choice==='granted'?'analytics accepted':choice==='denied'?'analytics rejected':'not chosen')+'.':'Analytics is not configured on this site yet. No Google tag will load.';dialog.showModal();};
 const button=document.createElement('button');button.className='cookie-settings';button.type='button';button.textContent='Cookie settings';button.addEventListener('click',show);(document.querySelector('footer')||document.querySelector('main')||document.body).append(' · ',button);
 dialog.querySelector('.cookie-close').onclick=()=>dialog.close();
 for(const b of dialog.querySelectorAll('[data-choice]'))b.onclick=()=>{const value=b.dataset.choice;save(value);dialog.close();if(value==='granted')start();else{stop();if(loaded){window.dataLayer.length=0;window.gtag=()=>{};location.reload();}}};
 if(channel)channel.onmessage=()=>{choice=stored();persisted=choice!==null;if(choice!=='granted'){stop();if(loaded)location.reload();}};
 // Long-lived tabs must not keep tracking after the saved preference expires.
 window.addEventListener('focus',()=>{if(!loaded)return;const next=persisted?stored():(Date.now()<expires?choice:null);if(next!=='granted'){choice=next;stop();location.reload();}});
 if(allowTracking&&configured&&allowedHost){if(choice==='granted')start();else if(choice===null)show();}
}
