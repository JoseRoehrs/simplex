---
description: Uma rodada de melhoria de design/UX/UI e intuitividade — torna UMA parte JÁ existente do Simplex mais fácil de entender, verifica (typecheck+test+build) e registra. Feito pra rodar em /loop.
argument-hint: "[área/pista opcional p/ priorizar — ex.: tooltips no quadro, legenda s/e/a]"
---

# 🎓 Melhoria didática (design • UX/UI • intuitividade) — UMA rodada

Você é o **curador da experiência de aprendizado** do sistema Simplex. Sua missão nesta
rodada: pegar **UMA** parte que **já existe** e deixá-la **mais intuitiva** — mais fácil de
ler, de entender o porquê, de conectar álgebra↔geometria. Uma melhoria por rodada.

> Esta é a definição de uma rodada; em `/loop` ela se repete, cada vez cobrindo um alvo
> novo. Aqui você **melhora o que existe** (clareza, layout, microcopy, visual, feedback) —
> **não** cria área/feature nova (isso é `/nova-ideia`). Leia [.claude/loops/README.md](<../loops/README.md>) (regras de ouro).

Pista opcional desta rodada (priorize se vier): **$ARGUMENTS**

## 1) Carregue o estado (não repita o que já foi feito)

- **Diário deste loop:** [.claude/loops/melhoria-didatica.md](<../loops/melhoria-didatica.md>) — leia o "Registro" no fim. Se não existir, você o cria no passo 5.
- **Histórico em memória:** o loop de intuitividade já entregou (não refazer): visão
  geométrica 2D (`FeasibleRegion.tsx`), Treino de Frações (`FractionTrainer.tsx`), coluna do
  teste da razão θ no quadro (`TableauView.tsx`), Workflow/flowTrace, e o fix de cabeçalho do
  app legado. Confirme no código antes de assumir que algo ainda falta.
- **Convenções de design:** memória `simplex-design-system` + regra de emoji por área (passo 4 do README).
- **Estado atual:** `git status` e abra os arquivos do alvo — outras sessões podem ter mexido.

## 2) Audite a superfície e ache atrito

Rode o app na cabeça (ou de fato, `npm run dev`) e procure onde um aluno **trava**:

- **Quadros** ([TableauView.tsx](<../../src/components/TableauView.tsx>)): os símbolos `s`/`e`/`a`
  têm legenda? O custo reduzido mais negativo (var que entra) está destacado na linha z? Há
  tooltip nos termos? A transição entre quadros conta a história do pivô?
- **Visão geométrica** ([FeasibleRegion.tsx](<../../src/components/FeasibleRegion.tsx>)): os
  vértices/retas estão rotulados de forma clara? Dá pra ligar cada vértice ao quadro correspondente?
- **Workflow** ([WorkflowView.tsx](<../../src/components/WorkflowView.tsx>)): o caminho aceso
  está legível? As anotações numéricas ajudam?
- **Solver / App** ([App.tsx](<../../src/App.tsx>)): entrada de PPL, mensagens de erro do parser,
  estados (factível/inviável/ilimitado), relatório de validação — estão claros e amigáveis?
- **Frações** ([FractionTrainer.tsx](<../../src/components/FractionTrainer.tsx>)): feedback de erro útil?
- **App legado** ([simplex-duas-fases/](<../../simplex-duas-fases/>)): tutorial e quadros — algo confuso?

Priorize o atrito de **maior impacto pedagógico** com **menor risco** (não quebrar correção).

## 3) Escolha UM alvo (o de maior valor)

Critério: quanto isso reduz a confusão de quem está aprendendo? Prefira o que ilumina **o
porquê** do algoritmo (regra de Dantzig, teste da razão, artificiais, inviabilidade) e a
ponte álgebra↔geometria. Se a pista de `$ARGUMENTS` apontar uma área válida, comece por ela.

## 4) Implemente — clareza sem quebrar correção

- Reuse os dados que o motor já produz (`PivotStep`, `TableauSnapshot`, `solve()`); **não**
  recalcule matemática na camada de UI.
- Respeite o design da área (emoji OK em `src/`; sem emoji + SVG/tokens em `simplex-duas-fases/`).
- A11y quando aplicável: foco visível, `aria-label` em ícone-só, sem `transition: all`, respeitar `prefers-reduced-motion`.
- Mudança focada e pequena — é UMA melhoria.

## 5) Verifique e registre

- **Verificação (obrigatória):** `npm run typecheck` → `npm test` (continuam passando) →
  `npm run build`. Se a mudança afeta um valor numérico visível, confira contra o motor/GLPK. Cole o resultado real.
- **Diário** [.claude/loops/melhoria-didatica.md](<../loops/melhoria-didatica.md>) (crie se não existir,
  com frontmatter simples e título "Diário — Melhoria didática"): adicione no fim, em "Registro",
  `### AAAA-MM-DD — <alvo>` com: **o atrito**, **o que mudou e em quais arquivos**, **resultado
  da verificação**, e **2–4 candidatas** pra próxima rodada.

## 6) Pronto + parada do loop

- **Pronto:** termine com 1 parágrafo dizendo exatamente o que ficou mais intuitivo, onde, e que a verificação passou.
- **Parada:** se 2 rodadas seguidas não acharem atrito que valha a pena, registre e sugira encerrar este loop.

---

**Regras de ouro:** uma melhoria por rodada; releia o estado antes (sessões paralelas);
correção matemática é sagrada (UI não recalcula, só apresenta); respeite o design por área;
verifique antes de dizer pronto; não commite sem o usuário pedir.
