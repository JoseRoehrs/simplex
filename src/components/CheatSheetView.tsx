/** Colinha de bolso (portada do laboratório estático). */
export function CheatSheetView() {
  return (
    <div className="lab">
      <h2>Colinha de bolso</h2>
      <p className="lead-p">Tudo que você precisa lembrar, em um cartão. Use Ctrl/Cmd + P para imprimir.</p>

      <div className="cheat">
        <div className="cheat-card">
          <h4>
            <span className="nch">1</span> Padronização
          </h4>
          <ul>
            <li>
              <b>b &lt; 0?</b> multiplique por −1 (inverte o sinal).
            </li>
            <li>
              <b>≤ b</b> → <b>+ folga</b> (base ok)
            </li>
            <li>
              <b>≥ b</b> → <b>− excesso + artificial</b>
            </li>
            <li>
              <b>= b</b> → <b>+ artificial</b>
            </li>
          </ul>
        </div>

        <div className="cheat-card">
          <h4>
            <span className="nch">2</span> Quem ENTRA na base
          </h4>
          <ul>
            <li>
              <b>Fase 1</b> (min w): (cⱼ−zⱼ) <b>mais negativo</b>
            </li>
            <li>
              <b>Fase 2 — MAX</b>: (cⱼ−zⱼ) <b>mais positivo</b>
            </li>
            <li>
              <b>Fase 2 — MIN</b>: (cⱼ−zⱼ) <b>mais negativo</b>
            </li>
            <li>Empate? escolha qualquer um (ou regra de Bland).</li>
          </ul>
        </div>

        <div className="cheat-card">
          <h4>
            <span className="nch">3</span> Quem SAI da base
          </h4>
          <ul>
            <li>
              Teste da razão: <b>θ = b ÷ coluna pivô</b>
            </li>
            <li>
              Só onde a coluna é <b>&gt; 0</b>.
            </li>
            <li>
              Sai a do <b>menor θ</b> (≥ 0).
            </li>
            <li>
              Nenhum θ válido → <b>ILIMITADO</b>
            </li>
          </ul>
        </div>

        <div className="cheat-card">
          <h4>
            <span className="nch">4</span> Pivoteamento
          </h4>
          <ul>
            <li>Linha pivô ÷ elemento pivô → vira 1.</li>
            <li>Demais linhas: zere a coluna pivô.</li>
            <li>Troque o rótulo da base na linha que saiu.</li>
          </ul>
        </div>

        <div className="cheat-card">
          <h4>
            <span className="nch">5</span> Critérios de PARADA
          </h4>
          <ul>
            <li>
              <b>Fase 1</b>: todos (cⱼ−zⱼ) ≥ 0. Então olhe <b>w</b>.
            </li>
            <li>
              w = 0 → Fase 2. w &gt; 0 → <b>INVIÁVEL</b>
            </li>
            <li>
              <b>Fase 2 MAX</b>: todos (cⱼ−zⱼ) ≤ 0.
            </li>
            <li>
              <b>Fase 2 MIN</b>: todos (cⱼ−zⱼ) ≥ 0.
            </li>
          </ul>
        </div>

        <div className="cheat-card">
          <h4>
            <span className="nch">6</span> Lendo o resultado
          </h4>
          <ul>
            <li>
              <b>Básica</b> = valor em b. <b>Não-básica</b> = 0.
            </li>
            <li>
              <b>Z*</b> está na linha zⱼ (coluna b).
            </li>
            <li>
              Não-básica com (cⱼ−zⱼ)=0 → <b>ótimos alternativos</b>
            </li>
            <li>Confira substituindo no modelo original.</li>
          </ul>
        </div>
      </div>

      <h3>Fórmulas-chave</h3>
      <div className="lab-formula">
        <div>zⱼ = Σᵢ ( c_B(i) × aᵢⱼ )</div>
        <div>custo reduzido = cⱼ − zⱼ</div>
        <div>θᵢ = bᵢ / aᵢₖ (k = coluna que entra, aᵢₖ &gt; 0) → escolher o mínimo</div>
        <div>Valor objetivo = Σᵢ ( c_B(i) × bᵢ )</div>
      </div>
    </div>
  );
}
