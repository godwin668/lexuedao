import { create } from 'zustand'
import { User, UserGameProfile, UserRole, GradeLevel } from '@/types'

interface UserState {
  // 用户基础信息
  user: User | null
  setUser: (user: User | null) => void

  // 游戏化数据
  gameProfile: UserGameProfile | null
  setGameProfile: (profile: UserGameProfile | null) => void

  // 当前角色模式
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void

  // 家长模式下当前查看的孩子
  viewingChildId: number | null
  setViewingChildId: (id: number | null) => void

  // 绑定的孩子列表（家长模式）
  children: User[]
  setChildren: (children: User[]) => void

  // VIP 状态
  isVip: boolean
  vipExpireDate: string | null
  setVipStatus: (isVip: boolean, expireDate: string | null) => void

  // 年级
  currentGrade: GradeLevel
  setCurrentGrade: (grade: GradeLevel) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  gameProfile: null,
  setGameProfile: (profile) => set({ gameProfile: profile }),

  currentRole: 'student',
  setCurrentRole: (role) => set({ currentRole: role }),

  viewingChildId: null,
  setViewingChildId: (id) => set({ viewingChildId: id }),

  children: [],
  setChildren: (children) => set({ children }),

  isVip: false,
  vipExpireDate: null,
  setVipStatus: (isVip, vipExpireDate) => set({ isVip, vipExpireDate }),

  currentGrade: 1,
  setCurrentGrade: (grade) => set({ currentGrade: grade }),
}))
