"use client";

import { useState } from "react";
import { importQuestions } from "@/app/admin/questions/actions";

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') { field += '"'; index++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  return rows.filter((item) => item.some((cell) => cell.trim().length));
}

export function QuestionBankImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function runImport() {
    if (!file) return;
    setBusy(true); setProgress(0); setTotal(0); setMessage(""); setError("");
    try {
      const matrix = parseCsv(await file.text());
      if (matrix.length < 2) throw new Error("The CSV needs a header row and at least one question.");
      const headers = matrix[0].map((header) => header.trim().toLowerCase());
      if (!headers.includes("prompt")) throw new Error("CSV must include a prompt column.");
      const rows = matrix.slice(1).map((cells) => {
        const record: Record<string, string> = {};
        headers.forEach((header, index) => { record[header] = cells[index] || ""; });
        let options: unknown = [];
        if (record.options?.trim()) {
          try { options = JSON.parse(record.options); }
          catch { throw new Error("The options column must contain valid JSON arrays."); }
        }
        return {
          prompt: record.prompt,
          prompt_rw: record.prompt_rw,
          prompt_fr: record.prompt_fr,
          question_type: record.question_type || "text",
          options,
          difficulty: Number(record.difficulty || 1),
          language: record.language || "en",
          category_slug: record.category_slug || undefined
        };
      });
      setTotal(rows.length);
      let inserted = 0;
      for (let offset = 0; offset < rows.length; offset += 100) {
        inserted += await importQuestions(rows.slice(offset, offset + 100));
        setProgress(inserted);
      }
      setMessage("Successfully imported " + inserted.toLocaleString() + " questions.");
      setFile(null);
    } catch (reason: any) {
      setError(reason?.message || "Question import failed.");
    } finally { setBusy(false); }
  }

  return <section className="surface p-6">
    <h2 className="text-lg font-black text-slate-950">Bulk question import</h2>
    <p className="mt-2 text-sm leading-6 text-slate-500">Upload a CSV with up to 10,000+ questions. The importer validates each row and writes in safe batches of 100.</p>
    <p className="mt-2 text-xs text-slate-500">Columns: prompt, prompt_rw, prompt_fr, question_type, options, difficulty, language, category_slug. Options must be a JSON array.</p>
    <a href="/question-bank-template.csv" className="mt-3 inline-block text-sm font-bold text-forest underline">Download CSV template</a>
    <input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-4 block w-full text-sm"/>
    <button type="button" disabled={!file || busy} onClick={runImport} className="mt-4 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Importing…" : "Import question bank"}</button>
    {busy && <div className="mt-4"><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-forest" style={{ width: total ? (progress / total * 100) + "%" : "0%" }}/></div><p className="mt-2 text-xs text-slate-500">{progress.toLocaleString()} / {total.toLocaleString()} imported</p></div>}
    {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
  </section>;
}
