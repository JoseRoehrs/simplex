---
description: Uma rodada de inovação — brainstorma e implementa SOZINHO UMA funcionalidade nova que melhore o aprendizado de Simplex, ponta a ponta com teste, verifica e registra. Feito pra rodar em /loop.
argument-hint: "[tema/direção opcional p/ a ideia desta rodada]"
---

# 💡 Nova ideia — brainstorma e implementa UMA funcionalidade — UMA rodada

Você é o **designer de produto + engenheiro** do sistema Simplex. Sua missão nesta rodada:
**inventar UMA funcionalidade nova** que torne o sistema mais útil para aprender Programação
Linear, e **implementá-la de verdade, sozinho, ponta a ponta** (UI + lógica + teste). Uma
feature por rodada — pequena o suficiente pra ficar completa e verificada numa rodada.

> Em `/loop` isto se repete; cada rodada entrega uma feature nova distinta. Aqui você **cria
> algo novo** (≠ `/melhoria-didatica`, que só pule o que já existe). Leia [.claude/loops/README.md](<../loops/README.md>).

Tema/direção opcional desta rodada (use se vier): **$ARGUMENTS**

## 1) Carregue o estado (não reinvente o que existe)

- **Diário deste loop:** [.claude/loops/nova-ideia.md](<../loops/nova-ideia.md>) — leia o "Registro"
  (ideias já feitas + backlog) e o que ficou marcado como "rejeitada/adiada". Crie no passo 6 se não existir.
- **O que já existe** (não duplicar): abas Solver, Workflow, Treino de Frações, Vídeos em
  [App.tsx](<../../src/App.tsx>); visão geométrica 2D; coluna θ; árvore de decisão
  ([flowTrace.ts](<../../src/core/flowTrace.ts>)); catálogo de problemas por semana ([problems.ts](<../../src/core/problems.ts>)).
- **Fundação reutilizável:** `solve()` / `solveAndValidate()`, tipos em
  [types.ts](<../../src/core/types.ts>) (`PivotStep`, `TableauSnapshot`), helpers de fração [frac.ts](<../../src/core/frac.ts>).
- **Estado atual:** `git status` (sessões paralelas).

## 2) Gere opções e escolha UMA

Pense em 3–5 ideias e escolha a de melhor **valor ÷ esforço** que caiba numa rodada. Boas
direções (não exaustivo): editor visual de PPL (sliders → quadro ao vivo); detector/exemplos
de **degeneração** e **empate**; modo "preveja o próximo pivô" (quiz a partir do quadro);
**análise de sensibilidade** simples (intervalos de `cⱼ`/RHS); exportar a resolução
(PDF/imagem/markdown); comparador "Fase única vs Duas Fases"; problemas gerados
aleatoriamente com solução garantida; dual do PPL; passo-a-passo narrado por etapa.

Critérios: (a) aprofunda o **entendimento** do método; (b) reusa o motor existente; (c)
escopo de UMA rodada; (d) não duplica nada da seção 1. Se `$ARGUMENTS` der direção, parta dela.

## 3) Especifique em 3 linhas (antes de codar)

Escreva no diário (rascunho): **o que é**, **por que ajuda a aprender**, **como o aluno usa**.
Mantém o escopo honesto e evita inchar a rodada.

## 4) Implemente ponta a ponta

- Lógica nova em `src/core/` ou `src/solvers/` quando fizer sentido; UI nova como componente
  em `src/components/` e, se for navegável, uma aba em [App.tsx](<../../src/App.tsx>) (siga o padrão `Tab`).
- **Não recalcule matemática na UI** — derive de `solve()`/tipos do motor. Frações via `frac.ts`.
- Design: emoji OK em `src/` (consistência local); estilos em [styles.css](<../../src/styles.css>) seguindo os tokens existentes.
- **Escreva pelo menos um teste** do comportamento novo (vitest, padrão de [test/](<../../test/>)) — feature sem teste não está pronta.

## 5) Verifique

`npm run typecheck` → `npm test` (os 14 existentes + os novos passam) → `npm run build`.
Se a feature produz números, confira contra o motor/GLPK. Cole o resultado real; se quebrou, conserte ou reverta.

## 6) Registre + atualize o README se virou aba

- **README do projeto:** se a feature adiciona uma aba/seção visível, descreva-a brevemente em [README.md](<../../README.md>).
- **Diário** [.claude/loops/nova-ideia.md](<../loops/nova-ideia.md>) (crie se não existir, título "Diário — Novas ideias"):
  `### AAAA-MM-DD — <feature>` com **o que foi entregue + arquivos**, **resultado da verificação**,
  e **2–4 ideias de backlog** pra próxima rodada (e marque as rejeitadas).

## 7) Pronto + parada do loop

- **Pronto:** 1 parágrafo dizendo a feature entregue, como o aluno a usa, e que verificação + teste passaram.
- **Parada:** se o sistema já cobre bem o método e nenhuma ideia nova agrega valor real por 2 rodadas, registre e sugira encerrar.

---

**Regras de ouro:** uma feature por rodada, completa e testada; reuse o motor (UI não
recalcula); releia o estado antes (sessões paralelas); verifique antes de dizer pronto;
respeite o design por área; não commite sem o usuário pedir.
