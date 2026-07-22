import { supabase } from './supabaseClient.js'

const TAMANO_PAGINA = 1000

// Postgrest (la API de Supabase) devuelve como máximo ~1000 filas por
// consulta. Esta función pagina automáticamente hasta traer todo.
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
