-- ============================================================
-- Migración incremental #4: mostrar códigos alternos en el reporte
-- Corre esto en el SQL Editor de tu proyecto de Supabase existente.
-- ============================================================

alter table conteos add column if not exists alt_codigos text[] default '{}';
