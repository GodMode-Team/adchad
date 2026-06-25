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
MODEL="$(get MODEL_ROAST)"; MODEL="${MODEL:-nousresearch/hermes-4-405b}"
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
for s in adchad roast synthcheck copy; do
  [ -d "$DIR/skills/$s" ] && rm -rf "$DEST/$s" && cp -R "$DIR/skills/$s" "$DEST/$s"
done
echo "✓ skills installed → $DEST  (adchad, roast, synthcheck, copy)"
# ponytail: copy, not symlink — re-run after editing skills/. For zero-drift, set skills.external_dirs to the repo instead.

cat <<EOF

Done. AdChad is wired onto Hermes (operator model: $MODEL via OpenRouter).

Preview now (safe — publishes nothing):
    hermes -z "/adchad preview a cycle for med spas"

Go autonomous (you decide go-live):
    # dry-run hourly — safe default:
    hermes cron create "every 1h" "Run an AdChad cycle for med spas (dry-run) and report the counts." --skill adchad
    # …or LIVE hourly (real public roasts + cold emails) — only when you're ready:
    hermes cron create "every 1h" "Run a LIVE AdChad cycle for med spas (append --live). Report who got roasted." --skill adchad
    hermes gateway start     # daemon ticks cron every 60s
    hermes cron list
EOF
