begin;

-- Mantém um histórico recuperável de toda alteração feita em avaliações.
create table if not exists public.avaliacoes_historico (
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
  on public.avaliacoes_historico(environment, inscricao_id_externo, parecerista_id_externo, alterado_em desc);

alter table public.avaliacoes_historico enable row level security;

drop policy if exists "evaluation history read access" on public.avaliacoes_historico;
create policy "evaluation history read access"
  on public.avaliacoes_historico for select
  to anon, authenticated
  using (true);

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
    avaliacao_id,
    environment,
    inscricao_id_externo,
    parecerista_id_externo,
    operacao,
    dados_anteriores,
    dados_novos
  ) values (
    old.id,
    old.environment,
    old.inscricao_id_externo,
    old.parecerista_id_externo,
    tg_op,
    to_jsonb(old),
    case when tg_op = 'UPDATE' then to_jsonb(new) else null end
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

-- Retira a permissão pública de DELETE, preservando leitura e os upserts
-- usados pela sincronização administrativa atual.
drop policy if exists "prototype full access avaliacoes" on public.avaliacoes;
drop policy if exists "evaluation read access" on public.avaliacoes;
drop policy if exists "evaluation insert access" on public.avaliacoes;
drop policy if exists "evaluation update access" on public.avaliacoes;
create policy "evaluation read access"
  on public.avaliacoes for select to anon, authenticated using (true);
create policy "evaluation insert access"
  on public.avaliacoes for insert to anon, authenticated with check (true);
create policy "evaluation update access"
  on public.avaliacoes for update to anon, authenticated using (true) with check (true);

drop policy if exists "prototype full access avaliacao_criterios" on public.avaliacao_criterios;
drop policy if exists "evaluation criteria read access" on public.avaliacao_criterios;
drop policy if exists "evaluation criteria insert access" on public.avaliacao_criterios;
drop policy if exists "evaluation criteria update access" on public.avaliacao_criterios;
create policy "evaluation criteria read access"
  on public.avaliacao_criterios for select to anon, authenticated using (true);
create policy "evaluation criteria insert access"
  on public.avaliacao_criterios for insert to anon, authenticated with check (true);
create policy "evaluation criteria update access"
  on public.avaliacao_criterios for update to anon, authenticated using (true) with check (true);

-- A RPC precisa executar como proprietária porque substitui os três critérios
-- dentro da mesma transação. O navegador continua sem poder apagá-los.
alter function public.salvar_avaliacao_maratona(
  text, text, text, boolean, text, jsonb, jsonb,
  text, text, jsonb, timestamptz, timestamptz
) security definer;

revoke all on function public.salvar_avaliacao_maratona(
  text, text, text, boolean, text, jsonb, jsonb,
  text, text, jsonb, timestamptz, timestamptz
) from public;
grant execute on function public.salvar_avaliacao_maratona(
  text, text, text, boolean, text, jsonb, jsonb,
  text, text, jsonb, timestamptz, timestamptz
) to anon, authenticated;

commit;
