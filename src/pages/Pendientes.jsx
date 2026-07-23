import { useMemo, useState } from 'react'
import { ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card, Eyebrow, inputClass, Badge } from '../components/ui.jsx'
import { construirFilaReconteo } from '../lib/conteoLogic.js'
import { upsertConteo } from '../lib/db.js'

export default function Pendientes({ conteos, tiendaActiva, usuario, onConteoGuardado }) {
  const pendientes = useMemo(
    () =>
      conteos.filter(
        (c) => c.estado === 'pendiente_reconteo' && (c.tienda || '') === (tiendaActiva || '')
      ),
    [conteos, tiendaActiva]
  )

  const [abierto, setAbierto] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const abrir = (codigo) => {
    setAbierto(codigo)
    setCantidad(1)
    setMensaje(null)
  }

  const guardar = async (fila) => {
    setGuardando(true)
    const cantidadNum = Number(cantidad) || 0
    const { fila: nuevaFila, coincide, diferencia } = construirFilaReconteo({
      filaExistente: fila,
      usuario,
      cantidad: cantidadNum,
    })

    try {
      await upsertConteo(nuevaFila)
      setAbierto(null)
      if (coincide) {
        setMensaje(
          diferencia === 0
            ? { tono: 'ok', texto: `${fila.producto}: confirmado, sin diferencia.`, Icon: CheckCircle2 }
            : {
                tono: Math.abs(diferencia) <= 2 ? 'warn' : 'bad',
                texto: `${fila.producto}: diferencia confirmada (${diferencia > 0 ? '+' : ''}${diferencia}).`,
                Icon: AlertTriangle,
              }
        )
      } else {
        setMensaje({
          tono: 'flag',
          texto: `${fila.producto}: los dos conteos no coinciden. Quedó marcado para revisión manual.`,
          Icon: ShieldAlert,
        })
      }
      onConteoGuardado()
    } catch (err) {
      console.error(err)
      setMensaje({ tono: 'bad', texto: 'No se pudo guardar el reconteo. Intenta de nuevo.', Icon: ShieldAlert })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Operación · 03b</Eyebrow>
        <h1 className="text-2xl font-display font-bold">Pendientes de reconteo</h1>
        <p className="text-slate-soft text-sm mt-1">
          Productos con diferencia en el primer conteo, esperando confirmación
          {tiendaActiva && (
            <>
              {' '}
              en <span className="code-tag text-signal font-medium">{tiendaActiva}</span>
            </>
          )}
          . Haz el reconteo aquí mismo — si coincide con el primero, queda confirmado de una vez.
        </p>
      </div>

      {mensaje && (
        <Badge tone={mensaje.tono}>
          <mensaje.Icon size={14} />
          {mensaje.texto}
        </Badge>
      )}

      {pendientes.length === 0 ? (
        <Card className="p-10 text-center text-slate-soft text-sm">
          No hay productos pendientes de reconteo en esta tienda. 🎉
        </Card>
      ) : (
        <div className="space-y-3">
          {pendientes.map((fila) => (
            <Card key={fila.codigo} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs text-slate-soft code-tag tracking-widest uppercase">
                    {fila.area}
                  </p>
                  <p className="font-display font-bold">{fila.producto}</p>
                  <p className="text-xs text-slate-soft mt-0.5">
                    Código: <span className="code-tag">{fila.codigo}</span> · Sistema:{' '}
                    <span className="code-tag">{fila.stock_sistema}</span> · Primer conteo:{' '}
                    <span className="code-tag">{fila.conteo_1}</span>
                  </p>
                </div>
                <Badge tone="pending">
                  <ShieldAlert size={12} /> Pendiente
                </Badge>
              </div>

              {abierto !== fila.codigo ? (
                <button
                  onClick={() => abrir(fila.codigo)}
                  className="mt-3 text-sm font-medium text-signal-dim underline"
                >
                  Hacer reconteo
                </button>
              ) : (
                <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-soft mb-1.5">
                      Reconteo — unidades encontradas
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className={inputClass}
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          guardar(fila)
                        }
                      }}
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => guardar(fila)}
                    disabled={guardando}
                    className="bg-signal text-ink font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-signal-dim transition-colors disabled:opacity-50"
                  >
                    {guardando ? 'Guardando...' : 'Confirmar reconteo'}
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
