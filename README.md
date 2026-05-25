# Línea Gentlemen — Reservas

App de reserva de citas para la barbería **Línea Gentlemen**. Next.js 14 (App
Router) · TypeScript · Tailwind · Supabase · Resend.

- Login con Google y perfil obligatorio (nombre, apellidos, teléfono).
- Reserva en 4 pasos: servicio → peluquero → fecha/hora → confirmación.
- 4 peluqueros con calendario independiente, slots de 40 min.
- Horario: L–V 10–14 y 16–20 · Sábado 10–14 · Domingo cerrado.
- "Mis reservas" con cancelación (mín. 2 h de antelación).
- Panel de administración: agenda diaria, estados, bloqueos y peluqueros.

---

## 1. Requisitos

- Node.js 18+ (probado con 24 LTS).
- Una cuenta de [Supabase](https://supabase.com) (gratis).
- (Opcional) Una cuenta de [Resend](https://resend.com) para emails.

## 2. Instalación

```bash
npm install
cp .env.example .env.local   # y rellena los valores
npm run dev
```

Abre http://localhost:3000

## 3. Configurar Supabase

1. Crea un proyecto en Supabase.
2. **SQL Editor → New query**: pega el contenido de
   [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo. Crea las tablas,
   las políticas RLS, las funciones de disponibilidad y 4 peluqueros de ejemplo.
3. **Project Settings → API**: copia la `Project URL` y la `anon public key`
   a tu `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

## 4. Activar Google OAuth

1. En Supabase: **Authentication → Providers → Google → Enable**.
2. En [Google Cloud Console](https://console.cloud.google.com/):
   - Crea un proyecto → **APIs & Services → Credentials**.
   - **Create credentials → OAuth client ID → Web application**.
   - En **Authorized redirect URIs** añade la URL de callback que muestra
     Supabase en la pantalla del proveedor Google
     (formato `https://TU-PROYECTO.supabase.co/auth/v1/callback`).
   - Copia el **Client ID** y **Client Secret** y pégalos en Supabase.
3. En Supabase **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (en producción, tu dominio).
   - **Redirect URLs**: añade `http://localhost:3000/**` y tu dominio de Vercel.

## 5. Crear un administrador

1. Inicia sesión con Google y completa tu perfil en la app.
2. En Supabase **SQL Editor**, ejecuta (con tu email):
   ```sql
   update public.profiles set rol = 'admin'
   where user_id = (select id from auth.users where email = 'tu-email@gmail.com');
   ```
3. Recarga la app: verás el enlace **Admin** en la cabecera.

## 6. Emails (opcional)

1. Crea una API key en Resend y añádela a `.env.local` como `RESEND_API_KEY`.
2. Para usar tu propio remitente, verifica un dominio en Resend y ajusta
   `RESEND_FROM`. Sin clave, las reservas funcionan pero no se envía email.

## 7. Desplegar en Vercel

1. Sube el repo a GitHub e impórtalo en Vercel.
2. Añade las mismas variables de entorno en **Vercel → Settings →
   Environment Variables**.
3. Añade tu dominio de Vercel a las **Redirect URLs** de Supabase y a las
   **Authorized redirect URIs** de Google.

---

## Estructura

```
src/
  actions/        Server actions (perfil, reservas, admin)
  app/
    (main)/       Páginas con cabecera: home, reservar, mis-reservas, admin
    auth/         Callback y signout de OAuth
    login/        Acceso con Google
    perfil/       Completar perfil
  components/     Logo, Header, tarjetas, flujo de reserva, admin, iconos
  lib/            Supabase clients, tipos, constantes de dominio, utils, email
  middleware.ts   Refresco de sesión + protección de rutas
supabase/
  schema.sql      Esquema completo + RLS + seed
```
