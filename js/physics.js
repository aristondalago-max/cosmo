// Núcleo de física do COSMO (porta de Physics.kt). Tudo em unidades SI.
export const C = 299_792_458.0;           // m/s
export const G0 = 9.80665;                // m/s²
export const GRAV = 6.674e-11;            // m³/(kg·s²)
export const LY = 9.4607e15;              // m
export const AU = 1.495978707e11;         // m
export const YEAR = 3.15576e7;            // s
export const DAY = 86_400.0;
export const R_EARTH = 6.371e6;           // m
export const R_SUN = 6.957e8;             // m
export const M_SUN = 1.98847e30;          // kg
export const TNT_J_PER_KG = 4.184e6;
export const WORLD_ENERGY_PER_YEAR = 6.0e20;  // consumo mundial de energia primária, ~600 EJ/ano
export const VOYAGER_SPEED = 17_000.0;        // m/s

// ---------- Relatividade restrita (beta = v/c) ----------
export const gamma = (beta) => 1 / Math.sqrt(1 - beta * beta);
export const kineticEnergy = (massKg, beta) => (gamma(beta) - 1) * massKg * C * C;
export const classicalKinetic = (massKg, beta) => 0.5 * massKg * Math.pow(beta * C, 2);
const atanh = (x) => 0.5 * Math.log((1 + x) / (1 - x));
export const properTimeToReach = (beta, a = G0) => (C / a) * atanh(beta);
export const coordinateTimeToReach = (beta, a = G0) => (C / a) * beta * gamma(beta);

// ---------- Aceleração centrípeta e tolerância humana ----------
export const centripetal = (v, r) => (v * v) / r;
export const toG = (a) => a / G0;
export const radiusFor = (v, gLimit) => (v * v) / (gLimit * G0);
export const TOLERANCE = [
  { maxG: 1.5, level: 'Green', label: 'Confortável', detail: 'Curva suave, como um carro ou avião de linha.' },
  { maxG: 9, level: 'Yellow', label: 'Limite de piloto treinado', detail: 'Com traje anti-g e por poucos segundos. Acima disso, perda de consciência.' },
  { maxG: 45, level: 'Orange', label: 'Sobrevivível só por instantes', detail: 'Registrado em colisões e ejeções; lesões graves prováveis.' },
  { maxG: Infinity, level: 'Red', label: 'Nenhum humano sobrevive', detail: 'Lesão por desaceleração dos órgãos, independentemente do assento ou traje.' },
];
export const toleranceOf = (g) => TOLERANCE.find((t) => g <= t.maxG);

// ---------- Rótulos físicos (verde, amarelo, laranja, vermelho) ----------
// Dois vocabulários, como no descritivo: um para PROPULSÃO (Módulo 2) e outro para EXPLICAÇÕES (Módulo 6).
export const LEVEL_KEYS = ['Green', 'Yellow', 'Orange', 'Red'];
export const EMOJI = { Green: '🟢', Yellow: '🟡', Orange: '🟠', Red: '🔴' };
export const COLOR = { Green: '#22c55e', Yellow: '#eab308', Orange: '#f97316', Red: '#ef4444' };
export const PROP_LEVELS = {
  Green: { label: 'Tecnologia existente', short: 'Existente' },
  Yellow: { label: 'Fisicamente possível, tecnologia não dominada', short: 'Possível' },
  Orange: { label: 'Hipótese especulativa', short: 'Especulativa' },
  Red: { label: 'Sem mecanismo físico conhecido', short: 'Sem mecanismo' },
};
export const EXPL_LEVELS = {
  Green: { label: 'Compatível com física conhecida', short: 'Compatível' },
  Yellow: { label: 'Dados insuficientes', short: 'Dados insuficientes' },
  Orange: { label: 'Exige tecnologia extraordinária', short: 'Tecnologia extraordinária' },
  Red: { label: 'Contradiz princípios físicos conhecidos', short: 'Contradiz a física' },
};

// ---------- Destinos ----------
const dest = (name, meters, note) => ({ name, meters, note, lightYears: meters / LY, lightTimeSeconds: meters / C });
export const DEST = {
  lua: dest('Lua', 3.844e8, 'Satélite natural da Terra'),
  sol: dest('Sol', AU, '1 unidade astronômica'),
  marte: dest('Marte', 2.25e11, 'Distância média à Terra'),
  netuno: dest('Netuno', 4.35e12, 'Último planeta do Sistema Solar'),
  voyager: dest('Voyager 1 (2026)', 2.5e13, 'Sonda mais distante já lançada, ~167 UA'),
  proxima: dest('Proxima Centauri b', 4.246 * LY, 'Exoplaneta mais próximo'),
  trappist: dest('TRAPPIST-1e', 39.46 * LY, 'Exoplaneta rochoso na zona habitável'),
  centro: dest('Centro da Via Láctea', 26_000 * LY, 'Sagitário A*, buraco negro central'),
  andromeda: dest('Galáxia de Andrômeda', 2.537e6 * LY, 'Galáxia espiral mais próxima'),
};
export const MISSION_DESTS = [DEST.lua, DEST.marte, DEST.proxima, DEST.trappist];
export const SCALE_DESTS = [DEST.lua, DEST.sol, DEST.marte, DEST.netuno, DEST.voyager, DEST.proxima, DEST.trappist, DEST.centro, DEST.andromeda];

// ---------- Propulsões ----------
const prop = (name, level, beta, detail) => ({ name, level, beta, detail });
export const PROPULSIONS = [
  prop('Foguete químico', 'Green', 17_000 / C, 'Como as Voyager: ~17 km/s. Tecnologia de 1977.'),
  prop('Propulsão iônica', 'Green', 50_000 / C, 'Empuxo pequeno por anos. Estimativa otimista: ~50 km/s.'),
  prop('Vela solar', 'Green', 150_000 / C, 'Pressão da luz do Sol. Mergulho próximo ao Sol: ~150 km/s (teórico).'),
  prop('Pulsos nucleares (Orion)', 'Yellow', 0.03, 'Projeto dos anos 1960, nunca construído. ~3% de c.'),
  prop('Fusão (Daedalus)', 'Yellow', 0.12, 'Estudo de 1978. Exige fusão controlada, ainda não dominada.'),
  prop('Vela a laser (Starshot)', 'Yellow', 0.20, 'Lasers de 100 GW empurrando velas de gramas. Carga útil de toneladas é outro problema.'),
  prop('Antimatéria', 'Orange', 0.50, 'Energia máxima por massa. Produzimos nanogramas por ano.'),
  prop('Buraco de minhoca', 'Orange', null, 'A geometria é permitida pela relatividade geral, mas exige energia negativa nunca observada.'),
  prop('Mais rápido que a luz', 'Red', null, 'Nenhum mecanismo conhecido. Violaria a causalidade.'),
];

export function missionCompute(d, beta, payloadKg) {
  const v = beta * C;
  const tEarth = d.meters / v;
  const gm = gamma(beta);
  const e = kineticEnergy(payloadKg, beta);
  const dust = (kineticEnergy(1e-6, beta) / TNT_J_PER_KG) * 1000; // grão de 1 mg, em gramas de TNT
  return {
    earthTimeSeconds: tEarth, shipTimeSeconds: tEarth / gm, kineticEnergyJ: e,
    worldEnergyYears: e / WORLD_ENERGY_PER_YEAR,
    accelShipDays: properTimeToReach(beta) / DAY, accelEarthDays: coordinateTimeToReach(beta) / DAY,
    dustGrainTntGrams: dust,
  };
}

// ---------- Método de trânsito ----------
export const transitDepth = (rp, rs) => Math.pow(rp / rs, 2);
export const semiMajorAxis = (periodS, starMassKg) => Math.cbrt((GRAV * starMassKg * periodS * periodS) / (4 * Math.PI * Math.PI));
export const transitDuration = (periodS, rs, a) => (periodS * rs) / (Math.PI * a);
export function transitFlux(t, depth, durationS, ingressS) {
  const half = durationS / 2, x = Math.abs(t);
  if (x >= half) return 1;
  if (x <= half - ingressS) return 1 - depth;
  return 1 - (depth * (half - x)) / ingressS;
}

// ---------- Equação de Drake ----------
export const drakeN = (p) => p.rStar * p.fp * p.ne * p.fl * p.fi * p.fc * p.lYears;
export const DRAKE_PRESETS = {
  'Drake (1961)': { rStar: 10, fp: 0.5, ne: 2, fl: 1, fi: 0.01, fc: 0.01, lYears: 10_000 },
  'Otimista': { rStar: 3, fp: 1, ne: 0.4, fl: 1, fi: 0.5, fc: 0.5, lYears: 100_000 },
  'Pessimista': { rStar: 1, fp: 0.9, ne: 0.1, fl: 0.01, fi: 0.001, fc: 0.1, lYears: 300 },
};

// ---------- Voo balístico e custo de pairar (Monte seu OVNI 2D) ----------
export function ballistic(v0, angleDeg, h0, steps = 120) {
  const a = (angleDeg * Math.PI) / 180;
  const vx = v0 * Math.cos(a), vy = v0 * Math.sin(a);
  const t = (vy + Math.sqrt(vy * vy + 2 * G0 * h0)) / G0;
  const path = [];
  for (let i = 0; i <= steps; i++) { const ti = (t * i) / steps; path.push({ x: vx * ti, y: h0 + vy * ti - 0.5 * G0 * ti * ti }); }
  return { path, timeS: t, rangeM: vx * t, maxHeightM: vy > 0 ? h0 + (vy * vy) / (2 * G0) : h0 };
}
export function hoverPowerW(massKg, diameterM, airDensity = 1.225) {
  const thrust = massKg * G0, area = Math.PI * Math.pow(diameterM / 2, 2);
  return Math.sqrt(Math.pow(thrust, 3) / (2 * airDensity * area));
}
