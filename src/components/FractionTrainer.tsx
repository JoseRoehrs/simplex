import { useEffect, useMemo, useRef, useState } from 'react';

/* -------------------------------------------------------------------------- */
/* Aritmética inteira self-contained (controle total dos passos exibidos).     */
/* Fração = numerador com sinal sobre denominador positivo.                    */
/* -------------------------------------------------------------------------- */

type Fr = { n: number; d: number };

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

/** Normaliza o sinal para o numerador e mantém o denominador positivo (sem reduzir). */
function rawFr(n: number, d: number): Fr {
  if (d < 0) {
    n = -n;
    d = -d;
  }
  return { n, d };
}

/** Fração na forma reduzida (lowest terms). */
function mk(n: number, d: number): Fr {
  const r = rawFr(n, d);
  const g = gcd(r.n, r.d);
  return { n: r.n / g, d: r.d / g };
}

function fracEq(a: Fr, b: Fr): boolean {
  return a.n * b.d === b.n * a.d;
}

function isReduced(f: Fr): boolean {
  return gcd(f.n, f.d) === 1;
}

/* -------------------------------------------------------------------------- */
/* Tokens de expressão para renderização visual                                */
/* -------------------------------------------------------------------------- */

type Tok = { kind: 'frac'; n: number; d: number } | { kind: 'text'; t: string };
const TF = (n: number, d: number): Tok => ({ kind: 'frac', n, d });
const TT = (t: string): Tok => ({ kind: 'text', t });

type Step = { title: string; line?: Tok[] };

type OpKey = 'add' | 'sub' | 'mul' | 'div' | 'simplify';
type Mode = OpKey | 'mix';

type Problem = {
  op: OpKey;
  question: Tok[];
  steps: Step[];
  answer: Fr;
  meta: { wrongAddDen?: Fr; wrongDivStraight?: Fr };
};

/* -------------------------------------------------------------------------- */
/* Construtores de solução passo a passo                                       */
/* -------------------------------------------------------------------------- */

function buildAddSub(a: Fr, b: Fr, op: '+' | '-'): Problem {
  const L = lcm(a.d, b.d);
  const k1 = L / a.d;
  const k2 = L / b.d;
  const an2 = a.n * k1;
  const bn2 = b.n * k2;
  const sum = op === '+' ? an2 + bn2 : an2 - bn2;
  const answer = mk(sum, L);

  const sym = op;
  const steps: Step[] = [{ title: 'A conta', line: [TF(a.n, a.d), TT(sym), TF(b.n, b.d)] }];

  if (a.d !== b.d) {
    steps.push({
      title: `Iguale os denominadores pelo MMC(${a.d}, ${b.d}) = ${L}`,
      line: [TF(an2, L), TT(sym), TF(bn2, L)],
    });
  } else {
    steps.push({
      title: `Os denominadores já são iguais (${L})`,
      line: [TF(an2, L), TT(sym), TF(bn2, L)],
    });
  }

  steps.push({
    title: `Opere só os numeradores: ${an2} ${sym} ${bn2} = ${sum} (mantém o denominador ${L})`,
    line: [TF(sum, L)],
  });

  if (!fracEq({ n: sum, d: L }, answer) || sum !== answer.n) {
    const g = gcd(sum, L);
    if (g !== 1 || L !== answer.d) {
      steps.push({
        title: `Simplifique dividindo por ${g}`,
        line: [TF(sum, L), TT('='), TF(answer.n, answer.d)],
      });
    }
  }

  return {
    op: op === '+' ? 'add' : 'sub',
    question: [TF(a.n, a.d), TT(sym), TF(b.n, b.d)],
    steps,
    answer,
    meta: { wrongAddDen: rawFr(op === '+' ? a.n + b.n : a.n - b.n, a.d + b.d) },
  };
}

function buildMul(a: Fr, b: Fr): Problem {
  const rn = a.n * b.n;
  const rd = a.d * b.d;
  const answer = mk(rn, rd);

  const steps: Step[] = [
    { title: 'A conta', line: [TF(a.n, a.d), TT('×'), TF(b.n, b.d)] },
    {
      title: `Multiplique em linha reta: ${a.n}×${b.n} = ${rn} (em cima) e ${a.d}×${b.d} = ${rd} (embaixo)`,
      line: [TF(rn, rd)],
    },
  ];
  const g = gcd(rn, rd);
  if (g !== 1 || rd !== answer.d) {
    steps.push({
      title: `Simplifique dividindo por ${g}`,
      line: [TF(rn, rd), TT('='), TF(answer.n, answer.d)],
    });
  }

  return {
    op: 'mul',
    question: [TF(a.n, a.d), TT('×'), TF(b.n, b.d)],
    steps,
    answer,
    meta: {},
  };
}

function buildDiv(a: Fr, b: Fr): Problem {
  // recíproco de b preservando o sinal
  const recip: Fr = { n: b.n < 0 ? -b.d : b.d, d: Math.abs(b.n) };
  const rn = a.n * recip.n;
  const rd = a.d * recip.d;
  const answer = mk(rn, rd);

  const steps: Step[] = [
    { title: 'A conta', line: [TF(a.n, a.d), TT('÷'), TF(b.n, b.d)] },
    {
      title: 'Manter · trocar · inverter — repita a 1ª, troque ÷ por × e inverta a 2ª',
      line: [TF(a.n, a.d), TT('×'), TF(recip.n, recip.d)],
    },
    {
      title: `Agora multiplique: ${a.n}×${recip.n} = ${rn} e ${a.d}×${recip.d} = ${rd}`,
      line: [TF(rn, rd)],
    },
  ];
  const g = gcd(rn, rd);
  if (g !== 1 || rd !== answer.d) {
    steps.push({
      title: `Simplifique dividindo por ${g}`,
      line: [TF(rn, rd), TT('='), TF(answer.n, answer.d)],
    });
  }

  return {
    op: 'div',
    question: [TF(a.n, a.d), TT('÷'), TF(b.n, b.d)],
    steps,
    answer,
    meta: { wrongDivStraight: rawFr(a.n * b.n, a.d * b.d) },
  };
}

function buildSimplify(a: Fr): Problem {
  const g = gcd(a.n, a.d);
  const answer = mk(a.n, a.d);
  return {
    op: 'simplify',
    question: [TF(a.n, a.d)],
    steps: [
      { title: 'Simplifique a fração', line: [TF(a.n, a.d)] },
      {
        title: `MDC(${Math.abs(a.n)}, ${a.d}) = ${g}. Divida em cima e embaixo por ${g}.`,
        line: [TF(a.n, a.d), TT('='), TF(answer.n, answer.d)],
      },
    ],
    answer,
    meta: {},
  };
}

/* -------------------------------------------------------------------------- */
/* Geração de problemas por dificuldade                                        */
/* -------------------------------------------------------------------------- */

type DiffKey = 'facil' | 'medio' | 'dificil';
type DiffCfg = { dens: number[]; numMax: number; neg: boolean };

const DIFF: Record<DiffKey, DiffCfg> = {
  facil: { dens: [2, 3, 4, 5], numMax: 6, neg: false },
  medio: { dens: [2, 3, 4, 5, 6, 7, 8, 9], numMax: 10, neg: true },
  dificil: { dens: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], numMax: 15, neg: true },
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function genFrac(cfg: DiffCfg): Fr {
  const d = pick(cfg.dens);
  let n = randInt(1, cfg.numMax);
  if (cfg.neg && Math.random() < 0.4) n = -n;
  return { n, d };
}

function genReducible(cfg: DiffCfg): Fr {
  const base = mk(randInt(1, cfg.numMax), pick(cfg.dens));
  const k = randInt(2, cfg.neg ? 6 : 4);
  let n = base.n * k;
  const d = base.d * k;
  if (cfg.neg && Math.random() < 0.4) n = -n;
  return { n, d };
}

function generate(mode: Mode, diff: DiffKey): Problem {
  const cfg = DIFF[diff];
  const op: OpKey =
    mode === 'mix' ? pick<OpKey>(['add', 'sub', 'mul', 'div', 'simplify']) : mode;

  switch (op) {
    case 'add':
      return buildAddSub(genFrac(cfg), genFrac(cfg), '+');
    case 'sub':
      return buildAddSub(genFrac(cfg), genFrac(cfg), '-');
    case 'mul':
      return buildMul(genFrac(cfg), genFrac(cfg));
    case 'div':
      return buildDiv(genFrac(cfg), genFrac(cfg));
    case 'simplify':
      return buildSimplify(genReducible(cfg));
  }
}

/* -------------------------------------------------------------------------- */
/* Parser da resposta do usuário                                               */
/* -------------------------------------------------------------------------- */

function parseInput(s: string): Fr | null {
  const t = s.trim().replace(/\s+/g, '');
  if (!t) return null;
  const m = t.match(/^(-?\d+)(?:\/(-?\d+))?$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const d = m[2] !== undefined ? parseInt(m[2], 10) : 1;
  if (d === 0) return null;
  return rawFr(n, d);
}

/* -------------------------------------------------------------------------- */
/* Componentes visuais                                                         */
/* -------------------------------------------------------------------------- */

function Frac({ n, d }: { n: number; d: number }) {
  if (d === 1) return <span className="ft-int">{n}</span>;
  const neg = n < 0;
  return (
    <span className="ft-frac">
      {neg && <span className="ft-sign">−</span>}
      <span className="ft-stack">
        <span className="ft-num">{Math.abs(n)}</span>
        <span className="ft-bar" />
        <span className="ft-den">{d}</span>
      </span>
    </span>
  );
}

function ExprLine({ tokens, big }: { tokens: Tok[]; big?: boolean }) {
  return (
    <div className={`ft-expr${big ? ' ft-expr-big' : ''}`}>
      {tokens.map((tk, i) =>
        tk.kind === 'frac' ? (
          <Frac key={i} n={tk.n} d={tk.d} />
        ) : (
          <span key={i} className="ft-op">
            {tk.t}
          </span>
        ),
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Metadados de UI                                                             */
/* -------------------------------------------------------------------------- */

const MODES: { key: Mode; label: string }[] = [
  { key: 'add', label: 'Soma +' },
  { key: 'sub', label: 'Subtração −' },
  { key: 'mul', label: 'Multiplicação ×' },
  { key: 'div', label: 'Divisão ÷' },
  { key: 'simplify', label: 'Simplificar' },
  { key: 'mix', label: 'Misturado 🎲' },
];

const DIFFS: { key: DiffKey; label: string }[] = [
  { key: 'facil', label: 'Fácil' },
  { key: 'medio', label: 'Médio' },
  { key: 'dificil', label: 'Difícil' },
];

const WHY: Record<OpKey, string> = {
  add: 'Aparece ao combinar termos de uma mesma linha do quadro.',
  sub: 'É o coração da atualização de linha: nova linha = linha − fator × linha-pivô.',
  mul: 'Usado ao escalar a linha-pivô (multiplicar a linha por um fator).',
  div: 'É exatamente o teste da razão: RHS ÷ coeficiente da coluna que entra.',
  simplify: 'Mantém os quadros limpos — toda fração do tableau é mostrada reduzida.',
};

function diagnose(problem: Problem, user: Fr): string | null {
  const m = problem.meta;
  if ((problem.op === 'add' || problem.op === 'sub') && m.wrongAddDen && fracEq(user, m.wrongAddDen)) {
    return 'Você somou também os denominadores. Não pode! Primeiro iguale os denominadores (MMC) e opere só os numeradores.';
  }
  if (problem.op === 'div' && m.wrongDivStraight && fracEq(user, m.wrongDivStraight)) {
    return 'Em divisão não se multiplica direto. Inverta a segunda fração (manter–trocar–inverter) e só então multiplique.';
  }
  return null;
}

type Verdict =
  | { kind: 'correct'; reduced: boolean }
  | { kind: 'wrong'; user: Fr; hint: string | null }
  | { kind: 'invalid' };

/* -------------------------------------------------------------------------- */
/* Componente principal                                                        */
/* -------------------------------------------------------------------------- */

export function FractionTrainer() {
  const [mode, setMode] = useState<Mode>('mix');
  const [diff, setDiff] = useState<DiffKey>('facil');
  const [seed, setSeed] = useState(0); // força nova geração
  const [input, setInput] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [scored, setScored] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0, best: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  // gera um problema novo sempre que modo/dificuldade/seed mudam
  const problem = useMemo(() => generate(mode, diff), [mode, diff, seed]);

  useEffect(() => {
    setInput('');
    setVerdict(null);
    setShowSteps(false);
    setScored(false);
    inputRef.current?.focus();
  }, [problem]);

  function nextProblem() {
    setSeed((s) => s + 1);
  }

  function handleCheck(e?: React.FormEvent) {
    e?.preventDefault();
    const user = parseInput(input);
    if (!user) {
      setVerdict({ kind: 'invalid' });
      return;
    }

    const correct = fracEq(user, problem.answer);
    if (correct) {
      setVerdict({ kind: 'correct', reduced: isReduced(user) });
    } else {
      setVerdict({ kind: 'wrong', user, hint: diagnose(problem, user) });
      setShowSteps(true);
    }

    // pontua apenas a primeira tentativa de cada questão
    if (!scored) {
      setScored(true);
      setScore((s) => {
        const streak = correct ? s.streak + 1 : 0;
        return {
          correct: s.correct + (correct ? 1 : 0),
          total: s.total + 1,
          streak,
          best: Math.max(s.best, streak),
        };
      });
    }
  }

  return (
    <section className="ft">
      <p className="ft-intro">
        No Simplex tudo vira fração: teste da razão, atualização de linha, redução de
        quadros. Treine aqui as quatro operações e a simplificação. Errou? A gente mostra{' '}
        <b>onde</b> e refaz a conta passo a passo. Responda como{' '}
        <code>3/4</code>, <code>-2/5</code> ou um inteiro como <code>2</code>.
      </p>

      {/* Controles */}
      <div className="ft-controls">
        <div className="ft-row">
          <span className="ft-row-label">Operação</span>
          <div className="ft-chips">
            {MODES.map((m) => (
              <button
                key={m.key}
                className={`ft-chip${mode === m.key ? ' active' : ''}`}
                onClick={() => setMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="ft-row">
          <span className="ft-row-label">Nível</span>
          <div className="ft-chips">
            {DIFFS.map((d) => (
              <button
                key={d.key}
                className={`ft-chip${diff === d.key ? ' active' : ''}`}
                onClick={() => setDiff(d.key)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Placar */}
      <div className="ft-score">
        <span>
          Acertos: <b>{score.correct}</b> / {score.total}
        </span>
        {score.total > 0 && (
          <span>Aproveitamento: <b>{Math.round((score.correct / score.total) * 100)}%</b></span>
        )}
        <span>
          Sequência: <b>{score.streak}</b>
          {score.streak >= 3 && ' 🔥'}
        </span>
        {score.best > 0 && <span className="ft-muted">recorde: {score.best}</span>}
      </div>

      {/* Cartão da questão */}
      <div className="ft-card">
        <div className="ft-why">💡 {WHY[problem.op]}</div>
        <div className="ft-question">
          <ExprLine tokens={problem.question} big />
          <span className="ft-eq">=</span>
          <span className="ft-q">?</span>
        </div>

        <form className="ft-answer" onSubmit={handleCheck}>
          <input
            ref={inputRef}
            className="ft-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ex.: 3/4"
            spellCheck={false}
            autoComplete="off"
            inputMode="text"
            aria-label="Sua resposta como fração"
          />
          <button type="submit" className="ft-btn ft-btn-primary">
            Verificar
          </button>
          <button
            type="button"
            className="ft-btn"
            onClick={() => setShowSteps((v) => !v)}
          >
            {showSteps ? 'Ocultar conta' : 'Mostrar como faz'}
          </button>
          <button type="button" className="ft-btn" onClick={nextProblem}>
            Nova questão →
          </button>
        </form>

        {/* Feedback */}
        {verdict?.kind === 'invalid' && (
          <div className="ft-feedback warn">
            Não entendi sua resposta. Use o formato <code>a/b</code> (ex.: <code>3/4</code>,{' '}
            <code>-2/5</code>) ou um inteiro.
          </div>
        )}

        {verdict?.kind === 'correct' && (
          <div className="ft-feedback ok">
            <b>✓ Correto!</b>{' '}
            {verdict.reduced ? (
              <>Resposta na forma reduzida. {score.streak >= 3 && 'Sequência em alta! 🔥'}</>
            ) : (
              <>
                Equivale ao certo, mas dá pra simplificar até{' '}
                <span className="ft-inline">
                  <Frac n={problem.answer.n} d={problem.answer.d} />
                </span>
                .
              </>
            )}
          </div>
        )}

        {verdict?.kind === 'wrong' && (
          <div className="ft-feedback fail">
            <div className="ft-wrong-head">
              <span>
                ✗ Quase! Você respondeu{' '}
                <span className="ft-inline">
                  <Frac n={verdict.user.n} d={verdict.user.d} />
                </span>
                , mas o certo é{' '}
                <span className="ft-inline">
                  <Frac n={problem.answer.n} d={problem.answer.d} />
                </span>
                .
              </span>
            </div>
            {verdict.hint && <div className="ft-hint">⚠ {verdict.hint}</div>}
            <div className="ft-hint-soft">Veja a conta resolvida abaixo 👇</div>
          </div>
        )}

        {/* Passo a passo visual */}
        {showSteps && (
          <div className="ft-steps">
            <h3>Passo a passo</h3>
            {problem.steps.map((st, i) => (
              <div key={i} className="ft-step">
                <div className="ft-step-num">{i + 1}</div>
                <div className="ft-step-body">
                  <div className="ft-step-title">{st.title}</div>
                  {st.line && <ExprLine tokens={st.line} />}
                </div>
              </div>
            ))}
            <div className="ft-result-line">
              Resposta:{' '}
              <span className="ft-inline ft-inline-final">
                <Frac n={problem.answer.n} d={problem.answer.d} />
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
