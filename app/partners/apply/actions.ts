"use server";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
export async function applyAsPartner(formData:FormData){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const company=String(formData.get("company_name")||"").trim();if(company.length<2)redirect("/partners/apply?error=company");
 const {error}=await supabase.from("partner_accounts").insert({user_id:user.id,company_name:company,website:String(formData.get("website")||"").trim()||null,billing_email:String(formData.get("billing_email")||user.email||"")});
 if(error&&error.code!=="23505")redirect("/partners/apply?error="+encodeURIComponent(error.message));
 redirect("/partners/dashboard");
}