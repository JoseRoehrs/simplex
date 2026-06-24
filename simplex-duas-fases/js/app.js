/* ============================================================
   App — navegação, resolvedor, gerador, construtor e quiz
   ============================================================ */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ic = window.ic || function () { return ''; };

  /* ---------- Navegação entre seções ---------- */
  function go(id) {
    $$('.section').forEach(function (s) { s.classList.toggle('active', s.id === id); });
    $$('.nav button').forEach(function (b) { b.classList.toggle('active', b.dataset.go === id); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { go(b.dataset.go); }); });

  /* ---------- Accordions ---------- */
  $$('.acc > button').forEach(function (btn) {
    btn.addEventListener('click', function () { btn.parentElement.classList.toggle('open'); });
  });

  /* ---------- Resolvedor: abas ---------- */
  var solveOut = $('#solve-output');
  function renderProblemHeader(problem) {
    var nota = problem.nota ? '<div class="callout info" style="margin-top:14px"><div class="t">' + ic('bulb') + ' Sobre este problema</div>' + problem.nota + '</div>' : '';
    return '<div class="card" style="margin-bottom:18px"><div class="row-between">' +
      '<div><div class="kicker">Problema</div><h3 class="mb0">' + (problem.titulo || 'Problema') + '</h3></div></div>' +
      '<div class="formula" style="margin-top:14px">' + window.Problems.pretty(problem) + '</div>' + nota + '</div>';
  }
  function solveAndShow(problem) {
    solveOut.innerHTML = '<div class="tac muted" style="padding:30px">' + ic('loader', 'spin') + ' Resolvendo…</div>';
    setTimeout(function () {
      var html = renderProblemHeader(problem);
      html += window.Render.solution(problem);
      solveOut.innerHTML = html;
      solveOut.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  $$('.tab-btn[data-tab]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.tab-btn[data-tab]').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      $$('.solve-pane').forEach(function (p) { p.classList.toggle('active', p.id === 'pane-' + b.dataset.tab); });
      $$('.solve-pane').forEach(function (p) { p.style.display = (p.id === 'pane-' + b.dataset.tab) ? 'block' : 'none'; });
    });
  });

  // problemas fixos
  $('#btn-prob-s7') && $('#btn-prob-s7').addEventListener('click', function () { solveAndShow(clone(window.Problems.FIXED.s7)); });
  $('#btn-prob-s8a') && $('#btn-prob-s8a').addEventListener('click', function () { solveAndShow(clone(window.Problems.FIXED.s8a)); });
  $('#btn-prob-s8b') && $('#btn-prob-s8b').addEventListener('click', function () { solveAndShow(clone(window.Problems.FIXED.s8b)); });
  $('#btn-prob-s9') && $('#btn-prob-s9').addEventListener('click', function () { solveAndShow(clone(window.Problems.FIXED.s9)); });
  $('#btn-prob-a') && $('#btn-prob-a').addEventListener('click', function () { solveAndShow(clone(window.Problems.FIXED.a)); });
  $('#btn-prob-b') && $('#btn-prob-b').addEventListener('click', function () { solveAndShow(clone(window.Problems.FIXED.b)); });
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // gerador aleatório
  var genArea = $('#gen-area');
  function newRandom() {
    var p = window.Problems.generate();
    genArea.innerHTML = renderProblemHeader(p) +
      '<div class="tac" style="margin:6px 0 22px"><button class="btn btn-accent" id="btn-solve-gen">Resolver passo a passo ' + ic('play') + '</button> ' +
      '<button class="btn btn-line" id="btn-regen">' + ic('dices') + ' Gerar outro</button></div>' +
      '<div id="gen-solution"></div>';
    $('#btn-solve-gen').addEventListener('click', function () {
      $('#gen-solution').innerHTML = window.Render.solution(p);
      $('#gen-solution').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#btn-regen').addEventListener('click', newRandom);
  }
  $('#btn-gen') && $('#btn-gen').addEventListener('click', newRandom);

  /* ---------- Construtor personalizado ---------- */
  var buildState = { sense: 'max', nVars: 2, constraints: [{ op: '<=', }, { op: '>=' }] };

  function buildUI() {
    var b = $('#builder');
    var n = buildState.nVars;
    var html = '';
    // objetivo
    html += '<div class="card"><div class="kicker">Função objetivo</div>';
    html += '<div class="obj-row"><select class="mini" id="b-sense" aria-label="Tipo de otimização">' +
      '<option value="max"' + (buildState.sense === 'max' ? ' selected' : '') + '>Maximizar</option>' +
      '<option value="min"' + (buildState.sense === 'min' ? ' selected' : '') + '>Minimizar</option></select> ' +
      '<b>Z =</b> ';
    for (var j = 0; j < n; j++) {
      if (j > 0) html += ' + ';
      html += '<input class="coef-in" type="text" inputmode="decimal" aria-label="Coeficiente de x' + (j + 1) + ' no objetivo" data-cj="' + j + '" value="' + (buildState['c' + j] != null ? buildState['c' + j] : '1') + '"> x<sub>' + (j + 1) + '</sub>';
    }
    html += '</div>';
    html += '<div style="margin-top:12px;display:flex;align-items:center;gap:8px" class="muted">Variáveis: ' +
      '<button class="btn btn-sm btn-line" id="b-varminus" aria-label="Remover variável">' + ic('minus') + '</button> <b>' + n + '</b> ' +
      '<button class="btn btn-sm btn-line" id="b-varplus" aria-label="Adicionar variável">' + ic('plus') + '</button></div>';
    html += '</div>';

    // restrições
    html += '<div class="card" style="margin-top:16px"><div class="kicker">Restrições</div><div id="b-cons">';
    buildState.constraints.forEach(function (con, ci) {
      html += '<div class="con-row" data-ci="' + ci + '">';
      for (var k = 0; k < n; k++) {
        if (k > 0) html += '<span>+</span>';
        var key = 'a_' + ci + '_' + k;
        html += '<input class="coef-in" type="text" inputmode="decimal" aria-label="Coeficiente de x' + (k + 1) + ' na restrição ' + (ci + 1) + '" data-aij="' + ci + ',' + k + '" value="' + (buildState[key] != null ? buildState[key] : '1') + '"> <span>x<sub>' + (k + 1) + '</sub></span>';
      }
      html += '<select class="mini" data-op="' + ci + '" aria-label="Operador da restrição ' + (ci + 1) + '">' +
        ['<=', '>=', '='].map(function (o) { return '<option value="' + o + '"' + (con.op === o ? ' selected' : '') + '>' + (o === '<=' ? '≤' : o === '>=' ? '≥' : '=') + '</option>'; }).join('') +
        '</select>';
      html += '<input class="coef-in" type="text" inputmode="decimal" aria-label="Lado direito da restrição ' + (ci + 1) + '" data-bi="' + ci + '" value="' + (buildState['b_' + ci] != null ? buildState['b_' + ci] : '10') + '">';
      html += ' <button class="btn btn-sm btn-line" data-delcon="' + ci + '" title="remover" aria-label="Remover restrição">' + ic('x') + '</button>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div style="margin-top:12px"><button class="btn btn-sm btn-soft" id="b-addcon">' + ic('plus') + ' adicionar restrição</button></div>';
    html += '</div>';

    html += '<div class="tac" style="margin-top:18px"><button class="btn btn-primary" id="b-solve">Resolver pelas duas fases ' + ic('play') + '</button></div>';
    html += '<div id="b-out" style="margin-top:20px"></div>';
    b.innerHTML = html;
    wireBuilder();
  }

  function readBuilder() {
    buildState.sense = $('#b-sense').value;
    $$('[data-cj]').forEach(function (el) { buildState['c' + el.dataset.cj] = parseFloat(el.value) || 0; });
    $$('[data-aij]').forEach(function (el) {
      var p = el.dataset.aij.split(','); buildState['a_' + p[0] + '_' + p[1]] = parseFloat(el.value) || 0;
    });
    $$('[data-op]').forEach(function (el) { buildState.constraints[+el.dataset.op].op = el.value; });
    $$('[data-bi]').forEach(function (el) { buildState['b_' + el.dataset.bi] = parseFloat(el.value) || 0; });
  }

  function toProblem() {
    readBuilder();
    var n = buildState.nVars;
    var c = []; for (var j = 0; j < n; j++) c.push(buildState['c' + j] != null ? buildState['c' + j] : 0);
    var cons = buildState.constraints.map(function (con, ci) {
      var a = []; for (var k = 0; k < n; k++) a.push(buildState['a_' + ci + '_' + k] != null ? buildState['a_' + ci + '_' + k] : 0);
      return { a: a, op: con.op, b: buildState['b_' + ci] != null ? buildState['b_' + ci] : 0 };
    });
    return { sense: buildState.sense, c: c, constraints: cons, titulo: 'Problema personalizado' };
  }

  function wireBuilder() {
    $('#b-varplus').addEventListener('click', function () { readBuilder(); if (buildState.nVars < 5) buildState.nVars++; buildUI(); });
    $('#b-varminus').addEventListener('click', function () { readBuilder(); if (buildState.nVars > 1) buildState.nVars--; buildUI(); });
    $('#b-addcon').addEventListener('click', function () { readBuilder(); buildState.constraints.push({ op: '<=' }); buildUI(); });
    $$('[data-delcon]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        readBuilder();
        var ci = +btn.dataset.delcon;
        if (buildState.constraints.length > 1) {
          buildState.constraints.splice(ci, 1);
          // reindexar chaves a_/b_
          var ns = JSON.parse(JSON.stringify(buildState.constraints));
          var clean = { sense: buildState.sense, nVars: buildState.nVars, constraints: ns };
          for (var j = 0; j < buildState.nVars; j++) clean['c' + j] = buildState['c' + j];
          buildState = clean;
        }
        buildUI();
      });
    });
    $('#b-solve').addEventListener('click', function () {
      var prob = toProblem();
      $('#b-out').innerHTML = '<div class="tac muted" style="padding:20px">' + ic('loader', 'spin') + ' Resolvendo…</div>';
      setTimeout(function () {
        $('#b-out').innerHTML = renderProblemHeader(prob) + window.Render.solution(prob);
        $('#b-out').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    });
  }

  /* ---------- Quiz ---------- */
  var quizState = { i: 0, score: 0, answered: false, list: [], answers: [] };
  function startQuiz() {
    // nova sessão: ordem aleatória (essenciais primeiro) + alternativas embaralhadas
    quizState = { i: 0, score: 0, answered: false, list: window.buildQuiz(), answers: [] };
    renderQuiz();
  }
  function renderQuiz() {
    var Q = quizState.list, n = Q.length, q = Q[quizState.i];
    var wrap = $('#quiz-body');
    var pct = Math.round((quizState.i) / n * 100);
    var html = '<div class="quiz-head"><div class="progress"><i style="width:' + pct + '%"></i></div>' +
      '<span class="badge gray">Questão ' + (quizState.i + 1) + ' / ' + n + '</span>' +
      '<span class="badge green">Acertos: ' + quizState.score + '</span></div>';
    html += '<div class="q-card"><div class="q">' + q.q + '</div><div id="opts">';
    q.opts.forEach(function (o, k) {
      html += '<div class="opt" role="button" tabindex="0" aria-label="Alternativa ' + String.fromCharCode(65 + k) + '" data-k="' + k + '"><span class="mark">' + String.fromCharCode(65 + k) + '</span><span>' + o + '</span></div>';
    });
    html += '</div><div class="q-feedback" id="qfb" role="status" aria-live="polite"></div>';
    html += '<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-line btn-sm" id="q-skip">Pular</button>' +
      '<button class="btn btn-primary btn-sm" id="q-next" disabled>Próxima ' + ic('arrow-right') + '</button></div></div>';
    wrap.innerHTML = html;
    quizState.answered = false;

    function choose(opt) {
      if (quizState.answered) return;
      quizState.answered = true;
      var k = +opt.dataset.k;
      quizState.answers[quizState.i] = k;   // registra a resposta para o gabarito final
      var correct = q.correct;
      $$('#opts .opt').forEach(function (o, idx) {
        o.classList.add('disabled'); o.setAttribute('tabindex', '-1');
        if (idx === correct) o.classList.add('correct');
        if (idx === k && k !== correct) o.classList.add('wrong');
        o.querySelector('.mark').innerHTML = idx === correct ? ic('check') : (idx === k ? ic('x') : String.fromCharCode(65 + idx));
      });
      var fb = $('#qfb');
      if (k === correct) { quizState.score++; fb.className = 'q-feedback show right'; fb.innerHTML = '<b>' + ic('check-circle') + ' Correto!</b> ' + q.why; }
      else { fb.className = 'q-feedback show no'; fb.innerHTML = '<b>' + ic('x-circle') + ' Não foi dessa vez.</b> ' + q.why; }
      $('#q-next').disabled = false;
      $('.quiz-head .badge.green').textContent = 'Acertos: ' + quizState.score;
    }

    $$('#opts .opt').forEach(function (opt) {
      opt.addEventListener('click', function () { choose(opt); });
      opt.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(opt); }
      });
    });
    $('#q-skip').addEventListener('click', next);
    $('#q-next').addEventListener('click', next);
  }
  function next() {
    if (quizState.i < quizState.list.length - 1) { quizState.i++; renderQuiz(); }
    else finishQuiz();
  }
  // uma alternativa no gabarito: state = 'correct' | 'wrong' | ''
  function gabOption(text, letter, state) {
    var mark = state === 'correct' ? '✓' : state === 'wrong' ? '✗' : letter;
    return '<div class="opt disabled' + (state ? ' ' + state : '') + '">' +
      '<span class="mark">' + mark + '</span><span>' + text + '</span></div>';
  }

  // gabarito completo: todas as questões, com a resposta certa, a sua resposta e a explicação
  function gabaritoHTML() {
    return quizState.list.map(function (q, idx) {
      var ans = quizState.answers[idx];            // número, ou undefined se pulada
      var skipped = (ans == null);
      var right = (ans === q.correct);
      var letterC = String.fromCharCode(65 + q.correct);
      var opts = q.opts.map(function (o, k) {
        var state = (k === q.correct) ? 'correct' : (k === ans ? 'wrong' : '');
        return gabOption(o, String.fromCharCode(65 + k), state);
      }).join('');
      var status, fbCls;
      if (right) { status = '<b>' + ic('check-circle') + ' Você acertou.</b>'; fbCls = 'right'; }
      else if (skipped) { status = '<b>' + ic('arrow-right') + ' Pulada.</b> Resposta certa: <b>' + letterC + '</b>.'; fbCls = 'no'; }
      else { status = '<b>' + ic('x-circle') + ' Você errou.</b> Resposta certa: <b>' + letterC + '</b>.'; fbCls = 'no'; }
      return '<div class="q-card" style="text-align:left;margin-top:14px">' +
        '<div class="q">' + (idx + 1) + '. ' + q.q + '</div>' +
        '<div>' + opts + '</div>' +
        '<div class="q-feedback show ' + fbCls + '">' + status + ' ' + q.why + '</div>' +
        '</div>';
    }).join('');
  }

  function finishQuiz() {
    var n = quizState.list.length, s = quizState.score;
    var pct = Math.round(s / n * 100);
    var msg = pct >= 80 ? 'Excelente! Você domina o método das duas fases.' :
      pct >= 50 ? 'Bom trabalho! Revise os pontos errados na aba Teoria.' :
        'Vale a pena revisar a Teoria e a Colinha e tentar de novo.';
    var bigIcon = pct >= 80 ? ic('trophy', 'icon-xl') : pct >= 50 ? ic('target', 'icon-xl') : ic('book-open', 'icon-xl');
    var resumo = '<div class="tac card pad-lg">' +
      '<div style="color:var(--primary);margin-bottom:6px">' + bigIcon + '</div>' +
      '<h2>Você acertou ' + s + ' de ' + n + ' (' + pct + '%)</h2><p class="sub">' + msg + '</p>' +
      '<button class="btn btn-primary" id="q-restart">' + ic('repeat') + ' Refazer o quiz</button></div>';
    var gabarito = '<div class="card pad-lg" style="margin-top:18px">' +
      '<div class="kicker">Gabarito completo</div>' +
      '<h3 class="mb0">Revise todas as questões</h3>' +
      gabaritoHTML() +
      '<div class="tac" style="margin-top:18px"><button class="btn btn-primary" id="q-restart2">' + ic('repeat') + ' Refazer o quiz</button></div>' +
      '</div>';
    $('#quiz-body').innerHTML = resumo + gabarito;
    $('#q-restart').addEventListener('click', startQuiz);
    $('#q-restart2').addEventListener('click', startQuiz);
  }

  /* ---------- Init ---------- */
  buildUI();
  startQuiz();
  // prévia automática do problema A na aba resolver
  if ($('#btn-prob-a')) solveOut.innerHTML = '<div class="callout info"><div class="t">' + ic('pointer') + ' Escolha um problema</div>Clique em um dos problemas fixos do enunciado, gere um aleatório ou monte o seu próprio. A resolução completa (Fase 1 + Fase 2) aparecerá aqui.</div>';
})();
