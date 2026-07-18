import React, { useState, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEnglishStore } from '@/store/useEnglishStore'
import { getWordsByGrade } from '@/data/englishWords'
import { EnglishWord } from '@/types'
import styles from './index.module.scss'

interface ListenResult {
  word: EnglishWord
  selectedIndex: number
  correct: boolean
}

const EngListenPage: React.FC = () => {
  const { currentGrade } = useEnglishStore()
  const words = useMemo(() => getWordsByGrade(currentGrade), [currentGrade])
  const total = words.length

  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<ListenResult[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [startTime] = useState(Date.now())

  // 生成当前题的选项（正确答案 + 3个随机干扰项）
  const currentWord = words[index]
  const options = useMemo(() => {
    const correct = currentWord
    const others = words.filter((w) => w.word !== correct.word)
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3)
    const all = [correct, ...shuffled].sort(() => Math.random() - 0.5)
    return all
  }, [index, words, currentWord])

  const handlePlay = () => {
    Taro.showToast({ title: `🔊 ${currentWord.word}`, icon: 'none', duration: 1500 })
  }

  const handleSelect = (optionIndex: number) => {
    if (showResult) return
    setSelectedOption(optionIndex)
    const isCorrect = options[optionIndex].word === currentWord.word
    const newResults = [...results, { word: currentWord, selectedIndex: optionIndex, correct: isCorrect }]
    setResults(newResults)
    setShowResult(true)

    const store = useEnglishStore.getState()
    store.setListenAnswer(index, optionIndex)
    store.setScore(index, isCorrect ? 100 : 0)
  }

  const handleNext = () => {
    if (index < total - 1) {
      setIndex(index + 1)
      setSelectedOption(null)
      setShowResult(false)
    } else {
      const correctCount = results.filter((r) => r.correct).length
      const accuracy = Math.round((correctCount / total) * 100)
      const score = Math.round(accuracy * 0.8 + correctCount * 2)
      const duration = Math.round((Date.now() - startTime) / 1000)

      const store = useEnglishStore.getState()
      store.setWords(words)

      Taro.redirectTo({
        url: `/sub-english/eng-result/index?score=${score}&accuracy=${accuracy}&duration=${duration}&mode=listen&total=${total}&correct=${correctCount}`,
      })
    }
  }

  const correctCount = results.filter((r) => r.correct).length

  return (
    <View className={styles.page}>
      {/* 进度条 */}
      <View className={styles.progressSection}>
        <View className={styles.progressTrack}>
          <View
            className={styles.progressFill}
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </View>
        <Text className={styles.progressText}>{index + 1} / {total}</Text>
      </View>

      {/* 得分 */}
      <View className={styles.scoreDisplay}>
        <Text className={styles.scoreLabel}>得分</Text>
        <Text className={styles.scoreValue}>{correctCount}</Text>
      </View>

      {/* 题目描述 */}
      <View className={styles.questionCard}>
        <Text className={styles.questionLabel}>请选择听到的单词对应的中文</Text>
        <View className={styles.playBtn} onClick={handlePlay}>
          <Text className={styles.playIcon}>🔊</Text>
          <Text className={styles.playText}>点击播放发音</Text>
        </View>
      </View>

      {/* 选项 */}
      <View className={styles.optionsGrid}>
        {options.map((opt, i) => {
          let optionClass = styles.optionItem
          if (showResult) {
            if (opt.word === currentWord.word) {
              optionClass += ` ${styles.optionCorrect}`
            } else if (i === selectedOption && !results[results.length - 1]?.correct) {
              optionClass += ` ${styles.optionWrong}`
            }
          } else if (i === selectedOption) {
            optionClass += ` ${styles.optionSelected}`
          }
          return (
            <View key={i} className={optionClass} onClick={() => handleSelect(i)}>
              <Text className={styles.optionWord}>{opt.word}</Text>
              <Text className={styles.optionCn}>{opt.cn}</Text>
            </View>
          )
        })}
      </View>

      {/* 结果提示 */}
      {showResult && (
        <View className={`${styles.resultHint} ${results[results.length - 1]?.correct ? styles.hintCorrect : styles.hintWrong}`}>
          <Text className={styles.hintIcon}>{results[results.length - 1]?.correct ? '✅' : '❌'}</Text>
          <Text className={styles.hintText}>
            {results[results.length - 1]?.correct ? '回答正确！' : `正确答案：${currentWord.word}（${currentWord.cn}）`}
          </Text>
          <View className={styles.nextBtn} onClick={handleNext}>
            <Text>{index < total - 1 ? '下一题 ▶' : '查看结果 📊'}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default EngListenPage
