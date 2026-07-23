const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) }
  }

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

  // Verificar quién llama y que sea administrador
  const { data: quienLlama, error: errorQuienLlama } = await admin.auth.getUser(token)
  if (errorQuienLlama || !quienLlama?.user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Sesión inválida' }) }
  }
  const esAdmin = quienLlama.user.user_metadata?.role === 'admin'
  if (!esAdmin) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Solo un administrador puede crear colaboradores' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Cuerpo de la solicitud inválido' }) }
  }

  const { email, password, full_name: nombreCompleto, role } = payload
  if (!email || !password || !nombreCompleto) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos: correo, contraseña o nombre' }) }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: nombreCompleto,
      role: role === 'admin' ? 'admin' : 'colaborador',
    },
  })

  if (error) {
    return { statusCode: 400, body: JSON.stringify({ error: error.message }) }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, usuario: { id: data.user.id, email: data.user.email } }),
  }
}
