import { supabase } from './supabaseClient.js'

const TAMANO_PAGINA = 1000

async function traerTodo(tabla, aplicarFiltros = (q) => q) {
  let desde = 0
  let resultado = []
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let consulta = supabase.from(tabla).select('*').range(desde, desde + TAMANO_PAGINA - 1)
    consulta = aplicarFiltros(consulta)
    const { data, error } = await consulta
    if (error) throw error
    resultado = resultado.concat(data || [])
    if (!data || data.length < TAMANO_PAGINA) break
    desde += TAMANO_PAGINA
  }
  return resultado
}

// ---------- Tiendas y stock ----------

export async function getTiendasDisponibles() {
  const { data, error } = await supabase.from('tiendas').select('nombre').order('nombre')
  if (error) throw error
  return (data || []).map((t) => t.nombre)
}

export async function upsertTiendas(nombres) {
  if (nombres.length === 0) return
  const filas = nombres.map((nombre) => ({ nombre }))
  const { error } = await supabase.from('tiendas').upsert(filas, { onConflict: 'nombre' })
  if (error) throw error
}

export async function getStockPorTienda(tienda) {
  if (!tienda) return []
  return traerTodo('stock', (q) => q.eq('tienda', tienda))
}

export async function upsertStockLote(filas, onProgreso) {
  const TAM_LOTE = 2000
  for (let i = 0; i < filas.length; i += TAM_LOTE) {
    const lote = filas.slice(i, i + TAM_LOTE)
    const { error } = await supabase.from('stock').upsert(lote, { onConflict: 'codigo,tienda' })
    if (error) throw error
    if (onProgreso) onProgreso(Math.min(i + TAM_LOTE, filas.length), filas.length)
  }
}

export async function upsertStockManual(fila) {
  const { error } = await supabase.from('stock').upsert(fila, { onConflict: 'codigo,tienda' })
  if (error) throw error
}

export async function eliminarStockFila(codigo, tienda) {
  const { error } = await supabase.from('stock').delete().eq('codigo', codigo).eq('tienda', tienda)
  if (error) throw error
}

// ---------- Conteos ----------

export async function getConteos() {
  const filas = await traerTodo('conteos')
  return filas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
}

export async function upsertConteo(fila) {
  const { data, error } = await supabase
    .from('conteos')
    .upsert(fila, { onConflict: 'codigo,tienda' })
    .select()
  if (error) throw error
  return data?.[0]
}

export async function eliminarConteo(codigo, tienda) {
  const { error } = await supabase.from('conteos').delete().eq('codigo', codigo).eq('tienda', tienda)
  if (error) throw error
}

export async function borrarTodosLosConteos() {
  const { error } = await supabase.from('conteos').delete().gt('id', 0)
  if (error) throw error
}

// ---------- Programas de ciclos ----------

export async function getProgramasCiclo() {
  const { data, error } = await supabase
    .from('programas_ciclo')
    .select('*')
    .order('creado_en', { ascending: false })
  if (error) throw error
  return data || []
}

export async function crearProgramaCiclo({ nombre, tipo, valor, codigos, creadoPor }) {
  const { data, error } = await supabase
    .from('programas_ciclo')
    .insert({
      nombre,
      tipo,
      valor: valor || null,
      codigos: codigos || [],
      creado_por: creadoPor,
    })
    .select()
  if (error) throw error
  return data?.[0]
}

export async function actualizarProgramaCiclo(id, cambios) {
  const { error } = await supabase.from('programas_ciclo').update(cambios).eq('id', id)
  if (error) throw error
}

export async function eliminarProgramaCiclo(id) {
  const { error } = await supabase.from('programas_ciclo').delete().eq('id', id)
  if (error) throw error
}

export async function getConfiguracionCiclo() {
  const { data, error } = await supabase.from('configuracion_ciclo').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  return data
}

export async function setProgramaActivo(programaId) {
  const { error } = await supabase
    .from('configuracion_ciclo')
    .update({ programa_activo_id: programaId })
    .eq('id', 1)
  if (error) throw error
}
