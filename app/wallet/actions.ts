"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export async function requestPayout(formData: FormData) {
 const supabase=createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect("/login");
 const amount=Number(formData.get("amount"));
 const method=String(formData.get("method")||"");
 const destination=String(formData.get("destination")||"").trim();
 if(!Number.isSafeInteger(amount)||amount<1000||!destination) redirect("/wallet/payout?error=invalid");
 const {error}=await supabase.rpc("request_payout",{p_amount_rwf:amount,p_method:method,p_destination:destination});
 if(error) redirect("/wallet/payout?error="+encodeURIComponent(error.message));
 redirect("/wallet?payout=requested");
}