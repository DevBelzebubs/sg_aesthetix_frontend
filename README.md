# SG Aesthetix

Plataforma de reservas online para barberías. Permite a los clientes agendar citas, comprar productos y gestionar fidelización.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Estilo**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Despliegue**: Cloudflare Workers (`@opennextjs/cloudflare`)
- **Email**: EmailJS
- **Imágenes**: Cloudinary

## Setup local

```bash
npm install
cp .env.example .env     # completar con credenciales reales
npm run dev
```

## Variables de entorno

Ver `.env.example` para la lista completa. Las variables `NEXT_PUBLIC_*` se inyectan en el cliente.

## Build y deploy

```bash
# Build para Cloudflare Workers
npm run cf:build

# Preview local
npm run cf:preview

# Deploy a producción
npm run cf:deploy
```

## Estructura

```
src/
  app/            # App Router (pages + layouts + API routes)
    (public)/     # Rutas públicas (landing, reservas, etc.)
    (dashboard)/  # Panel admin y empleado
    api/          # API endpoints
  components/     # Componentes React
  contexts/       # Contextos (auth, theme, cart)
  hooks/          # Hooks personalizados
  lib/            # Utilidades (supabase, validators, email, etc.)
  services/       # Capa de acceso a datos (Supabase)
  types/          # Tipos TypeScript
```

## Licencia

Propietario.
