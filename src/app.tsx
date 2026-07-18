import React, { useEffect } from 'react'
import { useDidShow, useDidHide } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { useGameStore } from '@/store/useGameStore'
import { login, getUserProfile, getGameProfile, getDailyChallenge, getAchievements, getUserAchievements } from '@/services/api'
import './app.scss'

function App(props) {
  useEffect(() => {
    if (process.env.TARO_ENV === 'weapp') {
      Taro.cloud.init({ env: 'lexuedao-d9gnk5dru823f8b98', traceUser: true })
    }
  }, [])

  useDidShow(() => {
    initApp()
  })

  useDidHide(() => {})

  const initApp = async () => {
    try {
      // 1. 登录获取 openid
      await login()

      // 2. 获取用户信息
      try {
        const user = await getUserProfile()
        if (user) {
          useUserStore.getState().setUser(user)
          useUserStore.getState().setCurrentGrade(user.grade)
        }
      } catch (_) {
        // 静默失败
      }

      // 3. 获取游戏数据
      try {
        const gameProfile = await getGameProfile()
        if (gameProfile) {
          useUserStore.getState().setGameProfile(gameProfile)
        }
      } catch (_) {}

      // 4. 获取每日挑战
      try {
        const dailyChallenge = await getDailyChallenge()
        if (dailyChallenge) {
          useGameStore.getState().setDailyChallenge(dailyChallenge)
        }
      } catch (_) {}

      // 5. 获取成就数据
      try {
        const [achievements, userAchievements] = await Promise.all([
          getAchievements(),
          getUserAchievements(),
        ])
        if (achievements) {
          useGameStore.getState().setAchievements(achievements)
        }
        if (userAchievements) {
          useGameStore.getState().setUserAchievements(userAchievements)
        }
      } catch (_) {}
    } catch (_) {
      // 登录失败也不阻塞
    }
  }

  return props.children
}

export default App
