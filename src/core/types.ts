// Modelo de Programação Linear (PPL) e tipos de saída do motor passo a passo.

export type Sense = 'max' | 'min';
export type Relation = '<=' | '>=' | '=';

/** Uma restrição:  (coeffs · x)  rel  rhs */
export interface Constraint {
  coeffs: number[]; // comprimento = número de variáveis de decisão
  relation: Relation;
  rhs: number;
}

/**
 * Problema de Programação Linear na forma "humana".
 * Assume-se que todas as variáveis de decisão são >= 0 (não-negatividade padrão).
 */
export interface LPModel {
  sense: Sense;
  /** Coeficientes da função objetivo (c), comprimento = número de variáveis. */
  objective: number[];
  constraints: Constraint[];
  /** Nomes das variáveis de decisão. Default: x1, x2, ... */
  varNames?: string[];
}

export type VarKind = 'decision' | 'slack' | 'surplus' | 'artificial';

export interface ColumnMeta {
  name: string;
  kind: VarKind;
  /** Índice da variável de decisão original (apenas para kind === 'decision'). */
  decisionIndex?: number;
}

/** Um quadro (tableau) capturado em um instante do algoritmo. */
export interface TableauSnapshot {
  /** Matriz das linhas de restrição em forma canônica; cada linha tem comprimento = nº de colunas. */
  rows: string[][];
  /** Coluna RHS de cada linha de restrição (frações como string). */
  rhs: string[];
  /** Linha do objetivo: custos reduzidos (z_j - c_j) por coluna. */
  objectiveRow: string[];
  /** Valor atual do objetivo (em frações como string), na convenção interna de maximização. */
  objectiveValue: string;
  /** Nomes das colunas, na ordem das colunas da matriz. */
  columns: string[];
  /** Tipo de cada coluna (decisão/folga/excesso/artificial), na mesma ordem de `columns`. */
  kinds: VarKind[];
  /** Variável básica de cada linha (nome). */
  basis: string[];
}

export interface PivotStep {
  iteration: number;
  phase: 1 | 2;
  /** Nome da variável que entra na base (ou null se nenhuma — ótimo atingido). */
  enteringVar: string | null;
  /** Nome da variável que sai da base (ou null). */
  leavingVar: string | null;
  pivotRow: number | null; // índice da linha de restrição
  pivotCol: number | null; // índice da coluna
  tableau: TableauSnapshot;
  /** Explicação didática do que aconteceu neste passo. */
  note: string;
}

export type SolveStatus = 'optimal' | 'unbounded' | 'infeasible';

export interface SimplexResult {
  status: SolveStatus;
  method: 'simplex' | 'two-phase';
  steps: PivotStep[];
  /** Solução: nome da variável de decisão -> valor (fração como string). */
  solution: Record<string, string>;
  /** Valor ótimo do objetivo na orientação ORIGINAL do problema (max/min), fração como string. */
  objectiveValue: string | null;
  /** Mesmo valor, como número de ponto flutuante (para comparações/validação). */
  numericObjective: number | null;
  /** Mensagens didáticas globais (ex.: "problema inviável detectado na Fase 1"). */
  messages: string[];
}
