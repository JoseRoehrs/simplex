import type { Constraint, LPModel, Relation, Sense } from './types';

/**
 * Analisa um PPL escrito em texto no formato livro-texto, por exemplo:
 *
 *   max 3x1 + 2x2
 *   s.t.
 *   x1 + x2 <= 4
 *   x1 + 3x2 <= 6
 *   x1, x2 >= 0
 *
 * - A primeira linha com max/min (ou maximizar/minimizar) é o objetivo.
 * - Linhas com <=, >=, = são restrições.
 * - Linhas de não-negatividade (ex.: "x1, x2 >= 0") são ignoradas (assumidas).
 * - Marcadores "s.t." / "sujeito a" / "subject to" são ignorados.
 */
export function parseLP(text: string): LPModel {
  const rawLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

  if (rawLines.length === 0) throw new Error('Entrada vazia.');

  let sense: Sense | null = null;
  let objectiveExpr = '';
  const constraintLines: string[] = [];

  for (const line of rawLines) {
    const lower = line.toLowerCase();
    if (/^(max|maximize|maximizar)\b/.test(lower)) {
      sense = 'max';
      objectiveExpr = line.replace(/^[a-zA-Zçãíé]+/, '').trim();
      continue;
    }
    if (/^(min|minimize|minimizar)\b/.test(lower)) {
      sense = 'min';
      objectiveExpr = line.replace(/^[a-zA-Zçãíé]+/, '').trim();
      continue;
    }
    if (/^(s\.?t\.?|sujeito a|subject to)\b/.test(lower)) {
      // remove o marcador (e separadores residuais como ".", ":"); o que sobrar é restrição
      const rest = line
        .replace(/^(s\.?t\.?|sujeito a|subject to)\b[.:\s]*/i, '')
        .trim();
      if (rest) constraintLines.push(rest);
      continue;
    }
    constraintLines.push(line);
  }

  if (sense === null) {
    throw new Error('Faltou a linha de objetivo (comece com "max" ou "min").');
  }

  // Coleta as variáveis na ordem de primeiro aparecimento.
  const order: string[] = [];
  const seen = (name: string) => {
    if (!order.includes(name)) order.push(name);
  };

  const objTerms = parseTerms(objectiveExpr);
  objTerms.forEach((t) => seen(t.varName));

  const parsedConstraints: { terms: Term[]; relation: Relation; rhs: number }[] = [];
  for (const line of constraintLines) {
    const parsed = parseConstraintLine(line);
    if (parsed === null) continue; // pulado (não-negatividade)
    parsed.terms.forEach((t) => seen(t.varName));
    parsedConstraints.push(parsed);
  }

  if (order.length === 0) {
    throw new Error('Nenhuma variável encontrada no objetivo.');
  }

  const indexOf = new Map(order.map((name, i) => [name, i]));
  // Acumula (+=) para combinar termos semelhantes: "2x1 + 3x1" => 5x1.
  // Atribuir (=) deixaria o último termo vencer e ensinaria o problema errado.
  const objective = new Array<number>(order.length).fill(0);
  objTerms.forEach((t) => (objective[indexOf.get(t.varName)!] += t.coeff));

  const constraints: Constraint[] = parsedConstraints.map((pc) => {
    const coeffs = new Array<number>(order.length).fill(0);
    pc.terms.forEach((t) => (coeffs[indexOf.get(t.varName)!] += t.coeff));
    return { coeffs, relation: pc.relation, rhs: pc.rhs };
  });

  return { sense, objective, constraints, varNames: order };
}

interface Term {
  coeff: number;
  varName: string;
}

/** Extrai termos como 3x1, -x2, +2.5y de uma expressão linear. Ignora constantes. */
function parseTerms(expr: string): Term[] {
  const normalized = expr.replace(/\s+/g, '').replace(/-/g, '+-').replace(/^\+/, '');
  const tokens = normalized.split('+').filter((t) => t.length > 0);
  const terms: Term[] = [];
  for (const tok of tokens) {
    const m = tok.match(/^([+-]?\d*\.?\d*)\*?([a-zA-Z_]\w*)$/);
    if (!m) continue; // constante pura ou token inválido -> ignora
    const rawCoeff = m[1];
    let coeff: number;
    if (rawCoeff === '' || rawCoeff === '+') coeff = 1;
    else if (rawCoeff === '-') coeff = -1;
    else coeff = parseFloat(rawCoeff);
    terms.push({ coeff, varName: m[2] });
  }
  return terms;
}

/** Retorna null se a linha for uma restrição de não-negatividade (a ser ignorada). */
function parseConstraintLine(
  line: string,
): { terms: Term[]; relation: Relation; rhs: number } | null {
  // troca vírgulas por '+' para suportar "x1, x2 >= 0"
  const prepared = line.replace(/,/g, '+');

  let relation: Relation;
  let parts: string[];
  if (prepared.includes('<=')) {
    relation = '<=';
    parts = prepared.split('<=');
  } else if (prepared.includes('>=')) {
    relation = '>=';
    parts = prepared.split('>=');
  } else if (prepared.includes('=')) {
    relation = '=';
    parts = prepared.split('=');
  } else if (prepared.includes('<')) {
    relation = '<=';
    parts = prepared.split('<');
  } else if (prepared.includes('>')) {
    relation = '>=';
    parts = prepared.split('>');
  } else {
    throw new Error(`Restrição sem operador (<=, >=, =): "${line}"`);
  }

  const terms = parseTerms(parts[0]);
  const rhs = parseFloat(parts[1].replace(/\s+/g, ''));
  if (Number.isNaN(rhs)) throw new Error(`Lado direito inválido em: "${line}"`);

  // Ignora não-negatividade: todas as variáveis com coef 1, rhs 0, relação '>='.
  const isNonNeg =
    relation === '>=' && rhs === 0 && terms.length > 0 && terms.every((t) => t.coeff === 1);
  if (isNonNeg) return null;

  return { terms, relation, rhs };
}

/** Serializa um LPModel de volta para texto (útil na UI). */
export function modelToText(model: LPModel): string {
  const names = model.varNames ?? model.objective.map((_, i) => `x${i + 1}`);
  const exprFrom = (coeffs: number[]) => {
    const parts = coeffs
      .map((c, i) => ({ c, name: names[i] }))
      .filter((t) => t.c !== 0)
      .map((t, idx) => {
        const sign = t.c < 0 ? '- ' : idx === 0 ? '' : '+ ';
        const abs = Math.abs(t.c);
        const coeff = abs === 1 ? '' : `${abs}`;
        return `${sign}${coeff}${t.name}`;
      });
    return parts.length ? parts.join(' ') : '0';
  };

  const lines = [`${model.sense} ${exprFrom(model.objective)}`, 's.t.'];
  for (const c of model.constraints) {
    lines.push(`${exprFrom(c.coeffs)} ${c.relation} ${c.rhs}`);
  }
  lines.push(`${names.join(', ')} >= 0`);
  return lines.join('\n');
}
