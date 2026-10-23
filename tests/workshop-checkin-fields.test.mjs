import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const participant = fs.readFileSync(new URL('../workshop.html', import.meta.url), 'utf8');
const admin = fs.readFileSync(new URL('../workshop-admin.html', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../api/workshop.js', import.meta.url), 'utf8');
const evaluation = fs.readFileSync(new URL('../avaliacao.html', import.meta.url), 'utf8');

test('o Check-in mantém somente a pergunta comportamental 1', () => {
  const removedCopy = 'Conte uma experiência em que você aprendeu algo novo ou testou uma solução diferente';

  assert.doesNotMatch(participant, new RegExp(removedCopy));
  assert.doesNotMatch(api, new RegExp(removedCopy));
  assert.doesNotMatch(admin, /Aprendizado com tecnologia/);
  assert.match(evaluation, /checkin:\[\{ title:'Perguntas comportamentais', ids:\['q1'\] \}\]/);
});
