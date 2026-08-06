-- ============================================================
-- Migración incremental #5: Programas de Ciclos
-- Corre esto en el SQL Editor de tu proyecto de Supabase existente.
-- No borra nada de lo que ya tienes (stock, conteos, listas_conteo viejas).
-- ============================================================

-- Nueva columna "marca" para poder armar ciclos también por marca
alter table stock add column if not exists marca text;
alter table conteos add column if not exists marca text;

-- Para saber qué programa de ciclo generó cada conteo (opcional, informativo)
alter table conteos add column if not exists programa_ciclo text;

-- Programas de ciclos: reemplazan a "listas_conteo" — ahora son
-- centralizados (un mismo programa aplica a todas las tiendas, cada una
-- resuelve sus propios códigos contra su stock al momento de contar).
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

-- Configuración global: qué programa está activo ahora mismo para todos.
create table if not exists configuracion_ciclo (
  id smallint primary key default 1,
  programa_activo_id bigint references programas_ciclo (id) on delete set null,
  constraint solo_una_fila check (id = 1)
);
insert into configuracion_ciclo (id, programa_activo_id)
  values (1, null)
  on conflict (id) do nothing;

alter table programas_ciclo enable row level security;
alter table configuracion_ciclo enable row level security;

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
