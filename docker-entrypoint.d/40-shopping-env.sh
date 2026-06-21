#!/bin/sh
# Bakes per-instance config into js/env.js from env (nginx:alpine runs
# /docker-entrypoint.d/*.sh before start). One deployment == one instance.
#   SHOPPING_SERVER_URL  e.g. https://shopping.pandalanax.be
#   SHOPPING_API_TOKEN   Tandoor API token
# ponytail: no escaping — Tandoor tokens/URLs have no " or \. Add esc() if that changes.
cat > /usr/share/nginx/html/js/env.js <<EOF
window.__ENV__ = { serverUrl: "${SHOPPING_SERVER_URL:-}", token: "${SHOPPING_API_TOKEN:-}" };
EOF
