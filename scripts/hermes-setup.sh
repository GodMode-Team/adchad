#!/usr/bin/env bash
# Wire AdChad onto the Hermes Agent harness: model = OpenRouter, install our skills, print go-live commands.
# Idempotent — safe to re-run. Does NOT install Hermes for you and does NOT start live posting.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV="$DIR/.env.local"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"

# 1. Hermes installed?
if ! command -v hermes >/dev/null 2>&1; then
  echo "✗ Hermes Agent not found. Install it, then re-run this script:"
  echo "    curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash"
  echo "    hermes setup --portal   # optional OAuth; or just use OpenRouter, wired below"
  exit 1
fi
echo "✓ hermes: $(command -v hermes)"

# 2. Pull our key + operator model out of .env.local (sed returns 0 even on no match)
get() { sed -n -E "s/^$1=//p" "$ENV" 2>/dev/null | head -1 | sed 's/^"//;s/"$//'; }
KEY="$(get OPENROUTER_API_KEY)"
# Brain must support tool-calling (the harness drives everything via tools). Hermes-4 on OpenRouter does NOT,
# so we use NVIDIA Nemotron (tool-capable, on-theme, what NemoClaw runs). Override with MODEL_BRAIN.
MODEL="$(get MODEL_BRAIN)"; MODEL="${MODEL:-nvidia/nemotron-3-super-120b-a12b}"
[ -n "$KEY" ] || { echo "✗ OPENROUTER_API_KEY missing from $ENV"; exit 1; }

# 3. Point Hermes at OpenRouter + Nous's own model (CLI routes the key to ~/.hermes/.env, values to config.yaml)
hermes config set model.provider openrouter
hermes config set model.default "$MODEL"
hermes config set OPENROUTER_API_KEY "$KEY"
hermes config set adchad.project_dir "$DIR" || true
echo "✓ model: openrouter / $MODEL"

# 4. Install our skills into the harness (adchad operator + the pipeline skills it relies on)
DEST="$HERMES_HOME/skills/adchad"
mkdir -p "$DEST"
for s in adchad prospect roast engage fulfill report evolve synthcheck copy; do
  [ -d "$DIR/skills/$s" ] && rm -rf "$DEST/$s" && cp -R "$DIR/skills/$s" "$DEST/$s"
done
echo "✓ skills installed → $DEST  (adchad + prospect/roast/engage/fulfill/report/evolve + synthcheck/copy)"
# ponytail: copy, not symlink — re-run after editing skills/. For zero-drift, set skills.external_dirs to the repo instead.

# 5. Start SAFE — kill-switch ON until the operator resumes (the agent drafts but publishes nothing)
( cd "$DIR" && pnpm -s tool db pause >/dev/null 2>&1 ) && echo "✓ kill-switch ON — publishes nothing until: pnpm -s tool db resume"

cat <<EOF

Done. AdChad is wired onto Hermes (brain: $MODEL via OpenRouter).

Meet it (safe — nothing publishes):
    hermes -z "who are you and what's your mission?"
    hermes -z "/prospect find a target in med spas"     # scans + audits; won't post

Register the heartbeat (the autonomous business). Kill-switch starts ON-safe — it publishes
only once you resume it, so these are safe to register now:
    hermes cron create "every 1h"  "/prospect a fresh niche, then /roast the best target. Respect the kill-switch."
    hermes cron create "every 15m" "/engage — answer new mentions, DMs, inbox; push threads toward the \$5 close."
    hermes cron create "every 10m" "/fulfill any paid-but-undelivered orders (check: pnpm -s tool db orders)."
    hermes cron create "0 9 * * 1" "/report the weekly P&L to the operator and flag anything you need to grow."
    hermes cron create "0 3 * * *" "/evolve — review yesterday and improve one skill."
    hermes gateway start     # daemon ticks cron every 60s
    hermes cron list

Go / stop:  pnpm -s tool db resume   (let it publish)   ·   pnpm -s tool db pause   (halt all publish + spend)
EOF
