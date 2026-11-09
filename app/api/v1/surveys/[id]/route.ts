import { NextRequest, NextResponse } from "next/server";
import { authenticatePartner } from "@/lib/partner-api";
export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
 const auth=await authenticatePartner(request);if("error" in auth)return auth.error;
 const {data,error}=await auth.admin.from("surveys").select("id,title,description,status,language,target_country,target_region,target_city,min_age,max_age,target_gender,response_limit,response_count,reward_rwf,partner_price_usd,created_at,updated_at").eq("id",params.id).eq("partner_id",auth.partnerUserId).maybeSingle();
 if(error||!data)return NextResponse.json({error:"Survey not found"},{status:404});
 return NextResponse.json({data});
}