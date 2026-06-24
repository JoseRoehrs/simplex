// Detecta "casos especiais" do Simplex a partir da resolução real de um PPL:
//   • empate no teste da razão  (duas linhas com a MESMA razão mínima → causa de degeneração)
//   • degeneração               (uma variável BÁSICA vale 0 em algum quadro)
//   • ótimos alternativos        (no quadro ótimo, uma NÃO-básica tem custo reduzido 0)
//
// Tudo é lido dos quadros que `solve()` já registrou (mesma leitura que a coluna θ da
// TableauView faz) — não recalcula a matemática do método.

import { F, fracToString, isPos, type Frac } from './frac';
import { solve } from './simplexCore';
import type { LPModel, SolveStatus } from './types';

/** Empate no teste da razão em uma iteração (≥ 2 linhas com a mesma razão mínima). */
export interface RatioTie {
  iteration: number;
  phase: 1 | 2;
  entering: string;
  theta: string; // razão mínima empatada
  tiedBasics: string[]; // variáveis básicas das linhas empatadas
}

/** Quadro com uma ou mais variáveis básicas em nível 0 (vértice degenerado). */
export interface DegeneratePoint {
  iteration: number;
  phase: 1 | 2;
  zeroBasics: string[];
}

/** Ótimos alternativos: não-básicas com custo reduzido 0 no quadro ótimo. */
export interface AlternativeOptima {
  present: boolean;
  vars: string[];
}

export interface SpecialCasesReport {
  status: SolveStatus;
  ratioTies: RatioTie[];
  degeneracies: DegeneratePoint[];
  alternativeOptima: AlternativeOptima;
  anyFound: boolean;
}

export function analyzeSpecialCases(model: LPModel): SpecialCasesReport {
  const res = solve(model);
  const ratioTies: RatioTie[] = [];
  const degeneracies: DegeneratePoint[] = [];

  for (const step of res.steps) {
    const t = step.tableau;

    // --- empate no teste da razão (só em pivôs de Dantzig: custo reduzido < 0) ---
    if (step.pivotCol !== null && t.objectiveRow[step.pivotCol].startsWith('-')) {
      const col = step.pivotCol;
      const ratios: { idx: number; r: Frac }[] = [];
      let min: Frac | null = null;
      t.rows.forEach((row, i) => {
        const a = F(row[col]);
        if (!isPos(a)) return; // coef ≤ 0 não entra no teste
        const r = F(t.rhs[i]).div(a);
        ratios.push({ idx: i, r });
        if (min === null || r.compare(min) < 0) min = r;
      });
      if (min !== null) {
        const tied = ratios.filter(({ r }) => r.equals(min as Frac));
        if (tied.length >= 2) {
          ratioTies.push({
            iteration: step.iteration,
            phase: step.phase,
            entering: step.enteringVar ?? t.columns[col],
            theta: fracToString(min),
            tiedBasics: tied.map(({ idx }) => t.basis[idx]),
          });
        }
      }
    }

    // --- degeneração: alguma variável básica em nível 0 ---
    const zeroBasics: string[] = [];
    t.rhs.forEach((v, i) => {
      if (v === '0') zeroBasics.push(t.basis[i]);
    });
    if (zeroBasics.length > 0) {
      degeneracies.push({ iteration: step.iteration, phase: step.phase, zeroBasics });
    }
  }

  // --- ótimos alternativos: não-básica (não-artificial) com custo reduzido 0 no ótimo ---
  let alternativeOptima: AlternativeOptima = { present: false, vars: [] };
  if (res.status === 'optimal' && res.steps.length > 0) {
    const last = res.steps[res.steps.length - 1].tableau;
    const vars: string[] = [];
    last.columns.forEach((name, j) => {
      if (last.basis.includes(name)) return; // só não-básicas
      if (last.kinds[j] === 'artificial') return; // ignora artificiais
      if (last.objectiveRow[j] === '0') vars.push(name);
    });
    alternativeOptima = { present: vars.length > 0, vars };
  }

  const anyFound =
    ratioTies.length > 0 || degeneracies.length > 0 || alternativeOptima.present;
  return { status: res.status, ratioTies, degeneracies, alternativeOptima, anyFound };
}
