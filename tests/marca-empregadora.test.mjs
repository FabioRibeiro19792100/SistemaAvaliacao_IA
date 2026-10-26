import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const handler = require('../api/marca-empregadora.js');

const csv = [
  'Avaliação de Marca Empregadora',
  '',
  'Ordem,ID,Candidato(a),E-mail,Cidade / UF,Gênero,Universidade,Resposta do Check-in,Marca Empregadora,Observação',
  '1,285,Ana,ana@example.com,Rio,Feminino,UFRJ,"Resposta com, vírgula\ne quebra de linha",2,"Boa, objetiva"',
  '2,170,Bia,bia@example.com,São Paulo,Feminino,USP,Resposta,4,',
  '3,999,Caio,caio@example.com,Recife,Masculino,UFPE,Resposta,8,Inválida',
].join('\n');

assert.deepEqual(handler.extractScores(csv), [
  { id:'285', score:2, observation:'Boa, objetiva' },
  { id:'170', score:4, observation:'' },
]);

const originalFetch = globalThis.fetch;
globalThis.fetch = async () => ({ ok:true, status:200, text:async () => csv });

let statusCode = null;
let responseBody = null;
const headers = {};
await handler(
  { method:'GET' },
  {
    setHeader(name, value) { headers[name] = value; },
    status(value) { statusCode = value; return this; },
    json(value) { responseBody = value; return this; },
  },
);

globalThis.fetch = originalFetch;
assert.equal(statusCode, 200);
assert.equal(responseBody.count, 2);
assert.equal(responseBody.spreadsheetId, '12NzUJ2SotZnZnZMu8nymi_RQpxxLN97KW_Op5cnSaFo');
assert.match(headers['Cache-Control'], /s-maxage=60/);
