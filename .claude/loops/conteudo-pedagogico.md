# Diário — Conteúdo pedagógico

Anti-repetição. Um material pedagógico por rodada (problema do curso, exemplo, explicação,
vídeo, padrão de fração). Releia este diário e `git status` antes de escolher o próximo alvo.
Regra de ouro: **todo ótimo/desfecho afirmado é validado pelo motor (`solveAndValidate`)
antes de publicar** — nunca chutar.

---

## 2026-06-24 (3) — Exemplo INVIÁVEL no solver (chip em EXAMPLES)

**A lacuna:** continuando a completar os casos especiais nos `EXAMPLES` da aba **Resolver**
(round 2 entregou "múltiplos ótimos"), faltava o desfecho **INVIÁVEL** como chip carregável —
com a **visão geométrica** mostrando a região factível **vazia** (restrições que não se
sobrepõem), o badge "✗ inviável" e a mensagem da Fase 1. O inviável existia no catálogo/Workflow
(s10c, round 1), mas não no solver onde vive a geometria + validação GLPK.

**Por que NÃO foi "ilimitado" (descoberta importante):** tentei primeiro um chip **ilimitado**
2-var (mais novo, pois s10a é 3-var e não desenha geometria). Mas ao validar (regra de ouro),
o **GLPK reporta TODO problema ilimitado como `infeasible`** — testei 5 modelos ilimitados
distintos, todos deram `engine=unbounded · jsLP=unbounded · GLPK=infeasible · agrees=false`.
Num chip do solver isso acenderia um **falso badge vermelho "✗ Divergência"**, ensinando errado.
A causa é o mapeamento de status em [glpkSolver.ts](<../../src/solvers/glpkSolver.ts>)
(`mapStatus`: `GLP_NOFEAS/INFEAS/UNDEF → infeasible`) — o glpk.js (WASM) não devolve `GLP_UNBND`
aqui (provável presolve detectando "sem solução"). **É bug de validação, não de conteúdo →
candidato a `/cacar-bugs`** (talvez setar `presolve` ou tratar o caso ilimitado antes do GLPK).
Enquanto isso, **chips ilimitados ficam bloqueados** no solver.

**O que foi adicionado + arquivos:**
- [src/App.tsx](<../../src/App.tsx>) — novo chip **'Inviável (região vazia)'** em `EXAMPLES`:
  `max 2x₁ + 3x₂` s.a. `x₁ + 2x₂ ≤ 4`, `3x₁ + 2x₂ ≥ 18` (mesmo modelo do catálogo s10c, agora
  rodável no solver). Edição isolada no const `EXAMPLES`; não toquei na aba Dualidade nem em
  `simplexCore.ts`/`dual.ts` que sessões paralelas estão editando ao vivo.
- [test/simplex.test.ts](<../../test/simplex.test.ts>) — teste que **parseia o texto do chip**
  e exige `engine=infeasible`, `GLPK=infeasible`, `jsLP=infeasible`, `agrees=true` (guarda
  contra o chip virar algo não-inviável ou divergente do GLPK).

**Como foi validado (desfecho conferido):** rodei o texto do chip por `parseLP` +
`solveAndValidate` no motor atual antes de publicar:
- `engine=infeasible | GLPK=infeasible | jsLP=infeasible | agrees=true`.
- Mensagem da Fase 1: *"...soma das variáveis artificiais = 6 > 0. O problema é INVIÁVEL
  (região factível vazia)."* → o solver mostra **badge verde "✓ Validado pelo GLPK"** (não é
  divergência) + status inviável.
- Build: `npm run typecheck` ✓ · `npm test` ✓ **34/34** (parser 5 · dual 11 [paralelo] ·
  simplex 17, +1 meu) · `npm run build` ✓ (built 386ms; avisos pré-existentes).

**Onde o aluno encontra:** aba **Resolver → chip "Inviável (região vazia)" → Resolver passo a
passo**. Vê status inviável, a mensagem da Fase 1 (W = 6 > 0) e a **visão geométrica** com as
duas restrições sem interseção (sem região sombreada). Com round 2, o solver agora tem chips
para 2 dos 3 desfechos especiais (múltiplos ótimos, inviável); ilimitado depende do bug do GLPK.

**Candidatas pra próxima rodada:**
1. **`/cacar-bugs`: GLPK reporta ilimitado como inviável** (`glpkSolver.mapStatus`). Desbloquearia
   um chip "Ilimitado (max)" 2-var no solver com geometria. **Não é tarefa deste loop** (conteúdo),
   mas anotar bem porque trava conteúdo.
2. **Problema degenerado** (empate no teste da razão; básica = 0). ⚠ Degeneração **não é ensinada**
   hoje (Teoria/Quiz/Colinha não citam) → de baixo valor sozinho; só vale junto de uma explicação
   (e aí seria 2 materiais / talvez `/melhoria-didatica`). Reavaliar.
3. **Igualdade pura** (todas "="), só Fase 1 decidindo viabilidade — variação do s7 sem "≤", isola
   o papel das artificiais. Validar pivôs/ótimo reais antes.
4. **Treino de Frações:** ainda não auditei `FractionTrainer.tsx` — pode faltar um padrão que
   prepare melhor o teste da razão (divisões b ÷ coef). Ler antes de propor.

---

## 2026-06-24 (2) — Exemplo MÚLTIPLOS ÓTIMOS no solver (chip em EXAMPLES)

**A lacuna:** os `EXAMPLES` da aba **Resolver** (App.tsx) tinham só 3 exemplos "normais"
(fase única, duas fases min ≥, igualdade) — **nenhum caso especial**. A aba Resolver é a
superfície mais rica (quadro passo a passo + **visão geométrica** `FeasibleRegion` + validação
GLPK), mas o aluno não tinha como carregar ali um caso de **múltiplos ótimos**, justamente o
desfecho mais sutil: é ensinado em Teoria (callout #8), Quiz e Colinha ("não-básica com
(cⱼ−zⱼ)=0 → ótimos alternativos"), porém nunca era **rodável**. A árvore do Workflow não tem
ramo para "ótimos alternativos" (só ótimo/ilimitado/inviável), então o lugar certo é o solver —
onde a visão geométrica mostra ∇z **paralelo à aresta** ótima, o sinal visual do fenômeno.

**O que foi adicionado + arquivos:**
- [src/App.tsx](<../../src/App.tsx>) — novo chip **'Múltiplos ótimos (max)'** em `EXAMPLES`:
  `max x₁ + 2x₂` s.a. `x₁ + 2x₂ ≤ 8`, `x₁ ≤ 4`, `x₂ ≤ 3`. (Edição isolada no const `EXAMPLES`;
  não toquei na aba Dualidade/`TableauLegend`/`kinds` que sessões paralelas adicionaram.)
- [test/simplex.test.ts](<../../test/simplex.test.ts>) — bloco `describe` de regressão que
  espelha o modelo do chip: (1) ótimo finito **z=8** e concorda com GLPK/jsLP; (2) no quadro
  ótimo existe uma **não-básica com custo reduzido 0** (assinatura dos ótimos alternativos).

**Como foi validado (ótimo conferido):** rodei o modelo pelo motor atual antes de publicar
(o código mudou desde a rodada 1):
- Motor: `status=optimal`, **z=8** em **(2,3)**, `method=simplex` (todas "≤"). O outro ótimo é
  **(4,2)** e todo o segmento `x₁+2x₂=8` entre eles vale z=8.
- Quadro ótimo: `objectiveRow = [0,0,1,0,0]` sobre colunas `[x1,x2,s1,s2,s3]`, base `[x1,s2,x2]`
  → **s₃ não-básica com custo reduzido 0** (entrar s₃ desliza pela aresta ótima até (4,2)).
- **GLPK 5.0 = optimal z=8** e **javascript-lp-solver = optimal z=8** → `agrees: true`.
- Build: `npm run typecheck` ✓ (sem erros) · `npm test` ✓ **30/30** (parser 5 · dual 9 [paralelo]
  · simplex 16, +2 meus) · `npm run build` ✓ (built em 358ms; avisos `fs`/`child_process` e
  chunk-size pré-existentes do `javascript-lp-solver`/bundle).

**Onde o aluno encontra:** aba **Resolver → chip "Múltiplos ótimos (max)" → Resolver passo a
passo**. Vê status ótimo, z=8, a **visão geométrica** com ∇z paralelo à aresta R1 (estrela num
vértice da aresta ótima) e, no quadro final, a não-básica com custo reduzido 0.

**Candidatas pra próxima rodada:**
1. **Problema degenerado** (empate no teste da razão; básica = 0) — caso especial sem exemplo
   rodável; exercita a regra anti-ciclagem (Bland) já no motor. Validar pivôs reais antes.
2. **Caso especial nos `EXAMPLES`: inviável e/ou ilimitado** — completar os chips do solver com
   os outros desfechos (o s10c inviável e o s10a ilimitado existem no catálogo, mas não como
   chip carregável na aba Resolver com visão geométrica).
3. **Igualdade pura** (todas as restrições "="), só Fase 1 decidindo viabilidade — isola o papel
   das artificiais; variação do s7 sem "≤".
4. **Vídeo curado** para "soluções ótimas alternativas" ou "interpretação geométrica do dual"
   (confirmar relevância do link antes de inserir; a aba Dualidade nova dá gancho pro dual).

---

## 2026-06-24 — Problema INVIÁVEL (s10c) — fecha o trio de desfechos

**A lacuna:** a aba **Workflow** desenha a árvore de decisão do Simplex Duas Fases e tem um
nó dedicado **INVIÁVEL** com a ramificação `e_check_infeasible` (rótulo "W > 0"). Mas o
catálogo de problemas (`PROBLEMS`, semanas 7–10) cobria só **ÓTIMO** (vários) e **ILIMITADO**
(s10a) — **nenhum problema era inviável**. Resultado: aquela ramificação nunca acendia, e o
aluno nunca via o desfecho "região vazia" acontecer de verdade, embora ele seja ensinado em
Teoria, Quiz e Colinha. Inviabilidade também não tinha exemplo rodável em lugar nenhum
(nem no catálogo, nem nos `EXAMPLES` do solver).

**O que foi adicionado + arquivos:**
- [src/core/problems.ts](<../../src/core/problems.ts>) — novo `CatalogProblem` **s10c**
  (semana 10, `label: 'Inviável (ilustrativo)'`, `source: 'ILUSTRATIVO'`). Modelo:
  `max 2x₁ + 3x₂` s.a. `x₁ + 2x₂ ≤ 4`, `3x₁ + 2x₂ ≥ 18`. A "≥" obriga a Fase 1; o teto
  `x₁+2x₂≤4` deixa `3x₁+2x₂` no máximo **12**, longe do mínimo **18** exigido → Fase 1 para
  com **W = 6 > 0** → INVIÁVEL. O `note` é honesto: caso-limite **ilustrativo** (não saiu do
  enunciado), para completar os três desfechos e acender a ramificação "W > 0".
- [test/simplex.test.ts](<../../test/simplex.test.ts>) — novo bloco `describe` de regressão
  para s10c: (1) cadastrado na semana 10; (2) motor → `infeasible` via `two-phase` com passo
  de Fase 1; (3) `solveAndValidate` concorda (GLPK + jsLP = inviável); (4) `traceProblem`
  acende o nó `infeasible` e a aresta `e_check_infeasible`.
- **Não toquei:** App.tsx/DualView.tsx (sessão paralela montando uma aba "Dual" ao vivo),
  `simplex-duas-fases/`, `public/`.

**Como foi validado (desfecho conferido):** rodei o modelo pelo motor e por `solveAndValidate`
antes de publicar:
- Motor: `status=infeasible`, `method=two-phase`, mensagem *"Fase 1 terminou com soma das
  variáveis artificiais = 6 > 0. O problema é INVIÁVEL (região factível vazia)."*
- **GLPK 5.0 = infeasible** e **javascript-lp-solver = infeasible** → `agrees: true`.
- `traceProblem`: nó `infeasible` ATIVO, aresta `e_check_infeasible` ATIVA, `phase1` ATIVO.
- Build: `npm run typecheck` ✓ (sem erros) · `npm test` ✓ **19/19** · `npm run build` ✓
  (built em 446ms; avisos de `fs`/`child_process` e chunk-size são pré-existentes do
  `javascript-lp-solver`/bundle, não da mudança). Obs.: durante a rodada o `vite build`
  quebrou 2× por `noUnusedLocals` em App.tsx/DualView.tsx — WIP de sessão paralela, não meu;
  limpou sozinho quando eles ligaram o import.

**Candidatas pra próxima rodada:**
1. **Exemplos de casos especiais nos `EXAMPLES`** do solver (App.tsx) — hoje só há 3 exemplos
   "normais"; nenhum carrega inviável/ilimitado/múltiplos ótimos na aba Resolver (que tem
   quadro + visão geométrica + validação). Começar por **múltiplos ótimos** (`max x₁+2x₂` s.a.
   `x₁+2x₂≤8`, `x₁≤4`, `x₂≤3` → z=8 em (2,3); ótimo alternativo (4,2); ∇z paralelo à aresta R1;
   **já verificado pelo motor**: status optimal, z=8, GLPK+jsLP concordam, não-básica s₃ com
   custo reduzido 0 no quadro final).
2. **Problema degenerado** (empate no teste da razão; básica = 0) — caso especial sem exemplo
   rodável; valida bem a regra anti-ciclagem (Bland) já no motor.
3. **Igualdade pura** (todas as restrições "="), só Fase 1 decidindo viabilidade — variação do
   s7 sem "≤", para isolar o papel das artificiais.
4. **Vídeo curado** para "soluções ótimas alternativas" ou "interpretação geométrica do dual"
   na aba Vídeos (confirmar relevância do link antes de inserir).
