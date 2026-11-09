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
  if (typeof body.title !== "string" || body.title.trim().length < 3 || body.title.trim().length > 140 || !Array.isArray(body.questions) || body.questions.length < 1 || body.questions.length > 100) {
    return NextResponse.json({ error: "Provide a title and between 1 and 100 questions" }, { status: 400 });
  }
  const allowed = new Set(["single_choice","multiple_choice","text","number","rating","yes_no"]);
  if (body.questions.some((question: any) => {
    if (typeof question.prompt !== "string" || !question.prompt.trim() || question.prompt.length > 2000 || !allowed.has(question.type || "text")) return true;
    const type = question.type || "text";
    if (type === "single_choice" || type === "multiple_choice") {
      const options = question.options;
      return !Array.isArray(options) || options.length < 2 || options.length > 30 || !options.every((option: any) => typeof option === "string" ? option.trim().length > 0 : option && typeof option.label === "string" && typeof option.value === "string" && option.label.trim().length > 0 && option.value.trim().length > 0);
    }
    return false;
  })) {
    return NextResponse.json({ error: "Each question needs a prompt and a supported question type" }, { status: 400 });
  }
  const price = body.partner_price_usd === undefined ? 0.2 : Number(body.partner_price_usd);
  if (!Number.isFinite(price) || price < 0.2 || price > 0.5) {
    return NextResponse.json({ error: "Price per completed response must be between $0.20 and $0.50." }, { status: 400 });
  }
  const responseLimit = body.response_limit === undefined || body.response_limit === null ? null : Number(body.response_limit);
  const minAge = body.min_age === undefined || body.min_age === null ? null : Number(body.min_age);
  const maxAge = body.max_age === undefined || body.max_age === null ? null : Number(body.max_age);
  const rewardRwf = body.reward_rwf === undefined ? 0 : Number(body.reward_rwf);
  const targetGender = body.target_gender ?? null;
  if (!Number.isSafeInteger(rewardRwf) || rewardRwf < 0 || rewardRwf > 100000 || (targetGender !== null && !["female","male","non_binary","prefer_not_to_say"].includes(targetGender)) || (responseLimit !== null && (!Number.isInteger(responseLimit) || responseLimit < 1 || responseLimit > 100000)) || (minAge !== null && (!Number.isInteger(minAge) || minAge < 13 || minAge > 100)) || (maxAge !== null && (!Number.isInteger(maxAge) || maxAge < 13 || maxAge > 100)) || (minAge !== null && maxAge !== null && minAge > maxAge)) {
    return NextResponse.json({ error: "Response limit and age targeting values are invalid." }, { status: 400 });
  }
  const surveyPayload = {
    owner_id: auth.partnerUserId, partner_id: auth.partnerUserId,
    title: body.title.trim(), description: typeof body.description === "string" ? body.description.slice(0, 5000) : null,
    status: "draft", language: ["en","rw","fr"].includes(body.language) ? body.language : "en",
    target_country: body.target_country || null, target_region: body.target_region || null,
    target_city: body.target_city || null, target_province: body.target_province || null,
    target_district: body.target_district || null, target_sector: body.target_sector || null,
    target_cell: body.target_cell || null, target_village: body.target_village || null,
    min_age: minAge, max_age: maxAge,
    target_gender: body.target_gender || null, response_limit: responseLimit,
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
