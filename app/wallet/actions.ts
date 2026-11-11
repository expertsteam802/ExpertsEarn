"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export async function requestPayout(formData: FormData) {
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect("/login");
 const amount=Number(formData.get("amount"));
 const method=String(formData.get("method")||"");
 const destination=String(formData.get("destination")||"").trim();
 if(!Number.isSafeInteger(amount)||amount<1000||!destination) redirect("/wallet/payout?error=invalid");
 const {data:requestId,error}=await supabase.rpc("request_payout",{p_amount_rwf:amount,p_method:method,p_destination:destination});
 if(error) redirect("/wallet/payout?error="+encodeURIComponent(error.message));
 if(typeof requestId!=="string"||!requestId) redirect("/wallet/payout?error=request_id_missing");
 redirect("/wallet/payout?request="+encodeURIComponent(requestId));
}