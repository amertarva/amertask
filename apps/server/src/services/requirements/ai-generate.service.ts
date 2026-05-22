export interface AiGenerateResult {
  fr: Array<{
    description: string;
    priority: "MUST" | "SHOULD" | "COULD";
    acceptanceCriteria: string;
  }>;
  nfr: Array<{
    description: string;
    priority: "MUST" | "SHOULD" | "COULD";
    nfrCategory: string;
    acceptanceCriteria: string;
  }>;
}

// Fallback models to try in order if the primary model fails
const FALLBACK_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
  "inclusionai/ling-2.6-1t:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
];

export async function aiGenerateRequirements(params: {
  issueTitle: string;
  issueDescription: string;
  role?: string; // user role dari konteks issue
  teamName: string;
}): Promise<AiGenerateResult> {
  const prompt = `Kamu adalah analis sistem senior yang ahli dalam penulisan Software Requirements Specification (SRS).

**PENTING: Seluruh hasil WAJIB ditulis dalam Bahasa Indonesia.** Satu-satunya kata dalam Bahasa Inggris yang diperbolehkan adalah keyword RFC berikut: SHALL, SHOULD, MAY. Selain itu, semua deskripsi, kriteria penerimaan, dan kategori NFR harus menggunakan Bahasa Indonesia sepenuhnya.

Berdasarkan informasi backlog berikut, buatkan draft FR (Functional Requirements) dan NFR (Non-Functional Requirements) yang profesional.

**Tim:** ${params.teamName}
**Role pengguna:** ${params.role ?? "User"}
**Judul backlog:** ${params.issueTitle}
**Deskripsi:** ${params.issueDescription ?? "Tidak ada deskripsi"}

**Aturan penulisan:**
- Semua teks harus dalam Bahasa Indonesia, kecuali keyword SHALL, SHOULD, MAY
- FR harus menggunakan kata SHALL (wajib), SHOULD (diharapkan), atau MAY (opsional)
- NFR harus spesifik dan terukur (ada angka/metrik konkret jika memungkinkan)
- Maksimal 2 FR dan 2 NFR
- Prioritas: MUST = kritis, SHOULD = penting, COULD = nice-to-have
- - nfrCategory must be one of: "performance", "security", "availability", "usability", "reliability", "scalability"

Respond HANYA dengan JSON valid ini (tanpa preamble, tanpa markdown):
{
  "fr": [
    {
      "description": "Sistem SHALL menyediakan fitur login menggunakan email dan kata sandi",
      "priority": "MUST",
      "acceptanceCriteria": "Pengguna berhasil masuk ke sistem setelah memasukkan email dan kata sandi yang valid"
    }
  ],
  "nfr": [
    {
      "description": "Sistem SHALL memproses permintaan login dalam waktu kurang dari 2 detik",
      "priority": "MUST",
      "nfrCategory": "kinerja",
      "acceptanceCriteria": "Waktu respons rata-rata login tidak melebihi 2 detik pada 95% permintaan"
    }
  ]
}`;

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

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[AI Generate] Trying model: ${model}`);
      const result = await callOpenRouter(apiKey, model, prompt);
      console.log(`[AI Generate] Success with model: ${model}`);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[AI Generate] Model ${model} failed: ${lastError.message}`);

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

async function callOpenRouter(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<AiGenerateResult> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:3000",
        "X-Title": "Amertask - Requirements Generator",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah analis sistem senior yang ahli dalam penulisan Software Requirements Specification (SRS). Selalu jawab dengan JSON valid saja, tanpa format markdown. PENTING: Seluruh hasil WAJIB ditulis dalam Bahasa Indonesia. Hanya keyword RFC (SHALL, SHOULD, MAY) yang boleh dalam Bahasa Inggris.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "{}";

  // Clean up markdown code blocks if present
  const clean = text.replace(/```json\n?|```\n?/g, "").trim();

  try {
    const parsed = JSON.parse(clean) as AiGenerateResult;

    // Validate response structure
    if (!parsed.fr || !Array.isArray(parsed.fr)) {
      throw new Error("Invalid response: missing or invalid 'fr' array");
    }
    if (!parsed.nfr || !Array.isArray(parsed.nfr)) {
      throw new Error("Invalid response: missing or invalid 'nfr' array");
    }

    return parsed;
  } catch (parseError) {
    console.error("Failed to parse AI response:", clean);
    throw new Error(
      `AI response tidak valid JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
    );
  }
}
