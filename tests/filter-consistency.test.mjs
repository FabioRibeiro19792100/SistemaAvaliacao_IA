import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../avaliacao.html', import.meta.url), 'utf8');

for (const id of ['resFiltroRegiao', 'resFiltroUf', 'resFiltroGenero', 'resFiltroRaca', 'resFiltroInstituicao']) {
  assert.match(app, new RegExp(`id="${id}"`), `Resultados deve manter o filtro ${id}.`);
}

for (const id of ['bancaFiltroRegiao', 'bancaFiltroUf', 'bancaFiltroGenero', 'bancaFiltroRaca', 'bancaFiltroInstituicao']) {
  assert.match(app, new RegExp(`id="${id}"`), `Banca e próxima fase devem manter o filtro ${id}.`);
}

assert.match(app, /if \(regiao && regionFromUf\(e\.uf\) !== regiao\) return false;/, 'O filtro de região deve ser aplicado às listas.');
assert.match(app, /id="dashFiltroRegiao"/, 'A lista do Dashboard deve oferecer filtro por região.');
assert.match(app, /function exportBancaFinalistsXlsx\(\)[\s\S]*?maratona-ia-15-selecionados\.xlsx/, 'A próxima fase deve exportar os 15 selecionados em Excel.');
assert.match(app, /if \(bancaViewMode === 'finalistas'\) \{[\s\S]*?body\.innerHTML = bancaSelectedProfileHTML\(\);[\s\S]*?return;/, 'O drawer da próxima fase deve mostrar somente o perfil dos selecionados.');

console.log('Filtros compartilhados e exportação da próxima fase validados.');
