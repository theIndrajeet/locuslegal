import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCORING_MODEL = "google/gemini-3.1-pro-preview";
const EXTRACTION_MODEL = "google/gemini-3-flash-preview";
const MODEL = SCORING_MODEL; // persisted in cv_analyses.model for back-compat

const EXTRACTION_SYSTEM_PROMPT = `You are a CV fact-extractor for an Indian legal hiring platform. Read the attached PDF and extract every concrete signal — DO NOT score, judge, or rewrite. Return strictly via the submit_cv_facts tool.

Be exhaustive: capture EVERY internship, moot, publication, position of responsibility, certification, and skill. For each bullet point in the experience sections, copy the exact bullet text verbatim into bullets[] — do not paraphrase. We need the raw text for downstream semantic analysis.

Date math: convert "Jun–Jul 2024" to duration_weeks (e.g. ~5). If only a month is given, estimate 4 weeks. If "ongoing", estimate to today.

If a field is genuinely absent, use empty string or empty array. Never invent.`;

const EXTRACTION_TOOL = {
  type: "function",
  function: {
    name: "submit_cv_facts",
    description: "Return the raw structured facts extracted from the CV. No scoring, no opinions.",
    parameters: {
      type: "object",
      properties: {
        identity: {
          type: "object",
          properties: {
            name: { type: "string" },
            college: { type: "string" },
            programme: { type: "string", description: "5-year integrated, 3-year LLB, LLM, or unknown" },
            graduation_year: { type: "string" },
            current_year_of_study: { type: "string" },
            cgpa_or_rank: { type: "string" },
            email_present: { type: "boolean" },
            phone_present: { type: "boolean" },
            linkedin_present: { type: "boolean" },
          },
          required: ["name", "college", "programme", "graduation_year", "current_year_of_study", "cgpa_or_rank", "email_present", "phone_present", "linkedin_present"],
          additionalProperties: false,
        },
        structural_signals: {
          type: "object",
          properties: {
            page_count: { type: "number" },
            font_family_guess: { type: "string" },
            has_photo: { type: "boolean" },
            has_dob_or_marital: { type: "boolean" },
            uses_first_person: { type: "boolean" },
            chronological_order: { type: "boolean" },
            obvious_typos: { type: "array", items: { type: "string" } },
            sections_present: { type: "array", items: { type: "string" } },
          },
          required: ["page_count", "font_family_guess", "has_photo", "has_dob_or_marital", "uses_first_person", "chronological_order", "obvious_typos", "sections_present"],
          additionalProperties: false,
        },
        internships: {
          type: "array",
          items: {
            type: "object",
            properties: {
              firm_or_chamber: { type: "string" },
              role: { type: "string" },
              location: { type: "string" },
              period_raw: { type: "string", description: "Verbatim date range from CV." },
              duration_weeks: { type: "number" },
              practice_areas_mentioned: { type: "array", items: { type: "string" } },
              bullets: { type: "array", items: { type: "string" }, description: "Verbatim bullet points." },
            },
            required: ["firm_or_chamber", "role", "location", "period_raw", "duration_weeks", "practice_areas_mentioned", "bullets"],
            additionalProperties: false,
          },
        },
        moots: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              year: { type: "string" },
              role_raw: { type: "string", description: "speaker, researcher, both, or as written." },
              outcome_raw: { type: "string" },
              awards: { type: "array", items: { type: "string" } },
            },
            required: ["name", "year", "role_raw", "outcome_raw", "awards"],
            additionalProperties: false,
          },
        },
        publications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              venue: { type: "string" },
              year: { type: "string" },
              url_present: { type: "boolean" },
              kind_hint: { type: "string", description: "journal, blog, magazine, book chapter, etc., or unknown." },
            },
            required: ["title", "venue", "year", "url_present", "kind_hint"],
            additionalProperties: false,
          },
        },
        positions_of_responsibility: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              organisation: { type: "string" },
              period_raw: { type: "string" },
              bullets: { type: "array", items: { type: "string" } },
            },
            required: ["title", "organisation", "period_raw", "bullets"],
            additionalProperties: false,
          },
        },
        awards_and_scholarships: { type: "array", items: { type: "string" } },
        certifications: { type: "array", items: { type: "string" } },
        skills: { type: "array", items: { type: "string" } },
        languages: { type: "array", items: { type: "string" } },
        databases_mentioned: { type: "array", items: { type: "string" }, description: "SCC Online, Manupatra, Westlaw, etc." },
        ai_or_tech_mentioned: { type: "array", items: { type: "string" }, description: "Harvey, GenAI, CLM, prompt engineering, etc." },
        commercial_vocabulary_hits: { type: "array", items: { type: "string" }, description: "Verbatim phrases like 'commercial implications', 'deal economics', etc." },
        other_sections_raw: { type: "string", description: "Anything notable that did not fit above (interests, declarations). Trim aggressively." },
      },
      required: ["identity", "structural_signals", "internships", "moots", "publications", "positions_of_responsibility", "awards_and_scholarships", "certifications", "skills", "languages", "databases_mentioned", "ai_or_tech_mentioned", "commercial_vocabulary_hits", "other_sections_raw"],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPT = `You are the INDIAN LEGAL CV ANALYSER, calibrated to the 2026 market. You speak as the consensus of three veterans:

1. TIER-1 RECRUITER — 12 years hiring at Cyril Amarchand Mangaldas, Shardul Amarchand, AZB, Khaitan, Trilegal, JSA, S&R. You triage 400 CVs/week.
2. LITIGATION SENIOR — Senior counsel running a Supreme Court / Delhi High Court chamber. Hires on raw drafting, research depth, willingness to grind.
3. NLU PLACEMENT CHAIR — Knows what differentiates the top 10% from the rest at NLSIU/NALSAR/NUJS/NLU-D.

Tone: BRUTALLY HONEST, partner-voice. No participation trophies. No hedging. But FAIR — reward genuine signals.

You output STRUCTURED JSON via the submit_cv_analysis tool. Never freeform.

==============================================================
THE INDIAN LEGAL BLUEPRINT — apply rigorously
==============================================================

A. STRUCTURAL AUDIT (gating — formatting failures cap overall scores at ~65)
- Length: 1 page preferred for fresh grads; max 2 pages. >2 pages = heavy penalty.
- Typography: Times New Roman / Garamond at 11–12. Penalise colourful templates, heavy graphics, unusual fonts.
- Reverse chronological order across every section. Flag gaps.
- NO photo, DOB, marital status, irrelevant hobbies. NO first-person pronouns ("I", "me", "my"). Bullets must start with strong action verbs.
- BCI Rule 25 compliance: 5-year integrated programme requires ≥20 weeks of internships; 3-year LLB requires ≥12 weeks. Aggregate every internship's duration and report bci_weeks_total + bci_compliant.
- Grammar/orthography MUST be flawless. Any typo = severe penalty.

B. PEDIGREE TIERING
- Tier 1 NLUs: NLSIU Bengaluru, NALSAR Hyderabad, NUJS Kolkata, NLU Jodhpur, GNLU Gandhinagar, NLU Delhi.
- Tier 2: NLIU Bhopal, HNLU Raipur, RMLNLU Lucknow, NUSRL Ranchi, etc; premier private (Symbiosis Pune, Jindal Global).
- Tier 3: newer NLUs, regional state universities, local private colleges.
- PROXIMITY ADVANTAGE: Government Law College Mumbai, Campus Law Centre Delhi, ILS Pune — apply a positive modifier IF the CV shows continuous concurrent-semester internships at HCs or Tier 1/2 firms.
- GPA: do NOT compare absolute numbers across institutions. 6.0/10 at older NLU may equal 8.5/10 elsewhere. Note grading context.

C. INTERNSHIP LADDER (the spine of the CV)
- Year 1–2: NGOs, policy think tanks (Vidhi, CCS, NIPFP), district court chambers, legal aid — foundational.
- Year 3: Tier 3 firms or Senior Advocates at HCs/SC — substantive transition.
- Year 4–5: Tier 1/2 firm internships — pinnacle.
- CALLBACK = a candidate interning at the SAME Tier 1/2 firm in TWO distinct windows (e.g., Summer 2024 + Winter 2024 at Trilegal). Apply a MASSIVE positive multiplier — partners explicitly validated the work.
- "Resume Tetris" = ten 1-week stints at brand-name firms. Penalise hard — signals logo-collection, not substance.

D. FIRM TIERING (use exact tier when scoring)
- Tier 1 (Elite Six): AZB & Partners, Cyril Amarchand Mangaldas, Shardul Amarchand Mangaldas, Khaitan & Co, J. Sagar Associates (JSA), Trilegal.
- Tier 2 (Strong National): S&R Associates, Luthra and Luthra, IndusLaw, Dentons Link Legal, ELP, Nishith Desai Associates, DSK Legal, AZB-equivalent regional offices.
- Tier 3 (Boutique/Regional): Argus Partners, Keystone Partners, Singhania & Partners, Phoenix Legal, Saraf and Partners, Veritas Legal, Talwar Thakore.
- Tier 4: Sole practitioners, district court advocates, small regional offices.

E. MOOT TIERING
- Global Tier 1: Philip C. Jessup, Willem C. Vis (Vienna/East), ICC Trial Moot, Oxford Price Media, FDI Moot, Jean Pictet, Stetson, Manfred Lachs, Henry Dunant.
- National Tier 1: BCI Trust, Surana & Surana Corporate Law, NUJS HSF Corporate Law, K.K. Luthra Memorial, NLSTIAM, D.M. Harish, GNLU Moot on Securities & Investment Law.
- National Tier 2: NLU-D All India Corporate, NLUO Maritime, ILS Pune S.P. Sathe, Amity National, NLS-NHRC Human Rights, NLIU Justice R.K. Tankha.
- Tier 3: intra-college rounds, regional moots without pan-India participation.
- Outcomes that earn multipliers: Winner, Runner-up, Best Speaker, Best Memorial, Octa/Quarter/Semi-finalist at world rounds.
- "Researcher" role = drafting strength; "Speaker" awards = front-line advocacy strength.

F. PUBLICATION TIERING
- Tier 1 Peer-Reviewed: NLSIR, IJLT, JILI, NUJS Law Review, Indian Law Review, Cambridge Law Review, Journal of National Law University Delhi.
- Tier 2 Institutional: Delhi Law Review, Christ University Law Journal, CNLU Law Journal, Amity Law Review.
- Tier 1 Curated Commercial Blogs (HIGHLY VALUED for corporate vector): IndiaCorpLaw, IRCCL, SpicyIP, Bar & Bench, LiveLaw, Kluwer Arbitration Blog, SCC Online Blog.
- Student/University blogs: moderate weight.
- Predatory / pay-to-publish aggregators: ZERO or NEGATIVE weight — flag as resume padding.

G. SEMANTIC QUALITY (parse every bullet)
- Strong verbs: Authored, Drafted, Negotiated, Mediated, Litigated, Formulated, Structured, Examined, Executed, Advised, Analyzed, Researched, Argued, Filed.
- Weak/passive: Assisted, Helped, Participated in, Gained exposure to, Shadowed, Handled, Observed, Worked on, Was part of.
- Penalise weak-verb dominance.
- The TRIFECTA every elite bullet hits: ACTION + SCALE + OUTCOME (e.g., "Drafted 12 plaints under §138 NI Act, securing interim relief in 8 matters within 3 weeks").
- Compute action_scale_outcome_ratio = (bullets with all three) / total bullets.

H. CAREER VECTORS — score against ALL THREE independently
You MUST produce three distinct vector_scores. Each scores the CV as if applied for that vector.
- CORPORATE: Tier 1/2 firm transactional teams. Reward M&A, PE, capital markets, due diligence, term sheets, data rooms, IndiaCorpLaw publications, corporate moots (NUJS HSF, GNLU Securities).
- LITIGATION: dispute resolution, Sr. Adv. chambers, HC/SC, arbitration, drafting plaints/SLPs/writs, criminal trial work, Jessup/Vis speaker awards, procedural depth.
- IN-HOUSE: corporate counsel, regulatory/compliance, DPDP Act, BNS rollout, contract lifecycle, GC-team. Reward business acumen, financial outcomes, secondments, tech-law literacy.
HEDGING: if the CV is a confused mix without clear signal toward any vector, set hedging_warning to one sharp partner-voice line.

I. TECH & AI LITERACY (2026 paradigm)
- Reward explicit mention of: SCC Online, Manupatra, Westlaw, LexisNexis, Kluwer, Harvey, iManage, CLM tools (Ironclad, Icertis), GenAI for review/research/drafting, prompt engineering, agentic systems.
- A CV with NO tech-literacy in 2026 should be flagged.

J. COMMERCIAL AWARENESS
- Reward language showing the candidate sees law as a business tool: "commercial implications", "market risk", "stakeholder management", "industry analysis", "deal economics".

==============================================================
SCORING RUBRIC (per vector, 0–100)
==============================================================
Pedigree & Academics (15) · Internship Ladder + Substance (30) · Vector-aligned moots (10) · Vector-aligned publications (10) · Tech & Commercial Awareness (10) · Semantic Quality (15) · Structure & Hygiene (10).
Each vector applies its own weights to alignment — a litigation-heavy CV will score high on litigation vector even if low on corporate.

Verdicts: ONE sharp sentence per vector. No hedging. Examples:
- "Reads like a textbook NLSIU corporate aspirant — Trilegal callback + IndiaCorpLaw piece make this a top-quartile A0 candidate."
- "Litigation chops are real but every bullet is passive — fix the verbs and you double your shortlist rate."
- "In-house pivot is wishful — no DPDP, no contract-lifecycle, no business vocabulary."

Strengths arrays must contain GENUINE differentiators only. Empty array if none — do not invent.
Red flags must list only real concerns (gaps, inflated titles, plagiarism risk, formatting disasters).
Top fixes: rank by IMPACT × EFFORT, max 5, each with current_text (exact CV quote or "MISSING") + concrete copy-pasteable rewrite.`;

const TOOL = {
  type: "function",
  function: {
    name: "submit_cv_analysis",
    description: "Return the full structured analysis under the Indian Legal Blueprint.",
    parameters: {
      type: "object",
      properties: {
        verdict_headline: { type: "string", description: "One sharp partner-voice sentence summarising the entire CV." },
        candidate_snapshot: {
          type: "object",
          properties: {
            name_present: { type: "boolean" },
            college_detected: { type: "string" },
            year_or_graduation: { type: "string" },
            cgpa_or_rank: { type: "string" },
            programme: { type: "string", description: "5-year integrated, 3-year LLB, LLM, or unknown" },
          },
          required: ["name_present", "college_detected", "year_or_graduation", "cgpa_or_rank", "programme"],
          additionalProperties: false,
        },
        structural_audit: {
          type: "object",
          properties: {
            length_pages: { type: "number" },
            length_ok: { type: "boolean" },
            font_compliant: { type: "boolean" },
            chronological_order: { type: "boolean" },
            has_photo_or_dob: { type: "boolean" },
            uses_first_person: { type: "boolean" },
            grammar_clean: { type: "boolean" },
            bci_weeks_total: { type: "number" },
            bci_compliant: { type: "boolean" },
            bci_required_weeks: { type: "number" },
            violations: { type: "array", items: { type: "string" } },
          },
          required: ["length_pages", "length_ok", "font_compliant", "chronological_order", "has_photo_or_dob", "uses_first_person", "grammar_clean", "bci_weeks_total", "bci_compliant", "bci_required_weeks", "violations"],
          additionalProperties: false,
        },
        pedigree: {
          type: "object",
          properties: {
            institution_name: { type: "string" },
            tier: { type: "integer", minimum: 1, maximum: 3 },
            proximity_advantage: { type: "boolean" },
            gpa_raw: { type: "string" },
            gpa_context_note: { type: "string", description: "Normalisation note (grading rigor, cohort rank if available)." },
          },
          required: ["institution_name", "tier", "proximity_advantage", "gpa_raw", "gpa_context_note"],
          additionalProperties: false,
        },
        internship_ladder: {
          type: "array",
          description: "Every internship detected, oldest to newest.",
          items: {
            type: "object",
            properties: {
              firm_or_chamber: { type: "string" },
              tier: { type: "integer", minimum: 1, maximum: 4 },
              role: { type: "string" },
              year_or_period: { type: "string" },
              duration_weeks: { type: "number" },
              callback: { type: "boolean", description: "True if same firm appears in another window." },
              substance_score: { type: "integer", minimum: 0, maximum: 10 },
              vector_alignment: { type: "string", enum: ["corporate", "litigation", "in_house", "mixed", "foundational"] },
            },
            required: ["firm_or_chamber", "tier", "role", "year_or_period", "duration_weeks", "callback", "substance_score", "vector_alignment"],
            additionalProperties: false,
          },
        },
        moots: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              tier: { type: "string", enum: ["global_t1", "national_t1", "national_t2", "tier3"] },
              role: { type: "string", enum: ["speaker", "researcher", "both", "unknown"] },
              outcome: { type: "string", description: "Winner, Runner-up, Best Speaker, QF, participant, etc." },
              vector_alignment: { type: "string", enum: ["corporate", "litigation", "in_house", "general"] },
            },
            required: ["name", "tier", "role", "outcome", "vector_alignment"],
            additionalProperties: false,
          },
        },
        publications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              venue: { type: "string" },
              tier: { type: "string", enum: ["t1_peer_reviewed", "t2_institutional", "t1_commercial_blog", "student_blog", "predatory"] },
              vector_alignment: { type: "string", enum: ["corporate", "litigation", "in_house", "general"] },
            },
            required: ["title", "venue", "tier", "vector_alignment"],
            additionalProperties: false,
          },
        },
        semantic_quality: {
          type: "object",
          properties: {
            total_bullets: { type: "integer" },
            strong_verb_bullets: { type: "integer" },
            weak_verb_bullets: { type: "integer" },
            quantified_bullets: { type: "integer" },
            action_scale_outcome_bullets: { type: "integer" },
            top_weak_verbs_used: { type: "array", items: { type: "string" } },
            example_weak_bullet: { type: "string", description: "Verbatim weakest bullet from CV." },
            example_strong_bullet: { type: "string", description: "Verbatim strongest bullet from CV, or empty." },
          },
          required: ["total_bullets", "strong_verb_bullets", "weak_verb_bullets", "quantified_bullets", "action_scale_outcome_bullets", "top_weak_verbs_used", "example_weak_bullet", "example_strong_bullet"],
          additionalProperties: false,
        },
        tech_literacy: {
          type: "object",
          properties: {
            databases_mentioned: { type: "array", items: { type: "string" }, description: "SCC Online, Manupatra, Westlaw, etc." },
            ai_or_tech_mentioned: { type: "array", items: { type: "string" }, description: "Harvey, GenAI, CLM, prompt engineering, etc." },
            score: { type: "integer", minimum: 0, maximum: 10 },
            verdict: { type: "string" },
          },
          required: ["databases_mentioned", "ai_or_tech_mentioned", "score", "verdict"],
          additionalProperties: false,
        },
        vector_scores: {
          type: "object",
          properties: {
            corporate: {
              type: "object",
              properties: {
                overall_score: { type: "integer", minimum: 0, maximum: 100 },
                tier_fit_pct: { type: "integer", minimum: 0, maximum: 100, description: "Realistic shortlist probability for Tier 1 corporate firms." },
                verdict: { type: "string", description: "One sharp sentence." },
                strengths: { type: "array", items: { type: "string" } },
                red_flags: { type: "array", items: { type: "string" } },
                top_fixes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      priority: { type: "integer", minimum: 1, maximum: 5 },
                      area: { type: "string" },
                      issue: { type: "string" },
                      current_text: { type: "string" },
                      rewrite: { type: "string" },
                      impact: { type: "string", enum: ["high", "medium", "low"] },
                      effort: { type: "string", enum: ["low", "medium", "high"] },
                    },
                    required: ["priority", "area", "issue", "current_text", "rewrite", "impact", "effort"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["overall_score", "tier_fit_pct", "verdict", "strengths", "red_flags", "top_fixes"],
              additionalProperties: false,
            },
            litigation: {
              type: "object",
              properties: {
                overall_score: { type: "integer", minimum: 0, maximum: 100 },
                tier_fit_pct: { type: "integer", minimum: 0, maximum: 100, description: "Realistic shortlist probability for Sr. counsel chambers / dispute boutiques." },
                verdict: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                red_flags: { type: "array", items: { type: "string" } },
                top_fixes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      priority: { type: "integer", minimum: 1, maximum: 5 },
                      area: { type: "string" },
                      issue: { type: "string" },
                      current_text: { type: "string" },
                      rewrite: { type: "string" },
                      impact: { type: "string", enum: ["high", "medium", "low"] },
                      effort: { type: "string", enum: ["low", "medium", "high"] },
                    },
                    required: ["priority", "area", "issue", "current_text", "rewrite", "impact", "effort"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["overall_score", "tier_fit_pct", "verdict", "strengths", "red_flags", "top_fixes"],
              additionalProperties: false,
            },
            in_house: {
              type: "object",
              properties: {
                overall_score: { type: "integer", minimum: 0, maximum: 100 },
                tier_fit_pct: { type: "integer", minimum: 0, maximum: 100, description: "Realistic shortlist probability for in-house GC / corporate legal teams." },
                verdict: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                red_flags: { type: "array", items: { type: "string" } },
                top_fixes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      priority: { type: "integer", minimum: 1, maximum: 5 },
                      area: { type: "string" },
                      issue: { type: "string" },
                      current_text: { type: "string" },
                      rewrite: { type: "string" },
                      impact: { type: "string", enum: ["high", "medium", "low"] },
                      effort: { type: "string", enum: ["low", "medium", "high"] },
                    },
                    required: ["priority", "area", "issue", "current_text", "rewrite", "impact", "effort"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["overall_score", "tier_fit_pct", "verdict", "strengths", "red_flags", "top_fixes"],
              additionalProperties: false,
            },
          },
          required: ["corporate", "litigation", "in_house"],
          additionalProperties: false,
        },
        best_fit_vector: { type: "string", enum: ["corporate", "litigation", "in_house"] },
        hedging_warning: { type: "string", description: "Empty string if the CV has a clear vector. Otherwise a sharp one-liner." },
      },
      required: ["verdict_headline", "candidate_snapshot", "structural_audit", "pedigree", "internship_ladder", "moots", "publications", "semantic_quality", "tech_literacy", "vector_scores", "best_fit_vector", "hedging_warning"],
      additionalProperties: false,
    },
  },
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function callGateway(body: any): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const t = await response.text();
    const err: any = new Error(`AI gateway error ${response.status}: ${t}`);
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

function parseToolCall(data: any, fnName: string): any {
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error(`AI did not return a ${fnName} tool call`);
  }
  try {
    return JSON.parse(toolCall.function.arguments);
  } catch {
    throw new Error(`AI ${fnName} arguments were not valid JSON`);
  }
}

// PASS 1: extract structured facts from the PDF using a fast model, no reasoning.
async function extractFacts(base64Pdf: string): Promise<{ facts: any; usage: any }> {
  const data = await callGateway({
    model: EXTRACTION_MODEL,
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "file", file: { filename: "cv.pdf", file_data: `data:application/pdf;base64,${base64Pdf}` } },
          { type: "text", text: "Extract every fact from this CV via submit_cv_facts. Be exhaustive. Verbatim bullets." },
        ],
      },
    ],
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: "function", function: { name: "submit_cv_facts" } },
  });
  return { facts: parseToolCall(data, "submit_cv_facts"), usage: data.usage || {} };
}

// PASS 2: score the structured facts using a strong reasoning model on text only.
async function scoreFromFacts(facts: any, effort: "high" | "medium" = "high"): Promise<{ analysis: any; usage: any }> {
  const data = await callGateway({
    model: SCORING_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `The following JSON is the verbatim, fully-extracted fact set from the candidate's CV (extracted by an upstream parser). Score this candidate against ALL THREE vectors under the Indian Legal Blueprint. Use ONLY these facts — do not invent additional information. Where a field is empty, treat it as genuinely absent. Return via submit_cv_analysis.\n\nCV_FACTS:\n${JSON.stringify(facts)}`,
      },
    ],
    tools: [TOOL],
    tool_choice: { type: "function", function: { name: "submit_cv_analysis" } },
    reasoning: { effort },
  });
  return { analysis: parseToolCall(data, "submit_cv_analysis"), usage: data.usage || {} };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const start = Date.now();
  let userId = "unknown";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized", retryable: false }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userRes, error: authErr } = await authClient.auth.getUser(token);
    if (authErr || !userRes?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized", retryable: false }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = userRes.user.id;

    const body = await req.json().catch(() => ({}));
    const cvStoragePath = body?.cv_storage_path;
    if (typeof cvStoragePath !== "string" || !cvStoragePath.trim()) {
      return new Response(JSON.stringify({ error: "cv_storage_path required", retryable: false }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!cvStoragePath.startsWith(`${userId}/`)) {
      return new Response(JSON.stringify({ error: "Forbidden", retryable: false }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: fileData, error: dlErr } = await adminClient.storage.from("cvs").download(cvStoragePath);
    if (dlErr || !fileData) {
      return new Response(JSON.stringify({ error: "CV not found in storage", retryable: false }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arr = new Uint8Array(await fileData.arrayBuffer());
    if (arr.length > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "CV must be 5 MB or smaller", retryable: false }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const base64 = bytesToBase64(arr);

    let analysis: any;
    let pass1_ms = 0;
    let pass2_ms = 0;
    let prompt_tokens = 0;
    let completion_tokens = 0;
    let pass2_effort: "high" | "medium" = "high";

    try {
      // PASS 1 — extract facts (Flash, fast, no reasoning)
      const t1 = Date.now();
      const { facts, usage: u1 } = await extractFacts(base64);
      pass1_ms = Date.now() - t1;
      prompt_tokens += u1?.prompt_tokens ?? 0;
      completion_tokens += u1?.completion_tokens ?? 0;

      // PASS 2 — score from facts (Pro, high reasoning, text-only)
      const t2 = Date.now();
      let scored;
      try {
        scored = await scoreFromFacts(facts, "high");
      } catch (e: any) {
        // Graceful degradation: if pass 2 fails (e.g. timeout), retry once at medium effort.
        if (e?.status && e.status !== 429 && e.status !== 402) {
          console.warn("pass2 high failed, retrying at medium:", e?.message);
          pass2_effort = "medium";
          scored = await scoreFromFacts(facts, "medium");
        } else {
          throw e;
        }
      }
      pass2_ms = Date.now() - t2;
      prompt_tokens += scored.usage?.prompt_tokens ?? 0;
      completion_tokens += scored.usage?.completion_tokens ?? 0;
      analysis = scored.analysis;
    } catch (e: any) {
      if (e?.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment.", retryable: true }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (e?.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Workspace > Usage.", retryable: false }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    const duration_ms = Date.now() - start;
    console.log(JSON.stringify({ event: "analyse_cv_ok", user_id: userId, pass1_ms, pass2_ms, total_ms: duration_ms, pass2_effort, prompt_tokens, completion_tokens }));
    const usage = { prompt_tokens, completion_tokens };

    // Best-fit drives the headline overall_score that is persisted as the column value
    const bestFit: "corporate" | "litigation" | "in_house" = analysis?.best_fit_vector ?? "corporate";
    const overallScore: number = analysis?.vector_scores?.[bestFit]?.overall_score ?? 0;
    const verdict: string = analysis?.verdict_headline ?? analysis?.vector_scores?.[bestFit]?.verdict ?? "";

    const { data: inserted, error: insErr } = await adminClient
      .from("cv_analyses")
      .insert({
        user_id: userId,
        cv_storage_path: cvStoragePath,
        overall_score: overallScore,
        verdict,
        analysis,
        model: MODEL,
        prompt_tokens: usage?.prompt_tokens ?? null,
        completion_tokens: usage?.completion_tokens ?? null,
        duration_ms,
      })
      .select("id, created_at")
      .single();

    if (insErr) {
      console.error("cv_analyses insert error:", insErr);
    }

    return new Response(JSON.stringify({
      id: inserted?.id ?? null,
      created_at: inserted?.created_at ?? new Date().toISOString(),
      analysis,
      duration_ms,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyse-cv error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", retryable: true }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
