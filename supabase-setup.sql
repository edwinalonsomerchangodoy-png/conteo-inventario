-- ============================================================
-- Script de configuración para el Sistema de Conteo de Inventario
-- Cópialo completo y pégalo en: Supabase → tu proyecto → SQL Editor → New query
-- Luego dale clic a "Run". Solo necesitas correrlo una vez.
-- ============================================================

-- Tiendas detectadas al subir el archivo maestro
create table if not exists tiendas (
  nombre text primary key
);

-- Stock del sistema, por producto y por tienda
create table if not exists stock (
  id bigint generated always as identity primary key,
  codigo text not null,
  producto text,
  area text,
  categoria text,
  proveedor text,
  tienda text not null references tiendas (nombre),
  stock_sistema integer not null default 0,
  alt_codigos text[] default '{}',
  updated_at timestamptz not null default now(),
  unique (codigo, tienda)
);

create index if not exists stock_tienda_idx on stock (tienda);
create index if not exists stock_codigo_idx on stock (codigo);

-- Conteos físicos: una fila por producto + tienda, con espacio para el
-- primer conteo y el reconteo de confirmación.
create table if not exists conteos (
  id bigint generated always as identity primary key,
  fecha timestamptz not null default now(),
  usuario text,
  tienda text not null,
  codigo text not null,
  producto text,
  area text,
  categoria text,
  proveedor text,
  stock_sistema integer,
  conteo_1 integer,
  conteo_2 integer,
  conteo_fisico integer,
  diferencia integer,
  estado text,
  unique (codigo, tienda)
);

create index if not exists conteos_tienda_idx on conteos (tienda);

-- Listas de conteo selectivo: un subconjunto de códigos de una tienda para
-- contar solo esas referencias en vez de todo el inventario.
create table if not exists listas_conteo (
  id bigint generated always as identity primary key,
  nombre text not null,
  tienda text not null references tiendas (nombre),
  codigos text[] not null default '{}',
  creado_por text,
  creado_en timestamptz not null default now()
);

create index if not exists listas_conteo_tienda_idx on listas_conteo (tienda);

-- Seguridad: solo colaboradores con sesión iniciada pueden leer/escribir.
alter table tiendas enable row level security;
alter table stock enable row level security;
alter table conteos enable row level security;

drop policy if exists "tiendas_select" on tiendas;
create policy "tiendas_select" on tiendas for select to authenticated using (true);
drop policy if exists "tiendas_insert" on tiendas;
create policy "tiendas_insert" on tiendas for insert to authenticated with check (true);

drop policy if exists "stock_select" on stock;
create policy "stock_select" on stock for select to authenticated using (true);
drop policy if exists "stock_insert" on stock;
create policy "stock_insert" on stock for insert to authenticated with check (true);
drop policy if exists "stock_update" on stock;
create policy "stock_update" on stock for update to authenticated using (true);
drop policy if exists "stock_delete" on stock;
create policy "stock_delete" on stock for delete to authenticated using (true);

drop policy if exists "conteos_select" on conteos;
create policy "conteos_select" on conteos for select to authenticated using (true);
drop policy if exists "conteos_insert" on conteos;
create policy "conteos_insert" on conteos for insert to authenticated with check (true);
drop policy if exists "conteos_update" on conteos;
create policy "conteos_update" on conteos for update to authenticated using (true);
drop policy if exists "conteos_delete" on conteos;
create policy "conteos_delete" on conteos for delete to authenticated using (true);

alter table listas_conteo enable row level security;

drop policy if exists "listas_conteo_select" on listas_conteo;
create policy "listas_conteo_select" on listas_conteo for select to authenticated using (true);
drop policy if exists "listas_conteo_insert" on listas_conteo;
create policy "listas_conteo_insert" on listas_conteo for insert to authenticated with check (true);
drop policy if exists "listas_conteo_delete" on listas_conteo;
create policy "listas_conteo_delete" on listas_conteo for delete to authenticated using (true);
