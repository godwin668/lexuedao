import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useGameStore } from '@/store/useGameStore'
import { useUserStore } from '@/store/useUserStore'
import { getDailyChallenge } from '@/services/api'
import type { DailyChallenge } from '@/types'
import { useSafeArea } from '@/hooks/useSafeArea'
import styles from './index.module.scss'

interface TaskItem {
  key: string
  label: string
  icon: string
  color: string
  description: string
  target: number
  completed: number
}

const ChallengePage: React.FC = () => {
  const { top: safeTop } = useSafeArea()
  const { dailyChallenge, setDailyChallenge } = useGameStore()
  const { gameProfile } = useUserStore()

  const [loading, setLoading] = useState(false)
  const [claimed, setClaimed] = useState(false)

  const fetchChallenge = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getDailyChallenge()
      if (data) {
        setDailyChallenge(data)
      }
    } catch (err: any) {
      console.error('获取每日挑战失败:', err)
      // 使用模拟数据
      const mockData: DailyChallenge = {
        id: 1,
        date: new Date().toISOString().split('T')[0],
        hanziTask: { description: '完成 5 次汉字书写练习', target: 5, completed: 3 },
        mathTask: { description: '完成 10 道数学口算题', target: 10, completed: 10 },
        englishTask: { description: '背诵 8 个英语单词', target: 8, completed: 4 },
        reward: { exp: 100, coins: 50, diamonds: 5 },
      }
      setDailyChallenge(mockData)
    } finally {
      setLoading(false)
    }
  }, [setDailyChallenge])

  useEffect(() => {
    fetchChallenge()
  }, [])

  const tasks: TaskItem[] = dailyChallenge
    ? [
        {
          key: 'hanzi',
          label: '语文',
          icon: '📝',
          color: '#47B881',
          description: dailyChallenge.hanziTask.description,
          target: dailyChallenge.hanziTask.target,
          completed: dailyChallenge.hanziTask.completed,
        },
        {
          key: 'math',
          label: '数学',
          icon: '🔢',
          color: '#FF8C42',
          description: dailyChallenge.mathTask.description,
          target: dailyChallenge.mathTask.target,
          completed: dailyChallenge.mathTask.completed,
        },
        {
          key: 'english',
          label: '英语',
          icon: '🔤',
          color: '#7C5CFC',
          description: dailyChallenge.englishTask.description,
          target: dailyChallenge.englishTask.target,
          completed: dailyChallenge.englishTask.completed,
        },
      ]
    : []

  const allCompleted = tasks.length > 0 && tasks.every((t) => t.completed >= t.target)

  const handleClaimReward = useCallback(() => {
    if (!allCompleted || claimed) return
    setClaimed(true)
    Taro.showToast({ title: '奖励领取成功！', icon: 'success' })
  }, [allCompleted, claimed])

  return (
    <View className={styles.page} style={{ paddingTop: `${safeTop}px` }}>
      {/* 头部 */}
      <View className={styles.header}>
        <Text className={styles.title}>📅 每日挑战</Text>
        <Text className={styles.subtitle}>
          等级 {gameProfile?.level || 1} · 完成每日任务获取丰厚奖励
        </Text>
      </View>

      {/* 任务列表 */}
      <View className={styles.tasksSection}>
        <Text className={styles.sectionTitle}>今日任务</Text>
        {tasks.map((task) => {
          const percent = Math.min(100, Math.round((task.completed / task.target) * 100))
          const done = task.completed >= task.target
          return (
            <View key={task.key} className={styles.taskCard}>
              <View className={styles.taskHeader}>
                <View className={styles.taskIcon} style={{ background: `${task.color}20` }}>
                  <Text className={styles.taskIconText}>{task.icon}</Text>
                </View>
                <View className={styles.taskInfo}>
                  <Text className={styles.taskLabel} style={{ color: task.color }}>
                    {task.label}
                  </Text>
                  <Text className={styles.taskDesc}>{task.description}</Text>
                </View>
                {done && <Text className={styles.taskDone}>✅</Text>}
              </View>
              <View className={styles.taskProgress}>
                <View className={styles.progressBar}>
                  <View
                    className={styles.progressFill}
                    style={{
                      width: `${percent}%`,
                      background: done
                        ? `linear-gradient(90deg, ${task.color}, ${task.color}88)`
                        : task.color,
                    }}
                  />
                </View>
                <Text className={styles.progressText} style={{ color: task.color }}>
                  {task.completed}/{task.target}
                </Text>
              </View>
            </View>
          )
        })}
      </View>

      {/* 奖励 */}
      {dailyChallenge && (
        <View className={styles.rewardSection}>
          <Text className={styles.sectionTitle}>完成奖励</Text>
          <View className={styles.rewardCard}>
            <View className={styles.rewardItems}>
              <View className={styles.rewardItem}>
                <Text className={styles.rewardIcon}>⭐</Text>
                <Text className={styles.rewardValue}>+{dailyChallenge.reward.exp}</Text>
                <Text className={styles.rewardLabel}>经验</Text>
              </View>
              <View className={styles.rewardItem}>
                <Text className={styles.rewardIcon}>🪙</Text>
                <Text className={styles.rewardValue}>+{dailyChallenge.reward.coins}</Text>
                <Text className={styles.rewardLabel}>金币</Text>
              </View>
              <View className={styles.rewardItem}>
                <Text className={styles.rewardIcon}>💎</Text>
                <Text className={styles.rewardValue}>+{dailyChallenge.reward.diamonds}</Text>
                <Text className={styles.rewardLabel}>钻石</Text>
              </View>
            </View>
            <Button
              className={`${styles.claimBtn} ${allCompleted && !claimed ? styles.claimBtnActive : ''}`}
              onClick={handleClaimReward}
              disabled={!allCompleted || claimed}
            >
              {claimed ? '已领取' : allCompleted ? '领取奖励' : '全部完成后可领取'}
            </Button>
          </View>
        </View>
      )}

      {/* 加载状态 */}
      {loading && tasks.length === 0 && (
        <View className={styles.loadingBox}>
          <Text className={styles.loadingText}>加载中...</Text>
        </View>
      )}
    </View>
  )
}

export default ChallengePage
