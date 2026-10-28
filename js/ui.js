// Componentes do design system "Dark Space v1.0" (porta de Components.kt / Controls.kt).
import { h, icon, clear } from './util.js';
import { goBack } from './router.js';

export const LOGO_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="pg" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#7fb2ff"/><stop offset=".6" stop-color="#2a5bd7"/><stop offset="1" stop-color="#0e2466"/></radialGradient></defs><g fill="none" stroke="#8ab4ff" stroke-width="1.2" opacity=".85"><ellipse cx="50" cy="50" rx="47" ry="18"/><ellipse cx="50" cy="50" rx="47" ry="18" transform="rotate(60 50 50)"/><ellipse cx="50" cy="50" rx="47" ry="18" transform="rotate(120 50 50)"/></g><circle cx="50" cy="50" r="15" fill="url(#pg)"/><ellipse cx="50" cy="50" rx="25" ry="5.5" transform="rotate(-18 50 50)" fill="none" stroke="#8ab4ff" stroke-width="2"/><circle cx="90" cy="58" r="2.6" fill="#bfd6ff"/><circle cx="14" cy="62" r="1.8" fill="#bfd6ff"/></svg>`;
export const logo = (size) => h('span', { class: 'logo', style: { width: size + 'px', height: size + 'px' }, html: LOGO_SVG });
export const wordmark = (small = true) => h('span', { class: small ? 'wordmark small' : 'wordmark' }, 'COSMO');

/** Fundo "espaço profundo" com campo de estrelas fixo. */
export function starfield(count = 70) {
  const c = h('canvas', { class: 'stars' });
  const draw = () => {
    const w = (c.width = innerWidth), hh = (c.height = innerHeight), ctx = c.getContext('2d');
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      const r = 0.5 + rnd() * 1.4;
      ctx.fillStyle = `rgba(255,255,255,${0.3 + r / 4})`;
      ctx.beginPath(); ctx.arc(rnd() * w, rnd() * hh, r, 0, 7); ctx.fill();
    }
  };
  requestAnimationFrame(draw);
  return c;
}

/** Tela padrão: cabeçalho (voltar, marca, título, subtítulo) e corpo. */
export function screen({ title, subtitle, back = true, plain = false }, ...children) {
  const head = h('div', { class: 'topbar' },
    back ? h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Voltar', onClick: goBack }, icon('back', 22)) : null,
    wordmark(true));
  return h('div', { class: 'screen' + (plain ? ' plain' : '') }, head,
    title ? h('h1', { class: 'title' }, title) : null,
    subtitle !== undefined ? h('p', { class: 'subtitle' }, subtitle) : null,
    h('div', { class: 'body' }, ...children));
}

export const card = (props, ...children) => {
  const p = props || {};
  return h('div', {
    class: 'card' + (p.hl ? ' hl' : '') + (p.onClick ? ' click' : '') + (p.class ? ' ' + p.class : ''),
    role: p.onClick ? 'button' : null, tabIndex: p.onClick ? 0 : null,
    onClick: p.onClick, style: p.style,
  }, ...children);
};

export const section = (text, raw = false) => h('div', { class: 'section' }, raw ? text : text.toUpperCase());
export const spacer = (px = 14) => h('div', { style: { height: px + 'px' } });
export const note = (text) => h('div', { class: 'note' }, icon('info', 20), h('div', null, text));
export const muted = (text) => h('p', { class: 'muted' }, text);
export const pill = (text, color) => h('span', { class: 'pill', style: color ? { color, background: color + '26' } : null }, text);

/** Selo de rótulo físico. `set` = PROP_LEVELS ou EXPL_LEVELS. */
const LEVEL_COLOR = { Green: '#22c55e', Yellow: '#eab308', Orange: '#f97316', Red: '#ef4444' };
export function levelBadge(level, set, compact = false) {
  const c = LEVEL_COLOR[level];
  return h('span', { class: 'badge', style: { color: c, background: c + '26', borderColor: c + '80' } },
    h('i', { style: { background: c } }), compact ? set[level].short : set[level].label);
}

export function chips(options, selected, onSelect) {
  const wrap = h('div', { class: 'chips' });
  let sel = selected;
  const render = () => {
    clear(wrap);
    options.forEach((o, i) => wrap.append(h('button', {
      class: 'chip' + (i === sel ? ' on' : ''), type: 'button',
      onClick: () => { sel = i; render(); onSelect(i); },
    }, o)));
  };
  render();
  wrap.set = (i) => { sel = i; render(); };
  return wrap;
}

export function toggle(label, checked, onChange) {
  const input = h('input', { type: 'checkbox', checked, onChange: () => onChange(input.checked) });
  return h('label', { class: 'switch' }, h('span', null, label), input, h('i'));
}

export function button(text, onClick, kind = 'primary') {
  return h('button', { class: 'btn ' + kind, type: 'button', onClick }, text);
}

/** Slider com rótulo e valor formatado; `log` = escala logarítmica. Devolve elemento com .set(v). */
export function slider({ label, value, min, max, log = false, fmt, onInput }) {
  const toPos = (v) => (log ? (Math.log10(v) - Math.log10(min)) / (Math.log10(max) - Math.log10(min)) : (v - min) / (max - min));
  const fromPos = (p) => (log ? Math.pow(10, Math.log10(min) + p * (Math.log10(max) - Math.log10(min))) : min + p * (max - min));
  const badge = h('span', { class: 'sl-val' }, fmt(value));
  const input = h('input', { type: 'range', min: 0, max: 1000, step: 1, value: Math.round(Math.min(1, Math.max(0, toPos(value))) * 1000) });
  const paint = () => input.style.setProperty('--p', (input.value / 10) + '%');
  input.addEventListener('input', () => { const v = fromPos(input.value / 1000); badge.textContent = fmt(v); paint(); onInput(v); });
  paint();
  const el = h('div', { class: 'slider' }, h('div', { class: 'sl-row' }, h('span', null, label), badge), input);
  el.set = (v) => { input.value = Math.round(Math.min(1, Math.max(0, toPos(v))) * 1000); badge.textContent = fmt(v); paint(); };
  return el;
}

export function field({ label, value = '', placeholder = '', suffix = '', type = 'text', multiline = false, inputmode, onInput }) {
  const input = multiline
    ? h('textarea', { rows: 4, placeholder, value })
    : h('input', { type, placeholder, value, inputMode: inputmode, autocomplete: 'off', autocapitalize: 'off' });
  if (multiline) input.value = value;
  input.addEventListener('input', () => onInput && onInput(input.value));
  const el = h('label', { class: 'field' }, h('span', { class: 'fl' }, label),
    h('span', { class: 'fw' }, input, suffix ? h('span', { class: 'sfx' }, suffix) : null));
  el.input = input;
  return el;
}

export function stat(label, value, hint) {
  const v = h('div', { class: 'sv' }, value), hi = h('div', { class: 'sh' }, hint || '');
  const el = h('div', { class: 'card stat' }, h('div', { class: 'sl' }, label), v, hi);
  el.set = (nv, nh) => { v.textContent = nv; hi.textContent = nh || ''; hi.style.display = nh ? '' : 'none'; };
  el.set(value, hint);
  return el;
}
export const statRow = (...stats) => h('div', { class: 'row g12' }, ...stats);

export function resultRow(label, value, color) {
  const v = h('span', { class: 'rv', style: color ? { color } : null }, value);
  const el = h('div', { class: 'rrow' }, h('span', { class: 'rl' }, label), v);
  el.set = (nv, c) => { v.textContent = nv; v.style.color = c || ''; };
  return el;
}

/** Linha de funcionalidade (hub e Explorar). */
export function featureRow(feature, onClick) {
  return card({ onClick }, h('div', { class: 'frow' },
    h('div', { class: 'fico' }, icon(feature.id, 24)),
    h('div', { class: 'fbody' }, h('div', { class: 'ft' }, feature.title), h('div', { class: 'fs' }, feature.summary))));
}

export function moduleTile(m, onClick) {
  return card({ onClick, class: 'tile' }, icon(m.icon, 44), h('div', { class: 'tt' }, m.title), h('div', { class: 'ts' }, m.subtitle));
}
