import React, { useMemo, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEnglishStore } from '@/store/useEnglishStore'
import { savePracticeRecord, updateRank } from '@/services/api'
import { getWordsByGrade } from '@/data/englishWords'
import { EnglishWord } from '@/types'
import styles from './index.module.scss'

interface WordResult {
  word: EnglishWord
  userAnswer: string
  correctAnswer: string
  correct: boolean
}

const EngResultPage: React.FC = () => {
  const router = useRouter()
  const {
    score = '0',
    accuracy = '0',
    duration = '0',
    mode = 'spell',
    total = '10',
    correct = '0',
  } = router.params

  const store = useEnglishStore.getState()
  const { currentGrade, spellAnswers, listenAnswers, scores, words: storeWords } = store

  const scoreNum = parseInt(score as string, 10) || 0
  const accuracyNum = parseInt(accuracy as string, 10) || 0
  const durationNum = parseInt(duration as string, 10) || 0
  const totalNum = parseInt(total as string, 10) || 10
  const correctNum = parseInt(correct as string, 10) || 0

  const words = storeWords.length > 0 ? storeWords : getWordsByGrade(currentGrade)

  // 构建单词结果列表
  const wordResults = useMemo<WordResult[]>(() => {
    return words.slice(0, totalNum).map((word, i) => {
      const isCorrect = (scores[i] || 0) >= 100
      let userAnswer = ''
      if (mode === 'spell') {
        userAnswer = spellAnswers[i] || ''
      } else if (mode === 'listen') {
        const selectedIdx = listenAnswers[i]
        if (selectedIdx !== null && selectedIdx !== undefined) {
          userAnswer = words[selectedIdx]?.word || ''
        }
      }
      return {
        word,
        userAnswer,
        correctAnswer: word.word,
        correct: isCorrect,
      }
    })
  }, [words, totalNum, scores, spellAnswers, listenAnswers, mode])

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

  const getModeLabel = (m: string) => {
    switch (m) {
      case 'spell': return '拼写练习'
      case 'listen': return '听力选择'
      case 'test': return '综合测试'
      default: return '练习'
    }
  }

  // 保存记录
  useEffect(() => {
    const saveRecord = async () => {
      try {
        await savePracticeRecord({
          subject: 'english',
          type: mode === 'test' ? 'test' : 'practice',
          grade: currentGrade,
          contentJson: {
            mode,
            words: words.slice(0, totalNum).map((w) => w.word),
            scores,
            spellAnswers,
            listenAnswers,
            correctCount: correctNum,
            totalCount: totalNum,
          },
          score: scoreNum,
          accuracy: accuracyNum,
          duration: durationNum,
        })
        // 更新段位分
        updateRank({ subject: 'english', score: scoreNum }).catch(() => {})
      } catch (err) {
        console.error('[EngResult] save record error:', err)
      }
    }
    saveRecord()
  }, [])

  const handleRetry = () => {
    const pageMap: Record<string, string> = {
      spell: '/sub-english/eng-spell/index',
      listen: '/sub-english/eng-listen/index',
      test: '/sub-english/eng-test/index',
    }
    Taro.redirectTo({ url: pageMap[mode as string] || '/sub-english/eng-home/index' })
  }

  const handleGoHome = () => {
    Taro.redirectTo({ url: '/sub-english/eng-home/index' })
  }

  return (
    <View className={styles.page}>
      {/* 分数圈 */}
      <View className={`${styles.scoreCircle} ${styles[scoreInfo.level]}`}>
        <Text className={styles.scoreValue}>{scoreNum}</Text>
        <Text className={styles.scoreLabel}>分</Text>
      </View>

      {/* 鼓励语 */}
      <Text className={styles.encourage}>
        {scoreInfo.emoji} {scoreInfo.text}
      </Text>

      {/* 详情 */}
      <View className={styles.detailSection}>
        <Text className={styles.detailTitle}>{getModeLabel(mode as string)}详情</Text>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>正确率</Text>
          <View className={styles.scoreBar}>
            <View
              className={styles.scoreBarFill}
              style={{ width: `${accuracyNum}%` }}
            />
          </View>
          <Text className={styles.detailValue}>{accuracyNum}%</Text>
        </View>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>正确/总数</Text>
          <Text className={styles.detailValue}>{correctNum} / {totalNum}</Text>
        </View>
        <View className={styles.detailRow}>
          <Text className={styles.detailLabel}>用时</Text>
          <Text className={styles.detailValue}>{formatTime(durationNum)}</Text>
        </View>
      </View>

      {/* 单词列表 */}
      <View className={styles.wordListSection}>
        <Text className={styles.detailTitle}>答题详情</Text>
        <View className={styles.wordList}>
          {wordResults.map((result, i) => (
            <View
              key={i}
              className={`${styles.wordItem} ${result.correct ? styles.wordCorrect : styles.wordWrong}`}
            >
              <View className={styles.wordHeader}>
                <Text className={styles.wordIndex}>{i + 1}</Text>
                <Text className={styles.wordEn}>{result.word.word}</Text>
                <Text className={styles.wordCn}>{result.word.cn}</Text>
                <Text className={styles.wordStatus}>{result.correct ? '✅' : '❌'}</Text>
              </View>
              {!result.correct && result.userAnswer && (
                <View className={styles.wordDetail}>
                  <View className={styles.answerRow}>
                    <Text className={styles.answerLabel}>你的答案：</Text>
                    <Text className={styles.wrongText}>{result.userAnswer}</Text>
                  </View>
                  <View className={styles.answerRow}>
                    <Text className={styles.answerLabel}>正确答案：</Text>
                    <Text className={styles.correctText}>{result.correctAnswer}</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 按钮 */}
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

export default EngResultPage
