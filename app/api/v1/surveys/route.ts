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

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > 512 * 1024) {
    return NextResponse.json({ error: "Request body is too large (512 KB maximum)." }, { status: 413 });
  }

  let body: any;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 512 * 1024) {
      return NextResponse.json({ error: "Request body is too large (512 KB maximum)." }, { status: 413 });
    }
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }
  if (typeof body.title !== "string" || body.title.trim().length < 3 || body.title.trim().length > 140 || !Array.isArray(body.questions) || body.questions.length < 1 || body.questions.length > 100) {
    return NextResponse.json({ error: "Provide a title and between 1 and 100 questions" }, { status: 400 });
  }

  const allowed = new Set(["single_choice", "multiple_choice", "text", "number", "rating", "yes_no"]);
  const invalidQuestion = body.questions.some((question: any) => {
    if (!question || typeof question !== "object" || Array.isArray(question)) return true;
    if (typeof question.prompt !== "string" || !question.prompt.trim() || question.prompt.trim().length > 2000 || !allowed.has(question.type || "text")) return true;
    if (question.required !== undefined && typeof question.required !== "boolean") return true;
    const type = question.type || "text";
    if (type === "single_choice" || type === "multiple_choice") {
      const options = question.options;
      return !Array.isArray(options) || options.length < 2 || options.length > 30 || !options.every((option: any) => {
        if (typeof option === "string") return option.trim().length > 0 && option.trim().length <= 200;
        return !!option && typeof option === "object" &&
          typeof option.label === "string" && option.label.trim().length > 0 && option.label.trim().length <= 200 &&
          typeof option.value === "string" && option.value.trim().length > 0 && option.value.trim().length <= 200;
      });
    }
    return question.options !== undefined && !Array.isArray(question.options);
  });
  if (invalidQuestion) {
    return NextResponse.json({ error: "Each question needs a valid prompt, supported type and valid answer options." }, { status: 400 });
  }

  const textFields = ["target_country", "target_region", "target_city", "target_province", "target_district", "target_sector", "target_cell", "target_village"] as const;
  if (textFields.some((field) => body[field] !== undefined && body[field] !== null && (typeof body[field] !== "string" || body[field].trim().length > 120)) ||
      (body.description !== undefined && body.description !== null && (typeof body.description !== "string" || body.description.length > 5000)) ||
      (body.language !== undefined && !["en", "rw", "fr"].includes(body.language))) {
    return NextResponse.json({ error: "One or more survey text, language or targeting fields are invalid." }, { status: 400 });
  }

  const { data: pricingSetting, error: pricingError } = await auth.admin.from("platform_settings").select("value").eq("key", "survey_pricing_usd").maybeSingle();
  if (pricingError) return NextResponse.json({ error: "Survey pricing is temporarily unavailable." }, { status: 503 });
  const minPrice = Number(pricingSetting?.value?.min ?? 0.2);
  const maxPrice = Number(pricingSetting?.value?.max ?? 0.5);
  const price = body.partner_price_usd === undefined ? minPrice : Number(body.partner_price_usd);
  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || minPrice < 0 || maxPrice < minPrice ||
      !Number.isFinite(price) || price < minPrice || price > maxPrice) {
    return NextResponse.json({ error: `Price per completed response must be between ${minPrice.toFixed(2)} and ${maxPrice.toFixed(2)}.` }, { status: 400 });
  }

  const responseLimit = body.response_limit === undefined || body.response_limit === null ? null : Number(body.response_limit);
  const minAge = body.min_age === undefined || body.min_age === null ? null : Number(body.min_age);
  const maxAge = body.max_age === undefined || body.max_age === null ? null : Number(body.max_age);
  const rewardRwf = body.reward_rwf === undefined ? 0 : Number(body.reward_rwf);
  const targetGender = body.target_gender ?? null;
  if (!Number.isSafeInteger(rewardRwf) || rewardRwf < 0 || rewardRwf > 100000 ||
      (targetGender !== null && (typeof targetGender !== "string" || !["female", "male", "non_binary", "prefer_not_to_say"].includes(targetGender))) ||
      (responseLimit !== null && (!Number.isInteger(responseLimit) || responseLimit < 1 || responseLimit > 100000)) ||
      (minAge !== null && (!Number.isInteger(minAge) || minAge < 13 || minAge > 100)) ||
      (maxAge !== null && (!Number.isInteger(maxAge) || maxAge < 13 || maxAge > 100)) ||
      (minAge !== null && maxAge !== null && minAge > maxAge)) {
    return NextResponse.json({ error: "Response limit, reward and age targeting values are invalid." }, { status: 400 });
  }

  const surveyPayload = {
    owner_id: auth.partnerUserId, partner_id: auth.partnerUserId,
    title: body.title.trim(), description: typeof body.description === "string" ? body.description.trim() : null,
    status: "draft", language: body.language ?? "en",
    target_country: body.target_country?.trim() || null, target_region: body.target_region?.trim() || null,
    target_city: body.target_city?.trim() || null, target_province: body.target_province?.trim() || null,
    target_district: body.target_district?.trim() || null, target_sector: body.target_sector?.trim() || null,
    target_cell: body.target_cell?.trim() || null, target_village: body.target_village?.trim() || null,
    min_age: minAge, max_age: maxAge, target_gender: targetGender,
    response_limit: responseLimit, reward_rwf: rewardRwf,
    partner_price_usd: price, question_count: body.questions.length, is_random_session: false
  };

  const { data: survey, error } = await auth.admin.from("surveys").insert(surveyPayload).select("id,title,status").single();
  if (error || !survey) return NextResponse.json({ error: "Survey could not be created." }, { status: 500 });

  const questionRows = body.questions.map((question: any, index: number) => ({
    survey_id: survey.id, position: index + 1, prompt_override: question.prompt.trim(),
    question_type_override: question.type || "text", options_override: Array.isArray(question.options) ? question.options : [],
    required: question.required !== false
  }));
  const { error: questionError } = await auth.admin.from("survey_questions").insert(questionRows);
  if (questionError) {
    const { error: cleanupError } = await auth.admin.from("surveys").delete().eq("id", survey.id);
    if (cleanupError) {
      return NextResponse.json({ error: "Survey questions could not be saved; support may need to remove the incomplete draft.", survey_id: survey.id }, { status: 500 });
    }
    return NextResponse.json({ error: "Survey questions could not be saved. No survey was created." }, { status: 500 });
  }

  return NextResponse.json(
    { data: survey, message: "Survey created as draft. It must be reviewed and published before respondents can access it." },
    { status: 201, headers: { "Cache-Control": "private, no-store" } }
  );
}
