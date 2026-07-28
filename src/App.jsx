import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabaseClient.js'
import Login from './components/Login.jsx'
import Sidebar from './components/Sidebar.jsx'
import AdminStock from './pages/AdminStock.jsx'
import ExcelUpload from './pages/ExcelUpload.jsx'
import PhysicalCount from './pages/PhysicalCount.jsx'
import Pendientes from './pages/Pendientes.jsx'
import ConteosSelectivos from './pages/ConteosSelectivos.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Reports from './pages/Reports.jsx'
import Colaboradores from './pages/Colaboradores.jsx'
import { getTiendaActiva, setTiendaActiva as persistTiendaActiva } from './lib/storage.js'
import {
  getStockPorTienda,
  getConteos as getConteosDb,
  getListasConteo,
  getTiendaInfo,
  setListaActivaTienda,
  getTiendasDisponibles,
} from './lib/db.js'

export default function App() {
  // undefined = todavía verificando si hay sesión guardada; null = sin sesión
  const [session, setSession] = useState(undefined)
  const [pagina, setPagina] = useState('conteo')
  const [stock, setStockState] = useState([])
  const [conteos, setConteosState] = useState([])
  const [tiendaActiva, setTiendaActivaState] = useState('')
  const [cargandoStock, setCargandoStock] = useState(false)
  const [listasDisponibles, setListasDisponibles] = useState([])
  const [listaActivaId, setListaActivaIdState] = useState(null)
  const [tiendasDisponibles, setTiendasDisponibles] = useState([])

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

  // La lista activa se guarda por tienda en la base de datos (no en el
  // navegador), para que cualquier dispositivo que entre a esa tienda vea
  // automáticamente la misma lista que activó cualquier otro colaborador.
  const cargarListas = useCallback(async (tienda) => {
    if (!tienda) {
      setListasDisponibles([])
      setListaActivaIdState(null)
      return
    }
    try {
      const [filas, tiendaInfo] = await Promise.all([getListasConteo(tienda), getTiendaInfo(tienda)])
      setListasDisponibles(filas)
      setListaActivaIdState(tiendaInfo?.lista_activa_id ?? null)
    } catch (err) {
      console.error('Error cargando listas de conteo', err)
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
    if (session) cargarListas(tiendaActiva)
  }, [session, tiendaActiva, cargarListas])

  const setTiendaActiva = (nombre) => {
    setTiendaActivaState(nombre)
    persistTiendaActiva(nombre)
  }

  const setListaActiva = async (id) => {
    if (!tiendaActiva) return
    setListaActivaIdState(id)
    try {
      await setListaActivaTienda(tiendaActiva, id)
    } catch (err) {
      console.error('Error activando la lista de conteo', err)
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
  const listaActiva = listasDisponibles.find((l) => l.id === listaActivaId) || null
  const pendientesCount = conteos.filter(
    (c) => c.estado === 'pendiente_reconteo' && (c.tienda || '') === (tiendaActiva || '')
  ).length
  const paginasAdmin = ['admin', 'excel', 'selectivos', 'colaboradores']
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
      <main className="flex-1 px-5 py-8 md:px-10 md:py-10 max-w-5xl">
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
        {paginaActual === 'conteo' && (
          <PhysicalCount
            stock={stock}
            conteos={conteos}
            tiendaActiva={tiendaActiva}
            tiendasDisponibles={tiendasDisponibles}
            onCambiarTienda={setTiendaActiva}
            usuario={usuario}
            listaActiva={listaActiva}
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
        {paginaActual === 'selectivos' && esAdmin && (
          <ConteosSelectivos
            stock={stock}
            tiendaActiva={tiendaActiva}
            usuario={usuario}
            listaActivaId={listaActivaId}
            onCambiarLista={setListaActiva}
          />
        )}
        {paginaActual === 'dashboard' && (
          <Dashboard stock={stock} conteos={conteos} tiendaActiva={tiendaActiva} listaActiva={listaActiva} />
        )}
        {paginaActual === 'reporte' && <Reports conteos={conteos} onRecargar={cargarConteos} />}
        {paginaActual === 'colaboradores' && esAdmin && (
          <Colaboradores accessToken={session.access_token} />
        )}
      </main>
    </div>
  )
}
