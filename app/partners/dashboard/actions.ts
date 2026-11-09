"use server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {createHash,randomBytes} from "node:crypto";
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