-- Workshop Maratona IA 2026: acesso individual, liberação por etapa e respostas.
-- Execute este arquivo no SQL Editor do Supabase antes de abrir o workshop ao público.

create table if not exists workshop_configuracoes (
  environment text primary key check (environment in ('homolog', 'producao')),
  atividade_ativa text not null default 'fechada' check (atividade_ativa in ('fechada', 'checkin', 'fase1', 'fase2')),
  updated_at timestamptz not null default now()
);

insert into workshop_configuracoes(environment, atividade_ativa)
values ('homolog', 'fechada'), ('producao', 'fechada')
on conflict (environment) do nothing;

create table if not exists workshop_participantes (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('homolog', 'producao')),
  inscricao_id_externo text not null,
  nome text not null,
  email text not null,
  ano_nascimento integer not null check (ano_nascimento between 1900 and 2100),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(environment, inscricao_id_externo),
  unique(environment, email)
);

create table if not exists workshop_respostas (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references workshop_participantes(id) on delete cascade,
  environment text not null check (environment in ('homolog', 'producao')),
  atividade text not null check (atividade in ('checkin', 'fase1', 'fase2')),
  respostas jsonb not null default '{}'::jsonb,
  enviado_at timestamptz not null default now(),
  unique(participant_id, atividade)
);

alter table workshop_configuracoes enable row level security;
alter table workshop_participantes enable row level security;
alter table workshop_respostas enable row level security;

create index if not exists workshop_participantes_email_idx
  on workshop_participantes(environment, email) where ativo = true;
create index if not exists workshop_respostas_environment_idx
  on workshop_respostas(environment, atividade, enviado_at desc);

-- O acesso é exclusivamente pelo endpoint server-side /api/workshop.
-- Não crie políticas para anon/authenticated nestas tabelas.
