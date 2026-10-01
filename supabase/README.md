# Supabase — avaliação da Maratona IA

Este schema pertence somente ao sistema de avaliação da Maratona IA. Ele não altera o banco do PPA nem o banco que recebe as inscrições.

## Quando criar

Crie um projeto Supabase novo e vazio quando a interface local estiver aprovada. No SQL Editor desse novo projeto, execute `schema.sql` uma única vez e, em seguida, os arquivos de `migrations/` em ordem cronológica. Depois informe a Project URL e a Public/Anon Key na tela **Configurações** da avaliação.

## Separação dos dados

- O arquivo de inscrições continua sendo uma entrada independente.
- O sistema de avaliação importa uma cópia dos registros enviados.
- Pareceristas, atribuições, notas, pareceres e auditoria ficam neste projeto exclusivo.
- Os ambientes `homolog` e `producao` continuam separados pela coluna `environment`, como no PPA.

## Critérios iniciais

O schema nasce com os três critérios da Maratona IA e pesos de 33,33%, 33,33% e 33,34%.

## Proteção das avaliações

O arquivo `migrations/20260927_protect_evaluation_data.sql` deve ser aplicado antes do uso real. Ele:

- bloqueia `DELETE` público em `avaliacoes` e `avaliacao_criterios`;
- mantém o salvamento transacional pela função `salvar_avaliacao_maratona`;
- registra versões anteriores em `avaliacoes_historico` sempre que uma avaliação é alterada;
- preserva um registro recuperável mesmo se uma exclusão administrativa for executada no futuro.

O aplicativo também recusa importação, migração ou limpeza de um ambiente que já contenha avaliações. Para conferir essas proteções localmente, execute:

```sh
node tests/data-safety.test.mjs
```
