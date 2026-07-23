import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { UploadCloud, CheckCircle2, XCircle, Store, Loader2 } from 'lucide-react'
import { Card, Eyebrow, inputClass } from '../components/ui.jsx'
import { limpiarCodigo } from '../lib/storage.js'
import { esFormatoMaestro, parseMaestro, extraerStockDeTienda } from '../lib/maestro.js'
import { upsertStockLote, upsertTiendas, getTiendasDisponibles } from '../lib/db.js'

const REQUERIDAS = ['codigo', 'producto', 'area', 'stock_sistema']

export default function ExcelUpload({ tiendaActiva, onCambiarTienda, onCargado }) {
  const [tiendasGuardadas, setTiendasGuardadas] = useState([])
  const [tiendaSeleccion, setTiendaSeleccion] = useState(tiendaActiva || '')
  const [estado, setEstado] = useState(null) // 'ok' | 'error' | 'subiendo'
  const [detalle, setDetalle] = useState('')
  const [progreso, setProgreso] = useState(null) // {actual, total}

  useEffect(() => {
    getTiendasDisponibles()
      .then(setTiendasGuardadas)
      .catch((err) => console.error(err))
  }, [])

  const subirFormatoTidy = async (filasObjeto) => {
    if (!tiendaSeleccion) {
      setEstado('error')
      setDetalle('Este archivo no trae el nombre de la tienda. Escribe o elige una tienda abajo antes de subirlo.')
      return
    }
    if (filasObjeto.length === 0) {
      setEstado('error')
      setDetalle('El archivo está vacío.')
      return
    }
    const columnas = Object.keys(filasObjeto[0]).map((c) => c.trim().toLowerCase())
    const faltantes = REQUERIDAS.filter((r) => !columnas.includes(r))
    if (faltantes.length > 0) {
      setEstado('error')
      setDetalle(`Faltan columnas: ${faltantes.join(', ')}`)
      return
    }
    const normalizado = filasObjeto.map((f) => {
      const entrada = {}
      Object.keys(f).forEach((k) => (entrada[k.trim().toLowerCase()] = f[k]))
      return {
        codigo: limpiarCodigo(entrada.codigo),
        producto: entrada.producto,
        area: entrada.area,
        tienda: tiendaSeleccion,
        stock_sistema: Number(entrada.stock_sistema) || 0,
      }
    })

    await subirLote(normalizado, [tiendaSeleccion])
  }

const subirLote = async (filas, nombresTienda) => {
    setEstado('subiendo')
    setDetalle('Subiendo a la base de datos compartida...')
    setProgreso({ actual: 0, total: filas.length })
    try {
      await upsertTiendas(nombresTienda)
      await upsertStockLote(filas, (actual, total) => setProgreso({ actual, total }))
      const listaActualizada = await getTiendasDisponibles()
      setTiendasGuardadas(listaActualizada)
      setEstado('ok')
      setDetalle(`${filas.length} referencias subidas correctamente para ${nombresTienda.length} tienda(s).`)
      // Si la tienda activa de esta sesión quedó incluida en la subida,
      // refresca el stock en memoria — si no, "Conteo físico" seguiría
      // usando la copia vieja hasta recargar la página.
      if (tiendaActiva && nombresTienda.includes(tiendaActiva)) {
        onCargado()
      }
    } catch (err) {
      console.error(err)
      setEstado('error')
      setDetalle('Ocurrió un error subiendo los datos. Revisa la conexión con Supabase e intenta de nuevo.')
    } finally {
      setProgreso(null)
    }
  }

  const procesarArchivo = async (file) => {
    if (!file) return
    setEstado(null)
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const hoja = wb.Sheets[wb.SheetNames[0]]
    const filasCrudas = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: null })

    if (filasCrudas.length > 1 && esFormatoMaestro(filasCrudas[1])) {
      const datosMaestro = parseMaestro(filasCrudas)
      if (datosMaestro.tiendas.length === 0) {
        setEstado('error')
        setDetalle('Se reconoció el formato maestro pero no se encontró ninguna tienda.')
        return
      }

      // Se explota el archivo ancho (una columna por tienda) a filas largas:
      // una fila por producto x tienda, listas para subir todas de una vez.
      const nombresTienda = datosMaestro.tiendas.map((t) => t.nombre)
      let todasLasFilas = []
      for (const t of datosMaestro.tiendas) {
        todasLasFilas = todasLasFilas.concat(extraerStockDeTienda(datosMaestro, t.nombre))
      }

      await subirLote(todasLasFilas, nombresTienda)
      if (!tiendaSeleccion) setTiendaSeleccion(nombresTienda[0])
      return
    }

    const filasObjeto = XLSX.utils.sheet_to_json(hoja, { defval: '' })
    await subirFormatoTidy(filasObjeto)
  }

  const activarTienda = () => {
    if (!tiendaSeleccion) return
    onCambiarTienda(tiendaSeleccion)
    onCargado()
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Admin · 02</Eyebrow>
        <h1 className="text-2xl font-display font-bold">Carga inicial desde Excel</h1>
        <p className="text-slate-soft text-sm mt-1">
          Sube el archivo maestro con todas las tiendas tal cual lo exportas — se guarda en la
          base de datos compartida de una sola vez, y queda disponible para cualquier
          colaborador en cualquier tienda, sin volver a subirlo.
        </p>
        <p className="text-xs text-slate-soft mt-1">
          Con las 23 tiendas y ~27.000 productos, la primera subida puede tardar varios minutos —
          es normal, se está guardando todo en la base de datos compartida.
        </p>
      </div>

      <Card className="p-8 border-dashed border-2 border-black/10 text-center">
        <label className="cursor-pointer flex flex-col items-center gap-3">
          <UploadCloud size={28} className="text-signal" />
          <span className="text-sm font-medium">Haz clic para elegir tu archivo .xlsx</span>
          <span className="text-xs text-slate-soft">o arrástralo aquí</span>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => procesarArchivo(e.target.files?.[0])}
          />
        </label>
      </Card>

      {estado === 'subiendo' && (
        <div className="flex items-center gap-3 text-sm text-slate-soft">
          <Loader2 size={16} className="animate-spin" />
          {detalle}
          {progreso && (
            <span className="code-tag text-xs">
              {progreso.actual}/{progreso.total}
            </span>
          )}
        </div>
      )}
      {estado === 'error' && (
        <div className="flex items-center gap-2 text-bad text-sm font-medium">
          <XCircle size={16} /> {detalle}
        </div>
      )}
      {estado === 'ok' && (
        <div className="flex items-center gap-2 text-ok text-sm font-medium">
          <CheckCircle2 size={16} /> {detalle}
        </div>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Store size={16} className="text-signal" />
          <p className="text-sm font-medium">Elige la tienda con la que vas a trabajar</p>
        </div>
        {tiendasGuardadas.length === 0 ? (
          <p className="text-xs text-slate-soft">
            Todavía no hay tiendas guardadas. Sube el archivo maestro para verlas aquí.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className={`${inputClass} sm:max-w-xs`}
              value={tiendaSeleccion}
              onChange={(e) => setTiendaSeleccion(e.target.value)}
            >
              <option value="">Selecciona una tienda...</option>
              {tiendasGuardadas.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
            <button
              onClick={activarTienda}
              disabled={!tiendaSeleccion}
              className="bg-ink text-paper px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ink-soft transition-colors disabled:opacity-40"
            >
              Activar esta tienda para mi sesión
            </button>
          </div>
        )}
        <p className="text-xs text-slate-soft">
          "Activar" solo define con qué tienda trabajas tú en este dispositivo — los datos ya
          quedaron guardados para todas las tiendas y todos los colaboradores.
        </p>
      </Card>
    </div>
  )
}
