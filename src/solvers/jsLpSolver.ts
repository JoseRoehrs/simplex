import solver, { type Model } from 'javascript-lp-solver';
import type { LPModel, SolveStatus } from '../core/types';
import type { SolverResult } from './glpkSolver';

/** Solver secundário (JS puro) — segunda opinião na validação do motor. */
export function solveWithJsLP(model: LPModel): SolverResult {
  const names = model.varNames ?? model.objective.map((_, i) => `x${i + 1}`);

  const constraints: Model['constraints'] = {};
  model.constraints.forEach((c, ci) => {
    const key = `c${ci + 1}`;
    if (c.relation === '<=') constraints[key] = { max: c.rhs };
    else if (c.relation === '>=') constraints[key] = { min: c.rhs };
    else constraints[key] = { equal: c.rhs };
  });

  const variables: Model['variables'] = {};
  names.forEach((name, i) => {
    const attrs: Record<string, number> = { z: model.objective[i] ?? 0 };
    model.constraints.forEach((c, ci) => {
      const coef = c.coeffs[i] ?? 0;
      if (coef !== 0) attrs[`c${ci + 1}`] = coef;
    });
    variables[name] = attrs;
  });

  const res = solver.Solve({
    optimize: 'z',
    opType: model.sense,
    constraints,
    variables,
  });

  let status: SolveStatus;
  if (!res.feasible) status = 'infeasible';
  else if (res.bounded === false) status = 'unbounded';
  else status = 'optimal';

  const vars: Record<string, number> = {};
  names.forEach((name) => {
    const v = res[name];
    vars[name] = typeof v === 'number' ? v : 0;
  });

  return {
    status,
    objective: status === 'optimal' ? res.result : null,
    vars,
    solver: 'javascript-lp-solver',
  };
}
