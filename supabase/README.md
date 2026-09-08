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
