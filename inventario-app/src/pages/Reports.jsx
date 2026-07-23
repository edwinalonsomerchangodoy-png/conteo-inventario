import { useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { Card, Eyebrow, Badge } from '../components/ui.jsx'
import { descargarExcel } from '../lib/storage.js'
import { borrarTodosLosConteos } from '../lib/db.js'

const COLUMNAS = [
  'fecha',
  'usuario',
  'tienda',
  'codigo',
  'producto',
  'area',
  'categoria',
  'proveedor',
  'stock_sistema',
  'conteo_1',
  'conteo_2',
  'conteo_fisico',
  'diferencia',
  'estado',
]

// Los conteos guardados antes de que existiera el flujo de reconteo no
// tienen "estado": se les asigna uno razonable para no romper el reporte.
function estadoDe(c) {
  if (c.estado) return c.estado
  return Number(c.diferencia) === 0 ? 'ok' : 'confirmado'
}

function badgeInfo(c) {
  const estado = estadoDe(c)
  const dif = Number(c.diferencia)
  const difTexto = dif !== 0 ? ` (${dif > 0 ? '+' : ''}${dif})` : ''

  switch (estado) {
    case 'ok':
      return { tone: 'ok', label: 'Correcto' }
    case 'pendiente_reconteo':
      return { tone: 'pending', label: 'Pendiente de reconteo' }
    case 'revisar':
      return { tone: 'flag', label: `Revisar (1º:${c.conteo_1} · 2º:${c.conteo_2})` }
    case 'confirmado':
    default:
      return { tone: Math.abs(dif) <= 2 ? 'warn' : 'bad', label: `Confirmado${difTexto}` }
  }
}

export default function Reports({ conteos, onRecargar }) {
  const [borrando, setBorrando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const resumen = useMemo(() => {
    const estados = conteos.map(estadoDe)
    return {
      total: conteos.length,
      correctos: estados.filter((e) => e === 'ok').length,
      pendientes: estados.filter((e) => e === 'pendiente_reconteo').length,
      confirmados: estados.filter((e) => e === 'confirmado').length,
      revisar: estados.filter((e) => e === 'revisar').length,
    }
  }, [conteos])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Eyebrow>Gerencia · 04</Eyebrow>
          <h1 className="text-2xl font-display font-bold">Reporte de diferencias</h1>
          <p className="text-slate-soft text-sm mt-1">
            Las diferencias solo cuentan como confirmadas después de un reconteo que coincida con
            el primer conteo.
          </p>
        </div>
        {conteos.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={onRecargar}
              className="inline-flex items-center gap-2 border border-black/10 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-black/5 transition-colors"
            >
              <RefreshCw size={16} />
              Actualizar
            </button>
            <button
              onClick={async () => {
                setExportando(true)
                try {
                  await descargarExcel('reporte_conteos.xlsx', conteos, COLUMNAS, 'Conteos')
                } finally {
                  setExportando(false)
                }
              }}
              disabled={exportando}
              className="inline-flex items-center gap-2 bg-ink text-paper px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ink-soft transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              {exportando ? 'Generando...' : 'Descargar Excel'}
            </button>
            <button
              onClick={async () => {
                if (confirm('¿Borrar todo el historial de conteos de todas las tiendas? Esta acción no se puede deshacer.')) {
                  setBorrando(true)
                  await borrarTodosLosConteos()
                  await onRecargar()
                  setBorrando(false)
                }
              }}
              disabled={borrando}
              className="inline-flex items-center gap-2 border border-bad/30 text-bad px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-bad/10 transition-colors disabled:opacity-50"
            >
              {borrando ? 'Borrando...' : 'Borrar historial'}
            </button>
          </div>
        )}
      </div>

      {conteos.length === 0 ? (
        <Card className="p-10 text-center text-slate-soft text-sm">
          No hay conteos registrados todavía. Los conteos aparecerán aquí en cuanto se registre el
          primero en la sección "Conteo físico".
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card className="p-4">
              <p className="text-xs text-slate-soft">Total</p>
              <p className="text-2xl font-display font-bold code-tag">{resumen.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-soft">Correctos</p>
              <p className="text-2xl font-display font-bold code-tag text-ok">{resumen.correctos}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-soft">Pendientes reconteo</p>
              <p className="text-2xl font-display font-bold code-tag text-signal-dim">
                {resumen.pendientes}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-soft">Confirmadas</p>
              <p className="text-2xl font-display font-bold code-tag text-bad">
                {resumen.confirmados}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-soft">A revisar</p>
              <p className="text-2xl font-display font-bold code-tag text-purple-700">
                {resumen.revisar}
              </p>
            </Card>
          </div>

          {resumen.pendientes > 0 && (
            <div className="text-xs text-signal-dim bg-signal/10 border border-signal/30 rounded-lg px-4 py-3">
              Hay {resumen.pendientes} producto(s) con diferencia esperando reconteo de
              confirmación en la sección "Conteo físico".
            </div>
          )}

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm data-table">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3">Fecha</th>
                    <th className="text-left px-4 py-3">Usuario</th>
                    <th className="text-left px-4 py-3">Tienda</th>
                    <th className="text-left px-4 py-3">Código</th>
                    <th className="text-left px-4 py-3">Producto</th>
                    <th className="text-left px-4 py-3">Área</th>
                    <th className="text-left px-4 py-3">Categoría</th>
                    <th className="text-left px-4 py-3">Proveedor</th>
                    <th className="text-right px-4 py-3">Sistema</th>
                    <th className="text-right px-4 py-3">Físico</th>
                    <th className="text-right px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {[...conteos].reverse().map((c, i) => {
                    const badge = badgeInfo(c)
                    return (
                      <tr key={i}>
                        <td className="px-4 py-3 text-slate-soft whitespace-nowrap">{c.fecha}</td>
                        <td className="px-4 py-3">{c.usuario}</td>
                        <td className="px-4 py-3 text-slate-soft">{c.tienda}</td>
                        <td className="px-4 py-3 code-tag">{c.codigo}</td>
                        <td className="px-4 py-3">{c.producto}</td>
                        <td className="px-4 py-3 text-slate-soft">{c.area}</td>
                        <td className="px-4 py-3 text-slate-soft">{c.categoria}</td>
                        <td className="px-4 py-3 text-slate-soft">{c.proveedor}</td>
                        <td className="px-4 py-3 text-right code-tag">{c.stock_sistema}</td>
                        <td className="px-4 py-3 text-right code-tag">{c.conteo_fisico}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge tone={badge.tone}>{badge.label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
