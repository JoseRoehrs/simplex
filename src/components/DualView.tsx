import { useState } from 'react';
import { parseLP } from '../core/parser';
import { solve } from '../core/simplexCore';
import {
  buildDual,
  complementarySlackness,
  recoverDualValues,
  type ComplementarySlackness,
  type DualProblem,
  type DualSign,
} from '../core/dual';
import type { LPModel, SimplexResult } from '../core/types';

const EXAMPLES: Record<string, string> = {
  'Max, todas ≤': `max 3x1 + 5x2
s.t.
x1 <= 4
2x2 <= 12
3x1 + 2x2 <= 18
x1, x2 >= 0`,
  'Min, todas ≥': `min 2x1 + 3x2
s.t.
x1 + x2 >= 4
2x1 + x2 >= 5
x1, x2 >= 0`,
  'Com igualdade': `max 2x1 + x2
s.t.
x1 + x2 = 4
x1 <= 3
x1, x2 >= 0`,
  'Restrições mistas': `max 4x1 + 3x2
s.t.
2x1 + 3x2 <= 12
x1 + x2 >= 2
x1 <= 5
x1, x2 >= 0`,
};

const TOL = 1e-6;

const SIGN_LABEL: Record<DualSign, string> = {
  '>=0': '≥ 0',
  '<=0': '≤ 0',
  free: 'livre',
};

const RELSYM: Record<string, string> = { '<=': '≤', '>=': '≥', '=': '=' };

/** Formata um número (coef.) compacto: 2 → "2", 2.5 → "2.5". */
function fmtNum(x: number): string {
  return Number.isInteger(x) ? String(x) : String(Number(x.toFixed(4)));
}

/** Monta uma expressão linear legível: "3x1 + 5x2", "−2y1 + y2". */
function expr(coeffs: number[], names: string[]): string {
  const parts = coeffs
    .map((c, i) => ({ c, name: names[i] }))
    .filter((t) => t.c !== 0);
  if (!parts.length) return '0';
  return parts
    .map((t, idx) => {
      const abs = Math.abs(t.c);
      const term = `${abs === 1 ? '' : fmtNum(abs)}${t.name}`;
      if (idx === 0) return t.c < 0 ? `−${term}` : term;
      return t.c < 0 ? `− ${term}` : `+ ${term}`;
    })
    .join(' ');
}

function formatModel(model: LPModel): string[] {
  const names = model.varNames ?? model.objective.map((_, i) => `x${i + 1}`);
  const lines = [`${model.sense} ${expr(model.objective, names)}`, 'sujeito a:'];
  for (const c of model.constraints) {
    lines.push(`${expr(c.coeffs, names)} ${RELSYM[c.relation]} ${fmtNum(c.rhs)}`);
  }
  lines.push(`${names.join(', ')} ≥ 0`);
  return lines;
}

/** Linhas formatadas do problema dual (objetivo, restrições, sinais das variáveis). */
function formatDual(dual: DualProblem): string[] {
  const yNames = dual.vars.map((v) => v.name);
  const lines = [
    `${dual.dualSense} ${expr(dual.vars.map((v) => v.objCoeff), yNames)}`,
    'sujeito a:',
  ];
  for (const c of dual.constraints) {
    lines.push(`${expr(c.coeffs, yNames)} ${RELSYM[c.relation]} ${fmtNum(c.rhs)}`);
  }
  lines.push(dual.vars.map((v) => `${v.name} ${SIGN_LABEL[v.sign]}`).join(',  '));
  return lines;
}

function Formula({ lines }: { lines: string[] }) {
  return (
    <div className="lab-formula">
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}

interface Solved {
  primal: LPModel;
  dual: DualProblem;
  primalRes: SimplexResult;
  dualRes: SimplexResult;
  shadow: Record<string, string>;
  cs: ComplementarySlackness | null;
}

export function DualView() {
  const [text, setText] = useState(EXAMPLES['Max, todas ≤']);
  const [solved, setSolved] = useState<Solved | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    setSolved(null);
    try {
      const primal = parseLP(text);
      const dual = buildDual(primal);
      const primalRes = solve(primal);
      const dualRes = solve(dual.solvable);
      const shadow = recoverDualValues(dual, dualRes.solution);
      const cs =
        primalRes.status === 'optimal' && dualRes.status === 'optimal'
          ? complementarySlackness(primal, dual, primalRes.solution, shadow)
          : null;
      setSolved({ primal, dual, primalRes, dualRes, shadow, cs });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="lab">
      <p className="lead-p">
        Todo PPL tem um <b>dual</b>. Resolver um equivale a resolver o outro: pela{' '}
        <b>dualidade forte</b>, no ótimo os dois têm o <b>mesmo z</b>. As variáveis duais são os{' '}
        <b>preços-sombra</b> das restrições. Gere o dual e veja o teorema na prática.
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
        <button className="solve-btn" onClick={handleGenerate}>
          Gerar dual
        </button>
        {error && <p className="error">⚠ {error}</p>}
      </section>

      {solved && <DualResult {...solved} />}
    </div>
  );
}

function DualResult({ primal, dual, primalRes, dualRes, shadow, cs }: Solved) {
  const bothOptimal = primalRes.status === 'optimal' && dualRes.status === 'optimal';
  const strongHolds =
    bothOptimal &&
    Math.abs((primalRes.numericObjective ?? NaN) - (dualRes.numericObjective ?? NaN)) <= TOL;

  return (
    <>
      <h3>Primal</h3>
      <Formula lines={formatModel(primal)} />

      <div className="lab-callout">
        <div className="t">Como o dual foi construído</div>
        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
          <li>
            Primal <b>{dual.primalSense}</b> → dual <b>{dual.dualSense}</b>; as{' '}
            {dual.vars.length} restrições viram {dual.vars.length} variáveis duais, e as{' '}
            {dual.varNames.length} variáveis viram {dual.varNames.length} restrições duais.
          </li>
          <li>Os RHS do primal (b) viram os custos do dual; os custos (c) viram os RHS do dual.</li>
          <li>O sinal de cada variável dual vem do tipo da restrição que ela espelha (≤, ≥ ou =).</li>
        </ul>
      </div>

      <h3>Dual</h3>
      <Formula lines={formatDual(dual)} />

      <h3>Dualidade forte</h3>
      <div className="summary">
        <span className="badge zval-badge">
          z* primal = {primalRes.objectiveValue ?? statusPT(primalRes.status)}
        </span>
        <span className="badge zval-badge">
          z* dual = {dualRes.objectiveValue ?? statusPT(dualRes.status)}
        </span>
        <span className={`badge ${strongHolds ? 'ok' : 'fail'}`}>
          {strongHolds ? '✓ z* primal = z* dual' : '✗ verificar'}
        </span>
      </div>

      {!bothOptimal && (
        <div className="lab-callout warn">
          <div className="t">Sem ótimo finito nos dois</div>
          <p style={{ margin: 0 }}>
            Primal: <b>{statusPT(primalRes.status)}</b>; dual: <b>{statusPT(dualRes.status)}</b>.
            Pela dualidade: se o primal é ilimitado, o dual é inviável (e vice-versa). A igualdade
            de z só vale quando ambos têm ótimo finito.
          </p>
        </div>
      )}

      {bothOptimal && (
        <>
          <h3>Preços-sombra (variáveis duais)</h3>
          <p className="lead-p" style={{ marginBottom: 8 }}>
            Cada y* mede quanto o ótimo do primal mudaria por unidade a mais no RHS da restrição
            correspondente.
          </p>
          <table className="lab-table">
            <thead>
              <tr>
                <th>Variável dual</th>
                <th>Restrição do primal</th>
                <th>Sinal</th>
                <th>Valor (preço-sombra)</th>
              </tr>
            </thead>
            <tbody>
              {dual.vars.map((v) => (
                <tr key={v.name}>
                  <td>{v.name}</td>
                  <td>restrição {v.fromConstraint + 1}</td>
                  <td>{SIGN_LABEL[v.sign]}</td>
                  <td>
                    <b>{shadow[v.name]}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {cs && <CSSection cs={cs} />}
    </>
  );
}

function CSSection({ cs }: { cs: ComplementarySlackness }) {
  return (
    <>
      <h3>Folgas complementares</h3>
      <div className={`lab-callout ${cs.allSatisfied ? 'ok' : 'danger'}`}>
        <div className="t">
          {cs.allSatisfied ? '✓ Folga complementar confirmada' : '✗ Verificar'}
        </div>
        <p style={{ margin: 0 }}>
          No ótimo, em cada par primal-dual <b>ao menos um lado é zero</b>: ou a restrição está{' '}
          <b>ativa</b> (folga 0), ou seu <b>preço-sombra</b> é 0 — nunca os dois diferentes de
          zero. Por isso todos os produtos abaixo dão <b>0</b>.
        </p>
      </div>

      <table className="lab-table">
        <thead>
          <tr>
            <th>Restrição i</th>
            <th>folga / excesso</th>
            <th>×</th>
            <th>yᵢ</th>
            <th>= produto</th>
          </tr>
        </thead>
        <tbody>
          {cs.constraints.map((c) => (
            <tr key={c.index}>
              <td>restrição {c.index + 1}</td>
              <td>{c.slack}</td>
              <td>×</td>
              <td>{c.dualValue}</td>
              <td>
                <b>{c.product}</b> {c.ok ? '✓' : '✗'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="lab-table">
        <thead>
          <tr>
            <th>Variável xⱼ</th>
            <th>valor</th>
            <th>×</th>
            <th>folga dual (custo reduzido)</th>
            <th>= produto</th>
          </tr>
        </thead>
        <tbody>
          {cs.variables.map((v) => (
            <tr key={v.name}>
              <td>{v.name}</td>
              <td>{v.value}</td>
              <td>×</td>
              <td>{v.dualSlack}</td>
              <td>
                <b>{v.product}</b> {v.ok ? '✓' : '✗'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function statusPT(s: string): string {
  switch (s) {
    case 'optimal':
      return 'ótimo';
    case 'infeasible':
      return 'inviável';
    case 'unbounded':
      return 'ilimitado';
    default:
      return s;
  }
}
