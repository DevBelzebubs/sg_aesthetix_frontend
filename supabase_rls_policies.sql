-- ============================================================
-- POLÍTICAS RLS PARA LOS NUEVOS MÓDULOS DEL ADMIN
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. CATEGORÍA PRODUCTOS (CRUD completo)
ALTER TABLE public.categoria_producto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cat_prod_select" ON public.categoria_producto
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cat_prod_insert" ON public.categoria_producto
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "cat_prod_update" ON public.categoria_producto
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "cat_prod_delete" ON public.categoria_producto
  FOR DELETE TO authenticated USING (true);


-- 2. CATEGORÍA SERVICIOS (CRUD completo)
ALTER TABLE public.categoria_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cat_serv_select" ON public.categoria_servicio
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cat_serv_insert" ON public.categoria_servicio
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "cat_serv_update" ON public.categoria_servicio
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "cat_serv_delete" ON public.categoria_servicio
  FOR DELETE TO authenticated USING (true);


-- 3. VENTAS (solo lectura - listado de ventas)
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ventas_select" ON public.ventas
  FOR SELECT TO authenticated USING (true);


-- 4. MOVIMIENTOS INVENTARIO (lectura + inserción para ingresos)
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mov_inv_select" ON public.movimientos_inventario
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "mov_inv_insert" ON public.movimientos_inventario
  FOR INSERT TO authenticated WITH CHECK (true);


-- 5. PRODUCTOS (solo UPDATE para actualizar stock_actual al ingresar mercadería)
-- Si ya tiene políticas, este bloque puede dar error; es opcional.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'prod_update' AND tablename = 'productos'
  ) THEN
    CREATE POLICY "prod_update" ON public.productos
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;


-- 6. CONFIGURACIÓN PUNTOS (lectura + update - ya tiene servicio funcionando)
ALTER TABLE public.configuracion_puntos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'conf_pts_select' AND tablename = 'configuracion_puntos'
  ) THEN
    CREATE POLICY "conf_pts_select" ON public.configuracion_puntos
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'conf_pts_update' AND tablename = 'configuracion_puntos'
  ) THEN
    CREATE POLICY "conf_pts_update" ON public.configuracion_puntos
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'conf_pts_insert' AND tablename = 'configuracion_puntos'
  ) THEN
    CREATE POLICY "conf_pts_insert" ON public.configuracion_puntos
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;
