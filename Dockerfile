FROM nginx:1.27-alpine

COPY index.html manifest.webmanifest sw.js /usr/share/nginx/html/
COPY css   /usr/share/nginx/html/css
COPY js    /usr/share/nginx/html/js
COPY icons /usr/share/nginx/html/icons

# Injects per-instance config (server URL + token) into js/env.js at start.
COPY docker-entrypoint.d/40-shopping-env.sh /docker-entrypoint.d/40-shopping-env.sh
RUN chmod +x /docker-entrypoint.d/40-shopping-env.sh

EXPOSE 80
