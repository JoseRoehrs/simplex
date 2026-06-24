/**
 * Aba "Início" — landing/hero do app React, com o visual do laboratório legado
 * (grafite + neon, hero com cartão flutuante e cards "como funciona").
 * Os botões navegam para as outras abas via onNavigate.
 */
export function HomeView({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">Σ Pesquisa Operacional · passo a passo</span>
            <h1>
              Domine o Método Simplex <span className="grad">de Duas Fases</span>
            </h1>
            <p>
              Aprenda Programação Linear de verdade: teoria intuitiva, fluxograma, colinha e um{' '}
              <b>resolvedor que mostra cada quadro</b> da Fase 1 e da Fase 2 — com frações exatas
              e o ótimo validado contra o GLPK.
            </p>

            <div className="hero-cta">
              <button className="btn btn-primary" onClick={() => onNavigate('solver')}>
                Resolver os problemas →
              </button>
              <button className="btn btn-ghost" onClick={() => onNavigate('teoria')}>
                Começar pela teoria
              </button>
            </div>

            <div className="hero-chips">
              <button className="hc" onClick={() => onNavigate('docs')}>
                📘 Material de ensino
              </button>
              <button className="hc" onClick={() => onNavigate('colinha')}>
                🧾 Colinha imprimível
              </button>
              <button className="hc" onClick={() => onNavigate('quiz')}>
                🎯 Quizzes &amp; jogo
              </button>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="preview-card">
              <div className="pc-top">
                <span className="pc-dot" />
                <span className="pc-dot" />
                <span className="pc-dot" />
                <span className="pc-title">Quadro · Fase 2</span>
              </div>
              <table className="pc-tbl">
                <thead>
                  <tr>
                    <th>Base</th>
                    <th>x₁</th>
                    <th>x₂</th>
                    <th>x₃</th>
                    <th>b</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>f₁</td>
                    <td>1</td>
                    <td className="hl-cell">0</td>
                    <td>2</td>
                    <td>40</td>
                  </tr>
                  <tr>
                    <td>x₂</td>
                    <td>½</td>
                    <td className="hl-cell">1</td>
                    <td>3</td>
                    <td>6</td>
                  </tr>
                  <tr className="zr">
                    <td>Z</td>
                    <td>−2</td>
                    <td>0</td>
                    <td>−4</td>
                    <td>60</td>
                  </tr>
                </tbody>
              </table>
              <div className="pc-foot">
                <span>Z* = 60</span>
                <span className="pc-chip">✓ solução ótima</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sec-head">
        <span className="eyebrow">Tudo em um só lugar</span>
        <h2>Como este laboratório funciona</h2>
      </div>

      <div className="features">
        <article className="feature">
          <div className="ic">🧮</div>
          <h3>Resolvedor passo a passo</h3>
          <p>
            Monte o PPL e veja cada pivô da Fase 1 e da Fase 2, com frações exatas. O ótimo é
            conferido em tempo real contra o GLPK e um segundo solver.
          </p>
          <button className="btn btn-soft" style={{ marginTop: 14 }} onClick={() => onNavigate('solver')}>
            Abrir o Resolver →
          </button>
        </article>

        <article className="feature">
          <div className="ic">🗺️</div>
          <h3>Geometria & workflow</h3>
          <p>
            Veja a região factível e o caminho do Simplex de vértice em vértice, e percorra a
            árvore de decisão das duas fases acendendo nó a nó.
          </p>
          <button className="btn btn-soft" style={{ marginTop: 14 }} onClick={() => onNavigate('workflow')}>
            Ver o Workflow →
          </button>
        </article>

        <article className="feature">
          <div className="ic">🎓</div>
          <h3>Teoria, colinha & treino</h3>
          <p>
            Do zero ao método: teoria intuitiva, colinha de bolso para imprimir, quiz com
            feedback e treino de frações para afiar o teste da razão.
          </p>
          <button className="btn btn-soft" style={{ marginTop: 14 }} onClick={() => onNavigate('teoria')}>
            Estudar a Teoria →
          </button>
        </article>
      </div>
    </div>
  );
}
