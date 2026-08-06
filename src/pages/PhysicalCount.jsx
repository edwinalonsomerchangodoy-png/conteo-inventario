import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  PlusCircle,
  RotateCcw,
  ShieldAlert,
  Camera,
  ListChecks,
  Store,
} from 'lucide-react'
import { Card, Eyebrow, Field, inputClass, Badge } from '../components/ui.jsx'
import CameraScanner from '../components/CameraScanner.jsx'
import { limpiarCodigo, buscarPorCodigo } from '../lib/storage.js'
import { upsertConteo, eliminarConteo } from '../lib/db.js'
import { construirFilaPrimero } from '../lib/conteoLogic.js'

export default function PhysicalCount({
  stock,
  conteos,
  tiendaActiva,
  tiendasDisponibles,
  onCambiarTienda,
  usuario,
  programaActivo,
  onConteoGuardado,
}) {
  const [codigo, setCodigo] = useState('')
  const [cantidadEscaneo, setCantidadEscaneo] = useState(1)
  const [focused, setFocused] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mostrarCamara, setMostrarCamara] = useState(false)
  const [autoGuardar, setAutoGuardar] = useState(false)
  const inputCodigoRef = useRef(null)

  const codigoLimpio = limpiarCodigo(codigo)
  const producto = codigoLimpio ? buscarPorCodigo(stock, codigoLimpio) : null
  const codigoCanonico = producto ? producto.codigo : codigoLimpio

  useEffect(() => {
    setCantidadEscaneo(1)
  }, [codigoLimpio])

  const filaExistente = codigoCanonico
    ? conteos.find((c) => c.codigo === codigoCanonico && (c.tienda || '') === (tiendaActiva || ''))
    : null

  // El programa de ciclo activo define QUÉ contar (por proveedor, marca,
  // categoría, o una lista manual de códigos) — es el mismo para todas las
  // tiendas; cada una resuelve las referencias contra su propio stock.
  const codigosDelPrograma = useMemo(() => {
    if (!programaActivo) return null
    if (programaActivo.tipo === 'manual') return programaActivo.codigos || []
    return stock
      .filter((r) => (r[programaActivo.tipo] || '').toString().trim() === programaActivo.valor)
      .map((r) => r.codigo)
  }, [programaActivo, stock])

  const codigosContados = useMemo(() => {
    return new Set(
      conteos
        .filter((c) => (c.tienda || '') === (tiendaActiva || '') && c.producto !== 'NO REGISTRADO')
        .map((c) => c.codigo)
    )
  }, [conteos, tiendaActiva])

  const pendientesPrograma = useMemo(() => {
    if (!codigosDelPrograma) return []
    return codigosDelPrograma
      .map((cod) => {
        const encontrado = buscarPorCodigo(stock, cod)
        const claveComparacion = encontrado ? encontrado.codigo : cod
        return { cod, encontrado, claveComparacion }
      })
      .filter(({ claveComparacion }) => !codigosContados.has(claveComparacion))
      .map(
        ({ cod, encontrado }) =>
          encontrado || { codigo: cod, producto: 'No encontrado en el catálogo de esta tienda', area: '—' }
      )
  }, [codigosDelPrograma, codigosContados, stock])

  const guardarConteo = async () => {
    if (!producto) return
    setGuardando(true)
    const cantidad = Number(cantidadEscaneo) || 0

    // Escanear siempre suma al total ya contado — sin importar si antes
    // quedó marcado como correcto, pendiente de reconteo, o confirmado. Así
    // nunca se bloquea la posibilidad de encontrar sobrantes.
    const { fila, estado } = construirFilaPrimero({
      producto,
      codigoLimpio: codigoCanonico,
      tiendaActiva,
      usuario,
      filaExistente,
      cantidad,
      programaCiclo: programaActivo?.nombre || null,
    })

    const mensaje =
      estado === 'ok'
        ? { tono: 'ok', texto: 'Conteo correcto', Icon: CheckCircle2 }
        : {
            tono: 'pending',
            texto: 'Diferencia detectada — queda pendiente de reconteo de confirmación',
            Icon: ShieldAlert,
          }

    try {
      await upsertConteo(fila)
      setResultado(mensaje)
      setCodigo('')
      inputCodigoRef.current?.focus()
      onConteoGuardado()
    } catch (err) {
      console.error(err)
      setResultado({ tono: 'bad', texto: 'No se pudo guardar el conteo. Intenta de nuevo.', Icon: XCircle })
    } finally {
      setGuardando(false)
    }
  }

  const registrarNoEncontrado = async () => {
    const intento = {
      fecha: new Date().toISOString(),
      usuario,
      tienda: tiendaActiva || '',
      codigo: codigoLimpio,
      producto: 'NO REGISTRADO',
      area: '',
      conteo_1: 0,
      conteo_2: null,
      conteo_fisico: 0,
      diferencia: 0,
      estado: 'ok',
    }
    await upsertConteo(intento)
    setCodigo('')
    inputCodigoRef.current?.focus()
    onConteoGuardado()
  }

  const reiniciarConteo = async () => {
    if (!filaExistente) return
    if (!confirm('¿Borrar el conteo guardado de este producto y empezar de nuevo?')) return
    await eliminarConteo(filaExistente.codigo, filaExistente.tienda)
    setResultado(null)
    onConteoGuardado()
  }

  useEffect(() => {
    if (autoGuardar && producto) {
      setAutoGuardar(false)
      guardarConteo()
    } else if (autoGuardar && !producto && codigoLimpio) {
      setAutoGuardar(false)
      registrarNoEncontrado()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGuardar, producto])

  const manejarCodigoDetectado = (texto) => {
    setMostrarCamara(false)
    setCodigo(texto)
    setResultado(null)
    setAutoGuardar(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Operación · 03</Eyebrow>
        <h1 className="text-2xl font-display font-bold">Conteo físico</h1>
        <p className="text-slate-soft text-sm mt-1">
          Escanea el código de cada producto. Cada escaneo suma al total — puedes seguir contando
          el mismo producto todas las veces que encuentres unidades físicas, incluso si ya
          coincidió con el sistema antes.
        </p>
        <p className="text-xs mt-2">
          Contando como: <span className="font-medium text-signal">{usuario}</span>
        </p>
        {programaActivo ? (
          <p className="text-xs mt-2 bg-brand/10 border border-brand/30 rounded-md px-3 py-2 inline-block">
            Ciclo activo: <span className="font-medium text-brand">{programaActivo.nombre}</span>
            {codigosDelPrograma && ` (${codigosDelPrograma.length} referencias en esta tienda)`}
          </p>
        ) : (
          <p className="text-xs mt-2 text-slate-soft">
            No hay ningún ciclo activo — estás haciendo conteo completo de la tienda.
          </p>
        )}
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Store size={16} className="text-signal-dim shrink-0" />
          <label className="text-xs font-medium text-slate-soft shrink-0">Tienda:</label>
          {tiendasDisponibles && tiendasDisponibles.length > 0 ? (
            <select
              className={`${inputClass} max-w-xs`}
              value={tiendaActiva}
              onChange={(e) => onCambiarTienda(e.target.value)}
            >
              <option value="">Selecciona una tienda...</option>
              {tiendasDisponibles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-warn">
              Todavía no hay tiendas cargadas. Pídele a un administrador que suba el archivo de
              stock.
            </p>
          )}
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <Field label="Escanea el código del producto">
          <div className={`scan-frame ${focused ? 'is-active' : ''} flex items-stretch gap-2`}>
            <input
              ref={inputCodigoRef}
              className={`${inputClass} code-tag text-base flex-1`}
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value)
                setResultado(null)
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                if (!codigoLimpio) return
                if (producto) {
                  guardarConteo()
                } else {
                  registrarNoEncontrado()
                }
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="7891234567890"
              autoComplete="off"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setMostrarCamara(true)}
              title="Escanear con la cámara"
              className="shrink-0 px-3 rounded-lg border border-black/10 text-slate-soft hover:text-signal-dim hover:border-signal/40 transition-colors"
            >
              <Camera size={18} />
            </button>
          </div>
        </Field>

        {mostrarCamara && (
          <CameraScanner onDetectado={manejarCodigoDetectado} onCerrar={() => setMostrarCamara(false)} />
        )}

        {codigoLimpio && producto && (
          <div className="rounded-lg bg-ink text-paper p-4 space-y-1.5">
            <p className="text-xs text-slate-soft code-tag tracking-widest uppercase">
              {producto.area}
            </p>
            <p className="text-lg font-display font-bold">{producto.producto}</p>
            <p className="text-sm">
              Stock sistema:{' '}
              <span className="code-tag text-signal font-semibold">{producto.stock_sistema}</span>{' '}
              🔒
            </p>

            {programaActivo &&
              codigosDelPrograma &&
              !codigosDelPrograma.includes(producto.codigo) &&
              !(producto.alt_codigos || []).some((c) => codigosDelPrograma.includes(c)) && (
                <p className="text-xs text-signal bg-signal/10 border border-signal/30 rounded-md px-2.5 py-1.5 mt-1">
                  Este producto no pertenece al ciclo activo, pero el conteo se guardará igual.
                </p>
              )}

            {filaExistente && (
              <div className="bg-white/10 rounded-md p-3 mt-2 space-y-1">
                <p className="text-xs text-paper/80">
                  Ya llevas contado: <span className="code-tag">{filaExistente.conteo_fisico}</span>{' '}
                  ({etiquetaEstado(filaExistente.estado)})
                </p>
                <button
                  onClick={reiniciarConteo}
                  className="text-xs underline text-signal flex items-center gap-1 mt-1"
                >
                  <RotateCcw size={12} /> Reiniciar este conteo
                </button>
              </div>
            )}

            <div className="pt-3">
              <Field label="Unidades a sumar en este escaneo">
                <input
                  type="number"
                  min={0}
                  step={1}
                  className={`${inputClass} bg-white`}
                  value={cantidadEscaneo}
                  onChange={(e) => setCantidadEscaneo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      guardarConteo()
                    }
                  }}
                />
              </Field>
              <button
                onClick={guardarConteo}
                disabled={guardando}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-signal text-ink font-semibold py-2.5 rounded-lg text-sm hover:bg-signal-dim transition-colors disabled:opacity-50"
              >
                <PlusCircle size={16} />
                {guardando ? 'Guardando...' : 'Guardar conteo'}
              </button>
            </div>
          </div>
        )}

        {codigoLimpio && !producto && (
          <div className="rounded-lg bg-bad/10 border border-bad/20 p-4 space-y-3">
            <p className="text-sm text-bad font-medium">
              Producto no existe en el stock del sistema
            </p>
            <button
              onClick={registrarNoEncontrado}
              className="text-sm underline text-bad/80 hover:text-bad"
            >
              Registrar el intento para revisión administrativa
            </button>
          </div>
        )}

        {resultado && (
          <Badge tone={resultado.tono}>
            <resultado.Icon size={14} />
            {resultado.texto}
          </Badge>
        )}
      </Card>

      {programaActivo && (
        <Card className="overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <ListChecks size={15} className="text-signal-dim" />
              Por contar de "{programaActivo.nombre}"
            </p>
            {pendientesPrograma.length === 0 ? (
              <Badge tone="ok">Ciclo completo</Badge>
            ) : (
              <Badge tone="pending">
                {pendientesPrograma.length} de {codigosDelPrograma.length} sin contar
              </Badge>
            )}
          </div>

          {pendientesPrograma.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-soft">
              🎉 Ya contaste al menos una vez todos los productos de este ciclo.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-black/5">
              {pendientesPrograma.map((p) => (
                <button
                  key={p.codigo}
                  onClick={() => {
                    setCodigo(p.codigo)
                    setResultado(null)
                    inputCodigoRef.current?.focus()
                  }}
                  className="w-full text-left px-5 py-3 hover:bg-black/[0.03] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.producto}</p>
                    <p className="text-xs text-slate-soft">
                      <span className="code-tag">{p.codigo}</span> · {p.area}
                    </p>
                  </div>
                  <span className="text-xs text-signal-dim shrink-0">Contar →</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

function etiquetaEstado(estado) {
  switch (estado) {
    case 'ok':
      return 'correcto'
    case 'pendiente_reconteo':
      return 'pendiente de reconteo'
    case 'confirmado':
      return 'diferencia confirmada'
    case 'revisar':
      return 'requiere revisión manual'
    default:
      return estado
  }
}
