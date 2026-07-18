import React, { useState, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import { useGameStore } from '@/store/useGameStore'
import { Subject } from '@/types'
import styles from './index.module.scss'

type FilterKey = 'all' | 'general' | Subject

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'general', label: '通用' },
  { key: 'hanzi', label: '语文' },
  { key: 'math', label: '数学' },
  { key: 'english', label: '英语' },
]

const SUBJECT_COLORS: Record<string, string> = {
  general: '#4A90D9',
  hanzi: '#47B881',
  math: '#FF8C42',
  english: '#7C5CFC',
}

const AchievementsPage: React.FC = () => {
  const { achievements, userAchievements } = useGameStore()
  const [filter, setFilter] = useState<FilterKey>('all')

  const unlockedKeys = useMemo(() => {
    return new Set(userAchievements.map((ua) => ua.achievementKey))
  }, [userAchievements])

  const filteredAchievements = useMemo(() => {
    if (filter === 'all') return achievements
    return achievements.filter((a) => a.subject === filter)
  }, [achievements, filter])

  const unlockedCount = userAchievements.length
  const totalCount = achievements.length

  return (
    <View className={styles.page}>
      {/* 头部 */}
      <View className={styles.header}>
        <Text className={styles.title}>成就殿堂</Text>
        <Text className={styles.subtitle}>
          已解锁 {unlockedCount}/{totalCount} 个成就
        </Text>
      </View>

      {/* 分类筛选 */}
      <View className={styles.filterRow}>
        {FILTERS.map((f) => (
          <View
            key={f.key}
            className={classnames(styles.filterTag, filter === f.key && styles.filterActive)}
            onClick={() => setFilter(f.key)}
          >
            <Text>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* 成就列表 */}
      <View className={styles.list}>
        {filteredAchievements.length === 0 ? (
          <View className={styles.empty}>
            <Text>暂无成就</Text>
          </View>
        ) : (
          filteredAchievements.map((achievement) => {
            const isUnlocked = unlockedKeys.has(achievement.key)
            const subjectColor = SUBJECT_COLORS[achievement.subject] || SUBJECT_COLORS.general

            return (
              <View key={achievement.id} className={styles.achievementItem}>
                <View
                  className={classnames(styles.iconWrap, isUnlocked ? styles.unlocked : styles.locked)}
                  style={isUnlocked ? { borderColor: subjectColor } : undefined}
                >
                  <Text>{achievement.icon || (isUnlocked ? '🏆' : '🔒')}</Text>
                </View>
                <View className={styles.info}>
                  <Text className={styles.name}>{achievement.name}</Text>
                  <Text className={styles.desc}>{achievement.description}</Text>
                </View>
                <View
                  className={classnames(styles.badge, isUnlocked ? styles.unlockedBadge : styles.lockedBadge)}
                >
                  <Text>{isUnlocked ? '已解锁' : '未解锁'}</Text>
                </View>
              </View>
            )
          })
        )}
      </View>
    </View>
  )
}

export default AchievementsPage
