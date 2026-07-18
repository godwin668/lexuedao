import React, { useEffect, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import { useMathStore } from '@/store/useMathStore'
import { savePracticeRecord } from '@/services/api'
import styles from './index.module.scss'

const MathResultPage: React.FC = () => {
  const router = useRouter()
  const {
    score = '0',
    accuracy = '0',
    duration = '0',
    total = '0',
    correct = '0',
    type = 'practice',
  } = router.params

  const { questions, answers, scores, currentGrade } = useMathStore()

  const scoreNum = parseInt(score as string, 10) || 0
  const accuracyNum = parseInt(accuracy as string, 10) || 0
  const durationNum = parseInt(duration as string, 10) || 0
  const totalNum = parseInt(total as string, 10) || 0
  const correctNum = parseInt(correct as string, 10) || 0

  const getScoreLevel = (s: number) => {
    if (s >= 90) return { level: 'excellent', text: '太棒了！', emoji: '🌟' }
    if (s >= 75) return { level: 'good', text: '做得不错！', emoji: '👍' }
    if (s >= 60) return { level: 'fair', text: '继续加油！', emoji: '💪' }
    return { level: 'poor', text: '再练练吧！', emoji: '📖' }
  }

  const scoreInfo = getScoreLevel(scoreNum)

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60)
    const sec = s % 60
    return `${min}分${sec}秒`
  }

  // 保存记录
  useEffect(() => {
    const saveRecord = async () => {
      try {
        await savePracticeRecord({
          subject: 'math',
          type: type as string,
          grade: currentGrade,
          contentJson: {
            questions: questions.map((q) => ({
              expression: q.expression,
              answer: q.answer,
              type: q.type,
            })),
            answers,
            scores,
            total: totalNum,
            correct: correctNum,
          },
          score: scoreNum,
          accuracy: accuracyNum,
          duration: durationNum,
        })
      } catch (err) {
        console.error('[MathResult] save record error:', err)
      }
    }
    saveRecord()
  }, [])

  // 答题详情列表
  const detailList = useMemo(() => {
    return questions.slice(0, totalNum).map((q, i) => ({
      expression: q.expression,
      correctAnswer: q.answer,
      userAnswer: answers[i] ?? null,
      isCorrect: scores[i] === 1,
    }))
  }, [questions, answers, scores, totalNum])

  const handleRetry = () => {
    if (type === 'test') {
      Taro.redirectTo({ url: '/sub-math/math-test/index' })
    } else {
      Taro.redirectTo({ url: '/sub-math/math-practice/index' })
    }
  }

  const handleGoHome = () => {
    Taro.switchTab({ url: '/pages/home/index' })
  }

  return (
    <View className={styles.page}>
      {/* 分数圆环 */}
      <View className={classnames(styles.scoreCircle, styles[scoreInfo.level])}>
        <Text className={styles.scoreValue}>{scoreNum}</Text>
        <Text className={styles.scoreLabel}>分</Text>
      </View>

      <Text className={styles.encourage}>
        {scoreInfo.emoji} {scoreInfo.text}
      </Text>

      {/* 统计详情 */}
      <View className={styles.statsSection}>
        <View className={styles.statRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{correctNum}/{totalNum}</Text>
            <Text className={styles.statLabel}>正确题数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{accuracyNum}%</Text>
            <Text className={styles.statLabel}>正确率</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatTime(durationNum)}</Text>
            <Text className={styles.statLabel}>用时</Text>
          </View>
        </View>
      </View>

      {/* 答题详情 */}
      <View className={styles.detailSection}>
        <Text className={styles.detailTitle}>答题详情</Text>
        <ScrollView scrollY className={styles.detailList}>
          {detailList.length > 0 ? (
            detailList.map((item, i) => (
              <View
                key={i}
                className={classnames(styles.detailItem, item.isCorrect ? styles.itemCorrect : styles.itemWrong)}
              >
                <View className={styles.itemLeft}>
                  <Text className={styles.itemIndex}>{i + 1}</Text>
                  <Text className={styles.itemExpr}>{item.expression.replace(' = ?', '')}</Text>
                </View>
                <View className={styles.itemRight}>
                  {!item.isCorrect && item.userAnswer !== null && (
                    <Text className={styles.userAnswer}>{item.userAnswer}</Text>
                  )}
                  <Text className={styles.correctAnswer}>{item.correctAnswer}</Text>
                </View>
              </View>
            ))
          ) : (
            <View className={styles.emptyDetail}>
              <Text className={styles.emptyText}>暂无答题记录</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* 底部按钮 */}
      <View className={styles.actions}>
        <View className={`${styles.actionBtn} ${styles.backBtn}`} onClick={handleGoHome}>
          <Text>返回首页</Text>
        </View>
        <View className={`${styles.actionBtn} ${styles.retryBtn}`} onClick={handleRetry}>
          <Text>再来一次</Text>
        </View>
      </View>
    </View>
  )
}

export default MathResultPage
