import { supabase } from "../../lib/supabase";

// ─── Section yang bisa di-generate ───────────────────────────────────────────

export type SrsSection =
  // Section 1: Pendahuluan
  | "purpose"
  | "scope"
  | "glossary"
  // Section 2: Deskripsi Umum
  | "productPerspective"
  | "productFunctions"
  | "userCharacteristics"
  | "generalConstraints"
  // Section 3: External Interface
  | "uiRequirements"
  | "hardwareInterface"
  | "softwareInterface"
  | "commInterface";

// Map section → label yang ditampilkan ke AI
const SECTION_LABEL: Record<SrsSection, string> = {
  purpose: "Tujuan Dokumen (Purpose)",
  scope: "Lingkup Produk (Scope)",
  glossary:
    "Definisi & Akronim (Glossary) dalam format JSON array [{term, definition}]",
  productPerspective:
    "Perspektif Produk — apakah standalone atau bagian sistem lebih besar",
  productFunctions: "Ringkasan Fungsi Produk (fitur-fitur utama)",
  userCharacteristics:
    "Karakteristik Pengguna dalam format JSON array [{role, description}]",
  generalConstraints: "Batasan Umum (deadline, platform, regulasi, dll)",
  uiRequirements: "Kebutuhan User Interface — gambaran kasar tampilan/layout",
  hardwareInterface:
    "Hardware Interface — alat/perangkat keras yang dibutuhkan sistem",
  softwareInterface:
    "Software Interface — hubungan dengan OS, database, atau software lain",
  commInterface:
    "Communication Interface — protokol komunikasi (HTTPS, WebSocket, dll)",
};

// Section yang outputnya JSON (bukan plain text)
const JSON_SECTIONS: SrsSection[] = ["glossary", "userCharacteristics"];

// Fallback models to try in order if the primary model fails
const FALLBACK_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
  "inclusionai/ling-2.6-1t:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
];

// ─── Kumpulkan context dari DB untuk satu tim ─────────────────────────────

async function gatherTeamContext(teamId: string, teamName: string) {
  const [backlogRes, planningRes, executionRes, frRes, nfrRes] =
    await Promise.all([
      // Backlog: judul + deskripsi issue yang sudah triage
      supabase
        .from("issues")
        .select("number, title, description, priority, labels")
        .eq("team_id", teamId)
        .eq("is_triaged", true)
        .not("status", "in", '("cancelled")')
        .order("number")
        .limit(30),

      // Planning: issue dengan jadwal
      supabase
        .from("issues")
        .select(
          "number, title, planning:issue_planning(start_date, due_date, plan_info)",
        )
        .eq("team_id", teamId)
        .in("status", ["backlog", "todo"])
        .limit(20),

      // Execution: yang sedang/sudah dikerjakan
      supabase
        .from("issues")
        .select("number, title, status")
        .eq("team_id", teamId)
        .in("status", ["in_progress", "in_review", "done"])
        .limit(20),

      // FR yang sudah ada
      supabase
        .from("requirements")
        .select("code, description, priority")
        .eq("team_id", teamId)
        .eq("type", "FR")
        .limit(20),

      // NFR yang sudah ada
      supabase
        .from("requirements")
        .select("code, description, priority, nfr_category")
        .eq("team_id", teamId)
        .eq("type", "NFR")
        .limit(20),
    ]);

  const backlog = (backlogRes.data ?? []) as any[];
  const planning = (planningRes.data ?? []) as any[];
  const execution = (executionRes.data ?? []) as any[];
  const fr = (frRes.data ?? []) as any[];
  const nfr = (nfrRes.data ?? []) as any[];

  // Format ringkas untuk prompt
  const backlogSummary = backlog
    .map((i) =>
      `- #${i.number} [${i.priority}] ${i.title}: ${i.description ?? ""}`.slice(
        0,
        120,
      ),
    )
    .join("\n");

  const planningSummary = planning
    .map((i) => {
      const p = (i as any).planning;
      return `- #${i.number} ${i.title} (${p?.start_date ?? "?"} → ${p?.due_date ?? "?"})`;
    })
    .join("\n");

  const executionSummary = execution
    .map((i) => `- #${i.number} ${i.title} [${i.status}]`)
    .join("\n");

  const frSummary = fr
    .map((r) => `- ${r.code} [${r.priority}]: ${r.description}`)
    .join("\n");
  const nfrSummary = nfr
    .map(
      (r) =>
        `- ${r.code} [${r.priority}][${r.nfr_category ?? ""}]: ${r.description}`,
    )
    .join("\n");

  return {
    teamName,
    backlogCount: backlog.length,
    planningCount: planning.length,
    executionCount: execution.length,
    backlogSummary: backlogSummary || "Belum ada data",
    planningSummary: planningSummary || "Belum ada data",
    executionSummary: executionSummary || "Belum ada data",
    frSummary: frSummary || "Belum ada FR",
    nfrSummary: nfrSummary || "Belum ada NFR",
  };
}

// ─── Build prompt per section ─────────────────────────────────────────────────

function buildPrompt(
  section: SrsSection,
  ctx: Awaited<ReturnType<typeof gatherTeamContext>>,
): string {
  const isJson = JSON_SECTIONS.includes(section);

  const contextBlock = `
**Nama Tim/Proyek:** ${ctx.teamName}
**Total Backlog:** ${ctx.backlogCount} item
**Total Planning:** ${ctx.planningCount} item
**Total Execution:** ${ctx.executionCount} item

**Backlog (sample):**
${ctx.backlogSummary}

**Planning:**
${ctx.planningSummary}

**Execution:**
${ctx.executionSummary}

**Functional Requirements yang sudah ada:**
${ctx.frSummary}

**Non-Functional Requirements yang sudah ada:**
${ctx.nfrSummary}
`.trim();

  const outputInstruction = isJson
    ? `Respond ONLY dengan JSON valid (array), tanpa preamble, tanpa markdown backticks.`
    : `Respond ONLY dengan teks paragraf bahasa Indonesia yang profesional, 2-4 paragraf. Tanpa heading, tanpa bullet, tanpa markdown.`;

  return `Kamu adalah analis sistem senior yang menulis dokumen SRS (Software Requirements Specification) yang profesional.

Berdasarkan data proyek berikut, generate konten untuk bagian **${SECTION_LABEL[section]}** dari SRS.

${contextBlock}

**Yang harus kamu generate:** ${SECTION_LABEL[section]}

${outputInstruction}`;
}

// ─── Call OpenRouter API with fallback logic ─────────────────────────────────

async function callOpenRouter(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<string> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:3000",
        "X-Title": "Amertask - SRS Generator",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah analis sistem senior yang ahli dalam penulisan Software Requirements Specification (SRS). Selalu jawab dengan format yang diminta, tanpa tambahan markdown atau preamble.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";

  return text.trim();
}

// ─── Main: Generate satu section ─────────────────────────────────────────────

export async function generateSrsSection(params: {
  teamId: string;
  teamName: string;
  section: SrsSection;
}): Promise<{ section: SrsSection; content: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const primaryModel =
    process.env.OPENROUTER_MODEL || "google/gemma-4-26b-a4b-it:free";

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY tidak ditemukan di environment variables",
    );
  }

  // Build the list of models to try: primary first, then fallbacks
  const modelsToTry = [
    primaryModel,
    ...FALLBACK_MODELS.filter((m) => m !== primaryModel),
  ];

  const ctx = await gatherTeamContext(params.teamId, params.teamName);
  const prompt = buildPrompt(params.section, ctx);

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[SRS AI Generate] Trying model: ${model}`);
      const rawText = await callOpenRouter(apiKey, model, prompt);

      // Bersihkan markdown fence jika ada
      const clean = rawText
        .replace(/^```(?:json)?\n?/i, "")
        .replace(/\n?```$/i, "")
        .trim();

      console.log(`[SRS AI Generate] Success with model: ${model}`);
      return {
        section: params.section,
        content: clean,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[SRS AI Generate] Model ${model} failed: ${lastError.message}`,
      );

      // If it's a rate limit error, wait a bit before trying next model
      if (lastError.message.includes("429")) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // If it's an auth error, don't try other models
      if (
        lastError.message.includes("401") ||
        lastError.message.includes("403")
      ) {
        throw new Error(`OpenRouter API key tidak valid: ${lastError.message}`);
      }
    }
  }

  // All models failed — throw the last error
  throw new Error(
    `Semua model AI gagal. Error terakhir: ${lastError?.message ?? "Unknown error"}. ` +
      `Pastikan OPENROUTER_API_KEY valid dan ada model yang tersedia.`,
  );
}
