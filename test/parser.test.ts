import { describe, expect, it } from 'vitest';
import { modelToText, parseLP } from '../src/core/parser';
import { solve } from '../src/core/simplexCore';

describe('parseLP', () => {
  it('analisa um PPL no formato livro-texto', () => {
    const model = parseLP(`
      max 3x1 + 5x2
      s.t.
      x1 <= 4
      2x2 <= 12
      3x1 + 2x2 <= 18
      x1, x2 >= 0
    `);
    expect(model.sense).toBe('max');
    expect(model.varNames).toEqual(['x1', 'x2']);
    expect(model.objective).toEqual([3, 5]);
    expect(model.constraints).toHaveLength(3); // a não-negatividade é ignorada
    const r = solve(model);
    expect(r.objectiveValue).toBe('36');
  });

  it('entende coeficientes implícitos e negativos', () => {
    const model = parseLP(`min -x1 + 2x2
x1 - x2 >= -1
x1 + x2 = 3`);
    expect(model.objective).toEqual([-1, 2]);
    expect(model.constraints[0]).toEqual({ coeffs: [1, -1], relation: '>=', rhs: -1 });
    expect(model.constraints[1]).toEqual({ coeffs: [1, 1], relation: '=', rhs: 3 });
  });

  it('ida e volta com modelToText volta a resolver igual', () => {
    const original = parseLP(`max 2x1 + x2\nx1 + x2 = 4\nx1 <= 3`);
    const reparsed = parseLP(modelToText(original));
    expect(solve(reparsed).objectiveValue).toBe(solve(original).objectiveValue);
  });

  it('lança erro quando falta o objetivo', () => {
    expect(() => parseLP('x1 + x2 <= 4')).toThrow();
  });

  it('soma coeficientes de termos repetidos (não sobrescreve)', () => {
    // 2x1 + 3x1 = 5x1 ; x1 + x1 = 2x1. O parser deve combinar termos semelhantes,
    // não deixar o último vencer (que daria 3 e 1, ensinando o problema errado).
    const model = parseLP(`max 2x1 + 3x1\nx1 + x1 <= 4`);
    expect(model.objective).toEqual([5]);
    expect(model.constraints[0].coeffs).toEqual([2]);
    // E o motor então resolve o problema CERTO: max 5x1 s.a. 2x1 <= 4 => x1=2, z=10.
    const r = solve(model);
    expect(r.solution.x1).toBe('2');
    expect(r.objectiveValue).toBe('10');
  });
});
