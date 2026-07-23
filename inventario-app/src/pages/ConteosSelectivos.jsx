import { useEffect, useMemo, useState } from 'react'
import { ListFilter, Trash2, Play } from 'lucide-react'
import { Card, Eyebrow, Field, inputClass, Badge } from '../components/ui.jsx'
import { getListasConteo, crearListaConteo, eliminarListaConteo } from '../lib/db.js'

const METODOS = [
  { id: 'area', label: 'Por área (Mundo)' },
  { id: 'categoria', label: 'Por categoría (línea)' },
  { id: 'proveedor', label: 'Por proveedor' },
  { id: 'manual', label: 'Pegar lista de códigos' },
]

function valoresUnicos(stock, campo) {
  const set = new Set()
  stock.forEach((r) => {
    const v = (r[campo] || '').trim()
    if (v) set.add(v)
  })
  return [...set].sort()
}

export default function ConteosSelectivos({ stock, tiendaActiva, usuario, listaActivaId, onCambiarLista }) {
  const [listas, setListas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [metodo, setMetodo] = useState('area')
  const [valorSeleccionado, setValorSeleccionado] = useState('')
  const [codigosManual, setCodigosManual] = useState('')
  const [nombre, setNombre] = useState('')
  const [creando, setCreando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const areas = useMemo(() => valoresUnicos(stock, 'area'), [stock])
  const categorias = useMemo(() => valoresUnicos(stock, 'categoria'), [stock])
  const proveedores = useMemo(() => valoresUnicos(stock, 'proveedor'), [stock])

  const cargarListas = async () => {
    if (!tiendaActiva) {
      setListas([])
      setCargando(false)
      return
    }
    setCargando(true)
    try {
      setListas(await getListasConteo(tiendaActiva))
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarListas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiendaActiva])

  const previaCodigos = useMemo(() => {
    if (metodo === 'manual') {
      return codigosManual
        .split(/[\n,;]+/)
        .map((c) => c.trim())
        .filter((c) => c)
    }
    if (!valorSeleccionado) return []
    return stock.filter((r) => (r[metodo] || '').trim() === valorSeleccionado).map((r) => r.codigo)
  }, [metodo, valorSeleccionado, codigosManual, stock])

  const crear = async (e) => {
    e.preventDefault()
    if (!tiendaActiva || previaCodigos.length === 0 || !nombre.trim()) return
    setCreando(true)
    setMensaje(null)
    try {
      await crearListaConteo({
        nombre: nombre.trim(),
        tienda: tiendaActiva,
        codigos: [...new Set(previaCodigos)],
        creadoPor: usuario,
      })
      setMensaje({ tono: 'ok', texto: `Lista "${nombre.trim()}" creada con ${previaCodigos.length} referencias.` })
      setNombre('')
      setValorSeleccionado('')
      setCodigosManual('')
      cargarListas()
    } catch (err) {
      console.error(err)
      setMensaje({ tono: 'bad', texto: 'No se pudo crear la lista. Intenta de nuevo.' })
    } finally {
      setCreando(false)
    }
  }

  const eliminar = async (id) => {
    if (id === listaActivaId) onCambiarLista(null)
    await eliminarListaConteo(id)
    cargarListas()
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Admin · 06</Eyebrow>
        <h1 className="text-2xl font-display font-bold">Conteos selectivos</h1>
        <p className="text-slate-soft text-sm mt-1">
          Crea listas de solo algunas referencias (por área, categoría, proveedor, o pegando
          códigos puntuales) para contar sin tener que revisar toda la tienda.
        </p>
      </div>

      {!tiendaActiva ? (
        <Card className="p-6 text-sm text-warn">
          Elige primero una tienda activa en "Carga inicial desde Excel".
        </Card>
      ) : (
        <>
          <Card className="p-6 space-y-4">
            <Field label="Nombre de la lista">
              <input
                className={inputClass}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Conteo cíclico farmacia — julio"
              />
            </Field>

            <div>
              <label className="block text-xs font-medium text-slate-soft mb-1.5">
                Cómo eliges las referencias
              </label>
              <div className="flex flex-wrap gap-2">
                {METODOS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMetodo(m.id)
                      setValorSeleccionado('')
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      metodo === m.id
                        ? 'bg-ink text-paper border-ink'
                        : 'border-black/10 text-slate-soft hover:bg-black/5'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {metodo !== 'manual' ? (
              <Field
                label={
                  metodo === 'area'
                    ? 'Área'
                    : metodo === 'categoria'
                      ? 'Categoría'
                      : 'Proveedor'
                }
              >
                <select
                  className={inputClass}
                  value={valorSeleccionado}
                  onChange={(e) => setValorSeleccionado(e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  {(metodo === 'area' ? areas : metodo === 'categoria' ? categorias : proveedores).map(
                    (v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    )
                  )}
                </select>
              </Field>
            ) : (
              <Field label="Pega los códigos (uno por línea, o separados por coma)">
                <textarea
                  className={`${inputClass} font-mono text-xs h-28`}
                  value={codigosManual}
                  onChange={(e) => setCodigosManual(e.target.value)}
                  placeholder={'7891234567890\n7891234567891\n...'}
                />
              </Field>
            )}

            <div className="flex items-center gap-3">
              <p className="text-xs text-slate-soft">
                Referencias que incluiría esta lista:{' '}
                <span className="code-tag font-semibold text-ink">{previaCodigos.length}</span>
              </p>
            </div>

            <button
              onClick={crear}
              disabled={creando || previaCodigos.length === 0 || !nombre.trim()}
              className="inline-flex items-center gap-2 bg-ink text-paper px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ink-soft transition-colors disabled:opacity-40"
            >
              <ListFilter size={16} />
              {creando ? 'Creando...' : 'Crear lista'}
            </button>
            {mensaje && <Badge tone={mensaje.tono}>{mensaje.texto}</Badge>}
          </Card>

          <div>
            <Eyebrow>Listas de {tiendaActiva}</Eyebrow>
            {cargando ? (
              <p className="text-sm text-slate-soft">Cargando...</p>
            ) : listas.length === 0 ? (
              <Card className="p-8 text-center text-slate-soft text-sm">
                Aún no hay listas de conteo selectivo para esta tienda.
              </Card>
            ) : (
              <div className="space-y-3">
                {listas.map((l) => (
                  <Card key={l.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-medium">{l.nombre}</p>
                      <p className="text-xs text-slate-soft">
                        {l.codigos.length} referencias · creada por {l.creado_por || 'desconocido'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {listaActivaId === l.id ? (
                        <Badge tone="ok">Activa para el conteo</Badge>
                      ) : (
                        <button
                          onClick={() => onCambiarLista(l.id)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-signal-dim hover:underline"
                        >
                          <Play size={14} /> Usar en el conteo
                        </button>
                      )}
                      {listaActivaId === l.id && (
                        <button
                          onClick={() => onCambiarLista(null)}
                          className="text-xs text-slate-soft hover:underline"
                        >
                          Volver a conteo completo
                        </button>
                      )}
                      <button
                        onClick={() => eliminar(l.id)}
                        className="text-slate-soft hover:text-bad transition-colors"
                        title="Eliminar lista"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
