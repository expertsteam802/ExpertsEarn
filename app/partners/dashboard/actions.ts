"use server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {createHash,randomBytes} from "node:crypto";
import {redirect} from "next/navigation";

export async function createPartnerApiKey(){
 const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Sign in first.");
 const admin=createAdminClient();
 const {data:account}=await admin.from("partner_accounts").select("id,is_approved").eq("user_id",user.id).maybeSingle();
 if(!account||!account.is_approved)throw new Error("Your partner account must be approved before API access is enabled.");
 const raw="ee_live_"+randomBytes(32).toString("base64url");
 const hash=createHash("sha256").update(raw).digest("hex");
 const {error}=await admin.from("partner_api_keys").insert({partner_id:account.id,key_hash:hash,key_prefix:raw.slice(0,14),label:"Primary API key"});
 if(error)throw new Error("Could not create API key.");
 return raw;
}

export async function createPartnerSurvey(formData:FormData){
 const supabase=createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const admin=createAdminClient();
 const {data:account}=await admin.from("partner_accounts").select("id,is_approved").eq("user_id",user.id).maybeSingle();
 if(!account||!account.is_approved)redirect("/partners/dashboard?error=partner_not_approved");
 const title=String(formData.get("title")||"").trim();
 const description=String(formData.get("description")||"").trim();
 const language=String(formData.get("language")||"en");
 const reward=Number(formData.get("reward_rwf")||0);
 const responseLimit=Number(formData.get("response_limit")||100);
 const price=Number(formData.get("partner_price_usd")||0.2);
 const country=String(formData.get("target_country")||"").trim().toUpperCase();
 const targetGender=String(formData.get("target_gender")||"").trim()||null;
 const region=String(formData.get("target_region")||"").trim();
 const city=String(formData.get("target_city")||"").trim();
 const geo=(name:string)=>String(formData.get(name)||"").trim()||null;
 const minAgeRaw=String(formData.get("min_age")||"").trim();
 const maxAgeRaw=String(formData.get("max_age")||"").trim();
 const minAge=minAgeRaw?Number(minAgeRaw):null;
 const maxAge=maxAgeRaw?Number(maxAgeRaw):null;
 let questions:any[];
 try{questions=JSON.parse(String(formData.get("questions_json")||"[]"));}catch{redirect("/partners/dashboard?error=invalid_questions_json");}
 const allowed=new Set(["text","number","rating","yes_no","single_choice","multiple_choice"]);
 const validQuestions=Array.isArray(questions)&&questions.length>=1&&questions.length<=100&&questions.every(q=>{
  if(!q||typeof q.prompt!=="string"||!q.prompt.trim()||q.prompt.length>2000||!allowed.has(q.type||"text"))return false;
  const type=q.type||"text";
  const options=Array.isArray(q.options)?q.options:[];
  if((type==="single_choice"||type==="multiple_choice")&&(options.length<2||options.length>30||!options.every((option:any)=>typeof option==="string"||(option&&typeof option.label==="string"&&typeof option.value==="string"))))return false;
  return true;
 });
 if(title.length<3||title.length>140||description.length>5000||!["en","rw","fr"].includes(language)||!Number.isSafeInteger(reward)||reward<0||reward>100000||!Number.isInteger(responseLimit)||responseLimit<1||responseLimit>100000||!Number.isFinite(price)||price<0.2||price>0.5||!validQuestions||(targetGender!==null&&!["female","male","non_binary","prefer_not_to_say"].includes(targetGender))||(minAge!==null&&(!Number.isInteger(minAge)||minAge<13||minAge>100))||(maxAge!==null&&(!Number.isInteger(maxAge)||maxAge<13||maxAge>100))||(minAge!==null&&maxAge!==null&&minAge>maxAge)){
  redirect("/partners/dashboard?error=invalid_survey_details");
 }
 const normalized=questions.map((q:any)=>({prompt:q.prompt.trim(),type:q.type||"text",options:Array.isArray(q.options)?q.options:[],required:q.required!==false}));
 const {data:survey,error}=await admin.from("surveys").insert({
  owner_id:user.id,partner_id:user.id,title,description:description||null,status:"draft",language,
  target_country:country||null,target_region:region||null,target_city:city||null,
  target_province:geo("target_province"),target_district:geo("target_district"),target_sector:geo("target_sector"),
  target_cell:geo("target_cell"),target_village:geo("target_village"),target_gender:targetGender,
  min_age:minAge,max_age:maxAge,response_limit:responseLimit,reward_rwf:reward,partner_price_usd:price,
  question_count:normalized.length,is_random_session:false
 }).select("id").single();
 if(error||!survey)redirect("/partners/dashboard?error=survey_create_failed");
 const rows=normalized.map((q:any,index:number)=>({survey_id:survey.id,position:index+1,prompt_override:q.prompt,question_type_override:q.type,options_override:q.options,required:q.required}));
 const {error:questionError}=await admin.from("survey_questions").insert(rows);
 if(questionError){await admin.from("surveys").delete().eq("id",survey.id);redirect("/partners/dashboard?error=survey_questions_failed");}
 redirect("/partners/dashboard?created=1");
}
