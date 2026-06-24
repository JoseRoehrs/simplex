import { useMemo, useState } from 'react';

/** Banco de questões do quiz (portado do laboratório estático). */
interface Question {
  q: string;
  opts: string[];
  correct: number;
  why: string;
  weight: number;
  tag: string;
}

const QUESTIONS: Question[] = [
  {
    q: 'Quando uma restrição é do tipo "≥", quais variáveis precisamos adicionar para colocá-la na forma padrão?',
    opts: [
      'Apenas uma variável de folga (+)',
      'Uma variável de excesso (−) e uma artificial (+)',
      'Apenas uma variável artificial',
      'Uma variável de folga (+) e uma artificial (+)',
    ],
    correct: 1,
    why: 'Em "≥" subtraímos o EXCESSO (com sinal −) para virar igualdade e, como o excesso entra com −1, ele não serve de base; por isso somamos também uma variável ARTIFICIAL (+1) para ter uma base inicial.',
    weight: 3,
    tag: 'forma padrão',
  },
  {
    q: 'Para colocar na forma padrão, qual variável uma restrição de IGUALDADE "=" recebe?',
    opts: [
      'Uma variável de folga (+)',
      'Uma variável de excesso (−)',
      'Apenas uma variável ARTIFICIAL (+)',
      'Nenhuma, já está pronta para ser base',
    ],
    correct: 2,
    why: 'Uma "=" já é igualdade: não precisa de folga nem de excesso, mas também não tem coluna que sirva de base inicial. Por isso adicionamos só uma ARTIFICIAL (+1). Resumo: ≤ → folga; ≥ → excesso + artificial; = → artificial.',
    weight: 3,
    tag: 'forma padrão',
  },
  {
    q: 'No problema (b) — Minimizar Z = 2x₁ + 4x₂ + 10x₃ — a restrição "x₁ + x₂ + x₃ ≤ 120" recebe:',
    opts: ['Excesso e artificial', 'Apenas variável de folga', 'Apenas artificial', 'Nada, já está padronizada'],
    correct: 1,
    why: 'Restrições "≤" recebem somente variável de FOLGA (+), que já serve como base inicial viável. Só a restrição "≥" desse problema (x₁+2x₂+5x₃ ≥ 30) precisa de excesso + artificial.',
    weight: 3,
    tag: 'forma padrão',
  },
  {
    q: 'Qual é o objetivo da PRIMEIRA FASE do método simplex de duas fases?',
    opts: [
      'Maximizar a função objetivo original Z',
      'Minimizar w = soma das variáveis artificiais',
      'Minimizar a função objetivo original Z',
      'Maximizar a soma das variáveis de folga',
    ],
    correct: 1,
    why: 'A Fase 1 ignora o objetivo real e tenta apenas tornar w = (soma das artificiais) igual a zero. Se conseguir w = 0, encontramos uma solução básica viável para começar a Fase 2.',
    weight: 3,
    tag: 'duas fases',
  },
  {
    q: 'Em um problema de MAXIMIZAÇÃO, qual variável escolhemos para ENTRAR na base?',
    opts: [
      'A de menor (mais negativo) valor de (cⱼ − zⱼ)',
      'A de maior (mais positivo) valor de (cⱼ − zⱼ)',
      'A primeira variável não-básica da esquerda',
      'A variável artificial de maior coeficiente',
    ],
    correct: 1,
    why: 'Maximizando, queremos aumentar Z. Entra a variável com (cⱼ − zⱼ) mais positivo, pois é a que mais aumenta o objetivo por unidade. Paramos quando todos (cⱼ − zⱼ) ≤ 0.',
    weight: 3,
    tag: 'pivô',
  },
  {
    q: 'Em uma MINIMIZAÇÃO (resolvendo direto), qual variável escolhemos para ENTRAR na base?',
    opts: [
      'A de (cⱼ − zⱼ) mais POSITIVO',
      'A de (cⱼ − zⱼ) mais NEGATIVO',
      'A primeira variável não-básica da esquerda',
      'A variável artificial de maior custo',
    ],
    correct: 1,
    why: 'Minimizando, queremos DIMINUIR Z: entra a variável com (cⱼ − zⱼ) mais negativo. Paramos quando todos (cⱼ − zⱼ) ≥ 0. Dica: converta "min Z" em "max −Z" e use a regra do mais positivo.',
    weight: 3,
    tag: 'pivô',
  },
  {
    q: 'O "teste da razão" (menor quociente b / coluna-pivô positiva) serve para:',
    opts: [
      'Escolher qual variável entra na base',
      'Decidir qual variável SAI da base (mantendo a viabilidade)',
      'Calcular o valor ótimo de Z',
      'Detectar soluções alternativas',
    ],
    correct: 1,
    why: 'Depois de escolher quem entra, o teste da razão indica quem sai: o menor quociente positivo garante que nenhum b fique negativo, preservando a viabilidade da nova solução básica.',
    weight: 3,
    tag: 'pivô',
  },
  {
    q: 'O que fazemos com as variáveis artificiais ao passar da Fase 1 para a Fase 2?',
    opts: [
      'Mantemos com custo +1 na função objetivo',
      'Descartamos suas colunas (ou impedimos que reentrem) e voltamos ao objetivo original',
      'Transformamos as artificiais em variáveis de folga',
      'Multiplicamos suas colunas por −1',
    ],
    correct: 1,
    why: 'Cumprido seu papel (servir de base inicial), as artificiais são removidas/bloqueadas. A Fase 2 recoloca a função objetivo verdadeira e continua a partir da base viável encontrada.',
    weight: 2,
    tag: 'duas fases',
  },
  {
    q: 'Ao final da Fase 1 obtivemos w* = 3 (diferente de zero). O que isso significa?',
    opts: [
      'A solução é ótima e Z = 3',
      'O problema é ilimitado',
      'O problema é INVIÁVEL (não existe solução)',
      'Devemos repetir a Fase 1 com outro pivô',
    ],
    correct: 2,
    why: 'Se não é possível zerar as artificiais (w* > 0), nenhum ponto satisfaz todas as restrições simultaneamente: o problema é inviável e não faz sentido seguir para a Fase 2.',
    weight: 2,
    tag: 'diagnóstico',
  },
  {
    q: 'Na coluna da variável que entraria, TODOS os coeficientes são ≤ 0. O que concluímos?',
    opts: ['A solução atual é ótima', 'O problema é inviável', 'O problema é ILIMITADO', 'Há um erro de cálculo no quadro'],
    correct: 2,
    why: 'Sem nenhum coeficiente positivo, não há razão válida (ninguém limita a entrada): podemos aumentar a variável indefinidamente e Z cresce sem limite. Isso é solução ilimitada.',
    weight: 2,
    tag: 'diagnóstico',
  },
  {
    q: 'Uma variável NÃO-básica tem (cⱼ − zⱼ) = 0 no quadro ótimo. Isso indica:',
    opts: [
      'Erro: deveria ter entrado na base',
      'Solução ilimitada',
      'Existência de soluções ÓTIMAS ALTERNATIVAS (mesmo Z)',
      'Que a Fase 1 falhou',
    ],
    correct: 2,
    why: 'Reduzido nulo numa não-básica significa que ela poderia entrar sem mudar Z: existe outro vértice ótimo e, portanto, todo um segmento de soluções com o mesmo valor ótimo.',
    weight: 1,
    tag: 'diagnóstico',
  },
  {
    q: 'No problema (a) — Maximizar Z = x₁ + 2x₂ + x₃ com as duas restrições "≥" — qual é o desfecho?',
    opts: ['Solução ótima única', 'Solução INVIÁVEL', 'Solução ILIMITADA (Z → ∞)', 'Múltiplas soluções ótimas finitas'],
    correct: 2,
    why: 'Com duas restrições "≥" (apenas limites inferiores) e objetivo de máximo, nada impede as variáveis de crescerem. A Fase 1 acha um ponto viável, mas a Fase 2 revela que Z é ilimitado.',
    weight: 1,
    tag: 'diagnóstico',
  },
];

interface SessionQuestion extends Question {
  order: number[]; // permutação das alternativas
  correctShuffled: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Ordem aleatória ponderada (Efraimidis–Spirakis): essenciais caem primeiro. */
function buildSession(): SessionQuestion[] {
  return QUESTIONS.map((q) => ({ q, key: Math.pow(Math.random(), 1 / (q.weight || 1)) }))
    .sort((a, b) => b.key - a.key)
    .map(({ q }) => {
      const order = shuffle(q.opts.map((_, i) => i));
      return { ...q, order, correctShuffled: order.indexOf(q.correct) };
    });
}

const LETTER = (i: number) => String.fromCharCode(65 + i);

export function QuizView() {
  const [session, setSession] = useState<SessionQuestion[]>(buildSession);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => QUESTIONS.map(() => null));
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const score = useMemo(
    () => answers.filter((a, idx) => a !== null && a === session[idx]?.correctShuffled).length,
    [answers, session],
  );

  function restart() {
    setSession(buildSession());
    setI(0);
    setAnswers(QUESTIONS.map(() => null));
    setPicked(null);
    setDone(false);
  }

  function choose(k: number) {
    if (picked !== null) return;
    setPicked(k);
    setAnswers((prev) => {
      const next = prev.slice();
      next[i] = k;
      return next;
    });
  }

  function next() {
    if (i < session.length - 1) {
      setI(i + 1);
      setPicked(answers[i + 1]);
    } else {
      setDone(true);
    }
  }

  if (done) {
    const pct = Math.round((score / session.length) * 100);
    const msg =
      pct >= 80
        ? 'Excelente! Você domina o método das duas fases.'
        : pct >= 50
          ? 'Bom trabalho! Revise os pontos errados na aba Teoria.'
          : 'Vale a pena revisar a Teoria e a Colinha e tentar de novo.';
    return (
      <div className="lab">
        <div className="lab-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.4rem' }}>{pct >= 80 ? '🏆' : pct >= 50 ? '🎯' : '📖'}</div>
          <h2 style={{ margin: '6px 0' }}>
            Você acertou {score} de {session.length} ({pct}%)
          </h2>
          <p className="lead-p" style={{ margin: '0 auto 12px' }}>
            {msg}
          </p>
          <button className="solve-btn" onClick={restart}>
            ↻ Refazer o quiz
          </button>
        </div>

        <h3>Gabarito completo</h3>
        {session.map((q, idx) => {
          const ans = answers[idx];
          return (
            <div className="lab-card" key={idx}>
              <div className="quiz-q" style={{ fontSize: '1rem' }}>
                {idx + 1}. {q.q}
              </div>
              <div className="quiz-opts">
                {q.order.map((origIdx, k) => {
                  const isCorrect = k === q.correctShuffled;
                  const isYours = k === ans;
                  const cls = isCorrect ? 'quiz-opt correct' : isYours ? 'quiz-opt wrong' : 'quiz-opt';
                  return (
                    <div className={cls} key={k}>
                      <span className="mark">{isCorrect ? '✓' : isYours ? '✗' : LETTER(k)}</span>
                      <span>{q.opts[origIdx]}</span>
                    </div>
                  );
                })}
              </div>
              <div className={`quiz-feedback ${ans === q.correctShuffled ? 'right' : 'no'}`}>
                {ans === null ? (
                  <b>↷ Pulada. </b>
                ) : ans === q.correctShuffled ? (
                  <b>✓ Você acertou. </b>
                ) : (
                  <b>✗ Você errou. </b>
                )}
                {q.why}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const q = session[i];
  const pct = Math.round((i / session.length) * 100);
  return (
    <div className="lab">
      <p className="lead-p">Questões com feedback explicado. Erre à vontade: cada resposta vira aprendizado.</p>
      <div className="lab-card">
        <div className="quiz-head">
          <div className="quiz-progress">
            <i style={{ width: `${pct}%` }} />
          </div>
          <span className="badge">
            Questão {i + 1} / {session.length}
          </span>
          <span className="badge zval-badge">Acertos: {score}</span>
        </div>

        <div className="quiz-q">{q.q}</div>
        <div className="quiz-opts">
          {q.order.map((origIdx, k) => {
            let cls = 'quiz-opt';
            if (picked !== null) {
              if (k === q.correctShuffled) cls = 'quiz-opt correct';
              else if (k === picked) cls = 'quiz-opt wrong';
            }
            return (
              <button className={cls} key={k} onClick={() => choose(k)} disabled={picked !== null}>
                <span className="mark">
                  {picked !== null && k === q.correctShuffled ? '✓' : picked === k ? '✗' : LETTER(k)}
                </span>
                <span>{q.opts[origIdx]}</span>
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className={`quiz-feedback ${picked === q.correctShuffled ? 'right' : 'no'}`}>
            <b>{picked === q.correctShuffled ? '✓ Correto! ' : '✗ Não foi dessa vez. '}</b>
            {q.why}
          </div>
        )}

        <div className="quiz-actions">
          {picked === null && (
            <button className="ft-btn" onClick={next}>
              Pular
            </button>
          )}
          <button className="solve-btn" onClick={next} disabled={picked === null} style={{ marginTop: 0 }}>
            {i < session.length - 1 ? 'Próxima →' : 'Ver resultado'}
          </button>
        </div>
      </div>
    </div>
  );
}
