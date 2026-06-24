/* ============================================================
   SIMPLEX QUEST — jogo educativo
   ------------------------------------------------------------
   Reaproveita o motor (window.Simplex) e os problemas
   (window.Problems). Três modos:
     1) Detetive de Métodos  -> Simplex padrão vs Duas Fases
     2) Resolver Quadros     -> pivô a pivô (Fase 1 + Fase 2)
     3) Quiz Relâmpago       -> regras dos critérios
   ============================================================ */
(function () {
  "use strict";
  var S = window.Simplex, P = window.Problems;
  var app, hud;

  /* ---------- helpers ---------- */
  function ri(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function resetView() { window.scrollTo(0, 0); }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var k = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[k]; a[k] = t;
    }
    return a;
  }
  function num(v) {
    if (v == null) return "—";
    if (Math.abs(v) < 1e-9) v = 0;
    return String(Math.round(v * 1000) / 1000);
  }
  function fmtVar(std, j) { var v = std.vars[j]; return v.label + "<sub>" + v.sub + "</sub>"; }

  /* ---------- estado do jogo ---------- */
  var G = { score: 0, streak: 0, correct: 0, total: 0 };
  var LEVELS = [
    { min: 0, name: "Aprendiz" },
    { min: 80, name: "Praticante" },
    { min: 180, name: "Estrategista" },
    { min: 320, name: "Mestre do Simplex" }
  ];
  function levelName() { var n = "Aprendiz"; LEVELS.forEach(function (l) { if (G.score >= l.min) n = l.name; }); return n; }
  // Sem vidas: errar só zera a sequência (e mostra a explicação). Você sempre conclui.
  function award(ok, base) {
    G.total++;
    if (ok) { G.correct++; G.streak++; G.score += (base || 10) + (Math.min(G.streak, 5) - 1) * 2; }
    else { G.streak = 0; }
    updateHUD();
  }
  function updateHUD() {
    hud.innerHTML =
      '<span class="hud-item">🏆 <b>' + G.score + "</b></span>" +
      '<span class="hud-item">🔥 ' + G.streak + "</span>" +
      '<span class="hud-item">🎯 ' + G.correct + "/" + G.total + "</span>" +
      '<span class="hud-item lvl">' + levelName() + "</span>";
  }

  var NEXT = null;   // próxima ação ao clicar "Continuar"
  var AGAIN = null;  // ação do botão "Jogar de novo"

  /* ---------- geradores de problemas ---------- */
  // Problema "padrão": max com todas as restrições <= (base inicial pronta).
  function generatePadrao() {
    for (var t = 0; t < 300; t++) {
      var n = Math.random() < 0.5 ? 2 : 3, m = Math.random() < 0.5 ? 2 : 3;
      var c = []; for (var j = 0; j < n; j++) c.push(ri(2, 9));
      var cons = [];
      for (var i = 0; i < m; i++) {
        var a = []; for (var k = 0; k < n; k++) a.push(ri(1, 6));
        cons.push({ a: a, op: "<=", b: ri(8, 40) });
      }
      var prob = { sense: "max", c: c, constraints: cons };
      var res = S.twoPhase(prob);
      if (res.status === "optimal" && res.phase2 && res.phase2.steps.length >= 2) {
        prob.titulo = "Problema gerado (Maximização)";
        return prob;
      }
    }
    return { sense: "max", c: [3, 5], titulo: "Problema gerado",
      constraints: [{ a: [1, 0], op: "<=", b: 4 }, { a: [0, 2], op: "<=", b: 12 }, { a: [3, 2], op: "<=", b: 18 }] };
  }

  /* =====================================================================
     HOME
     ===================================================================== */
  function home() {
    resetView();
    var hero =
      '<div class="hero"><h1>🎮 Simplex Quest</h1>' +
      "<p>Aprenda <b>jogando</b>: domine o <b>Método Simplex</b>, o <b>Simplex de Duas Fases</b> e descubra " +
      "<b>quando usar cada um</b>. Resolva quadros passo a passo, decida quem entra e quem sai da base e ganhe pontos. " +
      "<b>Erre sem medo:</b> você sempre conclui o exercício e aprende com a explicação.</p>" +
      '<div class="chips"><span class="chip">Pivô interativo</span><span class="chip">Fase 1 &amp; Fase 2</span>' +
      '<span class="chip">Detetive de métodos</span><span class="chip">Sem perder · pratique à vontade</span></div></div>';

    var cheat =
      '<div class="callout info" style="margin-top:22px"><div class="t">🧭 Como diferenciar os métodos (a regra de ouro)</div>' +
      "<b>Olhe os operadores das restrições</b> (com b ≥ 0):<br>" +
      "• Só <b>≤</b> → cada folga entra com +1 e já forma a base identidade → <b>Simplex padrão</b> (sem Fase 1).<br>" +
      "• Algum <b>≥</b> ou <b>=</b> → não há base pronta (o excesso entra com −1) → precisa de <b>variáveis artificiais</b> → <b>Simplex de Duas Fases</b>.<br>" +
      '<span class="muted">Dica: se b for negativo, multiplique a restrição por −1 (invertendo o operador) antes de decidir.</span></div>';

    var modes =
      '<h3 style="margin-top:26px">Escolha um modo</h3><div class="mode-grid">' +
      modeCard("1", "🕵️", "Detetive de Métodos", "Veja um problema e decida: Simplex padrão ou Duas Fases? Treine a diferença.") +
      modeCard("2", "🧩", "Resolver Quadros", "Pivô a pivô: escolha quem entra, quem sai e identifique o ótimo. Funciona com 1 ou 2 fases.") +
      modeCard("3", "⚡", "Quiz Relâmpago", "Perguntas rápidas sobre as regras: entrada/saída, Fase 1, inviável, ilimitado…") +
      "</div>";

    app.innerHTML = hero + cheat + modes + rulesCard() +
      '<div class="foot">Simplex Quest · estude Programação Linear de forma divertida</div>';
  }
  function modeCard(m, ic, title, desc) {
    return '<div class="card feature mode-card" data-mode="' + m + '"><div class="ic">' + ic + "</div>" +
      "<h3>" + title + '</h3><p class="mb0" style="font-size:14px;color:var(--ink-soft)">' + desc + "</p></div>";
  }
  function rulesCard() {
    return '<div class="card pad-lg" style="margin-top:22px"><div class="kicker">📜 Regras de bolso</div><div class="cheat">' +
      cheatBox("Forma padrão", ["≤ → + folga (fᵢ)", "≥ → − excesso (eᵢ) + artificial (aᵢ)", "= → + artificial (aᵢ)", "Garanta b ≥ 0 (×−1 se preciso)"]) +
      cheatBox("Quem ENTRA (cⱼ−zⱼ)", ["MAX: o mais POSITIVO", "MIN: o mais NEGATIVO", "Empate: escolha qualquer um"]) +
      cheatBox("Quem SAI (teste da razão)", ["θ = bᵢ / aᵢ (só aᵢ > 0)", "Sai a de MENOR θ positivo", "Sem aᵢ > 0 → ILIMITADO"]) +
      cheatBox("Fase 1 &amp; parada", ["Fase 1: min w = Σ artificiais", "w* = 0 → vá à Fase 2", "w* > 0 → INVIÁVEL", "Ótimo MAX: cⱼ−zⱼ ≤ 0 / MIN: ≥ 0"]) +
      "</div></div>";
  }
  function cheatBox(t, items) {
    return '<div class="card"><h4>' + t + "</h4><ul>" +
      items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul></div>";
  }

  /* =====================================================================
     MODO 1 — DETETIVE DE MÉTODOS
     ===================================================================== */
  var m1 = null;
  function startMode1() { m1 = { i: 0, n: 6, locked: false }; nextM1(); }
  function nextM1() {
    if (m1.i >= m1.n) return roundResults("Detetive de Métodos", function () { startMode1(); });
    var prob = (Math.random() < 0.5) ? P.generate() : generatePadrao();
    var std = S.toStandard(prob);
    m1.cur = { prob: prob, std: std, needsTwo: std.artificialCols.length > 0 };
    m1.locked = false;
    renderM1(null);
  }
  function renderM1(reveal) {
    resetView();
    var c = m1.cur;
    function btn(val, title, desc) {
      var cls = "choice";
      if (reveal) {
        var correct = (val === "duas") === c.needsTwo;
        if (val === reveal.choice) cls += reveal.ok ? " sel-ok" : " sel-no";
        if (correct && !reveal.ok) cls += " sel-correct";
      }
      return '<button class="' + cls + '"' + (reveal ? "" : ' data-c="' + val + '"') +
        "><b>" + title + "</b><small>" + desc + "</small></button>";
    }
    var head =
      '<div class="screen-head row-between"><div><span class="badge gray">🕵️ Detetive de Métodos</span> ' +
      '<span class="muted">questão ' + (m1.i + 1) + " / " + m1.n + "</span></div>" +
      '<button class="btn btn-sm btn-line" data-act="menu">🏠 Menu</button></div>';
    var card =
      '<div class="card pad-lg"><div class="kicker">Qual método usar?</div>' +
      '<h3 class="mt0">Para iniciar o Simplex neste problema, qual caminho?</h3>' +
      '<div class="formula">' + P.pretty(c.prob) + "</div>" +
      '<div class="choices">' +
      btn("padrao", "Simplex padrão", "Todas as restrições ≤: as folgas já formam a base. Sem Fase 1.") +
      btn("duas", "Simplex de Duas Fases", "Há ≥ ou =: precisa de variáveis artificiais e da Fase 1.") +
      "</div></div>";
    app.innerHTML = head + card;
    if (reveal) appendFeedback(reveal.ok, reveal.title, reveal.html);
  }
  function onM1(choice) {
    if (m1.locked) return; m1.locked = true;
    var c = m1.cur;
    var ok = (choice === "duas") === c.needsTwo;
    award(ok, 10);
    var ops = c.prob.constraints.map(function (x) { return x.op === "<=" ? "≤" : x.op === ">=" ? "≥" : "="; });
    var hasEq = c.prob.constraints.some(function (x) { return x.op === "="; });
    var correctName = c.needsTwo ? "DUAS FASES" : "SIMPLEX PADRÃO";
    var why = c.needsTwo
      ? "Há restrição " + (hasEq ? "= e/ou " : "") + "≥, cuja folga/excesso entra com −1 (ou não existe) — não forma base identidade. " +
        "Entram <b>variáveis artificiais</b> → é preciso a <b>Fase 1</b>."
      : "Todas as restrições são ≤ com b ≥ 0 → cada folga entra com +1, a base identidade já existe → <b>sem Fase 1</b>.";
    var html = "<b>Resposta certa: " + correctName + ".</b><br>Operadores das restrições: " + ops.join(", ") + ".<br>" + why;
    NEXT = function () { m1.i++; nextM1(); };
    renderM1({ choice: choice, ok: ok, title: ok ? "Mandou bem!" : "Observe os operadores", html: html });
  }

  /* =====================================================================
     MODO 2 — RESOLVER QUADROS (pivô a pivô)
     ===================================================================== */
  var solve = null;

  function chooserMode2() {
    resetView();
    function pbtn(v, t, d) { return '<button class="choice" data-prob="' + v + '"><b>' + t + "</b><small>" + d + "</small></button>"; }
    app.innerHTML =
      '<div class="screen-head row-between"><span class="badge gray">🧩 Resolver Quadros</span>' +
      '<button class="btn btn-sm btn-line" data-act="menu">🏠 Menu</button></div>' +
      '<div class="card pad-lg"><div class="kicker">Escolha o desafio</div>' +
      '<h3 class="mt0">Qual problema você quer resolver?</h3><div class="choices">' +
      pbtn("rand", "🎲 Aleatório", "Sorteia entre padrão e duas fases.") +
      pbtn("padrao", "≤ Simplex padrão", "Só restrições ≤ — uma única fase.") +
      pbtn("duas", "≥ Duas Fases", "Com ≥ / = — você verá a Fase 1 e a Fase 2.") +
      pbtn("silvab", "📘 Exemplo (SILVA b)", "Min com ≤ e ≥ — tem ótimos alternativos.") +
      pbtn("silvaa", "📘 Desafio (SILVA a)", "Max com duas ≥ — caso ILIMITADO!") +
      "</div></div>";
  }
  function pickProblem(kind) {
    var prob;
    if (kind === "padrao") prob = generatePadrao();
    else if (kind === "duas") prob = P.generate();
    else if (kind === "silvab") prob = clone(P.FIXED.b);
    else if (kind === "silvaa") prob = clone(P.FIXED.a);
    else prob = (Math.random() < 0.5) ? generatePadrao() : P.generate();
    beginSolve(prob);
  }
  function buildSeq(res) {
    var seq = [];
    if (res.phase1) res.phase1.steps.forEach(function (s) { seq.push({ phase: "1", snap: s }); });
    if (res.phase2) { var ph = res.phase1 ? "2" : "std"; res.phase2.steps.forEach(function (s) { seq.push({ phase: ph, snap: s }); }); }
    return seq;
  }
  function beginSolve(prob) {
    var res = S.twoPhase(prob);
    solve = {
      prob: prob, res: res, std: res.std, seq: buildSeq(res),
      idx: 0, substep: "optimality", forbidden: new Set(res.std.artificialCols), feedback: null
    };
    renderSolve();
  }

  // melhor cⱼ−zⱼ e conjunto de colunas válidas para ENTRAR
  function enteringInfo(snap, phase) {
    var std = solve.std, sense = phase === "1" ? "min" : solve.prob.sense;
    var best = sense === "max" ? -Infinity : Infinity;
    for (var j = 0; j < std.ncols; j++) {
      if (phase !== "1" && solve.forbidden.has(j)) continue;
      var dj = snap.d[j];
      if (sense === "max") { if (dj > best) best = dj; } else { if (dj < best) best = dj; }
    }
    var set = {}, names = [];
    var improving = (sense === "max" && best > 1e-7) || (sense === "min" && best < -1e-7);
    for (var j2 = 0; j2 < std.ncols; j2++) {
      if (phase !== "1" && solve.forbidden.has(j2)) continue;
      if (improving && Math.abs(snap.d[j2] - best) < 1e-6) { set[j2] = true; names.push(fmtVar(std, j2)); }
    }
    return { sense: sense, best: best, set: set, names: names.join(" ou ") };
  }

  function renderSolve() {
    resetView();
    var cur = solve.seq[solve.idx], snap = cur.snap, phase = cur.phase, std = solve.std;
    var firstP2 = solve.res.phase1 ? solve.res.phase1.steps.length : -1;
    var fb = solve.feedback;
    if (fb) NEXT = fb.next;

    var badge = phase === "1" ? '<span class="badge f1">FASE 1 · min w</span>'
      : phase === "2" ? '<span class="badge f2">FASE 2 · Z</span>'
      : '<span class="badge green">SIMPLEX PADRÃO · Z</span>';
    var head =
      '<div class="screen-head"><div class="row-between"><div>' + badge +
      ' &nbsp; <span class="muted">quadro ' + (solve.idx + 1) + " / " + solve.seq.length + "</span></div>" +
      '<div><button class="btn btn-sm btn-line" data-act="novo">🎲 Novo</button> ' +
      '<button class="btn btn-sm btn-line" data-act="menu">🏠 Menu</button></div></div>' +
      '<div class="formula" style="margin-top:10px">' + P.pretty(solve.prob) + "</div></div>";

    var transition = "";
    if (phase === "2" && solve.idx === firstP2 && solve.substep === "optimality" && !fb) {
      transition = '<div class="callout ok"><div class="t">✅ Fase 1 concluída — w* = 0</div>' +
        "A base é viável! As variáveis artificiais saíram e os custos voltam a ser os de Z. Começa a <b>Fase 2</b>.</div>";
    }

    // contexto de renderização do quadro
    var ctx = { forbidden: solve.forbidden };
    if (fb) {
      if (fb.reveal === "leaving") { ctx.enteringCol = snap.entering; ctx.showRatios = true; ctx.pivotRow = snap.unbounded ? -1 : snap.leaving; ctx.pivotCol = snap.unbounded ? -1 : snap.entering; }
      else if (fb.reveal === "entering") { ctx.enteringCol = snap.entering; }
    } else if (solve.substep === "entering") { ctx.interactive = "entering"; }
    else if (solve.substep === "leaving") { ctx.interactive = "leaving"; ctx.enteringCol = snap.entering; ctx.showRatios = true; }

    var panel = fb ? feedbackPanel(fb) : questionPanel(snap, phase);
    app.innerHTML = head + transition + renderTableau(snap, std, ctx) + legendHTML() + panel;
  }

  function legendHTML() {
    return '<div class="legend">' +
      '<span><span class="sw col-sw"></span> coluna que entra</span>' +
      '<span><span class="sw row-sw"></span> linha que sai</span>' +
      '<span><span class="sw piv-sw"></span> pivô</span>' +
      '<span><span class="sw art-sw"></span> artificial</span></div>';
  }

  function renderTableau(snap, std, ctx) {
    ctx = ctx || {};
    var n = std.ncols, m = snap.A.length;
    var eCol = (ctx.enteringCol == null ? -1 : ctx.enteringCol);
    var ratios = null;
    if (ctx.showRatios && eCol >= 0) {
      ratios = []; for (var i = 0; i < m; i++) { var a = snap.A[i][eCol]; ratios.push(a > 1e-9 ? snap.b[i] / a : null); }
    }
    var h = '<div class="tableau-wrap"><table class="tableau"><thead>';
    // linha de custos cⱼ
    h += '<tr><th class="cb" colspan="2">cⱼ →</th>';
    for (var j = 0; j < n; j++) h += '<th class="cb' + (std.vars[j].type === "artificial" ? " art" : "") + '">' + num(snap.cost[j]) + "</th>";
    h += '<th class="cb" rowspan="2">b</th><th class="cb" rowspan="2">θ</th></tr>';
    // linha de nomes
    h += '<tr><th class="cb">C<sub>B</sub></th><th class="cb">Base</th>';
    for (var jj = 0; jj < n; jj++) {
      var art = std.vars[jj].type === "artificial";
      var hc = (jj === eCol ? " in-piv-col" : "") + (art ? " art" : "");
      if (ctx.interactive === "entering") h += '<th class="pick' + hc + '" data-pick="enter" data-col="' + jj + '">' + fmtVar(std, jj) + "</th>";
      else h += '<th class="' + hc.trim() + '">' + fmtVar(std, jj) + "</th>";
    }
    h += "</tr></thead><tbody>";
    // linhas de restrição
    for (var r = 0; r < m; r++) {
      var bvar = snap.basis[r];
      h += '<tr class="' + (ctx.pivotRow === r ? "piv-row" : "") + '">';
      h += '<td class="cb-cell">' + num(snap.cost[bvar]) + "</td>";
      if (ctx.interactive === "leaving") h += '<td class="rowhead pick" data-pick="leave" data-row="' + r + '">' + fmtVar(std, bvar) + "</td>";
      else h += '<td class="rowhead">' + fmtVar(std, bvar) + "</td>";
      for (var jc = 0; jc < n; jc++) {
        var cls = "";
        if (std.vars[jc].type === "artificial") cls += " art";
        if (jc === eCol) cls += " in-piv-col";
        if (ctx.pivotRow === r && jc === ctx.pivotCol) cls += " piv-cell";
        h += '<td class="' + cls.trim() + '">' + num(snap.A[r][jc]) + "</td>";
      }
      h += '<td class="bcol">' + num(snap.b[r]) + "</td>";
      h += '<td class="ratio">' + (ratios ? (ratios[r] == null ? "—" : num(ratios[r])) : "—") + "</td>";
      h += "</tr>";
    }
    // linha zⱼ
    h += '<tr class="zrow"><td class="label-cell" colspan="2">zⱼ</td>';
    for (var jz = 0; jz < n; jz++) h += '<td class="' + (jz === eCol ? "in-piv-col" : "") + '">' + num(snap.z[jz]) + "</td>";
    h += '<td class="bcol">' + num(snap.obj) + "</td><td></td></tr>";
    // linha cⱼ−zⱼ
    h += '<tr class="drow"><td class="label-cell" colspan="2">cⱼ−zⱼ</td>';
    for (var jd = 0; jd < n; jd++) h += '<td class="' + (jd === eCol ? "in-piv-col" : "") + '">' + num(snap.d[jd]) + "</td>";
    h += "<td></td><td></td></tr></tbody></table></div>";
    return h;
  }

  function questionPanel(snap, phase) {
    var std = solve.std;
    if (solve.substep === "optimality") {
      var rule = phase === "1" ? "Fase 1 (min w): é ótimo quando todos cⱼ−zⱼ ≥ 0."
        : (solve.prob.sense === "max" ? "MAX: é ótimo quando todos cⱼ−zⱼ ≤ 0." : "MIN: é ótimo quando todos cⱼ−zⱼ ≥ 0.");
      return '<div class="qpanel"><div class="qp-q">Este quadro já é ótimo, ou ainda dá para melhorar?</div>' +
        '<div class="qp-hint">📐 ' + rule + "</div>" +
        '<div class="qp-actions"><button class="btn btn-primary" data-act="opt-continue">▶ Dá para melhorar (pivotar)</button>' +
        '<button class="btn btn-accent" data-act="opt-stop">⏹ É ÓTIMO (parar)</button></div></div>';
    }
    if (solve.substep === "entering") {
      var s = phase === "1" ? "min" : solve.prob.sense;
      var r = s === "max" ? "Escolha o cⱼ−zⱼ MAIS POSITIVO." : "Escolha o cⱼ−zⱼ MAIS NEGATIVO.";
      return '<div class="qpanel"><div class="qp-q">👆 Clique no cabeçalho da variável que <b>ENTRA</b> na base.</div>' +
        '<div class="qp-hint">📐 ' + r + "</div></div>";
    }
    // leaving
    return '<div class="qpanel"><div class="qp-q">👈 Clique na variável básica (linha) que <b>SAI</b> da base.</div>' +
      '<div class="qp-hint">📐 Teste da razão: menor θ = b/aᵢ positivo, na coluna de ' + fmtVar(std, snap.entering) + ".</div>" +
      '<div class="qp-actions"><button class="btn btn-line" data-act="unbounded">🚫 Sem razão válida → ILIMITADO</button></div></div>';
  }

  function feedbackPanel(fb) {
    return '<div class="card feedbox ' + (fb.ok ? "good" : "bad") + '">' +
      '<div class="fb-t">' + (fb.ok ? "✔ " : "✘ ") + fb.title + "</div>" +
      '<div class="fb-b">' + fb.html + "</div>" +
      '<button class="btn btn-primary" data-act="continue">Continuar ▶</button></div>';
  }

  /* --- handlers do solver --- */
  function onOptimality(choice) {
    if (solve.feedback) return;
    var snap = solve.seq[solve.idx].snap, improving = !snap.optimal;
    var ok = (choice === "continue") === improving;
    award(ok, 10);
    var msg = improving
      ? (ok ? "Correto! Ainda existe cⱼ−zⱼ favorável, então pivotamos." : "Ainda NÃO é ótimo: há variável com custo reduzido favorável. Vamos pivotar.")
      : (ok ? "Isso! Nenhum cⱼ−zⱼ melhora o objetivo → solução ÓTIMA desta etapa." : "Repare: todos os cⱼ−zⱼ já atendem ao critério de parada → é ÓTIMO.");
    solve.feedback = { ok: ok, reveal: "optimality", title: ok ? "Boa!" : "Quase…", html: msg, next: function () {
      solve.feedback = null;
      if (improving) { solve.substep = "entering"; renderSolve(); } else concludeStop();
    } };
    renderSolve();
  }
  function concludeStop() {
    var cur = solve.seq[solve.idx], snap = cur.snap, phase = cur.phase;
    if (phase === "1") {
      var w = snap.obj;
      if (w > 1e-6 || !solve.res.phase2) return infeasibleEnd(w);
      solve.idx++; solve.substep = "optimality"; renderSolve();
    } else solvedEnd();
  }
  function onEnter(col) {
    if (solve.feedback || solve.substep !== "entering") return;
    var cur = solve.seq[solve.idx], snap = cur.snap, phase = cur.phase, std = solve.std;
    var info = enteringInfo(snap, phase);
    var ok = false, msg;
    if (phase !== "1" && solve.forbidden.has(col)) msg = "A variável " + fmtVar(std, col) + " é <b>artificial</b> e fica proibida na Fase 2 (não pode reentrar).";
    else if (snap.basis.indexOf(col) >= 0) msg = fmtVar(std, col) + " já é <b>básica</b> (cⱼ−zⱼ = 0). Quem entra é uma NÃO-básica favorável.";
    else if (info.set[col]) { ok = true; msg = "Correto! " + fmtVar(std, col) + " tem o cⱼ−zⱼ " + (info.sense === "max" ? "mais positivo" : "mais negativo") + " (" + num(snap.d[col]) + ")."; }
    else msg = "Não é a melhor escolha. O critério (" + (info.sense === "max" ? "MAX → maior cⱼ−zⱼ positivo" : "MIN → menor cⱼ−zⱼ negativo") + ") aponta para " + info.names + " (" + num(info.best) + ").";
    award(ok, 10);
    solve.feedback = { ok: ok, reveal: "entering", title: ok ? "Entra certa!" : "Veja o critério", html: msg, next: function () {
      solve.feedback = null; solve.substep = "leaving"; renderSolve();
    } };
    renderSolve();
  }
  function onLeave(row) {
    if (solve.feedback || solve.substep !== "leaving") return;
    var snap = solve.seq[solve.idx].snap, std = solve.std, e = snap.entering;
    if (snap.unbounded) {
      award(false, 10);
      solve.feedback = { ok: false, reveal: "leaving", title: "Olhe a coluna", html:
        "A coluna de " + fmtVar(std, e) + " não tem coeficiente positivo. Sem razão válida, a variável cresce sem limite → use o botão <b>ILIMITADO</b>.",
        next: function () { solve.feedback = null; unboundedEnd(); } };
      return renderSolve();
    }
    var minr = Infinity, ratios = [];
    for (var i = 0; i < snap.A.length; i++) { var a = snap.A[i][e]; var rr = a > 1e-9 ? snap.b[i] / a : null; ratios.push(rr); if (rr != null && rr < minr) minr = rr; }
    var ok = false, msg;
    if (ratios[row] == null) msg = "Na linha de " + fmtVar(std, snap.basis[row]) + ", o coeficiente da coluna pivô é ≤ 0 → a razão não se aplica a essa linha.";
    else if (Math.abs(ratios[row] - minr) < 1e-6) { ok = true; msg = "Isso! " + fmtVar(std, snap.basis[row]) + " tem a MENOR razão positiva (θ = " + num(minr) + "), então sai da base."; }
    else msg = "Essa não é a menor razão (θ = " + num(ratios[row]) + "). A menor razão positiva é " + num(minr) + " → sai " + fmtVar(std, snap.basis[snap.leaving]) + ".";
    award(ok, 10);
    solve.feedback = { ok: ok, reveal: "leaving", title: ok ? "Sai certa!" : "Teste da razão", html: msg, next: function () {
      solve.feedback = null; solve.idx++; solve.substep = "optimality"; renderSolve();
    } };
    renderSolve();
  }
  function onUnbounded() {
    if (solve.feedback || solve.substep !== "leaving") return;
    var snap = solve.seq[solve.idx].snap, std = solve.std;
    if (snap.unbounded) {
      award(true, 15);
      solve.feedback = { ok: true, reveal: "leaving", title: "Ilimitado!", html:
        "Correto! A coluna de " + fmtVar(std, snap.entering) + " não tem coeficiente positivo → o objetivo é ILIMITADO.",
        next: function () { solve.feedback = null; unboundedEnd(); } };
    } else {
      award(false, 10);
      solve.feedback = { ok: false, reveal: "leaving", title: "Há razão válida", html:
        "Existe coeficiente positivo na coluna pivô, então há razão válida — não é ilimitado aqui. Escolha a linha de menor razão.",
        next: function () { solve.feedback = null; solve.substep = "leaving"; renderSolve(); } };
    }
    renderSolve();
  }

  function endActions() {
    return '<div class="qp-actions" style="margin-top:6px"><button class="btn btn-primary" data-act="novo">🎲 Novo problema</button>' +
      '<button class="btn btn-line" data-act="menu">🏠 Menu</button></div>';
  }
  function solvedEnd() {
    resetView();
    G.score += 20; updateHUD();
    var res = solve.res, std = solve.std;
    var sol = res.solution.map(function (v, j) { return fmtVar(std, j) + " = <b>" + num(v) + "</b>"; }).join(" &nbsp;·&nbsp; ");
    var alt = res.alternateOptima ? '<div class="callout tip"><div class="t">💡 Ótimos alternativos</div>' +
      "Há variável não-básica com cⱼ−zⱼ = 0 → existe outra solução ótima com o mesmo Z." : "";
    app.innerHTML =
      '<div class="result-banner optimal"><h3>🎉 Solução ÓTIMA encontrada!</h3>' +
      '<div class="vals"><span>Z = ' + num(res.Z) + "</span><span>" + sol + "</span></div></div>" +
      alt + endActions();
  }
  function unboundedEnd() {
    resetView();
    app.innerHTML =
      '<div class="result-banner unbounded"><h3>♾️ Problema ILIMITADO</h3>' +
      '<div class="vals"><span>coluna pivô sem coeficiente positivo</span></div></div>' +
      '<div class="callout warn">A variável que entraria pode crescer indefinidamente sem violar restrições → o objetivo não tem valor ótimo finito.</div>' +
      endActions();
  }
  function infeasibleEnd(w) {
    resetView();
    app.innerHTML =
      '<div class="result-banner infeasible"><h3>⛔ Problema INVIÁVEL</h3>' +
      '<div class="vals"><span>w* = ' + num(w) + " &gt; 0</span></div></div>" +
      '<div class="callout danger">Não foi possível zerar as variáveis artificiais na Fase 1 → as restrições são incompatíveis → não existe solução factível.</div>' +
      endActions();
  }

  /* =====================================================================
     MODO 3 — QUIZ RELÂMPAGO
     ===================================================================== */
  var QUIZ = [
    { q: "Quando o método das DUAS FASES é necessário (em vez do Simplex padrão)?",
      opts: ["Quando há pelo menos uma restrição ≥ ou =, exigindo variáveis artificiais", "Quando o objetivo é maximizar", "Quando há mais de 2 variáveis", "Sempre, em qualquer PL"], a: 0,
      expl: "Restrições ≤ trazem a folga (+1) que já forma a base identidade. Já ≥ e = não — precisamos de artificiais e, portanto, da Fase 1." },
    { q: "Qual é o objetivo da FASE 1?",
      opts: ["Minimizar a soma das variáveis artificiais (w)", "Maximizar Z", "Encontrar a solução ótima final", "Eliminar as variáveis de folga"], a: 0,
      expl: "A Fase 1 procura uma solução básica viável zerando as artificiais (min w). Se w* = 0, a base encontrada serve para a Fase 2." },
    { q: "Ao final da Fase 1 obtém-se w* > 0. O que isso significa?",
      opts: ["O problema é INVIÁVEL (não há solução factível)", "O problema é ilimitado", "A solução é ótima", "Precisamos trocar para maximização"], a: 0,
      expl: "Se não dá para zerar as artificiais, as restrições são incompatíveis → a região viável é vazia → inviável." },
    { q: "Em um problema de MAXIMIZAÇÃO (convenção cⱼ−zⱼ), qual variável ENTRA na base?",
      opts: ["A de cⱼ−zⱼ mais POSITIVO", "A de cⱼ−zⱼ mais negativo", "A primeira da tabela", "A de maior bᵢ"], a: 0,
      expl: "Maximizar: escolhemos a coluna que mais aumenta Z, ou seja, o maior cⱼ−zⱼ positivo. Ótimo quando todos cⱼ−zⱼ ≤ 0." },
    { q: "E em um problema de MINIMIZAÇÃO (convenção cⱼ−zⱼ), qual variável entra?",
      opts: ["A de cⱼ−zⱼ mais NEGATIVO", "A de cⱼ−zⱼ mais positivo", "Qualquer variável básica", "A de menor custo cⱼ"], a: 0,
      expl: "Minimizar: escolhemos o cⱼ−zⱼ mais negativo. Ótimo quando todos cⱼ−zⱼ ≥ 0." },
    { q: "O teste da razão (θ) escolhe a variável que SAI da base como:",
      opts: ["A linha de MENOR razão bᵢ/aᵢ positiva", "A linha de maior razão", "A linha de maior bᵢ", "A primeira linha"], a: 0,
      expl: "Para manter a viabilidade (b ≥ 0), sai a básica de menor razão positiva entre o RHS e o coeficiente da coluna pivô." },
    { q: "Na coluna que vai entrar, TODOS os coeficientes são ≤ 0. O que concluímos?",
      opts: ["O problema é ILIMITADO", "A solução é ótima", "O problema é inviável", "Há empate de razões"], a: 0,
      expl: "Sem coeficiente positivo não há limite no teste da razão: a variável cresce infinitamente → objetivo ilimitado." },
    { q: "Por que uma restrição do tipo ≥ exige variável artificial?",
      opts: ["A variável de excesso entra com −1 e não forma coluna identidade", "Porque ≥ sempre torna o problema inviável", "Para inverter o sentido da otimização", "Porque ≥ não pode ter folga"], a: 0,
      expl: "Em a·x − e = b (e ≥ 0), a coluna de excesso tem −1; não serve de base inicial. A artificial (+1) fornece a base, e a Fase 1 a expulsa." },
    { q: "Numa solução final, uma variável ARTIFICIAL permanece básica com valor positivo. O que isso indica?",
      opts: ["O problema é inviável", "Solução ótima alternativa", "Que devemos continuar pivotando", "Erro de arredondamento, ignore"], a: 0,
      expl: "As artificiais devem sair (valer 0). Se uma fica positiva, as restrições originais não podem ser satisfeitas → inviável." },
    { q: "Todas as restrições de um PL de maximização são ≤ com b ≥ 0. Como começar?",
      opts: ["Simplex padrão: as folgas já são a base inicial", "Duas fases, sempre", "Big-M obrigatoriamente", "Não é possível resolver"], a: 0,
      expl: "Cada ≤ gera folga +1 → base identidade pronta. Não há artificiais → a Fase 1 é desnecessária." }
  ];
  var m3 = null;
  function startMode3() { m3 = { pool: shuffle(QUIZ.slice()).slice(0, 6), i: 0, locked: false }; nextM3(); }
  function nextM3() {
    if (m3.i >= m3.pool.length) return roundResults("Quiz Relâmpago", function () { startMode3(); });
    var q = m3.pool[m3.i];
    m3.view = shuffle(q.opts.map(function (t, i) { return { text: t, correct: i === q.a }; }));
    m3.locked = false;
    renderM3(null);
  }
  function renderM3(reveal) {
    resetView();
    var q = m3.pool[m3.i], letters = ["A", "B", "C", "D", "E"];
    var opts = m3.view.map(function (o, i) {
      var cls = "opt";
      if (reveal) { cls += " disabled"; if (o.correct) cls += " correct"; else if (i === reveal.choice) cls += " wrong"; }
      return '<div class="' + cls + '"' + (reveal ? "" : ' data-opt="' + i + '"') + '><span class="mark">' + letters[i] + "</span><span>" + o.text + "</span></div>";
    }).join("");
    var head =
      '<div class="screen-head row-between"><div><span class="badge f2">⚡ Quiz Relâmpago</span> ' +
      '<span class="muted">questão ' + (m3.i + 1) + " / " + m3.pool.length + "</span></div>" +
      '<button class="btn btn-sm btn-line" data-act="menu">🏠 Menu</button></div>';
    app.innerHTML = head + '<div class="card pad-lg q-card"><div class="q">' + q.q + "</div>" + opts + "</div>";
    if (reveal) appendFeedback(reveal.ok, reveal.ok ? "Correto!" : "Não exatamente", q.expl);
  }
  function onM3(idx) {
    if (m3.locked) return; m3.locked = true;
    var ok = m3.view[idx].correct;
    award(ok, 10);
    NEXT = function () { m3.i++; nextM3(); };
    renderM3({ choice: idx, ok: ok });
  }

  /* =====================================================================
     RESULTADOS / GAME OVER / feedback genérico
     ===================================================================== */
  function appendFeedback(ok, title, html) {
    var div = document.createElement("div");
    div.className = "card feedbox " + (ok ? "good" : "bad");
    div.innerHTML = '<div class="fb-t">' + (ok ? "✔ " : "✘ ") + title + "</div>" +
      '<div class="fb-b">' + html + "</div>" +
      '<button class="btn btn-primary" data-act="continue">Continuar ▶</button>';
    app.appendChild(div);
    div.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function statsRow() {
    var pct = G.total ? Math.round(100 * G.correct / G.total) : 0;
    return '<div class="result-vals"><div><span class="n">' + G.score + "</span>pontos</div>" +
      '<div><span class="n">' + pct + "%</span>precisão</div>" +
      '<div><span class="n">' + levelName() + "</span>nível</div></div>";
  }
  function roundResults(title, again) {
    resetView(); AGAIN = again;
    var pct = G.total ? Math.round(100 * G.correct / G.total) : 0;
    var stars = pct >= 90 ? "⭐⭐⭐" : pct >= 60 ? "⭐⭐" : "⭐";
    app.innerHTML = '<div class="card pad-lg tac"><div class="kicker">' + title + "</div>" +
      '<h2 class="mt0">Rodada concluída!</h2><div class="stars">' + stars + "</div>" + statsRow() +
      '<div class="qp-actions" style="justify-content:center"><button class="btn btn-primary" data-act="again">▶ Jogar de novo</button>' +
      '<button class="btn btn-line" data-act="menu">🏠 Menu</button></div></div>';
  }
  function continueHandler() {
    var f = NEXT; NEXT = null; if (f) f();
  }

  /* =====================================================================
     ROTEAMENTO DE CLIQUES (delegação)
     ===================================================================== */
  function startMode(m) {
    if (m === "1") return startMode1();
    if (m === "2") return chooserMode2();
    if (m === "3") return startMode3();
  }
  function onClick(e) {
    var t = e.target.closest("[data-act],[data-nav],[data-mode],[data-prob],[data-c],[data-opt],[data-pick]");
    if (!t || !app.contains(t)) return;
    if (t.classList.contains("disabled")) return;

    if (t.dataset.nav === "home") return home();
    if (t.dataset.mode) return startMode(t.dataset.mode);
    if (t.dataset.prob) return pickProblem(t.dataset.prob);
    if (t.dataset.c) return onM1(t.dataset.c);
    if (t.dataset.opt != null && t.dataset.opt !== "") return onM3(parseInt(t.dataset.opt, 10));
    if (t.dataset.pick === "enter") return onEnter(parseInt(t.dataset.col, 10));
    if (t.dataset.pick === "leave") return onLeave(parseInt(t.dataset.row, 10));

    switch (t.dataset.act) {
      case "continue": return continueHandler();
      case "opt-continue": return onOptimality("continue");
      case "opt-stop": return onOptimality("stop");
      case "unbounded": return onUnbounded();
      case "novo": return chooserMode2();
      case "menu": return home();
      case "again": return AGAIN && AGAIN();
    }
  }

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    app = document.getElementById("app");
    hud = document.getElementById("hud");
    if (!S || !P) { app.innerHTML = '<div class="callout danger">Erro: motores não carregados. Verifique js/simplex.js e js/problems.js.</div>'; return; }
    app.addEventListener("click", onClick);
    updateHUD();
    home();
  });
})();
