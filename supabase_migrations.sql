-- ============================================================
-- MIGRACIÓN: COLUMNAS FALTANTES + TABLA LOCALES
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. AGREGAR COLUMNA imagen_url A recompensas_puntos
ALTER TABLE public.recompensas_puntos
ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- 2. AGREGAR COLUMNAS DE REDES SOCIALES A usuarios
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS instagram TEXT;

ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS facebook TEXT;

ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS tiktok TEXT;

-- 3. CREAR TABLA locales
CREATE TABLE IF NOT EXISTS public.locales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  horario TEXT NOT NULL,
  telefono TEXT NOT NULL,
  maps_url TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.locales ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'locales_select' AND tablename = 'locales') THEN
    CREATE POLICY "locales_select" ON public.locales
      FOR SELECT TO authenticated, anon USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'locales_insert' AND tablename = 'locales') THEN
    CREATE POLICY "locales_insert" ON public.locales
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'locales_update' AND tablename = 'locales') THEN
    CREATE POLICY "locales_update" ON public.locales
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'locales_delete' AND tablename = 'locales') THEN
    CREATE POLICY "locales_delete" ON public.locales
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- 4. CREAR TABLA caja (una sola fila, id=1)
CREATE TABLE IF NOT EXISTS public.caja (
  id INTEGER PRIMARY KEY DEFAULT 1,
  esta_abierta BOOLEAN NOT NULL DEFAULT false,
  saldo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
  abierto_en TIMESTAMPTZ,
  cerrado_en TIMESTAMPTZ,
  usuario_apertura_id TEXT,
  actualizado_en TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.caja ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'caja_select' AND tablename = 'caja') THEN
    CREATE POLICY "caja_select" ON public.caja
      FOR SELECT TO authenticated, anon USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'caja_insert' AND tablename = 'caja') THEN
    CREATE POLICY "caja_insert" ON public.caja
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'caja_update' AND tablename = 'caja') THEN
    CREATE POLICY "caja_update" ON public.caja
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Insertar fila inicial si no existe
INSERT INTO public.caja (id, esta_abierta, saldo_inicial)
SELECT 1, false, 0
WHERE NOT EXISTS (SELECT 1 FROM public.caja WHERE id = 1);

-- ============================================================
-- 5. CREAR TABLA venta_detalles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.venta_detalles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
  tipo_item TEXT NOT NULL CHECK (tipo_item IN ('producto', 'servicio')),
  item_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.venta_detalles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'venta_detalles_select' AND tablename = 'venta_detalles') THEN
    CREATE POLICY "venta_detalles_select" ON public.venta_detalles
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'venta_detalles_insert' AND tablename = 'venta_detalles') THEN
    CREATE POLICY "venta_detalles_insert" ON public.venta_detalles
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'venta_detalles_delete' AND tablename = 'venta_detalles') THEN
    CREATE POLICY "venta_detalles_delete" ON public.venta_detalles
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- ============================================================
-- 6. POLITICAS RLS PARA ventas (si no existen)
-- ============================================================
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ventas_select' AND tablename = 'ventas') THEN
    CREATE POLICY "ventas_select" ON public.ventas
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ventas_insert' AND tablename = 'ventas') THEN
    CREATE POLICY "ventas_insert" ON public.ventas
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ventas_update' AND tablename = 'ventas') THEN
    CREATE POLICY "ventas_update" ON public.ventas
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 7. COLUMNAS DE SEGURIDAD PARA clientes (PIN + verificaciones)
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS pin_hash TEXT,
ADD COLUMN IF NOT EXISTS pin_salt TEXT,
ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_confirmado BOOLEAN NOT NULL DEFAULT false;
