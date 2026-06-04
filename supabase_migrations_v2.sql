-- ============================================================
-- MIGRACIÓN V2: LIBRO DE RECLAMACIONES (Ley N° 29571)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.libro_reclamaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('queja', 'reclamo')),
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  dni TEXT,
  domicilio TEXT,
  telefono TEXT,
  email TEXT NOT NULL,
  bien_contratado TEXT,
  monto_reclamado DECIMAL(10,2),
  descripcion TEXT NOT NULL,
  pedido_consumidor TEXT,
  respuesta TEXT,
  respondido_el TIMESTAMPTZ,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'respondido', 'cerrado')),
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.libro_reclamaciones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lr_insert_anon' AND tablename = 'libro_reclamaciones') THEN
    CREATE POLICY "lr_insert_anon" ON public.libro_reclamaciones
      FOR INSERT TO anon WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lr_select_auth' AND tablename = 'libro_reclamaciones') THEN
    CREATE POLICY "lr_select_auth" ON public.libro_reclamaciones
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lr_update_auth' AND tablename = 'libro_reclamaciones') THEN
    CREATE POLICY "lr_update_auth" ON public.libro_reclamaciones
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lr_delete_auth' AND tablename = 'libro_reclamaciones') THEN
    CREATE POLICY "lr_delete_auth" ON public.libro_reclamaciones
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;
