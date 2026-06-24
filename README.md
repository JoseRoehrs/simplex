# Simplex — Sistema de Aprendizado

Sistema de aprendizado de **Programação Linear (PPL)** que resolve problemas
**passo a passo** pelos métodos **Simplex** e **Simplex Duas Fases**, mostrando
cada quadro (tableau) e cada pivô em **frações exatas** — e **validando o ótimo**
contra solvers profissionais de PL.

## Arquitetura pedagógica

A ideia central: o aluno aprende vendo **cada iteração**. Por isso o sistema tem
duas camadas:

1. **Motor próprio passo a passo** (`src/core/`) — implementa o Simplex tabular do
   zero, em aritmética racional exata, registrando cada quadro, a variável que
   entra, a que sai, o teste da razão e uma explicação didática.
2. **Solvers de referência** (`src/solvers/`) — bibliotecas robustas que resolvem
   o mesmo PPL e servem de "gabarito" para **validar** o resultado do motor.

### Visão geométrica (2 variáveis)

Para PPLs com **2 variáveis de decisão**, o sistema também desenha a **região
factível** e o **caminho do Simplex** sobre ela (`src/components/FeasibleRegion.tsx`):
cada quadro algébrico vira um **vértice numerado** do polígono, e o aluno vê o
algoritmo caminhar de canto em canto — na direção do gradiente do objetivo (∇z) —
até o **vértice ótimo** (estrela). É a ponte visual entre a álgebra dos quadros e
a geometria da Programação Linear. Para 3+ variáveis, apenas os quadros são exibidos.

### Workflow — árvore de decisão (estilo n8n)

A aba **Workflow** mostra o **método** (não um problema específico) como um
fluxograma de nós conectados, no estilo do n8n: cada **caso** da Programação
Linear é uma **ramificação** com explicação no próprio nó — restrição `≤`
(folga), `≥` (excesso + artificial), `=` (artificial); o teste *"há
artificiais?"* (precisa da Fase 1?); *"W = 0?"* (factível ou **inviável**); e a
condição de parada (**ótimo** ou **ilimitado**).

O aluno escolhe um **problema do curso por semana (7, 8, 9 ou 10)** e clica em
*Resolver pelo workflow*: o motor passo a passo roda e o **caminho que aquele
problema percorre acende** na árvore (nós ativos brilham, arestas animam o
fluxo, nós irrelevantes apagam), com **anotações numéricas reais** em cada nó
(quantas folgas/artificiais, nº de pivôs por fase, valor de W, `z*` e a
solução). É a ponte entre o *algoritmo geral* e *cada execução concreta* — ex.:
a Semana 10 (a) cai no ramo **ILIMITADO**, enquanto a Semana 8 (b) percorre os
três tipos de restrição de uma vez.

### Preveja o Pivô — drill interativo

A aba **Preveja o Pivô** transforma cada iteração em um **exercício de previsão**:
o aluno escolhe um PPL, e a cada quadro precisa adivinhar **qual variável entra**
(custo reduzido mais negativo — regra de Dantzig) e **qual sai** (teste da razão
mínima) *antes* de ver a resposta. O motor (`src/core/pivotQuiz.ts`) é o gabarito —
só inclui pivôs de Dantzig (ignora a remoção de artificiais) — e o "reveal" reusa o
quadro anotado do solver (pivô destacado, coluna θ e o "Por quê"). Ao final, mostra
o placar de acertos. É treino ativo do passo a passo, complementar ao Quiz conceitual.

### Dualidade — primal ↔ dual

A aba **Dualidade** constrói automaticamente o **problema dual** de qualquer PPL
digitado (`src/core/dual.ts`) e mostra a **transposição** passo a passo: `max ↔
min`, cada **restrição** vira uma **variável dual** (com seu sinal — `≥ 0`, `≤ 0`
ou *livre*, conforme a restrição seja `≤`, `≥` ou `=`), cada **variável** vira uma
**restrição dual**, e os **RHS** trocam de papel com os **custos**. O dual é
resolvido reusando o mesmo motor (variáveis livres/`≤ 0` são reescritas em forma
`≥ 0` internamente) e o sistema confirma a **dualidade forte**: no ótimo,
`z* primal = z* dual`. As variáveis duais são exibidas como os **preços-sombra**
de cada restrição. A aba também mostra as **folgas complementares**: no ótimo, em
cada par primal-dual ao menos um lado é zero (a restrição está ativa **ou** seu
preço-sombra é nulo; a variável é usada **ou** sua restrição dual está ativa) —
todos os produtos `folga · preço` dão 0. É a ponte entre o método primal e a
teoria da dualidade.

## Bibliotecas / frameworks de matemática integrados

| Biblioteca | Papel |
|---|---|
| [`glpk.js`](https://www.npmjs.com/package/glpk.js) | GLPK (GNU Linear Programming Kit) compilado para WASM. **Solver de referência** — verdade de base para validar o motor. |
| [`fraction.js`](https://www.npmjs.com/package/fraction.js) | Aritmética **racional exata** — os quadros aparecem em frações (ex.: `4/3`), sem ruído de ponto flutuante, como no livro-texto. |
| [`javascript-lp-solver`](https://www.npmjs.com/package/javascript-lp-solver) | Solver de PL/MILP em JS puro — **segunda opinião** na validação. |

## Estrutura

```
src/
  core/
    types.ts         # Modelo de PPL + tipos de saída (quadros, passos)
    frac.ts          # Helpers de fração exata (fraction.js)
    simplexCore.ts   # Forma padrão + Simplex + Duas Fases (motor passo a passo)
    parser.ts        # Lê PPL em texto "livro-texto"
    problems.ts      # Catálogo de problemas do curso por semana (7, 8, 9, 10)
    flowTrace.ts     # Árvore de decisão (grafo) + traço do caminho de cada problema
    dual.ts          # Constrói o dual de um PPL + forma resolvível + preços-sombra
    pivotQuiz.ts     # Gera perguntas "preveja o pivô" (entra/sai) a partir de solve()
  solvers/
    glpkSolver.ts    # Adaptador GLPK (referência)
    jsLpSolver.ts    # Adaptador javascript-lp-solver
    validate.ts      # Compara motor x GLPK x jsLP
  components/
    TableauView.tsx     # Renderiza um quadro com o pivô destacado
    FeasibleRegion.tsx  # Visão geométrica: região factível + caminho do Simplex (2 vars)
    WorkflowView.tsx    # Aba Workflow: árvore de decisão estilo n8n + seletor de semana
    DualView.tsx        # Aba Dualidade: monta o dual, resolve e checa a dualidade forte
    PivotQuizView.tsx   # Aba Preveja o Pivô: drill de entrada/saída com reveal anotado
  App.tsx            # UI: abas (Resolver / Workflow / Dualidade / …) + passos + visão geométrica + validação
test/
  simplex.test.ts    # Casos com ótimo conhecido + validação cruzada
  parser.test.ts     # Parser de PPL
  dual.test.ts       # Dual + dualidade forte (z* primal = z* dual) + folga complementar
  pivotQuiz.test.ts  # Perguntas de pivô: entrada por Dantzig + saída pela razão mínima
```

## Como rodar

```bash
npm install
npm run dev        # servidor de desenvolvimento (Vite)
npm test           # roda os testes (vitest)
npm run build      # build de produção
npm run typecheck  # checagem de tipos
```

## Formato de entrada (texto)

```
max 3x1 + 5x2
s.t.
x1 <= 4
2x2 <= 12
3x1 + 2x2 <= 18
x1, x2 >= 0
```

- A primeira linha com `max`/`min` (ou `maximizar`/`minimizar`) define o objetivo.
- Linhas com `<=`, `>=`, `=` são restrições.
- Linhas de não-negatividade (`x1, x2 >= 0`) são assumidas e ignoradas.
- Coeficientes implícitos (`x1`) e negativos (`-2x2`) são suportados.

## Como funciona o motor (resumo)

- **Forma padrão:** normaliza RHS ≥ 0; adiciona folga (`s`) em `<=`, excesso
  (`e`) em `>=` e variável artificial (`a`) em `>=`/`=`.
- **Fase única:** se só há `<=`, as folgas formam a base inicial → Simplex direto.
- **Duas fases:** se há artificiais, a **Fase 1** minimiza a soma das artificiais
  (detecta inviabilidade se sobrar artificial positiva); a **Fase 2** otimiza o
  objetivo original, proibindo as artificiais de reentrarem.
- **Saídas:** `optimal` (com solução e valor ótimo em fração), `infeasible` ou
  `unbounded`. Regra de Dantzig para entrada e desempate à la Bland na saída.
- **Teste da razão visível:** em cada pivô, o quadro mostra a coluna `θ = b ÷ coluna
  que entra` (frações exatas), com a **menor razão destacada** — é ela que define a
  variável que sai. Linhas com coeficiente ≤ 0 ficam fora do teste (`—`).
