const KEY = 'shopping.config';

function envDefaults() {
  const e = (typeof window !== 'undefined' && window.__ENV__) || {};
  return { serverUrl: e.serverUrl || '', token: e.token || '' };
}

export function loadConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    // A saved config (user edited settings) wins; otherwise fall back to the
    // per-instance values baked in at deploy time via env vars (env.js).
    if (stored && (stored.serverUrl || stored.token)) return stored;
  } catch {
    /* fall through to env defaults */
  }
  return envDefaults();
}

export function saveConfig(cfg) {
  localStorage.setItem(KEY, JSON.stringify({ serverUrl: cfg.serverUrl.trim(), token: cfg.token.trim() }));
}

export function hasConfig() {
  const c = loadConfig();
  return !!c.serverUrl && !!c.token;
}

export function apiBaseUrl(serverUrl) {
  return serverUrl.replace(/\/+$/, '') + '/api';
}
