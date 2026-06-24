/** Teoria do método Simplex de Duas Fases (portada do laboratório estático). */
export function TheoryView() {
  return (
    <div className="lab">
      <h2>Teoria — do zero ao método das duas fases</h2>
      <p className="lead-p">
        Programação Linear explicada de forma intuitiva: forma padrão, variáveis auxiliares e o
        porquê das duas fases.
      </p>

      <h3>1. O que é Programação Linear?</h3>
      <p>
        A <b>Programação Linear (PL)</b> busca o <b>melhor valor</b> (máximo ou mínimo) de uma função
        linear — a <b>função objetivo Z</b> — respeitando restrições lineares e a{' '}
        <b>não-negatividade</b> das variáveis.
      </p>
      <div className="lab-callout">
        <div className="t">🎯 Ideia central</div>
        As restrições formam uma região (um poliedro). O ótimo, quando existe, está sempre em um{' '}
        <b>vértice</b> dessa região. O <b>Simplex</b> caminha de vértice em vértice, sempre melhorando
        Z, até não dar mais.
      </div>

      <h3>2. Forma padrão</h3>
      <p>
        O Simplex trabalha com <b>igualdades</b> e <b>variáveis ≥ 0</b>. O primeiro passo é reescrever
        todas as desigualdades como igualdades, adicionando variáveis auxiliares.
      </p>
      <div className="lab-formula">
        <div>Original: a₁x₁ + a₂x₂ + … ≤ / ≥ / = b (com b ≥ 0)</div>
        <div>Padrão: a₁x₁ + a₂x₂ + … ± auxiliares = b</div>
      </div>
      <div className="lab-callout warn">
        <div className="t">⚠ Regra do b ≥ 0</div>
        Se algum lado direito <b>b</b> for negativo, multiplique a restrição inteira por <b>−1</b>{' '}
        (isso inverte o sinal da desigualdade) antes de padronizar.
      </div>

      <h3>3. Folga, excesso e artificiais</h3>
      <table className="lab-table">
        <thead>
          <tr>
            <th>Tipo de restrição</th>
            <th>O que adicionar</th>
            <th>Serve de base?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <b>≤</b> b
            </td>
            <td>+ variável de <b>folga</b> (f)</td>
            <td>Sim — já é uma base viável</td>
          </tr>
          <tr>
            <td>
              <b>≥</b> b
            </td>
            <td>− <b>excesso</b> (e) e + <b>artificial</b> (a)</td>
            <td>O excesso entra com −1, então precisa da artificial</td>
          </tr>
          <tr>
            <td>
              <b>=</b> b
            </td>
            <td>+ variável <b>artificial</b> (a)</td>
            <td>Só a artificial serve de base</td>
          </tr>
        </tbody>
      </table>
      <div className="lab-callout danger">
        <div className="t">Artificial (a)</div>
        Um "andaime" fictício. <b>Tem que valer 0</b> no final — é isso que a Fase 1 garante.
      </div>

      <h3>4. Por que precisamos de duas fases?</h3>
      <p>
        Para começar o Simplex precisamos de uma <b>base inicial viável</b>. Com "≤" isso é fácil (as
        folgas já formam a base). Mas com "≥" ou "=", as artificiais entram na base com valor diferente
        de zero — e elas não fazem parte do problema real!
      </p>
      <ol className="lab-steps">
        <li>
          <h4>Fase 1 — Achar um ponto de partida legítimo</h4>
          <p>
            Esquecemos o Z original e minimizamos <b>w = soma das artificiais</b>. Se conseguirmos{' '}
            <b>w = 0</b>, expulsamos as artificiais e temos uma solução básica viável de verdade.
          </p>
        </li>
        <li>
          <h4>Fase 2 — Otimizar o objetivo verdadeiro</h4>
          <p>Com um ponto viável em mãos, recolocamos o Z original e aplicamos o Simplex normal até o ótimo.</p>
        </li>
      </ol>

      <h3>5. Anatomia do quadro (tableau)</h3>
      <table className="lab-table">
        <tbody>
          <tr>
            <td>
              <b>c_B</b>
            </td>
            <td>Custo (coeficiente no objetivo) das variáveis que estão na base.</td>
          </tr>
          <tr>
            <td>
              <b>Base / b</b>
            </td>
            <td>As variáveis básicas atuais e seus valores (coluna b).</td>
          </tr>
          <tr>
            <td>
              <b>zⱼ</b>
            </td>
            <td>zⱼ = Σ (c_B × coluna j). Quanto "vale" cada coluna pela base atual.</td>
          </tr>
          <tr>
            <td>
              <b>cⱼ − zⱼ</b>
            </td>
            <td>O custo reduzido: o ganho líquido em Z ao trazer a variável j para a base.</td>
          </tr>
          <tr>
            <td>
              <b>θ (teta)</b>
            </td>
            <td>Teste da razão = b ÷ coluna pivô, só onde a coluna é positiva. O menor θ decide quem sai.</td>
          </tr>
        </tbody>
      </table>

      <h3>6. FASE 1 — passo a passo</h3>
      <ol className="lab-steps">
        <li>
          <h4>Montar o quadro com objetivo w</h4>
          <p>Custo +1 para cada artificial, 0 para as demais. Base inicial = folgas e artificiais.</p>
        </li>
        <li>
          <h4>Calcular (cⱼ − zⱼ)</h4>
          <p>Como minimizamos w, procuramos valores negativos.</p>
        </li>
        <li>
          <h4>Variável que ENTRA / SAI</h4>
          <p>Entra a de (cⱼ − zⱼ) mais negativo; sai a do menor teste da razão (b ÷ coluna pivô &gt; 0).</p>
        </li>
        <li>
          <h4>Pivotear</h4>
          <p>Gauss–Jordan: zere o resto da coluna pivô e repita até w = 0.</p>
        </li>
      </ol>
      <div className="lab-callout ok">
        <div className="t">✓ Fim da Fase 1</div>
        Se <b>w = 0</b> → temos base viável, vamos à Fase 2. Se <b>w &gt; 0</b> → o problema é{' '}
        <b>inviável</b> (pare por aqui).
      </div>

      <h3>7. FASE 2 — passo a passo</h3>
      <ol className="lab-steps">
        <li>
          <h4>Limpar o quadro</h4>
          <p>Descarte as colunas das artificiais e troque o objetivo de w para o Z original.</p>
        </li>
        <li>
          <h4>Recalcular (cⱼ − zⱼ) e escolher quem entra</h4>
          <p>
            <b>MAX</b>: o (cⱼ − zⱼ) mais positivo. <b>MIN</b>: o mais negativo.
          </p>
        </li>
        <li>
          <h4>Parar no ótimo</h4>
          <p>
            <b>MAX</b>: todos (cⱼ − zⱼ) ≤ 0. <b>MIN</b>: todos ≥ 0.
          </p>
        </li>
      </ol>

      <h3>8. Como ler o resultado</h3>
      <div className="lab-callout ok">
        <div className="t">Solução ótima</div>
        As variáveis básicas valem o seu b; as não-básicas valem 0. Z* está no canto da linha zⱼ.
      </div>
      <div className="lab-callout warn">
        <div className="t">Solução ilimitada</div>
        A coluna da variável que entraria não tem nenhum coeficiente positivo → Z cresce sem limite.
      </div>
      <div className="lab-callout danger">
        <div className="t">Solução inviável</div>
        A Fase 1 termina com w &gt; 0: é impossível zerar as artificiais.
      </div>
      <div className="lab-callout">
        <div className="t">Soluções ótimas alternativas</div>
        No quadro ótimo, uma variável não-básica tem (cⱼ − zⱼ) = 0: existe outro vértice com o mesmo Z*.
      </div>
    </div>
  );
}
