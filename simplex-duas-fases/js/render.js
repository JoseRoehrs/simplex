/* ============================================================
   Renderização passo a passo da solução (quadros / tableaux)
   ============================================================ */
(function (global) {
  "use strict";
  var S = global.Simplex;
  function ic(n, c) { return global.ic ? global.ic(n, c) : ''; }

  // número -> fração bonita (estilo livro) quando possível
  function toFrac(x, maxDen) {
    maxDen = maxDen || 999;
    if (!isFinite(x)) return '∞';
    var neg = x < 0; x = Math.abs(x);
    if (Math.abs(x - Math.round(x)) < 1e-9) return (neg ? '−' : '') + Math.round(x);
    var h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
    for (var it = 0; it < 40; it++) {
      var ai = Math.floor(b);
      var h2 = ai * h1 + h0, k2 = ai * k1 + k0;
      if (k2 > maxDen) break;
      h0 = h1; h1 = h2; k0 = k1; k1 = k2;
      if (Math.abs(h1 / k1 - x) < 1e-9) break;
      var den = b - ai; if (Math.abs(den) < 1e-12) break;
      b = 1 / den;
    }
    if (k1 !== 0 && Math.abs(h1 / k1 - x) < 1e-7) return (neg ? '−' : '') + h1 + '/' + k1;
    return (neg ? '−' : '') + (Math.round(x * 1000) / 1000);
  }
  function num(x) { // para banners/resultados (decimal limpo)
    var r = Math.round(x * 1e6) / 1e6;
    return (Math.abs(r) < 1e-9 ? 0 : r);
  }
  function vname(v) { return v.label + '<sub>' + v.sub + '</sub>'; }

  // --- Renderiza UM quadro ---
  function tableau(std, snap, opts) {
    opts = opts || {};
    var vars = std.vars, ncols = std.ncols;
    var artSet = new Set(std.artificialCols);
    var greyArt = !!opts.greyArt; // fase 2: artificiais apagadas
    var piv = snap.pivot; // [row,col] ou undefined
    var entering = snap.entering, leaving = snap.leaving;

    function colCls(j) {
      var c = [];
      if (entering === j) c.push('in-piv-col');
      if (greyArt && artSet.has(j)) c.push('art');
      return c.join(' ');
    }

    var objName = opts.objName || 'Z'; // rótulo da linha de decisão (w na Fase 1, Z na Fase 2)

    var html = '<div class="tableau-wrap"><table class="tableau">';
    html += '<thead>';
    // Quadro CONDENSADO: cabeçalho de uma linha só — Base | variáveis | b | θ.
    // (sem a linha cⱼ, sem a coluna c_B e sem a linha zⱼ — só a linha de decisão no fim.)
    html += '<tr><th class="cb">Base</th>';
    for (var j = 0; j < ncols; j++) {
      html += '<th class="' + colCls(j) + (greyArt && artSet.has(j) ? ' art' : '') + '">' + vname(vars[j]) + '</th>';
    }
    html += '<th>b</th>' + (piv ? '<th>θ</th>' : '') + '</tr>';
    html += '</thead><tbody>';

    // linhas das restrições
    for (var i = 0; i < snap.basis.length; i++) {
      var isPivRow = (leaving === i);
      html += '<tr class="' + (isPivRow ? 'piv-row' : '') + '">';
      html += '<td class="bcol">' + vname(vars[snap.basis[i]]) + '</td>';
      for (var c = 0; c < ncols; c++) {
        var cls = colCls(c);
        if (piv && piv[0] === i && piv[1] === c) cls += ' piv-cell';
        if (greyArt && artSet.has(c)) cls += ' art';
        html += '<td class="' + cls + '">' + toFrac(snap.A[i][c]) + '</td>';
      }
      html += '<td class="bcol">' + toFrac(snap.b[i]) + '</td>';
      if (piv) {
        var r = snap.ratios ? snap.ratios[i] : null;
        var chosen = (leaving === i);
        html += '<td class="ratio">' + (r == null ? '—' : (chosen ? '<b>' + toFrac(r) + '</b> ◄' : toFrac(r))) + '</td>';
      }
      html += '</tr>';
    }
    // única linha de objetivo (linha de decisão / custo reduzido) — fica no lugar de zⱼ e cⱼ−zⱼ.
    // valor negativo = vale a pena trazer aquela variável para a base.
    html += '<tr class="drow"><td class="label-cell" title="Linha de decisão: um valor negativo indica que vale a pena trazer aquela variável para a base.">' + objName + '</td>';
    for (var dd = 0; dd < ncols; dd++) html += '<td class="' + colCls(dd) + (greyArt && artSet.has(dd) ? ' art' : '') + '">' + toFrac(snap.d[dd]) + '</td>';
    html += '<td>' + toFrac(snap.obj) + '</td>' + (piv ? '<td></td>' : '') + '</tr>';

    html += '</tbody></table></div>';
    return html;
  }

  // explicação textual de um passo
  function explain(std, snap, phase, sense) {
    var vars = std.vars;
    if (snap.unbounded) {
      return '<span class="badge rose">ILIMITADO</span> A variável <b>' + vname(vars[snap.entering]) +
        '</b> deveria entrar, mas <b>nenhum</b> coeficiente da sua coluna é positivo. ' +
        'Logo não existe quociente de razão válido — a função objetivo cresce sem limite. <b>Problema ilimitado.</b>';
    }
    if (snap.optimal) {
      var crit = (phase === 1 || sense === 'min') ? 'todos os valores da linha de decisão ≥ 0' : 'todos os valores da linha de decisão ≤ 0';
      var what = phase === 1 ? 'w = ' + toFrac(snap.obj) : 'Z = ' + toFrac(snap.obj);
      return '<span class="badge green">PARADA</span> Critério de otimalidade satisfeito (' + crit + '). ' +
        'Quadro ótimo desta fase com <b>' + what + '</b>.';
    }
    var criterio = (phase === 1) ? 'menor (mais negativo)' : (sense === 'max' ? 'maior (mais positivo)' : 'menor (mais negativo)');
    var enterTxt = '<b>Entra na base:</b> ' + vname(vars[snap.entering]) +
      ' — possui o ' + criterio + ' valor na linha de decisão = <b>' + toFrac(snap.d[snap.entering]) + '</b>.';
    var leaveName = vname(vars[snap.basis[snap.leaving]]);
    var leaveTxt = ' <b>Sai da base:</b> ' + leaveName +
      ' — pelo <b>teste da razão</b> (menor b/coluna positiva = ' + toFrac(snap.b[snap.leaving] / snap.A[snap.leaving][snap.entering]) + ').';
    var pivTxt = ' <b>Elemento pivô:</b> ' + toFrac(snap.pivotValue) + '. Aplicamos o pivoteamento (Gauss–Jordan).';
    return enterTxt + leaveTxt + pivTxt;
  }

  function stepCard(n, title, badgeHtml, std, snap, phase, sense, opts) {
    opts = opts || {};
    opts.objName = phase === 1 ? 'w' : 'Z'; // Fase 1 minimiza w; Fase 2 otimiza Z
    var h = '<div class="step-card">';
    h += '<div class="head"><span class="num">' + n + '</span><strong>' + title + '</strong>' + (badgeHtml || '') + '</div>';
    h += tableau(std, snap, opts);
    h += '<div class="explain">' + explain(std, snap, phase, sense) + '</div>';
    h += '</div>';
    return h;
  }

  // bloco da Forma Padrão (Passo I)
  function standardForm(problem, std) {
    var html = '<div class="card" style="margin-bottom:20px">';
    html += '<div class="kicker">Passo I</div><h3>Escrever na forma padrão</h3>';
    var add = [];
    std.vars.forEach(function (v) {
      if (v.type === 'slack') add.push('<b>folga</b> ' + vname(v));
      if (v.type === 'surplus') add.push('<b>excesso</b> ' + vname(v));
      if (v.type === 'artificial') add.push('<b>artificial</b> ' + vname(v));
    });
    html += '<p class="sub" style="margin-bottom:14px">Cada restrição recebe variáveis auxiliares conforme o seu sinal:</p>';
    html += '<table class="deftable"><thead><tr><th>Restrição original</th><th>Vira (forma padrão)</th><th>Base inicial</th></tr></thead><tbody>';
    var rowCount = 0;
    problem.constraints.forEach(function (con, i) {
      var op = con.op === '<=' ? '≤' : con.op === '>=' ? '≥' : '=';
      var lhs = con.a.map(function (k, j) { return (k === 1 ? '' : k) + 'x<sub>' + (j + 1) + '</sub>'; }).join(' + ');
      var conv = '', base = '';
      if (con.op === '<=') { conv = lhs + ' + folga = ' + con.b; base = 'variável de folga'; }
      else if (con.op === '>=') { conv = lhs + ' − excesso + artificial = ' + con.b; base = 'variável artificial'; }
      else { conv = lhs + ' + artificial = ' + con.b; base = 'variável artificial'; }
      html += '<tr><td class="tag-orig">' + lhs + ' ' + op + ' ' + con.b + '</td><td class="tag-orig">' + conv + '</td><td>' + base + '</td></tr>';
    });
    html += '</tbody></table>';
    var artn = std.artificialCols.length;
    if (artn > 0) {
      html += '<div class="callout warn" style="margin-top:16px"><div class="t">' + ic('warn') + ' Por que precisamos das duas fases?</div>' +
        'Surgiram <b>' + artn + ' variável(is) artificial(is)</b>. Elas não pertencem ao problema real — são apenas um "andaime" para começar com uma base. ' +
        'A <b>Fase 1</b> serve para expulsá-las (zerá-las). Só então a <b>Fase 2</b> otimiza o objetivo verdadeiro.</div>';
    } else {
      html += '<div class="callout ok" style="margin-top:16px"><div class="t">' + ic('check-circle') + ' Sem artificiais</div>Todas as restrições são "≤": a base inicial já é viável (só folgas). Tecnicamente nem precisaria da Fase 1, mas mostramos o caminho completo.</div>';
    }
    html += '</div>';
    return html;
  }

  var legend =
    '<div class="legend">' +
    '<span><i class="sw" style="background:rgba(91,156,255,.45)"></i> coluna que entra (pivô)</span>' +
    '<span><i class="sw" style="background:rgba(245,181,68,.4)"></i> linha que sai</span>' +
    '<span><i class="sw" style="background:linear-gradient(135deg,#7eb6ff,#5b9cff);box-shadow:0 0 8px rgba(91,156,255,.7)"></i> elemento pivô</span>' +
    '<span><i class="sw" style="background:rgba(245,181,68,.4);box-shadow:inset 0 0 0 1px rgba(245,181,68,.6)"></i> θ = teste da razão</span>' +
    '</div>';

  // Glossário do quadro condensado: explica cada símbolo em linguagem simples.
  var headerNote =
    '<div class="callout tip" style="margin-bottom:16px"><div class="t">' + ic('info') +
    ' Como ler o quadro</div>' +
    'Cada <b>linha</b> é uma restrição (na forma padrão) e cada <b>coluna</b> é uma variável. Em cada quadro:' +
    '<ul style="margin:8px 0 0;padding-left:20px;line-height:1.7">' +
    '<li><b>Base</b> — as variáveis que estão na solução agora; as demais valem 0.</li>' +
    '<li><b>b</b> — o valor atual de cada variável da base (o lado direito da linha).</li>' +
    '<li><b>θ</b> — teste da razão (b ÷ coeficiente positivo da coluna que entra). O menor θ decide quem <b>sai</b> da base.</li>' +
    '<li><b>Linha do fim (w ou Z)</b> — a <b>linha de decisão</b>. Um valor <b>negativo</b> ali significa que vale a pena trazer aquela variável para a base; é por ela que se escolhe quem <b>entra</b>. Quando não há mais negativos, o quadro é ótimo.</li>' +
    '</ul>' +
    '<div style="margin-top:8px">As variáveis: <b>x</b> = decisão (as do problema real) · <b>folga</b> entra numa restrição "≤" · ' +
    '<b>excesso</b> numa "≥" · <b>artificial</b> é um andaime temporário que a Fase 1 elimina.</div></div>';

  // --- principal: monta a solução completa ---
  function solution(problem) {
    var res = problem._solved || S.twoPhase(problem);
    var std = res.std;
    var html = '';

    html += standardForm(problem, std);
    html += legend;
    html += headerNote;

    var stepNo = 1;

    // FASE 1
    if (res.phase1) {
      html += '<div class="card" style="margin-bottom:16px;background:var(--amber-l);border-color:rgba(245,181,68,.32)">' +
        '<div class="row-between"><div><span class="badge f1">FASE 1</span> <strong style="font-size:18px"> Encontrar uma solução básica viável</strong></div></div>' +
        '<p class="sub mb0" style="margin-top:8px">Trocamos o objetivo por <b>minimizar w = soma das variáveis artificiais</b>. ' +
        'Se conseguirmos <b>w = 0</b>, as artificiais saíram e temos um ponto de partida legítimo. Critério de parada: toda a linha de decisão ≥ 0.</p></div>';

      res.phase1.steps.forEach(function (snap, k) {
        var last = (k === res.phase1.steps.length - 1);
        var badge = last ? '<span class="badge green">fim da Fase 1</span>' : '<span class="badge f1">iteração ' + (k + 1) + '</span>';
        html += stepCard(stepNo++, 'Fase 1 — Quadro ' + (k + 1), badge, std, snap, 1, 'min', { greyArt: false });
      });

      if (res.status === 'infeasible') {
        html += '<div class="result-banner infeasible"><div class="rb-head">' + ic('ban') + '<h3>Problema INVIÁVEL</h3></div>' +
          '<p>Ao final da Fase 1 sobrou <b>w = ' + toFrac(res.phase1Value) + ' &gt; 0</b>. ' +
          'Não foi possível zerar todas as artificiais — logo <b>não existe</b> nenhuma solução que satisfaça todas as restrições ao mesmo tempo.</p></div>';
        return html;
      }

      html += '<div class="callout tip"><div class="t">' + ic('repeat') + ' Transição Fase 1 → Fase 2</div>' +
        '<b>w = 0</b> alcançado: temos uma solução básica viável! Agora <b>descartamos as colunas artificiais</b> ' +
        '(elas aparecem apagadas), recolocamos a função objetivo <b>original</b> e seguimos para a Fase 2.</div>';
    }

    // FASE 2
    if (res.phase2) {
      html += '<div class="card" style="margin-bottom:16px;background:var(--teal-l);border-color:rgba(45,212,191,.32)">' +
        '<div class="row-between"><div><span class="badge f2">FASE 2</span> <strong style="font-size:18px"> Otimizar o objetivo original</strong></div></div>' +
        '<p class="sub mb0" style="margin-top:8px">Objetivo real: <b>' + (problem.sense === 'max' ? 'maximizar' : 'minimizar') +
        ' Z = ' + problem.c.map(function (c, j) { return (c === 1 ? '' : c) + 'x<sub>' + (j + 1) + '</sub>'; }).join(' + ') + '</b>. ' +
        'Critério de parada: toda a linha de decisão ' + (problem.sense === 'max' ? '≤ 0' : '≥ 0') + '.</p></div>';

      res.phase2.steps.forEach(function (snap, k) {
        var last = (k === res.phase2.steps.length - 1);
        var badge = last ? '<span class="badge green">ótimo</span>' : '<span class="badge f2">iteração ' + (k + 1) + '</span>';
        html += stepCard(stepNo++, 'Fase 2 — Quadro ' + (k + 1), badge, std, snap, 2, problem.sense, { greyArt: true });
      });
    }

    // RESULTADO (Passo IV)
    if (res.status === 'unbounded') {
      html += '<div class="result-banner unbounded"><div class="rb-head">' + ic('infinity') + '<h3>Solução ILIMITADA</h3></div>' +
        '<p>Na Fase 2 surgiu uma coluna candidata a entrar <b>sem nenhum coeficiente positivo</b>: a função objetivo pode crescer indefinidamente. ' +
        'O conjunto viável existe (a Fase 1 achou um ponto), mas <b>não há valor ótimo finito</b>.</p>' +
        '<p style="margin:0"><b>Interpretação do enunciado:</b> as duas restrições são do tipo "≥" (limites inferiores) e o objetivo é de máximo — nada impede as variáveis de crescerem, então Z → +∞.</p></div>';
      return html;
    }

    if (res.status === 'optimal') {
      var sol = res.solution.map(function (v) { return num(v); });
      var solStr = sol.map(function (v, j) { return 'x<sub>' + (j + 1) + '</sub> = ' + v; }).join('&nbsp;&nbsp;');
      html += '<div class="result-banner optimal"><div class="rb-head">' + ic('check-circle') + '<h3>Solução ÓTIMA encontrada</h3></div>' +
        '<p style="margin-bottom:4px">Lendo o quadro final (variáveis básicas = valor de b; não-básicas = 0):</p>' +
        '<div class="vals"><span>' + solStr + '</span><span>Z* = ' + num(res.Z) + '</span></div>' +
        (res.alternateOptima ? '<p style="margin:12px 0 0;display:flex;gap:8px;align-items:flex-start">' + ic('copy') + ' <span><b>Existem soluções ótimas alternativas</b> (uma variável não-básica tem valor 0 na linha de decisão): há um segmento inteiro de pontos com o mesmo Z*.</span></p>' : '') +
        '</div>';

      // verificação (Passo IV)
      html += '<div class="card"><div class="kicker">Passo IV</div><h3>Conferência no modelo original</h3>';
      html += '<table class="deftable"><thead><tr><th>Restrição original</th><th>Substituindo a solução</th><th>OK?</th></tr></thead><tbody>';
      problem.constraints.forEach(function (con) {
        var lhsVal = con.a.reduce(function (acc, k, j) { return acc + k * sol[j]; }, 0);
        var op = con.op === '<=' ? '≤' : con.op === '>=' ? '≥' : '=';
        var ok = con.op === '<=' ? lhsVal <= con.b + 1e-6 : con.op === '>=' ? lhsVal >= con.b - 1e-6 : Math.abs(lhsVal - con.b) < 1e-6;
        var lhsTxt = con.a.map(function (k, j) { return k + '·' + num(sol[j]); }).join(' + ');
        var okMark = ok ? '<span style="color:var(--green)">' + ic('check-circle') + '</span>' : '<span style="color:var(--rose)">' + ic('x-circle') + '</span>';
        html += '<tr><td class="tag-orig">' + con.a.map(function (k, j) { return (k === 1 ? '' : k) + 'x<sub>' + (j + 1) + '</sub>'; }).join(' + ') + ' ' + op + ' ' + con.b +
          '</td><td class="tag-orig">' + lhsTxt + ' = ' + num(lhsVal) + ' ' + op + ' ' + con.b + '</td><td>' + okMark + '</td></tr>';
      });
      var zCheck = problem.c.reduce(function (a, k, j) { return a + k * sol[j]; }, 0);
      html += '<tr><td class="tag-orig"><b>Z = ' + problem.c.map(function (k, j) { return (k === 1 ? '' : k) + 'x<sub>' + (j + 1) + '</sub>'; }).join(' + ') + '</b></td>' +
        '<td class="tag-orig">' + problem.c.map(function (k, j) { return k + '·' + num(sol[j]); }).join(' + ') + ' = <b>' + num(zCheck) + '</b></td><td><span style="color:var(--green)">' + ic('check-circle') + '</span></td></tr>';
      html += '</tbody></table></div>';
    }
    return html;
  }

  global.Render = { solution: solution, tableau: tableau, toFrac: toFrac, num: num };
})(typeof window !== 'undefined' ? window : globalThis);
