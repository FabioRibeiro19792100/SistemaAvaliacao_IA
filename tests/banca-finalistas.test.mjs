import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../avaliacao.html', import.meta.url), 'utf8');

assert.match(
  app,
  /data-view="finalistas"[\s\S]*?Próxima fase/,
  'A navegação deve ter uma aba para os 15 selecionados.',
);
assert.match(
  app,
  /const target = document\.getElementById\(v === 'finalistas' \? 'view-banca' : 'view-'\+v\)/,
  'A aba dos 15 deve reutilizar exatamente a estrutura visual da Banca dos 80.',
);
assert.match(
  app,
  /banca-finalist-toggle-wrap[\s\S]*?res-primary-rank[\s\S]*?toggleFinalSelection/,
  'O toggle dos 15 deve ficar junto à posição do ranking.',
);
assert.doesNotMatch(
  app,
  /<span>\$\{isFinalist \? 'Selecionado' : 'Selecionar'\}<\/span>/,
  'O toggle dos 15 deve permanecer autoexplicativo, sem texto lateral.',
);
assert.match(
  app,
  /#view-banca \.res-criterion-calc\{font-size:10\.5px;font-weight:600;color:#687386/,
  'A conta ponderada precisa ter tamanho e contraste legíveis na Banca.',
);
assert.match(
  app,
  /function saveFinalSelection[\s\S]*?slice\(0, FINAL_SELECTION_LIMIT\)/,
  'A seleção persistida deve continuar limitada a 15 pessoas.',
);
assert.match(
  app,
  /const presentRows = INSCRICOES[\s\S]*?!isBancaAbsent\(e\.id\)/,
  'A grade e seus indicadores devem usar somente participantes presentes.',
);
assert.match(
  app,
  /const expectedEvaluations = metricRows\.length \* officialReviewers\.length/,
  'O total esperado de avaliações deve ser calculado sobre as linhas efetivamente exibidas.',
);
assert.match(
  app,
  /finalistas_selecionados:/,
  'A seleção dos 15 deve continuar persistida na configuração existente do Supabase.',
);
assert.match(
  app,
  /function bancaCriterionResultHTML[\s\S]*?const contribution = numeric \* \(numericWeight \/ 100\)/,
  'Cada critério da banca deve calcular a própria contribuição ponderada.',
);
assert.match(
  app,
  /\$\{scoreLabel\} × \$\{weightLabel\}% = \$\{contributionLabel\}/,
  'Cada célula de critério deve mostrar nota, peso e contribuição.',
);
assert.match(
  app,
  /Soma das contribuições ponderadas/,
  'A nota geral completa deve explicar que soma as contribuições ponderadas.',
);

console.log('Seleção dos 15 integrada à grade real da banca.');
