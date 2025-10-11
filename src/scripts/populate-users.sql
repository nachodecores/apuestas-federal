-- Script para poblar la base de datos con los 10 participantes de la liga
-- Ejecutar esto en el SQL Editor de Supabase

-- Primero, necesitamos modificar la tabla profiles para permitir usuarios sin auth
-- Removemos la foreign key constraint temporalmente y agregamos campos necesarios

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS league_entry_id INTEGER UNIQUE;

-- Ahora insertamos los 10 participantes de la liga Draft FPL
-- Estos datos vienen de la API: league_entries

INSERT INTO public.profiles (id, email, display_name, fpl_entry_id, balance, is_claimed, league_entry_id)
VALUES
  -- Usuario 1
  (gen_random_uuid(), 'pending1@apuestasfederal.com', 'Martín Cichero', NULL, 1000.00, FALSE, 6753),
  
  -- Usuario 2
  (gen_random_uuid(), 'pending2@apuestasfederal.com', 'Agustín Duarte', NULL, 1000.00, FALSE, 5156),
  
  -- Usuario 3
  (gen_random_uuid(), 'pending3@apuestasfederal.com', 'Ignacio de Cores', NULL, 1000.00, FALSE, 38904),
  
  -- Usuario 4
  (gen_random_uuid(), 'pending4@apuestasfederal.com', 'Manuel Domenech', NULL, 1000.00, FALSE, 44346),
  
  -- Usuario 5
  (gen_random_uuid(), 'pending5@apuestasfederal.com', 'Juan Dehl', NULL, 1000.00, FALSE, 54556),
  
  -- Usuario 6
  (gen_random_uuid(), 'pending6@apuestasfederal.com', 'Tomás Sartori', NULL, 1000.00, FALSE, 5769),
  
  -- Usuario 7
  (gen_random_uuid(), 'pending7@apuestasfederal.com', 'Santiago Mendez', NULL, 1000.00, FALSE, 5997),
  
  -- Usuario 8
  (gen_random_uuid(), 'pending8@apuestasfederal.com', 'Facundo Rivero', NULL, 1000.00, FALSE, 6494),
  
  -- Usuario 9
  (gen_random_uuid(), 'pending9@apuestasfederal.com', 'Agustin Chappuis', NULL, 1000.00, FALSE, 6479),
  
  -- Usuario 10
  (gen_random_uuid(), 'pending10@apuestasfederal.com', 'Ignacio Xavier', NULL, 1000.00, FALSE, 5865)
ON CONFLICT (league_entry_id) DO NOTHING;

-- Crear índice para buscar rápido usuarios no reclamados
CREATE INDEX IF NOT EXISTS idx_profiles_is_claimed ON public.profiles(is_claimed);
CREATE INDEX IF NOT EXISTS idx_profiles_league_entry_id ON public.profiles(league_entry_id);

-- Actualizar políticas de seguridad para permitir ver usuarios no reclamados
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para permitir reclamar usuarios
CREATE POLICY "Anyone can claim unclaimed profiles" ON public.profiles
  FOR UPDATE USING (is_claimed = FALSE);

