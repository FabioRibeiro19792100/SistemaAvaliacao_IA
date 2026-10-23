# Workshop Maratona IA 2026

O workshop usa as páginas `workshop.html` (participantes) e `workshop-admin.html` (liberação das atividades). Ele não reutiliza as tabelas de avaliação: as respostas ficam em tabelas próprias e não interferem no ranking.

## Preparação obrigatória antes do uso público

1. Execute `supabase/migrations/20261021_add_workshop_forms.sql` no SQL Editor do projeto Supabase.
2. Em **Vercel > Settings > Environment Variables**, crie:
   - `SUPABASE_URL`: URL do projeto Supabase (o endpoint também aceita a `VITE_SUPABASE_URL` já existente);
   - `SUPABASE_SECRET_KEY`: chave secreta do Supabase, somente no servidor (o endpoint também aceita a chave legada `SUPABASE_SERVICE_ROLE_KEY`);
   - `WORKSHOP_SESSION_SECRET`: segredo aleatório longo e diferente do anterior;
   - `WORKSHOP_ADMIN_KEY`: senha exigida para liberar ou fechar uma atividade;
   - `WORKSHOP_ENVIRONMENT`: `homolog` em testes e `producao` no ambiente público.
3. Faça novo deploy após configurar as variáveis.
4. Cadastre os 80 participantes na tabela `workshop_participantes`, com `inscricao_id_externo`, nome, e-mail da inscrição e ano de nascimento. O endpoint aceita a ação administrativa `provision`.

## Segurança e experiência

- A pessoa entra usando o e-mail da inscrição e escolhe o ano de nascimento entre cinco alternativas embaralhadas. Não há uso de CPF no fluxo.
- A atividade aberta é a única exibida. As outras não são mencionadas antes de serem liberadas.
- Não há rascunho: cada atividade é enviada uma única vez.
- O administrador pode abrir `Check-in`, `Desafio criativo`, `Construção do protótipo` ou fechar tudo. A página mostra o número de envios por atividade.
