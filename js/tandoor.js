import { apiBaseUrl } from './config.js';

const PAGE_SIZE = 200;
const MAX_PAGES = 10;

function headers(token) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
}

export async function fetchShoppingList({ serverUrl, token }) {
  const base = apiBaseUrl(serverUrl);
  let nextQuery = `?format=json&page_size=${PAGE_SIZE}`;
  const items = [];

  for (let page = 0; nextQuery && page < MAX_PAGES; page++) {
    const url = `${base}/shopping-list-entry/${nextQuery}`;
    const res = await fetch(url, { headers: headers(token) });
    if (!res.ok) {
      const err = new Error(`Fetch failed: ${res.status}`);
      err.status = res.status;
      if (items.length) break;
      throw err;
    }
    const data = await res.json();
    // Tandoor's `next` is an ABSOLUTE url pointing at its own host
    // (recipes.*), which is cross-origin from the proxied shopping.* origin and
    // gets blocked by CORS. Keep only its query string and re-issue the request
    // against our same-origin proxy base.
    nextQuery = data.next ? new URL(data.next).search : '';
    for (const entry of data.results || []) {
      if (Array.isArray(entry.shopping_lists) && entry.shopping_lists.length > 0) continue;
      const foodName = entry.food?.name || '';
      if (!foodName) continue;
      items.push({
        id: entry.id || 0,
        checked: !!entry.checked,
        amount: Number(entry.amount) || 0,
        foodName,
        category: entry.food?.supermarket_category?.name || '',
        unitName: entry.unit?.name || '',
        pendingSync: false,
      });
    }
  }
  return items;
}

export async function setItemChecked({ serverUrl, token }, id, checked) {
  const base = apiBaseUrl(serverUrl);
  const res = await fetch(`${base}/shopping-list-entry/${id}/?format=json`, {
    method: 'PATCH',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ checked }),
  });
  if (res.status === 404) return true;
  if (!res.ok) {
    const err = new Error(`PATCH failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return true;
}

export async function deleteEntries(cfg, ids) {
  if (!ids.length) return 0;
  const base = apiBaseUrl(cfg.serverUrl);
  let deleted = 0;
  for (const id of ids) {
    const res = await fetch(`${base}/shopping-list-entry/${id}/?format=json`, {
      method: 'DELETE',
      headers: headers(cfg.token),
    });
    // 404 = already gone — treat as deleted. Network errors reject and bubble
    // up so the caller keeps the queue and retries on the next sync.
    if (res.ok || res.status === 404) {
      deleted++;
      continue;
    }
    const err = new Error(`DELETE failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return deleted;
}

export async function bulkSetChecked(cfg, ids, checked) {
  if (!ids.length) return true;
  const base = apiBaseUrl(cfg.serverUrl);
  let res;
  try {
    res = await fetch(`${base}/shopping-list-entry/bulk/?format=json`, {
      method: 'POST',
      headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, checked }),
    });
  } catch (e) {
    res = null;
  }
  if (res && (res.status === 200 || res.status === 204)) return true;
  if (res && res.status === 401) {
    const err = new Error('Auth failed');
    err.status = 401;
    throw err;
  }
  for (const id of ids) await setItemChecked(cfg, id, checked);
  return true;
}
