// Utilidades de navegação (hash #/...). Telas podem registrar limpeza (onLeave) e código pós-montagem (onMount).
let cleanups = [], mounts = [];
export function onLeave(fn) { cleanups.push(fn); }
export function onMount(fn) { mounts.push(fn); }
export function runCleanups() { const c = cleanups; cleanups = []; c.forEach((f) => { try { f(); } catch { /* ignora */ } }); }
export function runMounts() { const m = mounts; mounts = []; m.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); }

export const go = (hash) => { location.hash = hash; };
export const goBack = () => { if (history.length > 1) history.back(); else go('#/'); };
export const refresh = () => window.dispatchEvent(new Event('cosmo:refresh'));

export function toast(text, ms = 2200) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = text;
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}
