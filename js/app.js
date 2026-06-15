import { loadConfig, saveConfig, hasConfig } from './config.js';
import * as api from './tandoor.js';
import * as store from './store.js';

const listEl = document.getElementById('list');
const toastEl = document.getElementById('toast');
const settingsEl = document.getElementById('settings');

let items = [];

function groupedLineText(group) {
  const first = group[0];
  const amount = first.amount > 0 ? first.amount * group.length : group.length;
  const amountStr = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
  return `${amountStr}${first.unitName ? ' ' + first.unitName : ''} ${first.foodName}`;
}

function collapse(list) {
  const groups = new Map();
  for (const it of list) {
    const key = `${it.foodName}|${it.unitName}|${it.amount}`;
    (groups.get(key) || groups.set(key, []).get(key)).push(it);
  }
  return [...groups.values()].map((group) => ({
    type: 'item',
    ids: group.map((g) => g.id),
    text: groupedLineText(group),
    checked: group[0].checked,
    pending: group.some((g) => g.pendingSync),
  }));
}

function buildDisplayRows(model) {
  const rows = [];
  const unchecked = model.filter((i) => !i.checked);
  const checked = model.filter((i) => i.checked);

  const byCat = new Map();
  for (const it of unchecked) {
    const cat = it.category || 'Other';
    (byCat.get(cat) || byCat.set(cat, []).get(cat)).push(it);
  }
  for (const cat of [...byCat.keys()].sort((a, b) => a.localeCompare(b))) {
    rows.push({ type: 'category', label: cat });
    rows.push(...collapse(byCat.get(cat)));
  }

  if (checked.length) {
    rows.push({ type: 'category', label: 'Done' });
    rows.push(...collapse(checked));
  }
  return rows;
}

function render() {
  if (!items.length) {
    listEl.innerHTML = '<div class="empty">Shopping list is empty</div>';
    return;
  }
  listEl.innerHTML = '';
  for (const row of buildDisplayRows(items)) {
    if (row.type === 'category') {
      const el = document.createElement('div');
      el.className = 'category';
      el.textContent = row.label;
      listEl.appendChild(el);
      continue;
    }
    const el = document.createElement('div');
    el.className = 'item' + (row.checked ? ' item--checked' : '') + (row.pending ? ' item--pending' : '');
    const box = document.createElement('span');
    box.className = 'item__check';
    box.textContent = row.checked ? '✓' : '';
    const text = document.createElement('span');
    text.className = 'item__text';
    text.textContent = row.text;
    el.append(box, text);
    el.addEventListener('click', () => toggleItem(row.ids, !row.checked));
    listEl.appendChild(el);
  }
}

async function refresh() {
  if (!hasConfig()) return openSettings();
  const cfg = loadConfig();
  toast('Syncing…');
  try {
    const queue = store.loadQueue();
    const on = queue.filter((c) => c.checked).map((c) => c.id);
    const off = queue.filter((c) => !c.checked).map((c) => c.id);
    if (on.length) await api.bulkSetChecked(cfg, on, true);
    if (off.length) await api.bulkSetChecked(cfg, off, false);
    store.clearQueue();
    const pushed = on.length + off.length;

    items = await api.fetchShoppingList(cfg);
    store.saveCachedList(items);
    render();
    toast(pushed ? `Synced ${pushed} · ${items.length} items` : `${items.length} items`);
  } catch (e) {
    items = store.loadCachedList();
    render();
    toast(e.status === 401 ? 'Auth failed — check token' : 'Offline — showing cached');
  }
}

function toggleItem(ids, checked) {
  const set = new Set(ids);
  for (const it of items) {
    if (set.has(it.id)) {
      it.checked = checked;
      it.pendingSync = true;
    }
  }
  store.saveCachedList(items);
  for (const id of ids) store.enqueueChange(id, checked);
  render();
}

function openSettings() {
  const c = loadConfig();
  settingsEl.querySelector('#serverUrl').value = c.serverUrl;
  settingsEl.querySelector('#token').value = c.token;
  settingsEl.showModal();
}

document.getElementById('settingsForm').addEventListener('submit', () => {
  if (settingsEl.returnValue === 'cancel') return;
  saveConfig({
    serverUrl: settingsEl.querySelector('#serverUrl').value,
    token: settingsEl.querySelector('#token').value,
  });
  refresh();
});

document.getElementById('settingsBtn').addEventListener('click', openSettings);
document.getElementById('refreshBtn').addEventListener('click', refresh);

let pullStartY = null;
let pulling = false;
const PULL_THRESHOLD = 70;

document.addEventListener('touchstart', (e) => {
  // Don't track pulls while the settings dialog is open — stray page touches
  // during an iOS clipboard "Paste" callout would reject the read.
  pullStartY = !settingsEl.open && window.scrollY <= 0 ? e.touches[0].clientY : null;
  pulling = false;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (pullStartY === null) return;
  if (e.touches[0].clientY - pullStartY > PULL_THRESHOLD) pulling = true;
}, { passive: true });

document.addEventListener('touchend', () => {
  if (pulling) refresh();
  pullStartY = null;
  pulling = false;
});

let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 2000);
}

function init() {
  items = store.loadCachedList();
  render();
  if (hasConfig()) refresh();
  else openSettings();
}

init();
