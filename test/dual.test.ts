import { describe, expect, it } from 'vitest';
import { solve } from '../src/core/simplexCore';
import { solveAndValidate } from '../src/solvers/validate';
import {
  buildDual,
  complementarySlackness,
  recoverDualValues,
} from '../src/core/dual';
import type { LPModel } from '../src/core/types';

// ---------------------------------------------------------------------------
// Estrutura do dual (regras de transposição) para um primal max com tudo "<=".
// ---------------------------------------------------------------------------

describe('buildDual — estrutura', () => {
  // max 3x1 + 5x2 s.a. x1<=4, 2x2<=12, 3x1+2x2<=18.
  const primal: LPModel = {
    sense: 'max',
    objective: [3, 5],
    constraints: [
      { coeffs: [1, 0], relation: '<=', rhs: 4 },
      { coeffs: [0, 2], relation: '<=', rhs: 12 },
      { coeffs: [3, 2], relation: '<=', rhs: 18 },
    ],
    varNames: ['x1', 'x2'],
  };

  it('max com restrições <= gera dual min com variáveis >= 0 e restrições >=', () => {
    const d = buildDual(primal);
    expect(d.dualSense).toBe('min');
    expect(d.vars.map((v) => v.sign)).toEqual(['>=0', '>=0', '>=0']);
    // objetivo dual usa os RHS do primal (b)
    expect(d.vars.map((v) => v.objCoeff)).toEqual([4, 12, 18]);
    // 3 restrições -> 3 variáveis duais; 2 variáveis -> 2 restrições duais
    expect(d.vars).toHaveLength(3);
    expect(d.constraints).toHaveLength(2);
    // restrição dual da var x1: y1 + 3y3 >= 3  (transposta da coluna 1 de A)
    expect(d.constraints[0]).toMatchObject({ coeffs: [1, 0, 3], relation: '>=', rhs: 3 });
    // restrição dual da var x2: 2y2 + 2y3 >= 5
    expect(d.constraints[1]).toMatchObject({ coeffs: [0, 2, 2], relation: '>=', rhs: 5 });
  });

  it('restrições mistas geram sinais corretos das variáveis duais', () => {
    // max com <=, >= e <=  →  y1>=0, y2<=0, y3>=0
    const m: LPModel = {
      sense: 'max',
      objective: [4, 3],
      constraints: [
        { coeffs: [2, 3], relation: '<=', rhs: 12 },
        { coeffs: [1, 1], relation: '>=', rhs: 2 },
        { coeffs: [1, 0], relation: '<=', rhs: 5 },
      ],
    };
    expect(buildDual(m).vars.map((v) => v.sign)).toEqual(['>=0', '<=0', '>=0']);
  });

  it('igualdade gera variável dual livre', () => {
    const m: LPModel = {
      sense: 'max',
      objective: [2, 1],
      constraints: [
        { coeffs: [1, 1], relation: '=', rhs: 4 },
        { coeffs: [1, 0], relation: '<=', rhs: 3 },
      ],
    };
    expect(buildDual(m).vars.map((v) => v.sign)).toEqual(['free', '>=0']);
  });
});

// ---------------------------------------------------------------------------
// Dualidade forte: o ótimo do primal é igual ao ótimo do dual (resolvível).
// ---------------------------------------------------------------------------

describe('Dualidade forte (z* primal = z* dual)', () => {
  const battery: { name: string; model: LPModel }[] = [
    {
      name: 'max fase única',
      model: {
        sense: 'max',
        objective: [3, 5],
        constraints: [
          { coeffs: [1, 0], relation: '<=', rhs: 4 },
          { coeffs: [0, 2], relation: '<=', rhs: 12 },
          { coeffs: [3, 2], relation: '<=', rhs: 18 },
        ],
      },
    },
    {
      name: 'min duas fases',
      model: {
        sense: 'min',
        objective: [2, 3],
        constraints: [
          { coeffs: [1, 1], relation: '>=', rhs: 4 },
          { coeffs: [2, 1], relation: '>=', rhs: 5 },
        ],
      },
    },
    {
      name: 'igualdade (var dual livre)',
      model: {
        sense: 'max',
        objective: [2, 1],
        constraints: [
          { coeffs: [1, 1], relation: '=', rhs: 4 },
          { coeffs: [1, 0], relation: '<=', rhs: 3 },
        ],
      },
    },
    {
      name: 'misto >= e <= (var dual <= 0)',
      model: {
        sense: 'max',
        objective: [4, 3],
        constraints: [
          { coeffs: [2, 3], relation: '<=', rhs: 12 },
          { coeffs: [1, 1], relation: '>=', rhs: 2 },
          { coeffs: [1, 0], relation: '<=', rhs: 5 },
        ],
      },
    },
  ];

  for (const { name, model } of battery) {
    it(`vale para: ${name}`, async () => {
      const dual = buildDual(model);
      const primalRes = solve(model);
      const dualRes = solve(dual.solvable);

      expect(primalRes.status).toBe('optimal');
      expect(dualRes.status).toBe('optimal');
      // teorema da dualidade forte
      expect(dualRes.numericObjective).toBeCloseTo(primalRes.numericObjective!, 9);

      // o dual resolvível também é um PPL válido: o GLPK concorda com o motor.
      const report = await solveAndValidate(dual.solvable);
      expect(report.agrees, report.detail).toBe(true);
    });
  }

  it('recupera os preços-sombra corretos (exemplo clássico: y = 0, 3/2, 1)', () => {
    const model: LPModel = {
      sense: 'max',
      objective: [3, 5],
      constraints: [
        { coeffs: [1, 0], relation: '<=', rhs: 4 },
        { coeffs: [0, 2], relation: '<=', rhs: 12 },
        { coeffs: [3, 2], relation: '<=', rhs: 18 },
      ],
    };
    const dual = buildDual(model);
    const dualRes = solve(dual.solvable);
    const shadow = recoverDualValues(dual, dualRes.solution);
    expect(shadow).toEqual({ y1: '0', y2: '3/2', y3: '1' });
    // conferência: Σ b_i y_i = 4·0 + 12·(3/2) + 18·1 = 36 = z* do primal
    expect(dualRes.objectiveValue).toBe('36');
  });

  it('preço-sombra de variável dual livre pode ser negativo', () => {
    // max 2x1 + x2 s.a. x1+x2=4, x1<=3  → z*=7, y1 livre = 1, y2 = 1.
    const model: LPModel = {
      sense: 'max',
      objective: [2, 1],
      constraints: [
        { coeffs: [1, 1], relation: '=', rhs: 4 },
        { coeffs: [1, 0], relation: '<=', rhs: 3 },
      ],
    };
    const dual = buildDual(model);
    const dualRes = solve(dual.solvable);
    const shadow = recoverDualValues(dual, dualRes.solution);
    expect(dualRes.objectiveValue).toBe('7');
    // 4·y1 + 3·y2 = 7  com a restrição dual y1+y2>=2, y1>=1
    expect(Number(evalFrac(shadow.y1)) * 4 + Number(evalFrac(shadow.y2)) * 3).toBeCloseTo(7, 9);
  });
});

// ---------------------------------------------------------------------------
// Folga complementar: no ótimo, todo produto par primal-dual é zero.
// ---------------------------------------------------------------------------

describe('Folga complementar (complementary slackness)', () => {
  const battery: LPModel[] = [
    {
      sense: 'max',
      objective: [3, 5],
      constraints: [
        { coeffs: [1, 0], relation: '<=', rhs: 4 },
        { coeffs: [0, 2], relation: '<=', rhs: 12 },
        { coeffs: [3, 2], relation: '<=', rhs: 18 },
      ],
    },
    {
      sense: 'min',
      objective: [2, 3],
      constraints: [
        { coeffs: [1, 1], relation: '>=', rhs: 4 },
        { coeffs: [2, 1], relation: '>=', rhs: 5 },
      ],
    },
    {
      sense: 'max',
      objective: [4, 3],
      constraints: [
        { coeffs: [2, 3], relation: '<=', rhs: 12 },
        { coeffs: [1, 1], relation: '>=', rhs: 2 },
        { coeffs: [1, 0], relation: '<=', rhs: 5 },
      ],
    },
  ];

  it('todos os produtos são zero no ótimo (3 PPLs)', () => {
    for (const model of battery) {
      const dual = buildDual(model);
      const primalRes = solve(model);
      const dualRes = solve(dual.solvable);
      const shadow = recoverDualValues(dual, dualRes.solution);
      const cs = complementarySlackness(model, dual, primalRes.solution, shadow);

      expect(cs.allSatisfied).toBe(true);
      expect(cs.constraints.every((c) => c.product === '0')).toBe(true);
      expect(cs.variables.every((v) => v.product === '0')).toBe(true);
    }
  });

  it('detecta restrição ativa vs. preço-sombra nulo (clássico)', () => {
    const model = battery[0];
    const dual = buildDual(model);
    const primalRes = solve(model);
    const dualRes = solve(dual.solvable);
    const shadow = recoverDualValues(dual, dualRes.solution);
    const cs = complementarySlackness(model, dual, primalRes.solution, shadow);

    // x* = (2, 6): restrição 1 (x1<=4) tem folga 2 e y1 = 0 (não-ativa).
    expect(cs.constraints[0]).toMatchObject({ slack: '2', dualValue: '0', product: '0' });
    // restrições 2 e 3 ativas (folga 0) com preço-sombra > 0.
    expect(cs.constraints[1]).toMatchObject({ slack: '0', dualValue: '3/2', product: '0' });
    expect(cs.constraints[2]).toMatchObject({ slack: '0', dualValue: '1', product: '0' });
    // x1>0 e x2>0 ⇒ restrições duais ativas (folga dual 0).
    expect(cs.variables[0]).toMatchObject({ value: '2', dualSlack: '0', product: '0' });
    expect(cs.variables[1]).toMatchObject({ value: '6', dualSlack: '0', product: '0' });
  });
});

/** Converte "3/2" → 1.5 para conferências numéricas no teste. */
function evalFrac(s: string): number {
  if (s.includes('/')) {
    const [a, b] = s.split('/');
    return Number(a) / Number(b);
  }
  return Number(s);
}
