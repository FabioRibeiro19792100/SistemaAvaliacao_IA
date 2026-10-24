import assert from 'node:assert/strict';
import fs from 'node:fs';

const participant = fs.readFileSync(new URL('../workshop.html', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../api/workshop.js', import.meta.url), 'utf8');
const admin = fs.readFileSync(new URL('../workshop-admin.html', import.meta.url), 'utf8');
const evaluation = fs.readFileSync(new URL('../avaliacao.html', import.meta.url), 'utf8');

assert.match(participant, /Os campos abaixo estão disponíveis apenas para consulta\./);
assert.match(participant, /Indica pergunta obrigatória\./);
assert.doesNotMatch(participant, /São \$\{reqTotal\} obrigatórias nesta etapa/);
assert.match(participant, /Até 750 caracteres, cerca de 10 a 15 linhas/);
assert.match(participant, /Limite atingido\. Revise o texto para ajustá-lo\./);
assert.match(participant, /Assets da campanha/);
assert.match(participant, /https:\/\/mastertechfiles\.s3\.sa-east-1\.amazonaws\.com\/midia_kv-maratona-ia_2026-10-19_2203\.zip/);
assert.match(participant, /if \(F\.key === "checkin"\)/, 'O download dos assets deve aparecer somente no Check-in.');
assert.match(participant, /ACTIVITY_BY_PATH = \{"\/checkin":"checkin", "\/fase1":"fase1", "\/fase2":"fase2"\}/);
assert.match(admin, /const PUBLIC_FORM_ORIGIN = "https:\/\/www\.miaglobo2026\.space";/);
assert.match(admin, /PUBLIC_FORM_PATHS = \{checkin:"\/checkin", fase1:"\/fase1", fase2:"\/fase2"\}/);
assert.match(
  admin,
  /byKey\("fase1"\)\.qs\.find\(q => q\.id === "q3"\)\.o/,
  'As estatísticas da Fase 2 devem localizar a pergunta de mascote pelo identificador estável.'
);
assert.doesNotMatch(
  admin,
  /byKey\("fase1"\)\.qs\[2\]\.o/,
  'As estatísticas da Fase 2 não devem depender da posição da pergunta de mascote.'
);
assert.match(admin, /Fechar todos os formulários/);
assert.match(admin, /pendingOpenChange = \{all:true, next:false\}/);
assert.match(admin, /if \(change\.all\) FORMS\.forEach\(f => ST\.open\[f\.key\] = false\)/);
assert.match(admin, /activity:change\.next && !change\.all \? change\.k : "fechada"/);

const participantMascot = participant.indexOf('{id:"q3", n:"2", type:"radio"');
const participantCharacter = participant.indexOf('{id:"q2", n:"3", type:"long"');
assert.ok(participantMascot >= 0 && participantCharacter > participantMascot, 'A ordem visual da Fase 1 deve preservar os IDs q3 e q2.');

const apiMascot = api.indexOf("{ id:'q3', label:'2. Qual mascote oficial");
const apiCharacter = api.indexOf("{ id:'q2', label:'3. Qual personagem autoral");
assert.ok(apiMascot >= 0 && apiCharacter > apiMascot, 'A API deve expor a mesma ordem visual sem trocar os IDs persistidos.');

assert.match(admin, /\{id:"q3", n:"2", t:"radio"/);
assert.match(admin, /\{id:"q2", n:"3", t:"long"/);
assert.match(evaluation, /ids:\['q1','q3','q2','q4','q5','q6'\]/);

console.log('Textos e ordem visual dos formulários alinhados sem alterar IDs ou validações.');
