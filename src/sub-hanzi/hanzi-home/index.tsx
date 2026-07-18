import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { useHanziStore } from '@/store/useHanziStore'
import { useSafeArea } from '@/hooks/useSafeArea'
import styles from './index.module.scss'

const LEVELS = [
  { id: 1, name: '笔画森林', desc: '基本笔画练习', icon: '🌱', color: '#47B881', nodes: 10, unlocked: true },
  { id: 2, name: '偏旁山谷', desc: '偏旁部首', icon: '🌿', color: '#5DB89A', nodes: 10, unlocked: true },
  { id: 3, name: '汉字城堡', desc: '独体字练习', icon: '🏰', color: '#73C9B1', nodes: 10, unlocked: true },
  { id: 4, name: '词语山脉', desc: '组词练习', icon: '🏔️', color: '#89DAC8', nodes: 10, unlocked: false },
  { id: 5, name: '句子王国', desc: '造句挑战', icon: '🏯', color: '#9FE8D8', nodes: 10, unlocked: false },
]

const HanziHomePage: React.FC = () => {
  const { top: safeTop } = useSafeArea()
  const { gameProfile } = useUserStore()
  const { currentGrade, setCurrentGrade } = useHanziStore()

  const handlePractice = () => {
    Taro.navigateTo({ url: '/sub-hanzi/hanzi-practice/index' })
  }

  const handleTrace = () => {
    Taro.navigateTo({ url: '/sub-hanzi/hanzi-practice/index' })
  }

  const handleTest = () => {
    Taro.navigateTo({ url: '/sub-hanzi/hanzi-practice/index' })
  }

  const handleHistory = () => {
    Taro.navigateTo({ url: '/sub-hanzi/hanzi-history/index' })
  }

  return (
    <View className={styles.page} style={{ paddingTop: `${safeTop}px` }}>
      {/* 头部 */}
      <View className={styles.header}>
        <Text className={styles.title}>📝 语文冒险</Text>
        <Text className={styles.subtitle}>等级 {gameProfile?.level || 1} · {currentGrade}年级</Text>
      </View>

      {/* 冒险地图 */}
      <View className={styles.mapSection}>
        <Text className={styles.sectionTitle}>🗺️ 冒险地图</Text>
        <View className={styles.map}>
          {LEVELS.map((level, index) => (
            <View key={level.id} className={styles.levelRow}>
              <View
                className={`${styles.levelNode} ${level.unlocked ? styles.unlocked : styles.locked}`}
                style={{ borderColor: level.color }}
              >
                <Text className={styles.levelIcon}>{level.icon}</Text>
                <View className={styles.levelInfo}>
                  <Text className={styles.levelName} style={{ color: level.color }}>
                    {level.unlocked ? `第${level.id}关：${level.name}` : '🔒 未解锁'}
                  </Text>
                  <Text className={styles.levelDesc}>{level.desc}</Text>
                  {level.unlocked && (
                    <View className={styles.levelProgress}>
                      <View className={styles.progressBar}>
                        <View
                          className={styles.progressFill}
                          style={{
                            width: level.id <= 3 ? `${(level.id === 3 ? 8 : 10) * 10}%` : '0%',
                            background: level.color,
                          }}
                        />
                      </View>
                      <Text className={styles.progressText}>
                        {level.id <= 2 ? '10/10 ⭐⭐⭐' : level.id === 3 ? '8/10 ⭐⭐' : '0/10'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {index < LEVELS.length - 1 && (
                <View className={styles.connector}>
                  <Text>│</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 快捷入口 */}
      <View className={styles.actions}>
        <View className={styles.actionCard} style={{ background: 'linear-gradient(135deg, #47B881, #7DD4A6)' }} onClick={handlePractice}>
          <Text className={styles.actionIcon}>✏️</Text>
          <Text className={styles.actionTitle}>自由练习</Text>
          <Text className={styles.actionDesc}>选择汉字练习</Text>
        </View>
        <View className={styles.actionCard} style={{ background: 'linear-gradient(135deg, #FFB347, #FFC978)' }} onClick={handleTrace}>
          <Text className={styles.actionIcon}>📋</Text>
          <Text className={styles.actionTitle}>描红模式</Text>
          <Text className={styles.actionDesc}>跟着笔画描</Text>
        </View>
        <View className={styles.actionCard} style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }} onClick={handleTest}>
          <Text className={styles.actionIcon}>📝</Text>
          <Text className={styles.actionTitle}>测试模式</Text>
          <Text className={styles.actionDesc}>检验成果</Text>
        </View>
        <View className={styles.actionCard} style={{ background: 'linear-gradient(135deg, #4A90D9, #7AB8F5)' }} onClick={handleHistory}>
          <Text className={styles.actionIcon}>📊</Text>
          <Text className={styles.actionTitle}>学习记录</Text>
          <Text className={styles.actionDesc}>查看进步</Text>
        </View>
      </View>
    </View>
  )
}

export default HanziHomePage
