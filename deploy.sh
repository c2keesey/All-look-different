#!/usr/bin/env bash
# Publish the game to the OptiPlex, which serves it at https://alllookdifferent.c2k.page
# (alllookdifferent.service on loopback 4336 behind the c2k-website Cloudflare Tunnel).
# Only the public files are copied; scripts/, worker/ and repo metadata never leave here.
set -euo pipefail
cd "$(dirname "$0")"
HOST="${DEPLOY_HOST:-c2k-optiplex}"
DEST="sites/alllookdifferent"
ssh -o BatchMode=yes "$HOST" "mkdir -p ~/$DEST/public"
rsync -a --delete -e "ssh -o BatchMode=yes" \
  index.html styles.css quiz.js faces.js faces.json images "$HOST:$DEST/public/"
rsync -a -e "ssh -o BatchMode=yes" serve-static.mjs "$HOST:$DEST/"
ssh -o BatchMode=yes "$HOST" 'systemctl --user restart alllookdifferent.service && systemctl --user is-active alllookdifferent.service'
