alter table if exists configuracoes_sistema
  add column if not exists finalistas_selecionados jsonb not null default '[]'::jsonb;

comment on column configuracoes_sistema.finalistas_selecionados is
  'IDs externos das até 15 pessoas escolhidas dentre o corte de 80, separados por ambiente.';
