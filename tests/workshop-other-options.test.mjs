import assert from 'node:assert/strict';
import fs from 'node:fs';

const form = fs.readFileSync(new URL('../workshop.html', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../api/workshop.js', import.meta.url), 'utf8');

assert.match(
  form,
  /other:"Outra ferramenta", otherLabel:"Outra ferramenta \(especifique\)"/,
  'A opção complementar de ferramentas deve enviar o valor aceito pela API.',
);
assert.match(
  form,
  /other:"Outro", otherLabel:"Outro \(especifique com suas palavras\)"/,
  'A pergunta 5 deve enviar o valor canônico de Outra limitação.',
);
assert.match(
  form,
  /value="\$\{E\(option\.value\)\}"[\s\S]*?<span>\$\{E\(option\.label\)\}<\/span>/,
  'O formulário deve separar o texto exibido do valor enviado.',
);
assert.match(form, /value === "Outra ferramenta \(especifique\)" \? "Outra ferramenta"/);
assert.match(form, /value === "Outro \(especifique com suas palavras\)" \? "Outro"/);

for (const [option, field] of [['Outra ferramenta', 'q2_other'], ['Outro', 'q5_other']]) {
  assert.match(
    api,
    new RegExp(`other:\\{ option:'${option}', field:'${field}'`),
    `A API deve aceitar e validar a opção complementar ${option}.`,
  );
}
assert.match(
  api,
  /if \(field\.other && Array\.isArray\(value\) && value\.includes\(field\.other\.option\)\)/,
  'A validação de campos complementares deve ser genérica para qualquer pergunta.',
);

assert.doesNotMatch(
  api,
  /clear-(?:all-responses|test-response|response)/,
  'A rota destrutiva temporária de limpeza não pode permanecer publicada.',
);

console.log('Opções complementares do workshop alinhadas entre formulário e API.');
