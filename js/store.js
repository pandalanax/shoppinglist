const LIST_KEY = 'shopping.list';
const QUEUE_KEY = 'shopping.queue';

export function loadCachedList() {
  try {
    return JSON.parse(localStorage.getItem(LIST_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveCachedList(items) {
  localStorage.setItem(LIST_KEY, JSON.stringify(items));
}

export function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueChange(id, checked) {
  const q = loadQueue().filter((c) => c.id !== id);
  q.push({ id, checked });
  saveQueue(q);
}

export function clearQueue() {
  saveQueue([]);
}
