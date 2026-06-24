# Loops de auto-melhoria — Simplex

Conjunto de **comandos de uma-rodada** feitos para rodar em `/loop` enquanto você está
AFK. Cada comando audita o sistema, escolhe **UM** alvo de maior valor, **implementa de
verdade**, **verifica** (typecheck + testes + build) e **registra no diário** desta pasta
para não repetir na próxima rodada.

## Como rodar

```
/loop /melhoria-didatica        # auto-pace: o modelo decide o ritmo entre rodadas
/loop 30m /nova-ideia           # a cada 30 min
/loop 1h /cacar-bugs
```

- **Sem intervalo** → auto-pace (recomendado pra trabalho de qualidade enquanto AFK).
- **Com intervalo** (`5m`, `30m`, `1h`) → ritmo fixo.
- Pode passar uma pista pra priorizar a rodada: `/loop /nova-ideia tooltips no quadro`.

## Os loops

| Comando | O que faz numa rodada | Escopo (não invadir o vizinho) |
|---|---|---|
| `/melhoria-didatica` | Deixa **o que já existe** mais claro/intuitivo (UI, UX, visual, explicação) | Não cria área nova — isso é `/nova-ideia` |
| `/nova-ideia` | Brainstorma e implementa **uma funcionalidade nova** ponta a ponta | Recurso novo, com teste |
| `/cacar-bugs` | Acha e corrige **um bug/edge case** real do motor, validado contra GLPK/jsLP | Só correção — sem feature nova |
| `/saude-codigo` | **Refatora/limpa** (dead code, duplicação, tipos), sem mudar comportamento | Comportamento idêntico; testes continuam verdes |
| `/conteudo-pedagogico` | Adiciona **conteúdo** (problema do curso, exemplo, explicação, vídeo) | Dados/texto; UI mínima |

## Regras de ouro (valem pra TODOS os loops)

1. **Uma melhoria por rodada.** Não tente esvaziar o backlog de uma vez.
2. **Releia o estado atual ANTES de escolher o alvo.** Várias sessões editam este repo
   em paralelo — confira `git status`, o diário do loop e os arquivos antes de agir.
3. **Verificação obrigatória antes de dizer "pronto"** (ver
   [verification-before-completion]): `npm run typecheck`, `npm test` (os testes devem
   continuar passando) e `npm run build`. Cole o resultado real; se quebrou, conserte ou reverta.
4. **Correção matemática é sagrada.** O motor (`src/core/`) tem que bater com os solvers de
   referência. Nunca "embeleze" um quadro às custas da validação. Reuse `solve()` /
   `solveAndValidate()`.
5. **Respeite o design por área:**
   - `src/` (app React) → emoji **OK** (flowTrace, FractionTrainer já usam) — mantenha consistência local.
   - `simplex-duas-fases/` (app legado) → **sem emoji**, ícones SVG via `ic()`, tokens do design system; não reintroduza vars removidas (`--accent`/`--shadow`). Ver memória `simplex-design-system`.
   - `public/` (jogo "Simplex Quest") → WIP do usuário; só mexa se for o alvo explícito.
6. **Registre no diário** `.claude/loops/<nome-do-loop>.md`: data absoluta, o que faltava,
   o que mudou e onde, resultado da verificação, e 2–4 candidatas pra próxima rodada.
7. **Não commitar** a menos que o usuário peça (o repo ainda não tem commits). Deixe o
   trabalho na árvore; o usuário revisa.
8. **Condição de parada:** se 2 rodadas seguidas não acharem nada que valha a pena, diga
   isso e sugira encerrar aquele loop — não invente trabalho.

> Diários ficam nesta pasta (um `.md` por loop), criados na primeira rodada de cada um.
