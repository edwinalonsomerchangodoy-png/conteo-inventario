# Conteo de Inventario — versión web (React + Vite + Supabase)

App de conteo de inventario con cuentas de colaborador reales y una base de
datos compartida entre todas las tiendas, publicable en Netlify.

## Qué cambió en esta versión

- **Cuentas de usuario reales.** Cada colaborador entra con su correo y
  contraseña. Su nombre completo queda ligado a su cuenta — nunca más se
  escribe a mano en el conteo.
- **Base de datos compartida (Supabase).** El archivo maestro se sube **una
  sola vez** y queda disponible para cualquier colaborador, en cualquier
  tienda, desde cualquier dispositivo, en tiempo real. Ya no depende del
  navegador de cada persona.
- Se conserva todo el flujo anterior: carga de stock, carga desde Excel
  (archivo maestro o simple), conteo físico con reconteo de confirmación, y
  reporte de diferencias.

## Paso 1 — Crear el backend en Supabase (gratis)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita.
2. Clic en **"New Project"**. Elige un nombre, una contraseña para la base de
   datos (guárdala en un lugar seguro, no la necesitarás seguido) y la región
   más cercana a Colombia disponible.
3. Espera 1-2 minutos mientras Supabase prepara el proyecto.
4. En el menú lateral, ve a **SQL Editor** → **New query**. Abre el archivo
   `supabase-setup.sql` que viene en esta carpeta, copia todo su contenido,
   pégalo ahí, y dale clic a **Run**. Esto crea las tablas necesarias — solo
   se hace una vez.
5. Ve a **Project Settings** (ícono de engranaje) → **API**. Copia dos
   valores:
   - **Project URL**
   - **anon public** (la llave pública — no es secreta, está diseñada para
     usarse en el navegador)

## Paso 2 — Crear las cuentas de los colaboradores

1. En Supabase, ve a **Authentication** → **Users** → **Add user** →
   **Create new user**.
2. Escribe el correo y una contraseña para esa persona. Marca "Auto Confirm
   User" para que no necesite confirmar por correo.
3. Antes de guardar (o editando el usuario después), agrega en **User
   Metadata** (formato JSON):
   ```json
   { "full_name": "María Torres" }
   ```
   Ese nombre es el que va a aparecer automáticamente en cada conteo que
   haga esa persona.
4. Repite por cada colaborador que necesite acceso.

## Paso 3 — Configurar la app con tus datos de Supabase

**Para probarlo en tu computador:**

1. Copia el archivo `.env.example` y renómbralo a `.env`.
2. Pega ahí el "Project URL" y el "anon public" que copiaste en el paso 1.
3. Corre:
   ```bash
   npm install
   npm run dev
   ```

**Para publicarlo en Netlify:**

1. Sube esta carpeta a un repositorio de GitHub (recomendado, para que
   Netlify compile automáticamente cada vez que cambies algo).
2. En Netlify: **Add new site** → **Import an existing project** → elige el
   repositorio.
3. Antes de desplegar (o después, en **Site settings → Environment
   variables**), agrega:
   - `VITE_SUPABASE_URL` = tu Project URL
   - `VITE_SUPABASE_ANON_KEY` = tu anon public key
4. Netlify construye el sitio automáticamente (`netlify.toml` ya trae la
   configuración). Cada vez que subas cambios al repositorio, se vuelve a
   publicar solo.

> Si prefieres seguir usando "Netlify Drop" (arrastrar la carpeta `dist/`)
> en vez de GitHub, corre `npm run build` en tu computador después de crear
> el `.env`, y arrastra la carpeta `dist/` generada. Ten en cuenta que sin
> GitHub tendrás que repetir este paso cada vez que quieras publicar un
> cambio.

## Cómo funciona el flujo de trabajo

1. Un administrador sube el archivo maestro (todas las tiendas) en **"Carga
   inicial desde Excel"** — una sola vez, o cada vez que quiera refrescar el
   stock del sistema.
2. Cualquier colaborador, desde cualquier dispositivo, entra con su cuenta,
   va a esa misma pantalla, y elige con qué tienda va a trabajar en su
   turno (esto es solo una preferencia de su sesión, no afecta a nadie más).
3. En **"Conteo físico"** escanea productos. Su nombre ya aparece solo. Si
   un producto da diferencia, la app le pide un reconteo de confirmación
   antes de darla por real.
4. En **"Reporte de diferencias"**, gerencia ve el consolidado de todas las
   tiendas en tiempo real, con las diferencias ya confirmadas separadas de
   las que aún están pendientes de reconteo.

## Estructura del proyecto

```
supabase-setup.sql        # Script SQL para crear las tablas (correr una vez)
.env.example               # Plantilla de variables de entorno
src/
  App.jsx                   # sesión, layout y navegación
  components/
    Login.jsx                 # pantalla de inicio de sesión
    Sidebar.jsx                # menú lateral + usuario + cerrar sesión
    ui.jsx                      # tarjetas, badges, inputs reutilizables
  lib/
    supabaseClient.js            # conexión a Supabase
    db.js                         # todas las consultas (stock, conteos, tiendas)
    maestro.js                     # lector del archivo Excel de múltiples tiendas
    storage.js                      # utilidades varias (no de red)
  pages/
    AdminStock.jsx                   # carga manual de stock
    ExcelUpload.jsx                    # carga masiva desde Excel
    PhysicalCount.jsx                   # conteo físico con reconteo
    Reports.jsx                          # reporte de diferencias
```

## Preguntas frecuentes

**¿El plan gratuito de Supabase alcanza?** Sí, de sobra para este uso: 500MB
de base de datos y 50,000 usuarios activos al mes en el plan gratuito,
muy por encima de lo que un inventario de unas cuantas tiendas necesita.

**¿Qué pasa si alguien olvida su contraseña?** Un administrador puede
restablecerla desde Supabase → Authentication → Users, sin necesitar
correo de recuperación configurado.

**¿Puedo agregar más colaboradores después?** Sí, repite el Paso 2 cuando
quieras — no requiere volver a desplegar la app.
