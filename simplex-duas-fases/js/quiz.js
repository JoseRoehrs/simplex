/* ============================================================
   Banco de questões (quiz interativo)
   ------------------------------------------------------------
   Cada questão tem um "weight" (peso de importância):
     3 = ESSENCIAL  — cai quase sempre na prova / você PRECISA saber
     2 = IMPORTANTE — interpretar resultados (inviável, ilimitado…)
     1 = COMPLEMENTAR — bom saber, mas menos provável numa prova curta
   O gerador (buildQuiz) usa esse peso para que os pontos mais
   importantes "caiam" primeiro, embora a ordem mude a cada execução.
   ============================================================ */
(function (global) {
  "use strict";
  var QUESTIONS = [
    {
      q: 'Quando uma restrição é do tipo "≥", quais variáveis precisamos adicionar para colocá-la na forma padrão?',
      opts: [
        'Apenas uma variável de folga (+)',
        'Uma variável de excesso (−) e uma artificial (+)',
        'Apenas uma variável artificial',
        'Uma variável de folga (+) e uma artificial (+)'
      ],
      correct: 1,
      why: 'Em "≥" subtraímos o EXCESSO (surplus, com sinal −) para virar igualdade e, como o excesso entra com −1, ele não serve de base; por isso somamos também uma variável ARTIFICIAL (+1) para ter uma base inicial.',
      weight: 3, tag: 'forma padrão'
    },
    {
      q: 'Para colocar na forma padrão, qual variável uma restrição de IGUALDADE "=" recebe?',
      opts: [
        'Uma variável de folga (+)',
        'Uma variável de excesso (−)',
        'Apenas uma variável ARTIFICIAL (+)',
        'Nenhuma, já está pronta para ser base'
      ],
      correct: 2,
      why: 'Uma "=" já é igualdade: não precisa de folga nem de excesso, mas também não tem coluna que sirva de base inicial. Por isso adicionamos só uma ARTIFICIAL (+1) para iniciar a Fase 1. Resumo de bolso: ≤ → folga; ≥ → excesso + artificial; = → artificial.',
      weight: 3, tag: 'forma padrão'
    },
    {
      q: 'No problema (b) — Minimizar Z = 2x₁ + 4x₂ + 10x₃ — a restrição "x₁ + x₂ + x₃ ≤ 120" recebe:',
      opts: [
        'Excesso e artificial',
        'Apenas variável de folga',
        'Apenas artificial',
        'Nada, já está padronizada'
      ],
      correct: 1,
      why: 'Restrições "≤" recebem somente variável de FOLGA (+), que já serve como base inicial viável. Só a restrição "≥" desse problema (x₁+2x₂+5x₃ ≥ 30) precisa de excesso + artificial.',
      weight: 3, tag: 'forma padrão'
    },
    {
      q: 'Qual é o objetivo da PRIMEIRA FASE do método simplex de duas fases?',
      opts: [
        'Maximizar a função objetivo original Z',
        'Minimizar w = soma das variáveis artificiais',
        'Minimizar a função objetivo original Z',
        'Maximizar a soma das variáveis de folga'
      ],
      correct: 1,
      why: 'A Fase 1 ignora o objetivo real e tenta apenas tornar w = (soma das artificiais) igual a zero. Se conseguir w = 0, encontramos uma solução básica viável para começar a Fase 2.',
      weight: 3, tag: 'duas fases'
    },
    {
      q: 'Em um problema de MAXIMIZAÇÃO, qual variável escolhemos para ENTRAR na base?',
      opts: [
        'A de menor (mais negativo) valor de (cⱼ − zⱼ)',
        'A de maior (mais positivo) valor de (cⱼ − zⱼ)',
        'A primeira variável não-básica da esquerda',
        'A variável artificial de maior coeficiente'
      ],
      correct: 1,
      why: 'Maximizando, queremos aumentar Z. Entra a variável com (cⱼ − zⱼ) mais positivo, pois é a que mais aumenta o objetivo por unidade. Paramos quando todos (cⱼ − zⱼ) ≤ 0.',
      weight: 3, tag: 'pivô'
    },
    {
      q: 'Em uma MINIMIZAÇÃO (resolvendo direto, sem converter para max), qual variável escolhemos para ENTRAR na base?',
      opts: [
        'A de (cⱼ − zⱼ) mais POSITIVO',
        'A de (cⱼ − zⱼ) mais NEGATIVO',
        'A primeira variável não-básica da esquerda',
        'A variável artificial de maior custo'
      ],
      correct: 1,
      why: 'Minimizando, queremos DIMINUIR Z: entra a variável com (cⱼ − zⱼ) mais negativo (a que mais reduz o objetivo). Paramos quando todos (cⱼ − zⱼ) ≥ 0. Dica: se preferir, converta "min Z" em "max −Z" e use a regra do mais positivo.',
      weight: 3, tag: 'pivô'
    },
    {
      q: 'O "teste da razão" (menor quociente b / coluna-pivô positiva) serve para:',
      opts: [
        'Escolher qual variável entra na base',
        'Decidir qual variável SAI da base (mantendo a viabilidade)',
        'Calcular o valor ótimo de Z',
        'Detectar soluções alternativas'
      ],
      correct: 1,
      why: 'Depois de escolher quem entra, o teste da razão indica quem sai: o menor quociente positivo garante que nenhum b fique negativo, preservando a viabilidade da nova solução básica.',
      weight: 3, tag: 'pivô'
    },
    {
      q: 'O que fazemos com as variáveis artificiais ao passar da Fase 1 para a Fase 2?',
      opts: [
        'Mantemos com custo +1 na função objetivo',
        'Descartamos suas colunas (ou impedimos que reentrem) e voltamos ao objetivo original',
        'Transformamos as artificiais em variáveis de folga',
        'Multiplicamos suas colunas por −1'
      ],
      correct: 1,
      why: 'Cumprido seu papel (servir de base inicial), as artificiais são removidas/bloqueadas. A Fase 2 recoloca a função objetivo verdadeira e continua a partir da base viável encontrada.',
      weight: 2, tag: 'duas fases'
    },
    {
      q: 'Ao final da Fase 1 obtivemos w* = 3 (diferente de zero). O que isso significa?',
      opts: [
        'A solução é ótima e Z = 3',
        'O problema é ilimitado',
        'O problema é INVIÁVEL (não existe solução)',
        'Devemos repetir a Fase 1 com outro pivô'
      ],
      correct: 2,
      why: 'Se não é possível zerar as artificiais (w* > 0), nenhum ponto satisfaz todas as restrições simultaneamente: o problema é inviável e não faz sentido seguir para a Fase 2.',
      weight: 2, tag: 'diagnóstico'
    },
    {
      q: 'Na coluna da variável que entraria, TODOS os coeficientes são ≤ 0. O que concluímos?',
      opts: [
        'A solução atual é ótima',
        'O problema é inviável',
        'O problema é ILIMITADO',
        'Há um erro de cálculo no quadro'
      ],
      correct: 2,
      why: 'Sem nenhum coeficiente positivo, não há razão válida (ninguém limita a entrada): podemos aumentar a variável indefinidamente e Z cresce sem limite. Isso é solução ilimitada.',
      weight: 2, tag: 'diagnóstico'
    },
    {
      q: 'Uma variável NÃO-básica tem (cⱼ − zⱼ) = 0 no quadro ótimo. Isso indica:',
      opts: [
        'Erro: deveria ter entrado na base',
        'Solução ilimitada',
        'Existência de soluções ÓTIMAS ALTERNATIVAS (mesmo Z)',
        'Que a Fase 1 falhou'
      ],
      correct: 2,
      why: 'Reduzido nulo numa não-básica significa que ela poderia entrar sem mudar Z: existe outro vértice ótimo e, portanto, todo um segmento de soluções com o mesmo valor ótimo.',
      weight: 1, tag: 'diagnóstico'
    },
    {
      q: 'No problema (a) — Maximizar Z = x₁ + 2x₂ + x₃ com as duas restrições "≥" — qual é o desfecho?',
      opts: [
        'Solução ótima única',
        'Solução INVIÁVEL',
        'Solução ILIMITADA (Z → ∞)',
        'Múltiplas soluções ótimas finitas'
      ],
      correct: 2,
      why: 'Com duas restrições "≥" (apenas limites inferiores) e objetivo de máximo, nada impede as variáveis de crescerem. A Fase 1 acha um ponto viável, mas a Fase 2 revela que Z é ilimitado.',
      weight: 1, tag: 'diagnóstico'
    }
  ];

  /* ---------- Gerador de sessão de quiz ---------- */
  // Math.random é adequado aqui (roda no navegador).
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // embaralha as ALTERNATIVAS de uma questão, remapeando o índice da correta
  function shuffleOptions(q) {
    var order = shuffle(q.opts.map(function (_, i) { return i; }));
    return {
      q: q.q,
      opts: order.map(function (i) { return q.opts[i]; }),
      correct: order.indexOf(q.correct),
      why: q.why,
      weight: q.weight || 1,
      tag: q.tag || ''
    };
  }

  // Ordenação aleatória PONDERADA (Efraimidis–Spirakis):
  // chave = random^(1/peso). Peso alto => chave tende a ser maior => vem antes.
  // Resultado: a ordem muda toda vez, mas as questões ESSENCIAIS caem primeiro.
  function weightedOrder(list) {
    return list
      .map(function (q) { return { q: q, key: Math.pow(Math.random(), 1 / (q.weight || 1)) }; })
      .sort(function (a, b) { return b.key - a.key; })
      .map(function (x) { return x.q; });
  }

  // Monta uma sessão de quiz: ordem aleatória ponderada + alternativas embaralhadas.
  // opts.limit (opcional): quantidade máxima de questões (modo rápido).
  function buildQuiz(opts) {
    opts = opts || {};
    var ordered = weightedOrder(QUESTIONS);
    if (opts.limit && opts.limit < ordered.length) ordered = ordered.slice(0, opts.limit);
    return ordered.map(shuffleOptions);
  }

  global.QUIZ = QUESTIONS;        // banco bruto (compatibilidade)
  global.buildQuiz = buildQuiz;   // gerador de sessão (use este na UI)
})(typeof window !== 'undefined' ? window : globalThis);
