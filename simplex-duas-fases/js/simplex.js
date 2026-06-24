/* =====================================================================
   MÉTODO SIMPLEX DE DUAS FASES — Motor de cálculo (engine)
   ---------------------------------------------------------------------
   Implementação didática que grava CADA quadro (tableau) das duas fases,
   com destaque de coluna/linha pivô, teste da razão e linha (c_j - z_j).

   Convenção usada (a mesma de muitos livros, inclusive SILVA):
     - Mostramos a linha   z_j   e a linha   (c_j - z_j).
     - MAXIMIZAR: entra a variável com (c_j - z_j) MAIS POSITIVO;
                  ótimo quando todos (c_j - z_j) <= 0.
     - MINIMIZAR: entra a variável com (c_j - z_j) MAIS NEGATIVO;
                  ótimo quando todos (c_j - z_j) >= 0.
     - Fase 1: MINIMIZA  w = soma das variáveis artificiais.
   ===================================================================== */
(function (global) {
  "use strict";
  var EPS = 1e-9;

  function clone2D(M) { return M.map(function (r) { return r.slice(); }); }
  function round(v, d) { var p = Math.pow(10, d == null ? 6 : d); return Math.round(v * p) / p; }

  /* ---- 1) Converter problema para a forma padrão -------------------- */
  // problem = { sense:'max'|'min', c:[...], constraints:[{a:[...], op:'<='|'>='|'=', b:Number}] }
  function toStandard(problem) {
    var n = problem.c.length;

    // garantir b >= 0 (multiplica restrição por -1 e inverte o operador se preciso)
    var cons = problem.constraints.map(function (con) {
      var a = con.a.slice(), op = con.op, b = con.b;
      if (b < -EPS) {
        a = a.map(function (v) { return -v; });
        b = -b;
        op = op === '<=' ? '>=' : (op === '>=' ? '<=' : '=');
      }
      return { a: a, op: op, b: b };
    });
    var m = cons.length;

    // colunas de decisão
    var cols = [];
    for (var j = 0; j < n; j++) cols.push({ name: 'x' + (j + 1), label: 'x', sub: (j + 1), type: 'decision' });

    // extras: folga (<=), excesso (>=) + artificial (>=, =)
    var extras = [];
    cons.forEach(function (con, i) {
      if (con.op === '<=') extras.push({ type: 'slack', con: i });
      else if (con.op === '>=') { extras.push({ type: 'surplus', con: i }); extras.push({ type: 'artificial', con: i }); }
      else extras.push({ type: 'artificial', con: i });
    });
    var sC = 0, eC = 0, aC = 0;
    extras.forEach(function (e) {
      if (e.type === 'slack') { sC++; e.name = 'f' + sC; e.label = 'f'; e.sub = sC; }
      else if (e.type === 'surplus') { eC++; e.name = 'e' + eC; e.label = 'e'; e.sub = eC; }
      else { aC++; e.name = 'a' + aC; e.label = 'a'; e.sub = aC; }
    });

    var allCols = cols.concat(extras);
    var ncols = allCols.length;

    // matriz A e vetor b
    var A = [], b = [];
    cons.forEach(function (con, i) {
      var row = new Array(ncols).fill(0);
      for (var j = 0; j < n; j++) row[j] = con.a[j];
      A.push(row); b.push(con.b);
    });
    extras.forEach(function (e, idx) {
      var col = n + idx;
      if (e.type === 'slack') A[e.con][col] = 1;
      else if (e.type === 'surplus') A[e.con][col] = -1;
      else A[e.con][col] = 1;
    });

    // base inicial: folga (<=) ou artificial (>=, =)
    var basis = [];
    cons.forEach(function (con, i) {
      var bidx = -1;
      extras.forEach(function (e, idx) {
        if (e.con === i && (e.type === 'slack' || e.type === 'artificial')) bidx = n + idx;
      });
      basis.push(bidx);
    });

    var artificialCols = [];
    allCols.forEach(function (c, idx) { if (c.type === 'artificial') artificialCols.push(idx); });

    return {
      A: A, b: b, basis: basis, vars: allCols, ncols: ncols, m: m,
      decisionCount: n, artificialCols: artificialCols, cons: cons
    };
  }

  /* ---- 2) Custos reduzidos (z_j e c_j - z_j) ------------------------ */
  function reduced(A, b, basis, cost) {
    var m = A.length, ncols = A[0].length;
    var z = new Array(ncols).fill(0), d = new Array(ncols);
    for (var j = 0; j < ncols; j++) {
      var s = 0;
      for (var i = 0; i < m; i++) s += cost[basis[i]] * A[i][j];
      z[j] = s; d[j] = cost[j] - s;
    }
    var obj = 0;
    for (var i2 = 0; i2 < m; i2++) obj += cost[basis[i2]] * b[i2];
    return { z: z, d: d, obj: obj };
  }

  /* ---- 3) Rodar uma fase (grava todos os quadros) ------------------- */
  function solvePhase(state, cost, sense, opts) {
    opts = opts || {};
    var A = clone2D(state.A), b = state.b.slice(), basis = state.basis.slice();
    var m = A.length, ncols = A[0].length;
    var forbidden = opts.forbidden || new Set();
    var steps = [], status = 'optimal', iter = 0;

    while (true) {
      var rc = reduced(A, b, basis, cost);
      // escolher variável que ENTRA
      var entering = -1, best = 0;
      for (var j = 0; j < ncols; j++) {
        if (forbidden.has(j)) continue;
        if (sense === 'max') { if (rc.d[j] > best + EPS) { best = rc.d[j]; entering = j; } }
        else { if (rc.d[j] < best - EPS) { best = rc.d[j]; entering = j; } }
      }

      var snap = {
        iter: iter, A: clone2D(A), b: b.slice(), basis: basis.slice(),
        z: rc.z.slice(), d: rc.d.slice(), obj: rc.obj, cost: cost.slice(),
        entering: -1, leaving: -1, ratios: null, optimal: false, unbounded: false
      };

      if (entering === -1) { snap.optimal = true; steps.push(snap); status = 'optimal'; break; }

      // teste da razão (mínima razão positiva)
      var leaving = -1, bestR = Infinity, ratios = [];
      for (var i = 0; i < m; i++) {
        if (A[i][entering] > EPS) {
          var r = b[i] / A[i][entering];
          ratios.push(r);
          if (r < bestR - EPS) { bestR = r; leaving = i; }
        } else ratios.push(null);
      }
      snap.entering = entering; snap.ratios = ratios;

      if (leaving === -1) { snap.unbounded = true; steps.push(snap); status = 'unbounded'; break; }

      snap.leaving = leaving; snap.pivot = [leaving, entering]; snap.pivotValue = A[leaving][entering];
      steps.push(snap);

      // pivoteamento (Gauss-Jordan)
      var piv = A[leaving][entering];
      for (var k = 0; k < ncols; k++) A[leaving][k] /= piv;
      b[leaving] /= piv;
      for (var r2 = 0; r2 < m; r2++) {
        if (r2 === leaving) continue;
        var f = A[r2][entering];
        if (Math.abs(f) > EPS) {
          for (var k2 = 0; k2 < ncols; k2++) A[r2][k2] -= f * A[leaving][k2];
          b[r2] -= f * b[leaving];
        }
      }
      basis[leaving] = entering;
      iter++;
      if (iter > 200) { status = 'maxiter'; break; }
    }
    return { steps: steps, status: status, A: A, b: b, basis: basis };
  }

  /* ---- 4) Tentar tirar artificiais da base (entre as fases) --------- */
  function driveOutArtificials(A, b, basis, artificialSet, ncols) {
    var notes = [];
    for (var i = 0; i < basis.length; i++) {
      if (artificialSet.has(basis[i])) {
        var col = -1;
        for (var j = 0; j < ncols; j++) {
          if (artificialSet.has(j)) continue;
          if (Math.abs(A[i][j]) > EPS) { col = j; break; }
        }
        if (col >= 0) {
          var piv = A[i][col];
          for (var k = 0; k < ncols; k++) A[i][k] /= piv;
          b[i] /= piv;
          for (var r = 0; r < basis.length; r++) {
            if (r === i) continue;
            var f = A[r][col];
            if (Math.abs(f) > EPS) {
              for (var k2 = 0; k2 < ncols; k2++) A[r][k2] -= f * A[i][k2];
              b[r] -= f * b[i];
            }
          }
          basis[i] = col;
          notes.push('Variável artificial removida da base (troca degenerada).');
        }
      }
    }
    return notes;
  }

  /* ---- 5) Orquestração das DUAS FASES ------------------------------- */
  function twoPhase(problem) {
    var std = toStandard(problem);
    var artSet = new Set(std.artificialCols);
    var hasArt = std.artificialCols.length > 0;
    var result = { problem: problem, std: std, phase1: null, phase2: null, status: null, notes: [] };

    var startState = { A: std.A, b: std.b, basis: std.basis };

    if (hasArt) {
      var cost1 = new Array(std.ncols).fill(0);
      std.artificialCols.forEach(function (j) { cost1[j] = 1; });
      var p1 = solvePhase(startState, cost1, 'min', {});
      result.phase1 = p1;
      var w = p1.steps[p1.steps.length - 1].obj;
      result.phase1Value = w;
      if (w > 1e-6) { result.status = 'infeasible'; return result; }

      var A = clone2D(p1.A), b = p1.b.slice(), basis = p1.basis.slice();
      result.notes = driveOutArtificials(A, b, basis, artSet, std.ncols);
      startState = { A: A, b: b, basis: basis };
    }

    var cost2 = new Array(std.ncols).fill(0);
    for (var j = 0; j < std.decisionCount; j++) cost2[j] = problem.c[j];
    var forbidden = new Set(std.artificialCols);
    var p2 = solvePhase(startState, cost2, problem.sense, { forbidden: forbidden });
    result.phase2 = p2;
    result.status = p2.status;

    // extrair solução
    if (p2.status === 'optimal') {
      var sol = new Array(std.decisionCount).fill(0);
      var last = p2.steps[p2.steps.length - 1];
      last.basis.forEach(function (bi, row) {
        if (bi < std.decisionCount) sol[bi] = last.b[row];
      });
      result.solution = sol.map(function (v) { return round(v, 6); });
      result.Z = round(last.obj, 6);
      result.alternateOptima = detectAlternate(last, std, forbidden);
    }
    return result;
  }

  // detectar ótimos alternativos: variável não-básica com (c_j - z_j)=0
  function detectAlternate(last, std, forbidden) {
    var basisSet = new Set(last.basis);
    for (var j = 0; j < std.ncols; j++) {
      if (forbidden.has(j)) continue;
      if (basisSet.has(j)) continue;
      if (Math.abs(last.d[j]) < 1e-7) return true;
    }
    return false;
  }

  var api = { toStandard: toStandard, twoPhase: twoPhase, solvePhase: solvePhase, reduced: reduced, round: round, EPS: EPS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Simplex = api;
})(typeof window !== 'undefined' ? window : globalThis);
