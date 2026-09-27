-- Salva avaliação, critérios e auditoria na mesma transação.
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
set search_path = public
as $$
declare
  v_criterio jsonb;
  v_updated_at timestamptz := coalesce(p_fim_at, now());
begin
  if p_environment not in ('homolog', 'producao') then
    raise exception 'Ambiente inválido.';
  end if;
  if nullif(trim(p_inscricao_id_externo), '') is null or nullif(trim(p_parecerista_id_externo), '') is null then
    raise exception 'Inscrição e parecerista são obrigatórios.';
  end if;
  if jsonb_typeof(p_notas) <> 'array' or jsonb_array_length(p_notas) <> 3 then
    raise exception 'A avaliação precisa conter exatamente três notas.';
  end if;
  if jsonb_typeof(p_criterios) <> 'array' or jsonb_array_length(p_criterios) <> 3 then
    raise exception 'A avaliação precisa conter exatamente três critérios.';
  end if;
  if not exists (
    select 1 from public.pareceristas
    where environment = p_environment
      and id_externo = p_parecerista_id_externo
      and ativo = true
      and is_teste = coalesce(p_is_teste, false)
  ) then
    raise exception 'Parecerista ativo não encontrado ou perfil de teste divergente.';
  end if;
  if not coalesce(p_is_teste, false) and not exists (
    select 1 from public.atribuicoes
    where environment = p_environment
      and inscricao_id_externo = p_inscricao_id_externo
      and parecerista_id_externo = p_parecerista_id_externo
      and ativo = true
  ) then
    raise exception 'A candidatura não está atribuída a este parecerista.';
  end if;

  insert into public.avaliacoes (
    environment, inscricao_id_externo, parecerista_id_externo, is_teste,
    status, parecer_geral, concluida, notas_json, justificativas_json, updated_at
  ) values (
    p_environment, p_inscricao_id_externo, p_parecerista_id_externo, coalesce(p_is_teste, false),
    'concluida', coalesce(p_parecer_geral, ''), true, p_notas, '["","",""]'::jsonb, v_updated_at
  )
  on conflict (environment, inscricao_id_externo, parecerista_id_externo)
  do update set
    is_teste = excluded.is_teste,
    status = excluded.status,
    parecer_geral = excluded.parecer_geral,
    concluida = excluded.concluida,
    notas_json = excluded.notas_json,
    justificativas_json = excluded.justificativas_json,
    updated_at = excluded.updated_at;

  delete from public.avaliacao_criterios
  where environment = p_environment
    and inscricao_id_externo = p_inscricao_id_externo
    and parecerista_id_externo = p_parecerista_id_externo;

  for v_criterio in select value from jsonb_array_elements(p_criterios)
  loop
    insert into public.avaliacao_criterios (
      environment, inscricao_id_externo, parecerista_id_externo,
      criterio_ordem, criterio_nome, criterio_grupo, nota, justificativa
    ) values (
      p_environment, p_inscricao_id_externo, p_parecerista_id_externo,
      (v_criterio->>'ordem')::integer,
      coalesce(v_criterio->>'nome', ''),
      coalesce(v_criterio->>'grupo', 'Maratona IA'),
      v_criterio->>'nota',
      coalesce(v_criterio->>'justificativa', '')
    );
  end loop;

  insert into public.eventos_auditoria (
    environment, event_type, actor_type, actor_id, inscricao_id,
    parecerista_id, correlation_id, payload_json, created_at
  ) values (
    p_environment, p_event_type, 'parecerista', p_parecerista_id_externo, p_inscricao_id_externo,
    p_parecerista_id_externo, p_event_id,
    coalesce(p_event_payload, '{}'::jsonb) || jsonb_build_object(
      'inicio', p_inicio_at,
      'fim', v_updated_at
    ),
    v_updated_at
  )
  on conflict (environment, event_type, correlation_id)
  do update set payload_json = excluded.payload_json, created_at = excluded.created_at;

  return jsonb_build_object(
    'ok', true,
    'environment', p_environment,
    'inscricao_id', p_inscricao_id_externo,
    'parecerista_id', p_parecerista_id_externo,
    'updated_at', v_updated_at
  );
end;
$$;

revoke all on function public.salvar_avaliacao_maratona(text,text,text,boolean,text,jsonb,jsonb,text,text,jsonb,timestamptz,timestamptz) from public;
grant execute on function public.salvar_avaliacao_maratona(text,text,text,boolean,text,jsonb,jsonb,text,text,jsonb,timestamptz,timestamptz) to anon, authenticated;

