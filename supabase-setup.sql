-- ============================================================
-- Ciclos de Inventario — esquema completo (instalación nueva)
-- Pega esto en Supabase → SQL Editor → New query → Run.
-- ============================================================

create table if not exists tiendas (
  nombre text primary key
);

create table if not exists stock (
  id bigint generated always as identity primary key,
  codigo text not null,
  alt_codigos text[] default '{}',
  producto text,
  area text,
  categoria text,
  proveedor text,
  marca text,
  tienda text not null references tiendas (nombre),
  stock_sistema integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (codigo, tienda)
);

create index if not exists stock_tienda_idx on stock (tienda);
create index if not exists stock_codigo_idx on stock (codigo);

create table if not exists conteos (
  id bigint generated always as identity primary key,
  fecha timestamptz not null default now(),
  usuario text,
  tienda text not null,
  codigo text not null,
  alt_codigos text[] default '{}',
  producto text,
  area text,
  categoria text,
  proveedor text,
  marca text,
  programa_ciclo text,
  stock_sistema integer,
  conteo_1 integer,
  conteo_2 integer,
  conteo_fisico integer,
  diferencia integer,
  estado text,
  unique (codigo, tienda)
);

create index if not exists conteos_tienda_idx on conteos (tienda);

-- Programas de ciclos: definen QUÉ se cuenta (por proveedor, marca,
-- categoría, o una lista manual de códigos). Son centralizados — el mismo
-- programa aplica igual en todas las tiendas; cada tienda resuelve la lista
-- de códigos contra su propio stock al momento de contar.
create table if not exists programas_ciclo (
  id bigint generated always as identity primary key,
  nombre text not null,
  tipo text not null check (tipo in ('proveedor', 'marca', 'categoria', 'manual')),
  valor text,
  codigos text[] default '{}',
  activo boolean not null default true,
  creado_por text,
  creado_en timestamptz not null default now()
);

-- Configuración global: qué programa de ciclo está activo ahora mismo para
-- todo el mundo (o ninguno = conteo completo de tienda). Fila única.
create table if not exists configuracion_ciclo (
  id smallint primary key default 1,
  programa_activo_id bigint references programas_ciclo (id) on delete set null,
  constraint solo_una_fila check (id = 1)
);
insert into configuracion_ciclo (id, programa_activo_id)
  values (1, null)
  on conflict (id) do nothing;

-- Seguridad: solo colaboradores con sesión iniciada pueden leer/escribir.
alter table tiendas enable row level security;
alter table stock enable row level security;
alter table conteos enable row level security;
alter table programas_ciclo enable row level security;
alter table configuracion_ciclo enable row level security;

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

drop policy if exists "programas_select" on programas_ciclo;
create policy "programas_select" on programas_ciclo for select to authenticated using (true);
drop policy if exists "programas_insert" on programas_ciclo;
create policy "programas_insert" on programas_ciclo for insert to authenticated with check (true);
drop policy if exists "programas_update" on programas_ciclo;
create policy "programas_update" on programas_ciclo for update to authenticated using (true);
drop policy if exists "programas_delete" on programas_ciclo;
create policy "programas_delete" on programas_ciclo for delete to authenticated using (true);

drop policy if exists "config_select" on configuracion_ciclo;
create policy "config_select" on configuracion_ciclo for select to authenticated using (true);
drop policy if exists "config_update" on configuracion_ciclo;
create policy "config_update" on configuracion_ciclo for update to authenticated using (true);
