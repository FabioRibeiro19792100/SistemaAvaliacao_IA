import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../avaliacao.html', import.meta.url), 'utf8');
const finalistsTemplate = new URL('../templates/lista_15_selecionados_modelo.xlsx', import.meta.url);

for (const id of ['resFiltroRegiao', 'resFiltroUf', 'resFiltroGenero', 'resFiltroRaca', 'resFiltroInstituicao']) {
  assert.match(app, new RegExp(`id="${id}"`), `Resultados deve manter o filtro ${id}.`);
}

for (const id of ['bancaFiltroRegiao', 'bancaFiltroUf', 'bancaFiltroGenero', 'bancaFiltroRaca', 'bancaFiltroInstituicao']) {
  assert.match(app, new RegExp(`id="${id}"`), `Banca e próxima fase devem manter o filtro ${id}.`);
}

assert.match(app, /if \(regiao && regionFromUf\(e\.uf\) !== regiao\) return false;/, 'O filtro de região deve ser aplicado às listas.');
assert.match(app, /id="dashFiltroRegiao"/, 'A lista do Dashboard deve oferecer filtro por região.');
assert.match(app, /function exportBancaFinalistsXlsx\(\)[\s\S]*?maratona-ia-15-selecionados\.xlsx/, 'A próxima fase deve exportar os 15 selecionados em Excel.');
const finalistsExport = app.slice(app.indexOf('function exportBancaFinalistsXlsx()'), app.indexOf('function renderBanca()'));
assert.doesNotMatch(finalistsExport, /['"]NOTA|Nota geral|definition\.criterios/, 'O Excel dos 15 não deve levar notas ou critérios de avaliação.');
assert.match(finalistsExport, /toLocaleUpperCase\('pt-BR'\)/, 'Os textos do Excel dos 15 devem ser normalizados em maiúsculas.');
assert.ok(fs.existsSync(finalistsTemplate), 'A exportação dos 15 deve usar uma planilha-modelo formatada.');
assert.match(app, /vendor\/jszip\.min\.js/, 'A página deve carregar o recurso que preenche o modelo sem perder a formatação.');
assert.match(finalistsExport, /templates\/lista_15_selecionados_modelo\.xlsx/, 'A exportação deve partir do modelo visual da lista dos 15.');
assert.match(finalistsExport, /xl\/worksheets\/sheet1\.xml/, 'A exportação deve preservar o arquivo e alterar somente os dados da planilha-modelo.');
assert.match(app, /function exportDashboardCSV\(\)[\s\S]*?toLocaleUpperCase\('pt-BR'\)/, 'O CSV do Dashboard também deve normalizar os textos em maiúsculas.');
assert.match(app, /if \(bancaViewMode === 'finalistas'\) \{[\s\S]*?body\.innerHTML = bancaSelectedProfileHTML\(\);[\s\S]*?return;/, 'O drawer da próxima fase deve mostrar somente o perfil dos selecionados.');
assert.doesNotMatch(app, /Mesma grade da Banca dos 80/, 'A próxima fase não deve exibir explicação redundante sobre a grade.');
assert.match(app, /:is\(#view-resultados,#view-banca\) \.admin-grid-head[\s\S]*?:is\(#view-resultados,#view-banca\) \.results-top-sticky[\s\S]*?:is\(#view-resultados,#view-banca\) > div > \.tbl-card/, 'Resultados, Banca e Próxima fase devem compartilhar a mesma geometria de cabeçalho, filtros e grade.');

console.log('Filtros compartilhados e exportação da próxima fase validados.');
