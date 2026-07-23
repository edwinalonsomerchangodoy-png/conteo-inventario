import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from 'recharts'
import { Card, Eyebrow } from '../components/ui.jsx'

const COLORES = {
  ok: '#2E7D5B',
  diferencia: '#C1443A',
  pendiente: '#E39D14',
  revisar: '#7C3AED',
  neutral: '#D8D6CF',
}

function estadoDe(c) {
  return c.estado || (Number(c.diferencia) === 0 ? 'ok' : 'confirmado')
}

function agruparPorDimension(conteos, campo, topN = 8) {
  const mapa = new Map()
  conteos.forEach((c) => {
    const clave = (c[campo] || '').toString().trim() || 'Sin dato'
    if (!mapa.has(clave)) mapa.set(clave, { nombre: clave, correctos: 0, diferencias: 0 })
    const entrada = mapa.get(clave)
    const estado = estadoDe(c)
    if (estado === 'ok') entrada.correctos += 1
    else if (estado === 'confirmado' || estado === 'revisar') entrada.diferencias += 1
  })
  return [...mapa.values()]
    .map((e) => ({ ...e, total: e.correctos + e.diferencias }))
    .sort((a, b) => b.total - a.total)
    .slice(0, topN)
}

export default function Dashboard({ stock, conteos, tiendaActiva, listaActiva }) {
  const universoSet = useMemo(() => {
    if (listaActiva) return new Set(listaActiva.codigos)
    return new Set(stock.map((s) => s.codigo))
  }, [stock, listaActiva])

  const conteosValidos = useMemo(
    () =>
      conteos.filter(
        (c) =>
          (c.tienda || '') === (tiendaActiva || '') &&
          c.producto !== 'NO REGISTRADO' &&
          universoSet.has(c.codigo)
      ),
    [conteos, tiendaActiva, universoSet]
  )

  const totalUniverso = universoSet.size
  const contados = useMemo(() => new Set(conteosValidos.map((c) => c.codigo)).size, [conteosValidos])
  const pendientesPorContar = Math.max(totalUniverso - contados, 0)
  const avance = totalUniverso > 0 ? Math.round((contados / totalUniverso) * 100) : 0

  const resumenEstados = useMemo(() => {
    const estados = conteosValidos.map(estadoDe)
    return {
      correctos: estados.filter((e) => e === 'ok').length,
      pendientesReconteo: estados.filter((e) => e === 'pendiente_reconteo').length,
      confirmados: estados.filter((e) => e === 'confirmado').length,
      revisar: estados.filter((e) => e === 'revisar').length,
    }
  }, [conteosValidos])

  const dataAvance = [
    { name: 'Contados', value: contados },
    { name: 'Sin contar', value: pendientesPorContar },
  ]

  const porArea = useMemo(() => agruparPorDimension(conteosValidos, 'area'), [conteosValidos])
  const porCategoria = useMemo(() => agruparPorDimension(conteosValidos, 'categoria'), [conteosValidos])
  const porProveedor = useMemo(() => agruparPorDimension(conteosValidos, 'proveedor'), [conteosValidos])

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Gerencia · 05</Eyebrow>
        <h1 className="text-2xl font-display font-bold">Dashboard de avance</h1>
        <p className="text-slate-soft text-sm mt-1">
          Seguimiento del conteo {listaActiva ? `— lista selectiva "${listaActiva.nombre}"` : 'completo de la tienda'}
          {tiendaActiva && (
            <>
              {' '}
              en <span className="code-tag text-signal-dim font-medium">{tiendaActiva}</span>
            </>
          )}
          .
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-slate-soft">Universo a contar</p>
          <p className="text-2xl font-display font-bold code-tag">{totalUniverso}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-soft">Contados</p>
          <p className="text-2xl font-display font-bold code-tag text-ok">{contados}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-soft">Avance</p>
          <p className="text-2xl font-display font-bold code-tag text-signal-dim">{avance}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-soft">Diferencias confirmadas</p>
          <p className="text-2xl font-display font-bold code-tag text-bad">
            {resumenEstados.confirmados + resumenEstados.revisar}
          </p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-sm font-medium mb-1">Avance del conteo</p>
          <p className="text-xs text-slate-soft mb-3">Referencias ya contadas vs. las que faltan</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={dataAvance}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                label={({ name, value, percent }) => `${name}: ${value} (${Math.round(percent * 100)}%)`}
              >
                <Cell fill={COLORES.ok} />
                <Cell fill={COLORES.neutral} />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium mb-1">Estado de los conteos realizados</p>
          <p className="text-xs text-slate-soft mb-3">Correctos, pendientes, confirmados y a revisar</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={[
                { name: 'Correctos', value: resumenEstados.correctos, fill: COLORES.ok },
                { name: 'Pend. reconteo', value: resumenEstados.pendientesReconteo, fill: COLORES.pendiente },
                { name: 'Confirmadas', value: resumenEstados.confirmados, fill: COLORES.diferencia },
                { name: 'A revisar', value: resumenEstados.revisar, fill: COLORES.revisar },
              ]}
              margin={{ top: 24, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="value" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <GraficoDimension titulo="Diferencias por área (Mundo)" datos={porArea} />
      <GraficoDimension titulo="Diferencias por categoría (línea)" datos={porCategoria} />
      <GraficoDimension titulo="Diferencias por proveedor" datos={porProveedor} />
    </div>
  )
}

function GraficoDimension({ titulo, datos }) {
  if (datos.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-sm font-medium mb-1">{titulo}</p>
        <p className="text-sm text-slate-soft mt-2">
          Aún no hay conteos suficientes para mostrar este desglose.
        </p>
      </Card>
    )
  }
  const altura = Math.max(datos.length * 42, 160)
  return (
    <Card className="p-5">
      <p className="text-sm font-medium mb-1">{titulo}</p>
      <p className="text-xs text-slate-soft mb-3">Correctos vs. diferencias, top {datos.length}</p>
      <ResponsiveContainer width="100%" height={altura}>
        <BarChart data={datos} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="nombre" width={170} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="correctos" stackId="a" fill={COLORES.ok} name="Correctos" />
          <Bar dataKey="diferencias" stackId="a" fill={COLORES.diferencia} name="Diferencias" radius={[0, 6, 6, 0]}>
            <LabelList dataKey="total" position="right" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
