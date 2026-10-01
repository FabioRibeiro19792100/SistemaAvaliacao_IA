-- Schema exclusivo do sistema de avaliação da Maratona IA 2026.
-- Execute em um projeto Supabase separado do sistema PPA e do banco de inscrições.
create extension if not exists pgcrypto;

create table if not exists imports (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('homolog', 'producao')),
  source_name text not null,
  source_hash text not null,
  source_type text not null default 'xlsx',
  status text not null default 'completed',
  imported_at timestamptz not null default now(),
  imported_by text,
  row_count integer not null default 0,
  participant_row_count integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists imports_environment_hash_idx
  on imports(environment, source_hash);

create table if not exists import_rows_raw (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references imports(id) on delete cascade,
  environment text not null check (environment in ('homolog', 'producao')),
  source_sheet text not null,
  row_number integer not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists inscricoes (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('homolog', 'producao')),
  import_id uuid references imports(id) on delete set null,
  id_externo text not null,
  id_curto text not null,
  lider text not null,
  lider_email text,
  participante_2_nome text,
  participante_2_email text,
  participante_3_nome text,
  participante_3_email text,
  mentor_nome text,
  mentor_email text,
  instituicao text,
  modalidade text,
  uf text,
  curso text,
  ia_descricao text,
  objetivos_campanha text,
  estrategia_distribuicao text,
  defesa_conceitual text,
  video_url text,
  roteiro_30_url text,
  campanha_url text,
  raw_json jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  source_import_hash text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists inscricoes_environment_id_externo_idx
  on inscricoes(environment, id_externo);

create table if not exists participantes (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('homolog', 'producao')),
  inscricao_id_externo text not null,
  papel text not null,
  ordem integer not null default 1,
  nome text not null,
  email text,
  instituicao text,
  uf text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists participantes_environment_unique_idx
  on participantes(environment, inscricao_id_externo, papel, ordem);

create table if not exists pareceristas (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('homolog', 'producao')),
  id_externo text not null,
  nome text not null,
  email text not null,
  instituicao text,
  is_teste boolean not null default false,
  capacidade_manual integer,
  capacidade_calculada integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pareceristas_environment_id_externo_idx
  on pareceristas(environment, id_externo);

create table if not exists atribuicoes (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('homolog', 'producao')),
  inscricao_id_externo text not null,
  parecerista_id_externo text not null,
  ordem integer not null default 1,
  origem text not null default 'automatica',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists atribuicoes_environment_unique_idx
  on atribuicoes(environment, inscricao_id_externo, parecerista_id_externo);

create table if not exists avaliacoes (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('homolog', 'producao')),
  inscricao_id_externo text not null,
  parecerista_id_externo text not null,
  is_teste boolean not null default false,
  status text not null default 'nao_iniciada',
  parecer_geral text,
  concluida boolean not null default false,
  motivo_curta_duracao text,
  notas_json jsonb not null default '[]'::jsonb,
  justificativas_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists avaliacoes_environment_unique_idx
  on avaliacoes(environment, inscricao_id_externo, parecerista_id_externo);

alter table if exists pareceristas
  add column if not exists is_teste boolean not null default false;

alter table if exists avaliacoes
  add column if not exists is_teste boolean not null default false;

create table if not exists avaliacao_criterios (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('homolog', 'producao')),
  inscricao_id_externo text not null,
  parecerista_id_externo text not null,
  criterio_ordem integer not null,
  criterio_nome text not null,
  criterio_grupo text not null,
  nota text,
  justificativa text,
  created_at timestamptz not null default now()
);

create unique index if not exists avaliacao_criterios_environment_unique_idx
  on avaliacao_criterios(environment, inscricao_id_externo, parecerista_id_externo, criterio_ordem);

create table if not exists banca_pareceristas (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('homolog', 'producao')),
  id_externo text not null,
  nome text not null,
  email text not null,
  instituicao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists banca_pareceristas_environment_id_externo_idx
  on banca_pareceristas(environment, id_externo);

create table if not exists banca_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('homolog', 'producao')),
  inscricao_id_externo text not null,
  parecerista_id_externo text not null,
  modelo_id text not null default 'grade_completa',
  status text not null default 'nao_iniciada',
  parecer_geral text,
  concluida boolean not null default false,
  motivo_curta_duracao text,
  notas_json jsonb not null default '[]'::jsonb,
  justificativas_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists banca_avaliacoes_environment_model_unique_idx
  on banca_avaliacoes(environment, inscricao_id_externo, parecerista_id_externo, modelo_id);

create table if not exists banca_avaliacao_criterios (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('homolog', 'producao')),
  inscricao_id_externo text not null,
  parecerista_id_externo text not null,
  modelo_id text not null default 'grade_completa',
  criterio_ordem integer not null,
  criterio_nome text not null,
  criterio_grupo text not null,
  nota text,
  justificativa text,
  created_at timestamptz not null default now()
);

create unique index if not exists banca_avaliacao_criterios_environment_model_unique_idx
  on banca_avaliacao_criterios(environment, inscricao_id_externo, parecerista_id_externo, modelo_id, criterio_ordem);

create table if not exists distribuicoes (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('homolog', 'producao')),
  origem text not null default 'manual_sync',
  parametros_json jsonb not null default '{}'::jsonb,
  cobertura_inscricoes integer not null default 0,
  total_slots integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists configuracoes_sistema (
  id text primary key,
  environment text not null check (environment in ('homolog', 'producao')),
  tempo_minimo_ms integer not null default 120000,
  insuf_obriga_parecer integer not null default 3,
  pareceres_por_equipe integer not null default 3,
  evitar_conflito_institucional boolean not null default true,
  criterios_pesos jsonb not null default '[33.33,33.33,33.34]'::jsonb,
  banca_selecionados jsonb not null default '[]'::jsonb,
  banca_modelo_ativo text not null default 'grade_completa' check (banca_modelo_ativo in ('grade_completa', 'grade_banca', 'nota_direta')),
  banca_modelos_config jsonb not null default '{"grade_completa":{"pesos":[33.33,33.33,33.34]},"grade_banca":{"pesos":[33.33,33.33,33.34]},"nota_direta":{"pesos":[100]}}'::jsonb,
  theme_name text not null default 'default',
  theme_dark boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists eventos_auditoria (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('homolog', 'producao')),
  event_type text not null,
  actor_type text not null,
  actor_id text not null,
  inscricao_id text,
  parecerista_id text,
  correlation_id text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists eventos_auditoria_environment_created_idx
  on eventos_auditoria(environment, created_at desc);

create unique index if not exists eventos_auditoria_environment_event_corr_idx
  on eventos_auditoria(environment, event_type, correlation_id);

create table if not exists backups_log (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('homolog', 'producao')),
  backup_type text not null default 'daily_snapshot',
  backup_target text,
  status text not null default 'pending',
  details_json jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists avaliacoes_historico (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null,
  environment text not null,
  inscricao_id_externo text not null,
  parecerista_id_externo text not null,
  operacao text not null check (operacao in ('UPDATE', 'DELETE')),
  dados_anteriores jsonb not null,
  dados_novos jsonb,
  alterado_em timestamptz not null default now()
);

create index if not exists avaliacoes_historico_lookup_idx
  on avaliacoes_historico(environment, inscricao_id_externo, parecerista_id_externo, alterado_em desc);

alter table imports enable row level security;
alter table import_rows_raw enable row level security;
alter table inscricoes enable row level security;
alter table participantes enable row level security;
alter table pareceristas enable row level security;
alter table atribuicoes enable row level security;
alter table avaliacoes enable row level security;
alter table avaliacao_criterios enable row level security;
alter table banca_pareceristas enable row level security;
alter table banca_avaliacoes enable row level security;
alter table banca_avaliacao_criterios enable row level security;
alter table distribuicoes enable row level security;
alter table configuracoes_sistema enable row level security;
alter table eventos_auditoria enable row level security;
alter table backups_log enable row level security;
alter table avaliacoes_historico enable row level security;

drop policy if exists "prototype full access imports" on imports;
create policy "prototype full access imports" on imports for all using (true) with check (true);
drop policy if exists "prototype full access import_rows_raw" on import_rows_raw;
create policy "prototype full access import_rows_raw" on import_rows_raw for all using (true) with check (true);
drop policy if exists "prototype full access inscricoes" on inscricoes;
create policy "prototype full access inscricoes" on inscricoes for all using (true) with check (true);
drop policy if exists "prototype full access participantes" on participantes;
create policy "prototype full access participantes" on participantes for all using (true) with check (true);
drop policy if exists "prototype full access pareceristas" on pareceristas;
create policy "prototype full access pareceristas" on pareceristas for all using (true) with check (true);
drop policy if exists "prototype full access atribuicoes" on atribuicoes;
create policy "prototype full access atribuicoes" on atribuicoes for all using (true) with check (true);
drop policy if exists "prototype full access avaliacoes" on avaliacoes;
drop policy if exists "evaluation read access" on avaliacoes;
drop policy if exists "evaluation insert access" on avaliacoes;
drop policy if exists "evaluation update access" on avaliacoes;
create policy "evaluation read access" on avaliacoes for select to anon, authenticated using (true);
create policy "evaluation insert access" on avaliacoes for insert to anon, authenticated with check (true);
create policy "evaluation update access" on avaliacoes for update to anon, authenticated using (true) with check (true);
drop policy if exists "prototype full access avaliacao_criterios" on avaliacao_criterios;
drop policy if exists "evaluation criteria read access" on avaliacao_criterios;
drop policy if exists "evaluation criteria insert access" on avaliacao_criterios;
drop policy if exists "evaluation criteria update access" on avaliacao_criterios;
create policy "evaluation criteria read access" on avaliacao_criterios for select to anon, authenticated using (true);
create policy "evaluation criteria insert access" on avaliacao_criterios for insert to anon, authenticated with check (true);
create policy "evaluation criteria update access" on avaliacao_criterios for update to anon, authenticated using (true) with check (true);
drop policy if exists "prototype full access banca_pareceristas" on banca_pareceristas;
create policy "prototype full access banca_pareceristas" on banca_pareceristas for all using (true) with check (true);
drop policy if exists "prototype full access banca_avaliacoes" on banca_avaliacoes;
create policy "prototype full access banca_avaliacoes" on banca_avaliacoes for all using (true) with check (true);
drop policy if exists "prototype full access banca_avaliacao_criterios" on banca_avaliacao_criterios;
create policy "prototype full access banca_avaliacao_criterios" on banca_avaliacao_criterios for all using (true) with check (true);
drop policy if exists "prototype full access distribuicoes" on distribuicoes;
create policy "prototype full access distribuicoes" on distribuicoes for all using (true) with check (true);
drop policy if exists "prototype full access configuracoes_sistema" on configuracoes_sistema;
create policy "prototype full access configuracoes_sistema" on configuracoes_sistema for all using (true) with check (true);
drop policy if exists "prototype full access eventos_auditoria" on eventos_auditoria;
create policy "prototype full access eventos_auditoria" on eventos_auditoria for all using (true) with check (true);
drop policy if exists "prototype full access backups_log" on backups_log;
create policy "prototype full access backups_log" on backups_log for all using (true) with check (true);
drop policy if exists "evaluation history read access" on avaliacoes_historico;
create policy "evaluation history read access" on avaliacoes_historico for select to anon, authenticated using (true);

create or replace function public.registrar_historico_avaliacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and to_jsonb(old) = to_jsonb(new) then
    return new;
  end if;

  insert into public.avaliacoes_historico (
    avaliacao_id, environment, inscricao_id_externo, parecerista_id_externo,
    operacao, dados_anteriores, dados_novos
  ) values (
    old.id, old.environment, old.inscricao_id_externo, old.parecerista_id_externo,
    tg_op, to_jsonb(old), case when tg_op = 'UPDATE' then to_jsonb(new) else null end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists avaliacoes_historico_trigger on public.avaliacoes;
create trigger avaliacoes_historico_trigger
after update or delete on public.avaliacoes
for each row execute function public.registrar_historico_avaliacao();

-- Grava avaliação, critérios e auditoria como uma única operação atômica.
create or replace function public.salvar_avaliacao_maratona(
  p_environment text,
  p_inscricao_id_externo text,
  p_parecerista_id_externo text,
  p_is_teste boolean,
  p_parecer_geral text,
  p_notas jsonb,
  p_criterios jsonb,
  p_event_type text,
  p_event_id text,
  p_event_payload jsonb,
  p_inicio_at timestamptz,
  p_fim_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_criterio jsonb;
  v_updated_at timestamptz := coalesce(p_fim_at, now());
begin
  if p_environment not in ('homolog', 'producao') then raise exception 'Ambiente inválido.'; end if;
  if nullif(trim(p_inscricao_id_externo), '') is null or nullif(trim(p_parecerista_id_externo), '') is null then raise exception 'Inscrição e parecerista são obrigatórios.'; end if;
  if jsonb_typeof(p_notas) <> 'array' or jsonb_array_length(p_notas) <> 3 then raise exception 'A avaliação precisa conter exatamente três notas.'; end if;
  if jsonb_typeof(p_criterios) <> 'array' or jsonb_array_length(p_criterios) <> 3 then raise exception 'A avaliação precisa conter exatamente três critérios.'; end if;
  if not exists (select 1 from public.pareceristas where environment=p_environment and id_externo=p_parecerista_id_externo and ativo=true and is_teste=coalesce(p_is_teste,false)) then raise exception 'Parecerista ativo não encontrado ou perfil de teste divergente.'; end if;
  if not coalesce(p_is_teste,false) and not exists (select 1 from public.atribuicoes where environment=p_environment and inscricao_id_externo=p_inscricao_id_externo and parecerista_id_externo=p_parecerista_id_externo and ativo=true) then raise exception 'A candidatura não está atribuída a este parecerista.'; end if;

  insert into public.avaliacoes(environment,inscricao_id_externo,parecerista_id_externo,is_teste,status,parecer_geral,concluida,notas_json,justificativas_json,updated_at)
  values(p_environment,p_inscricao_id_externo,p_parecerista_id_externo,coalesce(p_is_teste,false),'concluida',coalesce(p_parecer_geral,''),true,p_notas,'["","",""]'::jsonb,v_updated_at)
  on conflict(environment,inscricao_id_externo,parecerista_id_externo) do update set is_teste=excluded.is_teste,status=excluded.status,parecer_geral=excluded.parecer_geral,concluida=excluded.concluida,notas_json=excluded.notas_json,justificativas_json=excluded.justificativas_json,updated_at=excluded.updated_at;

  delete from public.avaliacao_criterios where environment=p_environment and inscricao_id_externo=p_inscricao_id_externo and parecerista_id_externo=p_parecerista_id_externo;
  for v_criterio in select value from jsonb_array_elements(p_criterios) loop
    insert into public.avaliacao_criterios(environment,inscricao_id_externo,parecerista_id_externo,criterio_ordem,criterio_nome,criterio_grupo,nota,justificativa)
    values(p_environment,p_inscricao_id_externo,p_parecerista_id_externo,(v_criterio->>'ordem')::integer,coalesce(v_criterio->>'nome',''),coalesce(v_criterio->>'grupo','Maratona IA'),v_criterio->>'nota',coalesce(v_criterio->>'justificativa',''));
  end loop;

  insert into public.eventos_auditoria(environment,event_type,actor_type,actor_id,inscricao_id,parecerista_id,correlation_id,payload_json,created_at)
  values(p_environment,p_event_type,'parecerista',p_parecerista_id_externo,p_inscricao_id_externo,p_parecerista_id_externo,p_event_id,coalesce(p_event_payload,'{}'::jsonb)||jsonb_build_object('inicio',p_inicio_at,'fim',v_updated_at),v_updated_at)
  on conflict(environment,event_type,correlation_id) do update set payload_json=excluded.payload_json,created_at=excluded.created_at;
  return jsonb_build_object('ok',true,'environment',p_environment,'inscricao_id',p_inscricao_id_externo,'parecerista_id',p_parecerista_id_externo,'updated_at',v_updated_at);
end;
$$;

revoke all on function public.salvar_avaliacao_maratona(text,text,text,boolean,text,jsonb,jsonb,text,text,jsonb,timestamptz,timestamptz) from public;
grant execute on function public.salvar_avaliacao_maratona(text,text,text,boolean,text,jsonb,jsonb,text,text,jsonb,timestamptz,timestamptz) to anon, authenticated;
