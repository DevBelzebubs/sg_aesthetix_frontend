-- ============================================================
-- MIGRACIÓN V3: RLS POLICIES FALTANTES
-- El admin dashboard usa createBrowserClient() con anon key
-- (no Supabase Auth), así que todas las tablas necesitan
-- políticas para el rol "anon".
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
  pol TEXT;
  tbls TEXT[] := ARRAY[
    'categoria_servicio',
    'categoria_producto',
    'movimientos_inventario',
    'ventas',
    'venta_detalle',
    'servicios',
    'productos',
    'clientes',
    'galeria_cortes',
    'usuarios',
    'usuario_servicio',
    'reservas',
    'blocked_slots',
    'locales'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls
  LOOP
    -- Saltar si la tabla no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      RAISE NOTICE 'Tabla "%" no existe, saltando...', tbl;
      CONTINUE;
    END IF;

    -- Habilitar RLS (idempotente)
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    -- SELECT policy
    pol := tbl || '_select_anon';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = pol AND tablename = tbl) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon USING (true)', pol, tbl);
    END IF;

    -- INSERT policy
    pol := tbl || '_insert_anon';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = pol AND tablename = tbl) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO anon WITH CHECK (true)', pol, tbl);
    END IF;

    -- UPDATE policy
    pol := tbl || '_update_anon';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = pol AND tablename = tbl) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO anon USING (true) WITH CHECK (true)', pol, tbl);
    END IF;

    -- DELETE policy (saltar si no existe, opcional)
    pol := tbl || '_delete_anon';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = pol AND tablename = tbl) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO anon USING (true)', pol, tbl);
    END IF;
  END LOOP;
END $$;

-- Columnas faltantes en clientes
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS es_frecuente BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS promocion_estado TEXT,
ADD COLUMN IF NOT EXISTS promocion_creado_en TIMESTAMPTZ;