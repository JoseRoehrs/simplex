/* ============================================================
   Problemas fixos (do enunciado) + gerador de problemas aleatórios
   ============================================================ */
(function (global) {
  "use strict";

  // ---- Problemas FIXOS do print (SILVA) ----
  var FIXED = {
    s7: {
      id: 's7',
      titulo: 'Problema (ANDRADE — adaptado) (Semana 7)',
      sense: 'max',
      c: [2, -3, 5],
      constraints: [
        { a: [2, -1, 3], op: '=', b: 12 },
        { a: [1, 2, 0], op: '=', b: 6 },
        { a: [3, -1, 2], op: '<=', b: 7 }
      ],
      nota: 'Maximização com duas restrições "=" (cada uma gera artificial) e uma "≤" (folga). As igualdades obrigam a Fase 1; note o coeficiente negativo (−3x₂) no objetivo.'
    },
    s8a: {
      id: 's8a',
      titulo: 'Problema (a) — MOREIRA (Semana 8)',
      sense: 'max',
      c: [2, 7],
      constraints: [
        { a: [3, 2], op: '>=', b: 20 },
        { a: [4, 4], op: '=', b: 32 }
      ],
      nota: 'Maximização com uma restrição "≥" (excesso + artificial) e uma "=" (artificial). As duas exigem a Fase 1.'
    },
    s8b: {
      id: 's8b',
      titulo: 'Problema (b) — SILVA (Semana 8)',
      sense: 'max',
      c: [1, 1, 1],
      constraints: [
        { a: [2, 1, -1], op: '<=', b: 10 },
        { a: [1, 1, 2], op: '>=', b: 20 },
        { a: [2, 1, 3], op: '=', b: 60 }
      ],
      nota: 'Mistura os três tipos de restrição: "≤" (folga), "≥" (excesso + artificial) e "=" (artificial). Caso completo das duas fases.'
    },
    s9: {
      id: 's9',
      titulo: 'Problema (a) — SILVA (Semana 9)',
      sense: 'min',
      c: [3, 2],
      constraints: [
        { a: [2, 1], op: '>=', b: 10 },
        { a: [1, 5], op: '>=', b: 15 }
      ],
      nota: 'Minimização com duas restrições "≥": ambas geram excesso + artificial, então as duas fases são obrigatórias.'
    },
    a: {
      id: 'a',
      titulo: 'Problema (a) — SILVA',
      sense: 'max',
      c: [1, 2, 1],
      constraints: [
        { a: [2, 3, 1], op: '>=', b: 10 },
        { a: [4, 1, 2], op: '>=', b: 20 }
      ],
      nota: 'Maximização com duas restrições de "maior ou igual". Ótimo para ver as artificiais em ação… e uma surpresa no final!'
    },
    b: {
      id: 'b',
      titulo: 'Problema (b) — SILVA',
      sense: 'min',
      c: [2, 4, 10],
      constraints: [
        { a: [1, 1, 1], op: '<=', b: 120 },
        { a: [1, 2, 5], op: '>=', b: 30 }
      ],
      nota: 'Minimização com uma restrição "≤" (gera folga) e uma "≥" (gera excesso + artificial). Mistura os dois mundos.'
    }
  };

  // pseudo-aleatório (Math.random é ok no navegador)
  function ri(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }

  // gerar problema que EXIGE duas fases (pelo menos uma restrição >= ou =)
  // e que tenha solução ótima finita (evita ilimitado/inviável por padrão).
  function generate(opts) {
    opts = opts || {};
    var nVars = opts.nVars || pick([2, 3]);
    var nCons = opts.nCons || pick([2, 3]);
    var tries = 0;

    while (tries++ < 400) {
      var sense = opts.sense || pick(['max', 'min']);
      var c = [];
      for (var j = 0; j < nVars; j++) c.push(ri(1, 9));

      var cons = [];
      var ops;
      // garante ao menos uma >= (para ter artificial / duas fases)
      // para MAX: limitamos com pelo menos uma <= para evitar ilimitado
      if (sense === 'max') {
        ops = ['<=', '>='];
      } else {
        ops = ['<=', '>=', '>='];
      }
      var hasGE = false, hasLE = false;
      for (var i = 0; i < nCons; i++) {
        var op;
        if (i === 0) op = '>=';            // força artificial
        else if (i === 1 && sense === 'max') op = '<=';  // limita para max
        else op = pick(ops);
        if (op === '>=') hasGE = true;
        if (op === '<=') hasLE = true;
        var a = [];
        for (var k = 0; k < nVars; k++) a.push(ri(1, 6));
        var b = op === '<=' ? ri(20, 60) : ri(8, 30);
        cons.push({ a: a, op: op, b: b });
      }
      if (!hasGE) continue;
      if (sense === 'max' && !hasLE) continue;

      var prob = { sense: sense, c: c, constraints: cons, gerado: true };
      var res = global.Simplex.twoPhase(prob);
      if (res.status === 'optimal') {
        prob.titulo = 'Problema gerado (' + (sense === 'max' ? 'Maximização' : 'Minimização') + ')';
        prob._solved = res;
        return prob;
      }
    }
    // fallback: devolve um problema simples conhecido
    return {
      sense: 'min', c: [2, 3], titulo: 'Problema gerado',
      constraints: [{ a: [1, 1], op: '>=', b: 6 }, { a: [1, 2], op: '>=', b: 8 }], gerado: true
    };
  }

  // formata o problema como texto bonito (HTML)
  function pretty(problem) {
    var sense = problem.sense === 'max' ? 'Maximizar' : 'Minimizar';
    function term(coef, j, first) {
      var sub = '<sub>' + (j + 1) + '</sub>';
      var sign = coef < 0 ? ' − ' : (first ? '' : ' + ');
      var val = Math.abs(coef);
      var num = (val === 1 ? '' : val);
      return sign + num + 'x' + sub;
    }
    var obj = '';
    problem.c.forEach(function (coef, j) { obj += term(coef, j, j === 0); });
    var lines = ['<span class="op">' + sense + '</span> Z = ' + obj];
    problem.constraints.forEach(function (con, i) {
      var lhs = '';
      con.a.forEach(function (coef, j) { lhs += term(coef, j, j === 0); });
      var op = con.op === '<=' ? '≤' : con.op === '>=' ? '≥' : '=';
      lines.push((i === 0 ? 'sujeito a&nbsp;&nbsp; ' : '<span style="opacity:0">sujeito a</span>&nbsp;&nbsp; ') + lhs + ' <span class="op">' + op + '</span> ' + con.b);
    });
    var nn = [];
    for (var j = 0; j < problem.c.length; j++) nn.push('x<sub>' + (j + 1) + '</sub>');
    lines.push('<span style="opacity:0">sujeito a</span>&nbsp;&nbsp; ' + nn.join(', ') + ' <span class="op">≥</span> 0');
    return lines.map(function (l) { return '<div class="ln">' + l + '</div>'; }).join('');
  }

  global.Problems = { FIXED: FIXED, generate: generate, pretty: pretty };
})(typeof window !== 'undefined' ? window : globalThis);
