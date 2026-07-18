import React, { useMemo, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEnglishStore } from '@/store/useEnglishStore'
import { savePracticeRecord } from '@/services/api'
import { EnglishWord } from '@/types'
import styles from './index.module.scss'

// 内置单词数据
const WORD_DATA: Record<number, EnglishWord[]> = {
  1: [
    { word: 'apple', cn: '苹果', phonetic: '/ˈæp.əl/', image: '', grade: 1, unit: '1' },
    { word: 'book', cn: '书', phonetic: '/bʊk/', image: '', grade: 1, unit: '1' },
    { word: 'cat', cn: '猫', phonetic: '/kæt/', image: '', grade: 1, unit: '1' },
    { word: 'dog', cn: '狗', phonetic: '/dɒɡ/', image: '', grade: 1, unit: '1' },
    { word: 'egg', cn: '鸡蛋', phonetic: '/eɡ/', image: '', grade: 1, unit: '1' },
    { word: 'fish', cn: '鱼', phonetic: '/fɪʃ/', image: '', grade: 1, unit: '1' },
    { word: 'girl', cn: '女孩', phonetic: '/ɡɜːl/', image: '', grade: 1, unit: '1' },
    { word: 'house', cn: '房子', phonetic: '/haʊs/', image: '', grade: 1, unit: '1' },
    { word: 'ice', cn: '冰', phonetic: '/aɪs/', image: '', grade: 1, unit: '1' },
    { word: 'jump', cn: '跳', phonetic: '/dʒʌmp/', image: '', grade: 1, unit: '1' },
  ],
  2: [
    { word: 'animal', cn: '动物', phonetic: '/ˈæn.ɪ.məl/', image: '', grade: 2, unit: '1' },
    { word: 'banana', cn: '香蕉', phonetic: '/bəˈnæn.ə/', image: '', grade: 2, unit: '1' },
    { word: 'color', cn: '颜色', phonetic: '/ˈkʌl.ər/', image: '', grade: 2, unit: '1' },
    { word: 'dance', cn: '跳舞', phonetic: '/dæns/', image: '', grade: 2, unit: '1' },
    { word: 'elephant', cn: '大象', phonetic: '/ˈel.ɪ.fənt/', image: '', grade: 2, unit: '1' },
    { word: 'family', cn: '家庭', phonetic: '/ˈfæm.əl.i/', image: '', grade: 2, unit: '1' },
    { word: 'green', cn: '绿色', phonetic: '/ɡriːn/', image: '', grade: 2, unit: '1' },
    { word: 'happy', cn: '快乐', phonetic: '/ˈhæp.i/', image: '', grade: 2, unit: '1' },
    { word: 'insect', cn: '昆虫', phonetic: '/ˈɪn.sekt/', image: '', grade: 2, unit: '1' },
    { word: 'juice', cn: '果汁', phonetic: '/dʒuːs/', image: '', grade: 2, unit: '1' },
  ],
  3: [
    { word: 'beautiful', cn: '美丽的', phonetic: '/ˈbjuː.tɪ.fəl/', image: '', grade: 3, unit: '1' },
    { word: 'chicken', cn: '鸡', phonetic: '/ˈtʃɪk.ɪn/', image: '', grade: 3, unit: '1' },
    { word: 'doctor', cn: '医生', phonetic: '/ˈdɒk.tər/', image: '', grade: 3, unit: '1' },
    { word: 'English', cn: '英语', phonetic: '/ˈɪŋ.ɡlɪʃ/', image: '', grade: 3, unit: '1' },
    { word: 'flower', cn: '花', phonetic: '/flaʊər/', image: '', grade: 3, unit: '1' },
    { word: 'garden', cn: '花园', phonetic: '/ˈɡɑːr.dən/', image: '', grade: 3, unit: '1' },
    { word: 'hospital', cn: '医院', phonetic: '/ˈhɒs.pɪ.təl/', image: '', grade: 3, unit: '1' },
    { word: 'interesting', cn: '有趣的', phonetic: '/ˈɪn.trə.stɪŋ/', image: '', grade: 3, unit: '1' },
    { word: 'kitchen', cn: '厨房', phonetic: '/ˈkɪtʃ.ɪn/', image: '', grade: 3, unit: '1' },
    { word: 'library', cn: '图书馆', phonetic: '/ˈlaɪ.brər.i/', image: '', grade: 3, unit: '1' },
  ],
  4: [
    { word: 'adventure', cn: '冒险', phonetic: '/ədˈven.tʃər/', image: '', grade: 4, unit: '1' },
    { word: 'breakfast', cn: '早餐', phonetic: '/ˈbrek.fəst/', image: '', grade: 4, unit: '1' },
    { word: 'computer', cn: '电脑', phonetic: '/kəmˈpjuː.tər/', image: '', grade: 4, unit: '1' },
    { word: 'dictionary', cn: '字典', phonetic: '/ˈdɪk.ʃən.er.i/', image: '', grade: 4, unit: '1' },
    { word: 'exercise', cn: '练习', phonetic: '/ˈek.sər.saɪz/', image: '', grade: 4, unit: '1' },
    { word: 'favorite', cn: '最喜欢的', phonetic: '/ˈfeɪ.vər.ɪt/', image: '', grade: 4, unit: '1' },
    { word: 'geography', cn: '地理', phonetic: '/dʒiˈɒɡ.rə.fi/', image: '', grade: 4, unit: '1' },
    { word: 'history', cn: '历史', phonetic: '/ˈhɪs.tər.i/', image: '', grade: 4, unit: '1' },
    { word: 'important', cn: '重要的', phonetic: '/ɪmˈpɔːr.tənt/', image: '', grade: 4, unit: '1' },
    { word: 'journey', cn: '旅行', phonetic: '/ˈdʒɜː.ni/', image: '', grade: 4, unit: '1' },
  ],
  5: [
    { word: 'achievement', cn: '成就', phonetic: '/əˈtʃiːv.mənt/', image: '', grade: 5, unit: '1' },
    { word: 'bicycle', cn: '自行车', phonetic: '/ˈbaɪ.sɪ.kəl/', image: '', grade: 5, unit: '1' },
    { word: 'celebrate', cn: '庆祝', phonetic: '/ˈsel.ə.breɪt/', image: '', grade: 5, unit: '1' },
    { word: 'dangerous', cn: '危险的', phonetic: '/ˈdeɪn.dʒər.əs/', image: '', grade: 5, unit: '1' },
    { word: 'environment', cn: '环境', phonetic: '/ɪnˈvaɪ.rən.mənt/', image: '', grade: 5, unit: '1' },
    { word: 'furniture', cn: '家具', phonetic: '/ˈfɜː.nɪ.tʃər/', image: '', grade: 5, unit: '1' },
    { word: 'government', cn: '政府', phonetic: '/ˈɡʌv.ərn.mənt/', image: '', grade: 5, unit: '1' },
    { word: 'honest', cn: '诚实的', phonetic: '/ˈɒn.ɪst/', image: '', grade: 5, unit: '1' },
    { word: 'imagine', cn: '想象', phonetic: '/ɪˈmædʒ.ɪn/', image: '', grade: 5, unit: '1' },
    { word: 'knowledge', cn: '知识', phonetic: '/ˈnɒl.ɪdʒ/', image: '', grade: 5, unit: '1' },
  ],
  6: [
    { word: 'appreciate', cn: '欣赏', phonetic: '/əˈpriː.ʃi.eɪt/', image: '', grade: 6, unit: '1' },
    { word: 'brilliant', cn: '杰出的', phonetic: '/ˈbrɪl.jənt/', image: '', grade: 6, unit: '1' },
    { word: 'comfortable', cn: '舒适的', phonetic: '/ˈkʌmf.tə.bəl/', image: '', grade: 6, unit: '1' },
    { word: 'disappear', cn: '消失', phonetic: '/ˌdɪs.əˈpɪər/', image: '', grade: 6, unit: '1' },
    { word: 'experience', cn: '经验', phonetic: '/ɪkˈspɪə.ri.əns/', image: '', grade: 6, unit: '1' },
    { word: 'frequently', cn: '频繁地', phonetic: '/ˈfriː.kwənt.li/', image: '', grade: 6, unit: '1' },
    { word: 'guarantee', cn: '保证', phonetic: '/ˌɡær.ənˈtiː/', image: '', grade: 6, unit: '1' },
    { word: 'immediately', cn: '立即', phonetic: '/ɪˈmiː.di.ət.li/', image: '', grade: 6, unit: '1' },
    { word: 'necessary', cn: '必要的', phonetic: '/ˈnes.ə.ser.i/', image: '', grade: 6, unit: '1' },
    { word: 'opportunity', cn: '机会', phonetic: '/ˌɒp.əˈtʃuː.nə.ti/', image: '', grade: 6, unit: '1' },
  ],
}

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

  const words = storeWords.length > 0 ? storeWords : (WORD_DATA[currentGrade] || WORD_DATA[1])

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
