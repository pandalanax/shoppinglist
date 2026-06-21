// Per-instance config, injected at container start from env vars by
// docker-entrypoint.d/40-shopping-env.sh (SHOPPING_SERVER_URL / SHOPPING_API_TOKEN).
// This committed copy is the empty default for local/dev use; loadConfig() in
// config.js uses it only when nothing is saved in localStorage.
window.__ENV__ = { serverUrl: '', token: '' };
