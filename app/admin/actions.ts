"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export async function updatePayout(formData:FormData){
 const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const id=String(formData.get("payout_id")||"");const status=String(formData.get("status")||"");
 const note=String(formData.get("note")||"");
 const {error}=await supabase.rpc("admin_update_payout",{p_payout_id:id,p_status:status,p_note:note});
 if(error)redirect("/admin?error="+encodeURIComponent(error.message));
 redirect("/admin?updated=1");
}
export async function approvePartner(formData:FormData){
 const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const id=String(formData.get("partner_id")||"");
 const {error}=await supabase.from("partner_accounts").update({is_approved:true}).eq("id",id);
 if(error)redirect("/admin?error="+encodeURIComponent(error.message));
 redirect("/admin?partner_approved=1");
}
