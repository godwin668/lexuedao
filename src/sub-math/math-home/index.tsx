import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { useMathStore } from '@/store/useMathStore'
import { GradeLevel } from '@/types'
import { useSafeArea } from '@/hooks/useSafeArea'
import styles from './index.module.scss'

const ENTRY_CARDS = [
  { key: 'practice', name: '口算练习', desc: '加减乘除速算', icon: '🧮', color: '#FF8C42' },
  { key: 'column', name: '竖式计算', desc: '列竖式步步算', icon: '📐', color: '#FFB347' },
  { key: 'word', name: '应用题', desc: '生活中的数学', icon: '📝', color: '#FF6B6B' },
  { key: 'challenge', name: '限时挑战', desc: '5分钟极限挑战', icon: '⏱️', color: '#4A90D9' },
]

const GRADES: GradeLevel[] = [1, 2, 3, 4, 5, 6]

const MathHomePage: React.FC = () => {
  const { top: safeTop } = useSafeArea()
  const { gameProfile } = useUserStore()
  const { currentGrade, setCurrentGrade } = useMathStore()

  const handleStartPractice = () => {
    Taro.navigateTo({ url: '/sub-math/math-practice/index' })
  }

  const handleCardClick = (key: string) => {
    if (key === 'challenge') {
      Taro.navigateTo({ url: '/sub-math/math-test/index' })
    } else if (key === 'practice') {
      Taro.navigateTo({ url: '/sub-math/math-practice/index' })
    } else {
      Taro.showToast({ title: '即将上线', icon: 'none' })
    }
  }

  return (
    <View className={styles.page} style={{ paddingTop: `${safeTop}px` }}>
      {/* 头部 */}
      <View className={styles.header}>
        <Text className={styles.title}>🧮 数学冒险</Text>
        <Text className={styles.subtitle}>等级 {gameProfile?.level || 1} · {currentGrade}年级</Text>
      </View>

      {/* 年级选择器 */}
      <View className={styles.gradeSection}>
        <Text className={styles.sectionTitle}>选择年级</Text>
        <View className={styles.gradeTags}>
          {GRADES.map((g) => (
            <View
              key={g}
              className={`${styles.gradeTag} ${currentGrade === g ? styles.gradeActive : ''}`}
              onClick={() => setCurrentGrade(g)}
            >
              <Text>{g}年级</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 入口卡片 */}
      <View className={styles.actions}>
        {ENTRY_CARDS.map((card) => (
          <View
            key={card.key}
            className={styles.actionCard}
            style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}CC)` }}
            onClick={() => handleCardClick(card.key)}
          >
            <Text className={styles.actionIcon}>{card.icon}</Text>
            <Text className={styles.actionTitle}>{card.name}</Text>
            <Text className={styles.actionDesc}>{card.desc}</Text>
          </View>
        ))}
      </View>

      {/* 底部开始按钮 */}
      <View className={styles.bottomBar}>
        <View className={styles.startBtn} onClick={handleStartPractice}>
          <Text>开始练习</Text>
        </View>
      </View>
    </View>
  )
}

export default MathHomePage
