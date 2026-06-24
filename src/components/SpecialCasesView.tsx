import { useState } from 'react';
import { parseLP } from '../core/parser';
import { analyzeSpecialCases, type SpecialCasesReport } from '../core/specialCases';

const EXAMPLES: Record<string, string> = {
  'Degeneração + empate': `max x1 + x2
s.t.
x1 <= 3
x2 <= 3
x1 + x2 <= 3
x1, x2 >= 0`,
  'Múltiplos ótimos': `max x1 + 2x2
s.t.
x1 + 2x2 <= 8
x1 <= 4
x2 <= 3
x1, x2 >= 0`,
  'Caso normal (único)': `max 3x1 + 5x2
s.t.
x1 <= 4
2x2 <= 12
3x1 + 2x2 <= 18
x1, x2 >= 0`,
};

function statusPT(s: string): string {
  return s === 'optimal' ? 'ótimo' : s === 'infeasible' ? 'inviável' : s === 'unbounded' ? 'ilimitado' : s;
}

export function SpecialCasesView() {
  const [text, setText] = useState(EXAMPLES['Degeneração + empate']);
  const [report, setReport] = useState<SpecialCasesReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  function analyze() {
    setError(null);
    setReport(null);
    try {
      setReport(analyzeSpecialCases(parseLP(text)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="lab">
      <p className="lead-p">
        Nem todo PPL se resolve "no caminho feliz". Esta aba inspeciona a resolução real e
        sinaliza três <b>casos especiais</b>: <b>empate no teste da razão</b>,{' '}
        <b>degeneração</b> (variável básica em zero) e <b>ótimos alternativos</b> (mais de uma
        solução ótima). Entender quando eles aparecem é parte de dominar o método.
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
        <button className="solve-btn" onClick={analyze}>
          Analisar casos especiais
        </button>
        {error && <p className="error">⚠ {error}</p>}
      </section>

      {report && <Report report={report} />}
    </div>
  );
}

function Report({ report }: { report: SpecialCasesReport }) {
  const { status, ratioTies, degeneracies, alternativeOptima, anyFound } = report;

  if (status !== 'optimal') {
    return (
      <div className="lab-callout warn">
        <div className="t">Sem ótimo finito</div>
        <p style={{ margin: 0 }}>
          O problema é <b>{statusPT(status)}</b>. Os casos especiais analisados aqui (empate,
          degeneração, ótimos alternativos) só fazem sentido quando há um ótimo finito.
        </p>
      </div>
    );
  }

  if (!anyFound) {
    return (
      <div className="lab-callout ok">
        <div className="t">✓ Nenhum caso especial</div>
        <p style={{ margin: 0 }}>
          Solução <b>única</b> e <b>não-degenerada</b>, sem empates no teste da razão. É o
          "caminho feliz": cada iteração teve uma escolha de pivô bem definida e o ótimo é o
          único vértice que maximiza o objetivo.
        </p>
      </div>
    );
  }

  return (
    <>
      <h3>Casos especiais encontrados</h3>
      <div className="summary">
        <span className={`badge ${ratioTies.length ? 'fail' : 'ok'}`}>
          Empate na razão: {ratioTies.length || 'não'}
        </span>
        <span className={`badge ${degeneracies.length ? 'fail' : 'ok'}`}>
          Degeneração: {degeneracies.length ? 'sim' : 'não'}
        </span>
        <span className={`badge ${alternativeOptima.present ? 'fail' : 'ok'}`}>
          Ótimos alternativos: {alternativeOptima.present ? 'sim' : 'não'}
        </span>
      </div>

      {ratioTies.length > 0 && (
        <>
          <div className="lab-callout warn">
            <div className="t">Empate no teste da razão</div>
            <p style={{ margin: 0 }}>
              Duas (ou mais) linhas atingiram a <b>mesma razão mínima</b> θ. O critério não
              decide sozinho quem sai — é preciso desempatar (aqui, regra de Bland). Empates
              assim costumam levar a um vértice <b>degenerado</b> na próxima iteração.
            </p>
          </div>
          <table className="lab-table">
            <thead>
              <tr>
                <th>Iteração</th>
                <th>Entra</th>
                <th>θ mínimo</th>
                <th>Linhas empatadas</th>
              </tr>
            </thead>
            <tbody>
              {ratioTies.map((t, k) => (
                <tr key={k}>
                  <td>
                    Fase {t.phase} · it. {t.iteration}
                  </td>
                  <td>{t.entering}</td>
                  <td>{t.theta}</td>
                  <td>{t.tiedBasics.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {degeneracies.length > 0 && (
        <>
          <div className="lab-callout warn">
            <div className="t">Degeneração</div>
            <p style={{ margin: 0 }}>
              Uma variável <b>básica</b> vale <b>0</b>: o vértice é "superdeterminado" (mais
              restrições ativas que o necessário). Pode causar iterações que não melhoram o
              objetivo (pivôs degenerados) e, em casos patológicos, ciclagem.
            </p>
          </div>
          <table className="lab-table">
            <thead>
              <tr>
                <th>Iteração</th>
                <th>Variáveis básicas em zero</th>
              </tr>
            </thead>
            <tbody>
              {degeneracies.map((d, k) => (
                <tr key={k}>
                  <td>
                    Fase {d.phase} · it. {d.iteration}
                  </td>
                  <td>{d.zeroBasics.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {alternativeOptima.present && (
        <div className="lab-callout ok">
          <div className="t">Ótimos alternativos</div>
          <p style={{ margin: 0 }}>
            No quadro ótimo, {alternativeOptima.vars.length === 1 ? 'a variável' : 'as variáveis'}{' '}
            <b>{alternativeOptima.vars.join(', ')}</b>{' '}
            {alternativeOptima.vars.length === 1 ? 'tem' : 'têm'} custo reduzido <b>0</b> sem
            estar na base: {alternativeOptima.vars.length === 1 ? 'ela poderia' : 'elas poderiam'}{' '}
            entrar <b>sem mudar o valor de z</b>. Existe, portanto, <b>mais de uma solução
            ótima</b> — todo um segmento de pontos com o mesmo z*.
          </p>
        </div>
      )}
    </>
  );
}
