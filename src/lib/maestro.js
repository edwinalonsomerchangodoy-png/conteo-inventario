import { limpiarCodigo } from './storage.js'

// El archivo maestro de inventario (formato "Plano Inv horizontal") trae dos
// filas de encabezado y luego, por cada tienda, 3 columnas seguidas:
// Fx Inv_tienda (stock), Maximo/fx Stock_Max, Fx Id_Estado Prod.
// Esta función detecta esa estructura automáticamente a partir de las dos
// primeras filas, sin depender de nombres de hoja ni de un orden fijo de
// columnas.

export function esFormatoMaestro(filaEncabezado2) {
  return filaEncabezado2.some(
    (c) => typeof c === 'string' && /fx\s*inv_tienda/i.test(c)
  )
}

function buscarColumna(filaEncabezado, patrones) {
  for (const patron of patrones) {
    const idx = filaEncabezado.findIndex(
      (c) => typeof c === 'string' && patron.test(c)
    )
    if (idx !== -1) return idx
  }
  return -1
}

export function parseMaestro(filas) {
  const encabezado1 = filas[0] || []
  const encabezado2 = filas[1] || []

  const idxCodigo = buscarColumna(encabezado2, [/cod\s*ean\s*\/?\s*upc/i, /^material$/i])
  const idxDescripcion = buscarColumna(encabezado2, [/descripcion/i])
  const idxMundo = buscarColumna(encabezado2, [/^mundo$/i])

  const tiendas = []
  for (let c = 0; c < encabezado2.length; c++) {
    if (typeof encabezado2[c] === 'string' && /fx\s*inv_tienda/i.test(encabezado2[c])) {
      const nombre = encabezado1[c]
      if (nombre) {
        tiendas.push({ nombre: String(nombre).trim(), col: c })
      }
    }
  }

  const dataRows = filas.slice(2).filter((r) => r && r[idxCodigo] !== null && r[idxCodigo] !== undefined && r[idxCodigo] !== '')

  return { dataRows, idxCodigo, idxDescripcion, idxMundo, tiendas }
}

export function extraerStockDeTienda(maestro, nombreTienda) {
  const tienda = maestro.tiendas.find((t) => t.nombre === nombreTienda)
  if (!tienda) return []

  return maestro.dataRows.map((r) => ({
    codigo: limpiarCodigo(r[maestro.idxCodigo]),
    producto: maestro.idxDescripcion !== -1 ? r[maestro.idxDescripcion] ?? '' : '',
    area: maestro.idxMundo !== -1 ? r[maestro.idxMundo] ?? '' : '',
    stock_sistema: Number(r[tienda.col]) || 0,
  }))
}
