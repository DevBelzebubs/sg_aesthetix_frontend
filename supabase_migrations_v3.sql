
-- ============================================================
-- TABLA HERO CONTENT
-- Almacena el video/imagen del hero de la landing page
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hero_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'video' CHECK (tipo IN ('video', 'imagen')),
  url_media TEXT NOT NULL DEFAULT '',
  titulo TEXT DEFAULT 'Redefiniendo el corte',
  subtitulo TEXT DEFAULT 'Reserva online · Sin esperas',
  url_logo_dark TEXT DEFAULT '',
  url_logo_light TEXT DEFAULT '',
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

-- Insertar fila por defecto si está vacía
INSERT INTO public.hero_content (tipo, url_media, titulo, subtitulo, url_logo_dark, url_logo_light, activo)
SELECT 'video',
  'https://res.cloudinary.com/dp1vgjhsq/video/upload/v1777105289/WhatsApp_Video_2026-04-25_at_3.11.00_AM_1_aroels.mp4',
  'Redefiniendo el corte',
  'Reserva online · Sin esperas',
  'https://res.cloudinary.com/dp1vgjhsq/image/upload/v1780970216/ChatGPT_Image_4_jun_2026_18_53_34_qwlk6n.png',
  'https://res.cloudinary.com/dp1vgjhsq/image/upload/v1779981307/LOGOTIPO_tsrnvl.png',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.hero_content);