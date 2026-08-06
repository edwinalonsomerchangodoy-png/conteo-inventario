import { limpiarCodigo } from './storage.js'

// El archivo maestro de inventario (formato "Plano Inv horizontal") trae dos
// filas de encabezado y luego, por cada tienda, 3 columnas seguidas:
// Fx Inv_tienda (stock), Maximo/fx Stock_Max, Fx Id_Estado Prod.
//
// Algunos productos traen más de un código de barras válido (Cod EAN/UPC,
// Ean Alterno 1, Material). Se elige uno como código principal y el resto
// se guardan como códigos alternativos.
//
// También se capturan "proveedor", "linea" (categoría) y "marca", usados
// para armar programas de ciclos y para el dashboard.

export function esFormatoMaestro(filaEncabezado2) {
  return filaEncabezado2.some((c) => typeof c === 'string' && /fx\s*inv_tienda/i.test(c))
}

function buscarColumna(filaEncabezado, patrones) {
  for (const patron of patrones) {
    const idx = filaEncabezado.findIndex((c) => typeof c === 'string' && patron.test(c))
    if (idx !== -1) return idx
  }
  return -1
}

export function parseMaestro(filas) {
  const encabezado1 = filas[0] || []
  const encabezado2 = filas[1] || []

  const idxEan = buscarColumna(encabezado2, [/cod\s*ean\s*\/?\s*upc/i])
  const idxEanAlterno = buscarColumna(encabezado2, [/ean\s*alterno/i])
  const idxMaterial = buscarColumna(encabezado2, [/^material$/i])
  const idxDescripcion = buscarColumna(encabezado2, [/descripcion/i])
  const idxProveedor = buscarColumna(encabezado2, [/proveedor/i])
  const idxMundo = buscarColumna(encabezado2, [/^mundo$/i])
  const idxLinea = buscarColumna(encabezado2, [/^linea$/i])
  const idxMarca = buscarColumna(encabezado2, [/^marca$/i])

  const tiendas = []
  for (let c = 0; c < encabezado2.length; c++) {
    if (typeof encabezado2[c] === 'string' && /fx\s*inv_tienda/i.test(encabezado2[c])) {
      const nombre = encabezado1[c]
      if (nombre) {
        tiendas.push({ nombre: String(nombre).trim(), col: c })
      }
    }
  }

  const idxsCodigo = [idxEan, idxMaterial, idxEanAlterno].filter((idx) => idx !== -1)
  const dataRows = filas
    .slice(2)
    .filter((r) => r && idxsCodigo.some((idx) => r[idx] !== null && r[idx] !== undefined && r[idx] !== ''))

  return {
    dataRows,
    idxEan,
    idxEanAlterno,
    idxMaterial,
    idxDescripcion,
    idxProveedor,
    idxMundo,
    idxLinea,
    idxMarca,
    tiendas,
  }
}

export function extraerStockDeTienda(maestro, nombreTienda) {
  const tienda = maestro.tiendas.find((t) => t.nombre === nombreTienda)
  if (!tienda) return []

  return maestro.dataRows
    .map((r) => {
      const candidatos = [maestro.idxEan, maestro.idxMaterial, maestro.idxEanAlterno]
        .filter((idx) => idx !== -1)
        .map((idx) => limpiarCodigo(r[idx]))
        .filter((c) => c)

      const codigo = candidatos[0] || ''
      const altCodigos = [...new Set(candidatos.slice(1))].filter((c) => c && c !== codigo)

      return {
        codigo,
        alt_codigos: altCodigos,
        producto: maestro.idxDescripcion !== -1 ? r[maestro.idxDescripcion] ?? '' : '',
        area: maestro.idxMundo !== -1 ? r[maestro.idxMundo] ?? '' : '',
        categoria: maestro.idxLinea !== -1 ? r[maestro.idxLinea] ?? '' : '',
        proveedor: maestro.idxProveedor !== -1 ? r[maestro.idxProveedor] ?? '' : '',
        marca: maestro.idxMarca !== -1 ? r[maestro.idxMarca] ?? '' : '',
        tienda: nombreTienda,
        stock_sistema: Number(r[tienda.col]) || 0,
      }
    })
    .filter((f) => f.codigo)
}
