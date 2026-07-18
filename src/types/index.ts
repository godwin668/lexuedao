// ===== 通用类型 =====

// 年级
export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6

// 学科
export type Subject = 'hanzi' | 'math' | 'english'

// 用户角色
export type UserRole = 'student' | 'parent'

// 练习类型
export type PracticeType = 'practice' | 'test' | 'battle' | 'challenge'

// ===== 用户相关 =====

export interface User {
  id: number
  openid: string
  nickname: string
  avatarUrl: string
  role: UserRole
  grade: GradeLevel
  createdAt: string
  updatedAt: string
}

export interface UserGameProfile {
  userId: number
  level: number
  exp: number
  coins: number
  diamonds: number
  energy: number
  energyMax: number
  streakDays: number
  lastLoginDate: string
}

export interface ParentChild {
  id: number
  parentId: number
  childId: number
  relation: string
  isActive: boolean
}

// ===== 成就相关 =====

export interface Achievement {
  id: number
  key: string
  name: string
  description: string
  icon: string
  subject: Subject | 'general'
  conditionJson: Record<string, any>
}

export interface UserAchievement {
  id: number
  userId: number
  achievementKey: string
  unlockedAt: string
}

// ===== 学习记录 =====

// PG 行类型（内部，云函数使用）
export interface PracticeRecordRow {
  id: number
  userId: number
  subject: Subject
  type: PracticeType
  grade: number
  contentJson: Record<string, any>
  score: number
  accuracy: number
  duration: number
  expGained: number
  coinsGained: number
  createdAt: string
}

// 前端展示用的练习记录（从 PG content_json 展开）
export interface PracticeRecord {
  id: number
  character: string
  mode: string
  strokes: string[][]
  score: number
  accuracy: number
  aesthetics: number
  duration: number
  createdAt: string
}

// 前端展示用的测试记录
export interface TestRecord {
  id: number
  characters: string[]
  scores: number[]
  avgAccuracy: number
  totalTime: number
  createdAt: string
}

// ===== 对战相关 =====

export interface BattleRecord {
  id: number
  subject: Subject
  player1Id: number
  player2Id: number
  player1Score: number
  player2Score: number
  winnerId: number
  status: 'matching' | 'playing' | 'finished'
  createdAt: string
}

// ===== 付费相关 =====

export type SubscriptionPlan = 'monthly' | 'quarterly' | 'yearly'

export interface SubscriptionOrder {
  id: number
  userId: number
  plan: SubscriptionPlan
  amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'expired'
  startDate: string
  endDate: string
  wxOrderId: string
  createdAt: string
}

export interface DiamondOrder {
  id: number
  userId: number
  packageId: string
  amount: number
  diamonds: number
  wxOrderId: string
  createdAt: string
}

export interface CurrencyLog {
  id: number
  userId: number
  currency: 'coin' | 'diamond'
  amount: number
  reason: string
  refId: number
  createdAt: string
}

// ===== 统计数据 =====

export interface StatsData {
  totalPractices: number
  totalTests: number
  totalCharacters: number
  avgScore: number
  correctRate: number
  weeklyData: { date: string; count: number; score: number }[]
  monthlyData: { month: string; count: number; score: number }[]
}

// ===== 排行榜 =====

export interface LeaderboardEntry {
  rank: number
  userId: number
  nickname: string
  avatarUrl: string
  level: number
  score: number
}

// ===== 语文相关 =====

export interface CharacterInfo {
  char: string
  pinyin: string
  strokes: number
  strokesPath: string[][]
  grade: GradeLevel
}

export interface StrokeCharData {
  strokes: string[]
  medians: number[][][]
}

export interface StrokePoint {
  x: number
  y: number
}

// ===== 数学相关 =====

export type MathOpType = '+' | '-' | '×' | '÷'

export interface MathQuestion {
  id: number
  expression: string
  answer: number
  options?: number[]
  type: MathOpType
  difficulty: number
}

// ===== 英语相关 =====

export interface EnglishWord {
  word: string
  cn: string
  phonetic: string
  image: string
  grade: GradeLevel
  unit: string
}

// ===== 每日挑战 =====

export interface DailyChallenge {
  id: number
  date: string
  hanziTask: { description: string; target: number; completed: number }
  mathTask: { description: string; target: number; completed: number }
  englishTask: { description: string; target: number; completed: number }
  reward: { exp: number; coins: number; diamonds: number }
}
