// Os 5 módulos do COSMO, na ordem do Menu Principal. Hubs, Explorar e roteamento nascem daqui.
const f = (id, title, summary) => ({ id, title, summary });

export const MODULES = [
  { id: 'ciencia', title: 'Ciência', subtitle: 'Drake · Fermi · Trânsito', icon: 'ciencia', features: [
    f('drake', 'Equação de Drake', 'Quantas civilizações poderiam existir? Toque em cada variável.'),
    f('fermi', 'Paradoxo de Fermi', 'Se o universo é tão grande, onde está todo mundo? Cinco hipóteses.'),
    f('transito', 'Método de Trânsito', 'Como descobrimos exoplanetas: a curva de luz de LHS 475 b.'),
  ] },
  { id: 'fisica', title: 'Física', subtitle: 'Laboratório · Missão · Detector · Escala', icon: 'fisica', features: [
    f('laboratorio', 'Laboratório relativístico', 'Massa, velocidade e a energia E = (γ−1)mc².'),
    f('missao', 'Planejador de Missão', 'Terra → TRAPPIST-1e: tempo, energia e o que a física permite.'),
    f('detector', 'Detector de Impossibilidades', 'a = v²/r: quantos g uma curva exige?'),
    f('escala', 'Escala do Universo', 'Terra, Lua, Marte, Proxima Centauri, Via Láctea.'),
    f('ovni2d', 'Monte seu OVNI', 'Simulação 2D de trajetória com velocidade, altitude e inclinação.'),
  ] },
  { id: 'investigacao', title: 'Investigação OVNI', subtitle: 'Investigador · Árvore · Professor', icon: 'investigacao', features: [
    f('investigador', 'Investigador científico', 'Receba um relato, peça dados, formule hipóteses.'),
    f('arvore', 'Árvore de Explicações', 'Perguntas que levam a um dos quatro rótulos físicos.'),
    f('professor', 'Modo Professor', 'Roteiro de aula de 50 minutos.'),
  ] },
  { id: 'comunidade', title: 'Comunidade', subtitle: 'Relatos · Mapa · Estatísticas · Galeria', icon: 'groups', features: [
    f('relatos', 'Relatos', 'Avistamentos registrados, com busca e filtros.'),
    f('enviar', 'Envie seu relato', 'Local, data, duração, o que viu, foto ou vídeo.'),
    f('mapa', 'Mapa dos avistamentos', 'Onde os relatos aconteceram.'),
    f('estatisticas', 'Estatísticas', 'Quantos relatos, onde, quando e em que formato.'),
    f('galeria', 'Galeria', 'Fotos e vídeos enviados. Um registro não prova origem extraterrestre.'),
  ] },
  { id: 'filosofia', title: 'Filosofia', subtitle: 'A CAIXA — jornada em 5 atos', icon: 'caixa', features: [
    f('caixa', 'A CAIXA', 'Há algo aqui dentro. Recebemos um relato.'),
  ] },
];

// Ícone de cada funcionalidade = o próprio id (ver ICONS em util.js).
export const moduleById = (id) => MODULES.find((m) => m.id === id);
export const featureById = (mid, fid) => moduleById(mid)?.features.find((x) => x.id === fid);
