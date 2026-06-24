// Árvore de decisão do Simplex Duas Fases como um GRAFO fixo (estilo n8n).
// Cada nó traz uma explicação didática; cada "caso" (≤ / ≥ / =, precisa Fase 1?,
// W = 0?, condição de parada) é uma RAMIFICAÇÃO. Dado um problema, traceProblem()
// roda o motor e devolve quais nós/arestas o problema percorreu, com anotações
// numéricas reais por nó.

import type { LPModel, Relation, SimplexResult, SolveStatus } from './types';
import { solve } from './simplexCore';

export type NodeKind =
  | 'io'
  | 'switch'
  | 'case'
  | 'process'
  | 'decision'
  | 'end-good'
  | 'end-bad';

export interface FlowNode {
  id: string;
  title: string;
  /** Explicação genérica (sempre visível). */
  body: string;
  kind: NodeKind;
  icon: string;
  /** Canto superior-esquerdo no canvas. */
  x: number;
  y: number;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export const NODE_W = 214;
export const NODE_H = 116;

const TOP = 40;
const MID = 300;
const BOT = 560;

// Colunas (x do canto esquerdo de cada nó).
const C = {
  start: 24,
  classify: 290,
  cases: 556,
  needP1: 822,
  phase1: 1088,
  p1check: 1354,
  end1: 1620, // INVIÁVEL (topo) / Fase 2 (meio)
  simplex: 1886,
  result: 2152,
  end2: 2418, // ÓTIMO (meio) / ILIMITADO (baixo)
};

export const CANVAS_W = C.end2 + NODE_W + 40;
export const CANVAS_H = BOT + NODE_H + 40;

export const FLOW_NODES: FlowNode[] = [
  {
    id: 'start',
    title: 'Problema de PL',
    body: 'Função objetivo (max/min) e restrições na forma "livro-texto".',
    kind: 'io',
    icon: '📥',
    x: C.start,
    y: MID,
  },
  {
    id: 'classify',
    title: 'Forma padrão',
    body: 'Classifica cada restrição e adiciona folga, excesso e/ou artificial.',
    kind: 'switch',
    icon: '🔀',
    x: C.classify,
    y: MID,
  },
  {
    id: 'caseLE',
    title: 'Restrição  ≤',
    body: 'Adiciona folga sᵢ (≥ 0). A folga já entra como variável básica.',
    kind: 'case',
    icon: '➕',
    x: C.cases,
    y: TOP,
  },
  {
    id: 'caseGE',
    title: 'Restrição  ≥',
    body: 'Subtrai excesso eᵢ e adiciona artificial aᵢ (entra na base).',
    kind: 'case',
    icon: '➖',
    x: C.cases,
    y: MID,
  },
  {
    id: 'caseEQ',
    title: 'Restrição  =',
    body: 'Adiciona artificial aᵢ (entra na base). Sem folga nem excesso.',
    kind: 'case',
    icon: '🟰',
    x: C.cases,
    y: BOT,
  },
  {
    id: 'needP1',
    title: 'Há artificiais?',
    body: 'Se alguma restrição é "≥" ou "=", há artificiais → precisa da Fase 1.',
    kind: 'decision',
    icon: '❓',
    x: C.needP1,
    y: MID,
  },
  {
    id: 'phase1',
    title: 'Fase 1',
    body: 'Minimiza W = Σ aᵢ (soma das artificiais) para achar uma base factível.',
    kind: 'process',
    icon: '1️⃣',
    x: C.phase1,
    y: TOP,
  },
  {
    id: 'p1check',
    title: 'Fase 1: W = 0?',
    body: 'No fim da Fase 1, a soma das artificiais decide se a região é factível.',
    kind: 'decision',
    icon: '⚖️',
    x: C.p1check,
    y: TOP,
  },
  {
    id: 'infeasible',
    title: 'INVIÁVEL',
    body: 'W > 0: nenhuma solução satisfaz todas as restrições (região vazia).',
    kind: 'end-bad',
    icon: '🚫',
    x: C.end1,
    y: TOP,
  },
  {
    id: 'phase2',
    title: 'Fase 2',
    body: 'Usa o objetivo original; as artificiais ficam proibidas de reentrar.',
    kind: 'process',
    icon: '2️⃣',
    x: C.end1,
    y: MID,
  },
  {
    id: 'simplex',
    title: 'Iterações do Simplex',
    body: 'Entra a coluna de custo reduzido < 0; sai pela menor razão (teste da razão).',
    kind: 'process',
    icon: '🔁',
    x: C.simplex,
    y: MID,
  },
  {
    id: 'result',
    title: 'Condição de parada',
    body: 'Para quando não há custo reduzido < 0 (ótimo) ou não há razão positiva (ilimitado).',
    kind: 'decision',
    icon: '🛑',
    x: C.result,
    y: MID,
  },
  {
    id: 'optimal',
    title: 'ÓTIMO',
    body: 'Todos os custos reduzidos ≥ 0: a solução básica atual é ótima.',
    kind: 'end-good',
    icon: '⭐',
    x: C.end2,
    y: MID,
  },
  {
    id: 'unbounded',
    title: 'ILIMITADO',
    body: 'Uma coluna pode crescer sem limite: o objetivo vai a ±∞.',
    kind: 'end-bad',
    icon: '♾️',
    x: C.end2,
    y: BOT,
  },
];

export const FLOW_EDGES: FlowEdge[] = [
  { id: 'e_start_classify', from: 'start', to: 'classify' },
  { id: 'e_classify_le', from: 'classify', to: 'caseLE', label: '≤' },
  { id: 'e_classify_ge', from: 'classify', to: 'caseGE', label: '≥' },
  { id: 'e_classify_eq', from: 'classify', to: 'caseEQ', label: '=' },
  { id: 'e_le_need', from: 'caseLE', to: 'needP1' },
  { id: 'e_ge_need', from: 'caseGE', to: 'needP1' },
  { id: 'e_eq_need', from: 'caseEQ', to: 'needP1' },
  { id: 'e_need_p1', from: 'needP1', to: 'phase1', label: 'Sim (tem artificial)' },
  { id: 'e_need_p2', from: 'needP1', to: 'phase2', label: 'Não (só folgas)' },
  { id: 'e_p1_check', from: 'phase1', to: 'p1check' },
  { id: 'e_check_infeasible', from: 'p1check', to: 'infeasible', label: 'W > 0' },
  { id: 'e_check_p2', from: 'p1check', to: 'phase2', label: 'W = 0' },
  { id: 'e_p2_simplex', from: 'phase2', to: 'simplex' },
  { id: 'e_simplex_result', from: 'simplex', to: 'result' },
  { id: 'e_result_optimal', from: 'result', to: 'optimal', label: 'custos red. ≥ 0' },
  { id: 'e_result_unbounded', from: 'result', to: 'unbounded', label: 'sem razão +' },
];

export interface FlowTrace {
  result: SimplexResult;
  status: SolveStatus;
  activeNodes: Set<string>;
  activeEdges: Set<string>;
  /** Texto numérico real por nó, mostrado quando um problema é resolvido. */
  annotations: Record<string, string>;
}

/** Converte dígitos em subscritos unicode (x1 → x₁). */
export function sub(name: string): string {
  const map: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  };
  return name.replace(/\d/g, (d) => map[d] ?? d);
}

/** Relação efetiva após normalizar RHS ≥ 0 (espelha buildStandardForm). */
function normalizedRelations(model: LPModel): Relation[] {
  return model.constraints.map((c) => {
    if (c.rhs < 0) {
      return c.relation === '<=' ? '>=' : c.relation === '>=' ? '<=' : '=';
    }
    return c.relation;
  });
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Roda o motor e devolve o caminho percorrido na árvore de decisão. */
export function traceProblem(model: LPModel): FlowTrace {
  const result = solve(model);
  const rels = normalizedRelations(model);
  const nLE = rels.filter((r) => r === '<=').length;
  const nGE = rels.filter((r) => r === '>=').length;
  const nEQ = rels.filter((r) => r === '=').length;
  const nArtificial = nGE + nEQ;
  const twoPhase = result.method === 'two-phase';

  const nodes = new Set<string>(['start', 'classify', 'needP1']);
  const edges = new Set<string>(['e_start_classify', 'e_le_need', 'e_ge_need', 'e_eq_need']);
  // remove as arestas de caso que não existem neste problema (ajuste abaixo).
  edges.delete('e_le_need');
  edges.delete('e_ge_need');
  edges.delete('e_eq_need');

  if (nLE > 0) {
    nodes.add('caseLE');
    edges.add('e_classify_le');
    edges.add('e_le_need');
  }
  if (nGE > 0) {
    nodes.add('caseGE');
    edges.add('e_classify_ge');
    edges.add('e_ge_need');
  }
  if (nEQ > 0) {
    nodes.add('caseEQ');
    edges.add('e_classify_eq');
    edges.add('e_eq_need');
  }

  const annotations: Record<string, string> = {};
  const parts: string[] = [];
  if (nLE) parts.push(`${nLE}×≤`);
  if (nGE) parts.push(`${nGE}×≥`);
  if (nEQ) parts.push(`${nEQ}×=`);
  annotations.start = `${model.sense === 'max' ? 'Maximizar' : 'Minimizar'} · ${plural(
    model.objective.length,
    'variável',
    'variáveis',
  )} · ${plural(model.constraints.length, 'restrição', 'restrições')}`;
  annotations.classify = parts.join('  ·  ');
  if (nLE) annotations.caseLE = plural(nLE, 'folga', 'folgas');
  if (nGE) annotations.caseGE = `${plural(nGE, 'excesso', 'excessos')} + ${plural(nGE, 'artificial', 'artificiais')}`;
  if (nEQ) annotations.caseEQ = plural(nEQ, 'artificial', 'artificiais');

  const p1Pivots = result.steps.filter((s) => s.phase === 1 && s.pivotCol !== null).length;
  const p2Pivots = result.steps.filter((s) => s.phase === 2 && s.pivotCol !== null).length;

  if (twoPhase) {
    nodes.add('phase1');
    nodes.add('p1check');
    edges.add('e_need_p1');
    edges.add('e_p1_check');
    annotations.needP1 = `Sim — ${plural(nArtificial, 'artificial', 'artificiais')} → Fase 1`;
    annotations.phase1 = `min W = Σaᵢ · ${plural(p1Pivots, 'pivô', 'pivôs')}`;

    if (result.status === 'infeasible') {
      nodes.add('infeasible');
      edges.add('e_check_infeasible');
      annotations.p1check = 'W ≠ 0 → região vazia';
      annotations.infeasible = 'Sem solução factível';
      return { result, status: result.status, activeNodes: nodes, activeEdges: edges, annotations };
    }

    nodes.add('phase2');
    edges.add('e_check_p2');
    annotations.p1check = 'W = 0 → factível ✓';
  } else {
    nodes.add('phase2');
    edges.add('e_need_p2');
    annotations.needP1 = 'Não — base inicial pronta (só folgas)';
  }

  // Caminho comum da Fase 2 em diante.
  nodes.add('simplex');
  nodes.add('result');
  edges.add('e_p2_simplex');
  edges.add('e_simplex_result');
  annotations.phase2 = `objetivo original · ${plural(p2Pivots, 'pivô', 'pivôs')}`;
  annotations.simplex = `${plural(p1Pivots + p2Pivots, 'pivô', 'pivôs')} no total`;

  if (result.status === 'unbounded') {
    nodes.add('unbounded');
    edges.add('e_result_unbounded');
    annotations.result = 'Coluna sem razão positiva';
    annotations.unbounded = model.sense === 'max' ? 'z → +∞' : 'z → −∞';
  } else {
    nodes.add('optimal');
    edges.add('e_result_optimal');
    annotations.result = 'Custos reduzidos ≥ 0';
    const vars = Object.entries(result.solution)
      .map(([k, v]) => `${sub(k)}=${v}`)
      .join('  ');
    annotations.optimal = `z* = ${result.objectiveValue}` + (vars ? `\n${vars}` : '');
  }

  return { result, status: result.status, activeNodes: nodes, activeEdges: edges, annotations };
}
