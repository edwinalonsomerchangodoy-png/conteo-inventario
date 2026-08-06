import { useMemo, useState } from 'react'
import { RefreshCw, Trash2, Play, Square, Power } from 'lucide-react'
import { Card, Eyebrow, Field, inputClass, Badge } from '../components/ui.jsx'
import { crearProgramaCiclo, actualizarProgramaCiclo, eliminarProgramaCiclo } from '../lib/db.js'

const TIPOS = [
  { id: 'proveedor', label: 'Por proveedor' },
  { id: 'marca', label: 'Por marca' },
  { id: 'categoria', label: 'Por categoría (línea)' },
  { id: 'manual', label: 'Pegar lista de códigos' },
]

function valoresUnicos(stock, campo) {
  const set = new Set()
  stock.forEach((r) => {
    const v = (r[campo] || '').toString().trim()
    if (v) set.add(v)
  })
  return [...set].sort()
}

export default function ProgramasCiclos({ stock, usuario, programas, programaActivoId, onCambiarPrograma, onRecargar }) {
  const [tipo, setTipo] = useState('proveedor')
  const [valorSeleccionado, setValorSeleccionado] = useState('')
  const [codigosManual, setCodigosManual] = useState('')
  const [nombre, setNombre] = useState('')
  const [creando, setCreando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const proveedores = useMemo(() => valoresUnicos(stock, 'proveedor'), [stock])
  const marcas = useMemo(() => valoresUnicos(stock, 'marca'), [stock])
  const categorias = useMemo(() => valoresUnicos(stock, 'categoria'), [stock])

  const opcionesPorTipo = { proveedor: proveedores, marca: marcas, categoria: categorias }

  const previaCodigos = useMemo(() => {
    if (tipo === 'manual') {
      return codigosManual
        .split(/[\n,;]+/)
        .map((c) => c.trim())
        .filter((c) => c)
    }
    if (!valorSeleccionado) return []
    return stock.filter((r) => (r[tipo] || '').toString().trim() === valorSeleccionado).map((r) => r.codigo)
  }, [tipo, valorSeleccionado, codigosManual, stock])

  const crear = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    if (tipo !== 'manual' && !valorSeleccionado) return
    if (tipo === 'manual' && previaCodigos.length === 0) return

    setCreando(true)
    setMensaje(null)
    try {
      await crearProgramaCiclo({
        nombre: nombre.trim(),
        tipo,
        valor: tipo === 'manual' ? null : valorSeleccionado,
        codigos: tipo === 'manual' ? [...new Set(previaCodigos)] : [],
        creadoPor: usuario,
      })
      setMensaje({ tono: 'ok', texto: `Programa "${nombre.trim()}" creado.` })
      setNombre('')
      setValorSeleccionado('')
      setCodigosManual('')
      onRecargar()
    } catch (err) {
      console.error(err)
      setMensaje({ tono: 'bad', texto: 'No se pudo crear el programa. Intenta de nuevo.' })
    } finally {
      setCreando(false)
    }
  }

  const alternarActivo = async (programa) => {
    await actualizarProgramaCiclo(programa.id, { activo: !programa.activo })
    if (programa.activo && programaActivoId === programa.id) {
      // Si se desactiva el que estaba corriendo, se apaga también como activo global.
      onCambiarPrograma(null)
    }
    onRecargar()
  }

  const eliminar = async (programa) => {
    if (!confirm(`¿Eliminar el programa "${programa.nombre}"?`)) return
    if (programaActivoId === programa.id) onCambiarPrograma(null)
    await eliminarProgramaCiclo(programa.id)
    onRecargar()
  }

  const contarReferencias = (programa) => {
    if (programa.tipo === 'manual') return programa.codigos?.length || 0
    return stock.filter((r) => (r[programa.tipo] || '').toString().trim() === programa.valor).length
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Admin · 03</Eyebrow>
        <h1 className="text-2xl font-display font-bold">Programas de ciclos</h1>
        <p className="text-slate-soft text-sm mt-1">
          Define qué se cuenta en cada ciclo (por proveedor, marca, categoría, o una lista puntual
          de códigos). Los programas son centralizados: aplican igual en todas las tiendas, cada
          una resuelve sus propias referencias contra su stock al contar.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <Field label="Nombre del ciclo">
          <input
            className={inputClass}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Alto costo — semanal, Dermocosmética — quincenal"
          />
        </Field>

        <div>
          <label className="block text-xs font-medium text-slate-soft mb-1.5">Qué se cuenta</label>
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTipo(t.id)
                  setValorSeleccionado('')
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  tipo === t.id
                    ? 'bg-brand text-white border-brand'
                    : 'border-black/10 text-slate-soft hover:bg-black/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tipo !== 'manual' ? (
          <Field label={TIPOS.find((t) => t.id === tipo)?.label}>
            <select
              className={inputClass}
              value={valorSeleccionado}
              onChange={(e) => setValorSeleccionado(e.target.value)}
            >
              <option value="">Selecciona...</option>
              {opcionesPorTipo[tipo].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-soft mt-1">
              Opciones tomadas del catálogo de la tienda que tengas activa ahora mismo.
            </p>
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

        <p className="text-xs text-slate-soft">
          Referencias que incluiría este ciclo (en la tienda activa):{' '}
          <span className="code-tag font-semibold text-ink">{previaCodigos.length}</span>
        </p>

        <button
          onClick={crear}
          disabled={creando || !nombre.trim() || (tipo === 'manual' ? previaCodigos.length === 0 : !valorSeleccionado)}
          className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-40"
        >
          <RefreshCw size={16} />
          {creando ? 'Creando...' : 'Crear programa de ciclo'}
        </button>
        {mensaje && <Badge tone={mensaje.tono}>{mensaje.texto}</Badge>}
      </Card>

      <div>
        <Eyebrow>Programas creados</Eyebrow>
        {programas.length === 0 ? (
          <Card className="p-8 text-center text-slate-soft text-sm">
            Aún no hay programas de ciclos. Crea el primero arriba.
          </Card>
        ) : (
          <div className="space-y-3">
            {programas.map((p) => (
              <Card key={p.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{p.nombre}</p>
                    {programaActivoId === p.id && <Badge tone="brand">Activo ahora</Badge>}
                    {!p.activo && <Badge tone="neutral">Desactivado</Badge>}
                  </div>
                  <p className="text-xs text-slate-soft">
                    {TIPOS.find((t) => t.id === p.tipo)?.label}
                    {p.valor ? `: ${p.valor}` : ''} · {contarReferencias(p)} referencias en esta tienda
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => alternarActivo(p)}
                    title={p.activo ? 'Desactivar' : 'Activar'}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-soft hover:text-ink"
                  >
                    <Power size={14} /> {p.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  {p.activo &&
                    (programaActivoId === p.id ? (
                      <button
                        onClick={() => onCambiarPrograma(null)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-bad hover:underline"
                      >
                        <Square size={14} /> Detener ciclo
                      </button>
                    ) : (
                      <button
                        onClick={() => onCambiarPrograma(p.id)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                      >
                        <Play size={14} /> Usar este ciclo ahora
                      </button>
                    ))}
                  <button
                    onClick={() => eliminar(p)}
                    className="text-slate-soft hover:text-bad transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
