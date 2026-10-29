-- ============================================================
-- Chuko Royal MVP — Supabase PostgreSQL Schema
-- Запустите этот SQL в Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ==================== 1. ТАБЛИЦЫ ====================

-- Профиль игрока (привязан к auth.users через id)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_emoji TEXT DEFAULT '🥷',
  coins BIGINT NOT NULL DEFAULT 5000 CHECK (coins >= 0),
  bucks INTEGER NOT NULL DEFAULT 10 CHECK (bucks >= 0),
  trophies INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  total_knocked INTEGER NOT NULL DEFAULT 0,
  piggy_coins BIGINT NOT NULL DEFAULT 0 CHECK (piggy_coins >= 0),
  last_daily_bonus TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Коллекция Сака (битков) игрока
CREATE TABLE IF NOT EXISTS player_sakas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  saka_type TEXT NOT NULL,        -- 'lead', 'cyber', 'jade'
  saka_name TEXT NOT NULL,        -- 'Ханский Свинец', 'Кибер-Титан X9' и т.д.
  level INTEGER NOT NULL DEFAULT 1,
  mass_stat INTEGER NOT NULL DEFAULT 50 CHECK (mass_stat BETWEEN 0 AND 100),
  stability_stat INTEGER NOT NULL DEFAULT 50 CHECK (stability_stat BETWEEN 0 AND 100),
  bounce_stat INTEGER NOT NULL DEFAULT 50 CHECK (bounce_stat BETWEEN 0 AND 100),
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  color TEXT NOT NULL DEFAULT '#f59e0b',
  border_color TEXT NOT NULL DEFAULT '#fef3c7',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, saka_type)
);

-- История матчей
CREATE TABLE IF NOT EXISTS match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  arena_name TEXT NOT NULL,
  bone_count INTEGER NOT NULL CHECK (bone_count IN (5, 9)),
  fee BIGINT NOT NULL DEFAULT 0,
  prize BIGINT NOT NULL DEFAULT 0,
  player_score INTEGER NOT NULL DEFAULT 0,
  bot_score INTEGER NOT NULL DEFAULT 0,
  won BOOLEAN NOT NULL,
  knocked_count INTEGER NOT NULL DEFAULT 0,
  trophies_change INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_match_results_player ON match_results(player_id);
CREATE INDEX IF NOT EXISTS idx_match_results_played ON match_results(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_trophies ON profiles(trophies DESC);
CREATE INDEX IF NOT EXISTS idx_player_sakas_player ON player_sakas(player_id);


-- ==================== 2. АВТОМАТИЧЕСКОЕ СОЗДАНИЕ ПРОФИЛЯ ПРИ РЕГИСТРАЦИИ ====================

-- Триггер: при регистрации нового пользователя автоматически создаёт профиль + стартового Сака
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _username TEXT;
BEGIN
  -- Генерируем username из email или metadata
  _username := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'Player_' || substr(NEW.id::text, 1, 8)
  );

  -- Убираем дубли username добавляя суффикс
  IF EXISTS (SELECT 1 FROM profiles WHERE username = _username) THEN
    _username := _username || '_' || substr(NEW.id::text, 1, 4);
  END IF;

  -- Создаём профиль
  INSERT INTO profiles (id, username, coins, bucks, trophies)
  VALUES (NEW.id, _username, 5000, 10, 0);

  -- Даём стартового Сака «Ханский Свинец»
  INSERT INTO player_sakas (player_id, saka_type, saka_name, level, mass_stat, stability_stat, bounce_stat, is_equipped, color, border_color)
  VALUES (NEW.id, 'lead', 'Ханский Свинец', 1, 60, 55, 52, true, '#f59e0b', '#fef3c7');

  RETURN NEW;
END;
$$;

-- Удаляем старый триггер если есть, и создаём новый
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ==================== 3. RPC-ФУНКЦИИ (СЕРВЕРНАЯ МАТЕМАТИКА) ====================

-- 3.1 Начать матч: списывает взнос, возвращает match_id
CREATE OR REPLACE FUNCTION start_match(
  p_arena_name TEXT,
  p_bone_count INTEGER,
  p_fee BIGINT,
  p_prize BIGINT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _player_id UUID := auth.uid();
  _current_coins BIGINT;
  _match_id UUID;
BEGIN
  IF _player_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Проверяем и списываем монеты атомарно
  UPDATE profiles
  SET coins = coins - p_fee,
      updated_at = now()
  WHERE id = _player_id
    AND coins >= p_fee
  RETURNING coins INTO _current_coins;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Недостаточно монет для взноса';
  END IF;

  -- Создаём запись матча (результат заполним позже)
  INSERT INTO match_results (player_id, arena_name, bone_count, fee, prize, player_score, bot_score, won, knocked_count)
  VALUES (_player_id, p_arena_name, p_bone_count, p_fee, p_prize, 0, 0, false, 0)
  RETURNING id INTO _match_id;

  RETURN _match_id;
END;
$$;


-- 3.2 Завершить матч: начисляет приз при победе, обновляет статистику
CREATE OR REPLACE FUNCTION finish_match(
  p_match_id UUID,
  p_won BOOLEAN,
  p_player_score INTEGER,
  p_bot_score INTEGER,
  p_knocked INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _player_id UUID := auth.uid();
  _prize BIGINT;
  _trophy_change INTEGER;
  _result JSON;
  _new_coins BIGINT;
  _new_trophies INTEGER;
BEGIN
  IF _player_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Получаем данные матча и проверяем что он принадлежит игроку
  SELECT prize INTO _prize
  FROM match_results
  WHERE id = p_match_id AND player_id = _player_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Матч не найден или не принадлежит вам';
  END IF;

  -- Считаем изменение кубков
  IF p_won THEN
    _trophy_change := 25 + (p_knocked * 2);
  ELSE
    _trophy_change := GREATEST(-15, -10);
  END IF;

  -- Обновляем запись матча
  UPDATE match_results
  SET won = p_won,
      player_score = p_player_score,
      bot_score = p_bot_score,
      knocked_count = p_knocked,
      trophies_change = _trophy_change
  WHERE id = p_match_id AND player_id = _player_id;

  -- Обновляем профиль игрока атомарно
  UPDATE profiles
  SET coins = CASE WHEN p_won THEN coins + _prize ELSE coins END,
      trophies = GREATEST(0, trophies + _trophy_change),
      total_wins = total_wins + CASE WHEN p_won THEN 1 ELSE 0 END,
      total_losses = total_losses + CASE WHEN p_won THEN 0 ELSE 1 END,
      total_knocked = total_knocked + p_knocked,
      piggy_coins = piggy_coins + (p_knocked * 150),
      xp = xp + CASE WHEN p_won THEN 50 ELSE 15 END + (p_knocked * 10),
      updated_at = now()
  WHERE id = _player_id
  RETURNING coins, trophies INTO _new_coins, _new_trophies;

  -- Левел-ап: каждые 200 XP
  UPDATE profiles
  SET level = GREATEST(1, xp / 200 + 1)
  WHERE id = _player_id;

  _result := json_build_object(
    'won', p_won,
    'prize', CASE WHEN p_won THEN _prize ELSE 0 END,
    'trophy_change', _trophy_change,
    'new_coins', _new_coins,
    'new_trophies', _new_trophies,
    'knocked', p_knocked
  );

  RETURN _result;
END;
$$;


-- 3.3 Прокачка Сака: списывает монеты, повышает статы
CREATE OR REPLACE FUNCTION upgrade_saka(p_saka_type TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _player_id UUID := auth.uid();
  _saka RECORD;
  _cost BIGINT;
  _new_coins BIGINT;
BEGIN
  IF _player_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Получаем Сака
  SELECT * INTO _saka
  FROM player_sakas
  WHERE player_id = _player_id AND saka_type = p_saka_type;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Сака не найден в коллекции';
  END IF;

  -- Стоимость апгрейда: базовая 800 × 1.4^(level-1)
  _cost := ROUND(800 * POWER(1.4, _saka.level - 1))::BIGINT;

  -- Списываем монеты
  UPDATE profiles
  SET coins = coins - _cost,
      updated_at = now()
  WHERE id = _player_id
    AND coins >= _cost
  RETURNING coins INTO _new_coins;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Недостаточно монет для прокачки (нужно %)', _cost;
  END IF;

  -- Повышаем статы (+3, максимум 100)
  UPDATE player_sakas
  SET level = level + 1,
      mass_stat = LEAST(100, mass_stat + 3),
      stability_stat = LEAST(100, stability_stat + 3),
      bounce_stat = LEAST(100, bounce_stat + 3)
  WHERE player_id = _player_id AND saka_type = p_saka_type;

  RETURN json_build_object(
    'success', true,
    'new_level', _saka.level + 1,
    'cost', _cost,
    'new_coins', _new_coins
  );
END;
$$;


-- 3.4 Экипировать Сака
CREATE OR REPLACE FUNCTION equip_saka(p_saka_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _player_id UUID := auth.uid();
BEGIN
  IF _player_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Снимаем все
  UPDATE player_sakas SET is_equipped = false WHERE player_id = _player_id;
  -- Надеваем выбранного
  UPDATE player_sakas SET is_equipped = true WHERE player_id = _player_id AND saka_type = p_saka_type;

  RETURN FOUND;
END;
$$;


-- 3.5 Ежедневный бонус (серверная проверка времени)
CREATE OR REPLACE FUNCTION claim_daily_bonus()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _player_id UUID := auth.uid();
  _last_bonus TIMESTAMPTZ;
  _bonus_coins BIGINT := 500;
  _new_coins BIGINT;
BEGIN
  IF _player_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT last_daily_bonus INTO _last_bonus
  FROM profiles WHERE id = _player_id;

  -- Проверяем: прошло ли 24 часа с последнего бонуса
  IF _last_bonus IS NOT NULL AND _last_bonus > now() - INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'Бонус уже получен сегодня. Следующий через: %',
      EXTRACT(HOUR FROM (_last_bonus + INTERVAL '24 hours' - now()))::int || 'ч';
  END IF;

  UPDATE profiles
  SET coins = coins + _bonus_coins,
      last_daily_bonus = now(),
      updated_at = now()
  WHERE id = _player_id
  RETURNING coins INTO _new_coins;

  RETURN json_build_object(
    'success', true,
    'bonus', _bonus_coins,
    'new_coins', _new_coins
  );
END;
$$;


-- 3.6 Лидерборд
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INTEGER DEFAULT 20)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT username, avatar_emoji, trophies, level, total_wins
      FROM profiles
      ORDER BY trophies DESC
      LIMIT p_limit
    ) t
  );
END;
$$;


-- 3.7 Получить полный профиль с коллекцией Сака
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _player_id UUID := auth.uid();
  _profile JSON;
  _sakas JSON;
BEGIN
  IF _player_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT row_to_json(p) INTO _profile
  FROM (
    SELECT id, username, avatar_emoji, coins, bucks, trophies, level, xp,
           total_wins, total_losses, total_knocked, piggy_coins, last_daily_bonus
    FROM profiles WHERE id = _player_id
  ) p;

  SELECT json_agg(row_to_json(s)) INTO _sakas
  FROM (
    SELECT saka_type, saka_name, level, mass_stat, stability_stat, bounce_stat,
           is_equipped, color, border_color
    FROM player_sakas WHERE player_id = _player_id
    ORDER BY is_equipped DESC, level DESC
  ) s;

  RETURN json_build_object(
    'profile', _profile,
    'sakas', COALESCE(_sakas, '[]'::json)
  );
END;
$$;


-- ==================== 4. ROW LEVEL SECURITY ====================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_sakas ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- Профиль: читать свой, чужие — только username/trophies через RPC (лидерборд)
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Запрет прямого UPDATE профиля (всё через RPC)
-- Разрешаем только обновление username и avatar_emoji
CREATE POLICY "Users update own cosmetics"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Сака: читать свои
CREATE POLICY "Users read own sakas"
  ON player_sakas FOR SELECT
  USING (auth.uid() = player_id);

-- Матчи: читать свои
CREATE POLICY "Users read own matches"
  ON match_results FOR SELECT
  USING (auth.uid() = player_id);


-- ==================== 5. UPDATED_AT ТРИГГЕР ====================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
