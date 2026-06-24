// Construção do problema DUAL de um PPL e sua forma resolvível pelo motor.
//
// Regras de transposição (variáveis primais sempre >= 0):
//
//   Primal MAX  ──►  Dual MIN          Primal MIN  ──►  Dual MAX
//   restrição <=  ►  y_i >= 0          restrição >=  ►  y_i >= 0
//   restrição >=  ►  y_i <= 0          restrição <=  ►  y_i <= 0
//   restrição  =  ►  y_i livre         restrição  =  ►  y_i livre
//   variável x_j  ►  restrição dual >= c_j   variável x_j  ►  restrição dual <= c_j
//
// O objetivo dual usa os RHS (b) do primal; cada restrição dual usa a coluna j de A
// (a transposta) e tem RHS = c_j.

import { F, fracToString, isZero } from './frac';
import type { LPModel, Relation, Sense } from './types';

export type DualSign = '>=0' | '<=0' | 'free';

/** Uma variável dual y_i, associada à restrição i do primal. */
export interface DualVariable {
  name: string; // y1, y2, ...
  sign: DualSign;
  objCoeff: number; // = b_i (RHS da restrição i)
  fromConstraint: number;
}

/** Uma restrição dual, associada à variável de decisão j do primal. */
export interface DualConstraintInfo {
  coeffs: number[]; // sobre as variáveis duais y, comprimento = nº de restrições
  relation: Relation; // '>=' (primal max) ou '<=' (primal min)
  rhs: number; // = c_j
  fromVar: number;
  varName: string; // nome da variável de decisão primal correspondente
}

/** Coluna do modelo resolvível: cada y_i vira 1 coluna (>=0/<=0) ou 2 (livre). */
export interface SolvableDualColumn {
  name: string;
  dualVarIndex: number;
  mult: 1 | -1; // y_i = Σ (mult · valor_da_coluna)
}

export interface DualProblem {
  primalSense: Sense;
  dualSense: Sense;
  vars: DualVariable[];
  constraints: DualConstraintInfo[];
  /** Nomes das variáveis de decisão do primal (rótulos das restrições duais). */
  varNames: string[];
  /** LPModel equivalente, com todas as variáveis >= 0, para resolver no motor. */
  solvable: LPModel;
  /** Mapeamento das colunas resolvíveis de volta para as variáveis duais. */
  solvableColumns: SolvableDualColumn[];
}

/** Constrói o dual (forma natural + forma resolvível) de um PPL. */
export function buildDual(primal: LPModel): DualProblem {
  const n = primal.objective.length;
  const primalNames =
    primal.varNames ?? Array.from({ length: n }, (_, i) => `x${i + 1}`);
  const c = primal.objective;
  const b = primal.constraints.map((con) => con.rhs);
  // Garante linhas com largura n (caso o usuário envie menos coeficientes).
  const A = primal.constraints.map((con) => {
    const row = con.coeffs.slice();
    while (row.length < n) row.push(0);
    return row;
  });

  const dualSense: Sense = primal.sense === 'max' ? 'min' : 'max';
  const dualRel: Relation = primal.sense === 'max' ? '>=' : '<=';

  const signFor = (rel: Relation): DualSign => {
    if (rel === '=') return 'free';
    if (primal.sense === 'max') return rel === '<=' ? '>=0' : '<=0';
    return rel === '>=' ? '>=0' : '<=0';
  };

  const vars: DualVariable[] = primal.constraints.map((con, i) => ({
    name: `y${i + 1}`,
    sign: signFor(con.relation),
    objCoeff: b[i],
    fromConstraint: i,
  }));

  const constraints: DualConstraintInfo[] = primalNames.map((vn, j) => ({
    coeffs: A.map((row) => row[j]),
    relation: dualRel,
    rhs: c[j],
    fromVar: j,
    varName: vn,
  }));

  // ---- forma resolvível: todas as variáveis >= 0 ----
  //   y_i >= 0   → 1 coluna  (mult +1)
  //   y_i <= 0   → 1 coluna  (mult -1):           y_i = -w
  //   y_i livre  → 2 colunas (mult +1 e -1):      y_i = u - v
  const solvableColumns: SolvableDualColumn[] = [];
  vars.forEach((v, i) => {
    if (v.sign === '>=0') {
      solvableColumns.push({ name: v.name, dualVarIndex: i, mult: 1 });
    } else if (v.sign === '<=0') {
      solvableColumns.push({ name: v.name, dualVarIndex: i, mult: -1 });
    } else {
      solvableColumns.push({ name: `${v.name}+`, dualVarIndex: i, mult: 1 });
      solvableColumns.push({ name: `${v.name}-`, dualVarIndex: i, mult: -1 });
    }
  });

  const solvable: LPModel = {
    sense: dualSense,
    objective: solvableColumns.map((col) => b[col.dualVarIndex] * col.mult),
    varNames: solvableColumns.map((col) => col.name),
    constraints: constraints.map((dc) => ({
      coeffs: solvableColumns.map((col) => A[col.dualVarIndex][dc.fromVar] * col.mult),
      relation: dc.relation,
      rhs: dc.rhs,
    })),
  };

  return {
    primalSense: primal.sense,
    dualSense,
    vars,
    constraints,
    varNames: primalNames,
    solvable,
    solvableColumns,
  };
}

/**
 * Reconstrói os valores das variáveis duais (preços-sombra) a partir da solução
 * do modelo resolvível. Retorna { y1: "3/2", y2: "0", ... } como frações exatas.
 */
export function recoverDualValues(
  dual: DualProblem,
  solution: Record<string, string>,
): Record<string, string> {
  const y = dual.vars.map(() => F(0));
  for (const col of dual.solvableColumns) {
    const raw = solution[col.name];
    const val = raw !== undefined ? F(raw) : F(0);
    y[col.dualVarIndex] = y[col.dualVarIndex].add(val.mul(col.mult));
  }
  const out: Record<string, string> = {};
  dual.vars.forEach((v, i) => {
    out[v.name] = fracToString(y[i]);
  });
  return out;
}

// ---------------------------------------------------------------------------
// Folga complementar (complementary slackness)
// ---------------------------------------------------------------------------
//
// No ótimo, para cada par primal-dual ao menos um lado é zero:
//   • restrição i:  folga_i · y_i = 0   (restrição ativa  OU  preço-sombra nulo)
//   • variável j:   x_j · folga_dual_j = 0  (variável usada  OU  restrição dual ativa)
// onde folga_dual_j é a sobra da restrição dual j (o custo reduzido).

/** Par complementar de uma restrição primal i ↔ variável dual y_i. */
export interface CSConstraintPair {
  index: number; // 0-based
  slack: string; // folga (≤) / excesso (≥) da restrição primal, ≥ 0
  dualValue: string; // y_i
  product: string; // folga · y_i  (== "0" no ótimo)
  ok: boolean;
}

/** Par complementar de uma variável primal x_j ↔ restrição dual j. */
export interface CSVariablePair {
  name: string; // x_j
  value: string; // x_j
  dualSlack: string; // folga da restrição dual j (custo reduzido), ≥ 0
  product: string; // x_j · folga_dual  (== "0" no ótimo)
  ok: boolean;
}

export interface ComplementarySlackness {
  constraints: CSConstraintPair[];
  variables: CSVariablePair[];
  allSatisfied: boolean;
}

/**
 * Verifica e descreve as condições de folga complementar de um par primal-dual,
 * a partir da solução ótima do primal e das variáveis duais (preços-sombra).
 * Tudo em frações exatas; no ótimo todos os produtos são 0.
 */
export function complementarySlackness(
  primal: LPModel,
  dual: DualProblem,
  primalSolution: Record<string, string>,
  dualValues: Record<string, string>,
): ComplementarySlackness {
  const names =
    primal.varNames ??
    Array.from({ length: primal.objective.length }, (_, i) => `x${i + 1}`);
  const x = names.map((nm) => F(primalSolution[nm] ?? '0'));
  const y = dual.vars.map((v) => F(dualValues[v.name] ?? '0'));

  const constraints: CSConstraintPair[] = primal.constraints.map((con, i) => {
    let lhs = F(0);
    con.coeffs.forEach((a, j) => {
      lhs = lhs.add(F(a).mul(x[j] ?? F(0)));
    });
    const b = F(con.rhs);
    const slack =
      con.relation === '<=' ? b.sub(lhs) : con.relation === '>=' ? lhs.sub(b) : F(0);
    const product = slack.mul(y[i]);
    return {
      index: i,
      slack: fracToString(slack),
      dualValue: fracToString(y[i]),
      product: fracToString(product),
      ok: isZero(product),
    };
  });

  const variables: CSVariablePair[] = names.map((nm, j) => {
    let dualLhs = F(0);
    primal.constraints.forEach((con, i) => {
      const a = con.coeffs[j] ?? 0;
      dualLhs = dualLhs.add(F(a).mul(y[i]));
    });
    const cj = F(primal.objective[j] ?? 0);
    // restrição dual: max→ dualLhs ≥ c_j ; min→ dualLhs ≤ c_j. Folga ≥ 0.
    const dualSlack = primal.sense === 'max' ? dualLhs.sub(cj) : cj.sub(dualLhs);
    const product = x[j].mul(dualSlack);
    return {
      name: nm,
      value: fracToString(x[j]),
      dualSlack: fracToString(dualSlack),
      product: fracToString(product),
      ok: isZero(product),
    };
  });

  const allSatisfied =
    constraints.every((c) => c.ok) && variables.every((v) => v.ok);
  return { constraints, variables, allSatisfied };
}
