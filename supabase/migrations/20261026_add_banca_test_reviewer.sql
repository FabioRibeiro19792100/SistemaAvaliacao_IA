alter table banca_pareceristas
  add column if not exists is_teste boolean not null default false;

comment on column banca_pareceristas.is_teste is
  'Pareceristas de teste podem avaliar os 80, mas suas avaliações não compõem notas, ranking nem métricas oficiais.';
