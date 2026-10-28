// Armazenamento local: relatos e mídia em IndexedDB, preferências em localStorage.
// Nada sai do aparelho. Se o navegador bloquear o armazenamento (aba privada), tudo funciona só em memória.
import { SEED } from './data.js';

export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
let db = null;
let own = [];
let persistent = true;
const urlCache = new Map();
const memoryBlobs = new Map();

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('sem IndexedDB'));
    const rq = indexedDB.open('cosmo', 1);
    rq.onupgradeneeded = () => { rq.result.createObjectStore('reports', { keyPath: 'id' }); rq.result.createObjectStore('media', { keyPath: 'id' }); };
    rq.onsuccess = () => resolve(rq.result);
    rq.onerror = () => reject(rq.error);
  });
}
const run = (store, mode, fn) => new Promise((resolve, reject) => {
  if (!db) return resolve(undefined);
  const t = db.transaction(store, mode);
  const r = fn(t.objectStore(store));
  t.oncomplete = () => resolve(r && r.result);
  t.onerror = () => reject(t.error);
});

export async function initStore() {
  try {
    db = await openDb();
    own = (await run('reports', 'readonly', (s) => s.getAll())) || [];
    navigator.storage?.persist?.();
  } catch { db = null; persistent = false; own = []; }
  return persistent;
}
export const isPersistent = () => persistent;

// ---------- preferências ----------
const mem = {};
export function getPref(k, def) {
  try { const v = localStorage.getItem('cosmo.' + k); return v == null ? (k in mem ? mem[k] : def) : JSON.parse(v); } catch { return k in mem ? mem[k] : def; }
}
export function setPref(k, v) { mem[k] = v; try { localStorage.setItem('cosmo.' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } }

// ---------- relatos ----------
export const allReports = () => [...own, ...SEED].sort((a, b) => b.sightingAt - a.sightingAt);
export const visibleReports = () => allReports().filter((r) => getPref('showExamples', true) || !r.isExample);
export const ownReports = () => own.slice().sort((a, b) => b.sightingAt - a.sightingAt);
export const reportById = (id) => allReports().find((r) => r.id === id);

export async function addReport(r) { own.push(r); await run('reports', 'readwrite', (s) => s.put(r)); }
export async function updateReport(r) {
  const i = own.findIndex((x) => x.id === r.id);
  if (i >= 0) { own[i] = r; await run('reports', 'readwrite', (s) => s.put(r)); return; }
  const j = SEED.findIndex((x) => x.id === r.id); // exemplos: só em memória, não persistem
  if (j >= 0) SEED[j] = r;
}
export async function deleteReport(id) {
  const r = own.find((x) => x.id === id);
  if (!r) return;
  for (const m of r.media) { urlCache.delete(m.id); memoryBlobs.delete(m.id); await run('media', 'readwrite', (s) => s.delete(m.id)); }
  own = own.filter((x) => x.id !== id);
  await run('reports', 'readwrite', (s) => s.delete(id));
}

// ---------- mídia ----------
export const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

/** Guarda foto/vídeo escolhido. Aceita imagem ou vídeo até 50 MB. Devolve {media} ou {error}. */
export async function importMedia(file) {
  const type = file.type || '';
  const kind = type.startsWith('image/') ? 'Foto' : type.startsWith('video/') ? 'Video' : null;
  if (!kind) return { error: 'Arquivo não aceito: só fotos e vídeos.' };
  if (file.size > MAX_MEDIA_BYTES) return { error: 'Arquivo acima de 50 MB.' };
  const id = newId();
  memoryBlobs.set(id, file);
  await run('media', 'readwrite', (s) => s.put({ id, blob: file, kind, type }));
  return { media: { id, kind } };
}
export async function mediaURL(id) {
  if (urlCache.has(id)) return urlCache.get(id);
  let blob = memoryBlobs.get(id);
  if (!blob) { const rec = await run('media', 'readonly', (s) => s.get(id)); blob = rec && rec.blob; }
  if (!blob) return null;
  const u = URL.createObjectURL(blob);
  urlCache.set(id, u);
  return u;
}
export async function discardMedia(id) { urlCache.delete(id); memoryBlobs.delete(id); await run('media', 'readwrite', (s) => s.delete(id)); }
