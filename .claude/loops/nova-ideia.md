# Diário — Novas ideias

Registro das funcionalidades novas entregues pelo loop `/nova-ideia` (uma por rodada).
Cada entrada: o que foi entregue + arquivos, resultado da verificação, e backlog para a
próxima rodada. Veja as regras em [README.md](./README.md).

## Registro

### 2026-06-24 — Aba "Preveja o Pivô" (drill interativo de escolha de pivô)

**O que é:** nova aba que transforma cada iteração do Simplex em um exercício de previsão: o
aluno escolhe um PPL e, a cada quadro, tenta adivinhar **qual variável entra** (Dantzig) e
**qual sai** (razão mínima) antes de o motor revelar. O "reveal" reusa o quadro anotado do
solver (pivô + θ + "Por quê"); ao final, placar de acertos.

**Por que ajuda a aprender:** active recall do coração do método (entrada por custo reduzido
mais negativo; saída pela menor razão). Diferente do Quiz (MCQ conceitual fixo): aqui as
perguntas são geradas do problema real que o aluno escolhe.

**Como o aluno usa:** aba **Preveja o Pivô** → escolhe/cola um PPL → "Iniciar treino" →
responde "quem entra?" e "quem sai?" por iteração → vê o quadro anotado e o placar.

**Arquivos:**
- `src/core/pivotQuiz.ts` (novo) — `buildPivotQuestions(model)`: deriva as perguntas de
  `solve()`, só pivôs de Dantzig (custo reduzido < 0; ignora remoção de artificial), com
  opções (não-básicas para entrar, base para sair) e o `PivotStep` completo para o reveal.
- `src/components/PivotQuizView.tsx` (novo) — máquina de estados entra→sai→reveal; quadro
  somente-leitura na pergunta e `TableauView` no reveal. Reusa classes `lab`/`quiz-*`/`tableau`.
- `src/App.tsx` — aba `pivo` ("Preveja o Pivô").
- `test/pivotQuiz.test.ts` (novo) — 5 testes.
- `README.md` — seção + árvore + testes.

**Verificação (real):**
- `npm run typecheck` → ok.
- `npm test` → **39 testes passam** (5 arquivos). Os 5 novos provam: extração correta do
  clássico (1º entra x2, sai s2), entrante é SEMPRE o custo reduzido mais negativo entre as
  opções (Dantzig), entrante não-básica / sainte básica, saída respeita a razão mínima, e
  inclusão de pivôs de Fase 1 e 2 em duas fases.
- `npm run build` → ok (avisos pré-existentes).

**Princípios respeitados:** UI não recalcula matemática — `buildPivotQuestions` só lê os
passos de `solve()`; o gabarito é o próprio motor; reveal reusa `TableauView`.

**Backlog restante:** análise de sensibilidade (cⱼ/RHS, verificável por perturbação com
`solve()`); exportar a resolução (markdown/imagem); problemas aleatórios com solução
garantida; detector/exemplos de degeneração e empate.

### 2026-06-24 — Folga complementar (complementary slackness) na aba Dualidade

**O que é:** nova seção na aba **Dualidade** que mostra as condições de **folga
complementar** do par primal-dual no ótimo: para cada restrição i (folga_i · y_i) e cada
variável j (x_j · folga_dual_j), exibe os dois fatores e o **produto (= 0)**, com um badge
de confirmação.

**Por que ajuda a aprender:** torna visível o teorema que liga primal e dual — *ou a
restrição está ativa (folga 0), ou seu preço-sombra é 0; ou a variável é usada (x>0), ou sua
restrição dual está ativa*. Fecha o ciclo da dualidade iniciado na rodada anterior.

**Como o aluno usa:** aba **Dualidade** → "Gerar dual" → abaixo dos preços-sombra aparecem as
duas tabelas de folga complementar com todos os produtos zerados (✓).

**Arquivos:**
- `src/core/dual.ts` — `complementarySlackness()` + tipos `CSConstraintPair`/`CSVariablePair`/
  `ComplementarySlackness`. Calcula folgas primais (≤/≥/=), folga da restrição dual (custo
  reduzido) e os produtos, tudo em fração exata.
- `src/components/DualView.tsx` — novo `CSSection` (callout + duas `lab-table`); computa via
  `complementarySlackness()` só quando ambos são ótimos.
- `test/dual.test.ts` — +2 testes (11 no total no arquivo).
- `README.md` — seção Dualidade ampliada + linha de teste.

**Verificação (real):**
- `npm run typecheck` → ok.
- `npm test` → **33 testes passam** (4 arquivos; outras sessões adicionaram anti-cycling e
  mais casos de simplex). Os 2 novos: todos os produtos = 0 em 3 PPLs (max≤, min≥, misto) e
  conferência do clássico (restrição 1 com folga 2 e y1=0; restrições 2/3 ativas com
  y=3/2 e 1; x1,x2>0 com folga dual 0).
- `npm run build` → ok (avisos pré-existentes de `fs`/`child_process` e tamanho do chunk).

**Princípios respeitados:** UI não recalcula matemática — `complementarySlackness()` deriva
de `solve()` + `buildDual()`/`recoverDualValues()`; frações exatas via `frac.ts`.

**Backlog restante:** análise de sensibilidade (cⱼ/RHS); "preveja o próximo pivô"; exportar a
resolução (markdown/imagem); problemas aleatórios com solução garantida.

### 2026-06-24 — Aba "Dualidade" (primal ↔ dual + dualidade forte)

**O que é:** nova aba que constrói o **problema dual** de qualquer PPL digitado, mostra as
regras de transposição (max↔min, restrição→variável dual com seu sinal, variável→restrição
dual, RHS↔custos), resolve o dual reusando o motor e confirma a **dualidade forte**
(`z* primal = z* dual`), exibindo as variáveis duais como **preços-sombra**.

**Por que ajuda a aprender:** dualidade é um dos pilares de PL. Ver o dual gerado
automaticamente, com os sinais corretos das variáveis duais, e a igualdade dos ótimos torna
concreto o teorema da dualidade forte e o conceito de preço-sombra.

**Como o aluno usa:** aba **Dualidade** → escolhe/cola um PPL → "Gerar dual" → lê o primal,
o dual formatado e as regras → vê o badge de dualidade forte (z igual) e a tabela de
preços-sombra.

**Arquivos:**
- `src/core/dual.ts` (novo) — `buildDual()` (forma natural + forma resolvível com todas as
  variáveis ≥ 0; variáveis livres/`≤0` reescritas via `y = u−v` / `y = −w`) e
  `recoverDualValues()` (reconstrói os preços-sombra em fração exata).
- `src/components/DualView.tsx` (novo) — UI autocontida (textarea + exemplos), formatação do
  primal/dual, badges de dualidade forte e tabela de preços-sombra. Reusa classes existentes
  (`lab`, `lab-formula`, `lab-callout`, `lab-table`, `badge`). Sem CSS novo.
- `src/App.tsx` — aba `dual` (botão "Dualidade" + branch de render).
- `test/dual.test.ts` (novo) — 9 testes.
- `README.md` — seção "Dualidade", árvore de arquivos e lista de testes.

**Princípios respeitados:** UI não recalcula matemática — tudo deriva de `solve()` e de
`buildDual()`; frações exatas via `frac.ts`. O dual resolvível é um PPL válido, então o GLPK
o valida (via `solveAndValidate`) — verificação cruzada além da dualidade forte.

**Verificação (real):**
- `npm run typecheck` → ok (sem erros).
- `npm test` → **28 testes passam** (19 anteriores + 9 novos). Os 9 novos cobrem: estrutura
  do dual (sinais, transposta, RHS↔custos), dualidade forte em 4 PPLs (max `≤`, min `≥`,
  igualdade=var livre, misto=var `≤0`) com `z* dual = z* primal` E concordância do GLPK no
  dual, e recuperação dos preços-sombra (clássico → `y=(0, 3/2, 1)`, `z=36`; igualdade → var
  dual livre com valor coerente).
- `npm run build` → ok (avisos pré-existentes: externalização de `fs`/`child_process` do
  `javascript-lp-solver` e tamanho do chunk).

**Conferência numérica:** exemplo clássico de Hillier (max 3x1+5x2) → dual min 4y1+12y2+18y3,
ótimo `z=36` em `y=(0, 3/2, 1)`, que bate com o `z=36` do primal e com o GLPK.

**Backlog para próximas rodadas:**
- **Análise de sensibilidade** simples: intervalos de `cⱼ` e de RHS a partir do quadro final
  (complementa diretamente os preços-sombra desta rodada).
- **Folga complementar** (complementary slackness): destacar, lado a lado, primal×dual, quais
  restrições estão ativas e quais variáveis duais são zero — fecha o ciclo da dualidade.
- **Modo "preveja o próximo pivô"**: dado um quadro, o aluno escolhe quem entra/sai e o
  sistema confere contra `solve()`.
- **Exportar a resolução** (markdown/imagem) dos passos do solver.

**Rejeitadas/adiadas nesta rodada:** editor visual com sliders (escopo > 1 rodada);
comparador "fase única vs duas fases" (o motor já decide automaticamente — baixo valor).
