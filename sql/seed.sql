-- ============================================================
-- Chuko Royal — Seed Data & Auto-Confirm Trigger for Supabase
-- ============================================================

-- 1. Триггер авто-подтверждения email (чтобы вход работал сразу без почтового сервера)
CREATE OR REPLACE FUNCTION auth.auto_confirm_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auth.auto_confirm_user();


-- 2. Справочные таблицы (каталоги игры)
CREATE TABLE IF NOT EXISTS arenas_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  fee BIGINT NOT NULL DEFAULT 0,
  prize BIGINT NOT NULL DEFAULT 0,
  bone_count INTEGER NOT NULL DEFAULT 5,
  min_trophies INTEGER NOT NULL DEFAULT 0,
  badge TEXT DEFAULT 'Новичкам',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sakas_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mass_stat INTEGER NOT NULL DEFAULT 50,
  stability_stat INTEGER NOT NULL DEFAULT 50,
  bounce_stat INTEGER NOT NULL DEFAULT 50,
  color TEXT NOT NULL,
  border_color TEXT NOT NULL,
  price BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'coins',
  rarity TEXT NOT NULL DEFAULT 'common',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Наполняем каталог арен
INSERT INTO arenas_catalog (id, name, fee, prize, bone_count, min_trophies, badge) VALUES
  ('zhashtyk', 'Жаштык Арена', 100, 200, 5, 0, 'Новичкам'),
  ('bishkek', 'Бишкек Арена', 1000, 2000, 5, 200, 'Популярно'),
  ('issyk_kul', 'Иссык-Куль Ордо', 5000, 10000, 9, 800, 'Профи Лига')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  fee = EXCLUDED.fee,
  prize = EXCLUDED.prize;

-- Наполняем каталог Сака
INSERT INTO sakas_catalog (id, name, mass_stat, stability_stat, bounce_stat, color, border_color, price, rarity) VALUES
  ('lead', 'Ханский Свинец', 60, 55, 52, '#f59e0b', '#fef3c7', 0, 'common'),
  ('cyber', 'Кибер-Титан X9', 75, 80, 72, '#06b6d4', '#ecfeff', 5000, 'rare'),
  ('jade', 'Иссык-Кульский Нефрит', 55, 85, 65, '#10b981', '#d1fae5', 3000, 'rare'),
  ('gold', 'Золотой Алчы', 90, 88, 85, '#eab308', '#fef08a', 25000, 'legendary')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mass_stat = EXCLUDED.mass_stat,
  price = EXCLUDED.price;


-- 3. Создание стартовых игроков для Лидерборда и базы
DO $$
DECLARE
  u1 UUID := 'a1111111-1111-1111-1111-111111111111'::uuid;
  u2 UUID := 'a2222222-2222-2222-2222-222222222222'::uuid;
  u3 UUID := 'a3333333-3333-3333-3333-333333333333'::uuid;
  u4 UUID := 'a4444444-4444-4444-4444-444444444444'::uuid;
  u5 UUID := 'a5555555-5555-5555-5555-555555555555'::uuid;
  u_demo UUID := 'a9999999-9999-9999-9999-999999999999'::uuid;
BEGIN
  -- Manas_Pro
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = u1) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (u1, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'manas_pro@chuko.pro', crypt('manas123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Manas_Pro"}', now(), now());
    
    UPDATE profiles SET username = 'Manas_Pro', avatar_emoji = '👑', trophies = 4890, level = 18, xp = 3600, total_wins = 210, total_losses = 42, coins = 154000, bucks = 120, total_knocked = 540 WHERE id = u1;
    UPDATE player_sakas SET saka_name = 'Золотой Алчы', saka_type = 'gold', level = 7, mass_stat = 92, stability_stat = 90, bounce_stat = 88, color = '#eab308', border_color = '#fef08a' WHERE player_id = u1;
  END IF;

  -- Batyr_99
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = u2) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (u2, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'batyr_99@chuko.pro', crypt('batyr123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Batyr_99"}', now(), now());
    
    UPDATE profiles SET username = 'Batyr_99', avatar_emoji = '🐺', trophies = 4420, level = 16, xp = 3100, total_wins = 185, total_losses = 51, coins = 98000, bucks = 85, total_knocked = 430 WHERE id = u2;
    UPDATE player_sakas SET saka_name = 'Кибер-Титан X9', saka_type = 'cyber', level = 5, mass_stat = 85, stability_stat = 88, bounce_stat = 80, color = '#06b6d4', border_color = '#ecfeff' WHERE player_id = u2;
  END IF;

  -- Barsbek_Kg
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = u3) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (u3, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'barsbek@chuko.pro', crypt('barsbek123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Barsbek_Kg"}', now(), now());
    
    UPDATE profiles SET username = 'Barsbek_Kg', avatar_emoji = '🦅', trophies = 3980, level = 14, xp = 2700, total_wins = 150, total_losses = 45, coins = 72000, bucks = 60, total_knocked = 380 WHERE id = u3;
    UPDATE player_sakas SET saka_name = 'Иссык-Кульский Нефрит', saka_type = 'jade', level = 4, mass_stat = 70, stability_stat = 86, bounce_stat = 74, color = '#10b981', border_color = '#d1fae5' WHERE player_id = u3;
  END IF;

  -- Tengri_Warrior
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = u4) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (u4, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'tengri@chuko.pro', crypt('tengri123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Tengri_Warrior"}', now(), now());
    
    UPDATE profiles SET username = 'Tengri_Warrior', avatar_emoji = '🏹', trophies = 3410, level = 12, xp = 2300, total_wins = 120, total_losses = 38, coins = 48000, bucks = 45, total_knocked = 310 WHERE id = u4;
  END IF;

  -- Alaman_Pro
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = u5) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (u5, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'alaman@chuko.pro', crypt('alaman123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Alaman_Pro"}', now(), now());
    
    UPDATE profiles SET username = 'Alaman_Pro', avatar_emoji = '🐎', trophies = 2890, level = 10, xp = 1900, total_wins = 95, total_losses = 30, coins = 35000, bucks = 30, total_knocked = 240 WHERE id = u5;
  END IF;

  -- Demo User: Nomad_kg (логин nomad@chuko.pro / nomad123)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = u_demo) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (u_demo, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'nomad@chuko.pro', crypt('nomad123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Nomad_kg"}', now(), now());
    
    UPDATE profiles SET username = 'Nomad_kg', avatar_emoji = '🥷', trophies = 1230, level = 5, xp = 950, total_wins = 42, total_losses = 12, coins = 25000, bucks = 85, piggy_coins = 14500, total_knocked = 88 WHERE id = u_demo;
    
    -- Добавляем ему Сака
    INSERT INTO player_sakas (player_id, saka_type, saka_name, level, mass_stat, stability_stat, bounce_stat, is_equipped, color, border_color)
    VALUES
      (u_demo, 'cyber', 'Кибер-Титан X9', 2, 78, 82, 75, false, '#06b6d4', '#ecfeff'),
      (u_demo, 'jade', 'Иссык-Кульский Нефрит', 1, 55, 85, 65, false, '#10b981', '#d1fae5')
    ON CONFLICT (player_id, saka_type) DO NOTHING;
    
    -- Несколько сыгранных матчей в историю
    INSERT INTO match_results (player_id, arena_name, bone_count, fee, prize, player_score, bot_score, won, knocked_count, trophies_change)
    VALUES
      (u_demo, 'Бишкек Арена', 5, 1000, 2000, 3, 1, true, 3, 31),
      (u_demo, 'Жаштык Арена', 5, 100, 200, 3, 2, true, 3, 31),
      (u_demo, 'Бишкек Арена', 5, 1000, 2000, 2, 3, false, 2, -10);
  END IF;
END;
$$;

-- Разрешаем чтение справочников
ALTER TABLE arenas_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE sakas_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read arenas" ON arenas_catalog FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read sakas" ON sakas_catalog FOR SELECT TO anon, authenticated USING (true);
