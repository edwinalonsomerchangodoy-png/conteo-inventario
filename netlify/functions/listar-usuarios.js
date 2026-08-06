const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization
  const token = authHeader ? authHeader.replace('Bearer ', '') : null
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Falta autenticación' }) }
  }

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en Netlify' }),
    }
  }

  const admin = createClient(url, serviceKey)

  const { data: quienLlama, error: errorQuienLlama } = await admin.auth.getUser(token)
  if (errorQuienLlama || !quienLlama?.user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Sesión inválida' }) }
  }
  if (quienLlama.user.user_metadata?.role !== 'admin') {
    return { statusCode: 403, body: JSON.stringify({ error: 'Solo un administrador puede ver esta lista' }) }
  }

  const { data, error } = await admin.auth.admin.listUsers()
  if (error) {
    return { statusCode: 400, body: JSON.stringify({ error: error.message }) }
  }

  const usuarios = data.users
    .map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.user_metadata?.full_name || '',
      role: u.user_metadata?.role || 'colaborador',
      created_at: u.created_at,
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return { statusCode: 200, body: JSON.stringify({ usuarios }) }
}
