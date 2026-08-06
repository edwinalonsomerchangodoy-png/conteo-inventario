# Ciclos de Inventario — Locatel

Plataforma de conteo cíclico de inventario: cuentas de colaborador reales,
base de datos compartida entre tiendas, y **programas de ciclos** —
definidos por proveedor, marca, categoría o una lista puntual de códigos —
que aplican centralizadamente a todas las tiendas.

## Qué cambió en esta versión

- **Enfoque en ciclos, no solo conteo completo.** Antes existían "listas de
  conteo selectivo" ligadas a una sola tienda. Ahora son **Programas de
  Ciclos**: se definen una vez (por proveedor, marca, categoría, o pegando
  códigos) y aplican igual en todas las tiendas — cada una resuelve sus
  propias referencias contra su propio stock al momento de contar.
- **Un ciclo activo, compartido por todos.** Un administrador activa un
  ciclo desde "Programas de ciclos", y automáticamente todos los
  colaboradores, en cualquier tienda y dispositivo, lo ven activo en
  "Conteo físico" — sin tener que configurarlo cada uno por su lado.
- **El conteo completo de tienda se mantiene** como opción — si no hay
  ningún ciclo activo, simplemente se cuenta todo con normalidad.
- **Escanear nunca bloquea.** Si un producto ya coincidió con el sistema
  pero sigues encontrando unidades físicas, puedes seguir sumando — la app
  no da por "cerrado" un conteo hasta que tú decidas que lo está.
- **Nueva columna "marca"**, capturada del archivo maestro, para armar
  ciclos y ver el dashboard también por esa dimensión.
- Se conserva todo lo demás: cuentas reales por colaborador, escaneo con
  lector físico o cámara, reconteo de confirmación, dashboard con gráficas,
  reporte exportable a Excel.

## Paso 1 — Base de datos en Supabase

**Si ya tienes un proyecto de Supabase de una versión anterior:**
corre `supabase-migracion-5.sql` en el SQL Editor. Agrega la columna
`marca`, y las tablas `programas_ciclo` y `configuracion_ciclo`. No borra
nada de lo que ya tienes.

**Si es una instalación nueva desde cero:** corre `supabase-setup.sql`
completo (crea todo el esquema).

## Paso 2 — Primer administrador (solo instalaciones nuevas)

En Supabase → Authentication → Users → Add user. En User Metadata:
```json
{ "full_name": "Tu Nombre", "role": "admin" }
```

## Paso 3 — Variables de entorno en Netlify

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (para poder crear colaboradores desde la app)

## Cómo funciona el flujo de un ciclo

1. Un administrador entra a **"Programas de ciclos"**, crea uno (ej. "Alto
   costo — Genfar") eligiendo proveedor, marca, categoría, o pegando
   códigos puntuales.
2. Le da clic a **"Usar este ciclo ahora"** — queda activo para todos.
3. Cualquier colaborador, en cualquier tienda, entra a **"Conteo físico"**
   y ve el ciclo activo arriba, con la lista de qué falta por contar en su
   tienda específica.
4. Cuando terminan, el administrador puede **"Detener ciclo"** o activar
   otro distinto.
5. El conteo completo de tienda sigue disponible en cualquier momento — si
   no hay ningún ciclo activo, simplemente no hay restricción.

## Estructura del proyecto

```
supabase-setup.sql          # Esquema completo (instalación nueva)
supabase-migracion-5.sql     # Migración incremental (ya tienes datos)
netlify/functions/
  crear-usuario.js
  listar-usuarios.js
src/
  App.jsx
  components/
    Login.jsx
    Sidebar.jsx
    LocatelMark.jsx            # Distintivo de texto (temporal, ver nota arriba)
    CameraScanner.jsx
    ui.jsx
  lib/
    supabaseClient.js
    db.js                        # incluye funciones de programas_ciclo
    maestro.js                    # ahora también captura "marca"
    conteoLogic.js
    storage.js
  pages/
    AdminStock.jsx
    ExcelUpload.jsx
    ProgramasCiclos.jsx            # antes "ConteosSelectivos"
    PhysicalCount.jsx
    Pendientes.jsx
    Dashboard.jsx
    Reports.jsx
    Colaboradores.jsx
```
