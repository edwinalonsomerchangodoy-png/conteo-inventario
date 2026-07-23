-- ============================================================
-- Migración incremental: dashboard + conteos selectivos
-- Corre esto UNA VEZ en el SQL Editor de tu proyecto de Supabase existente.
-- (No reemplaza supabase-setup.sql — ese es para instalaciones nuevas).
-- ============================================================

-- Nuevas columnas para clasificar el stock y los conteos
alter table stock add column if not exists categoria text;
alter table stock add column if not exists proveedor text;

alter table conteos add column if not exists categoria text;
alter table conteos add column if not exists proveedor text;

-- Tabla de listas de conteo selectivo
create table if not exists listas_conteo (
  id bigint generated always as identity primary key,
  nombre text not null,
  tienda text not null references tiendas (nombre),
  codigos text[] not null default '{}',
  creado_por text,
  creado_en timestamptz not null default now()
);

create index if not exists listas_conteo_tienda_idx on listas_conteo (tienda);

alter table listas_conteo enable row level security;

drop policy if exists "listas_conteo_select" on listas_conteo;
create policy "listas_conteo_select" on listas_conteo for select to authenticated using (true);
drop policy if exists "listas_conteo_insert" on listas_conteo;
create policy "listas_conteo_insert" on listas_conteo for insert to authenticated with check (true);
drop policy if exists "listas_conteo_delete" on listas_conteo;
create policy "listas_conteo_delete" on listas_conteo for delete to authenticated using (true);
