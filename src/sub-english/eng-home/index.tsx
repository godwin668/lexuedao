import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEnglishStore } from '@/store/useEnglishStore'
import { GradeLevel } from '@/types'
import styles from './index.module.scss'

const ENTRIES = [
  { mode: 'flashcard' as const, icon: '🃏', title: '单词闪卡', desc: '翻转卡片学单词', color: '#7C5CFC' },
  { mode: 'spell' as const, icon: '✍️', title: '拼写练习', desc: '看中文拼英文', color: '#FF8C42' },
  { mode: 'listen' as const, icon: '🎧', title: '听力选择', desc: '听发音选单词', color: '#47B881' },
  { mode: 'test' as const, icon: '📝', title: '综合测试', desc: '混合题型挑战', color: '#FF4D4F' },
]

const GRADES = [1, 2, 3, 4, 5, 6] as GradeLevel[]

const EngHomePage: React.FC = () => {
  const { currentGrade, setCurrentGrade, setMode } = useEnglishStore()

  const handleEntry = (mode: 'flashcard' | 'spell' | 'listen' | 'test') => {
    setMode(mode)
    const pageMap = {
      flashcard: '/sub-english/eng-word/index',
      spell: '/sub-english/eng-spell/index',
      listen: '/sub-english/eng-listen/index',
      test: '/sub-english/eng-test/index',
    }
    Taro.navigateTo({ url: pageMap[mode] })
  }

  return (
    <View className={styles.page}>
      {/* 头部 */}
      <View className={styles.header}>
        <Text className={styles.title}>🔤 英语冒险</Text>
        <Text className={styles.subtitle}>选择模式，开始你的英语学习之旅</Text>
      </View>

      {/* 入口卡片 */}
      <View className={styles.entries}>
        {ENTRIES.map((entry) => (
          <View
            key={entry.mode}
            className={styles.entryCard}
            style={{ background: `linear-gradient(135deg, ${entry.color}, ${entry.color}CC)` }}
            onClick={() => handleEntry(entry.mode)}
          >
            <Text className={styles.entryIcon}>{entry.icon}</Text>
            <View className={styles.entryInfo}>
              <Text className={styles.entryTitle}>{entry.title}</Text>
              <Text className={styles.entryDesc}>{entry.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 年级选择器 */}
      <View className={styles.gradeSection}>
        <Text className={styles.sectionTitle}>选择年级</Text>
        <View className={styles.grades}>
          {GRADES.map((g) => (
            <View
              key={g}
              className={`${styles.gradeItem} ${currentGrade === g ? styles.active : ''}`}
              onClick={() => setCurrentGrade(g)}
            >
              <Text>{g}年级</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 开始学习按钮 */}
      <View className={styles.startSection}>
        <View className={styles.startBtn} onClick={() => handleEntry('flashcard')}>
          <Text className={styles.startBtnText}>🚀 开始学习</Text>
        </View>
      </View>
    </View>
  )
}

export default EngHomePage
