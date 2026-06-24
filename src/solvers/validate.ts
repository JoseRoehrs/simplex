import { solve } from '../core/simplexCore';
import type { LPModel, SimplexResult } from '../core/types';
import { solveWithGLPK, type SolverResult } from './glpkSolver';
import { solveWithJsLP } from './jsLpSolver';

export interface ValidationReport {
  engine: SimplexResult;
  reference: SolverResult; // GLPK
  secondary: SolverResult; // javascript-lp-solver
  agrees: boolean;
  detail: string;
}

const TOL = 1e-6;

/** Compara o resultado do motor passo a passo com o GLPK (referência) e o jsLPSolver. */
export async function solveAndValidate(model: LPModel): Promise<ValidationReport> {
  const engine = solve(model);
  const reference = await solveWithGLPK(model);
  const secondary = solveWithJsLP(model);

  const statusAgrees = engine.status === reference.status;
  let objAgrees = true;
  if (engine.status === 'optimal' && reference.status === 'optimal') {
    objAgrees =
      Math.abs((engine.numericObjective ?? NaN) - (reference.objective ?? NaN)) <= TOL;
  }
  const agrees = statusAgrees && objAgrees;

  let detail: string;
  if (!statusAgrees) {
    detail = `Divergência de status: motor=${engine.status}, GLPK=${reference.status}.`;
  } else if (!objAgrees) {
    detail = `Divergência no ótimo: motor=${engine.objectiveValue}, GLPK=${reference.objective}.`;
  } else if (engine.status === 'optimal') {
    detail = `Validado ✓ — ótimo = ${engine.objectiveValue} (motor) confere com ${reference.objective} (${reference.solver}).`;
  } else {
    detail = `Validado ✓ — ambos concluíram: ${engine.status}.`;
  }

  return { engine, reference, secondary, agrees, detail };
}
