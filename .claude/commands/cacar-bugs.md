---
description: Uma rodada de caça a bugs — acha e corrige UM bug/edge case real do motor Simplex, provado contra GLPK/jsLP com um teste de regressão, verifica e registra. Feito pra rodar em /loop.
argument-hint: "[pista opcional — ex.: PPL degenerado, RHS negativo, empate na saída]"
---

# 🐞 Caça a bugs (correção & robustez) — UMA rodada

Você é o **engenheiro de confiabilidade do motor**. Sua missão nesta rodada: encontrar **UM**
bug ou caso-limite real onde o motor passo a passo (`src/core/`) produz resultado **errado**,
**quebra**, ou **diverge dos solvers de referência** — e corrigi-lo com um **teste de
regressão** que falha antes e passa depois. Um bug por rodada.

> Em `/loop` isto se repete. Aqui você **conserta correção/robustez** — sem feature nova
> (`/nova-ideia`) e sem refactor cosmético (`/saude-codigo`). Leia [.claude/loops/README.md](<../loops/README.md>).
>
> ⚠️ **Correção matemática é sagrada.** Um quadro errado ensina errado. O solver próprio é a
> peça pedagógica; os solvers de referência (GLPK, jsLP) são o gabarito — quando divergem, **o
> motor é o suspeito**, não o contrário (a menos que prove que a referência foi mal-alimentada).

Pista opcional desta rodada (priorize se vier): **$ARGUMENTS**

## 1) Carregue o estado

- **Diário deste loop:** [.claude/loops/cacar-bugs.md](<../loops/cacar-bugs.md>) — bugs já corrigidos +
  suspeitas pendentes. Crie no passo 5 se não existir.
- **Onde o motor vive:** [simplexCore.ts](<../../src/core/simplexCore.ts>) (forma padrão, Simplex,
  Duas Fases, regra de Dantzig + desempate à la Bland), [parser.ts](<../../src/core/parser.ts>),
  [frac.ts](<../../src/core/frac.ts>), [validate.ts](<../../src/solvers/validate.ts>) (motor × GLPK × jsLP).
- **Testes atuais:** [test/simplex.test.ts](<../../test/simplex.test.ts>), [test/parser.test.ts](<../../test/parser.test.ts>) — rode `npm test` pra ver o baseline verde.
- `git status` (sessões paralelas).

## 2) Cace — gere PPLs adversariais e compare com a referência

Procure divergência ou crash. Categorias férteis de caso-limite:

- **Degeneração** (RHS = 0, vértice com mais restrições ativas que o normal) → ciclagem? Bland resolve?
- **Empates** na entrada (vários custos reduzidos iguais) e na **saída** (várias razões mínimas iguais).
- **RHS negativo** no input (normalização de sinal), restrições `≥` e `=` (artificiais, Fase 1).
- **Inviável** (Fase 1 termina com W>0 / artificial positiva na base) e **ilimitado** (coluna de entrada sem razão positiva).
- **Coeficientes nulos/implícitos/negativos**, variável que nunca entra, problema só com `=`.
- **min vs max**, objetivo já ótimo no início, solução **degenerada/múltiplos ótimos**.
- **Parser** ([parser.ts](<../../src/core/parser.ts>)): espaços, sinais, `2x2` vs `2 x2`, linhas de não-negatividade, erros silenciosos.

Método: monte o PPL, rode `solveAndValidate()` e compare `z*`/solução do motor com GLPK e jsLP.
Divergência além de tolerância de fração, exceção, ou laço que não converge = bug candidato.
(Cuidado: comparar **valor ótimo** é robusto; múltiplos ótimos podem dar **vértices** diferentes sem ser bug.)

## 3) Confirme que é bug (não comportamento esperado)

Reproduza de forma mínima. Decida a verdade pela referência + teoria de PL. Se for "esperado"
(ex.: dois ótimos alternativos), **não é bug** — anote no diário e siga.

## 4) Corrija com teste de regressão

- **Primeiro escreva o teste** que captura o bug (deve **falhar** no código atual) em [test/](<../../test/>).
- Corrija a **causa raiz** no motor — não mascare o sintoma na UI. Preserve frações exatas e a semântica das fases.
- Confirme: o novo teste passa **e** todos os antigos continuam passando.

## 5) Verifique e registre

- **Verificação (obrigatória):** `npm run typecheck` → `npm test` (novo + 14 antigos verdes) →
  `npm run build`. Cole o resultado real.
- **Diário** [.claude/loops/cacar-bugs.md](<../loops/cacar-bugs.md>) (crie se não existir, título "Diário — Caça a bugs"):
  `### AAAA-MM-DD — <bug>` com **sintoma + PPL que disparava**, **causa raiz**, **correção +
  teste adicionado**, **resultado da verificação**, e **2–4 suspeitas** pra próxima rodada.

## 6) Pronto + parada do loop

- **Pronto:** 1 parágrafo com o bug, a causa raiz, o fix e o teste — e que tudo passa.
- **Parada:** se 2 rodadas de caça adversarial não acharem divergência alguma (motor bate com
  ambas as referências em toda a bateria), registre "sem divergências (passada N)" e sugira encerrar.

---

**Regras de ouro:** um bug por rodada; referência é gabarito, motor é suspeito; sempre um
teste de regressão que falha-antes/passa-depois; corrija a raiz, não o sintoma; releia o
estado antes; verifique antes de dizer pronto; não commite sem o usuário pedir.
