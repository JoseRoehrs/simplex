import GLPK from 'glpk.js';
import type { GLPK as GLPKInstance, LP } from 'glpk.js';
import type { LPModel, SolveStatus } from '../core/types';

export interface SolverResult {
  status: SolveStatus;
  objective: number | null;
  vars: Record<string, number>;
  solver: string;
}

let glpkPromise: Promise<GLPKInstance> | null = null;

/** Carrega o GLPK (WASM) uma única vez e reaproveita a instância. */
function getGLPK(): Promise<GLPKInstance> {
  if (!glpkPromise) glpkPromise = Promise.resolve(GLPK());
  return glpkPromise;
}

function buildLP(glpk: GLPKInstance, model: LPModel): LP {
  const names = model.varNames ?? model.objective.map((_, i) => `x${i + 1}`);

  const objVars = model.objective
    .map((coef, i) => ({ name: names[i], coef }))
    .filter((v) => v.coef !== 0);

  const subjectTo = model.constraints.map((c, ci) => {
    const vars = c.coeffs
      .map((coef, i) => ({ name: names[i], coef }))
      .filter((v) => v.coef !== 0);
    let bnds: { type: number; ub: number; lb: number };
    if (c.relation === '<=') bnds = { type: glpk.GLP_UP, ub: c.rhs, lb: 0 };
    else if (c.relation === '>=') bnds = { type: glpk.GLP_LO, ub: 0, lb: c.rhs };
    else bnds = { type: glpk.GLP_FX, ub: c.rhs, lb: c.rhs };
    return { name: `c${ci + 1}`, vars, bnds };
  });

  // Garante x_i >= 0 explicitamente.
  const bounds = names.map((name) => ({
    name,
    type: glpk.GLP_LO,
    ub: 0,
    lb: 0,
  }));

  return {
    name: 'lp',
    objective: {
      direction: model.sense === 'max' ? glpk.GLP_MAX : glpk.GLP_MIN,
      name: 'z',
      vars: objVars,
    },
    subjectTo,
    bounds,
  };
}

function mapStatus(glpk: GLPKInstance, status: number): SolveStatus {
  if (status === glpk.GLP_OPT || status === glpk.GLP_FEAS) return 'optimal';
  if (status === glpk.GLP_UNBND) return 'unbounded';
  return 'infeasible'; // GLP_NOFEAS / GLP_INFEAS / GLP_UNDEF
}

/** Resolve com o GLPK — usado como "verdade de referência" para validar o motor. */
export async function solveWithGLPK(model: LPModel): Promise<SolverResult> {
  const glpk = await getGLPK();
  const lp = buildLP(glpk, model);
  const res = await Promise.resolve(glpk.solve(lp, glpk.GLP_MSG_OFF));
  const status = mapStatus(glpk, res.result.status);
  return {
    status,
    objective: status === 'optimal' ? res.result.z : null,
    vars: res.result.vars ?? {},
    solver: `GLPK ${glpk.version}`,
  };
}
