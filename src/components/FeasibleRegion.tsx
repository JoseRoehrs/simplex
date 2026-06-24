import type { LPModel, PivotStep, SolveStatus } from '../core/types';

/**
 * Visualização GEOMÉTRICA do PPL (apenas 2 variáveis de decisão).
 *
 * A grande intuição do Simplex: cada quadro (tableau) algébrico corresponde a um
 * VÉRTICE da região factível, e o algoritmo "anda" de canto em canto do polígono
 * até o ótimo. Aqui desenhamos:
 *   - cada restrição como uma reta (com rótulo),
 *   - a região factível sombreada,
 *   - a direção de melhora do objetivo (gradiente),
 *   - o CAMINHO percorrido pelo Simplex: os vértices visitados em cada iteração.
 */
export function FeasibleRegion({
  model,
  steps,
  status,
}: {
  model: LPModel;
  steps: PivotStep[];
  status: SolveStatus;
}) {
  if (model.objective.length !== 2) {
    return (
      <p className="geo-hint">
        🗺️ A visualização geométrica fica disponível para problemas com{' '}
        <b>2 variáveis de decisão</b> (este tem {model.objective.length}). Os
        quadros acima continuam mostrando cada iteração.
      </p>
    );
  }

  const names = model.varNames ?? ['x1', 'x2'];

  // --- Pontos visitados pelo Simplex, rotulados pela ITERAÇÃO -------------------
  // Cada passo vira um ponto; pontos consecutivos iguais (ex.: troca de fase ou
  // passo degenerado) são fundidos num só vértice guardando o intervalo de
  // iterações — assim o número no gráfico casa com o "Iteração N" de cada quadro.
  const nodes: { pt: Pt; iters: number[] }[] = [];
  for (const s of steps) {
    const pt = decisionPoint(s, names);
    const last = nodes[nodes.length - 1];
    if (last && near(last.pt, pt)) last.iters.push(s.iteration);
    else nodes.push({ pt, iters: [s.iteration] });
  }
  const pathPts = nodes.map((n) => n.pt);

  // --- Escala / viewport -------------------------------------------------------
  const xs: number[] = [0];
  const ys: number[] = [0];
  for (const c of model.constraints) {
    const [a, b] = c.coeffs;
    if (Math.abs(a) > 1e-12) xs.push(c.rhs / a);
    if (Math.abs(b) > 1e-12) ys.push(c.rhs / b);
  }
  for (const p of pathPts) {
    xs.push(p.x);
    ys.push(p.y);
  }
  const xMax = niceMax(Math.max(...xs.filter((v) => v >= 0), 1));
  const yMax = niceMax(Math.max(...ys.filter((v) => v >= 0), 1));

  // --- Geometria da região factível -------------------------------------------
  const boxLines: Line[] = [
    { a: 1, b: 0, c: 0 }, // x1 = 0  (eixo)
    { a: 0, b: 1, c: 0 }, // x2 = 0  (eixo)
    { a: 1, b: 0, c: xMax }, // borda direita do viewport
    { a: 0, b: 1, c: yMax }, // borda superior do viewport
  ];
  const consLines: Line[] = model.constraints.map((c) => ({
    a: c.coeffs[0],
    b: c.coeffs[1],
    c: c.rhs,
  }));
  const allLines = [...consLines, ...boxLines];

  const verts: Pt[] = [];
  for (let i = 0; i < allLines.length; i++) {
    for (let j = i + 1; j < allLines.length; j++) {
      const p = intersect(allLines[i], allLines[j]);
      if (!p) continue;
      if (p.x < -EPS || p.y < -EPS || p.x > xMax + EPS || p.y > yMax + EPS) continue;
      if (!feasible(p, model.constraints)) continue;
      if (!verts.some((q) => near(q, p))) verts.push(p);
    }
  }
  const polygon = sortByAngle(verts);

  // --- Transform para coordenadas de tela --------------------------------------
  const W = 460;
  const H = 380;
  const M = { left: 42, right: 18, top: 18, bottom: 34 };
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const sx = (x: number) => M.left + (x / xMax) * plotW;
  const sy = (y: number) => M.top + plotH - (y / yMax) * plotH;

  const xticks = ticks(xMax);
  const yticks = ticks(yMax);

  // Direção de melhora do objetivo (gradiente; min ⇒ sentido oposto).
  const gx = model.sense === 'max' ? model.objective[0] : -model.objective[0];
  const gy = model.sense === 'max' ? model.objective[1] : -model.objective[1];
  const gNorm = Math.hypot(gx, gy) || 1;
  const arrowLen = Math.min(plotW, plotH) * 0.18;
  const ax0 = M.left + plotW * 0.12;
  const ay0 = M.top + plotH * 0.88;
  const ax1 = ax0 + (gx / gNorm) * arrowLen;
  const ay1 = ay0 - (gy / gNorm) * arrowLen;

  return (
    <div className="geo">
      <h3 className="geo-title">Visão geométrica — andando pelos vértices</h3>
      <svg className="geo-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Região factível e caminho do Simplex">
        {/* grade */}
        {xticks.map((t) => (
          <line key={`gx${t}`} x1={sx(t)} y1={M.top} x2={sx(t)} y2={M.top + plotH} className="geo-grid" />
        ))}
        {yticks.map((t) => (
          <line key={`gy${t}`} x1={M.left} y1={sy(t)} x2={M.left + plotW} y2={sy(t)} className="geo-grid" />
        ))}

        {/* região factível */}
        {polygon.length >= 3 && (
          <polygon className="geo-region" points={polygon.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')} />
        )}

        {/* retas das restrições */}
        {consLines.map((ln, i) => {
          const seg = clipToBox(ln, xMax, yMax);
          if (!seg) return null;
          const mid = midOnBox(ln, xMax, yMax);
          return (
            <g key={`c${i}`}>
              <line x1={sx(seg[0].x)} y1={sy(seg[0].y)} x2={sx(seg[1].x)} y2={sy(seg[1].y)} className="geo-cons" />
              {mid && (
                <text x={sx(mid.x)} y={sy(mid.y)} className="geo-cons-label" dy={-4}>
                  R{i + 1}
                </text>
              )}
            </g>
          );
        })}

        {/* eixos */}
        <line x1={M.left} y1={M.top} x2={M.left} y2={M.top + plotH} className="geo-axis" />
        <line x1={M.left} y1={M.top + plotH} x2={M.left + plotW} y2={M.top + plotH} className="geo-axis" />
        {xticks.map((t) => (
          <text key={`xt${t}`} x={sx(t)} y={M.top + plotH + 14} className="geo-tick">
            {fmt(t)}
          </text>
        ))}
        {yticks.map((t) => (
          <text key={`yt${t}`} x={M.left - 6} y={sy(t) + 3} className="geo-tick geo-tick-y">
            {fmt(t)}
          </text>
        ))}
        <text x={M.left + plotW} y={M.top + plotH + 28} className="geo-axis-label" textAnchor="end">
          {names[0]}
        </text>
        <text x={M.left - 30} y={M.top + 4} className="geo-axis-label">
          {names[1]}
        </text>

        {/* direção de melhora do objetivo */}
        <defs>
          <marker id="geo-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" className="geo-arrow-head" />
          </marker>
        </defs>
        <line x1={ax0} y1={ay0} x2={ax1} y2={ay1} className="geo-grad" markerEnd="url(#geo-arrow)" />
        <text x={ax1 + 4} y={ay1} className="geo-grad-label">∇z</text>

        {/* caminho do Simplex */}
        {pathPts.length >= 2 && (
          <polyline
            className="geo-path"
            points={pathPts.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')}
          />
        )}
        {nodes.map((n, i) => {
          const p = n.pt;
          const last = i === nodes.length - 1;
          const optimum = last && status === 'optimal';
          const label = iterLabel(n.iters);
          return (
            <g key={`v${i}`}>
              <title>{`Iteração ${label}: (${names[0]}, ${names[1]}) = (${fmt(p.x)}, ${fmt(p.y)})${
                optimum ? ' — ótimo' : ''
              }`}</title>
              {optimum ? (
                <Star cx={sx(p.x)} cy={sy(p.y)} />
              ) : (
                <circle cx={sx(p.x)} cy={sy(p.y)} r={6} className={last ? 'geo-node geo-node-last' : 'geo-node'} />
              )}
              <text x={sx(p.x)} y={sy(p.y) - 10} className="geo-node-label">
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="geo-legend">
        <span><i className="sw sw-region" /> região factível</span>
        <span><i className="sw sw-cons" /> restrições (R1, R2…)</span>
        <span><i className="sw sw-path" /> caminho do Simplex (nº = iteração)</span>
        <span><i className="sw sw-opt" /> vértice ótimo</span>
        <span><i className="sw sw-grad" /> ∇z = direção que melhora o objetivo</span>
      </div>
      <p className="geo-caption">
        Cada número é o da <b>iteração</b> correspondente — o mesmo <b>ponto</b> mostrado no
        quadro daquela iteração abaixo (passe o mouse num vértice para ver as coordenadas; um
        rótulo como <i>1–2</i> significa que o ponto não mudou entre essas iterações). O Simplex
        parte de um canto e caminha pelas arestas, sempre na direção que melhora <i>z</i>,
        até não haver vizinho melhor: esse é o ótimo.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers geométricos
// ---------------------------------------------------------------------------

interface Pt {
  x: number;
  y: number;
}
interface Line {
  a: number;
  b: number;
  c: number;
} // a*x + b*y = c

const EPS = 1e-7;

function parseFrac(s: string): number {
  const [n, d] = s.split('/');
  return d === undefined ? Number(n) : Number(n) / Number(d);
}

/** Valor das 2 variáveis de decisão no quadro deste passo (vértice corrente). */
function decisionPoint(step: PivotStep, names: string[]): Pt {
  const { basis, rhs } = step.tableau;
  const valueOf = (name: string) => {
    const row = basis.indexOf(name);
    return row === -1 ? 0 : parseFrac(rhs[row]);
  };
  return { x: valueOf(names[0]), y: valueOf(names[1]) };
}

function near(a: Pt, b: Pt): boolean {
  return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;
}

/** Rótulo do vértice: o nº da iteração, ou um intervalo "a–b" quando o ponto
 *  permaneceu o mesmo por iterações consecutivas (troca de fase, degeneração). */
function iterLabel(iters: number[]): string {
  return iters.length === 1
    ? String(iters[0])
    : `${iters[0]}–${iters[iters.length - 1]}`;
}

function intersect(l1: Line, l2: Line): Pt | null {
  const det = l1.a * l2.b - l2.a * l1.b;
  if (Math.abs(det) < 1e-12) return null;
  return {
    x: (l1.c * l2.b - l2.c * l1.b) / det,
    y: (l1.a * l2.c - l2.a * l1.c) / det,
  };
}

function feasible(p: Pt, constraints: LPModel['constraints']): boolean {
  for (const c of constraints) {
    const lhs = c.coeffs[0] * p.x + c.coeffs[1] * p.y;
    const tol = EPS * (Math.abs(c.rhs) + 1);
    if (c.relation === '<=' && lhs > c.rhs + tol) return false;
    if (c.relation === '>=' && lhs < c.rhs - tol) return false;
    if (c.relation === '=' && Math.abs(lhs - c.rhs) > tol) return false;
  }
  return true;
}

function sortByAngle(pts: Pt[]): Pt[] {
  if (pts.length < 3) return pts;
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return [...pts].sort((p, q) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(q.y - cy, q.x - cx));
}

/** Os dois pontos onde a reta cruza a moldura [0,xMax] × [0,yMax]. */
function clipToBox(ln: Line, xMax: number, yMax: number): [Pt, Pt] | null {
  const cand: Pt[] = [];
  const edges: Line[] = [
    { a: 1, b: 0, c: 0 },
    { a: 1, b: 0, c: xMax },
    { a: 0, b: 1, c: 0 },
    { a: 0, b: 1, c: yMax },
  ];
  for (const e of edges) {
    const p = intersect(ln, e);
    if (!p) continue;
    if (p.x >= -EPS && p.x <= xMax + EPS && p.y >= -EPS && p.y <= yMax + EPS) {
      if (!cand.some((q) => near(q, p))) cand.push(p);
    }
  }
  return cand.length >= 2 ? [cand[0], cand[1]] : null;
}

function midOnBox(ln: Line, xMax: number, yMax: number): Pt | null {
  const seg = clipToBox(ln, xMax, yMax);
  if (!seg) return null;
  return { x: (seg[0].x + seg[1].x) / 2, y: (seg[0].y + seg[1].y) / 2 };
}

function niceMax(v: number): number {
  const padded = v * 1.18;
  const mag = Math.pow(10, Math.floor(Math.log10(padded)));
  return Math.ceil(padded / mag) * mag;
}

function ticks(max: number): number[] {
  const out: number[] = [];
  const step = max / 5;
  for (let i = 1; i <= 5; i++) out.push(round(step * i));
  return out;
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : String(round(v));
}

function Star({ cx, cy }: { cx: number; cy: number }) {
  const r = 9;
  const ri = r * 0.42;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : ri;
    pts.push(`${cx + rad * Math.cos(ang)},${cy + rad * Math.sin(ang)}`);
  }
  return <polygon className="geo-star" points={pts.join(' ')} />;
}
