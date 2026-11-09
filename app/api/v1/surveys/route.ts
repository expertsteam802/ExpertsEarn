import { NextRequest, NextResponse } from "next/server";
import { authenticatePartner } from "@/lib/partner-api";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const auth = await authenticatePartner(request);
  if ("error" in auth) return auth.error;
  const { data, error } = await auth.admin.from("surveys")
    .select("id,title,status,language,response_count,response_limit,reward_rwf,partner_price_usd,created_at")
    .eq("partner_id", auth.partnerUserId).order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Could not retrieve surveys" }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await authenticatePartner(request);
  if ("error" in auth) return auth.error;
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 }); }
  if (typeof body.title !== "string" || body.title.trim().length < 3 || !Array.isArray(body.questions) || body.questions.length < 1 || body.questions.length > 100) {
    return NextResponse.json({ error: "Provide a title and between 1 and 100 questions" }, { status: 400 });
  }
  const allowed = new Set(["single_choice","multiple_choice","text","number","rating","yes_no"]);
  if (body.questions.some((question: any) => typeof question.prompt !== "string" || !question.prompt.trim() || !allowed.has(question.type || "text"))) {
    return NextResponse.json({ error: "Each question needs a prompt and a supported question type" }, { status: 400 });
  }
  const price = body.partner_price_usd === undefined ? 0.2 : Number(body.partner_price_usd);
  if (!Number.isFinite(price) || price < 0.2 || price > 0.5) {
    return NextResponse.json({ error: "Price per completed response must be between $0.20 and $0.50." }, { status: 400 });
  }
  const surveyPayload = {
    owner_id: auth.partnerUserId, partner_id: auth.partnerUserId,
    title: body.title.trim(), description: typeof body.description === "string" ? body.description.slice(0, 5000) : null,
    status: "draft", language: ["en","rw","fr"].includes(body.language) ? body.language : "en",
    target_country: body.target_country || null, target_region: body.target_region || null,
    target_city: body.target_city || null, target_province: body.target_province || null,
    target_district: body.target_district || null, target_sector: body.target_sector || null,
    target_cell: body.target_cell || null, target_village: body.target_village || null,
    min_age: body.min_age ?? null, max_age: body.max_age ?? null,
    target_gender: body.target_gender || null, response_limit: body.response_limit ?? null,
    reward_rwf: Math.max(0, Math.floor(Number(body.reward_rwf) || 0)),
    partner_price_usd: price, question_count: body.questions.length, is_random_session: false
  };
  const { data: survey, error } = await auth.admin.from("surveys").insert(surveyPayload).select("id,title,status").single();
  if (error || !survey) return NextResponse.json({ error: "Survey could not be created" }, { status: 400 });
  const questionRows = body.questions.map((question: any, index: number) => ({
    survey_id: survey.id, position: index + 1, prompt_override: question.prompt.trim(),
    question_type_override: question.type || "text", options_override: Array.isArray(question.options) ? question.options : [],
    required: question.required !== false
  }));
  const { error: questionError } = await auth.admin.from("survey_questions").insert(questionRows);
  if (questionError) {
    await auth.admin.from("surveys").delete().eq("id", survey.id);
    return NextResponse.json({ error: "Survey questions could not be saved" }, { status: 400 });
  }
  return NextResponse.json({ data: survey, message: "Survey created as draft. It must be reviewed and published before respondents can access it." }, { status: 201 });
}
