import { useMemo, useState } from 'react'
import { Trash2, Save, Search } from 'lucide-react'
import { Card, Eyebrow, Field, inputClass, Badge } from '../components/ui.jsx'
import { limpiarCodigo, AREAS } from '../lib/storage.js'
import { upsertStockManual, eliminarStockFila } from '../lib/db.js'

export default function AdminStock({ stock, tiendaActiva, cargando, onRecargar }) {
  const [codigo, setCodigo] = useState('')
  const [producto, setProducto] = useState('')
  const [area, setArea] = useState('')
  const [cantidad, setCantidad] = useState(0)
  const [focused, setFocused] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)

  const filtrado = useMemo(() => {
    if (!busqueda.trim()) return stock
    const q = busqueda.trim().toLowerCase()
    return stock.filter(
      (r) => String(r.codigo).toLowerCase().includes(q) || String(r.producto).toLowerCase().includes(q)
    )
  }, [stock, busqueda])

  const mostrados = filtrado.slice(0, 200)

  const guardar = async (e) => {
    e.preventDefault()
    const codigoLimpio = limpiarCodigo(codigo)
    if (!codigoLimpio || !tiendaActiva) return

    setGuardando(true)
    try {
      await upsertStockManual({
        codigo: codigoLimpio,
        producto,
        area,
        tienda: tiendaActiva,
        stock_sistema: Number(cantidad) || 0,
      })
      setMensaje(`Stock guardado para ${codigoLimpio}`)
      setCodigo('')
      setProducto('')
      setCantidad(0)
      onRecargar()
      setTimeout(() => setMensaje(null), 2500)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (codigoFila) => {
    await eliminarStockFila(codigoFila, tiendaActiva)
    onRecargar()
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Admin · 01</Eyebrow>
        <h1 className="text-2xl font-display font-bold">Carga de stock del sistema</h1>
        <p className="text-slate-soft text-sm mt-1">
          Registra o actualiza el stock oficial de la tienda activa contra el que se comparará
          cada conteo físico.
        </p>
      </div>

      {!tiendaActiva ? (
        <Card className="p-6 text-sm text-warn">
          Elige primero una tienda activa en "Carga inicial desde Excel" para poder editar su
          stock aquí.
        </Card>
      ) : (
        <Card className="p-6">
          <form onSubmit={guardar} className="grid sm:grid-cols-2 gap-4">
            <Field label="Código del producto (escáner)">
              <div className={`scan-frame ${focused ? 'is-active' : ''}`}>
                <input
                  className={`${inputClass} code-tag`}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="7891234567890"
                  autoComplete="off"
                />
              </div>
            </Field>

            <Field label="Nombre del producto">
              <input
                className={inputClass}
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                placeholder="Ej. Acetaminofén 500mg"
              />
            </Field>

            <Field label="Área / categoría">
              <input
                className={inputClass}
                list="areas-sugeridas"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ej. Farmacia, Consultorio, No farmacéuticos..."
              />
              <datalist id="areas-sugeridas">
                {AREAS.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </Field>

            <Field label="Stock sistema">
              <input
                type="number"
                min={0}
                step={1}
                className={inputClass}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </Field>

            <div className="sm:col-span-2 flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={!codigo || guardando}
                className="inline-flex items-center gap-2 bg-ink text-paper px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ink-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {guardando ? 'Guardando...' : 'Guardar / actualizar'}
              </button>
              {mensaje && <Badge tone="ok">{mensaje}</Badge>}
            </div>
          </form>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Eyebrow>
            Stock actual · {stock.length} referencias
            {tiendaActiva ? ` · ${tiendaActiva}` : ''}
            {cargando ? ' · cargando...' : ''}
          </Eyebrow>
        </div>

        {stock.length > 0 && (
          <div className="relative mb-3 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft" />
            <input
              className={`${inputClass} pl-9`}
              placeholder="Buscar por código o nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        )}

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3">Código</th>
                  <th className="text-left px-4 py-3">Producto</th>
                  <th className="text-left px-4 py-3">Área</th>
                  <th className="text-right px-4 py-3">Stock</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {stock.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-soft text-sm">
                      {tiendaActiva
                        ? 'Aún no hay productos cargados para esta tienda. Usa el formulario de arriba o la carga desde Excel.'
                        : 'Elige una tienda activa para ver su stock.'}
                    </td>
                  </tr>
                )}
                {stock.length > 0 && filtrado.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-soft text-sm">
                      Ningún producto coincide con "{busqueda}".
                    </td>
                  </tr>
                )}
                {mostrados.map((r) => (
                  <tr key={r.codigo}>
                    <td className="px-4 py-3 code-tag">{r.codigo}</td>
                    <td className="px-4 py-3">{r.producto}</td>
                    <td className="px-4 py-3 text-slate-soft">{r.area}</td>
                    <td className="px-4 py-3 text-right code-tag">{r.stock_sistema}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => eliminar(r.codigo)}
                        className="text-slate-soft hover:text-bad transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        {filtrado.length > 200 && (
          <p className="text-xs text-slate-soft mt-2">
            Mostrando las primeras 200 de {filtrado.length} coincidencias. Usa el buscador para
            acotar la lista.
          </p>
        )}
      </div>
    </div>
  )
}
