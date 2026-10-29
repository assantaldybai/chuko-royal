-- ============================================================
-- Chuko Royal — Phase 4 Monopoly GO Meta & Settlement Schema
-- village_schema.sql: Village State, Buildings, Raids, Piggy Bank
-- ============================================================

-- 1. Таблица состояния поселения (Моя Орда)
CREATE TABLE IF NOT EXISTS village_state (
  player_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  region INTEGER NOT NULL DEFAULT 1 CHECK (region BETWEEN 1 AND 3),
  region_name TEXT NOT NULL DEFAULT 'Жайлоо Суусамыр',
  shields INTEGER NOT NULL DEFAULT 3 CHECK (shields >= 0),
  max_shields INTEGER NOT NULL DEFAULT 3 CHECK (max_shields BETWEEN 3 AND 5),
  last_shield_recharge TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_tribute_claim TIMESTAMPTZ NOT NULL DEFAULT now(),
  yurt_level INTEGER NOT NULL DEFAULT 1 CHECK (yurt_level BETWEEN 1 AND 5),
  forge_level INTEGER NOT NULL DEFAULT 1 CHECK (forge_level BETWEEN 1 AND 5),
  stable_level INTEGER NOT NULL DEFAULT 1 CHECK (stable_level BETWEEN 1 AND 5),
  tower_level INTEGER NOT NULL DEFAULT 1 CHECK (tower_level BETWEEN 1 AND 5),
  piggy_bank_coins BIGINT NOT NULL DEFAULT 0 CHECK (piggy_bank_coins >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Журнал набегов (Атаки и Оборона)
CREATE TABLE IF NOT EXISTS raid_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attacker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  attacker_name TEXT NOT NULL,
  attacker_avatar TEXT DEFAULT '🥷',
  target_building TEXT NOT NULL DEFAULT 'yurt', -- 'yurt', 'treasury', 'stable'
  blocked_by_shield BOOLEAN NOT NULL DEFAULT false,
  coins_stolen BIGINT NOT NULL DEFAULT 0,
  revenged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_raid_logs_defender ON raid_logs(defender_id, created_at DESC);

-- 3. Row Level Security
ALTER TABLE village_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE raid_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own village state"
  ON village_state FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Users update own village state"
  ON village_state FOR ALL
  USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users read own raid logs"
  ON raid_logs FOR SELECT
  USING (auth.uid() = defender_id);

CREATE POLICY "Users insert raid logs"
  ON raid_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users update revenge on raid logs"
  ON raid_logs FOR UPDATE
  USING (auth.uid() = defender_id)
  WITH CHECK (auth.uid() = defender_id);
