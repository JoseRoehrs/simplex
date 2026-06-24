import { describe, expect, it } from 'vitest';
import { buildPivotQuestions } from '../src/core/pivotQuiz';
import { F } from '../src/core/frac';
import type { LPModel } from '../src/core/types';

/** Converte a string de fração do quadro ("-2/3", "-5", "0") em número. */
function rcNum(s: string): number {
  const i = s.indexOf('/');
  return i === -1 ? Number(s) : Number(s.slice(0, i)) / Number(s.slice(i + 1));
}

describe('buildPivotQuestions — preveja o próximo pivô', () => {
  const classic: LPModel = {
    sense: 'max',
    objective: [3, 5],
    constraints: [
      { coeffs: [1, 0], relation: '<=', rhs: 4 },
      { coeffs: [0, 2], relation: '<=', rhs: 12 },
      { coeffs: [3, 2], relation: '<=', rhs: 18 },
    ],
    varNames: ['x1', 'x2'],
  };

  it('extrai os pivôs do clássico: 1º entra x2, sai s2', () => {
    const qs = buildPivotQuestions(classic);
    expect(qs.length).toBeGreaterThanOrEqual(2);
    const q0 = qs[0];
    expect(q0.entering).toBe('x2'); // custo reduzido -5 (mais negativo que x1 = -3)
    expect(q0.leaving).toBe('s2'); // menor razão: 12/2 = 6 < 18/2 = 9
    // o gabarito está entre as opções oferecidas
    expect(q0.enteringOptions).toContain('x2');
    expect(q0.leavingOptions).toContain('s2');
  });

  it('a variável que entra tem SEMPRE o custo reduzido mais negativo (Dantzig)', () => {
    const qs = buildPivotQuestions(classic);
    for (const q of qs) {
      const cols = q.tableau.columns;
      const entIdx = cols.indexOf(q.entering);
      const entRC = rcNum(q.tableau.objectiveRow[entIdx]);
      expect(entRC).toBeLessThan(0); // é um pivô de Dantzig
      for (const opt of q.enteringOptions) {
        const rc = rcNum(q.tableau.objectiveRow[cols.indexOf(opt)]);
        expect(entRC).toBeLessThanOrEqual(rc); // nenhuma opção é mais negativa
      }
    }
  });

  it('entrante é não-básica e a que sai é básica, em todo pivô', () => {
    const qs = buildPivotQuestions(classic);
    for (const q of qs) {
      expect(q.tableau.basis).not.toContain(q.entering);
      expect(q.tableau.basis).toContain(q.leaving);
      expect(q.enteringOptions).toContain(q.entering);
      expect(q.leavingOptions).toContain(q.leaving);
    }
  });

  it('a que sai respeita o teste da razão mínima (b ÷ coluna, coef > 0)', () => {
    const qs = buildPivotQuestions(classic);
    for (const q of qs) {
      const col = q.enteringCol;
      // razão da linha que realmente saiu
      const leaveRow = q.tableau.basis.indexOf(q.leaving);
      const leaveRatio = F(q.tableau.rhs[leaveRow]).div(F(q.tableau.rows[leaveRow][col]));
      // nenhuma outra linha com coef > 0 tem razão estritamente menor
      q.tableau.rows.forEach((row, i) => {
        const a = F(row[col]);
        if (a.compare(0) <= 0) return; // coef ≤ 0 não entra no teste
        const ratio = F(q.tableau.rhs[i]).div(a);
        expect(leaveRatio.compare(ratio)).toBeLessThanOrEqual(0);
      });
    }
  });

  it('inclui pivôs de Fase 1 e Fase 2 em um problema de duas fases', () => {
    const twoPhase: LPModel = {
      sense: 'min',
      objective: [2, 3],
      constraints: [
        { coeffs: [1, 1], relation: '>=', rhs: 4 },
        { coeffs: [2, 1], relation: '>=', rhs: 5 },
      ],
    };
    const qs = buildPivotQuestions(twoPhase);
    expect(qs.length).toBeGreaterThan(0);
    // todo pivô listado é de Dantzig (custo reduzido < 0)
    for (const q of qs) {
      expect(q.tableau.objectiveRow[q.enteringCol].startsWith('-')).toBe(true);
    }
  });
});
