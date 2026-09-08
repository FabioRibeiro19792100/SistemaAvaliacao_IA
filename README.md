# Sistema de Avaliação — Maratona IA 2026

Sistema independente para importação de inscrições, gestão de pareceristas, atribuições, avaliação, resultados e auditoria da Maratona IA — Academia LED Globo.

## Execução local

Sirva esta pasta por HTTP e abra `avaliacao.html`. Por exemplo:

```bash
python3 -m http.server 5174
```

## Supabase

O schema exclusivo está em `supabase/schema.sql`. As evoluções complementares estão em `supabase/migrations/`.

As planilhas de inscrições são entradas locais e não devem ser versionadas.
