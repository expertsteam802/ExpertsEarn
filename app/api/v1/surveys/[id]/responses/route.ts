import { NextRequest, NextResponse } from "next/server";
import { authenticatePartner } from "@/lib/partner-api";
export const runtime = "nodejs";
function csvCell(value: unknown) { return '"' + String(value ?? "").replace(/"/g,'""') + '"'; }
export async function GET(request: NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const auth=await authenticatePartner(request);if("error" in auth)return auth.error;
 const {data:survey}=await auth.admin.from("surveys").select("id").eq("id",id).eq("partner_id",auth.partnerUserId).maybeSingle();
 if(!survey)return NextResponse.json({error:"Survey not found"},{status:404});
 const {data,error}=await auth.admin.from("survey_responses").select("id,submitted_at,duration_seconds,status,response_answers(answer,survey_questions(position,prompt_override,question_bank(prompt)))").eq("survey_id",id).eq("status","submitted").order("submitted_at",{ascending:false}).limit(5000);
 if(error)return NextResponse.json({error:"Could not retrieve responses"},{status:500});
 const rows=(data||[]).map((r:any)=>({response_id:r.id,submitted_at:r.submitted_at,duration_seconds:r.duration_seconds,answers:(r.response_answers||[]).map((a:any)=>({position:a.survey_questions?.position,question:a.survey_questions?.prompt_override||a.survey_questions?.question_bank?.prompt||"",answer:a.answer}))}));
 if(request.nextUrl.searchParams.get("format")==="csv"){
   const csv=["response_id,submitted_at,duration_seconds,answers_json",...rows.map(r=>[r.response_id,r.submitted_at,r.duration_seconds,JSON.stringify(r.answers)].map(csvCell).join(","))].join("\n");
   return new NextResponse(csv,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="expertsearn-${id}-responses.csv"`}});
 }
 return NextResponse.json({data:rows,count:rows.length});
}