# ÓrbiKa — Proyecto base

Plataforma web para la comercialización y revalorización de productos perecibles
en la provincia de Tacna. Este repositorio implementa la arquitectura definida en
el **SAD** (React 18 + Node.js/Express + Supabase). Incluye registro e inicio de
sesión, recuperación completa de contraseña, catálogo con filtros, publicación y
edición de productos, compra, gestión de ventas, cancelación y calificación.

Los otros 10 casos de uso del SRS quedan listos para construirse sobre esta misma
base (ver «Próximos pasos» al final).

```
orbika-app/
├── frontend/     React 18 + Vite + Tailwind CSS (SPA)
├── backend/      API REST en Node.js + Express
└── supabase/     Migración SQL del esquema + datos iniciales
```

## 1. Crea tu proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto nuevo (gratis).
2. Ve a **SQL Editor** y ejecuta, en este orden:
   - `supabase/migrations/001_init_schema.sql`
   - `supabase/migrations/002_security_and_order_transactions.sql`
3. Opcionalmente ejecuta `supabase/seed.sql` para cargar solo las categorías.
4. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key` (para el frontend)
   - `service_role key` (para el backend — **no la compartas**)

## 2. Backend

```bash
cd backend
cp .env.example .env     # pega ahí tu Project URL y tu service_role key
npm install
npm run dev               # http://localhost:4000
```

## 3. Frontend

En otra terminal:

```bash
cd frontend
cp .env.example .env      # pega ahí tu Project URL y tu anon key
npm install
npm run dev                # http://localhost:5173
```

Abre `http://localhost:5173` — ya puedes registrarte como vendedor, publicar un
producto, y registrarte como comprador (en otra pestaña) para comprarlo.

## Datos de demostración

Después de ejecutar ambas migraciones y configurar `backend/.env`:

```bash
cd backend
npm run seed:demo
```

El comando se puede repetir sin duplicar la información. Crea ocho productos,
cinco pedidos y estas cuentas:

- Vendedor: `vendedor@orbika.demo` / `DemoVendedor2026!`
- Comprador: `comprador@orbika.demo` / `DemoComprador2026!`

Estas credenciales son exclusivamente para desarrollo o demostración.

## Pruebas

```bash
cd backend
npm test

cd ../frontend
npm test
npm run build
```

## 4. Abrir en VS Code

```bash
code orbika-app
```

Con dos terminales abiertas dentro de VS Code (`Terminal → Split Terminal`),
corre `npm run dev` en `backend/` y en `frontend/` a la vez.

## Cómo sigue cada capa (para cuando construyas los demás CU)

- **Nueva tabla o cambio de esquema** → agrega un archivo en `supabase/migrations/`
  (ej. `002_favoritos.sql`) y córrelo en el SQL Editor de Supabase.
- **Nuevo endpoint de backend** → `backend/src/services/` (lógica) →
  `backend/src/controllers/` (HTTP) → `backend/src/routes/` (URL) → regístralo
  en `backend/src/server.js`.
- **Nueva pantalla de frontend** → `frontend/src/pages/` → agrégala a las rutas
  en `frontend/src/App.jsx`.

## Próximos pasos (casos de uso aún no implementados)

CU-09 Ver estadísticas de ventas · CU-10 Gestionar usuarios · CU-11 Moderar
productos · CU-12 Generar reportes de impacto · CU-14 Editar perfil · CU-15
Gestionar favoritos · CU-16 Contactar vendedor · CU-18 Reportar producto ·
CU-20 Gestionar categorías · CU-21
Suscribirse a plan premium.

El modelo de datos para todos ellos ya existe en `supabase/migrations/001_init_schema.sql`
(tablas `notificaciones`, `calificaciones`, etc.) — siguiendo el mismo patrón de
servicio → controlador → ruta que ya ves en `producto.service.js` / `pedido.service.js`,
cada uno es un caso de uso más bien acotado.
