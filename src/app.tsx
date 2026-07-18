import React, { useEffect, useRef } from 'react'
import { useDidShow, useDidHide } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { useGameStore } from '@/store/useGameStore'
import { login, getUserProfile, getGameProfile, getDailyChallenge, getAchievements, getUserAchievements } from '@/services/api'
import './app.scss'

function App(props) {
  const inited = useRef(false)

  useEffect(() => {
    if (process.env.TARO_ENV === 'weapp') {
      Taro.cloud.init({ env: 'lexuedao-d9gnk5dru823f8b98', traceUser: true })
    }
  }, [])

  useDidShow(() => {
    if (!inited.current) {
      inited.current = true
      // 延迟初始化，不阻塞首屏渲染
      setTimeout(() => {
        initApp()
      }, 500)
    }
  })

  useDidHide(() => {})

  const initApp = async () => {
    try {
      // 1. 登录获取 openid（带超时）
      await Promise.race([
        login(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ])

      // 2. 获取用户信息
      try {
        const user = await Promise.race([
          getUserProfile(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]) as any
        if (user) {
          useUserStore.getState().setUser(user)
          useUserStore.getState().setCurrentGrade(user.grade)
        }
      } catch (_) {}

      // 3. 获取游戏数据
      try {
        const gameProfile = await Promise.race([
          getGameProfile(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]) as any
        if (gameProfile) {
          useUserStore.getState().setGameProfile(gameProfile)
        }
      } catch (_) {}

      // 4. 获取每日挑战
      try {
        const dailyChallenge = await Promise.race([
          getDailyChallenge(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]) as any
        if (dailyChallenge) {
          useGameStore.getState().setDailyChallenge(dailyChallenge)
        }
      } catch (_) {}

      // 5. 获取成就数据
      try {
        const [achievements, userAchievements] = await Promise.race([
          Promise.all([getAchievements(), getUserAchievements()]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]) as any
        if (achievements) {
          useGameStore.getState().setAchievements(achievements)
        }
        if (userAchievements) {
          useGameStore.getState().setUserAchievements(userAchievements)
        }
      } catch (_) {}
    } catch (_) {
      // 登录失败不阻塞
    }
  }

  return props.children
}

export default App
