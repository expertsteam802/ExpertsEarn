import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
type Event = { user: { email?: string; new_email?: string; user_metadata?: { display_name?: string; full_name?: string } }; email_data: { token?: string; token_hash?: string; token_new?: string; token_hash_new?: string; redirect_to?: string; email_action_type: string } };
const APP_URL = "https://expertsearn.mywire.org";
const FROM = "ExpertsEarn";
const SUPPORT = "expertsearn@gmail.com";
const templates: Record<string, [string,string,string]> = {
 signup:["Confirm your ExpertsEarn account","Welcome to ExpertsEarn","Confirm your email address to activate your account."],
 invite:["Your ExpertsEarn invitation","You're invited to ExpertsEarn","Accept your invitation and join ExpertsEarn."],
 magiclink:["Your ExpertsEarn sign-in link","Sign in to ExpertsEarn","Use the secure link below to sign in."],
 recovery:["Reset your ExpertsEarn password","Password reset requested","Use the secure link below to reset your password. If you did not request this, ignore this email."],
 email:["Confirm your email address","Confirm your email","Use the secure link below to confirm your email address."],
 email_change:["Confirm your ExpertsEarn email change","Confirm your email change","A request was made to change your account email. Use the secure link below."],
 reauthentication:["Verify your ExpertsEarn account","Confirm it's you","Use the one-time code below to continue."],
 password_changed_notification:["Your ExpertsEarn password was changed","Password changed","Your account password was changed. If this wasn't you, contact support."],
 email_changed_notification:["Your ExpertsEarn email was changed","Email address changed","Your account email was changed. If this wasn't you, contact support."]
};
function env(k:string){const v=Deno.env.get(k)?.trim();if(!v)throw new Error("Missing secret "+k);return v;}
function esc(s:string){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));}
function redirect(raw?:string){const base=new URL(APP_URL);if(!raw)return new URL("/reset-password",base).toString();try{const u=new URL(raw);if(u.hostname==="www.expertsearn.mywire.org")u.hostname="expertsearn.mywire.org";if(u.origin!==base.origin)return new URL("/reset-password",base).toString();return u.toString();}catch{return new URL("/reset-password",base).toString();}}
function verifyUrl(hash:string,type:string,red:string){const u=new URL(env("SUPABASE_URL").replace(/\/$/,"")+"/auth/v1/verify");u.searchParams.set("token",hash);u.searchParams.set("type",type);u.searchParams.set("redirect_to",red);return u.toString();}
async function send(to:string,name:string,action:string,href:string,token?:string){
 const [subject,title,body]=templates[action]??["ExpertsEarn account update","Account update","There has been an update to your ExpertsEarn account."];
 const key=env("MAILJET_API_KEY"),secret=env("MAILJET_SECRET_KEY"),from=env("MAILJET_FROM_EMAIL");
 const link=esc(href), safeName=esc(name), safeToken=token?esc(token):"";
 const html=`<!doctype html><html><body style="margin:0;padding:36px 16px;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#172033"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e6ebf2;border-radius:18px;overflow:hidden"><tr><td style="padding:30px 36px;background:#123b75"><div style="font-size:13px;letter-spacing:2px;font-weight:700;color:#c8dcff">EXPERTSEARN</div><h1 style="margin:18px 0 0;color:#ffffff;font-size:27px;line-height:1.25">${esc(title)}</h1></td></tr><tr><td style="padding:34px 36px"><p style="margin:0 0 18px;font-size:16px">Hello ${safeName},</p><p style="margin:0 0 26px;color:#526176;font-size:15px;line-height:1.7">${esc(body)}</p><p style="margin:0 0 26px"><a href="${link}" style="display:inline-block;padding:15px 25px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;border-radius:9px">Reset my password</a></p><p style="margin:0;color:#718096;font-size:13px;line-height:1.65">This secure link is for your account only. If you did not request a password reset, you can safely ignore this email.</p></td></tr><tr><td style="padding:20px 36px;background:#f8fafc;border-top:1px solid #e6ebf2;color:#8792a3;font-size:12px;line-height:1.6">ExpertsEarn · Account security<br>Need help? ${SUPPORT}</td></tr></table></body></html>`;
 const text=`Hello ${name},\n\n${body}\n\n${href}${token?"\nVerification code: "+token:""}\n\nExpertsEarn Support: ${SUPPORT}`;
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