import { describe, expect, it } from 'vitest';
import { solve } from '../src/core/simplexCore';
import { solveAndValidate } from '../src/solvers/validate';
import { parseLP } from '../src/core/parser';
import { PROBLEMS } from '../src/core/problems';
import { traceProblem } from '../src/core/flowTrace';
import type { LPModel } from '../src/core/types';

// ---------------------------------------------------------------------------
// Problemas com ótimo conhecido (verificação exata do motor passo a passo).
// ---------------------------------------------------------------------------

describe('Simplex (fase única, restrições <=)', () => {
  // Clássico Hillier & Lieberman: ótimo z=36 em (2, 6).
  const model: LPModel = {
    sense: 'max',
    objective: [3, 5],
    constraints: [
      { coeffs: [1, 0], relation: '<=', rhs: 4 },
      { coeffs: [0, 2], relation: '<=', rhs: 12 },
      { coeffs: [3, 2], relation: '<=', rhs: 18 },
    ],
    varNames: ['x1', 'x2'],
  };

  it('encontra o ótimo exato z=36 em (2,6) usando fase única', () => {
    const r = solve(model);
    expect(r.status).toBe('optimal');
    expect(r.method).toBe('simplex');
    expect(r.objectiveValue).toBe('36');
    expect(r.solution.x1).toBe('2');
    expect(r.solution.x2).toBe('6');
    // registra passos (pelo menos um pivô + o quadro final ótimo)
    expect(r.steps.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Simplex Duas Fases (restrições >=)', () => {
  // min 2x1 + 3x2 s.a. x1+x2>=4, 2x1+x2>=5  => ótimo z=8 em (4,0).
  const model: LPModel = {
    sense: 'min',
    objective: [2, 3],
    constraints: [
      { coeffs: [1, 1], relation: '>=', rhs: 4 },
      { coeffs: [2, 1], relation: '>=', rhs: 5 },
    ],
    varNames: ['x1', 'x2'],
  };

  it('usa duas fases e encontra z=8 em (4,0)', () => {
    const r = solve(model);
    expect(r.status).toBe('optimal');
    expect(r.method).toBe('two-phase');
    expect(r.objectiveValue).toBe('8');
    expect(r.solution.x1).toBe('4');
    expect(r.solution.x2).toBe('0');
    // deve haver passos da Fase 1 e da Fase 2
    expect(r.steps.some((s) => s.phase === 1)).toBe(true);
    expect(r.steps.some((s) => s.phase === 2)).toBe(true);
  });
});

describe('Simplex Duas Fases (restrição de igualdade)', () => {
  // max 2x1 + x2 s.a. x1+x2=4, x1<=3  => ótimo z=7 em (3,1).
  const model: LPModel = {
    sense: 'max',
    objective: [2, 1],
    constraints: [
      { coeffs: [1, 1], relation: '=', rhs: 4 },
      { coeffs: [1, 0], relation: '<=', rhs: 3 },
    ],
    varNames: ['x1', 'x2'],
  };

  it('trata a igualdade via artificial e encontra z=7 em (3,1)', () => {
    const r = solve(model);
    expect(r.status).toBe('optimal');
    expect(r.method).toBe('two-phase');
    expect(r.objectiveValue).toBe('7');
    expect(r.solution.x1).toBe('3');
    expect(r.solution.x2).toBe('1');
  });
});

describe('Resultado fracionário exato', () => {
  // max x1 + x2 s.a. 2x1 + x2 <= 3, x1 + 2x2 <= 3 => ótimo em (1,1), z=2 (inteiro)
  // troca para forçar fração: max x1 s.a. 3x1 <= 2 => x1 = 2/3.
  it('mantém frações exatas (2/3)', () => {
    const r = solve({
      sense: 'max',
      objective: [1],
      constraints: [{ coeffs: [3], relation: '<=', rhs: 2 }],
      varNames: ['x1'],
    });
    expect(r.status).toBe('optimal');
    expect(r.objectiveValue).toBe('2/3');
    expect(r.solution.x1).toBe('2/3');
  });
});

describe('Casos especiais', () => {
  it('detecta inviabilidade', () => {
    const r = solve({
      sense: 'max',
      objective: [1, 0],
      constraints: [
        { coeffs: [1, 1], relation: '<=', rhs: 2 },
        { coeffs: [1, 1], relation: '>=', rhs: 5 },
      ],
    });
    expect(r.status).toBe('infeasible');
  });

  it('detecta ilimitação', () => {
    const r = solve({
      sense: 'max',
      objective: [1, 1],
      constraints: [{ coeffs: [1, -1], relation: '<=', rhs: 1 }],
    });
    expect(r.status).toBe('unbounded');
  });
});

// ---------------------------------------------------------------------------
// Catálogo do curso: o problema ilustrativo s10c é o único que exercita o
// desfecho INVIÁVEL (W > 0 na Fase 1) — acende a ramificação correspondente
// da árvore de decisão do Workflow.
// ---------------------------------------------------------------------------

describe('Catálogo — problema ilustrativo inviável (s10c)', () => {
  const problem = PROBLEMS.find((p) => p.id === 's10c')!;

  it('está cadastrado na semana 10', () => {
    expect(problem).toBeDefined();
    expect(problem.week).toBe(10);
  });

  it('o motor detecta inviabilidade via duas fases (W > 0)', () => {
    const r = solve(problem.model);
    expect(r.status).toBe('infeasible');
    expect(r.method).toBe('two-phase');
    expect(r.steps.some((s) => s.phase === 1)).toBe(true);
  });

  it('concorda com os solvers de referência (GLPK e jsLP): inviável', async () => {
    const report = await solveAndValidate(problem.model);
    expect(report.agrees, report.detail).toBe(true);
    expect(report.reference.status).toBe('infeasible');
    expect(report.secondary.status).toBe('infeasible');
  });

  it('acende a ramificação INVIÁVEL no workflow', () => {
    const trace = traceProblem(problem.model);
    expect(trace.status).toBe('infeasible');
    expect(trace.activeNodes.has('infeasible')).toBe(true);
    expect(trace.activeEdges.has('e_check_infeasible')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Exemplo do solver "Múltiplos ótimos (max)" (App.tsx > EXAMPLES): ótimo finito
// z=8 atingido em todo um SEGMENTO (objetivo paralelo à aresta x1+2x2=8). O
// motor para em (2,3), mas (4,2) também é ótimo. Assinatura no quadro ótimo:
// uma variável NÃO-básica com custo reduzido 0.
// ---------------------------------------------------------------------------

describe('Múltiplos ótimos (exemplo do solver)', () => {
  // Espelha o texto do chip 'Múltiplos ótimos (max)' em App.tsx.
  const model: LPModel = {
    sense: 'max',
    objective: [1, 2],
    constraints: [
      { coeffs: [1, 2], relation: '<=', rhs: 8 },
      { coeffs: [1, 0], relation: '<=', rhs: 4 },
      { coeffs: [0, 1], relation: '<=', rhs: 3 },
    ],
    varNames: ['x1', 'x2'],
  };

  it('tem ótimo finito z=8 e concorda com GLPK/jsLP', async () => {
    const report = await solveAndValidate(model);
    expect(report.agrees, report.detail).toBe(true);
    expect(report.engine.status).toBe('optimal');
    expect(report.engine.objectiveValue).toBe('8');
    expect(report.secondary.status).toBe('optimal');
  });

  it('o quadro ótimo tem uma NÃO-básica com custo reduzido 0 (ótimos alternativos)', () => {
    const r = solve(model);
    const last = r.steps[r.steps.length - 1].tableau;
    const altSignal = last.columns.some(
      (col, j) => !last.basis.includes(col) && last.objectiveRow[j] === '0',
    );
    expect(altSignal).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Exemplo do solver "Inviável (região vazia)" (App.tsx > EXAMPLES): o texto do
// chip precisa parsear para um modelo cuja inviabilidade o GLPK confirma (badge
// verde "✓ Validado", não uma falsa "✗ Divergência"). Espelha o chip.
// ---------------------------------------------------------------------------

describe('Inviável — chip do solver (região vazia)', () => {
  const CHIP_TEXT = `max 2x1 + 3x2
s.t.
x1 + 2x2 <= 4
3x1 + 2x2 >= 18
x1, x2 >= 0`;

  it('o texto do chip parseia e é detectado inviável, com GLPK e jsLP concordando', async () => {
    const model = parseLP(CHIP_TEXT);
    const report = await solveAndValidate(model);
    expect(report.engine.status).toBe('infeasible');
    expect(report.reference.status).toBe('infeasible'); // GLPK
    expect(report.secondary.status).toBe('infeasible'); // jsLP
    expect(report.agrees, report.detail).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Validação cruzada: motor passo a passo vs GLPK (referência) vs jsLPSolver.
// ---------------------------------------------------------------------------

describe('Validação cruzada com GLPK e javascript-lp-solver', () => {
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
      name: 'igualdade',
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
      name: 'misto >= e <=',
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
    it(`concorda com os solvers de referência: ${name}`, async () => {
      const report = await solveAndValidate(model);
      expect(report.agrees, report.detail).toBe(true);
      // o solver secundário (jsLP) também deve concordar no status
      expect(report.secondary.status).toBe(report.engine.status);
    });
  }
});
