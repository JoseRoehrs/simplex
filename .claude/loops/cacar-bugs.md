# Diário — Caça a bugs

Registro das rodadas de caça a bugs do motor Simplex (`/cacar-bugs`). Um bug por rodada,
sempre com teste de regressão que falha-antes/passa-depois. Referências (GLPK, jsLP) são o
gabarito; o motor é o suspeito.

---

### 2026-06-24 — Sem divergências (passada 2) → loop PAUSADO (critério de parada atingido)

Segunda rodada limpa consecutiva. Sweep focado nos status que estavam sub-amostrados:

- **36.000 PPLs** com viés forte para **inviável** e **ilimitado** (e dois fases), comparando
  status motor × GLPK com concordância obrigatória do jsLP. Distribuição obtida:
  `optimal=8.586, infeasible=20.108, unbounded=7.306`. Resultado: **0** divergências de status,
  **0** divergências de ótimo, **0** estouros de `MAX_ITER`, **0** crashes. Inclui ilimitação e
  inviabilidade detectadas em problemas de **duas fases** (com artificiais).

**Critério de parada atingido.** Duas passadas adversariais consecutivas (passada 1 + passada 2)
sem nenhuma divergência. Somando as rodadas: **>100.000 PPLs** (inteiros pequenos/grandes,
decimais, degenerados, inviáveis, ilimitados), **15.000 round-trips de parser** e **14.000
verificações de invariantes de tableau** — o motor bate com a referência (GLPK) em toda a
bateria, e cada quadro intermediário está em forma canônica com `b ≥ 0`.

**→ Loop `/cacar-bugs` pausado.** Os 2 bugs reais desta sessão (termos repetidos no parser;
ciclagem de Beale) estão corrigidos e cobertos por testes de regressão. Recomendação: migrar o
esforço para `/melhoria-didatica` ou `/nova-ideia`. Reabrir a caça se o motor mudar
substancialmente (novo método, mudança em `frac.ts`, suporte a variáveis livres etc.).

**Para retomar:** `/loop /cacar-bugs` — e priorizar as suspeitas remanescentes abaixo (passada 1),
em especial decidir o escopo de **fração no input do parser** (o único candidato a bug real que
sobrou, mas ambíguo quanto a escopo).

---

### 2026-06-24 — Sem divergências (passada 1 de caça limpa)

Rodada sem bug encontrado. Após os fixes de termos repetidos (parser) e anti-ciclagem (Bland),
uma varredura adversarial ampla não achou nenhuma divergência:

- **Motor × GLPK — ~71.000 PPLs**: coeficientes inteiros pequenos (−2..2, degenerados),
  decimais "feios" (0.25, 0.1, 1.5, …) e inteiros grandes (até ±997, p/ inchar denominadores e
  estressar `fraction.js`). Resultado: **0** divergências de status/ótimo, **0** soluções
  inviáveis, **0** estouros de `MAX_ITER` (nenhuma ciclagem sobrevivente).
- **Parser — 15.000 round-trips texto→modelo** com formatação variada (`2x1`, `2 x1`, `+3x2`,
  `- x3`, `3*x1`, sinais e espaços aleatórios): **0** divergências de coeficiente (descontando
  corretamente o descarte legítimo de linhas de não-negatividade `x_i >= 0`).
- **Tableaux passo a passo — 14.000 PPLs × todos os passos**: invariantes mantidos em **todos**
  os quadros registrados — cada variável básica é vetor unitário (forma canônica) e `b ≥ 0`.
  Garante que não só o resultado final, mas cada passo pedagógico, está correto.

**Verificação:** `npm test` → 34 verdes (4 arquivos, com testes de sessões paralelas). Nenhuma
mudança de código nesta rodada (apenas fuzzers temporários, já removidos).

> **Critério de parada:** esta é a **passada 1** de caça limpa. Se a **próxima** rodada também
> não achar divergência, sugiro pausar o loop `/cacar-bugs` (o motor estará validado contra a
> referência em toda a bateria) e migrar o esforço para `/melhoria-didatica` ou `/nova-ideia`.

**Suspeitas remanescentes (caso a próxima rodada queira insistir antes de pausar):**
1. **Fração no INPUT do parser** (`x1 <= 1/2`, `max 1/3 x1`): hoje `parseFloat('1/2')=1` e
   `1/2x1` é descartado silenciosamente. Só é bug se entrada fracionária for escopo — os
   exemplos da UI usam inteiros/decimais, então é ambíguo. Decidir e, se for escopo, suportar.
2. **Tooltip "Regra de Dantzig"** fixo em [TableauView.tsx:162](../../src/components/TableauView.tsx)
   mesmo após troca para Bland (cosmético/UI, não-correção).
3. **Constante na função objetivo** (`max 3x1 + 10`): o `+10` é descartado por motor e GLPK
   igualmente (não diverge), mas o z reportado ignora o deslocamento. Provavelmente aceitável
   p/ ferramenta didática; documentar a decisão.

---

### 2026-06-24 — Ciclagem (Beale): motor retorna z=0 "ótimo" num problema com ótimo 1/20

**Sintoma.** Em problemas degenerados, a regra de Dantzig (entrar pelo custo reduzido mais
negativo) **cicla** — a base volta a um estado já visitado e o algoritmo nunca converge. O
motor batia na trava `MAX_ITER=200` e retornava `status: 'optimal'` com o quadro atual, que
estava **errado**.

PPL que disparava (exemplo clássico de Beale):
```
max 0.75 x4 - 150 x5 + 0.02 x6 - 6 x7
0.25 x4 - 60 x5 - 0.04 x6 + 9 x7 <= 0
0.5  x4 - 90 x5 - 0.02 x6 + 3 x7 <= 0
x6 <= 1
```
- Motor (antes): `optimal`, **z = 0**, todas as variáveis em 0, após 201 passos (estouro de
  iterações). Gabarito GLPK: **z = 0.05 = 1/20** em x6 = 1. Resultado do motor simplesmente
  errado e rotulado como ótimo — exatamente "quadro errado ensina errado".

> A divergência é numérica e o motor é o culpado: GLPK dá 1/20, o motor dá 0. (jsLP reportou
> `infeasible` neste caso — ele é o solver mais fraco; GLPK é o gabarito.)

**Causa raiz.** Em `runSimplex` ([src/core/simplexCore.ts](../../src/core/simplexCore.ts)) a
regra de **entrada** era Dantzig puro (mais negativo). Só o desempate de **saída** era à la
Bland. O teorema anti-ciclagem de Bland exige a regra de menor índice aplicada de forma
consistente na entrada **e** na saída — Dantzig na entrada não impede ciclagem. A trava
`MAX_ITER` evitava loop infinito, mas mascarava o problema retornando um "ótimo" falso.

**Correção.** Mantida a regra de Dantzig como padrão (boa pedagogia), com **fallback para a
regra de Bland**: contamos pivôs degenerados consecutivos (razão mínima = 0, base muda mas o
objetivo não); ao passar de um limiar (`nº de colunas + nº de linhas`), trocamos a regra de
ENTRADA para "menor índice de coluna com custo reduzido negativo" e a mantemos até o fim da
fase (a garantia de Bland exige aplicação consistente). O desempate de saída já era Bland.
Um passo informativo é registrado quando a troca ocorre (pedagogia: explica a degeneração).

**Teste adicionado.** `test/anti-cycling.test.ts` → resolve Beale e exige `z = 1/20`, `x6 = 1`,
e que o último passo **não** seja a mensagem de "Limite de iterações". Falhava antes (`z='0'`),
passa depois.

**Verificação.**
- `npm run typecheck` → limpo.
- `npm test` → 31 passados (4 arquivos; inclui testes de sessões paralelas — `dual.test.ts` etc.).
- `npm run build` → OK (avisos de chunk > 500 kB são pré-existentes).

**Docs.** Sem vault `docs/` nem CLAUDE.md de projeto — nada a atualizar.

**Suspeitas para a próxima rodada.**
1. **Tooltip da UI desatualizado**: [TableauView.tsx:162](../../src/components/TableauView.tsx)
   fixa "Regra de Dantzig" no cabeçalho da coluna de entrada — após a troca para Bland fica
   impreciso. É cosmético (UI), mas vale alinhar com o passo do motor.
2. **Limiar de Bland** (`n + m`): conferir se é cedo/tarde demais em problemas maiores;
   procurar um degenerado onde o fallback dispare desnecessariamente (correto, mas muda o
   caminho pedagógico) ou tarde demais (perto de MAX_ITER).
3. **`driveOutArtificials` com linha redundante** (`pc === -1`): artificial fica na base em
   nível 0 e segue para a Fase 2 — testar custos reduzidos e extração da solução nesse caso.
4. **Fase 1 também pode ciclar?** O fallback de Bland agora vale para ambas as fases; montar um
   PPL com `>=`/`=` degenerado que force ciclagem na Fase 1.

---

### 2026-06-24 — Parser sobrescreve termos repetidos em vez de somá-los

**Sintoma.** O parser de PPL produzia um modelo silenciosamente errado quando uma variável
aparecia mais de uma vez na mesma expressão (objetivo ou restrição). O *último* termo vencia,
em vez de combinar os termos semelhantes.

PPL que disparava (formato texto):
```
max 2x1 + 3x1
x1 + x1 <= 4
```
- Objetivo parseado: `[3]` (deveria ser `[5]`, pois 2x1 + 3x1 = 5x1).
- Restrição parseada: `coeffs [1]` (deveria ser `[2]`, pois x1 + x1 = 2x1).
- Consequência: o motor resolvia o problema ERRADO — dava `x1 = 4, z = 4` quando o problema
  real (`max 5x1 s.a. 2x1 <= 4`) tem `x1 = 2, z = 10`. Quadro errado ensina errado.

> A divergência nasce no **parser**, não no motor numérico: GLPK/jsLP recebem o `LPModel` já
> com os coeficientes errados, então "concordam" com o motor sobre o problema errado. O bug só
> aparece comparando o modelo parseado com o esperado matematicamente (combinar termos
> semelhantes é álgebra elementar, não convenção).

**Causa raiz.** Em `parseLP` ([src/core/parser.ts](../../src/core/parser.ts)), a montagem dos
vetores de coeficientes usava atribuição (`=`) em vez de acumulação (`+=`):
```js
objTerms.forEach((t) => (objective[indexOf.get(t.varName)!] = t.coeff));   // last-wins
pc.terms.forEach((t) => (coeffs[indexOf.get(t.varName)!] = t.coeff));      // last-wins
```
Com `=`, dois termos da mesma variável faziam o segundo apagar o primeiro.

**Correção.** Trocado `=` por `+=` nas duas linhas (objetivo e restrições), combinando termos
semelhantes. Como o array é inicializado com `0`, o caso de variável única (`0 + c = c`) é
idêntico ao comportamento anterior — sem regressão.

**Teste adicionado.** `test/parser.test.ts` → "soma coeficientes de termos repetidos (não
sobrescreve)": verifica `objective === [5]`, `coeffs === [2]`, e que o motor então resolve o
problema certo (`x1 = 2`, `z = 10`). Falhava antes (`[3]` ≠ `[5]`), passa depois.

**Verificação.**
- `npm run typecheck` → limpo.
- `npm test` → 16 passados (1 regressão nova + 15 anteriores; nota: `_verify_multiopt.test.ts`
  é de uma sessão paralela, +1 arquivo/teste).
- `npm run build` → OK (`✓ built in 377ms`; avisos `fs/child_process` externalizados são
  pré-existentes do javascript-lp-solver).
- Fuzzer adversarial (motor × GLPK × jsLP, 15.000 PPLs com viés de degeneração/empates +
  checagem de viabilidade da solução): **0 divergências numéricas** no motor. O núcleo Simplex
  está sólido nessa bateria; a falha estava no parser.

**Docs.** Projeto não tem vault `docs/` nem CLAUDE.md de projeto (o lembrete do hook referencia
infra inexistente aqui). Nada a atualizar.

**Suspeitas para a próxima rodada.**
1. **Parser — `=<` / `=>` e RHS não-numérico** (`x1 <= x2`): hoje lançam erro; confirmar se é o
   comportamento desejado ou se deveria normalizar/explicar melhor.
2. **Parser — falso-positivo de não-negatividade**: `x1 + x2 >= 0` é descartado como
   não-negatividade. É implícito (inofensivo), mas vale um teste documentando a decisão.
3. **Anti-ciclagem incompleta**: a entrada usa Dantzig (mais negativo), não Bland por índice;
   só o desempate de SAÍDA é à la Bland. Em teoria ainda pode ciclar (trava `MAX_ITER=200`
   retorna "optimal" mesmo sem otimalidade real). Procurar PPL degenerado que cicle de fato.
4. **`driveOutArtificials` com pivô negativo / linha redundante** (`pc === -1`): artificial fica
   na base em nível 0 e segue para a Fase 2. Construir PPL com restrições `=` linearmente
   dependentes e verificar extração da solução e custos reduzidos na Fase 2.
