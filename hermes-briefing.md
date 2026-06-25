# Hermes / Nous / NemoClaw — briefing (researched Wed Jun 24)

**The correction that matters:** "Hermes" in this hackathon = the **Hermes Agent harness**, NOT an LLM.
(There IS also a separate Hermes 4 *model* — see below — but the hackathon is named after, and judged on, the harness.)

## Hermes Agent = the harness (model-agnostic)
- Autonomous agent framework by Nous Research — "an agent that gets more capable the longer it runs." Provides skills,
  sessions, memory, bridges, hooks, a Tool Gateway. OpenClaw-family (peers: ZeroClaw, NemoClaw).
- **Model-agnostic.** Points at any OpenAI-compatible endpoint — Nous Portal, OpenRouter (200+), NVIDIA NIM,
  build.nvidia.com, OpenAI, **xAI/Grok**, Ollama. Swap one line / `/model` / `hermes model`; configurable **per skill**.
- **No GPU required.** Runs on a $5 VPS, Docker, serverless (Modal/Daytona), or a GPU box. 6 terminal backends.
- Install: curl one-liner → `hermes setup --portal` (bundles a model + Tool Gateway). One source: ~2–4 hr to set up well.
- **Skills = plain-text/markdown** in `~/.hermes/skills/`, agentskills.io-compatible → matches Iain's `SKILL.md` suite.
- Memory: episodic (SQLite `~/.hermes/state.db`), semantic (`MEMORY.md`/`USER.md`), procedural (skills). Local by default.

## Hermes 4 = the LLM family (a separate thing — just one model option)
- Open weights (Aug 26 2025), Llama-3.1-based, 14B/70B/405B, hybrid `<think>` reasoning, **minimal refusals / neutrally
  aligned** (→ a strong roaster). OpenRouter: `nousresearch/hermes-4-405b`.

## NemoClaw = NVIDIA's one-command deploy blueprint
- Bundles **model + harness + secure runtime**: default model **`nvidia/nemotron-3-super-120b-a12b`** (swappable),
  Hermes Agent harness, **OpenShell** runtime (filesystem/network policy, provider injection, credential brokering).
- Cloud inference via a build.nvidia.com key, or self-host Nemotron on NIM/vLLM. Early-preview (config API may shift).

## Stripe Skills for Hermes = SPENDING, not receiving
- Let the agent **buy / pay-per-call / provision SaaS**; every spend **human-approved in the Link app** (no self-approve).
  `link-cli` (virtual cards / Shared Payment Tokens for HTTP-402 APIs) + `mpp-agent` (Machine Payments Protocol).
- **Us receiving the $5/$12/$49 → standard Stripe Checkout** (the skill covers spending only). Agent-spend is the P4 flourish.

## What this means for AdChad
- **On-theme = build on the Hermes Agent harness** (+ NemoClaw deploy + Stripe spend skill if feasible). Model choice is FREE.
- **Grok is fully back** — running the harness on Grok is legit, not off-theme. Day-1 bake-off: Grok vs Hermes-4-405B vs
  Nemotron on 5 real bad ads → pick the roaster. Lean: **Nemotron for cheap scoring** (NVIDIA default, sponsor-friendly),
  **bake-off winner for the roast**. Per-skill model config makes this trivial.
- **Deadline risk:** harness setup can eat hours; NemoClaw is preview. Timebox the Thursday-AM spike; if not running by
  ~noon, fall back to a thin TS loop hitting the model endpoint directly (skills + `lib/` are portable, so little is lost).

Sources: hermes-agent.nousresearch.com/docs · developer.nvidia.com (Hermes+NemoClaw) · deepinfra.com/blog/openclaw-alternatives
· hermes4.nousresearch.com · openrouter.ai/nousresearch/hermes-4-405b · alphasignal.ai (Hermes spends money autonomously)
