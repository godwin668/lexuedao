import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useGameStore } from '@/store/useGameStore'
import { useUserStore } from '@/store/useUserStore'
import { startBattle, submitBattleAnswer, getBattleResult } from '@/services/api'
import styles from './index.module.scss'

const SUBJECTS = [
  { key: 'chinese', label: '语文', color: '#47B881' },
  { key: 'math', label: '数学', color: '#FF8C42' },
  { key: 'english', label: '英语', color: '#7C5CFC' },
]

const MOCK_QUESTIONS = [
  {
    question: '"白日依山尽"的下一句是？',
    options: ['黄河入海流', '更上一层楼', '春风吹又生', '疑是地上霜'],
    answer: 0,
  },
  {
    question: '下列哪个不是唐代诗人？',
    options: ['李白', '杜甫', '苏轼', '白居易'],
    answer: 2,
  },
  {
    question: '"床前明月光"的作者是？',
    options: ['杜甫', '白居易', '王维', '李白'],
    answer: 3,
  },
]

const BattlePage: React.FC = () => {
  const { battleStatus, battleRoomId, setBattleStatus, setBattleRoomId } = useGameStore()
  const { user, gameProfile } = useUserStore()

  const [subject, setSubject] = useState('chinese')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | null>(null)
  const [myScore, setMyScore] = useState(0)
  const [result, setResult] = useState<{ winnerId: number; player1Score: number; player2Score: number } | null>(null)
  const [reward, setReward] = useState<{ exp: number; coins: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleStartBattle = useCallback(async () => {
    setLoading(true)
    setBattleStatus('matching')
    try {
      const res = await startBattle({ subject })
      setBattleRoomId(res.roomId)
      // 模拟匹配成功
      setTimeout(() => {
        setBattleStatus('playing')
        setCurrentQuestion(0)
        setMyScore(0)
        setSelectedOption(null)
        setAnswerResult(null)
        setResult(null)
        setReward(null)
        setLoading(false)
      }, 1500)
    } catch (err: any) {
      console.error('开始对战失败:', err)
      Taro.showToast({ title: err?.message || '匹配失败，请重试', icon: 'none' })
      setBattleStatus('idle')
      setLoading(false)
    }
  }, [subject, setBattleStatus, setBattleRoomId])

  const handleSelectOption = useCallback(async (index: number) => {
    if (selectedOption !== null) return
    setSelectedOption(index)

    const isCorrect = index === MOCK_QUESTIONS[currentQuestion].answer
    setAnswerResult(isCorrect ? 'correct' : 'wrong')

    try {
      if (battleRoomId) {
        const res = await submitBattleAnswer({
          roomId: battleRoomId,
          questionIndex: currentQuestion,
          answer: index,
        })
        if (res.correct) {
          setMyScore((prev) => prev + res.score)
        }
      } else {
        // 无 roomId 时本地计分
        if (isCorrect) setMyScore((prev) => prev + 10)
      }
    } catch (err: any) {
      console.error('提交答案失败:', err)
      if (isCorrect) setMyScore((prev) => prev + 10)
    }

    timerRef.current = setTimeout(() => {
      if (currentQuestion < MOCK_QUESTIONS.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
        setSelectedOption(null)
        setAnswerResult(null)
      } else {
        handleFinish()
      }
    }, 1200)
  }, [currentQuestion, selectedOption, battleRoomId])

  const handleFinish = useCallback(async () => {
    setBattleStatus('finished')
    const opponentScore = Math.max(0, myScore - 10 + Math.floor(Math.random() * 20))
    const won = myScore > opponentScore

    try {
      if (battleRoomId) {
        const res = await getBattleResult(battleRoomId)
        setResult(res)
        setReward({
          exp: won ? 50 : 20,
          coins: won ? 30 : 10,
        })
      } else {
        setResult({
          winnerId: won ? (user?.id || 1) : 2,
          player1Score: myScore,
          player2Score: opponentScore,
        })
        setReward({
          exp: won ? 50 : 20,
          coins: won ? 30 : 10,
        })
      }
    } catch (err: any) {
      console.error('获取对战结果失败:', err)
      setResult({
        winnerId: won ? (user?.id || 1) : 2,
        player1Score: myScore,
        player2Score: opponentScore,
      })
      setReward({ exp: won ? 50 : 20, coins: won ? 30 : 10 })
    }
  }, [myScore, battleRoomId, user, setBattleStatus])

  const handlePlayAgain = useCallback(() => {
    setBattleStatus('idle')
    setBattleRoomId(null)
    setCurrentQuestion(0)
    setSelectedOption(null)
    setAnswerResult(null)
    setMyScore(0)
    setResult(null)
    setReward(null)
  }, [setBattleStatus, setBattleRoomId])

  const won = result && user ? result.winnerId === user.id : false

  return (
    <View className={styles.page}>
      {/* 头部 */}
      <View className={styles.header}>
        <Text className={styles.title}>⚔️ 好友对战</Text>
        <Text className={styles.subtitle}>
          等级 {gameProfile?.level || 1} · {battleStatus === 'idle' ? '选择学科开始对战' : battleStatus === 'matching' ? '正在匹配对手...' : battleStatus === 'playing' ? `第 ${currentQuestion + 1}/${MOCK_QUESTIONS.length} 题` : '对战结束'}
        </Text>
      </View>

      {/* 空闲状态：选择学科 + 开始匹配 */}
      {battleStatus === 'idle' && (
        <View className={styles.idleSection}>
          <View className={styles.subjectCard}>
            <Text className={styles.sectionTitle}>选择学科</Text>
            <View className={styles.subjectList}>
              {SUBJECTS.map((s) => (
                <View
                  key={s.key}
                  className={`${styles.subjectItem} ${subject === s.key ? styles.subjectActive : ''}`}
                  style={subject === s.key ? { borderColor: s.color, background: `${s.color}15` } : {}}
                  onClick={() => setSubject(s.key)}
                >
                  <Text className={styles.subjectLabel} style={{ color: s.color }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.startCard}>
            <View className={styles.rulesBox}>
              <Text className={styles.rulesTitle}>📋 对战规则</Text>
              <Text className={styles.ruleItem}>· 共 {MOCK_QUESTIONS.length} 道题目</Text>
              <Text className={styles.ruleItem}>· 答对得分，答错不扣分</Text>
              <Text className={styles.ruleItem}>· 得分高者获胜</Text>
              <Text className={styles.ruleItem}>· 获胜可获得额外奖励</Text>
            </View>
            <Button
              className={styles.startBtn}
              onClick={handleStartBattle}
              loading={loading}
              disabled={loading}
            >
              开始匹配
            </Button>
          </View>
        </View>
      )}

      {/* 匹配中 */}
      {battleStatus === 'matching' && (
        <View className={styles.matchingSection}>
          <View className={styles.matchingAnimation}>
            <View className={styles.matchingCircle} />
            <View className={styles.matchingCircle2} />
            <View className={styles.matchingCircle3} />
          </View>
          <Text className={styles.matchingText}>正在为您匹配对手...</Text>
          <Text className={styles.matchingHint}>请稍候</Text>
        </View>
      )}

      {/* 对战中 */}
      {battleStatus === 'playing' && (
        <View className={styles.playingSection}>
          <View className={styles.questionCard}>
            <View className={styles.questionHeader}>
              <Text className={styles.questionNum}>第 {currentQuestion + 1} 题</Text>
              <Text className={styles.scoreDisplay}>得分：{myScore}</Text>
            </View>
            <Text className={styles.questionText}>{MOCK_QUESTIONS[currentQuestion].question}</Text>
            <View className={styles.options}>
              {MOCK_QUESTIONS[currentQuestion].options.map((opt, idx) => {
                let optClass = styles.optionItem
                if (selectedOption === idx) {
                  if (answerResult === 'correct') {
                    optClass += ` ${styles.optionCorrect}`
                  } else if (answerResult === 'wrong') {
                    if (idx === MOCK_QUESTIONS[currentQuestion].answer) {
                      optClass += ` ${styles.optionCorrect}`
                    } else {
                      optClass += ` ${styles.optionWrong}`
                    }
                  }
                } else if (selectedOption !== null && idx === MOCK_QUESTIONS[currentQuestion].answer) {
                  optClass += ` ${styles.optionCorrect}`
                }
                return (
                  <View
                    key={idx}
                    className={optClass}
                    onClick={() => handleSelectOption(idx)}
                  >
                    <Text className={styles.optionLabel}>{String.fromCharCode(65 + idx)}</Text>
                    <Text className={styles.optionText}>{opt}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        </View>
      )}

      {/* 对战结束 */}
      {battleStatus === 'finished' && result && (
        <View className={styles.resultSection}>
          <View className={styles.resultCard}>
            <Text className={styles.resultIcon}>{won ? '🎉' : '😢'}</Text>
            <Text className={styles.resultTitle} style={{ color: won ? '#FAAD14' : '#FF4D4F' }}>
              {won ? '胜利！' : '失败'}
            </Text>
            <View className={styles.scoreBoard}>
              <View className={styles.scoreItem}>
                <Text className={styles.scoreLabel}>我方得分</Text>
                <Text className={styles.scoreValue} style={{ color: '#4A90D9' }}>
                  {result.player1Score}
                </Text>
              </View>
              <Text className={styles.scoreVs}>VS</Text>
              <View className={styles.scoreItem}>
                <Text className={styles.scoreLabel}>对手得分</Text>
                <Text className={styles.scoreValue} style={{ color: '#FF4D4F' }}>
                  {result.player2Score}
                </Text>
              </View>
            </View>
            {reward && (
              <View className={styles.rewardBox}>
                <Text className={styles.rewardTitle}>获得奖励</Text>
                <View className={styles.rewardItems}>
                  <View className={styles.rewardItem}>
                    <Text className={styles.rewardIcon}>⭐</Text>
                    <Text className={styles.rewardValue}>+{reward.exp} 经验</Text>
                  </View>
                  <View className={styles.rewardItem}>
                    <Text className={styles.rewardIcon}>🪙</Text>
                    <Text className={styles.rewardValue}>+{reward.coins} 金币</Text>
                  </View>
                </View>
              </View>
            )}
            <Button className={styles.playAgainBtn} onClick={handlePlayAgain}>
              再来一局
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}

export default BattlePage
