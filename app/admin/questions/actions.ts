"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type ImportQuestion = {
  prompt: string; prompt_rw?: string; prompt_fr?: string; question_type: string;
  options?: unknown; difficulty?: number; language?: string; category_slug?: string;
};

export async function importQuestions(rows: ImportQuestion[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Admin access required.");
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 500) throw new Error("Import between 1 and 500 questions per batch.");

  const { data: categories, error: categoryError } = await supabase.from("survey_categories").select("id,slug");
  if (categoryError) throw new Error("Could not load question categories.");
  const categoryMap = new Map((categories || []).map((category) => [category.slug, category.id]));
  const allowed = new Set(["single_choice", "multiple_choice", "text", "number", "rating", "yes_no"]);

  const payload = rows.map((row, index) => {
    const prompt = String(row.prompt || "").trim();
    const type = String(row.question_type || "text");
    const language = String(row.language || "en");
    const difficulty = Number(row.difficulty || 1);
    if (!prompt || prompt.length > 2000) throw new Error("Question " + (index + 1) + " needs a prompt up to 2,000 characters.");
    if (!allowed.has(type)) throw new Error("Question " + (index + 1) + " has an unsupported type.");
    if (!["en", "rw", "fr"].includes(language)) throw new Error("Question " + (index + 1) + " has an unsupported language.");
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) throw new Error("Question " + (index + 1) + " difficulty must be 1–5.");
    const categoryId = row.category_slug ? categoryMap.get(row.category_slug) : null;
    if (row.category_slug && !categoryId) throw new Error("Unknown category slug: " + row.category_slug);
    const options = row.options ?? [];
    if (!Array.isArray(options)) throw new Error("Question " + (index + 1) + " options must be a JSON array.");
    return {
      prompt,
      prompt_rw: row.prompt_rw?.trim() || null,
      prompt_fr: row.prompt_fr?.trim() || null,
      question_type: type,
      options,
      difficulty,
      language,
      category_id: categoryId || null,
      is_active: true,
      created_by: user.id
    };
  });

  const { error } = await supabase.from("question_bank").insert(payload);
  if (error) throw new Error(error.message);
  return payload.length;
}

export async function createRandomSurvey(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const title = String(formData.get("title") || "").trim();
  const language = String(formData.get("language") || "en");
  const rewardRaw = String(formData.get("reward_rwf") ?? "").trim();
  const reward = Number(rewardRaw);
  const questionCount = Number(formData.get("question_count") || 20);
  if (!title || !rewardRaw || !Number.isSafeInteger(reward) || reward < 0 || reward > 1000000 || !Number.isInteger(questionCount)) {
    redirect("/admin/questions?error=invalid");
  }
  const { data, error } = await supabase.rpc("admin_create_random_survey", {
    p_title: title, p_language: language, p_reward_rwf: reward, p_question_count: questionCount
  });
  if (error) redirect("/admin/questions?error=" + encodeURIComponent(error.message));
  redirect("/admin/questions?created=" + encodeURIComponent(String(data)));
}


export async function generateStarterSurveys(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const surveyCount = Number(formData.get("survey_count") || 100);
  const questionCount = Number(formData.get("question_count") || 20);
  const rewardRaw = String(formData.get("reward_rwf") ?? "").trim();
  const reward = Number(rewardRaw);
  if (!rewardRaw || !Number.isInteger(surveyCount) || !Number.isInteger(questionCount) || !Number.isSafeInteger(reward) || reward < 0 || reward > 1000000) redirect("/admin/questions?error=invalid_starter_batch");
  const { data, error } = await supabase.rpc("admin_generate_starter_survey_set", {
    p_survey_count: surveyCount, p_questions_per_survey: questionCount, p_reward_rwf: reward
  });
  if (error) redirect("/admin/questions?error=" + encodeURIComponent(error.message));
  redirect("/admin/questions?starter_generated=" + encodeURIComponent(String(data)));
}
