type Section = { id: string; label: string };

const SECTIONS: Section[] = [
  { id: 'doc-ppl', label: 'O que é Programação Linear' },
  { id: 'doc-padrao', label: 'Forma padrão' },
  { id: 'doc-simplex', label: 'Método Simplex (passo a passo)' },
  { id: 'doc-duas-fases', label: 'Simplex Duas Fases' },
  { id: 'doc-bigm', label: 'Método do M-grande' },
  { id: 'doc-quadro', label: 'Como ler o quadro' },
  { id: 'doc-glossario', label: 'Glossário' },
];

export function DocsView() {
  return (
    <div className="docs">
      <p className="docs-intro">
        Material de apoio, em <b>português</b>, para entender a teoria por trás do que o app faz.
        Leia aqui, assista às aulas na aba <b>Vídeos</b> e pratique resolvendo os seus problemas na
        aba <b>Resolver</b>.
      </p>

      <nav className="docs-toc" aria-label="Índice">
        {SECTIONS.map((s) => (
          <a key={s.id} className="chip" href={`#${s.id}`}>
            {s.label}
          </a>
        ))}
      </nav>

      <section id="doc-ppl" className="docs-section">
        <h2>O que é Programação Linear (PPL)</h2>
        <p>
          Um <b>Problema de Programação Linear (PPL)</b> busca o melhor valor (máximo ou mínimo) de
          uma <b>função objetivo linear</b> sujeita a um conjunto de <b>restrições lineares</b>.
          "Linear" significa que todas as variáveis aparecem elevadas à potência 1, sem produtos
          entre elas — só somas de termos do tipo <i>coeficiente × variável</i>.
        </p>
        <p>Um PPL tem três ingredientes:</p>
        <ul>
          <li>
            <b>Variáveis de decisão</b> (x₁, x₂, …): o que você controla — quanto produzir, comprar,
            transportar etc.
          </li>
          <li>
            <b>Função objetivo</b> (Z): a quantidade que você quer <i>maximizar</i> (lucro) ou{' '}
            <i>minimizar</i> (custo).
          </li>
          <li>
            <b>Restrições</b>: limites de recursos, demandas mínimas, balanços — expressos como
            desigualdades (≤, ≥) ou igualdades (=).
          </li>
        </ul>
        <p>
          Geometricamente, as restrições delimitam uma <b>região factível</b> (um polígono/poliedro).
          O ótimo, quando existe, está sempre em um <b>vértice</b> dessa região — e é exatamente entre
          vértices que o Simplex caminha. Veja isso na prática na aba <b>Resolver</b>, na "visão
          geométrica".
        </p>
      </section>

      <section id="doc-padrao" className="docs-section">
        <h2>Forma padrão</h2>
        <p>
          Antes de aplicar o Simplex, o problema é colocado na <b>forma padrão</b>: maximização, com
          todas as restrições viradas em <b>igualdades</b> e todas as variáveis ≥ 0. As conversões
          mais comuns:
        </p>
        <ul>
          <li>
            <b>Minimizar Z</b> ⇒ maximizar <code>−Z</code> (resolve-se o equivalente e troca-se o
            sinal no fim).
          </li>
          <li>
            Restrição <b>≤</b>: soma-se uma <b>variável de folga</b> (slack) ≥ 0.
            <br />
            <code>2x₁ + x₂ ≤ 8 ⟶ 2x₁ + x₂ + f₁ = 8</code>
          </li>
          <li>
            Restrição <b>≥</b>: subtrai-se uma <b>variável de excesso</b> (surplus) ≥ 0.
            <br />
            <code>x₁ + x₂ ≥ 4 ⟶ x₁ + x₂ − e₁ = 4</code>
          </li>
          <li>
            Restrições <b>≥</b> e <b>=</b> ainda precisam de uma <b>variável artificial</b> para ter
            uma base inicial válida — é aí que entram as <b>Duas Fases</b> ou o <b>M-grande</b>.
          </li>
        </ul>
      </section>

      <section id="doc-simplex" className="docs-section">
        <h2>Método Simplex — passo a passo</h2>
        <p>
          Usado quando todas as restrições são <b>≤</b> com lado direito ≥ 0: as próprias folgas já
          formam uma base inicial factível (começa na origem). O algoritmo então "anda" de vértice em
          vértice, sempre melhorando Z, até não haver mais ganho.
        </p>
        <ol className="docs-steps">
          <li>
            <b>Padronizar.</b> Some as folgas e monte o <b>quadro</b> (tableau) com os coeficientes
            das restrições e da linha-objetivo (Z).
          </li>
          <li>
            <b>Teste de otimalidade.</b> Numa maximização, se nenhum coeficiente da linha Z indica
            melhora possível, o quadro atual já é ótimo — pare.
          </li>
          <li>
            <b>Variável que entra</b> (coluna pivô). Escolha a variável não-básica com o coeficiente
            mais "vantajoso" na linha Z (a que mais aumenta Z).
          </li>
          <li>
            <b>Variável que sai</b> (linha pivô) — <b>teste da razão mínima</b>. Divida cada lado
            direito pelo coeficiente positivo correspondente na coluna pivô; a <b>menor razão não
            negativa</b> indica a linha que sai. Isso garante que nenhuma variável fique negativa.
          </li>
          <li>
            <b>Pivoteamento.</b> Faça o elemento pivô virar 1 e zere o resto da coluna pivô
            (eliminação de Gauss). A variável que entra assume a base no lugar da que saiu.
          </li>
          <li>
            <b>Repita</b> a partir do passo 2 até o teste de otimalidade ser satisfeito.
          </li>
        </ol>
        <p className="docs-callout">
          💡 Trabalhando com <b>frações exatas</b> (como o app faz) você evita erros de arredondamento
          que costumam atrapalhar o pivoteamento à mão. Treine isso na aba <b>Treino de Frações</b>.
        </p>
      </section>

      <section id="doc-duas-fases" className="docs-section">
        <h2>Simplex Duas Fases</h2>
        <p>
          Quando há restrições <b>≥</b> ou <b>=</b>, a origem não é factível e não existe uma base
          inicial óbvia. Adicionamos <b>variáveis artificiais</b> (a₁, a₂, …) para ter um ponto de
          partida — mas elas não pertencem ao problema real e precisam ser <b>eliminadas</b>. Daí as
          duas fases:
        </p>
        <div className="docs-phase">
          <h3>
            <span className="phase-pill phase-1-pill">Fase 1</span> Achar uma solução factível
          </h3>
          <p>
            Troca-se temporariamente o objetivo por <b>minimizar a soma das variáveis artificiais</b>{' '}
            (W = a₁ + a₂ + …). Roda-se o Simplex normalmente.
          </p>
          <ul>
            <li>
              Se o mínimo der <b>W = 0</b>, todas as artificiais saíram da base: encontramos um vértice
              factível do problema original. Segue para a Fase 2.
            </li>
            <li>
              Se o mínimo der <b>W &gt; 0</b>, é impossível zerar as artificiais ⇒ o problema é{' '}
              <b>inviável</b> (não há solução).
            </li>
          </ul>
        </div>
        <div className="docs-phase">
          <h3>
            <span className="phase-pill phase-2-pill">Fase 2</span> Otimizar o objetivo real
          </h3>
          <p>
            Descartam-se as colunas artificiais e <b>restaura-se a função objetivo original</b>.
            Partindo do vértice factível achado na Fase 1, roda-se o Simplex de novo até a
            otimalidade. O resultado é a solução ótima do problema.
          </p>
        </div>
        <p className="docs-callout">
          👀 Veja as duas fases acontecerem, iteração por iteração, na aba <b>Resolver</b> — cada passo
          é marcado como <i>Fase 1</i> ou <i>Fase 2</i>. A aba <b>Workflow</b> mostra qual caminho da
          árvore de decisão cada problema percorre.
        </p>
      </section>

      <section id="doc-bigm" className="docs-section">
        <h2>Método do M-grande (Big-M)</h2>
        <p>
          É uma <b>alternativa às duas fases</b> que resolve tudo numa passada só. Em vez de duas
          etapas, mantém-se o objetivo original mas <b>penaliza-se</b> cada variável artificial com um
          custo enorme <code>M</code> (um número "infinitamente grande"):
        </p>
        <ul>
          <li>
            Maximização: subtrai-se <code>M·aᵢ</code> do objetivo.
          </li>
          <li>
            Minimização: soma-se <code>M·aᵢ</code> ao objetivo.
          </li>
        </ul>
        <p>
          Como manter uma artificial na base custa caríssimo, o Simplex naturalmente as expulsa. Se ao
          final alguma artificial permanecer com valor positivo, o problema é <b>inviável</b> — mesma
          conclusão das duas fases, só que por outro caminho.
        </p>
      </section>

      <section id="doc-quadro" className="docs-section">
        <h2>Como ler o quadro (tableau)</h2>
        <p>O quadro do Simplex organiza o sistema de equações a cada iteração:</p>
        <ul>
          <li>
            <b>Linhas das restrições:</b> uma por restrição. A coluna da esquerda mostra qual variável
            está <b>na base</b> (vale o lado direito); as demais valem 0.
          </li>
          <li>
            <b>Coluna do lado direito (b):</b> o valor atual de cada variável básica — e, na linha Z, o
            valor atual de Z.
          </li>
          <li>
            <b>Linha-objetivo (Z):</b> indica se ainda dá para melhorar e qual variável compensa fazer
            entrar.
          </li>
          <li>
            <b>Coluna pivô / linha pivô:</b> destacadas no app — a coluna da variável que entra e a
            linha da que sai. O cruzamento é o <b>elemento pivô</b>.
          </li>
          <li>
            <b>Coluna de razões:</b> o teste da razão mínima; a menor razão (marcada) define a linha
            que sai.
          </li>
        </ul>
      </section>

      <section id="doc-glossario" className="docs-section">
        <h2>Glossário</h2>
        <dl className="docs-gloss">
          <dt>Variável de decisão</dt>
          <dd>Incógnita que você controla (x₁, x₂, …). É a resposta que se procura.</dd>

          <dt>Função objetivo (Z)</dt>
          <dd>Expressão linear que se quer maximizar ou minimizar.</dd>

          <dt>Região factível</dt>
          <dd>Conjunto de todos os pontos que satisfazem todas as restrições ao mesmo tempo.</dd>

          <dt>Vértice / solução básica</dt>
          <dd>"Canto" da região factível. O ótimo de um PPL, se existir, está sempre em um vértice.</dd>

          <dt>Variável de folga (slack)</dt>
          <dd>Adicionada a uma restrição ≤ para transformá-la em igualdade. Mede a sobra do recurso.</dd>

          <dt>Variável de excesso (surplus)</dt>
          <dd>Subtraída de uma restrição ≥ para virar igualdade. Mede o quanto se passou do mínimo.</dd>

          <dt>Variável artificial</dt>
          <dd>
            Variável auxiliar para criar uma base inicial em restrições ≥ e =. Precisa sair da solução
            (Duas Fases ou M-grande).
          </dd>

          <dt>Base / variável básica</dt>
          <dd>Conjunto de variáveis que definem o vértice atual; as não-básicas valem 0.</dd>

          <dt>Pivoteamento</dt>
          <dd>Operação de troca de base que move o Simplex de um vértice para o vizinho.</dd>

          <dt>Status: ótimo / inviável / ilimitado</dt>
          <dd>
            <b>Ótimo</b>: achou a melhor solução. <b>Inviável</b>: nenhuma solução satisfaz as
            restrições. <b>Ilimitado</b>: Z pode crescer/decrescer sem limite.
          </dd>
        </dl>
      </section>

      <p className="docs-foot">
        Pronto para praticar? Vá para a aba <b>Resolver</b> e acompanhe cada iteração passo a passo.
      </p>
    </div>
  );
}
