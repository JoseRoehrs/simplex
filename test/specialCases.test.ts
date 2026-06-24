import { describe, expect, it } from 'vitest';
import { analyzeSpecialCases } from '../src/core/specialCases';
import { solve } from '../src/core/simplexCore';
import type { LPModel } from '../src/core/types';

describe('analyzeSpecialCases', () => {
  it('caso normal: nenhum caso especial (solução única, não-degenerada)', () => {
    const model: LPModel = {
      sense: 'max',
      objective: [3, 5],
      constraints: [
        { coeffs: [1, 0], relation: '<=', rhs: 4 },
        { coeffs: [0, 2], relation: '<=', rhs: 12 },
        { coeffs: [3, 2], relation: '<=', rhs: 18 },
      ],
    };
    const r = analyzeSpecialCases(model);
    expect(r.status).toBe('optimal');
    expect(r.anyFound).toBe(false);
    expect(r.ratioTies).toHaveLength(0);
    expect(r.degeneracies).toHaveLength(0);
    expect(r.alternativeOptima.present).toBe(false);
  });

  it('empate + degeneração + ótimos alternativos no mesmo problema', () => {
    // max x1+x2 s.a. x1<=3, x2<=3, x1+x2<=3:
    //  - objetivo paralelo a x1+x2<=3  → ótimos alternativos (z*=3)
    //  - 1º teste da razão empata (x1<=3 e x1+x2<=3, ambos 3/1) → degeneração depois
    const model: LPModel = {
      sense: 'max',
      objective: [1, 1],
      constraints: [
        { coeffs: [1, 0], relation: '<=', rhs: 3 },
        { coeffs: [0, 1], relation: '<=', rhs: 3 },
        { coeffs: [1, 1], relation: '<=', rhs: 3 },
      ],
    };
    const r = analyzeSpecialCases(model);
    expect(r.status).toBe('optimal');
    expect(solve(model).objectiveValue).toBe('3');
    expect(r.ratioTies.length).toBeGreaterThan(0);
    expect(r.degeneracies.length).toBeGreaterThan(0);
    expect(r.alternativeOptima.present).toBe(true);
    expect(r.anyFound).toBe(true);
    // a razão empatada deve ter ≥ 2 linhas
    expect(r.ratioTies[0].tiedBasics.length).toBeGreaterThanOrEqual(2);
    // alguma variável de decisão fica não-básica com custo reduzido 0 no ótimo
    expect(r.alternativeOptima.vars.length).toBeGreaterThan(0);
  });

  it('detecta ótimos alternativos sem (necessariamente) degeneração', () => {
    // max x1+2x2 s.a. x1+2x2<=8, x1<=4, x2<=3: objetivo paralelo a x1+2x2<=8 → z*=8.
    const model: LPModel = {
      sense: 'max',
      objective: [1, 2],
      constraints: [
        { coeffs: [1, 2], relation: '<=', rhs: 8 },
        { coeffs: [1, 0], relation: '<=', rhs: 4 },
        { coeffs: [0, 1], relation: '<=', rhs: 3 },
      ],
    };
    const r = analyzeSpecialCases(model);
    expect(r.status).toBe('optimal');
    expect(solve(model).objectiveValue).toBe('8');
    expect(r.alternativeOptima.present).toBe(true);
  });

  it('problema inviável: status propagado, sem ótimos alternativos', () => {
    const model: LPModel = {
      sense: 'max',
      objective: [2, 3],
      constraints: [
        { coeffs: [1, 2], relation: '<=', rhs: 4 },
        { coeffs: [3, 2], relation: '>=', rhs: 18 },
      ],
    };
    const r = analyzeSpecialCases(model);
    expect(r.status).toBe('infeasible');
    expect(r.alternativeOptima.present).toBe(false);
  });
});
