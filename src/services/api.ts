/**
 * 统一 API 层 —— 前端唯一数据入口
 *
 * 所有数据读写都通过这里的函数，不直接调 callFunction。
 * 将来切换到自建后端，只需改这个文件的实现。
 */
import Taro from '@tarojs/taro'
import type {
  User, UserGameProfile, PracticeRecord, TestRecord, StatsData,
  Achievement, UserAchievement, DailyChallenge, LeaderboardEntry,
} from '@/types'

// ============================================================
// 底层：封装 Taro.cloud.callFunction
// ============================================================

const isWeapp = process.env.TARO_ENV === 'weapp'

async function invoke<T = any>(name: string, data?: Record<string, any>): Promise<T> {
  if (!isWeapp) {
    console.warn(`[API] ${name} 非微信环境，返回空`)
    return {} as T
  }
  try {
    const res = await Taro.cloud.callFunction({ name, data })
    const result = res.result as { code: number; message: string; data: T }
    if (result.code !== 0) {
      throw new Error(result.message || '请求失败')
    }
    return result.data
  } catch (err: any) {
    const errMsg = err?.errMsg || err?.message || ''
    if (errMsg.includes('-601034') || errMsg.includes('没有权限')) {
      console.warn(`[API] ${name} 云开发未开通`)
      return {} as T
    }
    throw err
  }
}

// ============================================================
// 用户
// ============================================================

export async function login(): Promise<{ openid: string }> {
  return invoke('login')
}

export async function getUserProfile(): Promise<User> {
  return invoke('getUserProfile')
}

export async function updateUserProfile(data: {
  nickname?: string
  avatarUrl?: string
  grade?: number
}): Promise<User> {
  return invoke('updateUserProfile', data)
}

// ============================================================
// 游戏化
// ============================================================

export async function getGameProfile(): Promise<UserGameProfile> {
  return invoke('getGameProfile')
}

export async function getAchievements(): Promise<Achievement[]> {
  return invoke('getAchievements')
}

export async function getUserAchievements(): Promise<UserAchievement[]> {
  return invoke('getUserAchievements')
}

export async function getDailyChallenge(): Promise<DailyChallenge | null> {
  return invoke('getDailyChallenge')
}

// ============================================================
// 练习记录（通用，三科共用）
// ============================================================

export async function savePracticeRecord(data: {
  subject: string
  type: string
  grade: number
  contentJson: Record<string, any>
  score: number
  accuracy: number
  duration: number
}): Promise<PracticeRecord> {
  return invoke('savePracticeRecord', data)
}

export async function getPracticeRecords(params: {
  subject?: string
  page?: number
  pageSize?: number
}): Promise<{ records: PracticeRecord[]; total: number }> {
  return invoke('getPracticeRecords', params)
}

export async function getTestRecords(params: {
  subject?: string
  page?: number
  pageSize?: number
}): Promise<{ records: TestRecord[]; total: number }> {
  return invoke('getTestRecords', params)
}

// ============================================================
// 统计
// ============================================================

export async function getStats(subject?: string): Promise<StatsData> {
  return invoke('getStats', { subject })
}

// ============================================================
// 排行榜
// ============================================================

export async function getLeaderboard(params: {
  subject?: string
  scope?: 'class' | 'school' | 'national' | 'friends'
  page?: number
  pageSize?: number
}): Promise<LeaderboardEntry[]> {
  return invoke('getLeaderboard', params)
}

// ============================================================
// 对战
// ============================================================

export async function startBattle(data: {
  subject: string
  opponentId?: number
}): Promise<{ roomId: number }> {
  return invoke('startBattle', data)
}

export async function submitBattleAnswer(data: {
  roomId: number
  questionIndex: number
  answer: any
}): Promise<{ correct: boolean; score: number }> {
  return invoke('submitBattleAnswer', data)
}

export async function getBattleResult(roomId: number): Promise<{
  winnerId: number
  player1Score: number
  player2Score: number
}> {
  return invoke('getBattleResult', { roomId })
}
