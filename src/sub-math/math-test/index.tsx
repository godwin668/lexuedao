import React, { useState, useEffect, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useMathStore } from '@/store/useMathStore'
import { MathOpType, MathQuestion } from '@/types'
import styles from './index.module.scss'

const TEST_DURATION = 300 // 5分钟
const TEST_COUNT = 20

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateTestQuestion(index: number, grade: number): MathQuestion {
  const ops: MathOpType[] = ['+', '-', '×', '÷']
  const op = ops[randInt(0, ops.length - 1)]

  let a: number, b: number, answer: number, expression: string

  switch (op) {
    case '+':
      if (grade <= 1) { a = randInt(1, 19); b = randInt(1, 20 - a) }
      else if (grade <= 2) { a = randInt(10, 99); b = randInt(1, 99) }
      else if (grade <= 3) { a = randInt(100, 999); b = randInt(10, 999) }
      else { a = randInt(1000, 9999); b = randInt(100, 9999) }
      answer = a + b
      expression = `${a} + ${b} = ?`
      break
    case '-':
      if (grade <= 1) { a = randInt(5, 20); b = randInt(1, a) }
      else if (grade <= 2) { a = randInt(20, 99); b = randInt(1, a) }
      else if (grade <= 3) { a = randInt(100, 999); b = randInt(10, a) }
      else { a = randInt(1000, 9999); b = randInt(100, a) }
      answer = a - b
      expression = `${a} - ${b} = ?`
      break
    case '×':
      if (grade <= 2) { a = randInt(1, 9); b = randInt(1, 9) }
      else if (grade <= 3) { a = randInt(2, 9); b = randInt(11, 99) }
      else { a = randInt(10, 99); b = randInt(2, 9) }
      answer = a * b
      expression = `${a} × ${b} = ?`
      break
    case '÷':
      if (grade <= 2) { b = randInt(1, 9); answer = randInt(1, 9); a = b * answer }
      else { b = randInt(2, 9); answer = randInt(10, 99); a = b * answer }
      expression = `${a} ÷ ${b} = ?`
      break
    default:
      a = randInt(1, 99); b = randInt(1, 99)
      answer = a + b
      expression = `${a} + ${b} = ?`
  }

  const opts = new Set<number>()
  opts.add(answer)
  const range = Math.max(5, Math.abs(answer) + 10)
  while (opts.size < 4) {
    let wrong = answer + randInt(-range, range)
    if (wrong === answer) wrong += 1
    if (wrong < 0) wrong = Math.abs(wrong)
    opts.add(wrong)
  }

  return {
    id: index,
    expression,
    answer,
    options: shuffle(Array.from(opts)),
    type: op,
    difficulty: grade,
  }
}

const MathTestPage: React.FC = () => {
  const { currentGrade, setQuestions, setCurrentIndex, setAnswer, setScore } = useMathStore()

  const [questions, setLocalQuestions] = useState<MathQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION)
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([])
  const [userScores, setUserScores] = useState<number[]>([])
  const [finished, setFinished] = useState(false)
  const timerRef = useRef<any>(null)

  // 初始化
  useEffect(() => {
    const qs: MathQuestion[] = []
    for (let i = 0; i < TEST_COUNT; i++) {
      qs.push(generateTestQuestion(i, currentGrade))
    }
    setLocalQuestions(qs)
    setQuestions(qs)
    setUserAnswers(new Array(TEST_COUNT).fill(null))
    setUserScores(new Array(TEST_COUNT).fill(0))

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [])

  // 时间到自动提交
  useEffect(() => {
    if (timeLeft <= 0 && !finished) {
      handleSubmit()
    }
  }, [timeLeft])

  const currentQuestion = questions[currentIdx]

  const handleSelectOption = (opt: number) => {
    if (answerState !== 'idle' || !currentQuestion || finished) return

    setSelectedAnswer(opt)
    const isCorrect = opt === currentQuestion.answer
    setAnswerState(isCorrect ? 'correct' : 'wrong')

    const newAnswers = [...userAnswers]
    newAnswers[currentIdx] = opt
    setUserAnswers(newAnswers)

    const newScores = [...userScores]
    newScores[currentIdx] = isCorrect ? 1 : 0
    setUserScores(newScores)

    setAnswer(currentIdx, opt)
    setScore(currentIdx, isCorrect ? 1 : 0)

    // 自动下一题
    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1)
        setCurrentIndex(currentIdx + 1)
        setSelectedAnswer(null)
        setAnswerState('idle')
      } else {
        handleSubmit()
      }
    }, 600)
  }

  const handleSubmit = () => {
    if (finished) return
    setFinished(true)
    clearInterval(timerRef.current)

    const correctCount = userScores.filter((s) => s === 1).length
    const totalScore = Math.round((correctCount / questions.length) * 100)
    const accuracy = Math.round((correctCount / questions.length) * 100)
    const duration = TEST_DURATION - timeLeft

    Taro.redirectTo({
      url: `/sub-math/math-result/index?score=${totalScore}&accuracy=${accuracy}&duration=${duration}&total=${questions.length}&correct=${correctCount}&type=test`,
    })
  }

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60)
    const sec = s % 60
    return `${min}:${String(sec).padStart(2, '0')}`
  }

  if (!currentQuestion) {
    return (
      <View className={styles.page}>
        <View className={styles.loading}>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      {/* 顶部信息栏 */}
      <View className={styles.topBar}>
        <View className={styles.progressWrap}>
          <View className={styles.progressBar}>
            <View
              className={styles.progressFill}
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </View>
          <Text className={styles.progressText}>
            {currentIdx + 1} / {questions.length}
          </Text>
        </View>
        <View className={classnames(styles.countdown, timeLeft <= 30 && styles.countdownWarn)}>
          <Text>⏱ {formatTime(timeLeft)}</Text>
        </View>
      </View>

      {/* 题目区域 */}
      <View className={styles.questionSection}>
        <Text className={styles.expression}>{currentQuestion.expression}</Text>
      </View>

      {/* 选项区域 */}
      <View className={styles.optionsGrid}>
        {currentQuestion.options?.map((opt, idx) => {
          let optClass = styles.optionBtn
          if (answerState !== 'idle' && selectedAnswer === opt) {
            optClass = classnames(styles.optionBtn, answerState === 'correct' ? styles.optionCorrect : styles.optionWrong)
          } else if (answerState !== 'idle' && opt === currentQuestion.answer) {
            optClass = classnames(styles.optionBtn, styles.optionCorrect)
          }
          return (
            <View key={idx} className={optClass} onClick={() => handleSelectOption(opt)}>
              <Text>{opt}</Text>
            </View>
          )
        })}
      </View>

      {/* 底部进度指示器 */}
      <View className={styles.dotBar}>
        {questions.map((_, i) => (
          <View
            key={i}
            className={classnames(
              styles.dot,
              i < currentIdx && (userScores[i] === 1 ? styles.dotCorrect : styles.dotWrong),
              i === currentIdx && styles.dotCurrent,
            )}
          />
        ))}
      </View>
    </View>
  )
}

export default MathTestPage
