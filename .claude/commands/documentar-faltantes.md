---
description: Uma rodada de auditoria de cobertura da documentação — acha UMA lacuna real entre o sistema e o vault docs/, documenta de verdade (mapa de domínio ou seção), e linka no Início. Feito pra rodar em /loop.
argument-hint: "[domínio/pista opcional p/ priorizar nesta rodada]"
---

# 📑 Documentar partes faltantes do sistema — UMA rodada

Você é o **auditor de cobertura da documentação** do Sistema PPGVET. Sua missão nesta
rodada: encontrar **UMA** parte do sistema que ainda **não está documentada** (ou está
documentada de forma rasa/desatualizada) no vault `docs/`, e **documentá-la de verdade**,
seguindo as convenções do vault. Uma lacuna por rodada — não tente esvaziar tudo de uma vez.

> Esta é a definição de uma rodada. Em `/loop`, ela se repete; cada rodada cobre uma
> lacuna nova. O trabalho **só mexe em documentação** (`docs/`, `Início.md`) — **NUNCA**
> altera código, migrations ou comportamento do sistema.

Pista opcional desta rodada (priorize se vier): **$ARGUMENTS**

---

## 1) Carregue o estado do vault (o que JÁ existe)

Antes de tudo, leia para não repetir e para saber onde encaixar:

- [docs/Início.md](<../../docs/Início.md>) — o MOC raiz: a lista canônica de mapas por
  domínio + o callout **"Lacunas conhecidas"**.
- [docs/Como usar este vault.md](<../../docs/Como usar este vault.md>) — as convenções de
  escrita (negócio primeiro, técnico no fim; wikilinks; links relativos pro código;
  datas absolutas; callouts; tags).
- A **lista de notas existentes**: `ls "docs/"*.md`.
- O **diário desta auditoria** (registro anti-repetição), se já existir:
  `docs/Auditoria da Documentação.md` — leia o "Registro" no fim para ver o que rodadas
  anteriores já fizeram e quais candidatas ficaram pendentes. Se **não existir**, você o
  cria nesta rodada (ver passo 5).

**Hierarquia de verdade** (não inverter): o **código** (`src/...`, `supabase/`) e o
[`CLAUDE.md`](<../../CLAUDE.md>) são **canônicos**. O vault **explica e aponta** — não
duplica fórmulas/números que mudam. Se for documentar uma regra, **descreva e linke**,
não copie a fórmula.

## 2) Levante a superfície REAL do sistema e ache o que falta

Cruze o que existe no código com o que o vault cobre. Fontes para enumerar a superfície:

- **Rotas / seções de menu**: [`src/components/content/RouteRenderer.tsx`](<../../src/components/content/RouteRenderer.tsx>),
  [`src/constants/sidebarMenus.ts`](<../../src/constants/sidebarMenus.ts>),
  [`src/constants/sectionMenuMap.ts`](<../../src/constants/sectionMenuMap.ts>),
  [`src/constants/permissions.ts`](<../../src/constants/permissions.ts>) (catálogo de seções).
- **Domínios de UI**: `ls -d src/components/*/`.
- **Edge functions** (integrações, crons, IA, sync): `ls supabase/functions/`.
- **RPCs / tabelas** (quando precisar confirmar uma regra): MCP `supabase-ppgvet`
  (`list_tables`, `execute_sql` para ver a definição de uma RPC/trigger/cron). **Use o
  banco para CONFIRMAR, nunca para inventar.**

Para cada candidata, pergunte: **"isso aparece em alguma nota do vault?"** (grep no
`docs/`). Se não aparece em lugar nenhum, ou só é citada de passagem sem explicar o
fluxo → é lacuna.

> [!tip] Pistas prováveis para as primeiras varreduras (NÃO exaustivo — sempre confirme
> se já não está coberto antes de assumir que é lacuna):
> - **Sync de mídia paga / social**: `sync-meta-ads`, `sync-meta-creatives`, `ig-*`,
>   `tiktok-*` — confirmar se [[Marketing — Mídia Paga]] já cobre o **sync** (não só as telas).
> - **E-mail marketing / campanhas**: `email-campaign-*`, `funil-email-dispatch`,
>   `email-segmento-preview`, `email-track-open`, `email-webhook` — há mapa do **motor de campanhas**?
> - **Gmail / caixas compartilhadas**: `gmail-*` (sync inbox, send reply, anexos) — [[E-mail e Caixas]]
>   explica o fluxo real de sincronização?
> - **Google Calendar**: `google-calendar-*` (oauth/create/update/sync) — cabe em [[Agendamentos e Reuniões]] ou [[Integrações Externas]]?
> - **EDUQ / SIGA**: `eduq-sync-*`, `siga-*` — [[Financeiro e Cobrança]] / [[cobranca-projecao-relatorios]] cobrem o sync acadêmico/financeiro?
> - **Copilotos de IA por área**: `ai-handler`, `ai-orchestrator`, `ai-internal-agent`,
>   `ped-copiloto`, `sales-copilot-chat`, `mimosa-analise`, `recontato-analise`, `gt-ai-*`,
>   `prompt-engineer` — [[IA e Copilotos]] mapeia cada copiloto e seu gatilho?
> - **Comissionamento (motor)**: `recalc-weekly-commissions`, `src/components/comissionamento/` — [[Pontuação e Comissão]] detalha o **cálculo semanal**?
> - **Processos / Processos Comercial**: `src/components/processos/`, `processos-comercial/` — tem mapa?
> - **Calendário**: `src/components/calendario/` — distinto de [[Agendamentos e Reuniões]]?
> - **TCC**: `submeter-tcc` — fluxo de submissão/avaliação documentado?
> - **Importadores em massa**: `bulk-insert-alunos|colaboradores|lancamentos`.
> - **Superfícies "v2"**: `leads-v2`, `comercial-v2`, `pedagogico-v2` — o que mudou vs v1?
> - **Utilitários de link/preview**: `unfurl-url`, `link-preview`, `geo-proxy`.

## 3) Escolha UMA lacuna (a de maior valor)

Critérios de priorização (de cima pra baixo):
1. **Domínio/subsistema inteiro sem mapa** (ex.: um motor de sync ou de campanhas que
   ninguém documentou) — vale **nota própria** (novo MOC).
2. **Mapa existente raso** numa parte importante (ex.: [[IA e Copilotos]] cita os
   copilotos mas não explica o fluxo de um deles) — vale **expandir a nota existente**.
3. **Página/fluxo isolado** (não é domínio inteiro) — vira **uma seção dentro de um mapa
   existente** + atualize o callout "Lacunas conhecidas" do [[Início]].

Se a pista de `$ARGUMENTS` apontar uma área, comece por ela (desde que seja lacuna real).

## 4) Documente — negócio primeiro, técnico no apêndice

Antes de escrever, **leia o código de verdade** (edge function, componente, RPC) para
descrever o fluxo correto. Não invente endpoint/tabela/regra; o que não der pra confirmar,
marque **"a confirmar"** explicitamente.

Siga as convenções de [[Como usar este vault]]:
- **Lidere com o negócio**: quem usa, qual tela/fluxo, qual regra/objetivo. Detalhe
  técnico (arquivos, edge functions, RPCs, tabelas, crons) num **apêndice no fim**.
- **Wikilinks** `[[Nota]]` entre notas do vault; **links relativos** `[arquivo](../src/...)`
  para o código (e `[fn](../supabase/functions/...)` para edge functions).
- **Datas relativas → absolutas** (hoje é a data do sistema; "ontem" vira `AAAA-MM-DD`).
- **Callouts** (`> [!info]`, `> [!warning]`, `> [!example]`) e **tags** no rodapé
  (`#moc`, `#regra-de-ouro`, `#comercial`, `#infra`, `#integracao`, etc.).
- **NÃO duplique fórmulas/números** que vivem no código — descreva e linke ([[CLAUDE]] é canônico).
- Frontmatter no padrão das outras notas (`title`, `aliases`, `tags: [moc, ...]`).

## 5) Conecte ao grafo (senão a nota fica órfã)

- **Novo MOC** → adicione o wikilink em [docs/Início.md](<../../docs/Início.md>) na seção
  certa ("Comercial", "Plataforma", "Marketing"…). Se for um domínio que estava no
  callout "Lacunas conhecidas", **remova-o de lá**.
- **Seção dentro de mapa existente** → atualize o callout "Lacunas conhecidas" do
  [[Início]] se a página estava listada.
- **Atualize o diário** `docs/Auditoria da Documentação.md` (crie se não existir, com
  frontmatter `tags: [moc, meta]` e linke em [[Início]] sob "Documentos de referência"):
  acrescente ao fim, numa seção **"Registro"**, uma linha desta rodada —
  `### AAAA-MM-DD — <lacuna>` com: **o que faltava**, **o que foi criado/atualizado e
  onde foi linkado**, e **2–4 candidatas restantes** para a próxima rodada (para acelerar
  o no-repeat).

## 6) Critério de pronto + parada do loop

- **Pronto (esta rodada):** o vault reflete a realidade da parte escolhida, a nota está
  linkada no [[Início]], e o diário registra o que mudou. Termine dizendo **exatamente o
  que você criou/atualizou e onde linkou** (1 parágrafo).
- **Parada:** se, após varrer a superfície, você **não achar nenhuma lacuna real** (tudo
  já coberto), **não invente trabalho**. Registre no diário "varredura sem lacunas (passada N)"
  e diga ao usuário que a documentação parece completa nesta passada. Se isso acontecer
  **2 rodadas seguidas**, sugira encerrar o loop.

---

**Regras de ouro (não viole):** só edita documentação (nunca código/migrations); código
e [[CLAUDE]] são canônicos (vault descreve e aponta, não duplica); confirme no código
antes de afirmar; uma lacuna por rodada; nunca crie uma nota sem linká-la no [[Início]].
