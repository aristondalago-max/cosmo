// Tabela offline de cidades e relatos de exemplo (porta de Cities.kt e Seed.kt).
export const CITIES = [
  ['Itajaí', 'SC', -26.9078, -48.6619], ['Navegantes', 'SC', -26.8989, -48.6544], ['Florianópolis', 'SC', -27.5954, -48.5480],
  ['Balneário Camboriú', 'SC', -26.9906, -48.6349], ['Camboriú', 'SC', -27.0253, -48.6539], ['Blumenau', 'SC', -26.9194, -49.0661],
  ['Joinville', 'SC', -26.3045, -48.8487], ['Brusque', 'SC', -27.0979, -48.9108], ['Penha', 'SC', -26.7699, -48.6460],
  ['Piçarras', 'SC', -26.7636, -48.6718], ['Barra Velha', 'SC', -26.6325, -48.6847], ['Tijucas', 'SC', -27.2414, -48.6336],
  ['São José', 'SC', -27.6136, -48.6366], ['Palhoça', 'SC', -27.6455, -48.6697], ['Garopaba', 'SC', -28.0275, -48.6192],
  ['Imbituba', 'SC', -28.2400, -48.6703], ['Laguna', 'SC', -28.4826, -48.7808], ['Criciúma', 'SC', -28.6775, -49.3697],
  ['Lages', 'SC', -27.8160, -50.3259], ['Chapecó', 'SC', -27.1004, -52.6152], ['Jaraguá do Sul', 'SC', -26.4851, -49.0713],
  ['Curitiba', 'PR', -25.4284, -49.2733], ['Londrina', 'PR', -23.3045, -51.1696], ['Maringá', 'PR', -23.4205, -51.9333],
  ['Foz do Iguaçu', 'PR', -25.5163, -54.5854], ['Paranaguá', 'PR', -25.5205, -48.5095], ['Porto Alegre', 'RS', -30.0346, -51.2177],
  ['Caxias do Sul', 'RS', -29.1634, -51.1797], ['Torres', 'RS', -29.3353, -49.7268], ['São Paulo', 'SP', -23.5505, -46.6333],
  ['Rio de Janeiro', 'RJ', -22.9068, -43.1729], ['Belo Horizonte', 'MG', -19.9167, -43.9345], ['Brasília', 'DF', -15.7939, -47.8828],
  ['Varginha', 'MG', -21.5556, -45.4364],
].map(([name, state, lat, lng]) => ({ name, state, lat, lng }));

const norm = (s) => s.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

/** Procura por nome tolerando acentos e maiúsculas; aceita "Itajaí SC" ou "Itajaí, SC". */
export function findCity(text) {
  const cleaned = norm(text.replace(/,/g, ' ').replace(/\s+/g, ' '));
  if (!cleaned) return null;
  return CITIES.find((c) => norm(`${c.name} ${c.state}`) === cleaned)
    || CITIES.find((c) => norm(c.name) === cleaned)
    || CITIES.find((c) => cleaned.startsWith(norm(c.name))) || null;
}
export function citySuggestions(prefix, limit = 5) {
  const p = norm(prefix);
  return p.length < 2 ? [] : CITIES.filter((c) => norm(c.name).startsWith(p)).slice(0, limit);
}

export const SHAPES = {
  Luz: 'Luz / ponto luminoso', Esfera: 'Esfera', Disco: 'Disco', Triangular: 'Objeto triangular',
  Cilindro: 'Cilindro / charuto', Multiplas: 'Várias luzes', Outro: 'Outro / sem forma definida',
};
export const WEATHERS = { Limpo: 'Céu limpo', Nublado: 'Nublado', Chuva: 'Chuva', Neblina: 'Neblina / névoa', NaoLembro: 'Não lembro' };
export const COMPANY = { Sozinho: 'Sozinho', Acompanhado: 'Acompanhado' };
export const shortShape = (k) => SHAPES[k].split(' /')[0];

const at = (y, mo, d, h, mi) => new Date(y, mo - 1, d, h, mi, 0, 0).getTime();
function ex(id, city, y, mo, d, h, mi, dur, desc, shape, weather, company, cls = null, note = '') {
  const c = findCity(city);
  return {
    id: 'ex-' + id, createdAt: at(y, mo, d, h, mi) + 3_600_000, city: c ? c.name : city, state: c ? c.state : '',
    lat: c ? c.lat : null, lng: c ? c.lng : null, sightingAt: at(y, mo, d, h, mi), durationText: dur, description: desc,
    shape, weather, company, media: [], nickname: '', isExample: true, classification: cls, classificationNote: note,
  };
}

// Exemplos fictícios, sempre marcados como "exemplo". Rótulos no vocabulário de EXPLICAÇÕES.
export const SEED = [
  ex('001', 'Itajaí', 2026, 10, 14, 23, 7, '45 segundos', 'Luz branca fazendo zigue-zague sobre o mar, sem som. Mudou de direção duas vezes em ângulo fechado e sumiu de repente.', 'Luz', 'Limpo', 'Acompanhado'),
  ex('002', 'Navegantes', 2026, 10, 12, 20, 30, 'cerca de 2 horas', 'Luz branca parada no céu, a oeste, bem acima do horizonte. Ficou no mesmo lugar por mais de uma hora e foi baixando devagar.', 'Luz', 'Limpo', 'Sozinho', 'Green', 'Posição, brilho e movimento lento a oeste são compatíveis com Vênus, que estava visível ao anoitecer nessa data.'),
  ex('003', 'Florianópolis', 2026, 9, 28, 19, 15, '3 minutos', 'Fila de 20 a 30 pontos de luz em linha reta, todos na mesma velocidade, cruzando o céu de sudoeste para nordeste.', 'Multiplas', 'Limpo', 'Acompanhado', 'Green', 'Padrão típico de um "trem" de satélites Starlink nos dias após um lançamento.'),
  ex('004', 'Balneário Camboriú', 2026, 8, 3, 21, 40, '10 minutos', 'Objeto laranja subindo devagar, oscilando, depois apagou. Vento fraco. Outras pessoas na praia também viram.', 'Esfera', 'Nublado', 'Acompanhado', 'Green', 'Balão de festa com chama (lanterna chinesa): sobe devagar, oscila com o vento e apaga quando a chama acaba.'),
  ex('005', 'Blumenau', 2026, 7, 19, 4, 50, 'menos de 5 segundos', 'Risco verde muito rápido cruzando o céu inteiro, com rastro que durou um segundo.', 'Luz', 'Limpo', 'Sozinho', 'Green', 'Meteoro (bólido). A cor verde vem do magnésio ou níquel se vaporizando.'),
  ex('006', 'Joinville', 2026, 6, 11, 22, 5, '1 minuto', 'Três luzes em triângulo, bem definidas, sem piscar, passando em silêncio total e devagar demais para ser avião.', 'Triangular', 'Limpo', 'Acompanhado', 'Yellow', 'Precisaria de vídeo com referência no chão e dados de tráfego aéreo (FlightRadar) no horário. Sem isso: dados insuficientes.'),
  ex('007', 'Penha', 2026, 5, 2, 18, 20, '30 segundos', 'Objeto metálico em forma de disco refletindo o sol, parado, depois acelerou e sumiu em direção ao mar.', 'Disco', 'Limpo', 'Sozinho', 'Yellow', 'Distância e tamanho não são conhecidos, então velocidade não pode ser estimada. Dados insuficientes.'),
  ex('008', 'Curitiba', 2026, 3, 15, 2, 10, '20 minutos', 'Luz pulsante mudando de cor (vermelho, azul, branco) perto do horizonte leste, tremendo.', 'Luz', 'Limpo', 'Sozinho', 'Green', 'Estrela brilhante baixa no horizonte (Sirius) vista através de turbulência atmosférica, que cintila e muda de cor.'),
  ex('009', 'Itajaí', 2026, 2, 8, 23, 55, '15 segundos', 'Clarão branco que iluminou as nuvens por dentro, sem trovão, duas vezes seguidas.', 'Outro', 'Nublado', 'Acompanhado'),
  ex('010', 'Garopaba', 2025, 12, 20, 21, 0, '2 minutos', 'Esfera laranja brilhante subindo em espiral sobre o mar, com fumaça fina.', 'Esfera', 'Limpo', 'Acompanhado', 'Green', 'Sinalizador marítimo ou fogo de artifício lançado de barco; a espiral e a fumaça são típicas.'),
  ex('011', 'Navegantes', 2025, 11, 5, 6, 30, '5 minutos', 'Objeto cinza cilíndrico, sem asas, voando baixo e reto sobre o rio, sem barulho perceptível.', 'Cilindro', 'Neblina', 'Sozinho', 'Yellow', 'A 2 km do aeroporto. Pode ser avião visto de lado com neblina escondendo as asas; precisa do horário exato para cruzar com os pousos.'),
  ex('012', 'Florianópolis', 2025, 10, 31, 22, 15, '40 segundos', 'Várias luzes brancas em formação de V, muito altas, silenciosas, se movendo juntas.', 'Multiplas', 'Limpo', 'Acompanhado'),
];
