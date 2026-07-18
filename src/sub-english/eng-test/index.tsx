import React, { useState, useMemo, useEffect, useRef } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEnglishStore } from '@/store/useEnglishStore'
import { getWordsByGrade } from '@/data/englishWords'
import { EnglishWord } from '@/types'
import styles from './index.module.scss'

type QuestionType = 'wordToCn' | 'cnToWord' | 'listen'

interface TestQuestion {
  type: QuestionType
  word: EnglishWord
  options: EnglishWord[]
  correctIndex: number
}

interface TestResult {
  question: TestQuestion
  userAnswer: string
  correct: boolean
}

const TEST_DURATION = 10 * 60 // 10分钟

const EngTestPage: React.FC = () => {
  const { currentGrade } = useEnglishStore()
  const words = useMemo(() => getWordsByGrade(currentGrade), [currentGrade])

  // 生成混合题型题目
  const questions = useMemo<TestQuestion[]>(() => {
    const qs: TestQuestion[] = []
    const shuffled = [...words].sort(() => Math.random() - 0.5)
    shuffled.forEach((word) => {
      const typeIndex = Math.floor(Math.random() * 3)
      const types: QuestionType[] = ['wordToCn', 'cnToWord', 'listen']
      const type = types[typeIndex]
      const others = words.filter((w) => w.word !== word.word).sort(() => Math.random() - 0.5).slice(0, 3)
      const allOptions = [word, ...others].sort(() => Math.random() - 0.5)
      const correctIndex = allOptions.findIndex((o) => o.word === word.word)
      qs.push({ type, word, options: allOptions, correctIndex })
    })
    return qs
  }, [words])

  const total = questions.length
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<TestResult[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [timer, setTimer] = useState(TEST_DURATION)
  const [startTime] = useState(Date.now())
  const timerRef = useRef<any>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleSubmit()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const currentQuestion = questions[index]

  const handleSelectOption = (optionIndex: number) => {
    if (showResult) return
    setSelectedOption(optionIndex)
    const isCorrect = optionIndex === currentQuestion.correctIndex
    const newResults = [...results, {
      question: currentQuestion,
      userAnswer: currentQuestion.options[optionIndex].word,
      correct: isCorrect,
    }]
    setResults(newResults)
    setShowResult(true)

    const store = useEnglishStore.getState()
    store.setScore(index, isCorrect ? 100 : 0)
  }

  const handleSpellConfirm = () => {
    if (!inputValue.trim() || showResult) return
    const isCorrect = inputValue.trim().toLowerCase() === currentQuestion.word.word.toLowerCase()
    const newResults = [...results, {
      question: currentQuestion,
      userAnswer: inputValue.trim(),
      correct: isCorrect,
    }]
    setResults(newResults)
    setShowResult(true)

    const store = useEnglishStore.getState()
    store.setSpellAnswer(index, inputValue.trim())
    store.setScore(index, isCorrect ? 100 : 0)
  }

  const handlePlay = () => {
    Taro.showToast({ title: `🔊 ${currentQuestion.word.word}`, icon: 'none', duration: 1500 })
  }

  const handleNext = () => {
    if (index < total - 1) {
      setIndex(index + 1)
      setSelectedOption(null)
      setInputValue('')
      setShowResult(false)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    clearInterval(timerRef.current)
    const correctCount = results.filter((r) => r.correct).length
    const accuracy = Math.round((correctCount / total) * 100)
    const score = Math.round(accuracy * 0.8 + correctCount * 2)
    const duration = Math.round((Date.now() - startTime) / 1000)

    const store = useEnglishStore.getState()
    store.setWords(words)

    Taro.redirectTo({
      url: `/sub-english/eng-result/index?score=${score}&accuracy=${accuracy}&duration=${duration}&mode=test&total=${total}&correct=${correctCount}`,
    })
  }

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60)
    const sec = s % 60
    return `${min}:${String(sec).padStart(2, '0')}`
  }

  const correctCount = results.filter((r) => r.correct).length

  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'wordToCn': return '看词选义'
      case 'cnToWord': return '看义拼词'
      case 'listen': return '听音选词'
    }
  }

  if (!currentQuestion) return null

  return (
    <View className={styles.page}>
      {/* 顶部栏 */}
      <View className={styles.topBar}>
        <View className={styles.typeTag}>
          <Text>{getTypeLabel(currentQuestion.type)}</Text>
        </View>
        <Text className={styles.timer}>{formatTime(timer)}</Text>
      </View>

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

      {/* 题目区域 */}
      <View className={styles.questionArea}>
        {currentQuestion.type === 'wordToCn' && (
          <>
            <Text className={styles.questionLabel}>请选择以下单词的中文意思</Text>
            <Text className={styles.bigWord}>{currentQuestion.word.word}</Text>
          </>
        )}
        {currentQuestion.type === 'cnToWord' && (
          <>
            <Text className={styles.questionLabel}>请拼写以下中文对应的英文单词</Text>
            <Text className={styles.bigWord}>{currentQuestion.word.cn}</Text>
            <View className={styles.spellInputRow}>
              <Input
                className={styles.spellInput}
                value={inputValue}
                onInput={(e) => setInputValue(e.detail.value)}
                placeholder="请输入英文..."
                disabled={showResult}
                onConfirm={handleSpellConfirm}
              />
              {!showResult && (
                <View className={styles.confirmBtn} onClick={handleSpellConfirm}>
                  <Text>确认</Text>
                </View>
              )}
            </View>
          </>
        )}
        {currentQuestion.type === 'listen' && (
          <>
            <Text className={styles.questionLabel}>请选择听到的单词</Text>
            <View className={styles.playBtn} onClick={handlePlay}>
              <Text className={styles.playIcon}>🔊</Text>
              <Text className={styles.playText}>点击播放发音</Text>
            </View>
          </>
        )}
      </View>

      {/* 选项（非拼写题） */}
      {currentQuestion.type !== 'cnToWord' && (
        <View className={styles.optionsGrid}>
          {currentQuestion.options.map((opt, i) => {
            let optionClass = styles.optionItem
            if (showResult) {
              if (i === currentQuestion.correctIndex) {
                optionClass += ` ${styles.optionCorrect}`
              } else if (i === selectedOption && !results[results.length - 1]?.correct) {
                optionClass += ` ${styles.optionWrong}`
              }
            } else if (i === selectedOption) {
              optionClass += ` ${styles.optionSelected}`
            }
            return (
              <View key={i} className={optionClass} onClick={() => handleSelectOption(i)}>
                <Text className={styles.optionWord}>{opt.word}</Text>
                <Text className={styles.optionCn}>{opt.cn}</Text>
              </View>
            )
          })}
        </View>
      )}

      {/* 结果提示 */}
      {showResult && (
        <View className={`${styles.resultHint} ${results[results.length - 1]?.correct ? styles.hintCorrect : styles.hintWrong}`}>
          <Text className={styles.hintIcon}>{results[results.length - 1]?.correct ? '✅' : '❌'}</Text>
          <Text className={styles.hintText}>
            {results[results.length - 1]?.correct
              ? '回答正确！'
              : `正确答案：${currentQuestion.word.word}（${currentQuestion.word.cn}）`
            }
          </Text>
          {!results[results.length - 1]?.correct && currentQuestion.type === 'cnToWord' && (
            <View className={styles.answerRow}>
              <Text className={styles.answerLabel}>你的答案：</Text>
              <Text className={styles.wrongAnswer}>{results[results.length - 1]?.userAnswer}</Text>
            </View>
          )}
          <View className={styles.nextBtn} onClick={handleNext}>
            <Text>{index < total - 1 ? '下一题 ▶' : '查看结果 📊'}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default EngTestPage
