import { useEffect, useMemo, useRef, useState } from 'react';
import type { LPModel } from '../core/types';
import { PROBLEMS, WEEKS, problemsOfWeek, type Week } from '../core/problems';
import {
  CANVAS_H,
  CANVAS_W,
  FLOW_EDGES,
  FLOW_NODES,
  NODE_H,
  NODE_W,
  sub,
  traceProblem,
  type FlowNode,
  type FlowTrace,
} from '../core/flowTrace';

const STATUS_LABEL: Record<string, string> = {
  optimal: 'Ótimo',
  infeasible: 'Inviável',
  unbounded: 'Ilimitado',
};

export function WorkflowView() {
  const [week, setWeek] = useState<Week>(7);
  const weekProblems = problemsOfWeek(week);
  const [problemId, setProblemId] = useState<string>(weekProblems[0]?.id ?? '');
  const [trace, setTrace] = useState<FlowTrace | null>(null);

  const problem = useMemo(
    () => PROBLEMS.find((p) => p.id === problemId) ?? null,
    [problemId],
  );

  function selectWeek(w: Week) {
    setWeek(w);
    const first = problemsOfWeek(w)[0];
    setProblemId(first ? first.id : '');
    setTrace(null);
  }

  function selectProblem(id: string) {
    setProblemId(id);
    setTrace(null);
  }

  function resolver() {
    if (problem) setTrace(traceProblem(problem.model));
  }

  return (
    <div className="workflow">
      <p className="wf-intro">
        Cada <b>caso</b> da Programação Linear é uma <b>ramificação</b> da árvore de
        decisão do <b>Simplex Duas Fases</b>. Escolha um problema do curso e veja o
        caminho que ele percorre acender, nó a nó.
      </p>

      <div className="wf-picker">
        <div className="wf-weeks">
          <span className="wf-label">Semana:</span>
          {WEEKS.map((w) => (
            <button
              key={w}
              className={`chip ${w === week ? 'chip-on' : ''}`}
              onClick={() => selectWeek(w)}
            >
              {w}
            </button>
          ))}
        </div>
        <div className="wf-problems">
          <span className="wf-label">Problema:</span>
          {weekProblems.map((p) => (
            <button
              key={p.id}
              className={`chip ${p.id === problemId ? 'chip-on' : ''}`}
              onClick={() => selectProblem(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {problem && (
        <div className="wf-problem-card">
          <Formula model={problem.model} />
          <p className="wf-note">{problem.note}</p>
          <button className="solve-btn" onClick={resolver}>
            {trace ? 'Resolver de novo' : 'Resolver pelo workflow'}
          </button>
        </div>
      )}

      {trace && <ResultStrip trace={trace} />}

      <Canvas trace={trace} />
    </div>
  );
}

function Formula({ model }: { model: LPModel }) {
  const names =
    model.varNames ?? model.objective.map((_, i) => `x${i + 1}`);
  const term = (coef: number, j: number, first: boolean) => {
    const sign = coef < 0 ? ' − ' : first ? '' : ' + ';
    const val = Math.abs(coef);
    const num = val === 1 ? '' : String(val);
    return `${sign}${num}${sub(names[j])}`;
  };
  const obj = model.objective.map((c, j) => term(c, j, j === 0)).join('');
  const relSym = (r: string) => (r === '<=' ? '≤' : r === '>=' ? '≥' : '=');

  return (
    <div className="wf-formula">
      <div className="ln">
        <span className="op">{model.sense === 'max' ? 'Max' : 'Min'}</span> Z ={obj}
      </div>
      {model.constraints.map((c, i) => (
        <div className="ln" key={i}>
          <span className="lead">{i === 0 ? 's.a.' : ''}</span>
          {c.coeffs.map((a, j) => term(a, j, j === 0)).join('')}{' '}
          <span className="op">{relSym(c.relation)}</span> {c.rhs}
        </div>
      ))}
      <div className="ln">
        <span className="lead" />
        {names.map((n) => sub(n)).join(', ')} <span className="op">≥</span> 0
      </div>
    </div>
  );
}

function ResultStrip({ trace }: { trace: FlowTrace }) {
  const { result, status } = trace;
  return (
    <div className="wf-result">
      <span className={`badge status-${status}`}>{STATUS_LABEL[status] ?? status}</span>
      <span className="badge method">
        {result.method === 'two-phase' ? 'Duas Fases' : 'Fase única'}
      </span>
      {result.objectiveValue !== null && (
        <span className="badge zval-badge">z* = {result.objectiveValue}</span>
      )}
      {Object.entries(result.solution).map(([k, v]) => (
        <span key={k} className="badge var-badge">
          {sub(k)} = {v}
        </span>
      ))}
    </div>
  );
}

function Canvas({ trace }: { trace: FlowTrace | null }) {
  const [zoom, setZoom] = useState(0.7);
  const [fullscreen, setFullscreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);

  function onDown(e: React.MouseEvent) {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
    el.classList.add('grabbing');
  }
  function onMove(e: React.MouseEvent) {
    const el = scrollRef.current;
    if (!el || !drag.current) return;
    el.scrollLeft = drag.current.sl - (e.clientX - drag.current.x);
    el.scrollTop = drag.current.st - (e.clientY - drag.current.y);
  }
  function onUp() {
    drag.current = null;
    scrollRef.current?.classList.remove('grabbing');
  }

  const byId = useMemo(() => {
    const m: Record<string, FlowNode> = {};
    for (const n of FLOW_NODES) m[n.id] = n;
    return m;
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  // Ao resolver, traz o CAMINHO ACESO para o centro da viewport — antes ele podia
  // acender fora da área visível do canvas pannável e o aluno não percebia. Só rola
  // quando chega um trace novo (não a cada zoom). Lê posições de FLOW_NODES (estáticas).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !trace) return;
    const active = FLOW_NODES.filter((n) => trace.activeNodes.has(n.id));
    if (!active.length) return;
    const cx = (Math.min(...active.map((n) => n.x)) + Math.max(...active.map((n) => n.x + NODE_W))) / 2;
    const cy = (Math.min(...active.map((n) => n.y)) + Math.max(...active.map((n) => n.y + NODE_H))) / 2;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({
      left: Math.max(0, cx * zoom - el.clientWidth / 2),
      top: Math.max(0, cy * zoom - el.clientHeight / 2),
      behavior: reduce ? 'auto' : 'smooth',
    });
    // Intencional: depende só de `trace` (rola ao resolver, não ao mudar o zoom).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace]);

  return (
    <div className={`wf-canvas-wrap${fullscreen ? ' fullscreen' : ''}`}>
      <div className="wf-zoom">
        <button className="chip" onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))}>
          −
        </button>
        <span className="wf-zoom-val">{Math.round(zoom * 100)}%</span>
        <button className="chip" onClick={() => setZoom((z) => Math.min(1.3, +(z + 0.1).toFixed(2)))}>
          +
        </button>
        <button
          className="chip wf-fullscreen-btn"
          onClick={() => setFullscreen((f) => !f)}
          title={fullscreen ? 'Sair da tela cheia (Esc)' : 'Tela cheia'}
        >
          {fullscreen ? '✕ Fechar' : '⛶ Tela cheia'}
        </button>
        <span className="wf-hint">arraste para mover</span>
      </div>

      <div
        className="wf-canvas"
        ref={scrollRef}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
      >
        <div className="wf-sizer" style={{ width: CANVAS_W * zoom, height: CANVAS_H * zoom }}>
          <div
            className="wf-world"
            style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${zoom})` }}
          >
            <svg className="wf-edges" width={CANVAS_W} height={CANVAS_H}>
              <defs>
                <marker
                  id="wf-arrow"
                  markerWidth="9"
                  markerHeight="9"
                  refX="7"
                  refY="4.5"
                  orient="auto"
                >
                  <path d="M0,0 L9,4.5 L0,9 Z" className="wf-arrowhead" />
                </marker>
                <marker
                  id="wf-arrow-on"
                  markerWidth="9"
                  markerHeight="9"
                  refX="7"
                  refY="4.5"
                  orient="auto"
                >
                  <path d="M0,0 L9,4.5 L0,9 Z" className="wf-arrowhead-on" />
                </marker>
              </defs>
              {FLOW_EDGES.map((e) => {
                const a = byId[e.from];
                const b = byId[e.to];
                const fx = a.x + NODE_W;
                const fy = a.y + NODE_H / 2;
                const tx = b.x;
                const ty = b.y + NODE_H / 2;
                const dx = Math.max(50, (tx - fx) * 0.5);
                const d = `M ${fx} ${fy} C ${fx + dx} ${fy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
                const on = trace?.activeEdges.has(e.id) ?? false;
                const dim = trace && !on;
                const cls = on ? 'wf-edge on' : dim ? 'wf-edge dim' : 'wf-edge';
                const mx = (fx + tx) / 2;
                const my = (fy + ty) / 2;
                return (
                  <g key={e.id}>
                    <path
                      d={d}
                      className={cls}
                      markerEnd={on ? 'url(#wf-arrow-on)' : 'url(#wf-arrow)'}
                    />
                    {e.label && (
                      <foreignObject x={mx - 70} y={my - 14} width="140" height="28">
                        <div className={`wf-edge-label ${on ? 'on' : ''}`}>{e.label}</div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}
            </svg>

            {FLOW_NODES.map((n) => {
              const on = trace ? trace.activeNodes.has(n.id) : true;
              const dim = trace ? !on : false;
              const note = trace?.annotations[n.id];
              return (
                <div
                  key={n.id}
                  className={`wf-node kind-${n.kind} ${on ? 'on' : ''} ${dim ? 'dim' : ''}`}
                  style={{ left: n.x, top: n.y, width: NODE_W, minHeight: NODE_H }}
                >
                  <div className="wf-node-head">
                    <span className="wf-node-icon">{n.icon}</span>
                    <span className="wf-node-title">{n.title}</span>
                  </div>
                  <p className="wf-node-body">{n.body}</p>
                  {trace && note && <div className="wf-node-anno">{note}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
