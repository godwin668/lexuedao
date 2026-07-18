import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useMathStore } from '@/store/useMathStore'
import { MathOpType, MathQuestion } from '@/types'
import styles from './index.module.scss'

const OP_TABS: { key: MathOpType | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: '+', label: '+' },
  { key: '-', label: '-' },
  { key: '×', label: '×' },
  { key: '÷', label: '÷' },
]

const COUNT_OPTIONS = [10, 20, 50]

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

function generateQuestion(index: number, grade: number, opFilter: MathOpType[]): MathQuestion {
  const ops = opFilter.length > 0 ? opFilter : ['+', '-', '×', '÷']
  const op = ops[randInt(0, ops.length - 1)]

  let a: number, b: number, answer: number, expression: string

  switch (op) {
    case '+':
      if (grade <= 1) {
        a = randInt(1, 19); b = randInt(1, 20 - a)
      } else if (grade <= 2) {
        a = randInt(10, 99); b = randInt(1, 99)
      } else if (grade <= 3) {
        a = randInt(100, 999); b = randInt(10, 999)
      } else {
        a = randInt(1000, 9999); b = randInt(100, 9999)
      }
      answer = a + b
      expression = `${a} + ${b} = ?`
      break
    case '-':
      if (grade <= 1) {
        a = randInt(5, 20); b = randInt(1, a)
      } else if (grade <= 2) {
        a = randInt(20, 99); b = randInt(1, a)
      } else if (grade <= 3) {
        a = randInt(100, 999); b = randInt(10, a)
      } else {
        a = randInt(1000, 9999); b = randInt(100, a)
      }
      answer = a - b
      expression = `${a} - ${b} = ?`
      break
    case '×':
      if (grade <= 2) {
        a = randInt(1, 9); b = randInt(1, 9)
      } else if (grade <= 3) {
        a = randInt(2, 9); b = randInt(11, 99)
      } else {
        a = randInt(10, 99); b = randInt(2, 9)
      }
      answer = a * b
      expression = `${a} × ${b} = ?`
      break
    case '÷':
      if (grade <= 2) {
        b = randInt(1, 9); answer = randInt(1, 9); a = b * answer
      } else if (grade <= 3) {
        b = randInt(2, 9); answer = randInt(10, 99); a = b * answer
      } else {
        b = randInt(2, 9); answer = randInt(10, 99); a = b * answer
      }
      expression = `${a} ÷ ${b} = ?`
      break
    default:
      a = randInt(1, 99); b = randInt(1, 99)
      answer = a + b
      expression = `${a} + ${b} = ?`
  }

  const options = generateOptions(answer, grade)

  return {
    id: index,
    expression,
    answer,
    options,
    type: op,
    difficulty: grade,
  }
}

function generateOptions(answer: number, _grade: number): number[] {
  const opts = new Set<number>()
  opts.add(answer)

  const range = Math.max(5, Math.abs(answer) + 10)
  while (opts.size < 4) {
    let wrong = answer + randInt(-range, range)
    if (wrong === answer) wrong += 1
    if (wrong < 0) wrong = Math.abs(wrong)
    opts.add(wrong)
  }

  return shuffle(Array.from(opts))
}

const MathPracticePage: React.FC = () => {
  const {
    currentGrade, questionCount, setQuestionCount,
    opFilter, setOpFilter,
    questions, setQuestions,
    currentIndex, setCurrentIndex,
    answers, setAnswer,
    scores, setScore,
  } = useMathStore()

  const [activeOp, setActiveOp] = useState<MathOpType | 'all'>('all')
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [timer, setTimer] = useState(0)
  const [started, setStarted] = useState(false)
  const timerRef = useRef<any>(null)

  // 初始化题目
  useEffect(() => {
    const ops = activeOp === 'all' ? (['+', '-', '×', '÷'] as MathOpType[]) : [activeOp]
    setOpFilter(ops)
    const qs: MathQuestion[] = []
    for (let i = 0; i < questionCount; i++) {
      qs.push(generateQuestion(i, currentGrade, ops))
    }
    setQuestions(qs)
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setAnswerState('idle')
    setTimer(0)
    setStarted(false)
  }, [currentGrade, questionCount, activeOp])

  // 计时器
  useEffect(() => {
    if (started) {
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1)
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [started])

  const currentQuestion = questions[currentIndex]

  const handleSelectOption = (opt: number) => {
    if (!started) setStarted(true)
    if (answerState !== 'idle' || !currentQuestion) return

    setSelectedAnswer(opt)
    const isCorrect = opt === currentQuestion.answer
    setAnswerState(isCorrect ? 'correct' : 'wrong')
    setAnswer(currentIndex, opt)
    setScore(currentIndex, isCorrect ? 1 : 0)

    // 自动下一题
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setSelectedAnswer(null)
        setAnswerState('idle')
      } else {
        // 完成
        handleFinish()
      }
    }, 800)
  }

  const handleFinish = () => {
    clearInterval(timerRef.current)
    const correctCount = scores.filter((s) => s === 1).length
    const totalScore = Math.round((correctCount / questions.length) * 100)
    const accuracy = Math.round((correctCount / questions.length) * 100)

    Taro.redirectTo({
      url: `/sub-math/math-result/index?score=${totalScore}&accuracy=${accuracy}&duration=${timer}&total=${questions.length}&correct=${correctCount}&type=practice`,
    })
  }

  const handleOpChange = (key: MathOpType | 'all') => {
    setActiveOp(key)
  }

  const handleCountChange = (count: number) => {
    setQuestionCount(count)
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
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </View>
          <Text className={styles.progressText}>
            {currentIndex + 1} / {questions.length}
          </Text>
        </View>
        <Text className={styles.timer}>{formatTime(timer)}</Text>
        <Text className={styles.score}>
          得分: {scores.filter((s) => s === 1).length}
        </Text>
      </View>

      {/* 运算符筛选 */}
      <View className={styles.opFilter}>
        {OP_TABS.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.opTab, activeOp === tab.key && styles.opActive)}
            onClick={() => handleOpChange(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      {/* 题目数量选择 */}
      <View className={styles.countRow}>
        <Text className={styles.countLabel}>题目数量：</Text>
        {COUNT_OPTIONS.map((c) => (
          <View
            key={c}
            className={classnames(styles.countTag, questionCount === c && styles.countActive)}
            onClick={() => handleCountChange(c)}
          >
            <Text>{c}题</Text>
          </View>
        ))}
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
    </View>
  )
}

export default MathPracticePage
