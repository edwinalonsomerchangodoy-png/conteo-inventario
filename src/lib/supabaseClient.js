import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Esto solo debería verse en desarrollo si falta configurar el archivo .env
  console.warn(
    '[Supabase] Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. Revisa el archivo .env (local) o las variables de entorno del sitio en Netlify.'
  )
}

export const supabase = createClient(url || '', anonKey || '')
