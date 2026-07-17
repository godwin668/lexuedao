import { create } from 'zustand'
import { Achievement, UserAchievement, DailyChallenge, LeaderboardEntry } from '@/types'

interface GameState {
  // 成就
  achievements: Achievement[]
  setAchievements: (list: Achievement[]) => void
  userAchievements: UserAchievement[]
  setUserAchievements: (list: UserAchievement[]) => void

  // 每日挑战
  dailyChallenge: DailyChallenge | null
  setDailyChallenge: (challenge: DailyChallenge | null) => void

  // 排行榜
  leaderboard: LeaderboardEntry[]
  setLeaderboard: (list: LeaderboardEntry[]) => void

  // 对战
  battleStatus: 'idle' | 'matching' | 'playing' | 'finished'
  setBattleStatus: (status: GameState['battleStatus']) => void
  battleRoomId: number | null
  setBattleRoomId: (id: number | null) => void
}

export const useGameStore = create<GameState>((set) => ({
  achievements: [],
  setAchievements: (list) => set({ achievements: list }),
  userAchievements: [],
  setUserAchievements: (list) => set({ userAchievements: list }),

  dailyChallenge: null,
  setDailyChallenge: (challenge) => set({ dailyChallenge: challenge }),

  leaderboard: [],
  setLeaderboard: (list) => set({ leaderboard: list }),

  battleStatus: 'idle',
  setBattleStatus: (status) => set({ battleStatus: status }),
  battleRoomId: null,
  setBattleRoomId: (id) => set({ battleRoomId: id }),
}))
