// Catálogo de problemas FIXOS do curso, organizados por semana.
// Portados do app legado (simplex-duas-fases/js/problems.js) para o motor em TS.
// Usados tanto como exemplos quanto na aba Workflow (árvore de decisão).

import type { LPModel } from './types';

export type Week = 7 | 8 | 9 | 10;

export interface CatalogProblem {
  id: string;
  week: Week;
  /** Rótulo curto exibido no seletor (ex.: "(a) MOREIRA"). */
  label: string;
  /** Fonte/autor do enunciado (ex.: "SILVA"). */
  source: string;
  /** Explicação didática do que esse problema exercita. */
  note: string;
  model: LPModel;
}

export const PROBLEMS: CatalogProblem[] = [
  {
    id: 's7',
    week: 7,
    label: 'ANDRADE (adaptado)',
    source: 'ANDRADE',
    note:
      'Maximização com duas restrições "=" (cada uma gera uma artificial) e uma "≤" (folga). ' +
      'As igualdades obrigam a Fase 1; note o coeficiente negativo (−3x₂) no objetivo.',
    model: {
      sense: 'max',
      objective: [2, -3, 5],
      constraints: [
        { coeffs: [2, -1, 3], relation: '=', rhs: 12 },
        { coeffs: [1, 2, 0], relation: '=', rhs: 6 },
        { coeffs: [3, -1, 2], relation: '<=', rhs: 7 },
      ],
    },
  },
  {
    id: 's8a',
    week: 8,
    label: '(a) MOREIRA',
    source: 'MOREIRA',
    note:
      'Maximização com uma restrição "≥" (excesso + artificial) e uma "=" (artificial). ' +
      'As duas exigem a Fase 1.',
    model: {
      sense: 'max',
      objective: [2, 7],
      constraints: [
        { coeffs: [3, 2], relation: '>=', rhs: 20 },
        { coeffs: [4, 4], relation: '=', rhs: 32 },
      ],
    },
  },
  {
    id: 's8b',
    week: 8,
    label: '(b) SILVA',
    source: 'SILVA',
    note:
      'Mistura os três tipos de restrição: "≤" (folga), "≥" (excesso + artificial) e "=" (artificial). ' +
      'Caso completo das duas fases.',
    model: {
      sense: 'max',
      objective: [1, 1, 1],
      constraints: [
        { coeffs: [2, 1, -1], relation: '<=', rhs: 10 },
        { coeffs: [1, 1, 2], relation: '>=', rhs: 20 },
        { coeffs: [2, 1, 3], relation: '=', rhs: 60 },
      ],
    },
  },
  {
    id: 's9',
    week: 9,
    label: '(a) SILVA',
    source: 'SILVA',
    note:
      'Minimização com duas restrições "≥": ambas geram excesso + artificial, ' +
      'então as duas fases são obrigatórias.',
    model: {
      sense: 'min',
      objective: [3, 2],
      constraints: [
        { coeffs: [2, 1], relation: '>=', rhs: 10 },
        { coeffs: [1, 5], relation: '>=', rhs: 15 },
      ],
    },
  },
  {
    id: 's10a',
    week: 10,
    label: '(a) SILVA',
    source: 'SILVA',
    note:
      'Maximização com duas restrições "≥" e nenhum teto: as artificiais entram em ação… ' +
      'e há uma surpresa no final — o objetivo cresce sem limite (ILIMITADO).',
    model: {
      sense: 'max',
      objective: [1, 2, 1],
      constraints: [
        { coeffs: [2, 3, 1], relation: '>=', rhs: 10 },
        { coeffs: [4, 1, 2], relation: '>=', rhs: 20 },
      ],
    },
  },
  {
    id: 's10b',
    week: 10,
    label: '(b) SILVA',
    source: 'SILVA',
    note:
      'Minimização com uma restrição "≤" (folga) e uma "≥" (excesso + artificial). ' +
      'Mistura os dois mundos e tem ótimo finito.',
    model: {
      sense: 'min',
      objective: [2, 4, 10],
      constraints: [
        { coeffs: [1, 1, 1], relation: '<=', rhs: 120 },
        { coeffs: [1, 2, 5], relation: '>=', rhs: 30 },
      ],
    },
  },
  {
    id: 's10c',
    week: 10,
    label: 'Inviável (ilustrativo)',
    source: 'ILUSTRATIVO',
    note:
      'Caso-limite ILUSTRATIVO (não saiu do enunciado), para fechar o trio de desfechos. ' +
      'A "≥" obriga a Fase 1, mas é impossível zerar a artificial: o teto x₁ + 2x₂ ≤ 4 ' +
      'deixa 3x₁ + 2x₂ no máximo 12, longe do mínimo 18 exigido. A Fase 1 para com ' +
      'W = 6 > 0 → INVIÁVEL (região factível vazia). É o único problema que acende a ' +
      'ramificação "W > 0" da árvore de decisão.',
    model: {
      sense: 'max',
      objective: [2, 3],
      constraints: [
        { coeffs: [1, 2], relation: '<=', rhs: 4 },
        { coeffs: [3, 2], relation: '>=', rhs: 18 },
      ],
    },
  },
];

export const WEEKS: Week[] = [7, 8, 9, 10];

export function problemsOfWeek(week: Week): CatalogProblem[] {
  return PROBLEMS.filter((p) => p.week === week);
}
