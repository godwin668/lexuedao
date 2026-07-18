import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { useGameStore } from '@/store/useGameStore'
import { useSafeArea } from '@/hooks/useSafeArea'
import { Subject, GradeLevel } from '@/types'
import styles from './index.module.scss'

const SUBJECTS: { key: Subject; name: string; icon: string; color: string; desc: string }[] = [
  { key: 'hanzi', name: '语文', icon: '📝', color: '#47B881', desc: '汉字书写练习' },
  { key: 'math', name: '数学', icon: '🔢', color: '#FF8C42', desc: '算术口算练习' },
  { key: 'english', name: '英语', icon: '🔤', color: '#7C5CFC', desc: '单词拼写听力' },
]

const HomePage: React.FC = () => {
  const { user, gameProfile, currentRole, currentGrade, setCurrentGrade, isVip } = useUserStore()
  const { dailyChallenge } = useGameStore()
  const { top: safeTop } = useSafeArea()
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 6) setGreeting('夜深了')
    else if (hour < 9) setGreeting('早上好')
    else if (hour < 12) setGreeting('上午好')
    else if (hour < 14) setGreeting('中午好')
    else if (hour < 18) setGreeting('下午好')
    else setGreeting('晚上好')
  }, [])

  const handleSubjectClick = (subject: Subject) => {
    const routeMap: Record<Subject, string> = {
      hanzi: '/sub-hanzi/hanzi-home/index',
      math: '/sub-math/math-home/index',
      english: '/sub-english/eng-home/index',
    }
    Taro.navigateTo({ url: routeMap[subject] })
  }

  const handleBattle = () => {
    Taro.navigateTo({ url: '/sub-game/battle/index' })
  }

  const handleLeaderboard = () => {
    Taro.navigateTo({ url: '/sub-game/leaderboard/index' })
  }

  const handleChallenge = () => {
    Taro.navigateTo({ url: '/sub-game/challenge/index' })
  }

  const handleAiChat = () => {
    Taro.navigateTo({ url: '/sub-game/ai-chat/index' })
  }

  const gradeLabels: Record<GradeLevel, string> = {
    1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级',
  }

  return (
    <View className={styles.page}>
      {/* 头部 */}
      <View className={styles.header} style={{ paddingTop: `${safeTop}px` }}>
        <View className={styles.userRow}>
          <View className={styles.avatar}>
            <Text>{user?.avatarUrl || '😊'}</Text>
          </View>
          <View className={styles.userInfo}>
            <Text className={styles.greeting}>
              {greeting}，{user?.nickname || '小朋友'}
            </Text>
            <View className={styles.levelRow}>
              <Text className={styles.level}>Lv.{gameProfile?.level || 1}</Text>
              {isVip && <Text className={styles.vipBadge}>VIP</Text>}
            </View>
          </View>
          <View className={styles.currencyRow}>
            <View className={styles.currency}>
              <Text>💰{gameProfile?.coins || 0}</Text>
            </View>
            <View className={styles.currency}>
              <Text>💎{gameProfile?.diamonds || 0}</Text>
            </View>
          </View>
        </View>

        {/* 经验条 */}
        <View className={styles.expBar}>
          <View className={styles.expFill} style={{ width: '60%' }} />
        </View>

        {/* 体力 */}
        <View className={styles.energyRow}>
          <Text>⚡ 体力 {gameProfile?.energy || 0}/{gameProfile?.energyMax || 10}</Text>
          {gameProfile && gameProfile.streakDays > 0 && (
            <Text className={styles.streak}>🔥 已连续打卡 {gameProfile.streakDays} 天</Text>
          )}
        </View>
      </View>

      {/* 今日任务 */}
      {dailyChallenge && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>📋 今日任务</Text>
          <View className={styles.taskList}>
            <View className={styles.taskItem}>
              <Text>📝 语文：{dailyChallenge.hanziTask.description}</Text>
              <Text className={styles.taskProgress}>
                {dailyChallenge.hanziTask.completed}/{dailyChallenge.hanziTask.target}
              </Text>
            </View>
            <View className={styles.taskItem}>
              <Text>🔢 数学：{dailyChallenge.mathTask.description}</Text>
              <Text className={styles.taskProgress}>
                {dailyChallenge.mathTask.completed}/{dailyChallenge.mathTask.target}
              </Text>
            </View>
            <View className={styles.taskItem}>
              <Text>🔤 英语：{dailyChallenge.englishTask.description}</Text>
              <Text className={styles.taskProgress}>
                {dailyChallenge.englishTask.completed}/{dailyChallenge.englishTask.target}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 学科入口 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>📚 选择学科</Text>
        <View className={styles.subjectGrid}>
          {SUBJECTS.map((subj) => (
            <View
              key={subj.key}
              className={styles.subjectCard}
              style={{ background: `linear-gradient(135deg, ${subj.color}, ${subj.color}CC)` }}
              onClick={() => handleSubjectClick(subj.key)}
            >
              <Text className={styles.subjectIcon}>{subj.icon}</Text>
              <Text className={styles.subjectName}>{subj.name}</Text>
              <Text className={styles.subjectDesc}>{subj.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* AI 学习助手 */}
      <View className={styles.section}>
        <View className={styles.aiCard} onClick={handleAiChat}>
          <View className={styles.aiCardLeft}>
            <Text className={styles.aiIcon}>🤖</Text>
            <View className={styles.aiInfo}>
              <Text className={styles.aiTitle}>AI 学习助手</Text>
              <Text className={styles.aiDesc}>智能答疑 · 学习规划 · 错题分析</Text>
            </View>
          </View>
          <Text className={styles.aiArrow}>›</Text>
        </View>
      </View>

      {/* 竞技入口 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>⚡ 竞技场</Text>
        <View className={styles.gameGrid}>
          <View className={styles.gameCard} onClick={handleBattle}>
            <Text className={styles.gameIcon}>⚔️</Text>
            <Text className={styles.gameName}>好友对战</Text>
            <Text className={styles.gameDesc}>邀请好友PK</Text>
          </View>
          <View className={styles.gameCard} onClick={handleLeaderboard}>
            <Text className={styles.gameIcon}>🏆</Text>
            <Text className={styles.gameName}>排行榜</Text>
            <Text className={styles.gameDesc}>看看谁最强</Text>
          </View>
          <View className={styles.gameCard} onClick={handleChallenge}>
            <Text className={styles.gameIcon}>🎯</Text>
            <Text className={styles.gameName}>每日挑战</Text>
            <Text className={styles.gameDesc}>完成领奖励</Text>
          </View>
        </View>
      </View>

      {/* 年级切换 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>📖 当前年级</Text>
        <View className={styles.gradeRow}>
          {([1, 2, 3, 4, 5, 6] as GradeLevel[]).map((g) => (
            <View
              key={g}
              className={`${styles.gradeTag} ${currentGrade === g ? styles.gradeActive : ''}`}
              onClick={() => setCurrentGrade(g)}
            >
              <Text>{gradeLabels[g]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

export default HomePage
