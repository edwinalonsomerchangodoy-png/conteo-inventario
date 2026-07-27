-- ============================================================
-- Migración incremental #3: lista de conteo selectivo compartida por tienda
-- Corre esto en el SQL Editor de tu proyecto de Supabase existente.
-- ============================================================

-- Antes, "qué lista está activa" se guardaba solo en el navegador de cada
-- dispositivo — por eso un celular no veía la lista que activó otra persona
-- desde otro equipo. Ahora se guarda aquí, en la propia tienda, compartida
-- para todos los colaboradores.
alter table tiendas add column if not exists lista_activa_id bigint references listas_conteo (id) on delete set null;
