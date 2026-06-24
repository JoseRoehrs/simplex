---
description: Uma rodada de conteúdo — adiciona UM material pedagógico real (problema do curso, exemplo trabalhado, explicação, vídeo, padrão de treino), valida o ótimo contra o motor, verifica e registra. Feito pra rodar em /loop.
argument-hint: "[tema/semana opcional — ex.: semana 11, exemplo de inviável, vídeo dualidade]"
---

# 📚 Conteúdo pedagógico — adiciona UM material — UMA rodada

Você é o **autor de conteúdo** do sistema Simplex. Sua missão nesta rodada: adicionar **UM**
material de aprendizado real e correto — um problema do curso, um exemplo trabalhado, uma
explicação que falta, um vídeo curado, ou um padrão novo no Treino de Frações. Um item por rodada.

> Em `/loop` isto se repete. Aqui você **adiciona conteúdo/dados/texto** — não constrói feature
> nova (`/nova-ideia`) nem reescreve UI (`/melhoria-didatica`). Leia [.claude/loops/README.md](<../loops/README.md>).
>
> ⚠️ **Todo número/ótimo afirmado tem que ser verdade.** Antes de publicar um problema ou
> exemplo, **rode-o pelo motor** (`solve()`/`solveAndValidate()`) e use o resultado real — nunca
> chute o ótimo, a solução ou o caminho dos pivôs.

Tema/semana opcional desta rodada (priorize se vier): **$ARGUMENTS**

## 1) Carregue o estado

- **Diário deste loop:** [.claude/loops/conteudo-pedagogico.md](<../loops/conteudo-pedagogico.md>) — conteúdo
  já adicionado + ideias pendentes. Crie no passo 5 se não existir.
- **Onde o conteúdo vive:**
  - Problemas do curso por semana → [problems.ts](<../../src/core/problems.ts>) (hoje: semanas 7, 8, 9, 10).
  - Exemplos do solver → `EXAMPLES` em [App.tsx](<../../src/App.tsx>).
  - Vídeos curados → [VideosView.tsx](<../../src/components/VideosView.tsx>).
  - Treino de frações (padrões/níveis) → [FractionTrainer.tsx](<../../src/components/FractionTrainer.tsx>).
  - Texto explicativo/tutorial → [README.md](<../../README.md>) e o tutorial do app legado [simplex-duas-fases/](<../../simplex-duas-fases/>).
- `git status` (sessões paralelas).

## 2) Ache a lacuna de conteúdo de maior valor

Cruze o que o curso/método precisa com o que já existe. Candidatas típicas: uma **semana/tipo
de problema** ainda não catalogado; um exemplo que ilustra um **caso especial** ausente
(inviável, ilimitado, degenerado, múltiplos ótimos, igualdade pura); um **conceito** sem
explicação (por que artificiais, o que o teste da razão evita, leitura geométrica do dual); um
**vídeo** de qualidade para um tópico descoberto; um **padrão de fração** que prepara melhor pro pivô.

Se `$ARGUMENTS` indicar tema, comece por ele (desde que seja lacuna real e correta).

## 3) Produza o material — correto e no formato certo

- **Problema/exemplo:** escreva o PPL, **rode pelo motor**, e registre o ótimo/solução/caminho
  **reais**. Siga exatamente o formato/tipos de [problems.ts](<../../src/core/problems.ts>) ou `EXAMPLES`.
- **Explicação:** lidere pela intuição (o "porquê"), depois a mecânica. Não duplique fórmulas que
  vivem no código — descreva e aponte. Português claro, no tom do material existente.
- **Vídeo:** só inclua link que você consiga confirmar que é relevante; descreva o que ensina e para qual etapa serve.
- Design por área (emoji OK em `src/`; sem emoji + tokens/SVG em `simplex-duas-fases/`).

## 4) Verifique

- **Conteúdo:** o ótimo/solução afirmados batem com `solveAndValidate()` (motor × GLPK × jsLP)? Se houver discrepância, o conteúdo está errado — corrija.
- **Build:** `npm run typecheck` → `npm test` (continuam verdes; adicione um teste se cadastrou um problema com ótimo conhecido) → `npm run build`. Cole o resultado real.

## 5) Registre + linke

- Se o material aparece numa aba/seção, garanta que está **alcançável** na UI (selecionável em `problems.ts`/`EXAMPLES`/aba).
- **Diário** [.claude/loops/conteudo-pedagogico.md](<../loops/conteudo-pedagogico.md>) (crie se não existir, título
  "Diário — Conteúdo pedagógico"): `### AAAA-MM-DD — <material>` com **a lacuna**, **o que foi
  adicionado + arquivos**, **como foi validado (ótimo conferido)**, e **2–4 candidatas** pra próxima rodada.

## 6) Pronto + parada do loop

- **Pronto:** 1 parágrafo dizendo o material adicionado, onde o aluno o encontra, e que o ótimo foi conferido contra a referência.
- **Parada:** se 2 rodadas seguidas não acharem lacuna de conteúdo com valor real, registre e sugira encerrar este loop.

---

**Regras de ouro:** um material por rodada; todo ótimo/número afirmado é validado pelo motor
antes de publicar (nunca chutar); siga o formato dos dados existentes; releia o estado antes
(sessões paralelas); verifique antes de dizer pronto; não commite sem o usuário pedir.
