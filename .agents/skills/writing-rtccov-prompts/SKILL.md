---
name: writing-rtccov-prompts
description: Use when the user asks to write, improve, or refactor an LLM or agent prompt. Use when prompts mix stable instructions with per-request data, lack clear output contracts, or models drift from the intended format.
---

# Writing R-T-C-C-O-V Prompts

## Overview

**R-T-C-C-O-V** is a six-section system prompt skeleton: **Role, Task, Context, Constraints, Output, Validation**. Every section has one job. Labels are load-bearing — models parse them reliably; prose soup is not.

**Core principle:** Stable instructions live in **system**; variable data lives in **user**. Never mix per-request values into system text if you want prompt caching or consistent behavior.

## When to Use

- User asks to write, draft, improve, or refactor a prompt (system prompt, agent prompt, tool prompt)
- Scoring rubrics, audit agents, extraction pipelines
- System prompt reused across many calls with different payloads
- Small or local models that need explicit section headers

Output shape follows the task — prose, email, markdown, JSON, tool calls. RTCCOV does not require structured output.

**When NOT to use:**

- One-shot creative chat with no fixed output shape → lighter RTF (Role, Task, Format) is enough
- Pure data transformation enforceable by code alone → automate validation, keep prompt minimal
- Reasoning-native models (o3, DeepSeek-R1, Qwen3 thinking) with short goals → skip heavy scaffolding; state goal + output only

## System vs User Split

```
SYSTEM (identical every call)
  ROLE / TASK / CONTEXT / CONSTRAINTS / OUTPUT / VALIDATION
  + output contract (schema, length, structure — whatever the task needs)

USER (changes every call)
  metadata (ids, scores, windows) in compact encoding
  + payload in fenced blocks (html, json, brief, image)
```

| Belongs in SYSTEM | Belongs in USER |
|-------------------|-----------------|
| Rubric bands, forbidden topics, caps | URLs, IDs, HTML, screenshots |
| Business meaning of scores | Numeric scores, date ranges, windows |
| JSON Schema (when task needs structured output) | Instance data the model analyzes |
| Stable audience/philosophy | Briefs, candidate lists, operator notes |

**Caching rule:** If a value changes per request, it MUST NOT appear in system text — even one dynamic line busts the cache prefix.

## The Six Sections (Recipe)

Write each section with the exact header label and a colon. One blank line between sections.

### ROLE

One sentence. Specific expert identity — not "helpful assistant."

Calibrates vocabulary and depth. Does not repeat the task.

### TASK

One precise action + one deliverable. Convert vague verbs:

| Weak | Strong |
|------|--------|
| help with the site | Rate design risk 0–10 from the screenshot; return one JSON object matching the schema |
| analyze this | Synthesize audit evidence into FinalReview JSON |

One task per prompt. Two jobs → two prompts.

### CONTEXT

Stable **meaning**, not instance data.

- What higher/lower scores mean for the business
- Who reads the output and why
- What counts as valid evidence (visual vs HTML vs audit bundle)
- OR/AND logic between signals

Never put URLs, HTML, numeric scores, or "use slot from user" here — reference user payload in TASK or CONSTRAINTS instead.

### CONSTRAINTS

Hard boundaries. Use **MUST** and **NEVER** — not should/avoid.

Include when applicable:

- Rubric bands with integer ranges
- Allowed enum values per field
- Forbidden topics (stops hallucination lanes)
- List caps (`max 5`)
- Length limits (`body ≤120 words`)
- Negative space (what the model must not invent)

Separate overlapping fields: if `outreach_signals` and `red_flags` both exist, state what each is for and that they must not duplicate.

### OUTPUT

The output **contract** — shape, wrapper, order.

Lock all of:

1. **Artifact type** — single JSON object, subject+body, markdown block
2. **Wrapper rules** — "raw JSON only — no markdown fences or commentary"
3. **Schema** — embed JSON Schema in OUTPUT only when the task returns structured data
4. **Length/structure** — word counts, field order, section sequence
5. **Side effects** — if the model must call a tool or present in chat before saving, state the sequence here

OUTPUT says what to emit. VALIDATION says how to verify it before stopping.

### VALIDATION

Checklist the model runs **before** finishing. Binary items only. Match checks to the task — schema validation for JSON; length/tone checks for prose.

```
VALIDATION:
Before finishing, confirm:
- [task-specific binary check]
- [task-specific binary check]
- output matches the OUTPUT contract above
```

This is not optional polish — it cuts schema-invalid and rubric-violating outputs.

## Quick Reference

| Section | One-line job | Common failure |
|---------|--------------|----------------|
| ROLE | Who am I? | Generic assistant, no domain |
| TASK | What one thing do I return? | Two tasks, vague verb |
| CONTEXT | What do scores/facts **mean**? | Per-request data smuggled in |
| CONSTRAINTS | What is forbidden / capped? | Soft words, fuzzy rubric |
| OUTPUT | Exact shape for this task | Vague "write a summary" with no length or structure |
| VALIDATION | Pre-return self-check | Missing entirely |

## Skeleton

```
ROLE:
[One sentence — specific expert + domain]

TASK:
[One action]. Return [exact artifact name and type].

CONTEXT:
[Stable business meaning, audience, evidence rules — no instance IDs]

CONSTRAINTS:
Scoring rubric (integer [field] [min]-[max]):
- [band]: [meaning]
- [band]: [meaning]
Do NOT [forbidden topic list].
[field]: max [N] items.
[Other MUST/NEVER rules]

OUTPUT:
Return [format rules for this task — prose length, raw JSON, section order, etc.].
[JSON Schema, field list, or structure spec — only if task needs it]

VALIDATION:
Before finishing, confirm:
- [binary check matched to task]
- [binary check matched to task]
- output matches the OUTPUT contract above
```

User message = data only:

````
```toon
key: value
```
```html
[payload]
```
````

## Signal Words and Placement

- **MUST / NEVER** over should / avoid / try to
- Hardest constraints in the **first 30%** of the prompt (attention decay)
- Critical rubric bands live in CONSTRAINTS, not scattered in prose
- Keep section headers and wording **stable across deploys** unless intentionally busting cache

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| All rules in one paragraph | Split into six labeled sections |
| Schema only, no VALIDATION | Add binary checklist mirroring schema + rubric |
| `slot`, `url`, scores in CONTEXT | Move to user TOON/fenced payload |
| "Return JSON" | Embed schema + "raw JSON only, no fences" |
| Checkpoint enums implied | List allowed values explicitly in CONSTRAINTS |
| Soft bans ("try not to discuss SEO") | `Do NOT discuss SEO, performance, or Lighthouse.` |
| VALIDATION repeats OUTPUT verbatim | VALIDATION = pass/fail checks, not restated spec |
| Dynamic score windows baked into system | Pass window in user metadata; system says "stay within score_window from user data" |

## Rationalizations (Do Not Skip Structure)

| Excuse | Reality |
|--------|---------|
| "Headers waste tokens" | Unlabeled prompts cause re-prompts — more tokens than six labels |
| "Model is smart enough" | Smart models still drift format without OUTPUT + VALIDATION |
| "Schema at bottom is enough" | Schema defines shape; VALIDATION catches rubric and forbidden-topic violations |
| "Validation is redundant with Zod" | Downstream parse fails late; VALIDATION reduces bad generations |
| "One blob is simpler to maintain" | Six sections are grep-able and diff-friendly |
| "Per-request note in system is harmless" | Breaks prompt cache and teaches model to expect dynamic system text |
| "Ship now, refactor when bench fails" | Bench failures cost more than writing VALIDATION once |

## Authoring Checklist

Before shipping a new R-T-C-C-O-V prompt:

- [ ] Six headers present with exact labels (`ROLE:` … `VALIDATION:`)
- [ ] TASK is one action, one deliverable
- [ ] CONTEXT has zero per-request values
- [ ] CONSTRAINTS use MUST/NEVER; rubric bands are integers with clear ranges
- [ ] OUTPUT states the contract for this task (prose limits, JSON schema, section order, tool sequence)
- [ ] VALIDATION has 3–6 binary checks that match the OUTPUT contract
- [ ] User prompt is data-only (metadata + fenced payload)
- [ ] Every sentence is load-bearing — cut adjectives that do not change behavior

**Success metric:** Paste once into the target model; correct output on first try without re-prompting.
