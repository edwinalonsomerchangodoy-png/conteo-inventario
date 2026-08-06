// Lógica compartida para armar las filas de conteo.
//
// Modelo: escanear siempre suma al total ya contado de ese producto en esa
// tienda — sin importar si antes quedó "correcto" o con diferencia. Así
// nunca se bloquea la posibilidad de encontrar más unidades físicas de las
// que el sistema esperaba (sobrantes). El reconteo de verificación
// (segundo conteo independiente) sigue existiendo como paso opcional en
// "Pendientes de reconteo", pero no bloquea el conteo normal.

export function construirFilaPrimero({
  producto,
  codigoLimpio,
  tiendaActiva,
  usuario,
  filaExistente,
  cantidad,
  programaCiclo,
}) {
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
      alt_codigos: producto.alt_codigos || [],
      producto: producto.producto,
      area: producto.area,
      categoria: producto.categoria || '',
      proveedor: producto.proveedor || '',
      marca: producto.marca || '',
      programa_ciclo: programaCiclo || (filaExistente ? filaExistente.programa_ciclo : null) || null,
      stock_sistema: stockSistema,
      conteo_1: total,
      conteo_2: filaExistente ? filaExistente.conteo_2 ?? null : null,
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
  const diferencia = totalReconteo - stockSistema

  // filaExistente trae un "id" que Supabase genera automáticamente (columna
  // identity). Si se reenvía tal cual, Supabase rechaza el guardado.
  const { id: _id, ...resto } = filaExistente

  // El reconteo siempre queda como el valor final — coincida o no con el
  // primer conteo. Si no coincide, queda una señal visual (no bloqueante)
  // en el reporte para que gerencia lo note.
  return {
    fila: {
      ...resto,
      fecha: new Date().toISOString(),
      usuario,
      conteo_2: totalReconteo,
      conteo_fisico: totalReconteo,
      diferencia,
      estado: 'confirmado',
    },
    estado: 'confirmado',
    diferencia,
    coincide,
    totalReconteo,
  }
}
