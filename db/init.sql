-- ============================================
-- 乐学小课堂 MySQL 数据库初始化脚本
-- CloudBase MySQL 5.7+
-- ============================================

-- ===== 用户体系 =====

CREATE TABLE IF NOT EXISTS users (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid      VARCHAR(64) NOT NULL UNIQUE COMMENT '微信openid',
  nickname    VARCHAR(32) DEFAULT '小朋友' COMMENT '昵称',
  avatar_url  VARCHAR(256) DEFAULT '' COMMENT '头像URL',
  role        ENUM('student','parent') NOT NULL DEFAULT 'student' COMMENT '角色',
  grade       TINYINT DEFAULT 1 COMMENT '年级 1-6',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_openid (openid),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE IF NOT EXISTS parent_child (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  parent_id   BIGINT NOT NULL COMMENT '家长用户ID',
  child_id    BIGINT NOT NULL COMMENT '孩子用户ID',
  relation    VARCHAR(16) DEFAULT '' COMMENT '关系: 爸爸/妈妈/爷爷/奶奶',
  is_active   TINYINT(1) DEFAULT 1 COMMENT '是否有效',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES users(id),
  FOREIGN KEY (child_id) REFERENCES users(id),
  UNIQUE KEY uk_parent_child (parent_id, child_id),
  INDEX idx_parent (parent_id),
  INDEX idx_child (child_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家长孩子绑定表';

-- ===== 游戏化体系 =====

CREATE TABLE IF NOT EXISTS user_game_profile (
  user_id         BIGINT PRIMARY KEY COMMENT '用户ID',
  level           INT DEFAULT 1 COMMENT '等级 1-50',
  exp             INT DEFAULT 0 COMMENT '经验值',
  coins           INT DEFAULT 0 COMMENT '金币',
  diamonds        INT DEFAULT 0 COMMENT '钻石',
  energy          INT DEFAULT 10 COMMENT '当前体力',
  energy_max      INT DEFAULT 10 COMMENT '体力上限',
  streak_days     INT DEFAULT 0 COMMENT '连续打卡天数',
  last_login_date DATE COMMENT '最后登录日期',
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户游戏属性表';

CREATE TABLE IF NOT EXISTS achievements (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  `key`       VARCHAR(64) NOT NULL UNIQUE COMMENT '成就标识',
  name        VARCHAR(64) NOT NULL COMMENT '成就名称',
  description VARCHAR(256) COMMENT '成就描述',
  icon        VARCHAR(256) COMMENT '图标',
  subject     ENUM('hanzi','math','english','general') NOT NULL COMMENT '所属学科',
  condition_json JSON COMMENT '达成条件',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成就定义表';

CREATE TABLE IF NOT EXISTS user_achievements (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id         BIGINT NOT NULL COMMENT '用户ID',
  achievement_key VARCHAR(64) NOT NULL COMMENT '成就标识',
  unlocked_at     DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '解锁时间',
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uk_user_achieve (user_id, achievement_key),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户成就表';

-- ===== 学习记录 =====

CREATE TABLE IF NOT EXISTS practice_records (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id       BIGINT NOT NULL COMMENT '用户ID',
  subject       ENUM('hanzi','math','english') NOT NULL COMMENT '学科',
  type          ENUM('practice','test','battle','challenge') NOT NULL COMMENT '类型',
  grade         TINYINT DEFAULT 1 COMMENT '年级',
  content_json  JSON COMMENT '内容数据',
  score         INT DEFAULT 0 COMMENT '得分',
  accuracy      INT DEFAULT 0 COMMENT '准确率',
  duration      INT DEFAULT 0 COMMENT '耗时(秒)',
  exp_gained    INT DEFAULT 0 COMMENT '获得经验',
  coins_gained  INT DEFAULT 0 COMMENT '获得金币',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_subject_time (user_id, subject, created_at),
  INDEX idx_subject_type (subject, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='练习/测试记录表';

CREATE TABLE IF NOT EXISTS error_book (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id       BIGINT NOT NULL COMMENT '用户ID',
  subject       ENUM('hanzi','math','english') NOT NULL COMMENT '学科',
  item_key      VARCHAR(128) NOT NULL COMMENT '项目标识(汉字/题目/单词)',
  error_count   INT DEFAULT 1 COMMENT '错误次数',
  last_error_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最后错误时间',
  mastered      TINYINT(1) DEFAULT 0 COMMENT '是否已掌握',
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uk_user_item (user_id, subject, item_key),
  INDEX idx_user_subject (user_id, subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错题/错字本';

-- ===== 对战系统 =====

CREATE TABLE IF NOT EXISTS battle_records (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  subject       ENUM('hanzi','math','english') NOT NULL COMMENT '学科',
  player1_id    BIGINT NOT NULL COMMENT '玩家1',
  player2_id    BIGINT NOT NULL COMMENT '玩家2',
  player1_score INT DEFAULT 0 COMMENT '玩家1得分',
  player2_score INT DEFAULT 0 COMMENT '玩家2得分',
  winner_id     BIGINT COMMENT '胜者ID',
  status        ENUM('matching','playing','finished') DEFAULT 'matching' COMMENT '状态',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player1_id) REFERENCES users(id),
  FOREIGN KEY (player2_id) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_players (player1_id, player2_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对战记录表';

-- ===== 付费体系 =====

CREATE TABLE IF NOT EXISTS subscription_orders (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL COMMENT '用户ID',
  plan        ENUM('monthly','quarterly','yearly') NOT NULL COMMENT '订阅方案',
  amount      INT NOT NULL COMMENT '金额(分)',
  status      ENUM('pending','paid','cancelled','expired') DEFAULT 'pending' COMMENT '状态',
  start_date  DATE COMMENT '开始日期',
  end_date    DATE COMMENT '结束日期',
  wx_order_id VARCHAR(64) COMMENT '微信支付订单号',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订阅订单表';

CREATE TABLE IF NOT EXISTS diamond_orders (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL COMMENT '用户ID',
  package_id  VARCHAR(32) NOT NULL COMMENT '套餐ID',
  amount      INT NOT NULL COMMENT '金额(分)',
  diamonds    INT NOT NULL COMMENT '钻石数量',
  wx_order_id VARCHAR(64) COMMENT '微信支付订单号',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钻石购买记录表';

CREATE TABLE IF NOT EXISTS currency_log (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL COMMENT '用户ID',
  currency    ENUM('coin','diamond') NOT NULL COMMENT '货币类型',
  amount      INT NOT NULL COMMENT '数量(正=收入,负=支出)',
  reason      VARCHAR(64) COMMENT '原因',
  ref_id      BIGINT COMMENT '关联记录ID',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_currency (user_id, currency, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='货币流水表';

-- ===== 初始成就数据 =====

INSERT INTO achievements (`key`, name, description, icon, subject, condition_json) VALUES
-- 通用成就
('first_login', '初次见面', '第一次登录乐学小课堂', '🌟', 'general', '{"type":"login","target":1}'),
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
