// Lógica compartida para armar las filas de conteo. Vive aparte para que
// tanto "Conteo físico" como "Pendientes de reconteo" construyan las filas
// exactamente de la misma manera y no diverjan con el tiempo.

export function construirFilaPrimero({ producto, codigoLimpio, tiendaActiva, usuario, filaExistente, cantidad }) {
  const stockSistema = Number(producto.stock_sistema)
  const base = filaExistente ? Number(filaExistente.conteo_1) || 0 : 0
  const total = base + cantidad
  const diferencia = total - stockSistema
  const estado = diferencia === 0 ? 'ok' : 'pendiente_reconteo'

  return {
    fila: {
      fecha: new Date().toISOString(),
      usuario,
      tienda: tiendaActiva || '',
      codigo: codigoLimpio,
      producto: producto.producto,
      area: producto.area,
      categoria: producto.categoria || '',
      proveedor: producto.proveedor || '',
      stock_sistema: stockSistema,
      conteo_1: total,
      conteo_2: null,
      conteo_fisico: total,
      diferencia,
      estado,
    },
    estado,
    diferencia,
  }
}

export function construirFilaReconteo({ filaExistente, usuario, cantidad }) {
  const stockSistema = Number(filaExistente.stock_sistema)
  const baseReconteo = Number(filaExistente.conteo_2) || 0
  const totalReconteo = baseReconteo + cantidad
  const coincide = totalReconteo === Number(filaExistente.conteo_1)
  const estado = coincide ? 'confirmado' : 'revisar'
  const diferencia = totalReconteo - stockSistema

  // filaExistente trae un "id" que Supabase genera automáticamente (columna
  // identity). Si se reenvía tal cual, Supabase rechaza el guardado.
  const { id: _id, ...resto } = filaExistente

  return {
    fila: {
      ...resto,
      fecha: new Date().toISOString(),
      usuario,
      conteo_2: totalReconteo,
      conteo_fisico: totalReconteo,
      diferencia,
      estado,
    },
    estado,
    diferencia,
    coincide,
    totalReconteo,
  }
}
