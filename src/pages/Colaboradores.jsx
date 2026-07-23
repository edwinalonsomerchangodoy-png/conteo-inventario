import { useEffect, useState } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { Card, Eyebrow, Field, inputClass, Badge } from '../components/ui.jsx'

async function llamarFuncion(nombre, body, token) {
  const res = await fetch(`/.netlify/functions/${nombre}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body || {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Ocurrió un error inesperado')
  return data
}

export default function Colaboradores({ accessToken }) {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorLista, setErrorLista] = useState(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [esAdmin, setEsAdmin] = useState(false)
  const [creando, setCreando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const cargarUsuarios = async () => {
    setCargando(true)
    setErrorLista(null)
    try {
      const { usuarios } = await llamarFuncion('listar-usuarios', null, accessToken)
      setUsuarios(usuarios)
    } catch (err) {
      setErrorLista(err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarUsuarios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const crear = async (e) => {
    e.preventDefault()
    setCreando(true)
    setMensaje(null)
    try {
      await llamarFuncion(
        'crear-usuario',
        { email, password, full_name: nombre, role: esAdmin ? 'admin' : 'colaborador' },
        accessToken
      )
      setMensaje({ tono: 'ok', texto: `Cuenta creada para ${nombre}` })
      setEmail('')
      setPassword('')
      setNombre('')
      setEsAdmin(false)
      cargarUsuarios()
    } catch (err) {
      setMensaje({ tono: 'bad', texto: err.message })
    } finally {
      setCreando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Admin · 05</Eyebrow>
        <h1 className="text-2xl font-display font-bold">Colaboradores</h1>
        <p className="text-slate-soft text-sm mt-1">
          Crea cuentas para tu equipo directamente desde aquí — ya no hace falta entrar a
          Supabase.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={crear} className="grid sm:grid-cols-2 gap-4">
          <Field label="Nombre completo">
            <input
              className={inputClass}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. María Torres"
              required
            />
          </Field>
          <Field label="Correo">
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Contraseña">
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </Field>
          <label className="flex items-center gap-2 text-sm mt-6 text-slate-soft">
            <input type="checkbox" checked={esAdmin} onChange={(e) => setEsAdmin(e.target.checked)} />
            Es administrador (puede crear otros colaboradores)
          </label>

          <div className="sm:col-span-2 flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={creando}
              className="inline-flex items-center gap-2 bg-ink text-paper px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ink-soft transition-colors disabled:opacity-50"
            >
              <UserPlus size={16} />
              {creando ? 'Creando...' : 'Crear cuenta'}
            </button>
            {mensaje && <Badge tone={mensaje.tono}>{mensaje.texto}</Badge>}
          </div>
        </form>
      </Card>

      <div>
        <Eyebrow>
          <span className="inline-flex items-center gap-1.5">
            <Users size={12} /> Colaboradores registrados
          </span>
        </Eyebrow>
        {errorLista && <p className="text-sm text-bad mb-2">{errorLista}</p>}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Correo</th>
                  <th className="text-left px-4 py-3">Rol</th>
                </tr>
              </thead>
              <tbody>
                {cargando && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-soft text-sm">
                      Cargando...
                    </td>
                  </tr>
                )}
                {!cargando &&
                  usuarios.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3">{u.full_name || '—'}</td>
                      <td className="px-4 py-3 text-slate-soft">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge tone={u.role === 'admin' ? 'pending' : 'neutral'}>
                          {u.role === 'admin' ? 'Administrador' : 'Colaborador'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
