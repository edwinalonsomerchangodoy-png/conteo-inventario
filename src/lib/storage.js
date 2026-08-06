// Utilidades varias que no dependen de la red.

const TIENDA_KEY = 'inventario_tienda_activa_v1'

export function limpiarCodigo(codigo) {
  if (codigo === null || codigo === undefined) return ''
  return String(codigo).trim().replace(/[\n\r]/g, '')
}

export function buscarPorCodigo(stock, codigo) {
  const directo = stock.find((r) => String(r.codigo) === String(codigo))
  if (directo) return directo
  return stock.find(
    (r) => Array.isArray(r.alt_codigos) && r.alt_codigos.some((c) => String(c) === String(codigo))
  )
}

export function fechaHoy() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export function getTiendaActiva() {
  try {
    return localStorage.getItem(TIENDA_KEY) || ''
  } catch {
    return ''
  }
}

export function setTiendaActiva(nombre) {
  try {
    localStorage.setItem(TIENDA_KEY, nombre || '')
  } catch {
    /* noop */
  }
}

function celdaComoTexto(valor) {
  if (Array.isArray(valor)) return valor.join(' / ')
  return valor ?? ''
}

export function toCSV(rows, columns) {
  const header = columns.join(',')
  const body = rows
    .map((r) =>
      columns
        .map((c) => {
          const val = celdaComoTexto(r[c])
          const escaped = String(val).replace(/"/g, '""')
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped
        })
        .join(',')
    )
    .join('\n')
  return `${header}\n${body}`
}

export function descargarCSV(filename, rows, columns) {
  const csv = toCSV(rows, columns)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function descargarExcel(filename, rows, columns, nombreHoja = 'Datos') {
  const XLSX = await import('xlsx')
  const data = rows.map((r) => {
    const obj = {}
    columns.forEach((c) => {
      obj[c] = celdaComoTexto(r[c])
    })
    return obj
  })
  const hoja = XLSX.utils.json_to_sheet(data, { header: columns })
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja)
  XLSX.writeFile(libro, filename)
}

export const AREAS = ['Farmacia', 'Cajas', 'Pasillos', 'Equipos médicos']
