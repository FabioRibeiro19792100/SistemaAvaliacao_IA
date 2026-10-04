import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../avaliacao.html', import.meta.url), 'utf8');
const reviewerApp = fs.readFileSync(new URL('../avaliador-maratona.html', import.meta.url), 'utf8');
const schema = fs.readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const migration = fs.readFileSync(
  new URL('../supabase/migrations/20260927_protect_evaluation_data.sql', import.meta.url),
  'utf8',
);

assert.doesNotMatch(
  app,
  /deleteRemoteEvaluation(?:Pair|sByReviewer)/,
  'Avaliações não podem ser apagadas ao remover pareceristas ou atribuições.',
);

assert.doesNotMatch(
  reviewerApp,
  /salvarAvaliacaoFallback|RPC transacional ainda não disponível/,
  'O portal não pode voltar à gravação parcial quando a transação falhar.',
);
assert.match(
  reviewerApp,
  /O salvamento transacional falhou/,
  'Falhas na RPC devem interromper o salvamento sem gravar dados parciais.',
);

const clearFunction = app.match(
  /async function clearRemoteEnvironmentData\(\) \{[\s\S]*?\n\}/,
)?.[0] || '';
assert.ok(clearFunction, 'A limpeza remota precisa continuar centralizada.');
assert.match(
  clearFunction,
  /await assertRemoteEnvironmentHasNoEvaluations\(client\);[\s\S]*?from\('avaliacoes'\)\.delete/,
  'A limpeza precisa conferir a ausência de avaliações antes de qualquer DELETE.',
);

assert.match(
  app,
  /Math\.max\(NUM_PARECERES_POR_EQUIPE, pareceristasDaInscricao\.length\)/,
  'O painel deve manter o total esperado de pareceres.',
);

assert.match(
  app,
  /function isTestEvaluation\(parId, inscId\)[\s\S]*?typeof evaluation\?\.isTest === 'boolean'/,
  'A estatística deve respeitar a marca de teste gravada em cada avaliação.',
);
assert.match(
  app,
  /const officialCompletedTotal =[\s\S]*?!isTestEvaluation\(parId, inscId\)/,
  'O percentual oficial não pode incluir avaliações de teste.',
);
assert.match(
  app,
  /\.filter\(r => !isTestAuditRow\(r\)\)/,
  'A Auditoria não deve exibir registros de teste nas métricas oficiais.',
);

for (const sql of [schema, migration]) {
  assert.doesNotMatch(
    sql,
    /create policy "prototype full access avaliacoes"/,
    'A tabela de avaliações não pode ter política pública para todas as operações.',
  );
  assert.doesNotMatch(
    sql,
    /create policy "prototype full access avaliacao_criterios"/,
    'Os critérios não podem ter política pública para todas as operações.',
  );
  assert.match(sql, /create policy "evaluation read access"/);
  assert.match(sql, /create policy "evaluation insert access"/);
  assert.match(sql, /create policy "evaluation update access"/);
  assert.match(sql, /registrar_historico_avaliacao/);
}

assert.match(
  migration,
  /alter function public\.salvar_avaliacao_maratona\([\s\S]*?\) security definer;/,
  'A RPC atômica deve continuar autorizada a substituir critérios dentro da transação.',
);

console.log('Proteções contra perda de avaliações verificadas.');
