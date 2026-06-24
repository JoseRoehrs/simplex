import { useState } from 'react';
import { parseLP } from '../core/parser';
import { buildPivotQuestions, type PivotQuestion } from '../core/pivotQuiz';
import type { TableauSnapshot } from '../core/types';
import { TableauView } from './TableauView';

const EXAMPLES: Record<string, string> = {
  'Fase única (max, ≤)': `max 3x1 + 5x2
s.t.
x1 <= 4
2x2 <= 12
3x1 + 2x2 <= 18
x1, x2 >= 0`,
  'Duas fases (min, ≥)': `min 2x1 + 3x2
s.t.
x1 + x2 >= 4
2x1 + x2 >= 5
x1, x2 >= 0`,
  'Mistas': `max 4x1 + 3x2
s.t.
2x1 + 3x2 <= 12
x1 + x2 >= 2
x1 <= 5
x1, x2 >= 0`,
};

/** Quadro somente-leitura para a PERGUNTA (sem destaque de pivô, θ ou explicação). */
function QuizTableau({
  tableau,
  highlightCol,
}: {
  tableau: TableauSnapshot;
  highlightCol?: number;
}) {
  const { columns, rows, rhs, basis, objectiveRow, objectiveValue } = tableau;
  const hl = (j: number) => (j === highlightCol ? 'pivot-col' : '');
  return (
    <table className="tableau">
      <thead>
        <tr>
          <th className="corner">base</th>
          {columns.map((name, j) => (
            <th key={name} className={hl(j)}>
              {name}
            </th>
          ))}
          <th className="rhs-col">b</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <th className="basis-cell">{basis[i]}</th>
            {row.map((val, j) => (
              <td key={j} className={hl(j)}>
                {val}
              </td>
            ))}
            <td className="rhs-col">{rhs[i]}</td>
          </tr>
        ))}
        <tr className="obj-row">
          <th className="basis-cell">
            z<sub>j</sub>−c<sub>j</sub>
          </th>
          {objectiveRow.map((val, j) => (
            <td key={j} className={hl(j)}>
              {val}
            </td>
          ))}
          <td className="rhs-col">{objectiveValue}</td>
        </tr>
      </tbody>
    </table>
  );
}

type Sub = 'enter' | 'leave' | 'reveal';

export function PivotQuizView() {
  const [text, setText] = useState(EXAMPLES['Fase única (max, ≤)']);
  const [questions, setQuestions] = useState<PivotQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [qi, setQi] = useState(0);
  const [sub, setSub] = useState<Sub>('enter');
  const [pickedEnter, setPickedEnter] = useState<string | null>(null);
  const [pickedLeave, setPickedLeave] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [done, setDone] = useState(false);

  function start() {
    setError(null);
    try {
      const qs = buildPivotQuestions(parseLP(text));
      if (qs.length === 0) {
        setError(
          'Este PPL não tem pivôs de Dantzig (resolve sem iterar, ou é inviável/ilimitado de cara). Tente outro exemplo.',
        );
        setQuestions(null);
        return;
      }
      setQuestions(qs);
      setQi(0);
      setSub('enter');
      setPickedEnter(null);
      setPickedLeave(null);
      setScore(0);
      setMaxScore(0);
      setDone(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setQuestions(null);
    }
  }

  function chooseEnter(name: string) {
    if (pickedEnter !== null) return;
    setPickedEnter(name);
    setMaxScore((m) => m + 1);
    if (name === questions![qi].entering) setScore((s) => s + 1);
    setSub('leave');
  }

  function chooseLeave(name: string) {
    if (pickedLeave !== null) return;
    setPickedLeave(name);
    setMaxScore((m) => m + 1);
    if (name === questions![qi].leaving) setScore((s) => s + 1);
    setSub('reveal');
  }

  function nextQuestion() {
    if (qi < questions!.length - 1) {
      setQi(qi + 1);
      setSub('enter');
      setPickedEnter(null);
      setPickedLeave(null);
    } else {
      setDone(true);
    }
  }

  // ---- Tela inicial / entrada ----
  if (!questions) {
    return (
      <div className="lab">
        <p className="lead-p">
          Treine o coração do Simplex: a cada quadro, <b>preveja você</b> qual variável{' '}
          <b>entra</b> (custo reduzido mais negativo — regra de Dantzig) e qual <b>sai</b>{' '}
          (teste da razão mínima). O motor confere sua resposta e explica o porquê.
        </p>
        <section className="input-panel">
          <div className="examples">
            <span>Exemplos:</span>
            {Object.keys(EXAMPLES).map((name) => (
              <button key={name} className="chip" onClick={() => setText(EXAMPLES[name])}>
                {name}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            rows={8}
          />
          <button className="solve-btn" onClick={start}>
            Iniciar treino
          </button>
          {error && <p className="error">⚠ {error}</p>}
        </section>
      </div>
    );
  }

  // ---- Tela final ----
  if (done) {
    const pct = maxScore ? Math.round((score / maxScore) * 100) : 0;
    return (
      <div className="lab">
        <div className="lab-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.4rem' }}>{pct >= 80 ? '🏆' : pct >= 50 ? '🎯' : '📖'}</div>
          <h2 style={{ margin: '6px 0' }}>
            Você acertou {score} de {maxScore} ({pct}%)
          </h2>
          <p className="lead-p" style={{ margin: '0 auto 12px' }}>
            {pct >= 80
              ? 'Você domina a escolha de pivô (entrada por Dantzig + saída pela razão mínima).'
              : 'Revise: entra a do custo reduzido mais negativo; sai a da menor razão b ÷ coluna.'}
          </p>
          <button className="solve-btn" onClick={() => setQuestions(null)} style={{ marginTop: 0 }}>
            ↻ Novo treino
          </button>
        </div>
      </div>
    );
  }

  // ---- Pergunta atual ----
  const q = questions[qi];
  const enterOk = pickedEnter === q.entering;
  const leaveOk = pickedLeave === q.leaving;
  const cls = (name: string, picked: string | null, correct: string) => {
    if (picked === null) return 'quiz-opt';
    if (name === correct) return 'quiz-opt correct';
    if (name === picked) return 'quiz-opt wrong';
    return 'quiz-opt';
  };

  return (
    <div className="lab">
      <div className="lab-card">
        <div className="quiz-head">
          <span className="badge">
            Pivô {qi + 1} / {questions.length}
          </span>
          <span className="badge zval-badge">
            Fase {q.phase} · iteração {q.iteration}
          </span>
          <span className="badge zval-badge">Acertos: {score}</span>
        </div>

        <QuizTableau tableau={q.tableau} highlightCol={sub === 'enter' ? undefined : q.enteringCol} />

        {/* Pergunta 1: quem ENTRA */}
        <div className="quiz-q" style={{ marginTop: 12 }}>
          1. Qual variável <b>entra</b> na base? (custo reduzido z<sub>j</sub>−c<sub>j</sub> mais
          negativo)
        </div>
        <div className="quiz-opts">
          {q.enteringOptions.map((name) => (
            <button
              key={name}
              className={cls(name, pickedEnter, q.entering)}
              onClick={() => chooseEnter(name)}
              disabled={pickedEnter !== null}
            >
              <span className="mark">
                {pickedEnter !== null && name === q.entering
                  ? '✓'
                  : pickedEnter === name
                    ? '✗'
                    : '·'}
              </span>
              <span>{name}</span>
            </button>
          ))}
        </div>
        {pickedEnter !== null && (
          <div className={`quiz-feedback ${enterOk ? 'right' : 'no'}`}>
            <b>{enterOk ? '✓ Isso! ' : '✗ Não. '}</b>
            Entra <b>{q.entering}</b> — tem o custo reduzido mais negativo (
            {q.tableau.objectiveRow[q.enteringCol]}). A coluna dela ficou destacada para o teste
            da razão.
          </div>
        )}

        {/* Pergunta 2: quem SAI (aparece após responder a entrada) */}
        {sub !== 'enter' && (
          <>
            <div className="quiz-q" style={{ marginTop: 14 }}>
              2. Com <b>{q.entering}</b> entrando, qual variável <b>sai</b>? (menor razão b ÷
              coluna {q.entering}, só coeficientes &gt; 0)
            </div>
            <div className="quiz-opts">
              {q.leavingOptions.map((name) => (
                <button
                  key={name}
                  className={cls(name, pickedLeave, q.leaving)}
                  onClick={() => chooseLeave(name)}
                  disabled={pickedLeave !== null}
                >
                  <span className="mark">
                    {pickedLeave !== null && name === q.leaving
                      ? '✓'
                      : pickedLeave === name
                        ? '✗'
                        : '·'}
                  </span>
                  <span>{name}</span>
                </button>
              ))}
            </div>
            {pickedLeave !== null && (
              <div className={`quiz-feedback ${leaveOk ? 'right' : 'no'}`}>
                <b>{leaveOk ? '✓ Exato! ' : '✗ Não. '}</b>
                Sai <b>{q.leaving}</b>.
              </div>
            )}
          </>
        )}

        {/* Reveal: quadro completo anotado pelo motor */}
        {sub === 'reveal' && (
          <div style={{ marginTop: 16 }}>
            <div className="quiz-q">Quadro com o pivô e o teste da razão:</div>
            <TableauView step={q.step} />
            <button className="solve-btn" onClick={nextQuestion} style={{ marginTop: 6 }}>
              {qi < questions.length - 1 ? 'Próximo pivô →' : 'Ver resultado'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
