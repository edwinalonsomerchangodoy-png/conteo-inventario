import { useState } from 'react'
import { LogIn, Package } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import { Card, Field, inputClass } from './ui.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  const entrar = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Correo o contraseña incorrectos.')
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <Card className="w-full max-w-sm p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Package size={22} className="text-signal" />
          <div>
            <p className="font-display font-bold leading-none">CONTEO</p>
            <p className="text-[10px] code-tag text-slate-soft tracking-widest">INVENTARIO</p>
          </div>
        </div>

        <div>
          <h1 className="text-lg font-display font-bold">Inicia sesión</h1>
          <p className="text-slate-soft text-sm mt-1">
            Ingresa con la cuenta que te asignó tu administrador.
          </p>
        </div>

        <form onSubmit={entrar} className="space-y-4">
          <Field label="Correo">
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Contraseña">
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>

          {error && <p className="text-xs text-bad">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full flex items-center justify-center gap-2 bg-ink text-paper py-2.5 rounded-lg text-sm font-medium hover:bg-ink-soft transition-colors disabled:opacity-50"
          >
            <LogIn size={16} />
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </Card>
    </div>
  )
}
