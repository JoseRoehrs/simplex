---
description: Uma rodada de saúde do código — UMA refatoração/limpeza segura (dead code, duplicação, tipos, consistência React×legado) SEM mudar comportamento; testes continuam verdes. Feito pra rodar em /loop.
argument-hint: "[alvo opcional — ex.: dedup de fração, tipos do parser, dead code]"
---

# 🧹 Saúde do código (refactor & limpeza) — UMA rodada

Você é o **zelador da base de código**. Sua missão nesta rodada: deixar o código **mais limpo
e sustentável** com **UMA** mudança segura — **sem alterar comportamento**. Os testes que
passavam continuam passando; nenhum número visível muda. Uma melhoria por rodada.

> Em `/loop` isto se repete. Aqui você **refatora/limpa** — não conserta correção
> (`/cacar-bugs`), não adiciona feature (`/nova-ideia`), não mexe em microcopy/UX
> (`/melhoria-didatica`). Leia [.claude/loops/README.md](<../loops/README.md>).
>
> ⚠️ **Comportamento idêntico.** Se você precisa mudar o que o sistema faz/mostra, é outro
> loop. Refactor é mudar a *forma*, não o *resultado*.

Alvo opcional desta rodada (priorize se vier): **$ARGUMENTS**

## 1) Carregue o estado e fixe o baseline

- **Diário deste loop:** [.claude/loops/saude-codigo.md](<../loops/saude-codigo.md>) — limpezas já
  feitas + dívidas pendentes. Crie no passo 5 se não existir.
- **Baseline verde:** rode `npm run typecheck` e `npm test` ANTES de mexer — você precisa do
  estado "tudo passa" pra provar que não regrediu. Anote a contagem de testes (hoje: 14).
- `git status` (sessões paralelas — não refatore um arquivo que outra sessão está reescrevendo).

## 2) Encontre UMA dívida real

Procure (pode usar o agente `codebase-cleanup-auditor` se ajudar):

- **Dead code / exports não usados**, imports órfãos, variáveis não lidas.
- **Duplicação**: lógica de fração repetida fora de [frac.ts](<../../src/core/frac.ts>); formatação de
  quadro/número copiada entre componentes; helpers que deviam ser compartilhados.
- **Tipos**: `any` evitável, tipos largos onde cabe um literal/união, props frouxas;
  oportunidades em [types.ts](<../../src/core/types.ts>) e nos componentes.
- **Consistência React (`src/`) × legado (`simplex-duas-fases/`)**: mesma lógica matemática
  divergindo entre os dois — extrair/alinhar (sem mudar resultado).
- **Higiene**: nomes confusos, funções longas demais, comentários obsoletos, `console.log` esquecido,
  CSS morto em [styles.css](<../../src/styles.css>).
- **Tooling**: `tsconfig` frouxo, warning de build/typecheck que dá pra zerar.

Escolha a de melhor **redução de risco/ruído ÷ esforço** que caiba numa rodada e seja **provável segura**.

## 3) Refatore com segurança

- Mudança pequena e auto-contida. Preserve a API pública das funções centrais (`solve()`, `parseLP()` etc.).
- Não toque em frações/semântica das fases "de passagem". Se a refatoração começar a mudar comportamento, **pare e reduza o escopo**.
- Mantenha o estilo do código vizinho (naming, densidade de comentário).

## 4) Prove que nada mudou

- **Verificação (obrigatória):** `npm run typecheck` → `npm test` (**mesma** contagem, todos
  verdes) → `npm run build`. Se possível, confira que a saída visível de um PPL exemplo é idêntica. Cole o resultado real.
- Se um teste mudou de resultado, **você mudou comportamento** → reverta e reescolha o alvo.

## 5) Registre

**Diário** [.claude/loops/saude-codigo.md](<../loops/saude-codigo.md>) (crie se não existir, título
"Diário — Saúde do código"): `### AAAA-MM-DD — <limpeza>` com **a dívida**, **o que mudou +
arquivos**, **prova de comportamento idêntico (testes/contagem)**, e **2–4 dívidas** pra próxima rodada.

## 6) Pronto + parada do loop

- **Pronto:** 1 parágrafo dizendo o que ficou mais limpo, onde, e que comportamento + testes seguem idênticos.
- **Parada:** se 2 rodadas seguidas não acharem dívida que valha o risco, registre e sugira encerrar este loop.

---

**Regras de ouro:** comportamento idêntico (refactor ≠ mudança de resultado); uma limpeza por
rodada, provável segura; fixe o baseline verde antes; testes mantêm a mesma contagem; releia o
estado antes (sessões paralelas); não commite sem o usuário pedir.
