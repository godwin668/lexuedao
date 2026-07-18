import React, { useState, useMemo, useEffect, useRef } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEnglishStore } from '@/store/useEnglishStore'
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
  const words = useMemo(() => WORD_DATA[currentGrade] || WORD_DATA[1], [currentGrade])

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
