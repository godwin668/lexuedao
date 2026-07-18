import React, { useState, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
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

const EngWordPage: React.FC = () => {
  const { currentGrade } = useEnglishStore()
  const words = useMemo(() => WORD_DATA[currentGrade] || WORD_DATA[1], [currentGrade])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [knownList, setKnownList] = useState<boolean[]>(new Array(words.length).fill(false))

  const currentWord = words[index]
  const total = words.length

  const handleFlip = () => {
    setFlipped(!flipped)
    if (!flipped) {
      Taro.showToast({ title: `🔊 ${currentWord.word}`, icon: 'none', duration: 1500 })
    }
  }

  const handlePrev = () => {
    if (index > 0) {
      setIndex(index - 1)
      setFlipped(false)
    }
  }

  const handleNext = () => {
    if (index < total - 1) {
      setIndex(index + 1)
      setFlipped(false)
    }
  }

  const handleKnown = () => {
    const newList = [...knownList]
    newList[index] = true
    setKnownList(newList)
    Taro.showToast({ title: '✅ 已掌握', icon: 'none', duration: 800 })
    if (index < total - 1) {
      setTimeout(() => {
        setIndex(index + 1)
        setFlipped(false)
      }, 400)
    }
  }

  const handleUnknown = () => {
    const newList = [...knownList]
    newList[index] = false
    setKnownList(newList)
    Taro.showToast({ title: '❌ 继续加油', icon: 'none', duration: 800 })
    if (index < total - 1) {
      setTimeout(() => {
        setIndex(index + 1)
        setFlipped(false)
      }, 400)
    }
  }

  const handleSpeak = () => {
    Taro.showToast({ title: `🔊 ${currentWord.word}`, icon: 'none', duration: 1500 })
  }

  return (
    <View className={styles.page}>
      {/* 进度 */}
      <View className={styles.progressBar}>
        <View className={styles.progressTrack}>
          <View
            className={styles.progressFill}
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </View>
        <Text className={styles.progressText}>{index + 1} / {total}</Text>
      </View>

      {/* 闪卡 */}
      <View className={styles.cardWrapper}>
        <View className={`${styles.card} ${flipped ? styles.flipped : ''}`} onClick={handleFlip}>
          <View className={styles.cardFront}>
            <Text className={styles.wordText}>{currentWord.word}</Text>
            <Text className={styles.tapHint}>点击翻转</Text>
          </View>
          <View className={styles.cardBack}>
            <Text className={styles.cnText}>{currentWord.cn}</Text>
            <Text className={styles.phoneticText}>{currentWord.phonetic}</Text>
          </View>
        </View>
      </View>

      {/* 发音按钮 */}
      <View className={styles.speakBtn} onClick={handleSpeak}>
        <Text className={styles.speakIcon}>🔊</Text>
        <Text className={styles.speakText}>点击发音</Text>
      </View>

      {/* 导航按钮 */}
      <View className={styles.navButtons}>
        <View className={`${styles.navBtn} ${index === 0 ? styles.disabled : ''}`} onClick={handlePrev}>
          <Text>◀ 上一个</Text>
        </View>
        <View className={`${styles.navBtn} ${index >= total - 1 ? styles.disabled : ''}`} onClick={handleNext}>
          <Text>下一个 ▶</Text>
        </View>
      </View>

      {/* 认识/不认识 */}
      <View className={styles.actionButtons}>
        <View className={`${styles.actionBtn} ${styles.unknownBtn}`} onClick={handleUnknown}>
          <Text>❌ 不认识</Text>
        </View>
        <View className={`${styles.actionBtn} ${styles.knownBtn}`} onClick={handleKnown}>
          <Text>✅ 认识</Text>
        </View>
      </View>

      {/* 完成提示 */}
      {index >= total - 1 && (
        <View className={styles.completeHint}>
          <Text>🎉 本轮学习完成！</Text>
        </View>
      )}
    </View>
  )
}

export default EngWordPage
