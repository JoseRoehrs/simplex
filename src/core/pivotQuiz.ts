// Gera perguntas de "preveja o próximo pivô" a partir da resolução real de um PPL.
//
// Cada pergunta corresponde a um pivô de Dantzig do motor: o aluno olha o quadro e
// tenta prever (a) qual variável ENTRA (custo reduzido mais negativo) e (b) qual SAI
// (teste da razão mínima). A resposta correta é exatamente a que `solve()` escolheu —
// o próprio motor é o gabarito; a UI não recalcula nada.

import { solve } from './simplexCore';
import type { LPModel, PivotStep, TableauSnapshot } from './types';

export interface PivotQuestion {
  iteration: number;
  phase: 1 | 2;
  /** Quadro ANTES do pivô (para exibir sem destaque na pergunta). */
  tableau: TableauSnapshot;
  /** Colunas não-básicas — candidatas a entrar. Inclui a resposta correta. */
  enteringOptions: string[];
  /** Variável que realmente entra (gabarito). */
  entering: string;
  /** Índice da coluna que entra (para destacar no teste da razão). */
  enteringCol: number;
  /** Base atual — candidatas a sair. Inclui a resposta correta. */
  leavingOptions: string[];
  /** Variável que realmente sai (gabarito). */
  leaving: string;
  /** Passo completo do motor, para o "reveal" anotado (TableauView). */
  step: PivotStep;
}

/**
 * Constrói a lista de perguntas de pivô de um PPL. Só inclui pivôs de **Dantzig**
 * (custo reduzido da coluna que entra < 0): exclui os pivôs que apenas retiram uma
 * variável artificial (custo reduzido 0) e os passos de parada (ótimo/ilimitado).
 */
export function buildPivotQuestions(model: LPModel): PivotQuestion[] {
  const res = solve(model);
  const out: PivotQuestion[] = [];
  for (const step of res.steps) {
    if (step.enteringVar === null || step.leavingVar === null || step.pivotCol === null) {
      continue;
    }
    // Pivô de Dantzig: a coluna entra porque seu custo reduzido é negativo.
    // fracToString produz "-2/3" / "-2" para negativos → basta checar o sinal.
    const rc = step.tableau.objectiveRow[step.pivotCol];
    if (!rc.startsWith('-')) continue;

    const basis = step.tableau.basis;
    const nonBasic = step.tableau.columns.filter((c) => !basis.includes(c));
    out.push({
      iteration: step.iteration,
      phase: step.phase,
      tableau: step.tableau,
      enteringOptions: nonBasic,
      entering: step.enteringVar,
      enteringCol: step.pivotCol,
      leavingOptions: basis.slice(),
      leaving: step.leavingVar,
      step,
    });
  }
  return out;
}
