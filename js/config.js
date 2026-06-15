const KEY = 'shopping.config';

export function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { serverUrl: '', token: '' };
  } catch {
    return { serverUrl: '', token: '' };
  }
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
