import React, { useState, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEnglishStore } from '@/store/useEnglishStore'
import { getWordsByGrade } from '@/data/englishWords'
import styles from './index.module.scss'

const EngWordPage: React.FC = () => {
  const { currentGrade } = useEnglishStore()
  const words = useMemo(() => getWordsByGrade(currentGrade), [currentGrade])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [knownList, setKnownList] = useState<boolean[]>(new Array(words.length).fill(false))

  const currentWord = words[index]
  const total = words.length

  const handleFlip = () => {
    setFlipped(!flipped)
    if (!flipped) {
      Taro.showToast({ title: `🔊 ${currentWord.word}`, icon: 'none', duration: 1500 })
    }
  }

  const handlePrev = () => {
    if (index > 0) {
      setIndex(index - 1)
      setFlipped(false)
    }
  }

  const handleNext = () => {
    if (index < total - 1) {
      setIndex(index + 1)
      setFlipped(false)
    }
  }

  const handleKnown = () => {
    const newList = [...knownList]
    newList[index] = true
    setKnownList(newList)
    Taro.showToast({ title: '✅ 已掌握', icon: 'none', duration: 800 })
    if (index < total - 1) {
      setTimeout(() => {
        setIndex(index + 1)
        setFlipped(false)
      }, 400)
    }
  }

  const handleUnknown = () => {
    const newList = [...knownList]
    newList[index] = false
    setKnownList(newList)
    Taro.showToast({ title: '❌ 继续加油', icon: 'none', duration: 800 })
    if (index < total - 1) {
      setTimeout(() => {
        setIndex(index + 1)
        setFlipped(false)
      }, 400)
    }
  }

  const handleSpeak = () => {
    Taro.showToast({ title: `🔊 ${currentWord.word}`, icon: 'none', duration: 1500 })
  }

  return (
    <View className={styles.page}>
      {/* 进度 */}
      <View className={styles.progressBar}>
        <View className={styles.progressTrack}>
          <View
            className={styles.progressFill}
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </View>
        <Text className={styles.progressText}>{index + 1} / {total}</Text>
      </View>

      {/* 闪卡 */}
      <View className={styles.cardWrapper}>
        <View className={`${styles.card} ${flipped ? styles.flipped : ''}`} onClick={handleFlip}>
          <View className={styles.cardFront}>
            <Text className={styles.wordText}>{currentWord.word}</Text>
            <Text className={styles.tapHint}>点击翻转</Text>
          </View>
          <View className={styles.cardBack}>
            <Text className={styles.cnText}>{currentWord.cn}</Text>
            <Text className={styles.phoneticText}>{currentWord.phonetic}</Text>
          </View>
        </View>
      </View>

      {/* 发音按钮 */}
      <View className={styles.speakBtn} onClick={handleSpeak}>
        <Text className={styles.speakIcon}>🔊</Text>
        <Text className={styles.speakText}>点击发音</Text>
      </View>

      {/* 导航按钮 */}
      <View className={styles.navButtons}>
        <View className={`${styles.navBtn} ${index === 0 ? styles.disabled : ''}`} onClick={handlePrev}>
          <Text>◀ 上一个</Text>
        </View>
        <View className={`${styles.navBtn} ${index >= total - 1 ? styles.disabled : ''}`} onClick={handleNext}>
          <Text>下一个 ▶</Text>
        </View>
      </View>

      {/* 认识/不认识 */}
      <View className={styles.actionButtons}>
        <View className={`${styles.actionBtn} ${styles.unknownBtn}`} onClick={handleUnknown}>
          <Text>❌ 不认识</Text>
        </View>
        <View className={`${styles.actionBtn} ${styles.knownBtn}`} onClick={handleKnown}>
          <Text>✅ 认识</Text>
        </View>
      </View>

      {/* 完成提示 */}
      {index >= total - 1 && (
        <View className={styles.completeHint}>
          <Text>🎉 本轮学习完成！</Text>
        </View>
      )}
    </View>
  )
}

export default EngWordPage
