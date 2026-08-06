import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabaseClient.js'
import Login from './components/Login.jsx'
import Sidebar from './components/Sidebar.jsx'
import AdminStock from './pages/AdminStock.jsx'
import ExcelUpload from './pages/ExcelUpload.jsx'
import ProgramasCiclos from './pages/ProgramasCiclos.jsx'
import PhysicalCount from './pages/PhysicalCount.jsx'
import Pendientes from './pages/Pendientes.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Reports from './pages/Reports.jsx'
import Colaboradores from './pages/Colaboradores.jsx'
import { getTiendaActiva, setTiendaActiva as persistTiendaActiva } from './lib/storage.js'
import {
  getStockPorTienda,
  getConteos as getConteosDb,
  getTiendasDisponibles,
  getProgramasCiclo,
  getConfiguracionCiclo,
  setProgramaActivo as setProgramaActivoDb,
} from './lib/db.js'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [pagina, setPagina] = useState('conteo')
  const [stock, setStockState] = useState([])
  const [conteos, setConteosState] = useState([])
  const [tiendaActiva, setTiendaActivaState] = useState('')
  const [cargandoStock, setCargandoStock] = useState(false)
  const [tiendasDisponibles, setTiendasDisponibles] = useState([])
  const [programas, setProgramas] = useState([])
  const [programaActivoId, setProgramaActivoIdState] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    setTiendaActivaState(getTiendaActiva())
  }, [])

  const cargarStock = useCallback(async (tienda) => {
    if (!tienda) {
      setStockState([])
      return
    }
    setCargandoStock(true)
    try {
      const filas = await getStockPorTienda(tienda)
      setStockState(filas)
    } catch (err) {
      console.error('Error cargando stock', err)
    } finally {
      setCargandoStock(false)
    }
  }, [])

  const cargarConteos = useCallback(async () => {
    try {
      const filas = await getConteosDb()
      setConteosState(filas)
    } catch (err) {
      console.error('Error cargando conteos', err)
    }
  }, [])

  const cargarTiendas = useCallback(async () => {
    try {
      const nombres = await getTiendasDisponibles()
      setTiendasDisponibles(nombres)
    } catch (err) {
      console.error('Error cargando tiendas', err)
    }
  }, [])

  // Los programas de ciclos y cuál está activo son globales (aplican igual
  // a todas las tiendas), por eso se cargan una sola vez a nivel de toda
  // la app, no por tienda.
  const cargarProgramas = useCallback(async () => {
    try {
      const [listaProgramas, config] = await Promise.all([getProgramasCiclo(), getConfiguracionCiclo()])
      setProgramas(listaProgramas)
      setProgramaActivoIdState(config?.programa_activo_id ?? null)
    } catch (err) {
      console.error('Error cargando programas de ciclos', err)
    }
  }, [])

  useEffect(() => {
    if (session) cargarStock(tiendaActiva)
  }, [session, tiendaActiva, cargarStock])

  useEffect(() => {
    if (session) cargarConteos()
  }, [session, cargarConteos])

  useEffect(() => {
    if (session) cargarTiendas()
  }, [session, cargarTiendas])

  useEffect(() => {
    if (session) cargarProgramas()
  }, [session, cargarProgramas])

  const setTiendaActiva = (nombre) => {
    setTiendaActivaState(nombre)
    persistTiendaActiva(nombre)
  }

  const setProgramaActivo = async (id) => {
    setProgramaActivoIdState(id)
    try {
      await setProgramaActivoDb(id)
    } catch (err) {
      console.error('Error activando el programa de ciclo', err)
    }
  }

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-slate-soft text-sm">
        Cargando...
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  const usuario = session.user.user_metadata?.full_name || session.user.email
  const esAdmin = session.user.user_metadata?.role === 'admin'
  const programaActivo = programas.find((p) => p.id === programaActivoId) || null
  const pendientesCount = conteos.filter(
    (c) => c.estado === 'pendiente_reconteo' && (c.tienda || '') === (tiendaActiva || '')
  ).length
  const paginasAdmin = ['admin', 'excel', 'programas', 'colaboradores']
  const paginaActual = !esAdmin && paginasAdmin.includes(pagina) ? 'conteo' : pagina

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-paper">
      <Sidebar
        activo={paginaActual}
        onCambiar={setPagina}
        tiendaActiva={tiendaActiva}
        usuario={usuario}
        esAdmin={esAdmin}
        pendientesCount={pendientesCount}
        onSalir={() => supabase.auth.signOut()}
      />
      <main className="flex-1 min-w-0 px-5 py-8 md:px-10 md:py-10">
        {paginaActual === 'admin' && esAdmin && (
          <AdminStock
            stock={stock}
            tiendaActiva={tiendaActiva}
            cargando={cargandoStock}
            onRecargar={() => cargarStock(tiendaActiva)}
          />
        )}
        {paginaActual === 'excel' && esAdmin && (
          <ExcelUpload
            tiendaActiva={tiendaActiva}
            onCambiarTienda={setTiendaActiva}
            onCargado={() => cargarStock(tiendaActiva)}
            onTiendasActualizadas={cargarTiendas}
          />
        )}
        {paginaActual === 'programas' && esAdmin && (
          <ProgramasCiclos
            stock={stock}
            usuario={usuario}
            programas={programas}
            programaActivoId={programaActivoId}
            onCambiarPrograma={setProgramaActivo}
            onRecargar={cargarProgramas}
          />
        )}
        {paginaActual === 'conteo' && (
          <PhysicalCount
            stock={stock}
            conteos={conteos}
            tiendaActiva={tiendaActiva}
            tiendasDisponibles={tiendasDisponibles}
            onCambiarTienda={setTiendaActiva}
            usuario={usuario}
            programaActivo={programaActivo}
            onConteoGuardado={cargarConteos}
          />
        )}
        {paginaActual === 'pendientes' && (
          <Pendientes
            conteos={conteos}
            tiendaActiva={tiendaActiva}
            usuario={usuario}
            onConteoGuardado={cargarConteos}
          />
        )}
        {paginaActual === 'dashboard' && (
          <Dashboard
            stock={stock}
            conteos={conteos}
            tiendaActiva={tiendaActiva}
            programaActivo={programaActivo}
          />
        )}
        {paginaActual === 'reporte' && <Reports conteos={conteos} onRecargar={cargarConteos} />}
        {paginaActual === 'colaboradores' && esAdmin && (
          <Colaboradores accessToken={session.access_token} />
        )}
      </main>
    </div>
  )
}
