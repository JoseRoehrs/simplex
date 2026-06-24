import { F, fracToString, isNeg, isPos, isZero, type Frac } from './frac';
import type {
  ColumnMeta,
  LPModel,
  PivotStep,
  SimplexResult,
  TableauSnapshot,
} from './types';

const MAX_ITER = 200; // trava de segurança contra ciclagem em problemas patológicos

// ---------------------------------------------------------------------------
// 1) Forma padrão: adiciona folgas (slack), excessos (surplus) e artificiais.
// ---------------------------------------------------------------------------

interface StandardForm {
  columns: ColumnMeta[];
  A: Frac[][]; // m x n  (linhas de restrição)
  b: Frac[]; // m       (lado direito, sempre >= 0)
  basis: number[]; // m  (índice da coluna básica de cada linha)
  artificialCols: number[];
  decisionCols: number[];
  varNames: string[];
}

export function buildStandardForm(model: LPModel): StandardForm {
  const nDec = model.objective.length;
  const varNames =
    model.varNames ?? Array.from({ length: nDec }, (_, i) => `x${i + 1}`);

  // Normaliza cada restrição para ter RHS >= 0 (multiplica por -1 e inverte a relação se preciso).
  const norm = model.constraints.map((c) => {
    let coeffs = c.coeffs.slice();
    let rhs = c.rhs;
    let relation = c.relation;
    if (rhs < 0) {
      coeffs = coeffs.map((v) => -v);
      rhs = -rhs;
      relation = relation === '<=' ? '>=' : relation === '>=' ? '<=' : '=';
    }
    return { coeffs, rhs, relation };
  });

  const m = norm.length;
  const columns: ColumnMeta[] = varNames.map((name, i) => ({
    name,
    kind: 'decision',
    decisionIndex: i,
  }));
  const decisionCols = columns.map((_, i) => i);

  const A: Frac[][] = norm.map((c) => {
    const row = c.coeffs.map((v) => F(v));
    // garante largura = nDec (caso o usuário envie menos coeficientes)
    while (row.length < nDec) row.push(F(0));
    return row;
  });
  const b: Frac[] = norm.map((c) => F(c.rhs));
  const basis = new Array<number>(m).fill(-1);
  const artificialCols: number[] = [];

  // Acrescenta uma coluna nova ao tableau, com valores por linha (default 0).
  const addColumn = (meta: ColumnMeta, entries: Record<number, Frac>): number => {
    const colIndex = columns.length;
    columns.push(meta);
    for (let i = 0; i < m; i++) A[i].push(entries[i] ?? F(0));
    return colIndex;
  };

  // Folgas/excessos na ordem das restrições.
  let slackCount = 0;
  let surplusCount = 0;
  norm.forEach((c, i) => {
    if (c.relation === '<=') {
      const col = addColumn(
        { name: `s${++slackCount}`, kind: 'slack' },
        { [i]: F(1) },
      );
      basis[i] = col; // folga entra na base inicial
    } else if (c.relation === '>=') {
      addColumn({ name: `e${++surplusCount}`, kind: 'surplus' }, { [i]: F(-1) });
    }
  });

  // Artificiais para restrições '>=' e '='.
  let artCount = 0;
  norm.forEach((c, i) => {
    if (c.relation === '>=' || c.relation === '=') {
      const col = addColumn(
        { name: `a${++artCount}`, kind: 'artificial' },
        { [i]: F(1) },
      );
      basis[i] = col; // artificial entra na base inicial
      artificialCols.push(col);
    }
  });

  return { columns, A, b, basis, artificialCols, decisionCols, varNames };
}

// ---------------------------------------------------------------------------
// 2) Núcleo do Simplex primal (operando sobre um tableau em forma canônica).
// ---------------------------------------------------------------------------

interface PhaseState {
  A: Frac[][];
  b: Frac[];
  basis: number[];
  columns: ColumnMeta[];
}

/** custos reduzidos (z_j - c_j) por coluna, na convenção de MAXIMIZAÇÃO. */
function reducedCosts(state: PhaseState, cost: Frac[]): Frac[] {
  const { A, basis, columns } = state;
  const n = columns.length;
  const m = basis.length;
  const out: Frac[] = [];
  for (let j = 0; j < n; j++) {
    let zj = F(0);
    for (let i = 0; i < m; i++) zj = zj.add(cost[basis[i]].mul(A[i][j]));
    out.push(zj.sub(cost[j]));
  }
  return out;
}

function objectiveValue(state: PhaseState, cost: Frac[]): Frac {
  let z = F(0);
  for (let i = 0; i < state.basis.length; i++) {
    z = z.add(cost[state.basis[i]].mul(state.b[i]));
  }
  return z;
}

function snapshot(state: PhaseState, rc: Frac[], objVal: Frac): TableauSnapshot {
  return {
    rows: state.A.map((row) => row.map(fracToString)),
    rhs: state.b.map(fracToString),
    objectiveRow: rc.map(fracToString),
    objectiveValue: fracToString(objVal),
    columns: state.columns.map((c) => c.name),
    kinds: state.columns.map((c) => c.kind),
    basis: state.basis.map((idx) => state.columns[idx].name),
  };
}

function pivot(state: PhaseState, pr: number, pc: number): void {
  const { A, b } = state;
  const piv = A[pr][pc];
  // normaliza a linha pivô
  A[pr] = A[pr].map((v) => v.div(piv));
  b[pr] = b[pr].div(piv);
  // zera a coluna pivô nas demais linhas
  for (let r = 0; r < A.length; r++) {
    if (r === pr) continue;
    const factor = A[r][pc];
    if (isZero(factor)) continue;
    A[r] = A[r].map((v, j) => v.sub(factor.mul(A[pr][j])));
    b[r] = b[r].sub(factor.mul(b[pr]));
  }
  state.basis[pr] = pc;
}

interface RunOptions {
  cost: Frac[];
  phase: 1 | 2;
  forbidden: Set<number>; // colunas que não podem ENTRAR na base
  steps: PivotStep[];
  iterCounter: { value: number };
}

type RunStatus = 'optimal' | 'unbounded';

/** Executa o Simplex até o ótimo ou detectar ilimitação, registrando cada passo. */
function runSimplex(state: PhaseState, opts: RunOptions): RunStatus {
  const { cost, phase, forbidden, steps, iterCounter } = opts;

  // Anti-ciclagem: a regra de Dantzig (mais negativo) pode CICLAR em vértices
  // degenerados (ex.: problema de Beale). Quando uma sequência longa de pivôs
  // degenerados (razão mínima = 0: a base muda mas o objetivo não) é detectada,
  // trocamos a regra de ENTRADA para a de Bland (menor índice), que garante
  // terminação. Mantemos Bland até o fim da fase — a garantia exige aplicá-la de
  // forma consistente. O desempate de SAÍDA já é à la Bland (menor índice básico).
  const blandThreshold = state.columns.length + state.basis.length;
  let degenerateStreak = 0;
  let useBland = false;

  for (let guard = 0; guard < MAX_ITER; guard++) {
    const rc = reducedCosts(state, cost);
    const objVal = objectiveValue(state, cost);

    // Degeneração prolongada => alterna para Bland para evitar ciclagem.
    if (!useBland && degenerateStreak > blandThreshold) {
      useBland = true;
      steps.push({
        iteration: iterCounter.value++,
        phase,
        enteringVar: null,
        leavingVar: null,
        pivotRow: null,
        pivotCol: null,
        tableau: snapshot(state, rc, objVal),
        note: `Degeneração prolongada (${degenerateStreak} pivôs seguidos sem melhorar o objetivo): alternando para a regra de Bland (menor índice) para evitar ciclagem.`,
      });
    }

    // Escolhe a variável que ENTRA.
    let pc = -1;
    let best = F(0);
    if (useBland) {
      // Regra de Bland: menor índice de coluna com custo reduzido negativo.
      for (let j = 0; j < rc.length; j++) {
        if (forbidden.has(j)) continue;
        if (isNeg(rc[j])) {
          pc = j;
          best = rc[j];
          break;
        }
      }
    } else {
      // Regra de Dantzig: custo reduzido mais negativo.
      for (let j = 0; j < rc.length; j++) {
        if (forbidden.has(j)) continue;
        if (isNeg(rc[j]) && rc[j].compare(best) < 0) {
          best = rc[j];
          pc = j;
        }
      }
    }

    if (pc === -1) {
      // Ótimo: nenhum custo reduzido negativo.
      steps.push({
        iteration: iterCounter.value++,
        phase,
        enteringVar: null,
        leavingVar: null,
        pivotRow: null,
        pivotCol: null,
        tableau: snapshot(state, rc, objVal),
        note:
          phase === 1
            ? 'Fim da Fase 1: todos os custos reduzidos ≥ 0.'
            : 'Solução ótima: todos os custos reduzidos ≥ 0 — nenhuma variável melhora o objetivo.',
      });
      return 'optimal';
    }

    // Teste da razão mínima para escolher a variável que SAI.
    let pr = -1;
    let bestRatio: Frac | null = null;
    for (let i = 0; i < state.A.length; i++) {
      const a = state.A[i][pc];
      if (!isPos(a)) continue;
      const ratio = state.b[i].div(a);
      if (
        bestRatio === null ||
        ratio.compare(bestRatio) < 0 ||
        // desempate por menor índice de coluna básica (anti-ciclagem, à la Bland)
        (ratio.equals(bestRatio) && state.basis[i] < state.basis[pr])
      ) {
        bestRatio = ratio;
        pr = i;
      }
    }

    if (pr === -1) {
      // Coluna de entrada sem razão positiva => ilimitado.
      steps.push({
        iteration: iterCounter.value++,
        phase,
        enteringVar: state.columns[pc].name,
        leavingVar: null,
        pivotRow: null,
        pivotCol: pc,
        tableau: snapshot(state, rc, objVal),
        note: `Coluna ${state.columns[pc].name} pode crescer sem limite (nenhum coeficiente positivo no teste da razão): problema ILIMITADO.`,
      });
      return 'unbounded';
    }

    // Pivô degenerado (razão mínima = 0): a base muda mas o objetivo não. Uma
    // sequência longa sinaliza ciclagem e dispara a regra de Bland (acima).
    if (isZero(bestRatio!)) degenerateStreak++;
    else degenerateStreak = 0;

    // Registra o passo ANTES de pivotar (mostra o quadro com o pivô destacado).
    steps.push({
      iteration: iterCounter.value++,
      phase,
      enteringVar: state.columns[pc].name,
      leavingVar: state.columns[state.basis[pr]].name,
      pivotRow: pr,
      pivotCol: pc,
      tableau: snapshot(state, rc, objVal),
      note: `Entra ${state.columns[pc].name} (custo reduzido ${fracToString(best)}), sai ${state.columns[state.basis[pr]].name} (menor razão ${fracToString(bestRatio!)}).`,
    });

    pivot(state, pr, pc);
  }

  // Atingiu o limite de iterações (proteção contra ciclagem).
  const rc = reducedCosts(state, cost);
  steps.push({
    iteration: iterCounter.value++,
    phase,
    enteringVar: null,
    leavingVar: null,
    pivotRow: null,
    pivotCol: null,
    tableau: snapshot(state, rc, objectiveValue(state, cost)),
    note: `Limite de ${MAX_ITER} iterações atingido (possível ciclagem).`,
  });
  return 'optimal';
}

// ---------------------------------------------------------------------------
// 3) Orquestrador: decide entre Simplex de fase única e Simplex Duas Fases.
// ---------------------------------------------------------------------------

/** Tenta retirar variáveis artificiais que ficaram na base em nível zero. */
function driveOutArtificials(
  state: PhaseState,
  artificialCols: Set<number>,
  steps: PivotStep[],
  iterCounter: { value: number },
  zeroCost: Frac[],
): void {
  for (let i = 0; i < state.basis.length; i++) {
    if (!artificialCols.has(state.basis[i])) continue;
    // procura coluna estrutural (não artificial) com coeficiente != 0 nesta linha
    let pc = -1;
    for (let j = 0; j < state.columns.length; j++) {
      if (artificialCols.has(j)) continue;
      if (!isZero(state.A[i][j])) {
        pc = j;
        break;
      }
    }
    if (pc === -1) continue; // linha redundante: artificial fica na base em nível 0
    const rc = reducedCosts(state, zeroCost);
    steps.push({
      iteration: iterCounter.value++,
      phase: 1,
      enteringVar: state.columns[pc].name,
      leavingVar: state.columns[state.basis[i]].name,
      pivotRow: i,
      pivotCol: pc,
      tableau: snapshot(state, rc, objectiveValue(state, zeroCost)),
      note: `Retirando a variável artificial ${state.columns[state.basis[i]].name} da base (entra ${state.columns[pc].name}).`,
    });
    pivot(state, i, pc);
  }
}

export function solve(model: LPModel): SimplexResult {
  const sf = buildStandardForm(model);
  const state: PhaseState = {
    A: sf.A,
    b: sf.b,
    basis: sf.basis,
    columns: sf.columns,
  };
  const needTwoPhase = sf.artificialCols.length > 0;
  const steps: PivotStep[] = [];
  const messages: string[] = [];
  const iterCounter = { value: 0 };

  // Custo de MAXIMIZAÇÃO para as variáveis de decisão (internamente sempre maximizamos).
  const maxObj =
    model.sense === 'max' ? model.objective : model.objective.map((v) => -v);
  const phase2Cost = sf.columns.map((col) =>
    col.kind === 'decision' ? F(maxObj[col.decisionIndex!]) : F(0),
  );
  const zeroCost = sf.columns.map(() => F(0));

  if (needTwoPhase) {
    // FASE 1: minimizar a soma das artificiais  <=>  maximizar -(soma das artificiais).
    const phase1Cost = sf.columns.map((col) =>
      col.kind === 'artificial' ? F(-1) : F(0),
    );
    runSimplex(state, {
      cost: phase1Cost,
      phase: 1,
      forbidden: new Set(),
      steps,
      iterCounter,
    });

    // Valor da Fase 1 = -(soma das artificiais). Se != 0, há artificial positiva => inviável.
    const phase1Value = objectiveValue(state, phase1Cost);
    if (!isZero(phase1Value)) {
      messages.push(
        `Fase 1 terminou com soma das variáveis artificiais = ${fracToString(phase1Value.neg())} > 0. O problema é INVIÁVEL (região factível vazia).`,
      );
      return {
        status: 'infeasible',
        method: 'two-phase',
        steps,
        solution: {},
        objectiveValue: null,
        numericObjective: null,
        messages,
      };
    }

    // Limpa artificiais que sobraram na base em nível zero.
    const artSet = new Set(sf.artificialCols);
    driveOutArtificials(state, artSet, steps, iterCounter, zeroCost);

    messages.push(
      'Fase 1 concluída: solução básica factível encontrada. Iniciando a Fase 2 com a função objetivo original.',
    );

    // FASE 2: objetivo original, proibindo as artificiais de reentrarem.
    const status = runSimplex(state, {
      cost: phase2Cost,
      phase: 2,
      forbidden: new Set(sf.artificialCols),
      steps,
      iterCounter,
    });
    return finalize(model, sf, state, phase2Cost, status, steps, messages, 'two-phase');
  }

  // Fase única (todas as restrições '<=' com RHS >= 0): folgas formam a base inicial.
  const status = runSimplex(state, {
    cost: phase2Cost,
    phase: 2,
    forbidden: new Set(),
    steps,
    iterCounter,
  });
  return finalize(model, sf, state, phase2Cost, status, steps, messages, 'simplex');
}

function finalize(
  model: LPModel,
  sf: StandardForm,
  state: PhaseState,
  phase2Cost: Frac[],
  status: RunStatus,
  steps: PivotStep[],
  messages: string[],
  method: 'simplex' | 'two-phase',
): SimplexResult {
  if (status === 'unbounded') {
    messages.push(
      model.sense === 'max'
        ? 'Objetivo ILIMITADO: pode crescer indefinidamente (+∞).'
        : 'Objetivo ILIMITADO: pode decrescer indefinidamente (-∞).',
    );
    return {
      status: 'unbounded',
      method,
      steps,
      solution: {},
      objectiveValue: null,
      numericObjective: null,
      messages,
    };
  }

  // Extrai os valores das variáveis de decisão a partir da base final.
  const solution: Record<string, string> = {};
  for (const colIdx of sf.decisionCols) {
    const name = sf.columns[colIdx].name;
    const row = state.basis.indexOf(colIdx);
    solution[name] = row === -1 ? '0' : fracToString(state.b[row]);
  }

  const internalMax = objectiveValue(state, phase2Cost); // = max(maxObj · x)
  const original = model.sense === 'max' ? internalMax : internalMax.neg();

  return {
    status: 'optimal',
    method,
    steps,
    solution,
    objectiveValue: fracToString(original),
    numericObjective: original.valueOf(),
    messages,
  };
}
