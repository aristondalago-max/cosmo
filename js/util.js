// Utilidades: construtor de DOM seguro (texto nunca vira HTML) e ícones de linha em SVG.
export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v; // só para SVG/strings internas, nunca texto do usuário
    else if (k === 'for') el.htmlFor = v;
    else if (k in el && !['list', 'form'].includes(k)) { try { el[k] = v; } catch { el.setAttribute(k, v); } }
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function clear(el) { while (el.firstChild) el.firstChild.remove(); return el; }

const ICONS = {
  home: "<path d='M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10'/>",
  groups: "<circle cx='9' cy='8' r='3'/><circle cx='17' cy='9' r='2.4'/><path d='M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M15.5 14.8c3 .1 5.5 1.9 5.5 5'/>",
  explore: "<circle cx='12' cy='12' r='9'/><path d='M15.5 8.5l-2 5-5 2 2-5z'/>",
  person: "<circle cx='12' cy='8' r='4'/><path d='M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7'/>",
  ciencia: "<path d='M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3'/><path d='M7.5 15h9'/>",
  fisica: "<circle cx='12' cy='12' r='1.8'/><ellipse cx='12' cy='12' rx='10' ry='4.2'/><ellipse cx='12' cy='12' rx='10' ry='4.2' transform='rotate(60 12 12)'/><ellipse cx='12' cy='12' rx='10' ry='4.2' transform='rotate(120 12 12)'/>",
  investigacao: "<circle cx='10.5' cy='10.5' r='6.5'/><path d='M15.5 15.5L21 21'/>",
  caixa: "<path d='M3 8h18v3H3zM5 11v9h14v-9M10 15h4'/>",
  drake: "<path d='M6 4h12M6 20h12M16 4L8 12l8 8'/>",
  fermi: "<circle cx='12' cy='12' r='9'/><path d='M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01'/>",
  transito: "<path d='M3 12h4l3-7 4 14 3-7h4'/>",
  laboratorio: "<rect x='5' y='3' width='14' height='18' rx='2'/><path d='M8 7h8M8 12h2M12 12h2M16 12h.01M8 16h2M12 16h2M16 16h.01'/>",
  missao: "<path d='M12 3c3.5 2 5 6 4 11l-4 3-4-3c-1-5 .5-9 4-11z'/><circle cx='12' cy='10' r='1.6'/><path d='M8 14l-3 3 3 .5M16 14l3 3-3 .5M12 17v4'/>",
  detector: "<path d='M12 3l10 18H2z'/><path d='M12 10v5M12 18h.01'/>",
  escala: "<rect x='2' y='8' width='20' height='8' rx='1.5'/><path d='M6 8v4M10 8v3M14 8v4M18 8v3'/>",
  ovni2d: "<path d='M4 16a8 8 0 1 1 16 0'/><path d='M12 16l4-5'/>",
  investigador: "<circle cx='10.5' cy='10.5' r='6.5'/><path d='M15.5 15.5L21 21'/>",
  arvore: "<circle cx='12' cy='5' r='2'/><circle cx='6' cy='19' r='2'/><circle cx='18' cy='19' r='2'/><path d='M12 7v5M12 12H6v5M12 12h6v5'/>",
  professor: "<path d='M2 9l10-5 10 5-10 5z'/><path d='M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5'/>",
  relatos: "<path d='M4 5h16v11H9l-5 4z'/>",
  enviar: "<circle cx='12' cy='12' r='9'/><path d='M12 8v8M8 12h8'/>",
  mapa: "<path d='M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2z'/><path d='M9 4v14M15 6v14'/>",
  estatisticas: "<path d='M4 20V10M10 20V4M16 20v-8M22 20H2'/>",
  galeria: "<rect x='3' y='4' width='18' height='16' rx='2'/><circle cx='9' cy='10' r='1.6'/><path d='M3 17l5-4 4 3 3-2 6 4'/>",
  back: "<path d='M15 5l-7 7 7 7'/>",
  camera: "<path d='M4 8h3l2-3h6l2 3h3v12H4z'/><circle cx='12' cy='13' r='3.5'/>",
  video: "<rect x='3' y='6' width='13' height='12' rx='2'/><path d='M16 10l5-3v10l-5-3z'/>",
  play: "<circle cx='12' cy='12' r='9'/><path d='M10 8.5v7l6-3.5z' fill='currentColor'/>",
  close: "<path d='M6 6l12 12M18 6L6 18'/>",
  info: "<circle cx='12' cy='12' r='9'/><path d='M12 11v6M12 7.5h.01'/>",
  search: "<circle cx='10.5' cy='10.5' r='6.5'/><path d='M15.5 15.5L21 21'/>",
};

export function icon(name, size = 24) {
  return h('span', {
    class: 'ic', style: { width: size + 'px', height: size + 'px' },
    html: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`,
  });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
