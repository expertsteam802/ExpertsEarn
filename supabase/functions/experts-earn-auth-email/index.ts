import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
type Event = { user: { email?: string; new_email?: string; user_metadata?: { display_name?: string; full_name?: string; first_name?: string; name?: string } }; email_data: { token?: string; token_hash?: string; token_new?: string; token_hash_new?: string; redirect_to?: string; email_action_type: string } };
const APP_URL = "https://expertsearn.mywire.org";
const FROM = "ExpertsEarn";
const SUPPORT = "expertsearn@gmail.com";
const templates: Record<string, [string,string,string,string,string]> = {
 signup:["Confirm your ExpertsEarn account","Welcome aboard","Your ExpertsEarn account is almost ready. Confirm your email address to activate it and start using your account.","Confirm my email","If you did not create this account, you can ignore this message."],
 invite:["You're invited to ExpertsEarn","You have an invitation","Someone has invited you to join ExpertsEarn. Confirm your invitation using the secure button below.","Accept invitation","If you were not expecting this invitation, you can safely ignore this email."],
 magiclink:["Your secure ExpertsEarn sign-in link","Sign in securely","Use the button below to securely sign in to your ExpertsEarn account. This link can only be used once.","Sign in to ExpertsEarn","If you did not request this sign-in link, you can ignore this message."],
 recovery:["Reset your ExpertsEarn password","Let's get you back in","We received a request to reset the password for your ExpertsEarn account. Choose a new password using the secure button below.","Create a new password","If you did not request a password reset, no action is needed. Your password will remain unchanged."],
 email:["Confirm your email address","One quick confirmation","Please confirm this email address to finish setting up your ExpertsEarn account.","Confirm email address","If you did not request this change, you can ignore this message."],
 email_change:["Confirm your new email address","Confirm your email change","A change to the email address on your ExpertsEarn account was requested. Confirm it using the secure button below.","Confirm email change","If you did not request this change, please contact our support team."],
 reauthentication:["Verify your ExpertsEarn account","One more security check","Use the one-time verification code included below to confirm it is you and continue.","Continue securely","Never share a verification code with anyone."],
 password_changed_notification:["Your ExpertsEarn password was changed","Your password was updated","The password for your ExpertsEarn account was changed successfully. If this was you, no further action is needed.","Visit ExpertsEarn","If you did not make this change, contact support immediately."],
 email_changed_notification:["Your ExpertsEarn email was changed","Your email address was updated","The email address on your ExpertsEarn account was changed successfully. If this was you, no further action is needed.","Visit ExpertsEarn","If you did not make this change, contact support immediately."]
};
function env(k:string){const v=Deno.env.get(k)?.trim();if(!v)throw new Error("Missing secret "+k);return v;}
function esc(s:string){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));}
function redirect(raw?:string){const base=new URL(APP_URL);if(!raw)return new URL("/reset-password",base).toString();try{const u=new URL(raw);if(u.hostname==="www.expertsearn.mywire.org")u.hostname="expertsearn.mywire.org";if(u.origin!==base.origin)return new URL("/reset-password",base).toString();return u.toString();}catch{return new URL("/reset-password",base).toString();}}
function verifyUrl(hash:string,type:string,red:string){const u=new URL(env("SUPABASE_URL").replace(/\/$/,"")+"/auth/v1/verify");u.searchParams.set("token",hash);u.searchParams.set("type",type);u.searchParams.set("redirect_to",red);return u.toString();}
async function send(to:string,name:string,action:string,href:string,token?:string){
 const [subject,title,body,buttonText,securityNote]=templates[action]??["ExpertsEarn account update","An update to your account","There has been an update to your ExpertsEarn account.","Open ExpertsEarn","If you did not expect this message, contact support."];
 const key=env("MAILJET_API_KEY"),secret=env("MAILJET_SECRET_KEY"),from=env("MAILJET_FROM_EMAIL");
 const link=esc(href),safeName=esc(name),safeToken=token?esc(token):"";
 const isCode=action==="reauthentication"&&!!safeToken;
 const logo=APP_URL+"/expertsearn-mark.svg";
 const actionUrl=action==="password_changed_notification"||action==="email_changed_notification"?APP_URL:href;
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:32px 14px;background:#090a0f;font-family:Arial,Helvetica,sans-serif;color:#f2ecdf">
 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center">
 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#111219;border:1px solid #343039;border-radius:16px;overflow:hidden">
 <tr><td align="center" style="padding:30px 28px 24px;background:#090a0f;border-bottom:1px solid #403629">
 <img src="${esc(logo)}" width="58" height="58" alt="ExpertsEarn" style="display:block;width:58px;height:58px;border:0;border-radius:13px;margin:0 auto 13px">
 <div style="font-size:22px;line-height:1.2;font-weight:800;letter-spacing:-.5px;color:#f2ecdf">Experts<span style="color:#c6a873">Earn</span></div>
 <div style="margin-top:8px;font-size:10px;letter-spacing:2.5px;font-weight:700;color:#c6a873">YOUR NEXT OPPORTUNITY STARTS HERE</div>
 </td></tr>
 <tr><td style="padding:34px 34px 18px">
 <div style="font-size:11px;letter-spacing:1.8px;text-transform:uppercase;font-weight:700;color:#c6a873;margin-bottom:13px">ACCOUNT SECURITY</div>
 <h1 style="margin:0 0 19px;font-size:27px;line-height:1.25;font-weight:750;color:#f2ecdf">${esc(title)}</h1>
 <p style="margin:0 0 17px;font-size:16px;line-height:1.6;color:#f2ecdf">Hello ${safeName},</p>
 <p style="margin:0 0 26px;font-size:15px;line-height:1.8;color:#b8b2a8">${esc(body)}</p>
 ${isCode?`<div style="margin:0 0 25px;padding:18px;text-align:center;border:1px solid #5b4930;border-radius:10px;background:#1b1916;color:#e2c895;font-size:28px;font-weight:800;letter-spacing:7px">${safeToken}</div>`: `<p style="margin:0 0 27px"><a href="${esc(actionUrl)}" style="display:inline-block;padding:15px 25px;background:#c6a873;color:#111116;text-decoration:none;font-size:14px;font-weight:800;border-radius:8px">${esc(buttonText)}</a></p>`}
 <div style="height:1px;background:#343039;margin:0 0 20px"></div>
 <p style="margin:0 0 12px;font-size:13px;line-height:1.75;color:#a5a0a0">${esc(securityNote)}</p>
 ${actionUrl!==APP_URL?`<p style="margin:0;font-size:12px;line-height:1.7;color:#827d78">If the button does not work, copy and paste this address into your browser:<br><a href="${esc(actionUrl)}" style="color:#c6a873;word-break:break-all">${esc(actionUrl)}</a></p>`: ""}
 </td></tr>
 <tr><td style="padding:21px 34px;background:#0d0e13;border-top:1px solid #343039">
 <p style="margin:0 0 7px;font-size:12px;font-weight:700;color:#c6a873">ExpertsEarn · Account support</p>
 <p style="margin:0;font-size:12px;line-height:1.7;color:#85818a">Need a hand? Contact <a href="mailto:${esc(SUPPORT)}" style="color:#c6a873;text-decoration:none">${esc(SUPPORT)}</a>.</p>
 <p style="margin:12px 0 0;font-size:11px;color:#65616a">This is an automated account message. Please do not reply directly.</p>
 </td></tr></table>
 </td></tr></table></body></html>`;
 const text=`Hello ${name},\n\n${body}\n\n${isCode?"Your verification code: "+token:actionUrl}\n\n${securityNote}\n\nExpertsEarn Support: ${SUPPORT}`;
 const res=await fetch("https://api.mailjet.com/v3.1/send",{method:"POST",headers:{"Authorization":"Basic "+btoa(key+":"+secret),"Content-Type":"application/json"},body:JSON.stringify({Messages:[{From:{Email:from,Name:FROM},To:[{Email:to,Name:name}],Subject:subject,TextPart:text,HTMLPart:html}]}),signal:AbortSignal.timeout(15000)});
 const data=await res.json().catch(()=>({}));
 if(!res.ok||data?.Messages?.[0]?.Status!=="success"){console.error("Mailjet error",res.status,JSON.stringify(data).slice(0,500));throw new Error("Mailjet rejected email, HTTP "+res.status);}
}
Deno.serve(async req=>{
 if(req.method!=="POST")return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:{"Content-Type":"application/json"}});
 try{
  const payload=await req.text();
  const headers=Object.fromEntries(req.headers);
  headers["Content-Type"]=req.headers.get("content-type")??"application/json";
  const configuredSecrets=env("SEND_EMAIL_HOOK_SECRET").split("|").map(value=>value.trim()).filter(Boolean);
  let event:Event|undefined;
  for(const configuredSecret of configuredSecrets){
   const secret=configuredSecret.replace(/^v1,whsec_/,"");
   try{event=new Webhook(secret).verify(payload,headers) as Event;break;}catch{}
  }
  if(!event)throw new Error("Webhook signature verification failed for configured signing secrets");
  const action=event.email_data?.email_action_type,email=event.user?.email?.trim();
  if(!action||!email)throw new Error("Invalid Supabase Auth Hook payload");
  const name=(event.user.user_metadata?.display_name??event.user.user_metadata?.full_name??"there").replace(/[<>\r\n]/g,"").slice(0,80)||"there";
  const d=event.email_data;
  const red=action==="recovery"?new URL("/reset-password",APP_URL).toString():redirect(d.redirect_to);
  if(action==="email_change"){
   const newEmail=event.user.new_email?.trim();
   if(d.token_hash_new&&d.token_hash&&d.token&&d.token_new&&newEmail){
    await send(email,name,action,verifyUrl(d.token_hash_new,action,red),d.token);
    await new Promise(r=>setTimeout(r,1100));
    await send(newEmail,name,action,verifyUrl(d.token_hash,action,red),d.token_new);
   }else{
    const hash=d.token_hash??d.token_hash_new;if(!hash)throw new Error("Email-change token hash missing");
    await send(newEmail??email,name,action,verifyUrl(hash,action,red),d.token??d.token_new);
   }
  }else{
   const tokenTypes=new Set(["signup","invite","magiclink","recovery","email","reauthentication"]);
   const hash=d.token_hash;
   if(tokenTypes.has(action)&&!hash)throw new Error("Auth token hash missing");
   await send(email,name,action,tokenTypes.has(action)?verifyUrl(hash!,action,red):APP_URL,action==="recovery"?undefined:d.token);
  }
  return new Response("{}",{status:200,headers:{"Content-Type":"application/json"}});
 }catch(e){
  console.error("ExpertsEarn auth email hook error",e instanceof Error?e.message:"unknown");
  return new Response(JSON.stringify({error:{message:"Authentication email could not be delivered"}}),{status:500,headers:{"Content-Type":"application/json"}});
 }
});