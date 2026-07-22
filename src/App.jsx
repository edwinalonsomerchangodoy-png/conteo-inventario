import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabaseClient.js'
import Login from './components/Login.jsx'
import Sidebar from './components/Sidebar.jsx'
import AdminStock from './pages/AdminStock.jsx'
import ExcelUpload from './pages/ExcelUpload.jsx'
import PhysicalCount from './pages/PhysicalCount.jsx'
import Reports from './pages/Reports.jsx'
import { getTiendaActiva, setTiendaActiva as persistTiendaActiva } from './lib/storage.js'
import { getStockPorTienda, getConteos as getConteosDb } from './lib/db.js'

export default function App() {
  // undefined = todavía verificando si hay sesión guardada; null = sin sesión
  const [session, setSession] = useState(undefined)
  const [pagina, setPagina] = useState('admin')
  const [stock, setStockState] = useState([])
  const [conteos, setConteosState] = useState([])
  const [tiendaActiva, setTiendaActivaState] = useState('')
  const [cargandoStock, setCargandoStock] = useState(false)

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

  useEffect(() => {
    if (session) cargarStock(tiendaActiva)
  }, [session, tiendaActiva, cargarStock])

  useEffect(() => {
    if (session) cargarConteos()
  }, [session, cargarConteos])

  const setTiendaActiva = (nombre) => {
    setTiendaActivaState(nombre)
    persistTiendaActiva(nombre)
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-paper">
      <Sidebar
        activo={pagina}
        onCambiar={setPagina}
        tiendaActiva={tiendaActiva}
        usuario={usuario}
        onSalir={() => supabase.auth.signOut()}
      />
      <main className="flex-1 px-5 py-8 md:px-10 md:py-10 max-w-5xl">
        {pagina === 'admin' && (
          <AdminStock
            stock={stock}
            tiendaActiva={tiendaActiva}
            cargando={cargandoStock}
            onRecargar={() => cargarStock(tiendaActiva)}
          />
        )}
        {pagina === 'excel' && (
          <ExcelUpload
            tiendaActiva={tiendaActiva}
            onCambiarTienda={setTiendaActiva}
            onCargado={() => cargarStock(tiendaActiva)}
          />
        )}
        {pagina === 'conteo' && (
          <PhysicalCount
            stock={stock}
            conteos={conteos}
            tiendaActiva={tiendaActiva}
            usuario={usuario}
            onConteoGuardado={cargarConteos}
          />
        )}
        {pagina === 'reporte' && <Reports conteos={conteos} onRecargar={cargarConteos} />}
      </main>
    </div>
  )
}
