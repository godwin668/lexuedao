import React, { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, Input, Button } from '@tarojs/components'
import { aiChat } from '@/services/api'
import styles from './index.module.scss'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const SUBJECTS = [
  { key: 'chinese', label: '语文' },
  { key: 'math', label: '数学' },
  { key: 'english', label: '英语' },
  { key: 'general', label: '通用' },
]

const QUICK_QUESTIONS = [
  '这个知识点我不太懂，能解释一下吗？',
  '我最近错题比较多，怎么提高？',
  '有什么好的学习方法推荐？',
]

const MOCK_REPLIES: Record<string, string> = {
  chinese: '语文学习要注重积累，多读多写是关键。建议每天坚持阅读30分钟，积累好词好句，同时多练习书写。',
  math: '数学需要理解概念和多做练习。建议从基础题开始，逐步提高难度，遇到不会的题目先独立思考再请教。',
  english: '英语学习重在听说读写全面发展。每天背5-10个单词，多听英语儿歌和故事，大胆开口说英语。',
  general: '学习是一个循序渐进的过程，找到适合自己的方法很重要。建议制定学习计划，每天坚持练习，及时复习错题。',
}

const AiChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: '你好！我是 AI 学习助手，有什么学习问题可以问我哦～',
      timestamp: formatTime(new Date()),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [subject, setSubject] = useState('general')
  const [loading, setLoading] = useState(false)
  const scrollViewRef = useRef<any>(null)
  const msgIdRef = useRef(1)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTop = 99999
      }
    }, 100)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = {
      id: msgIdRef.current++,
      role: 'user',
      content: text.trim(),
      timestamp: formatTime(new Date()),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setLoading(true)

    const chatMessages = [
      { role: 'system', content: `你是一个${subject === 'chinese' ? '语文' : subject === 'math' ? '数学' : subject === 'english' ? '英语' : '全科'}学习助手，请用友好、鼓励的语气回答小学生的问题。` },
      ...messages.filter((m) => m.id !== 0).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: text.trim() },
    ]

    try {
      const res = await aiChat(chatMessages)
      const reply = res?.reply || MOCK_REPLIES[subject] || MOCK_REPLIES.general
      const aiMsg: Message = {
        id: msgIdRef.current++,
        role: 'assistant',
        content: reply,
        timestamp: formatTime(new Date()),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const aiMsg: Message = {
        id: msgIdRef.current++,
        role: 'assistant',
        content: MOCK_REPLIES[subject] || MOCK_REPLIES.general,
        timestamp: formatTime(new Date()),
      }
      setMessages((prev) => [...prev, aiMsg])
    } finally {
      setLoading(false)
    }
  }, [loading, subject, messages])

  const handleSend = useCallback(() => {
    sendMessage(inputValue)
  }, [inputValue, sendMessage])

  const handleQuickQuestion = useCallback((q: string) => {
    sendMessage(q)
  }, [sendMessage])

  const handleInputConfirm = useCallback(() => {
    sendMessage(inputValue)
  }, [inputValue, sendMessage])

  return (
    <View className={styles.page}>
      {/* 头部 */}
      <View className={styles.header}>
        <Text className={styles.title}>AI 学习助手</Text>
        <Text className={styles.subtitle}>
          当前学科：{SUBJECTS.find((s) => s.key === subject)?.label || '通用'}
        </Text>
        <View className={styles.subjectTabs}>
          {SUBJECTS.map((s) => (
            <View
              key={s.key}
              className={`${styles.subjectTab} ${subject === s.key ? styles.subjectTabActive : ''}`}
              onClick={() => setSubject(s.key)}
            >
              <Text>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 消息列表 */}
      <ScrollView
        className={styles.messageList}
        scrollY
        scrollWithAnimation
        ref={scrollViewRef}
        scrollTop={99999}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            className={`${styles.messageRow} ${msg.role === 'user' ? styles.messageRowRight : styles.messageRowLeft}`}
          >
            <View
              className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi}`}
            >
              <Text className={styles.bubbleText}>{msg.content}</Text>
            </View>
            <Text className={styles.timeText}>{msg.timestamp}</Text>
          </View>
        ))}
        {loading && (
          <View className={`${styles.messageRow} ${styles.messageRowLeft}`}>
            <View className={`${styles.bubble} ${styles.bubbleAi}`}>
              <Text className={styles.typingDots}>...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 快捷问题 */}
      <View className={styles.quickQuestions}>
        {QUICK_QUESTIONS.map((q, idx) => (
          <View key={idx} className={styles.quickItem} onClick={() => handleQuickQuestion(q)}>
            <Text className={styles.quickText}>{q}</Text>
          </View>
        ))}
      </View>

      {/* 输入区 */}
      <View className={styles.inputArea}>
        <Input
          className={styles.input}
          value={inputValue}
          placeholder='输入你的问题...'
          onInput={(e) => setInputValue(e.detail.value)}
          onConfirm={handleInputConfirm}
          confirmType='send'
        />
        <Button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!inputValue.trim() || loading}
        >
          发送
        </Button>
      </View>
    </View>
  )
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

export default AiChatPage
