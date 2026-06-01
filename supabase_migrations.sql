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
