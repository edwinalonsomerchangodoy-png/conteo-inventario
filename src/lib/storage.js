// Capa de persistencia. Como el sitio se publica como archivos estáticos en
// Netlify (sin servidor ni base de datos), los datos se guardan en el
// localStorage del navegador de cada dispositivo. Esto reemplaza a los
// archivos stock_sistema.csv y conteos.csv de la versión en Streamlit.
//
// IMPORTANTE: localStorage es local a cada navegador/dispositivo. Si varias
// personas cuentan desde equipos distintos, cada una verá solo lo que se
// cargó o contó en su propio dispositivo, a menos que conectes un backend
// compartido (ver README.md, sección "Siguiente paso: datos compartidos").

const STOCK_KEY = 'inventario_stock_v1'
const CONTEOS_KEY = 'inventario_conteos_v1'
const TIENDA_KEY = 'inventario_tienda_activa_v1'

function leer(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function escribir(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function limpiarCodigo(codigo) {
  if (codigo === null || codigo === undefined) return ''
  return String(codigo).trim().replace(/[\n\r]/g, '')
}

export function getStock() {
  return leer(STOCK_KEY)
}

export function setStock(rows) {
  escribir(STOCK_KEY, rows)
}

export function getConteos() {
  return leer(CONTEOS_KEY)
}

export function setConteos(rows) {
  escribir(CONTEOS_KEY, rows)
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

export function upsertStockRow(stock, row) {
  const sinDuplicado = stock.filter((r) => r.codigo !== row.codigo)
  return [...sinDuplicado, row]
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

export function toCSV(rows, columns) {
  const header = columns.join(',')
  const body = rows
    .map((r) =>
      columns
        .map((c) => {
          const val = r[c] ?? ''
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

export const AREAS = ['Farmacia', 'Cajas', 'Pasillos', 'Equipos médicos']
