import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../avaliador-maratona.html', import.meta.url), 'utf8');

assert.match(app, /if \(ins && !inicioAvaliacaoPorInscricao\.has\(ins\.id\)\) inicioAvaliacaoPorInscricao\.set/);
assert.match(app, /if \(tipo === "video"\) videosAbertos\.add\(ins\.id\)/);
assert.doesNotMatch(app, /videosConcluidos|video_concluido|elemento\.addEventListener\("ended"/);
assert.doesNotMatch(app, /Aguarde mais \$\{restante\}/);
assert.match(app, /O tempo de avaliação registrado é menor que a duração do vídeo da candidatura/);
assert.match(app, /É preciso assistir ao vídeo para completar a avaliação\./);
assert.ok(
  app.indexOf("const bloqueio = validarTempoEVideo(ins)") < app.indexOf('if (!completo()){ $("#modal-incompleta").showModal(); return; }'),
  "a validação do vídeo deve ocorrer antes da validação das notas"
);
assert.match(app, /\$\("#modal-bloqueio"\)\.showModal\(\)/);
assert.doesNotMatch(app, /eu\?\.isTest \? fila\.length - 1 : primeiraPendente/);
assert.match(app, /video_aberto:videosAbertos\.has\(ins\.id\)/);
assert.match(app, /if \(atualInscricao && ix !== atual && !minhas\[atualInscricao\.id\]\)[\s\S]*?inicioAvaliacaoPorInscricao\.delete/);

console.log('Fluxo sequencial e acompanhamento do vídeo verificados.');
