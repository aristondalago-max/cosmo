// Formatação em português do Brasil para números físicos (porta de Format.kt).
import { C, AU, LY, YEAR, DAY } from './physics.js';

const nf = new Map();
function fmtr(d) {
  if (!nf.has(d)) nf.set(d, new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }));
  return nf.get(d);
}
export const num = (v, d = 1) => fmtr(d).format(v);
export const int = (v) => fmtr(0).format(Math.trunc(v));

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (n) => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map((c) => SUP[+c]).join('');
export function sci(v, d = 1) {
  if (v === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(v)));
  return `${num(v / Math.pow(10, e), d)} × 10${sup(e)}`;
}

export function energy(j) {
  if (j < 1e3) return `${num(j)} J`;
  if (j < 1e6) return `${num(j / 1e3)} kJ`;
  if (j < 1e9) return `${num(j / 1e6)} MJ`;
  if (j < 1e12) return `${num(j / 1e9)} GJ`;
  if (j < 1e15) return `${num(j / 1e12)} TJ`;
  if (j < 1e18) return `${num(j / 1e15)} PJ`;
  if (j < 1e21) return `${num(j / 1e18)} EJ`;
  return `${sci(j)} J`;
}

export function duration(s) {
  if (s < 60) return `${num(s, 0)} s`;
  if (s < 3600) return `${num(s / 60, 0)} min`;
  if (s < DAY * 2) return `${num(s / 3600, 1)} h`;
  if (s < YEAR) return `${num(s / DAY, 0)} dias`;
  if (s < YEAR * 1e3) return `${num(s / YEAR, s < YEAR * 10 ? 1 : 0)} anos`;
  if (s < YEAR * 1e6) return `${num(s / YEAR / 1e3, 0)} mil anos`;
  if (s < YEAR * 1e9) return `${num(s / YEAR / 1e6, 1)} milhões de anos`;
  return `${num(s / YEAR / 1e9, 1)} bilhões de anos`;
}

export function distance(m) {
  if (m < 1e9) return `${int(m / 1e3)} km`;
  if (m < AU * 2) return `${num(m / 1e9, m < 1e10 ? 1 : 0)} milhões de km`;
  if (m < LY * 0.1) return `${num(m / AU, 1)} UA`;
  if (m < LY * 1e3) return `${num(m / LY, 2)} anos-luz`;
  if (m < LY * 1e6) return `${num(m / LY / 1e3, 1)} mil anos-luz`;
  return `${num(m / LY / 1e6, 2)} milhões de anos-luz`;
}

export function speed(ms) {
  if (ms < 1e3) return `${num(ms, 0)} m/s`;
  if (ms < 0.001 * C) return `${num(ms / 1e3, 0)} km/s`;
  return `${num((ms / C) * 100, ms / C < 0.1 ? 2 : 1)}% de c`;
}

export function g(v) {
  if (v < 100) return `${num(v, 1)} g`;
  if (v < 1e6) return `${int(v)} g`;
  return `${sci(v, 1)} g`;
}

export function massKg(kg) {
  if (kg < 1e3) return `${num(kg, 0)} kg`;
  if (kg < 1e9) return `${num(kg / 1e3, 0)} t`;
  return `${num(kg / 1e9, 1)} milhões de t`;
}
