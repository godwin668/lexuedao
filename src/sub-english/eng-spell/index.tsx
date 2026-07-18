import React, { useState, useMemo, useCallback } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEnglishStore } from '@/store/useEnglishStore'
import { getWordsByGrade } from '@/data/englishWords'
import { EnglishWord } from '@/types'
import styles from './index.module.scss'

interface SpellResult {
  word: EnglishWord
  userAnswer: string
  correct: boolean
}

const EngSpellPage: React.FC = () => {
  const { currentGrade } = useEnglishStore()
  const words = useMemo(() => getWordsByGrade(currentGrade), [currentGrade])
  const total = words.length

  const [index, setIndex] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [results, setResults] = useState<SpellResult[]>([])
  const [showResult, setShowResult] = useState(false)
  const [startTime] = useState(Date.now())

  const currentWord = words[index]

  const handleConfirm = useCallback(() => {
    if (!inputValue.trim()) return
    const isCorrect = inputValue.trim().toLowerCase() === currentWord.word.toLowerCase()
    const newResults = [...results, { word: currentWord, userAnswer: inputValue.trim(), correct: isCorrect }]
    setResults(newResults)
    setShowResult(true)
  }, [inputValue, currentWord, results])

  const handleNext = () => {
    if (index < total - 1) {
      setIndex(index + 1)
      setInputValue('')
      setShowResult(false)
    } else {
      // 完成，跳转结果页
      const correctCount = results.filter((r) => r.correct).length
      const accuracy = Math.round((correctCount / total) * 100)
      const score = Math.round(accuracy * 0.8 + correctCount * 2)
      const duration = Math.round((Date.now() - startTime) / 1000)

      // 保存到 store
      const store = useEnglishStore.getState()
      store.setWords(words)
      results.forEach((r, i) => {
        store.setSpellAnswer(i, r.userAnswer)
        store.setScore(i, r.correct ? 100 : 0)
      })

      Taro.redirectTo({
        url: `/sub-english/eng-result/index?score=${score}&accuracy=${accuracy}&duration=${duration}&mode=spell&total=${total}&correct=${correctCount}`,
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

      {/* 题目 */}
      <View className={styles.questionCard}>
        <Text className={styles.questionLabel}>请拼写以下单词</Text>
        <Text className={styles.cnWord}>{currentWord.cn}</Text>
      </View>

      {/* 输入区 */}
      <View className={styles.inputSection}>
        <Input
          className={styles.spellInput}
          value={inputValue}
          onInput={(e) => setInputValue(e.detail.value)}
          placeholder="请输入英文拼写..."
          focus
          disabled={showResult}
          onConfirm={handleConfirm}
        />
        {!showResult && (
          <View className={styles.confirmBtn} onClick={handleConfirm}>
            <Text>确认</Text>
          </View>
        )}
      </View>

      {/* 结果展示 */}
      {showResult && (
        <View className={`${styles.resultCard} ${results[results.length - 1]?.correct ? styles.correct : styles.wrong}`}>
          {results[results.length - 1]?.correct ? (
            <>
              <Text className={styles.resultIcon}>✅</Text>
              <Text className={styles.resultText}>正确！</Text>
            </>
          ) : (
            <>
              <Text className={styles.resultIcon}>❌</Text>
              <Text className={styles.resultText}>错误</Text>
              <View className={styles.answerRow}>
                <Text className={styles.answerLabel}>你的答案：</Text>
                <Text className={styles.wrongAnswer}>{results[results.length - 1]?.userAnswer}</Text>
              </View>
              <View className={styles.answerRow}>
                <Text className={styles.answerLabel}>正确答案：</Text>
                <Text className={styles.correctAnswer}>{currentWord.word}</Text>
              </View>
            </>
          )}
          <View className={styles.nextBtn} onClick={handleNext}>
            <Text>{index < total - 1 ? '下一题 ▶' : '查看结果 📊'}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default EngSpellPage
