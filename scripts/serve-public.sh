#!/usr/bin/env bash
#
# Keeps the public demo reachable.
#
# WHY THIS EXISTS
# ---------------
# Free tunnels drop. cloudflared's quick tunnel and bore both reconnect on their
# own client side while the edge stops routing to them, so the process looks
# alive and the URL is dead. The failure is silent and the link just stops
# working — which is worse than an obvious crash.
#
# This loop checks the real public URL, not the process, and restarts the tunnel
# when the URL stops answering. It also restarts the app if port 3000 goes away.
#
# The cloudflared quick-tunnel URL changes when its process restarts, so the
# current links are always written to .tools/public-urls.txt.
#
# Usage:
#   ./scripts/serve-public.sh            # foreground
#   nohup ./scripts/serve-public.sh &    # background

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT=3000
BORE_PORT=38471
URLS_FILE="$ROOT/.tools/public-urls.txt"
LOG_DIR="/tmp"
INTERVAL=45

mkdir -p "$ROOT/.tools"

log() { printf '%s  %s\n' "$(date '+%H:%M:%S')" "$*"; }

app_up() {
  curl -s -o /dev/null --max-time 8 "http://127.0.0.1:$PORT/" 2>/dev/null
}

start_app() {
  log "app: not answering on :$PORT — starting"
  pkill -f "next-server" 2>/dev/null
  pkill -f "next start" 2>/dev/null
  sleep 1
  nohup npm run start > "$LOG_DIR/prod.log" 2>&1 &
  for _ in $(seq 1 30); do
    app_up && { log "app: up"; return; }
    sleep 1
  done
  log "app: still down after 30s — check $LOG_DIR/prod.log"
}

# A cloudflared process that is already running may have issued a URL after this
# script's startup window closed. Adopting it is better than killing a tunnel
# that works, which is what the first version of this loop did — it churned
# through a new URL every 45 seconds and never settled.
adopt_cloudflared() {
  local url
  url="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG_DIR/tunnel-cf.log" 2>/dev/null | tail -1)"
  if [ -n "$url" ] && curl -s -o /dev/null --max-time 12 "$url/"; then
    log "cloudflared: adopted $url"
    CF_URL="$url"
    return 0
  fi
  return 1
}

start_cloudflared() {
  pkill -9 -f "cloudflared tunnel --url http://localhost:$PORT" 2>/dev/null
  sleep 1
  nohup "$ROOT/.tools/cloudflared" tunnel --url "http://localhost:$PORT" \
    --no-autoupdate > "$LOG_DIR/tunnel-cf.log" 2>&1 &
  for _ in $(seq 1 40); do
    sleep 2
    local url
    url="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG_DIR/tunnel-cf.log" 2>/dev/null | head -1)"
    if [ -n "$url" ] && curl -s -o /dev/null --max-time 10 "$url/"; then
      log "cloudflared: $url"
      CF_URL="$url"
      return 0
    fi
  done
  log "cloudflared: failed to come up — check $LOG_DIR/tunnel-cf.log"
  CF_URL=""
  return 1
}

start_bore() {
  pkill -9 -f "bore local $PORT" 2>/dev/null
  sleep 1
  nohup "$ROOT/.tools/bore" local "$PORT" --to bore.pub --port "$BORE_PORT" \
    > "$LOG_DIR/tunnel-bore.log" 2>&1 &
  local url="http://bore.pub:$BORE_PORT"
  for _ in $(seq 1 20); do
    sleep 2
    if curl -s -o /dev/null --max-time 10 "$url/"; then
      log "bore:        $url"
      BORE_URL="$url"
      return 0
    fi
  done
  log "bore: failed to come up"
  BORE_URL=""
  return 1
}

write_urls() {
  {
    echo "# Meridian public demo — updated $(date '+%Y-%m-%d %H:%M:%S')"
    echo "# For a browser:"
    [ -n "${CF_URL:-}" ] && echo "$CF_URL"
    [ -n "${BORE_URL:-}" ] && echo "$BORE_URL"
    echo "# For an AI reader (Cloudflare returns 403 to GPTBot; bore does not):"
    [ -n "${BORE_URL:-}" ] && echo "$BORE_URL/process"
    [ -n "${BORE_URL:-}" ] && echo "$BORE_URL/docs/PROCESS.md"
  } > "$URLS_FILE"
}

CF_URL=""
BORE_URL=""

log "watching :$PORT, checking every ${INTERVAL}s"
app_up || start_app
start_cloudflared
start_bore
write_urls
log "links written to $URLS_FILE"

while true; do
  sleep "$INTERVAL"

  app_up || start_app

  if [ -z "$CF_URL" ] || ! curl -s -o /dev/null --max-time 12 "$CF_URL/"; then
    # Try to adopt a tunnel that came up late before spending a new URL.
    adopt_cloudflared || {
      log "cloudflared URL not answering — restarting (URL will change)"
      start_cloudflared
    }
    write_urls
  fi

  if [ -z "$BORE_URL" ] || ! curl -s -o /dev/null --max-time 12 "$BORE_URL/"; then
    log "bore not answering — restarting"
    start_bore
    write_urls
  fi
done
