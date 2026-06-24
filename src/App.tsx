import { useState } from 'react';
import { parseLP } from './core/parser';
import type { LPModel, SimplexResult, TableauSnapshot } from './core/types';
import { solveAndValidate, type ValidationReport } from './solvers/validate';
import { TableauView, TableauLegend } from './components/TableauView';
import { FeasibleRegion } from './components/FeasibleRegion';
import { WorkflowView } from './components/WorkflowView';
import { FractionTrainer } from './components/FractionTrainer';
import { VideosView } from './components/VideosView';
import { DocsView } from './components/DocsView';
import { TheoryView } from './components/TheoryView';
import { CheatSheetView } from './components/CheatSheetView';
import { QuizView } from './components/QuizView';
import { DualView } from './components/DualView';
import { PivotQuizView } from './components/PivotQuizView';
import { HomeView } from './components/HomeView';
import { SpecialCasesView } from './components/SpecialCasesView';

type Tab =
  | 'inicio'
  | 'solver'
  | 'workflow'
  | 'fracoes'
  | 'videos'
  | 'docs'
  | 'teoria'
  | 'colinha'
  | 'quiz'
  | 'dual'
  | 'pivo'
  | 'casos';

const EXAMPLES: Record<string, string> = {
  'Fase única (max, <=)': `max 3x1 + 5x2
s.t.
x1 <= 4
2x2 <= 12
3x1 + 2x2 <= 18
x1, x2 >= 0`,
  'Duas fases (min, >=)': `min 2x1 + 3x2
s.t.
x1 + x2 >= 4
2x1 + x2 >= 5
x1, x2 >= 0`,
  'Duas fases (igualdade)': `max 2x1 + x2
s.t.
x1 + x2 = 4
x1 <= 3
x1, x2 >= 0`,
  'Múltiplos ótimos (max)': `max x1 + 2x2
s.t.
x1 + 2x2 <= 8
x1 <= 4
x2 <= 3
x1, x2 >= 0`,
  'Inviável (região vazia)': `max 2x1 + 3x2
s.t.
x1 + 2x2 <= 4
3x1 + 2x2 >= 18
x1, x2 >= 0`,
};

const PHASE_LABEL: Record<1 | 2, string> = { 1: 'Fase 1', 2: 'Fase 2' };

export function App() {
  const [tab, setTab] = useState<Tab>('inicio');
  const [text, setText] = useState(EXAMPLES['Fase única (max, <=)']);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [model, setModel] = useState<LPModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSolve() {
    setError(null);
    setReport(null);
    setModel(null);
    setBusy(true);
    try {
      const parsed = parseLP(text);
      setModel(parsed);
      const r = await solveAndValidate(parsed);
      setReport(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="brand-logo" aria-hidden="true">Σ</span>
        <div>
          <h1>
            Simplex <span className="grad">— Sistema de Aprendizado</span>
          </h1>
          <p className="subtitle">
            Resolva PPLs passo a passo (Simplex e Simplex Duas Fases) com frações
            exatas, e valide o ótimo contra o GLPK.
          </p>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${tab === 'inicio' ? 'tab-on' : ''}`}
          onClick={() => setTab('inicio')}
        >
          Início
        </button>
        <button
          className={`tab ${tab === 'solver' ? 'tab-on' : ''}`}
          onClick={() => setTab('solver')}
        >
          Resolver
        </button>
        <button
          className={`tab ${tab === 'workflow' ? 'tab-on' : ''}`}
          onClick={() => setTab('workflow')}
        >
          Workflow
        </button>
        <button
          className={`tab ${tab === 'fracoes' ? 'tab-on' : ''}`}
          onClick={() => setTab('fracoes')}
        >
          Treino de Frações
        </button>
        <button
          className={`tab ${tab === 'videos' ? 'tab-on' : ''}`}
          onClick={() => setTab('videos')}
        >
          Vídeos
        </button>
        <button
          className={`tab ${tab === 'docs' ? 'tab-on' : ''}`}
          onClick={() => setTab('docs')}
        >
          Docs
        </button>
        <button
          className={`tab ${tab === 'teoria' ? 'tab-on' : ''}`}
          onClick={() => setTab('teoria')}
        >
          Teoria
        </button>
        <button
          className={`tab ${tab === 'colinha' ? 'tab-on' : ''}`}
          onClick={() => setTab('colinha')}
        >
          Colinha
        </button>
        <button
          className={`tab ${tab === 'quiz' ? 'tab-on' : ''}`}
          onClick={() => setTab('quiz')}
        >
          Quiz
        </button>
        <button
          className={`tab ${tab === 'dual' ? 'tab-on' : ''}`}
          onClick={() => setTab('dual')}
        >
          Dualidade
        </button>
        <button
          className={`tab ${tab === 'pivo' ? 'tab-on' : ''}`}
          onClick={() => setTab('pivo')}
        >
          Preveja o Pivô
        </button>
        <button
          className={`tab ${tab === 'casos' ? 'tab-on' : ''}`}
          onClick={() => setTab('casos')}
        >
          Casos Especiais
        </button>
        <a className="tab-link" href="/jogo.html" target="_blank" rel="noopener noreferrer">
          🎮 Jogo
        </a>
      </nav>

      {tab === 'inicio' ? (
        <HomeView onNavigate={(t) => setTab(t as Tab)} />
      ) : tab === 'workflow' ? (
        <WorkflowView />
      ) : tab === 'fracoes' ? (
        <FractionTrainer />
      ) : tab === 'videos' ? (
        <VideosView />
      ) : tab === 'docs' ? (
        <DocsView />
      ) : tab === 'teoria' ? (
        <TheoryView />
      ) : tab === 'colinha' ? (
        <CheatSheetView />
      ) : tab === 'quiz' ? (
        <QuizView />
      ) : tab === 'dual' ? (
        <DualView />
      ) : tab === 'pivo' ? (
        <PivotQuizView />
      ) : tab === 'casos' ? (
        <SpecialCasesView />
      ) : (
        <>
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
          rows={9}
        />
        <button className="solve-btn" onClick={handleSolve} disabled={busy}>
          {busy ? 'Resolvendo…' : 'Resolver passo a passo'}
        </button>
        {error && <p className="error">⚠ {error}</p>}
      </section>

      {report && <ResultView report={report} model={model} />}
        </>
      )}
    </div>
  );
}

function ResultView({ report, model }: { report: ValidationReport; model: LPModel | null }) {
  const { engine, reference, secondary, agrees, detail } = report;
  return (
    <section className="result">
      <div className="summary">
        <span className={`badge method`}>
          Método: {engine.method === 'two-phase' ? 'Duas Fases' : 'Simplex'}
        </span>
        <span className={`badge status-${engine.status}`}>Status: {statusPT(engine.status)}</span>
        <span className={`badge ${agrees ? 'ok' : 'fail'}`}>
          {agrees ? '✓ Validado pelo GLPK' : '✗ Divergência'}
        </span>
      </div>

      {engine.status === 'optimal' && (
        <div className="optimum">
          <strong>Solução ótima:</strong>{' '}
          {Object.entries(engine.solution).map(([k, v]) => (
            <span key={k} className="var">
              {k} = {v}
            </span>
          ))}
          <span className="zval">z = {engine.objectiveValue}</span>
        </div>
      )}

      <p className="validation-detail">{detail}</p>
      <details className="solvers">
        <summary>Comparação com solvers de referência</summary>
        <ul>
          <li>
            <b>Motor (passo a passo):</b> {statusPT(engine.status)}
            {engine.objectiveValue !== null && ` — z = ${engine.objectiveValue}`}
          </li>
          <li>
            <b>{reference.solver}:</b> {statusPT(reference.status)}
            {reference.objective !== null && ` — z = ${reference.objective}`}
          </li>
          <li>
            <b>{secondary.solver}:</b> {statusPT(secondary.status)}
            {secondary.objective !== null && ` — z = ${secondary.objective}`}
          </li>
        </ul>
      </details>

      {engine.messages.length > 0 && (
        <ul className="messages">
          {engine.messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}

      {model && (
        <FeasibleRegion model={model} steps={engine.steps} status={engine.status} />
      )}

      <Steps engine={engine} />
    </section>
  );
}

function Steps({ engine }: { engine: SimplexResult }) {
  return (
    <div className="steps">
      <h2>Iterações ({engine.steps.length})</h2>
      {engine.steps[0] && <TableauLegend tableau={engine.steps[0].tableau} />}
      {engine.steps.map((step) => (
        <div key={step.iteration} className="step-card">
          <div className="step-head">
            <span className={`phase-tag phase-${step.phase}`}>{PHASE_LABEL[step.phase]}</span>
            <span className="iter">Iteração {step.iteration}</span>
            {step.enteringVar && (
              <span className="pivot-info">
                entra <b>{step.enteringVar}</b>
                {step.leavingVar && (
                  <>
                    {' '}
                    · sai <b>{step.leavingVar}</b>
                  </>
                )}
              </span>
            )}
            <span
              className="point-chip"
              title="Posição geométrica deste quadro: valor atual das variáveis de decisão. Cada quadro é um ponto/vértice — compare com o gráfico acima."
            >
              ponto {vertexLabel(step.tableau)}
            </span>
          </div>
          <TableauView step={step} />
        </div>
      ))}
    </div>
  );
}

/** Lê do quadro o ponto geométrico atual: o valor de cada variável de DECISÃO
 *  (se é básica, o seu RHS; senão 0). Só apresentação — não recalcula matemática,
 *  apenas lê o que `solve()` já registrou no snapshot. Ex.: "(x1, x2) = (0, 6)". */
function vertexLabel(tableau: TableauSnapshot): string {
  const { columns, kinds, basis, rhs } = tableau;
  const decisions = columns.filter((_, j) => kinds[j] === 'decision');
  const valueOf = (name: string) => {
    const row = basis.indexOf(name);
    return row === -1 ? '0' : rhs[row];
  };
  return `(${decisions.join(', ')}) = (${decisions.map(valueOf).join(', ')})`;
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
