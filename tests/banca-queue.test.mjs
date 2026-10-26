import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../avaliacao.html', import.meta.url), 'utf8');

assert.doesNotMatch(
  app,
  /content:\s*["']GO\\A UP["']/,
  'A Banca dos 80 não pode exibir o logo textual do GoUp.',
);

assert.doesNotMatch(
  app,
  /CRITERIOS_BANCA_80/,
  'A mudança não deve criar uma estrutura paralela de critérios nem remover posições existentes.',
);
assert.match(
  app,
  /grade_banca:\s*\{\s*label:'Grade da banca · 3 critérios',\s*criterios:CRITERIOS_ORIGINAIS\s*\}/,
  'A Banca dos 80 deve preservar a estrutura original de três critérios.',
);
assert.match(
  app,
  /const BANCA_FINAL_WEIGHTS = Object\.freeze\(\[20,45,35\]\)/,
  'A composição final da Banca dos 80 deve usar 20% de Marca Empregadora, 45% de Criatividade e 35% de Uso de IA.',
);
assert.match(
  app,
  /function bancaReviewerCriterionIndexes\([\s\S]*?!bancaCriterionComesFromSpreadsheet/,
  'Marca Empregadora deve ficar fora da ficha preenchida pelos pareceristas.',
);
assert.match(
  app,
  /function bancaCriterionDisplayName\([\s\S]*?return 'Marca Empregadora'/,
  'A primeira posição da estrutura deve ser apresentada como Marca Empregadora na Banca dos 80.',
);
assert.match(
  app,
  /Pendente da planilha/,
  'A tela de resultados deve indicar quando a nota de Marca Empregadora ainda não chegou pela planilha.',
);
assert.doesNotMatch(
  app,
  /Composição da nota:<\/strong>|Composição desta etapa:<\/strong>/,
  'A ficha do parecerista não deve exibir informações administrativas sobre a composição da nota.',
);
assert.match(
  app,
  /\$\{bancaReviewerBootMode \? '' : `<span class="criterio-peso">Peso /,
  'A ficha da Banca deve ocultar os pesos dos critérios para o parecerista.',
);
assert.match(
  app,
  /Composição da nota final: Criatividade 45%, Uso de IA 35% e Marca Empregadora 20% \(importada por planilha\)/,
  'A composição completa da nota deve permanecer apenas na tela administrativa da Banca dos 80.',
);
assert.match(
  app,
  /function bancaEmployerBrandScore\([\s\S]*?BANCA_EMPLOYER_BRAND_COLUMNS/,
  'A nota final deve estar preparada para ler Marca Empregadora da planilha.',
);
assert.match(
  app,
  /const reviewerScoresReady = reviewerIndexes\.length > 0 && reviewerIndexes\.every\([\s\S]*?const total = reviewerScoresReady[\s\S]*?availableIndexes\.reduce/,
  'A nota geral deve calcular a contribuição parcial de Criatividade e Uso de IA antes da planilha.',
);
assert.match(
  app,
  /Parcial · \$\{formatCriterionWeight\(metrics\.availableWeight\)\}% da nota/,
  'A tela deve identificar quando a nota geral ainda representa somente os 80% avaliados pela banca.',
);
assert.match(
  app,
  /id="bancaReviewerIsTest"/,
  'O cadastro da Banca dos 80 deve oferecer a opção de parecerista de teste.',
);
assert.match(
  app,
  /is_teste:\s*isTest/,
  'O marcador de parecerista de teste deve ser persistido na tabela da banca.',
);
assert.match(
  app,
  /function officialBancaPareceristas\(\)[\s\S]*?!reviewer\.isTest/,
  'As métricas da banca devem separar pareceristas oficiais dos pareceristas de teste.',
);
assert.match(
  app,
  /const officialReviewers = officialBancaPareceristas\(\);[\s\S]*?const completed = officialReviewers\.map/,
  'As notas agregadas devem considerar somente pareceristas oficiais.',
);
assert.match(
  app,
  /isTest:\s*!!row\.is_teste/,
  'O estado carregado do Supabase deve preservar o marcador de teste.',
);


const queueStart = app.indexOf('function renderReviewerEvaluationQueue(');
const queueEnd = app.indexOf('\nfunction alinharAberturaAvaliacao(', queueStart);
assert.notEqual(queueStart, -1, 'A renderização da fila da banca deve existir.');
assert.notEqual(queueEnd, -1, 'A renderização da fila da banca deve ter limite identificável.');
const queueRenderer = app.slice(queueStart, queueEnd);

assert.doesNotMatch(
  queueRenderer,
  /reviewer-queue-code|padStart\(2/,
  'A fila não deve exibir posição ou numeração antes do nome.',
);

assert.doesNotMatch(
  app,
  /As informações abaixo vêm exclusivamente dos formulários do workshop|Consulte cada etapa separadamente|Entrega principal|Protótipo ainda não enviado/,
  'A ficha da banca não deve exibir textos introdutórios redundantes.',
);

for (const label of ['Cidade / UF', 'Gênero', 'Universidade', 'Idade', 'Observação (opcional)']) {
  assert.ok(app.includes(label), `A ficha da banca deve exibir ${label}.`);
}

const workshopEvidenceStart = app.indexOf('function workshopEvidenceHTML(');
const workshopEvidenceEnd = app.indexOf('\nasync function appendWorkshopEvidence(', workshopEvidenceStart);
assert.notEqual(workshopEvidenceStart, -1, 'A renderização das entregas do workshop deve existir.');
assert.notEqual(workshopEvidenceEnd, -1, 'A renderização das entregas precisa ter limite identificável.');
const workshopEvidenceRenderer = app.slice(workshopEvidenceStart, workshopEvidenceEnd);
assert.doesNotMatch(
  workshopEvidenceRenderer,
  /<details[^>]*\sopen(?:\s|>)/,
  'As entregas avaliadas pela banca devem iniciar recolhidas.',
);
assert.match(
  workshopEvidenceRenderer,
  /filter\(response => \['fase1','fase2'\]\.includes\(response\.activity\)\)/,
  'O Check-in não deve aparecer na ficha da Banca dos 80.',
);
assert.match(app, /fase1:\{ title:'Concepção do teaser' \}/, 'A Banca deve nomear a primeira entrega pelo seu conteúdo.');
assert.match(app, /fase2:\{ title:'Construção do protótipo' \}/, 'A Banca deve nomear a segunda entrega pelo seu conteúdo.');
assert.match(app, /Abrir link do protótipo/, 'O link do protótipo deve ficar em evidência na ficha da Banca.');
assert.match(
  app,
  /workshop-artifact-pending[^\n]*Aguardando envio/,
  'A ficha deve reservar o espaço do protótipo mesmo antes de o link ser enviado.',
);
assert.match(
  app,
  /banca-evaluation-mode\.reviewer-direct-mode #layoutSplit[^}]*parecer-box textarea\{[^}]*height:160px[^}]*min-height:160px/,
  'O campo de observação da Banca deve aproveitar melhor a altura disponível.',
);
assert.match(
  app,
  /\.workshop-review-meta dd\{[^}]*font-size:14px[^}]*font-weight:650/,
  'Os valores de cidade, gênero, universidade e idade devem ter leitura destacada.',
);

const orderingStart = app.indexOf('function getAtribVisiveisNoPortal(');
const orderingEnd = app.indexOf('\nfunction getDoneByParecerista(', orderingStart);
assert.notEqual(orderingStart, -1, 'A ordenação da fila deve existir.');
assert.notEqual(orderingEnd, -1, 'A ordenação da fila deve ter limite identificável.');
const ordering = app.slice(orderingStart, orderingEnd);

assert.match(
  ordering,
  /displayPersonName\(a\?\.lider\)\.localeCompare\([\s\S]*displayPersonName\(b\?\.lider\)[\s\S]*'pt-BR'/,
  'A fila deve ser ordenada alfabeticamente pelo nome do participante.',
);

console.log('Fila da banca sem numeração e em ordem alfabética.');
