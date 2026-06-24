# Diário — /melhoria-didatica

Anti-repetição. Uma melhoria de clareza/UX por rodada. Releia este diário e `git status`
antes de escolher o próximo alvo.

---

## 2026-06-24 — Quadro CONDENSADO (remover cⱼ / c_B / zⱼ)

**O que faltava:** o resolvedor do app vanilla `simplex-duas-fases/` mostrava o quadro
completo estilo Dantzig/Hillier (linha `cⱼ →`, coluna `c_B`, linha `zⱼ` e `cⱼ − zⱼ`, `θ`).
O usuário nunca tinha visto essa notação ("nunca usei Cj") e pediu uma alternativa. Escolheu,
via pergunta, o **formato condensado**.

**O que mudou e onde:**
- `simplex-duas-fases/js/render.js` — `tableau()` reescrita: cabeçalho de **uma linha**
  (Base · variáveis · b · θ); removidas a linha `cⱼ`, a coluna `c_B` e a linha `zⱼ`; sobra
  **uma** linha de decisão rotulada `w` (Fase 1) / `Z` (Fase 2), valor = custo reduzido
  (`snap.d`), com o valor do objetivo na coluna `b`. `stepCard()` passa `opts.objName`.
  `headerNote` virou um **glossário** ("Como ler o quadro"). Textos de `explain()` e dos
  intros/optimalidade agora dizem "linha de decisão" em vez de "(cⱼ − zⱼ)".
- `simplex-duas-fases/index.html` — seção "5. Anatomia do quadro" reescrita para o formato
  condensado; passos das Fases 1/2, fluxograma do workflow e colinha atualizados; **ponte**
  mantida ("em muitos livros aparece como cⱼ − zⱼ — é a mesma coisa") no glossário e na caixa
  de fórmulas, para reconhecimento em prova. Mini-quadro do hero relabelado `Z`.
- **Não tocado:** `public/`/`js/jogo.js` (Simplex Quest, WIP do usuário) e o app React `src/`.

**Verificação:**
- `node --check js/render.js` → OK.
- Harness Node (carrega `simplex.js` + `render.js`, renderiza): Fase 1 → `w −6 −4 −3 1 0 1 0`,
  obj 30 (bate com o print do usuário); Fase 2 ótima → linha `Z`, z=8 (min 2x₁+3x₂ s.a.
  x₁+x₂≥4, 2x₁+x₂≥5). Zero vazamento de `cⱼ`/`c_B`/`zⱼ` no quadro.
- App React (intocado) como sanity: `npm run typecheck` OK; `npm test` 14/14 passando.

**Candidatas pra próxima rodada:**
1. Coluna `θ` sempre com a fórmula visível (tooltip "b ÷ coef. da coluna que entra") no
   `simplex-duas-fases/`.
2. Levar o glossário/legenda de símbolos também ao app React `src/` (TableauView só mostra
   `zⱼ−cⱼ`, sem explicar) — alinhar com a escolha "condensado".
3. Destacar visualmente, no quadro condensado, QUAL valor da linha de decisão foi escolhido
   para entrar (já há `in-piv-col`; talvez um rótulo "entra" inline).
4. Mini-narrativa "por que esta variável entra/sai" em linguagem ainda mais simples por passo.

---

## 2026-06-24 — Legenda "Como ler o quadro" no app React (símbolos x/s/e/a + zⱼ−cⱼ)

**O atrito:** o `TableauView` do app React mostrava colunas `x1 x2 s1 e1 a1` e uma linha
`zⱼ−cⱼ` **sem nenhuma explicação** — o aluno via os símbolos `s`/`e`/`a` e a linha de decisão
sem saber o que significam nem por que o "mais negativo" é escolhido. O app legado
`simplex-duas-fases/` já ganhou um glossário "Como ler o quadro" (rodada anterior); o React
ficou para trás (candidata #2 do diário).

**O que mudou e onde:**
- `src/core/types.ts` — `TableauSnapshot` ganhou `kinds: VarKind[]` (tipo de cada coluna, na
  ordem de `columns`). Aditivo; único produtor é `snapshot()`.
- `src/core/simplexCore.ts` — `snapshot()` popula `kinds` a partir de `state.columns[].kind`
  (reusa a classificação do motor; a UI **não** adivinha pelo prefixo do nome, que poderia
  colidir com `varNames` customizados).
- `src/components/TableauView.tsx` — novo `KIND_INFO` (símbolo/legenda/dica por `VarKind`) e
  componente exportado `TableauLegend` que mostra só os tipos **presentes** no problema + o
  significado de `b` e de `zⱼ−cⱼ` (regra de Dantzig: entra a mais negativa; tudo ≥ 0 ⇒ ótimo).
  Cabeçalhos de coluna, `b` e a linha `zⱼ−cⱼ` ganharam `title` (tooltip) explicativo.
- `src/App.tsx` — `Steps` renderiza `<TableauLegend>` **uma vez** (do 1º quadro), logo abaixo
  do título "Iterações", evitando repetir a legenda em cada iteração.
- `src/styles.css` — `.tableau-legend` / `.tl-sym` (chips monospace por tipo, cores nos tokens
  existentes: decisão=accent, folga=ok, excesso=accent-2, artificial=warn).

**Verificação:**
- `npm run typecheck` → limpo (0 erros nos arquivos alterados).
- `npm test` → **16/16 passando**, incluindo o teste que valida o ótimo contra GLPK
  (`ótimo = 8 (motor) confere com 8 (GLPK)`). Correção matemática intacta — só passei o
  `kind` adiante e apresentei; nada recalculado na UI.
- `npm run build` → `tsc -b && vite build` ✓ (built in ~390ms).
- Nota: durante a rodada, uma sessão paralela (provável `/cacar-bugs`) trocou
  `test/_fuzz.test.ts` por `_verify_multiopt.test.ts` — o erro de tipo transitório que vi era
  daquele arquivo, não do meu diff; sumiu sozinho.

**Candidatas pra próxima rodada:**
1. Destacar na linha `zⱼ−cⱼ` qual célula é o **mais negativo** escolhido (hoje só o fundo da
   coluna do pivô é tingido; um rótulo "entra" inline conecta a regra de Dantzig ao valor).
2. Mostrar `kinds` também na `FeasibleRegion`/`WorkflowView` ou tooltip ligando vértice↔quadro.
3. Tornar a `TableauLegend` colapsável (`<details>`) p/ alunos avançados, aberta por padrão.
4. Legenda da coluna `θ` (teste da razão) com a fórmula `b ÷ coef.` também como chip, alinhando
   com o glossário do app legado.

---

## 2026-06-24 — Ponte álgebra↔geometria: ponto (vértice) em cada quadro (app React)

**O atrito:** o app React tinha a visão geométrica (`FeasibleRegion`) E os quadros passo a passo,
mas NADA ligava um ao outro — exatamente a candidata #2 da rodada anterior ("tooltip ligando
vértice↔quadro"). O aluno via o vértice "1" no gráfico e a "Iteração 1" no quadro sem perceber
que são **o mesmo ponto** `(x1, x2)`. A legenda do gráfico até afirmava "corresponde a um quadro
acima", mas o quadro não exibia sua coordenada — a ponte existia só no texto.

**O que mudou e onde (só apresentação — lê `basis`/`rhs`/`kinds` do snapshot, NÃO recalcula):**
- `src/App.tsx` — novo helper `vertexLabel(tableau)` (valor de cada coluna `kind==='decision'`:
  básica → seu RHS, senão 0) e um **chip "ponto (x1, x2) = (…)"** no `step-head` de cada quadro,
  com `title` explicando que cada quadro é um ponto/vértice. Import de `TableauSnapshot`.
- `src/components/FeasibleRegion.tsx` — cada vértice ganhou `<title>` SVG (hover → `ponto i:
  (x1, x2) = (…)`, com "— ótimo" no último); caption reescrita: "é o mesmo ponto mostrado em cada
  quadro abaixo (passe o mouse num vértice para ver as coordenadas)".
- `src/styles.css` — `.point-chip` (pílula accent, monospace, `cursor: help`, `margin-left:auto`).

**Verificação:**
- `npm run typecheck` → **zero erros** (um erro transitório em `DualView.tsx` de sessão paralela
  sumiu sozinho durante a rodada; não toquei nesse arquivo).
- `npm test` → **19/19** passando.
- `npm run build` → **OK** (só o aviso pré-existente de chunk > 500 kB).
- Ponte conferida: para o exemplo padrão, `vertexLabel` por passo = `(0,0) → (0,6) → (2,6)` —
  idêntico ao caminho que o `FeasibleRegion` desenha (mesma fonte de dados) e ao ótimo do motor (z=36).

**Candidatas pra próxima rodada:**
1. Sincronizar o número do vértice no gráfico com o nº da Iteração (o gráfico deduplica pontos
   consecutivos, então os índices podem divergir em problemas com passos repetidos/degenerados).
2. Realçar na linha `zⱼ−cⱼ` a célula do custo reduzido MAIS negativo (a que entra) — fecha o
   "porquê" da regra de Dantzig dentro do próprio quadro (candidata recorrente #1).
3. Mini-narrativa por passo em linguagem simples ("x2 melhora z em 5/unidade e cabe até 6 → entra").
4. Levar o mesmo chip "ponto" ao quadro condensado do app legado `simplex-duas-fases/`.

---

## 2026-06-24 — Destaque do custo reduzido MAIS negativo na linha zⱼ−cⱼ (regra de Dantzig)

**O atrito:** o quadro do app React já destacava a *coluna* que entra (fundo âmbar) e o *pivô*
na restrição, mas a célula da linha `zⱼ−cⱼ` que **justifica** a escolha — o custo reduzido mais
negativo — não tinha destaque próprio. O aluno via "entra x2" no cabeçalho do passo e a coluna
âmbar, mas não conectava isso ao **número específico** (o mais negativo) que dispara a regra de
Dantzig. Era a candidata recorrente nº 1 de três rodadas seguidas e item explícito do checklist
de auditoria ("o custo reduzido mais negativo está destacado na linha z?").

**O que mudou e onde (só apresentação — lê `pivotCol`/`enteringVar`/`objectiveRow`, NÃO recalcula):**
- `src/components/TableauView.tsx` — na linha `obj-row`, a célula em `j === pivotCol` ganhou a
  classe `entering-rc`, um marcador inline `↑ entra` (`.rc-flag`, seta `aria-hidden`) e um
  `title` explicando "custo reduzido mais negativo (valor) → <var> entra (Dantzig)". No ótimo,
  `pivotCol === null` ⇒ nada destacado (coerente: todos os rc ≥ 0). A legenda "Como ler o quadro"
  passou a dizer "entra a mais negativa (…, destacada no quadro)", com "mais negativa" em âmbar
  (`.tl-enter`) para casar com o destaque.
- `src/styles.css` — `.tableau .obj-row td.entering-rc` (âmbar forte + bold), `.rc-flag` (badge
  minúsculo em `--warn`), `.tl-enter` (cor âmbar no texto da legenda).

**Por que é correto:** `simplexCore.ts` (linha ~181) escolhe a coluna que entra estritamente
pelo **custo reduzido mais negativo** (Dantzig), e exige `rc < 0`. A célula destacada é
`objectiveRow[pivotCol]` = exatamente esse `best`; nada é recalculado na UI.

**Verificação:**
- `npm run typecheck` → EXIT 0 (limpo).
- `npm test` → **28/28** passando (inclui os testes de dualidade adicionados por sessão paralela).
- `npm run build` → `tsc -b && vite build` ✓ (só o aviso pré-existente de chunk > 500 kB).

**Candidatas pra próxima rodada:**
1. Mini-narrativa por passo em linguagem simples ("x2 melhora z em 5/un. e cabe até 6 → entra,
   sai s2"), reusando `note`/`PivotStep`.
2. Levar o mesmo destaque do custo reduzido mais negativo ao quadro condensado do app legado
   `simplex-duas-fases/` (linha de decisão `w`/`Z`).
3. Sincronizar o número do vértice no `FeasibleRegion` com o nº da Iteração (degenerados divergem).
4. Tornar a `TableauLegend` colapsável (`<details>`, aberta por padrão) para alunos avançados.

---

## 2026-06-24 — Vértice do gráfico numerado pela ITERAÇÃO (não pela ordem deduplicada)

**O atrito:** a `FeasibleRegion` numerava os vértices 0,1,2… pela ordem de visita **após
deduplicar** pontos consecutivos, enquanto os quadros abaixo dizem "Iteração N" (contador global
do motor, que conta as duas fases e os passos de saída de artificiais). Em problemas de duas
fases / degenerados os dois índices **divergem** — então a legenda que eu mesmo escrevi na rodada
da "ponte ponto↔quadro" ("é o mesmo ponto mostrado em cada quadro abaixo") podia apontar para o
quadro errado. Era a candidata #3 recorrente e um bug de consistência da própria ponte.

**O que mudou e onde (`src/components/FeasibleRegion.tsx`, só apresentação):**
- Troquei `rawPath/dedupConsecutive` por uma lista de **nós** `{ pt, iters[] }`: cada passo vira um
  ponto rotulado com `step.iteration`; pontos consecutivos iguais são fundidos guardando o
  **intervalo** de iterações. `pathPts = nodes.map(n => n.pt)` alimenta escala e polilinha.
- Rótulo do nó = `iterLabel(iters)`: o nº da iteração, ou `a–b` quando o ponto não mudou entre
  iterações (ex.: troca Fase 1→2, degeneração). `<title>` agora diz "Iteração X: (x1,x2)=(…)".
- Removi o helper `dedupConsecutive` (virou morto → erro de `noUnusedLocals`); entrou `iterLabel`.
- Legenda do caminho: "(0 → 1 → 2…)" → "(nº = iteração)". Caption reescrita explicando o rótulo `a–b`.

**Verificação:**
- `npm run typecheck` → **zero erros**. `npm test` → **30/30**. `npm run build` → OK (só aviso de chunk).
- Conferência do mapeamento (réplica em teste descartável): single-phase → `0,1,2` em
  (0,0)/(0,6)/(2,6); two-phase → `0, 1, 2–3, 4` — o ponto degenerado (1,3) das iterações 2 e 3
  funde em **2–3**, e o ótimo (4,0) fica como **4**. Bate 1:1 com o "Iteração N" dos quadros.

**Candidatas pra próxima rodada:**
1. Mini-narrativa por passo em linguagem simples ("x2 melhora z em 5/un. e cabe até 6 → entra,
   sai s2"), reusando `note`/`PivotStep` (candidata recorrente — ainda não feita).
2. Levar o destaque do custo reduzido mais negativo ao quadro condensado do app legado.
3. Tornar a `TableauLegend` colapsável (`<details>`, aberta por padrão).
4. No `FeasibleRegion`, leve realce do vértice quando o quadro correspondente está em foco
   (ligação visual bidirecional gráfico↔quadro) — exige estado de hover compartilhado.

---

## 2026-06-24 — "História do pivô" em linguagem simples (+ correção do destaque em passos de artificial)

**O atrito:** cada passo mostrava só a `note` técnica do motor ("Entra x2 (custo reduzido −5),
sai s1 (menor razão 6).") — números sem **interpretação**. Era a candidata recorrente nº 1, três
rodadas seguidas "ainda não feita", e o item de auditoria "a transição entre quadros conta a
história do pivô?". **Bug colateral descoberto:** os passos de *retirada de artificial*
(`driveOutArtificials`) tiram o snapshot com **custo zero** (`reducedCosts(state, zeroCost)` ⇒
todos os rc = 0), mas tinham `pivotCol` setado — então o destaque "↑ entra / custo reduzido mais
negativo (0) → Dantzig" que adicionei na rodada anterior **mentia** nesses passos (rc 0 não é
"mais negativo", e a variável não entra por Dantzig).

**O que mudou e onde (só apresentação — reusa `objectiveRow`/`ratios`/`note`, NÃO recalcula):**
- `src/components/TableauView.tsx` —
  - `isDantzig = pivotCol!=null && isNeg(objectiveRow[pivotCol])` distingue um pivô de Dantzig
    de um passo de retirada de artificial (rc todos 0). **`showRatio` e o destaque `entering-rc`
    (+ "↑ entra") agora são gated por `isDantzig`** → corrige o rótulo falso da rodada anterior e
    esconde o teste da razão (que não se aplica) nos passos de artificial.
  - Novo bloco `.pivot-why` (💡 "Por quê:") com 4 ramos: **Dantzig** (entra a mais negativa,
    cresce até θ, quem zera sai), **ilimitado** (sem coef. positivo), **retirada de artificial**
    (entra p/ tirar a artificial do nível 0, sem mexer no objetivo) e **fallback** = `step.note`
    (ótimo / fim de fase / limite de iterações). Componente passou a retornar `<>…</>`.
- `src/App.tsx` — removida a linha `<p className="note">{step.note}</p>` (agora a explicação por
  passo vive dentro do `TableauView`, uma única por quadro, sem duplicar com o cabeçalho).
- `src/styles.css` — `.pivot-why` (callout com borda âmbar à esquerda).

**Verificação:**
- `npm run typecheck` → EXIT 0. `npm test` → **34/34**. `npm run build` → **EXIT 0** (só aviso de chunk).
- Sanity do motor (réplica descartável), min 2x₁+3x₂ s.a. x₁+x₂≥4, 2x₁+x₂≥5:
  `it0/it1` (Fase 1) e `it3` (Fase 2) têm `rc@pc<0` ⇒ `isDantzig=true` (história rica);
  `it2/it4` têm `pivotCol=null` ⇒ fallback `note`; z=8 (bate com GLPK). Ramo de artificial validado
  por construção: snapshot de custo zero ⇒ `isDantzig=false` ⇒ ramo "retirada de artificial".

**Candidatas pra próxima rodada:**
1. Levar o destaque do custo reduzido mais negativo + "porquê" ao quadro condensado do app legado.
2. Tornar a `TableauLegend` colapsável (`<details>`, aberta por padrão).
3. `FeasibleRegion`: realçar o vértice quando o quadro correspondente está em foco (hover compartilhado).
4. Mostrar no `.pivot-why` o ganho no objetivo por unidade com a orientação correta (max/min) —
   exige cuidado com a convenção interna de maximização; hoje uso "mais aproxima do ótimo" (seguro).

---

## 2026-06-24 — "Por quê" amigável nos passos de PARADA (ótimo / fim de Fase 1 / INVIÁVEL)

**O atrito:** a rodada anterior deu um "💡 Por quê" em linguagem simples para os passos de
**pivô** (Dantzig, ilimitado, retirada de artificial), mas o ramo `else` do `story` (em
`TableauView`) — justamente os passos de **parada**, `pivotCol === null` — caía num
`<p className="note">{note}</p>` técnico e cru. Pior: o passo mais importante de todos, quando a
**Fase 1 termina sem zerar as artificiais** (problema **inviável**), não tinha explicação ligando
o "W > 0" ao veredito "INVIÁVEL" ali no próprio quadro — só a mensagem global lá em cima.

**O que mudou e onde (`src/components/TableauView.tsx`, só apresentação — lê campos do passo):**
- Reescrevi o ramo `else` do `story` para dar o mesmo `.pivot-why` amigável dos outros, com 3 casos:
  - **Fase 1 + `tableau.objectiveValue === '0'`** (no ótimo da Fase 1, esse valor = −W) → "zeramos
    as artificiais ⇒ ponto factível ⇒ começa a Fase 2".
  - **Fase 1 + `objectiveValue !== '0'`** → "não zeramos as artificiais (soma > 0) ⇒ **não existe
    ponto factível** ⇒ **INVIÁVEL**".
  - **Fase 2** → "nenhum custo reduzido negativo ⇒ nenhuma variável melhora ⇒ **ótimo** (o canto
    onde o Simplex para)".
- Removi `note` da desestruturação de `step` (era a última referência → evitaria `noUnusedLocals`).
  Reusa a classe `.pivot-why` já existente — zero CSS novo.

**Por que é correto:** `simplexCore` empilha o passo ótimo da Fase 1 com `objectiveValue =
objectiveValue(state, phase1Cost) = −(soma das artificiais)`; o motor então declara inviável sse
essa soma ≠ 0. Logo `objectiveValue === '0'` ⇔ factível — o mesmo critério do motor, só lido.

**Verificação:**
- `npm run typecheck` → **zero erros**. `npm test` → **34/34**. `npm run build` → OK (só aviso de chunk).
- Ramos conferidos (teste descartável): inviável (`max x1+x2 s.t. x1+x2≤2, x1+x2≥5`) → último passo
  Fase 1, `enteringVar=null`, `objectiveValue='-3'` (≠'0') ⇒ ramo INVIÁVEL; two-phase factível →
  passo ótimo da Fase 1 com `objectiveValue='0'` ⇒ ramo "→ Fase 2"; passo final = ótimo da Fase 2.

**Candidatas pra próxima rodada:**
1. Levar o destaque do custo reduzido + "porquê" ao quadro condensado do app legado `simplex-duas-fases/`.
2. Tornar a `TableauLegend` colapsável (`<details>`, aberta por padrão).
3. `FeasibleRegion`: realçar o vértice quando o quadro correspondente está em foco (hover compartilhado).
4. Mostrar no `.pivot-why` o ganho por unidade com a orientação correta (max/min) — convenção interna.

> Observação: backlog do `/melhoria-didatica` no app React está ficando raso (6+ rodadas hoje,
> várias sessões em paralelo). Próximos alvos de maior valor tendem a ser no app legado
> `simplex-duas-fases/` ou em outros loops (`/conteudo-pedagogico`, `/cacar-bugs`).

---

## 2026-06-24 — Coluna θ auto-explicativa no app LEGADO (`simplex-duas-fases/`)

**O atrito:** no quadro condensado do app legado, a coluna do teste da razão tinha só o
cabeçalho `θ` e células com a razão crua (a escolhida em `<b>…</b> ◄`). Um aluno via os números
sem saber **de onde vêm** (θ = b ÷ coeficiente da coluna que entra) nem por que uma linha fica
`—`. O `explain()` mencionava "menor b/coluna positiva", mas a **coluna em si** não se explicava.
Era a candidata nº 1 da **primeira** rodada do diário ("coluna θ com a fórmula visível") — nunca
feita. Atacar o app legado também evita colidir com as várias sessões paralelas mexendo no React.

**O que mudou e onde (`simplex-duas-fases/js/render.js`, função `tableau()` — só apresentação):**
- **Cabeçalho da coluna θ** deixou de ser `θ` e virou `θ = b ÷ <var que entra>` (sempre visível,
  como no app React), com `title` explicando a regra: menor razão ≥ 0 (◄) sai; coef. ≤ 0 fica fora (—).
- **Cada célula da razão** ganhou `title` com a conta exata: `b ÷ coef = θ` (reusa `snap.ratios[i]`
  já calculado pelo motor — só mostra os operandos `snap.b[i]` e `snap.A[i][entering]` e o resultado
  do motor; **não recalcula**). A linha escolhida acrescenta "menor razão ≥ 0, por isso SAI"; as
  linhas `—` explicam "coeficiente ≤ 0: não limita o crescimento, fora do teste".
- Respeitou o design do legado: sem emoji, sem CSS/vars novos, `title` em texto puro (nomes via
  `label+sub`, pois `vname()` traz `<sub>`).

**Verificação:**
- `node --check js/render.js` → OK; `node --check js/simplex.js` → OK.
- Harness Node (carrega `simplex.js`+`render.js`, `Render.solution` em min 2x₁+3x₂ s.a. x₁+x₂≥4,
  2x₁+x₂≥5): cabeçalho inline `θ = b ÷ …` presente; tooltip de célula = `title="4 ÷ 1 = 4"`;
  tooltips "menor razão SAI" e "fora do teste" presentes; banner ótimo renderiza (Z = …).
- Sanity do repo React (intocado): `npm run typecheck` 0, `npm test` **39/39**, `npm run build` 0.

**Candidatas pra próxima rodada:**
1. Levar o destaque do custo reduzido mais negativo (célula da linha de decisão `w`/`Z`) ao app
   legado — espelha o `entering-rc` do React (a coluna já é tingida, falta marcar a célula).
2. `FeasibleRegion` (React): realçar o vértice quando o quadro correspondente está em foco.
3. Tornar a `TableauLegend` (React) colapsável (`<details>`, aberta por padrão).
4. Revisar `explain()` do legado: a razão do "Sai da base" usa divisão em float
   (`snap.b/snap.A`) — conferir se aparece como fração exata (possível alvo de `/cacar-bugs`).

---

## 2026-06-24 — Célula que ENTRA destacada na linha de decisão (app LEGADO `simplex-duas-fases/`)

**O atrito (= candidata #1 recorrente):** no quadro condensado do app legado — o que o usuário de
fato usa — a **coluna** que entra é tingida (`in-piv-col`, azul), mas a **célula** específica da
linha de decisão (`w`/`Z`) que dispara a escolha (o valor extremo de `snap.d[entering]`, regra de
Dantzig) não tinha marca própria. O React já fazia isso (`entering-rc`); o legado ficou para trás.

**O que mudou e onde (só apresentação — usa `snap.entering`/`snap.pivot` que o motor já produz):**
- `simplex-duas-fases/js/render.js` — na linha de decisão (`drow`) do `tableau()`, a célula
  `dd === entering` (somente quando há pivô: `piv` verdadeiro) recebe a classe `dec-enter`, um
  marcador inline ` <span class="ent-mark">◄</span>` (mesmo glifo `◄` já usado na linha do θ que
  SAI) e um `title` explicando "valor decisivo → entra (Dantzig); quem sai vem do teste da razão".
- `simplex-duas-fases/css/styles.css` — `table.tableau .drow td.dec-enter` em **âmbar**
  (`--amber-l`/`--amber-d` + `box-shadow inset 2px`), com `!important` e ordem após `in-piv-col`
  para vencer o tingimento azul da coluna. Sem emoji (convenção do app legado).

**Por que é seguro:** `simplex.js` só define `snap.entering ≥ 0` em passos de pivô; no ótimo
`entering = -1` e `snap.pivot` é `undefined`. Gatilho `piv && dd === entering` ⇒ marca só os
pivôs reais, nunca o quadro ótimo. Nada recalculado — apenas leio o índice que o motor escolheu.

**Verificação:**
- `node --check js/render.js` e `js/simplex.js` → OK.
- Harness Node (`Render.solution` no min 2x₁+3x₂ s.a. x₁+x₂≥4, 2x₁+x₂≥5): 5 linhas de decisão,
  **3 marcadas** (os pivôs), **última (ótimo) NÃO marcada**, glifo `◄` presente, exatamente 1
  célula marcada por passo. ✓
- Sanity do app React (intocado): `npm run typecheck` 0 erros, `npm test` **39/39**.

**Candidatas pra próxima rodada:**
1. `FeasibleRegion` (React): realçar o vértice quando o quadro correspondente está em foco (hover compartilhado).
2. Tornar a `TableauLegend` (React) colapsável (`<details>`, aberta por padrão).
3. Legado: a razão do "Sai da base" em `explain()` usa divisão float (`snap.b/snap.A`) em vez de
   fração exata — melhor como `/cacar-bugs`, mas a apresentação pode mostrar `toFrac` (já há helper).
4. Backlog raso: considerar pausar `/melhoria-didatica` ou migrar valor para `/conteudo-pedagogico`.

---

## 2026-06-24 — Workflow: auto-rolar o canvas para o CAMINHO ACESO ao resolver (app React)

**O atrito:** a aba **Workflow** (`WorkflowView`) é um fluxograma grande e pannável da árvore de
decisão do Simplex Duas Fases. Ao clicar "Resolver pelo workflow", o caminho do problema **acende
nó a nó** — mas o canvas continuava na posição em que estava (zoom 0.7, scroll onde o usuário
deixou). Em vários problemas o caminho aceso ficava **fora da viewport**, então o aluno via o
mesmo fluxograma "apagado" e não percebia que algo acendeu. O item de auditoria "o caminho aceso
está legível?" falhava por pura posição de scroll. (Os alvos óbvios dos quadros — React e legado —
já estão cobertos por 8+ rodadas hoje; fui para uma área calma e ainda não auditada.)

**O que mudou e onde (`src/components/WorkflowView.tsx`, componente `Canvas` — só apresentação):**
- Novo `useEffect([trace])`: ao chegar um `trace` novo, calcula o **centro do bounding-box dos nós
  ativos** (`FLOW_NODES.filter(activeNodes)`, posições estáticas) e dá `el.scrollTo` centralizando-o
  na viewport (`cx*zoom − clientWidth/2`, idem vertical, com `Math.max(0, …)`). Depende **só de
  `trace`** (rola ao resolver, não a cada zoom). Respeita `prefers-reduced-motion` (`behavior:'auto'`
  vs `'smooth'`). Não recalcula matemática — lê posições do layout e o `activeNodes` que o motor produz.

**Verificação:**
- `npm run typecheck` → **0**. `npm test` → **43/43**. `npm run build` → **0** (só aviso de chunk).
- Lógica conferida: o `scrollTo` usa `clientWidth/Height` do container `.wf-canvas` e o `zoom` atual;
  caminho aceso (centro do bbox dos nós ativos) cai no centro da área visível. Efeito puramente de
  scroll — pior caso, centraliza levemente fora; nunca quebra estado/correção.

**Candidatas pra próxima rodada (backlog raso — ler aviso abaixo):**
1. `FeasibleRegion` (React): realçar o vértice quando o quadro correspondente está em foco (hover compartilhado).
2. Tornar a `TableauLegend` (React) colapsável (`<details>`, aberta por padrão) — valor baixo.
3. Workflow: pequena **legenda das cores/kinds** dos nós — MAS hoje há descasamento `kind`↔CSS
   (`flowTrace` usa `io/switch/case/process/end-bad/end-good`; CSS tem `.kind-start/phase1/phase2/end`
   mortos). Limpar isso é `/saude-codigo`/`/cacar-bugs` antes de legendar.

> **Saturação:** este foi um round "magro" — os alvos de quadro (React e legado) estão esgotados e
> os restantes são de baixo valor ou colidem com sessões paralelas (o `styles.css` foi todo
> redesenhado no meio das rodadas). Se a **próxima** rodada também não achar atrito que valha a pena,
> **encerrar `/melhoria-didatica`** e migrar esforço para `/conteudo-pedagogico` ou `/cacar-bugs`
> (regra de ouro 8: 2 rodadas magras seguidas ⇒ parar).
