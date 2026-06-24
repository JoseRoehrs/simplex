import { describe, expect, it } from 'vitest';
import { solve } from '../src/core/simplexCore';
import type { LPModel } from '../src/core/types';

// Exemplo clássico de CICLAGEM de Beale sob a regra de Dantzig.
// Ótimo conhecido: z = 1/20 (0.05) com x6 = 1 (confere com GLPK).
// Antes do anti-ciclagem, o motor entrava em loop, batia em MAX_ITER e devolvia
// "optimal" com z = 0 — um resultado ERRADO rotulado como ótimo.
const beale: LPModel = {
  sense: 'max',
  objective: [0.75, -150, 0.02, -6], // x4, x5, x6, x7
  constraints: [
    { coeffs: [0.25, -60, -0.04, 9], relation: '<=', rhs: 0 },
    { coeffs: [0.5, -90, -0.02, 3], relation: '<=', rhs: 0 },
    { coeffs: [0, 0, 1, 0], relation: '<=', rhs: 1 },
  ],
  varNames: ['x4', 'x5', 'x6', 'x7'],
};

describe('Anti-ciclagem (regra de Bland como fallback)', () => {
  it('resolve o exemplo de Beale sem ciclar (z = 1/20)', () => {
    const r = solve(beale);
    expect(r.status).toBe('optimal');
    expect(r.objectiveValue).toBe('1/20'); // 0.05 exato, confere com GLPK
    expect(r.solution.x6).toBe('1');
    // Não pode ter terminado por estouro do limite de iterações.
    const last = r.steps[r.steps.length - 1];
    expect(last.note).not.toContain('Limite');
  });
});
