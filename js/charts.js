// Gráficos em canvas (sem biblioteca): linha, barras, ranking horizontal e rosca.
import { h } from './util.js';

const FONT = '11px Poppins, system-ui, sans-serif';
const MUTED = '#9aa8cc', BORDER = '#26325a', ACCENT = '#8ab4ff';

/** Canvas que se redesenha sozinho quando muda de largura (inclusive ao ser inserido na tela). */
function canvasBox(height, draw) {
  const canvas = h('canvas', { class: 'chart', style: { height: height + 'px' } });
  const redraw = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, r.width, height, canvas);
  };
  canvas.redraw = redraw;
  new ResizeObserver(redraw).observe(canvas);
  return canvas;
}

/** opts: series[[x,y]...], xRange, yRange, xTicks, yTicks, fx, fy, xLabel, yLabel, colors, marker. Altere canvas.opts e chame redraw(). */
export function lineChart(opts, height = 240) {
  const c = canvasBox(height, (ctx, w, hh, cv) => {
    const o = cv.opts;
    const left = 62, right = w - 12, top = 14, bottom = hh - 52;
    const px = (x) => left + ((x - o.xRange[0]) / (o.xRange[1] - o.xRange[0])) * (right - left);
    const py = (y) => bottom - ((Math.min(Math.max(y, o.yRange[0]), o.yRange[1]) - o.yRange[0]) / (o.yRange[1] - o.yRange[0])) * (bottom - top);
    ctx.font = FONT; ctx.lineWidth = 1; ctx.strokeStyle = BORDER; ctx.fillStyle = MUTED;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    o.yTicks.forEach((t) => { const y = py(t); ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); ctx.fillText(o.fy(t), left - 6, y); });
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    o.xTicks.forEach((t) => { const x = px(t); ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke(); ctx.fillText(o.fx(t), x, bottom + 6); });
    const cols = o.colors || [ACCENT, '#f97316'];
    o.series.forEach((pts, i) => {
      if (pts.length < 2) return;
      ctx.beginPath(); ctx.lineWidth = 2.5; ctx.strokeStyle = cols[i % cols.length]; ctx.lineJoin = 'round';
      pts.forEach(([x, y], j) => (j ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y))));
      ctx.stroke();
    });
    if (o.marker) { ctx.fillStyle = '#eab308'; ctx.beginPath(); ctx.arc(px(o.marker[0]), py(o.marker[1]), 5, 0, 7); ctx.fill(); }
    ctx.fillStyle = ACCENT; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(o.xLabel, (left + right) / 2, hh - 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(o.yLabel, left, 0);
  });
  c.opts = opts;
  return c;
}

/** items: [[rótulo, valor]...] */
export function barChart(items, color = '#3b82f6', height = 170) {
  const c = canvasBox(height, (ctx, w, hh) => {
    if (!items.length) return;
    const max = Math.max(1, ...items.map((i) => i[1]));
    const bottom = hh - 34, top = 28, slot = w / items.length, bw = slot * 0.6;
    ctx.font = FONT; ctx.textAlign = 'center';
    items.forEach(([label, v], i) => {
      const bh = (v / max) * (bottom - top), x = slot * i + (slot - bw) / 2;
      ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, bottom - Math.max(bh, 2), bw, Math.max(bh, 2), 6); ctx.fill();
      ctx.fillStyle = '#f2f5ff'; ctx.textBaseline = 'bottom'; ctx.fillText(String(v), x + bw / 2, bottom - Math.max(bh, 2) - 4);
      ctx.fillStyle = MUTED; ctx.textBaseline = 'top'; ctx.fillText(label, x + bw / 2, bottom + 8);
    });
    ctx.strokeStyle = BORDER; ctx.beginPath(); ctx.moveTo(0, bottom); ctx.lineTo(w, bottom); ctx.stroke();
  });
  return c;
}

export function hbarList(items, color = ACCENT) {
  const max = Math.max(1, ...items.map((i) => i[1]));
  return h('div', { class: 'hbars' }, ...items.map(([label, v]) => h('div', { class: 'hb' },
    h('span', { class: 'hl' }, label),
    h('span', { class: 'ht' }, h('i', { style: { width: (v / max) * 100 + '%', background: color } })),
    h('span', { class: 'hv' }, String(v)))));
}

export function donut(a, b, colorA = ACCENT, colorB = '#1a2444', size = 96) {
  const c = h('canvas', { class: 'donut', width: size * 2, height: size * 2, style: { width: size + 'px', height: size + 'px' } });
  const ctx = c.getContext('2d'), s = size * 2, lw = s * 0.18, r = (s - lw) / 2, total = Math.max(1, a + b);
  ctx.lineWidth = lw; ctx.strokeStyle = colorB; ctx.beginPath(); ctx.arc(s / 2, s / 2, r, 0, 7); ctx.stroke();
  if (a > 0) { ctx.strokeStyle = colorA; ctx.beginPath(); ctx.arc(s / 2, s / 2, r, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * a) / total); ctx.stroke(); }
  return c;
}

/** Canvas de desenho livre (trajetória do OVNI, régua logarítmica, radar). draw(ctx, w, h, canvas). */
export function drawing(height, draw) { return canvasBox(height, draw); }
