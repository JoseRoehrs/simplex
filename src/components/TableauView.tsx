import type { PivotStep, TableauSnapshot, VarKind } from '../core/types';
import { F, fracToString, isNeg, isPos, type Frac } from '../core/frac';

/** Converte a string de fração do quadro ("4/3", "-2", "0") em Frac exato. */
function toFrac(s: string): Frac {
  const i = s.indexOf('/');
  if (i === -1) return F(Number(s));
  return F(Number(s.slice(0, i))).div(F(Number(s.slice(i + 1))));
}

/** Glossário de cada tipo de coluna: letra genérica, descrição curta (legenda)
 *  e dica (tooltip do cabeçalho). Reutiliza o `kind` que o motor já classifica. */
const KIND_INFO: Record<VarKind, { sym: string; label: string; tip: string }> = {
  decision: {
    sym: 'x',
    label: 'decisão — o que você quer descobrir',
    tip: 'variável de decisão (a incógnita do problema)',
  },
  slack: {
    sym: 's',
    label: 'folga — transforma “≤” em “=” (o que sobra do recurso)',
    tip: 'folga: transforma uma restrição “≤” em igualdade',
  },
  surplus: {
    sym: 'e',
    label: 'excesso — transforma “≥” em “=” (o quanto passou do mínimo)',
    tip: 'excesso: transforma uma restrição “≥” em igualdade',
  },
  artificial: {
    sym: 'a',
    label: 'artificial — só inicia a Fase 1; deve sair da base (ideal = 0)',
    tip: 'artificial: só ajuda a começar a Fase 1; deve sair da base',
  },
};

const KIND_ORDER: VarKind[] = ['decision', 'slack', 'surplus', 'artificial'];

/** "Como ler o quadro": legenda dos símbolos que APARECEM neste problema,
 *  mais o significado da coluna b e da linha de custos reduzidos. Renderize
 *  uma vez (não por iteração) — App passa o primeiro quadro. */
export function TableauLegend({ tableau }: { tableau: TableauSnapshot }) {
  const present = KIND_ORDER.filter((k) => tableau.kinds.includes(k));
  return (
    <div className="tableau-legend">
      <span className="tl-title">Como ler o quadro</span>
      {present.map((k) => (
        <span key={k} className="tl-item">
          <code className={`tl-sym kind-${k}`}>{KIND_INFO[k].sym}</code>
          {KIND_INFO[k].label}
        </span>
      ))}
      <span className="tl-item">
        <code className="tl-sym">b</code> lado direito — valor atual de cada básica e do
        objetivo
      </span>
      <span className="tl-item">
        <code className="tl-sym tl-z">
          z<sub>j</sub>−c<sub>j</sub>
        </code>{' '}
        custo reduzido — se &lt; 0, trazer a variável melhora; entra a{' '}
        <b className="tl-enter">mais negativa</b> (regra de Dantzig, destacada no quadro).
        Todos ≥ 0 ⇒ <b>ótimo</b>.
      </span>
    </div>
  );
}

/** Renderiza um quadro (tableau) do Simplex, destacando a linha/coluna do pivô
 *  e, durante um pivô, a coluna do TESTE DA RAZÃO (θ = b ÷ coluna que entra). */
export function TableauView({ step }: { step: PivotStep }) {
  const { tableau, pivotRow, pivotCol, enteringVar, leavingVar } = step;
  const { columns, kinds, rows, rhs, basis, objectiveRow, objectiveValue } = tableau;

  // Pivô de Dantzig "de verdade": a coluna entra porque seu custo reduzido é < 0.
  // Os passos que só RETIRAM uma artificial usam quadro de custo zero (rc todos = 0),
  // então NÃO são escolhas de Dantzig — não devem mostrar "↑ entra" nem o teste da razão.
  const enteringRC = pivotCol !== null ? toFrac(objectiveRow[pivotCol]) : null;
  const isDantzig = enteringRC !== null && isNeg(enteringRC);

  // Teste da razão só se aplica a um pivô de Dantzig (a variável que entra cresce).
  const showRatio = isDantzig;
  const ratios: (Frac | null)[] = showRatio
    ? rows.map((row, i) => {
        const a = toFrac(row[pivotCol!]);
        // Apenas coeficientes POSITIVOS participam (senão a variável cresceria sem limite).
        return isPos(a) ? toFrac(rhs[i]).div(a) : null;
      })
    : [];
  let minIdx = -1;
  ratios.forEach((r, i) => {
    if (r === null) return;
    if (minIdx === -1 || r.compare(ratios[minIdx]!) < 0) minIdx = i;
  });

  // História do pivô em linguagem simples — o "porquê" de quem entra/sai. Reusa os
  // valores que o motor já produziu (custo reduzido e θ); não recalcula matemática.
  let story;
  if (isDantzig && minIdx !== -1) {
    story = (
      <p className="pivot-why">
        💡 <b>Por quê:</b> entre todas, <b>{enteringVar}</b> tem o custo reduzido mais
        negativo (<b>{objectiveRow[pivotCol!]}</b>) — é a que mais aproxima do ótimo agora
        (regra de Dantzig), então <b>entra</b>. Pelo teste da razão, {enteringVar} pode
        crescer até <b>θ = {fracToString(ratios[minIdx]!)}</b>; nesse ponto{' '}
        <b>{leavingVar}</b> chega a zero e <b>sai</b> da base.
      </p>
    );
  } else if (isDantzig) {
    story = (
      <p className="pivot-why">
        💡 <b>Por quê:</b> <b>{enteringVar}</b> melhoraria o objetivo (custo reduzido{' '}
        {objectiveRow[pivotCol!]}), mas nenhuma linha limita seu crescimento (nenhum
        coeficiente positivo no teste da razão) → problema <b>ilimitado</b>.
      </p>
    );
  } else if (pivotCol !== null) {
    story = (
      <p className="pivot-why">
        💡 <b>Por quê:</b> a artificial <b>{leavingVar}</b> ficou na base em nível zero;{' '}
        <b>{enteringVar}</b> entra no lugar dela (tem coeficiente ≠ 0 nessa linha) só para
        retirá-la, <b>sem alterar o objetivo</b> (os custos reduzidos já são 0 aqui).
      </p>
    );
  } else {
    // pivotCol === null → passo de PARADA: fim de fase ou ótimo. Damos o mesmo
    // "Por quê" amigável dos outros passos (antes caía num texto técnico cru).
    if (step.phase === 1) {
      // No ótimo da Fase 1, objectiveValue = −(soma das artificiais) = −W.
      const factivel = objectiveValue === '0';
      story = factivel ? (
        <p className="pivot-why">
          💡 <b>Por quê:</b> a Fase 1 zerou todas as variáveis artificiais (soma = 0):
          achamos um <b>ponto factível</b> para partir. Daqui roda a <b>Fase 2</b>,
          otimizando o objetivo verdadeiro.
        </p>
      ) : (
        <p className="pivot-why">
          💡 <b>Por quê:</b> a Fase 1 parou mas <b>não conseguiu zerar</b> as artificiais
          (a soma ainda é &gt; 0). Como não dá para satisfazer todas as restrições ao mesmo
          tempo, <b>não existe ponto factível</b>: o problema é <b>INVIÁVEL</b>.
        </p>
      );
    } else {
      story = (
        <p className="pivot-why">
          💡 <b>Por quê:</b> nenhum custo reduzido é negativo, então <b>nenhuma variável
          melhora o objetivo</b>. Chegamos ao <b>ótimo</b> — o canto da região factível
          onde o Simplex para.
        </p>
      );
    }
  }

  return (
    <>
    <table className="tableau">
      {showRatio && (
        <caption className="tableau-cap">
          θ = b ÷ coluna <b>{enteringVar}</b> · a <b>menor razão</b> ≥ 0 (destacada)
          indica a variável que <b>sai</b> da base. Linhas com coeficiente ≤ 0 não
          entram no teste (—).
        </caption>
      )}
      <thead>
        <tr>
          <th className="corner">base</th>
          {columns.map((name, j) => (
            <th
              key={name}
              className={j === pivotCol ? 'pivot-col' : ''}
              title={`${name} — ${KIND_INFO[kinds[j]].tip}`}
            >
              {name}
            </th>
          ))}
          <th className="rhs-col" title="lado direito (RHS): valor das variáveis básicas e do objetivo">
            b
          </th>
          {showRatio && (
            <th className="ratio-col" title="Teste da razão mínima">
              θ = b ÷ {enteringVar}
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={i === pivotRow ? 'pivot-row' : ''}>
            <th className="basis-cell">{basis[i]}</th>
            {row.map((val, j) => {
              const isPivot = i === pivotRow && j === pivotCol;
              return (
                <td
                  key={j}
                  className={`${j === pivotCol ? 'pivot-col' : ''} ${isPivot ? 'pivot-cell' : ''}`}
                >
                  {val}
                </td>
              );
            })}
            <td className="rhs-col">{rhs[i]}</td>
            {showRatio && (
              <td
                className={`ratio-col ${ratios[i] === null ? 'ratio-skip' : ''} ${
                  i === minIdx ? 'ratio-min' : ''
                }`}
              >
                {ratios[i] === null ? '—' : fracToString(ratios[i]!)}
              </td>
            )}
          </tr>
        ))}
        <tr className="obj-row">
          <th
            className="basis-cell"
            title="custo reduzido (zⱼ−cⱼ): se < 0, a variável ainda vale a pena; entra a mais negativa (Dantzig). Todos ≥ 0 ⇒ ótimo."
          >
            z<sub>j</sub>−c<sub>j</sub>
          </th>
          {objectiveRow.map((val, j) => {
            const isEntering = j === pivotCol && isDantzig;
            return (
              <td
                key={j}
                className={`${j === pivotCol ? 'pivot-col' : ''} ${isEntering ? 'entering-rc' : ''}`}
                title={
                  isEntering
                    ? `Custo reduzido mais negativo (${val}) → ${enteringVar} entra na base. Regra de Dantzig: escolhe-se o mais negativo.`
                    : undefined
                }
              >
                {val}
                {isEntering && (
                  <span className="rc-flag">
                    <span aria-hidden="true">↑</span> entra
                  </span>
                )}
              </td>
            );
          })}
          <td className="rhs-col">{objectiveValue}</td>
          {showRatio && <td className="ratio-col" />}
        </tr>
      </tbody>
    </table>
    {story}
    </>
  );
}
