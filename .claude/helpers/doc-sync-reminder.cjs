#!/usr/bin/env node
/**
 * doc-sync-reminder — PostToolUse hook (Write|Edit|MultiEdit).
 *
 * Enforcement da REGRA "Base de Conhecimento (vault docs/)" do CLAUDE.md:
 * quando uma edição toca o SISTEMA (src/** ou supabase/**), injeta UMA vez por
 * sessão um lembrete para atualizar a documentação (CLAUDE.md + vault docs/)
 * antes de concluir a tarefa.
 *
 * Silencioso para edições que NÃO são mudança de sistema (docs/, *.md, .claude/,
 * qualquer coisa fora de src/ e supabase/) — essas não precisam do lembrete.
 *
 * Debounce: 1 lembrete por sessão (flag em os.tmpdir(), por session_id).
 * Falha-aberto: qualquer erro → exit 0 sem atrapalhar a edição.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

(function main() {
  let data = {};
  try {
    data = JSON.parse(readStdin() || '{}');
  } catch {
    process.exit(0);
  }

  const filePath = (data && data.tool_input && data.tool_input.file_path) || '';
  if (!filePath) process.exit(0);

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  let rel = path.isAbsolute(filePath) ? path.relative(projectDir, filePath) : filePath;
  rel = rel.split(path.sep).join('/');

  // Só edições no SISTEMA disparam o lembrete.
  const isSystemChange = rel.startsWith('src/') || rel.startsWith('supabase/');
  if (!isSystemChange) process.exit(0);

  // Debounce: no máximo 1 lembrete por sessão.
  const sessionId = String(data.session_id || 'nosession').replace(/[^a-zA-Z0-9_-]/g, '');
  const flag = path.join(os.tmpdir(), `ppgvet-docsync-${sessionId}.flag`);
  try {
    if (fs.existsSync(flag)) process.exit(0);
    fs.writeFileSync(flag, new Date().toISOString());
  } catch {
    /* se não conseguir gravar o flag, ainda assim lembramos (pior caso: repete) */
  }

  const msg =
    'LEMBRETE — regra "Base de Conhecimento (vault docs/)" do CLAUDE.md: esta sessão ' +
    'alterou o SISTEMA (' + rel + '). DEFINIÇÃO DE PRONTO: antes de concluir a tarefa, ' +
    'atualize a documentação do que mudou — a seção REGRA DE OURO correspondente no ' +
    'CLAUDE.md E/OU o mapa do domínio no vault docs/ (ponto de entrada docs/Início.md), ' +
    'seguindo a tabela "mudou X → atualize Y". Se ainda não consultou o mapa do domínio ' +
    'antes de implementar, faça agora. Ao finalizar, declare explicitamente quais docs ' +
    'foram atualizadas (ou por que nenhuma precisou — ex.: refactor sem mudança de comportamento).';

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: msg,
      },
    })
  );
  process.exit(0);
})();
