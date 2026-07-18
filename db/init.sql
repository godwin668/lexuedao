-- ============================================
-- 乐学岛 PostgreSQL 数据库初始化脚本
-- CloudBase PostgreSQL 15+
-- ============================================

-- ===== 用户体系 =====

CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  openid      VARCHAR(64) NOT NULL UNIQUE,
  nickname    VARCHAR(32) DEFAULT '小朋友',
  avatar_url  VARCHAR(256) DEFAULT '',
  role        VARCHAR(16) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'parent')),
  grade       SMALLINT DEFAULT 1 CHECK (grade BETWEEN 1 AND 6),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.openid IS '微信openid';
COMMENT ON COLUMN users.role IS '角色: student=学生, parent=家长';
COMMENT ON COLUMN users.grade IS '年级 1-6';

-- 新增字段（如已存在则忽略）
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS total_study_minutes INT DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
COMMENT ON COLUMN users.total_study_minutes IS '累计学习时长(分钟)';

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
COMMENT ON COLUMN users.is_vip IS '是否VIP';

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_expire_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
COMMENT ON COLUMN users.vip_expire_date IS 'VIP到期日期';

CREATE TABLE IF NOT EXISTS parent_child (
  id          BIGSERIAL PRIMARY KEY,
  parent_id   BIGINT NOT NULL REFERENCES users(id),
  child_id    BIGINT NOT NULL REFERENCES users(id),
  relation    VARCHAR(16) DEFAULT '',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (parent_id, child_id)
);
CREATE INDEX IF NOT EXISTS idx_pc_parent ON parent_child(parent_id);
CREATE INDEX IF NOT EXISTS idx_pc_child ON parent_child(child_id);
COMMENT ON TABLE parent_child IS '家长孩子绑定表';
COMMENT ON COLUMN parent_child.relation IS '关系: 爸爸/妈妈/爷爷/奶奶';

-- ===== 游戏化体系 =====

CREATE TABLE IF NOT EXISTS user_game_profile (
  user_id         BIGINT PRIMARY KEY REFERENCES users(id),
  level           INT DEFAULT 1 CHECK (level BETWEEN 1 AND 50),
  exp             INT DEFAULT 0,
  coins           INT DEFAULT 0,
  diamonds        INT DEFAULT 0,
  energy          INT DEFAULT 10,
  energy_max      INT DEFAULT 10,
  streak_days     INT DEFAULT 0,
  last_login_date DATE
);
COMMENT ON TABLE user_game_profile IS '用户游戏属性表';
COMMENT ON COLUMN user_game_profile.level IS '等级 1-50';
COMMENT ON COLUMN user_game_profile.energy IS '当前体力';
COMMENT ON COLUMN user_game_profile.energy_max IS '体力上限';
COMMENT ON COLUMN user_game_profile.streak_days IS '连续打卡天数';

CREATE TABLE IF NOT EXISTS achievements (
  id              BIGSERIAL PRIMARY KEY,
  key             VARCHAR(64) NOT NULL UNIQUE,
  name            VARCHAR(64) NOT NULL,
  description     VARCHAR(256),
  icon            VARCHAR(256),
  subject         VARCHAR(16) NOT NULL CHECK (subject IN ('hanzi','math','english','general')),
  condition_json  JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE achievements IS '成就定义表';
COMMENT ON COLUMN achievements.key IS '成就标识';
COMMENT ON COLUMN achievements.subject IS '所属学科';

CREATE TABLE IF NOT EXISTS user_achievements (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id),
  achievement_key VARCHAR(64) NOT NULL,
  unlocked_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, achievement_key)
);
CREATE INDEX IF NOT EXISTS idx_ua_user ON user_achievements(user_id);
COMMENT ON TABLE user_achievements IS '用户成就表';

-- ===== 学习记录 =====

CREATE TABLE IF NOT EXISTS practice_records (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id),
  subject       VARCHAR(16) NOT NULL CHECK (subject IN ('hanzi','math','english')),
  type          VARCHAR(16) NOT NULL CHECK (type IN ('practice','test','battle','challenge')),
  grade         SMALLINT DEFAULT 1,
  content_json  JSONB,
  score         INT DEFAULT 0,
  accuracy      INT DEFAULT 0,
  duration      INT DEFAULT 0,
  exp_gained    INT DEFAULT 0,
  coins_gained  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pr_user_subject_time ON practice_records(user_id, subject, created_at);
CREATE INDEX IF NOT EXISTS idx_pr_subject_type ON practice_records(subject, type);
COMMENT ON TABLE practice_records IS '练习/测试记录表（通用）';
COMMENT ON COLUMN practice_records.duration IS '耗时(秒)';

-- 新增字段
DO $$ BEGIN
  ALTER TABLE practice_records ADD COLUMN IF NOT EXISTS rank_score INT DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
COMMENT ON COLUMN practice_records.rank_score IS '段位分，用于赛季排名';

CREATE TABLE IF NOT EXISTS error_book (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id),
  subject       VARCHAR(16) NOT NULL CHECK (subject IN ('hanzi','math','english')),
  item_key      VARCHAR(128) NOT NULL,
  error_count   INT DEFAULT 1,
  last_error_at TIMESTAMPTZ DEFAULT NOW(),
  mastered      BOOLEAN DEFAULT FALSE,
  UNIQUE (user_id, subject, item_key)
);
CREATE INDEX IF NOT EXISTS idx_eb_user_subject ON error_book(user_id, subject);
COMMENT ON TABLE error_book IS '错题/错字本';
COMMENT ON COLUMN error_book.item_key IS '项目标识(汉字/题目/单词)';
COMMENT ON COLUMN error_book.mastered IS '是否已掌握';

-- ===== 对战系统 =====

CREATE TABLE IF NOT EXISTS battle_records (
  id            BIGSERIAL PRIMARY KEY,
  subject       VARCHAR(16) NOT NULL CHECK (subject IN ('hanzi','math','english')),
  player1_id    BIGINT NOT NULL REFERENCES users(id),
  player2_id    BIGINT NOT NULL REFERENCES users(id),
  player1_score INT DEFAULT 0,
  player2_score INT DEFAULT 0,
  winner_id     BIGINT,
  status        VARCHAR(16) DEFAULT 'matching' CHECK (status IN ('matching','playing','finished')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_br_status ON battle_records(status);
CREATE INDEX IF NOT EXISTS idx_br_players ON battle_records(player1_id, player2_id);
COMMENT ON TABLE battle_records IS '对战记录表';

-- ===== 付费体系 =====

CREATE TABLE IF NOT EXISTS subscription_orders (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  plan        VARCHAR(16) NOT NULL CHECK (plan IN ('monthly','quarterly','yearly')),
  amount      INT NOT NULL,
  status      VARCHAR(16) DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled','expired')),
  start_date  DATE,
  end_date    DATE,
  wx_order_id VARCHAR(64),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_so_user ON subscription_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_so_status ON subscription_orders(status);
COMMENT ON TABLE subscription_orders IS 'VIP订阅订单表';
COMMENT ON COLUMN subscription_orders.amount IS '金额(分)';

CREATE TABLE IF NOT EXISTS diamond_orders (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  package_id  VARCHAR(32) NOT NULL,
  amount      INT NOT NULL,
  diamonds    INT NOT NULL,
  wx_order_id VARCHAR(64),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_do_user ON diamond_orders(user_id);
COMMENT ON TABLE diamond_orders IS '钻石购买记录表';
COMMENT ON COLUMN diamond_orders.amount IS '金额(分)';

CREATE TABLE IF NOT EXISTS currency_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  currency    VARCHAR(16) NOT NULL CHECK (currency IN ('coin','diamond')),
  amount      INT NOT NULL,
  reason      VARCHAR(64),
  ref_id      BIGINT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cl_user_currency ON currency_log(user_id, currency, created_at);
COMMENT ON TABLE currency_log IS '货币流水表';
COMMENT ON COLUMN currency_log.amount IS '数量(正=收入,负=支出)';

-- ===== AI 学习推荐（pgvector） =====

CREATE EXTENSION IF NOT EXISTS vector;

-- 知识点向量表（用于 AI 相似度推荐）
CREATE TABLE IF NOT EXISTS knowledge_vectors (
  id              BIGSERIAL PRIMARY KEY,
  subject         VARCHAR(16) NOT NULL CHECK (subject IN ('hanzi','math','english')),
  item_key        VARCHAR(128) NOT NULL,
  item_name       VARCHAR(128) NOT NULL,
  grade           SMALLINT DEFAULT 1,
  difficulty      SMALLINT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  tags            TEXT[] DEFAULT '{}',
  embedding       vector(256),
  metadata_json   JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kv_subject_grade ON knowledge_vectors(subject, grade);
CREATE INDEX IF NOT EXISTS idx_kv_embedding ON knowledge_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
COMMENT ON TABLE knowledge_vectors IS '知识点向量表（AI推荐）';
COMMENT ON COLUMN knowledge_vectors.embedding IS '知识点语义向量(256维)';
COMMENT ON COLUMN knowledge_vectors.tags IS '标签: 如{笔画,独体字,左右结构}';

-- 用户能力画像表（AI 推荐依据）
CREATE TABLE IF NOT EXISTS user_skill_profile (
  user_id         BIGINT PRIMARY KEY REFERENCES users(id),
  subject         VARCHAR(16) NOT NULL CHECK (subject IN ('hanzi','math','english')),
  skill_vector    vector(256),
  weak_tags       TEXT[] DEFAULT '{}',
  strong_tags     TEXT[] DEFAULT '{}',
  recommended_at  TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usp_user_subject ON user_skill_profile(user_id, subject);
COMMENT ON TABLE user_skill_profile IS '用户能力画像表（AI推荐）';
COMMENT ON COLUMN user_skill_profile.skill_vector IS '用户能力向量';
COMMENT ON COLUMN user_skill_profile.weak_tags IS '薄弱知识点标签';
COMMENT ON COLUMN user_skill_profile.strong_tags IS '擅长知识点标签';

-- ===== 初始成就数据 =====

INSERT INTO achievements (key, name, description, icon, subject, condition_json) VALUES
-- 通用成就
('first_login', '初次见面', '第一次登录乐学岛', '🌟', 'general', '{"type":"login","target":1}'),
('seven_day_streak', '七日坚持', '连续打卡7天', '🔥', 'general', '{"type":"streak","target":7}'),
('thirty_day_streak', '月度之星', '连续打卡30天', '👑', 'general', '{"type":"streak","target":30}'),
('level_10', '小有成就', '达到10级', '⭐', 'general', '{"type":"level","target":10}'),
('level_25', '学习达人', '达到25级', '🏅', 'general', '{"type":"level","target":25}'),
('level_50', '学霸之王', '达到50级', '👑', 'general', '{"type":"level","target":50}'),
('collector_5', '收藏新手', '集齐5个徽章', '🎖️', 'general', '{"type":"achievement_count","target":5}'),
('collector_20', '徽章达人', '集齐20个徽章', '🏆', 'general', '{"type":"achievement_count","target":20}'),

-- 语文成就
('hanzi_first', '初学乍练', '完成第1次练字', '✏️', 'hanzi', '{"type":"practice_count","target":1}'),
('hanzi_hundred', '百字达人', '累计练习100个汉字', '📝', 'hanzi', '{"type":"char_count","target":100}'),
('hanzi_master', '书法大师', '单字评分≥95分', '🎨', 'hanzi', '{"type":"single_score","target":95}'),
('hanzi_thousand', '千锤百炼', '累计练习1000次', '💪', 'hanzi', '{"type":"practice_count","target":1000}'),

-- 数学成就
('math_first', '算术新星', '完成第1次算术练习', '🔢', 'math', '{"type":"practice_count","target":1}'),
('math_speed', '速算高手', '10题60秒内全对', '⚡', 'math', '{"type":"speed_perfect","target":1}'),
('math_perfect', '满分学霸', '测试获得100分', '💯', 'math', '{"type":"test_score","target":100}'),
('math_ten_thousand', '万题之王', '累计完成10000道题', '🏆', 'math', '{"type":"question_count","target":10000}'),

-- 英语成就
('eng_first', '单词新手', '学习第1个单词', '🔤', 'english', '{"type":"practice_count","target":1}'),
('eng_vocabulary', '词汇达人', '掌握100个单词', '📚', 'english', '{"type":"word_count","target":100}'),
('eng_spell_master', '拼写冠军', '连续拼对20个单词', '✍️', 'english', '{"type":"spell_streak","target":20}'),
('eng_listen_perfect', '听力高手', '听力测试满分', '🎧', 'english', '{"type":"listen_score","target":100}'),

-- 对战成就
('battle_first_win', '首战告捷', '对战首次胜利', '⚔️', 'general', '{"type":"battle_win","target":1}'),
('battle_ten_win', '十连胜', '对战10连胜', '🔥', 'general', '{"type":"battle_streak","target":10}'),
('battle_hundred', '百战勇士', '完成100场对战', '🛡️', 'general', '{"type":"battle_count","target":100}'),

-- 全科成就
('all_subject', '全科小状元', '三科都有练习记录', '🎓', 'general', '{"type":"all_subject","target":1}');

-- ===== 段位系统 =====

CREATE TABLE IF NOT EXISTS user_ranks (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id),
  subject       VARCHAR(16) NOT NULL CHECK (subject IN ('hanzi','math','english')),
  rank          VARCHAR(16) NOT NULL DEFAULT 'bronze' CHECK (rank IN ('bronze','silver','gold','platinum','diamond','king')),
  season_score  INT DEFAULT 0,
  season        VARCHAR(16) DEFAULT '2026-S1',
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, subject, season)
);
CREATE INDEX IF NOT EXISTS idx_ur_user_subject ON user_ranks(user_id, subject);
CREATE INDEX IF NOT EXISTS idx_ur_rank ON user_ranks(rank, season_score DESC);
COMMENT ON TABLE user_ranks IS '段位表（每学科独立段位，赛季制）';
COMMENT ON COLUMN user_ranks.rank IS '段位: bronze/silver/gold/platinum/diamond/king';
COMMENT ON COLUMN user_ranks.season_score IS '当前赛季段位分';
COMMENT ON COLUMN user_ranks.season IS '赛季标识';

-- ===== 学习报告 =====

CREATE TABLE IF NOT EXISTS learning_reports (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id),
  period        VARCHAR(16) NOT NULL CHECK (period IN ('daily','weekly','monthly')),
  report_date   DATE NOT NULL,
  subject       VARCHAR(16) CHECK (subject IN ('hanzi','math','english')),
  practice_count INT DEFAULT 0,
  test_count    INT DEFAULT 0,
  total_duration INT DEFAULT 0,
  avg_accuracy  INT DEFAULT 0,
  exp_gained    INT DEFAULT 0,
  coins_gained  INT DEFAULT 0,
  weak_points   JSONB DEFAULT '[]',
  suggestions   JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, period, report_date, subject)
);
CREATE INDEX IF NOT EXISTS idx_lr_user_date ON learning_reports(user_id, report_date);
COMMENT ON TABLE learning_reports IS '学习报告缓存表';
COMMENT ON COLUMN learning_reports.period IS '报告周期: daily/weekly/monthly';
COMMENT ON COLUMN learning_reports.weak_points IS '薄弱知识点列表';
COMMENT ON COLUMN learning_reports.suggestions IS '改进建议列表';

-- ===== AI 对话记录 =====

CREATE TABLE IF NOT EXISTS ai_conversations (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id),
  subject       VARCHAR(16) CHECK (subject IN ('hanzi','math','english','general')),
  role          VARCHAR(16) NOT NULL CHECK (role IN ('user','assistant')),
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aic_user_time ON ai_conversations(user_id, created_at);
COMMENT ON TABLE ai_conversations IS 'AI对话记录表';
COMMENT ON COLUMN ai_conversations.role IS '角色: user/assistant';
COMMENT ON COLUMN ai_conversations.content IS '对话内容';

-- ===== 组队系统 =====

CREATE TABLE IF NOT EXISTS teams (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(32) NOT NULL,
  code          VARCHAR(8) NOT NULL UNIQUE,
  captain_id    BIGINT NOT NULL REFERENCES users(id),
  total_score   INT DEFAULT 0,
  current_stage INT DEFAULT 1,
  total_stages  INT DEFAULT 10,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE teams IS '队伍表';
COMMENT ON COLUMN teams.code IS '6位队伍码';

CREATE TABLE IF NOT EXISTS team_members (
  id        BIGSERIAL PRIMARY KEY,
  team_id   BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   BIGINT NOT NULL REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_tm_team ON team_members(team_id);
COMMENT ON TABLE team_members IS '队伍成员表';
