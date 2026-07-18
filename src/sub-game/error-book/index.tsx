import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { getErrorBook, markErrorMastered } from '@/services/api'
import type { ErrorBookItem, Subject } from '@/types'
import styles from './index.module.scss'

const SUBJECT_LABELS: Record<string, string> = {
  hanzi: '语文',
  math: '数学',
  english: '英语',
}

const SUBJECT_COLORS: Record<string, string> = {
  hanzi: '#E74C3C',
  math: '#3498DB',
  english: '#2ECC71',
}

const ErrorBookPage: React.FC = () => {
  const [activeSubject, setActiveSubject] = useState<Subject | ''>('')
  const [items, setItems] = useState<ErrorBookItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const loadData = useCallback(async (pageNum: number, subject: Subject | '') => {
    if (loading) return
    setLoading(true)
    try {
      const params: any = { page: pageNum, pageSize: 20 }
      if (subject) params.subject = subject
      const res = await getErrorBook(params)
      if (res) {
        if (pageNum === 1) {
          setItems(res.items || [])
        } else {
          setItems(prev => [...prev, ...(res.items || [])])
        }
        setTotal(res.total || 0)
        setHasMore((res.items || []).length >= 20)
      }
    } catch (err) {
      console.error('[ErrorBook] loadData error:', err)
    } finally {
      setLoading(false)
    }
  }, [loading])

  useDidShow(() => {
    setPage(1)
    setHasMore(true)
    loadData(1, activeSubject)
  })

  useEffect(() => {
    setPage(1)
    setHasMore(true)
    setItems([])
    loadData(1, activeSubject)
  }, [activeSubject])

  const handleSubjectChange = (subject: Subject | '') => {
    setActiveSubject(subject === activeSubject ? '' : subject)
  }

  const handleMarkMastered = async (item: ErrorBookItem) => {
    try {
      await markErrorMastered(item.id)
      Taro.showToast({ title: '已标记为掌握', icon: 'success' })
      setItems(prev => prev.filter(i => i.id !== item.id))
      setTotal(prev => prev - 1)
    } catch (err) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleLoadMore = () => {
    if (!hasMore || loading) return
    const nextPage = page + 1
    setPage(nextPage)
    loadData(nextPage, activeSubject)
  }

  const handleViewDetail = (item: ErrorBookItem) => {
    if (item.subject === 'hanzi') {
      Taro.navigateTo({
        url: `/sub-hanzi/hanzi-write/index?char=${encodeURIComponent(item.itemKey)}`,
      })
    } else {
      Taro.showToast({ title: item.itemKey, icon: 'none' })
    }
  }

  return (
    <View className={styles.page}>
      {/* 学科筛选 */}
      <View className={styles.filterBar}>
        {(['', 'hanzi', 'math', 'english'] as const).map(sub => (
          <View
            key={sub}
            className={`${styles.filterItem} ${activeSubject === sub ? styles.active : ''}`}
            onClick={() => handleSubjectChange(sub)}
          >
            <Text>{sub === '' ? '全部' : SUBJECT_LABELS[sub]}</Text>
          </View>
        ))}
      </View>

      {/* 统计 */}
      <View className={styles.stats}>
        <Text className={styles.statsText}>共 {total} 道错题待复习</Text>
      </View>

      {/* 错题列表 */}
      <ScrollView
        className={styles.list}
        scrollY
        onScrollToLower={handleLoadMore}
        lowerThreshold={50}
      >
        {items.length === 0 && !loading && (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>🎉</Text>
            <Text className={styles.emptyText}>暂无错题，继续保持！</Text>
          </View>
        )}

        {items.map(item => (
          <View key={item.id} className={styles.item}>
            <View className={styles.itemHeader}>
              <View
                className={styles.subjectTag}
                style={{ backgroundColor: SUBJECT_COLORS[item.subject] || '#999' }}
              >
                <Text className={styles.subjectTagText}>
                  {SUBJECT_LABELS[item.subject] || item.subject}
                </Text>
              </View>
              <Text className={styles.errorCount}>错 {item.errorCount} 次</Text>
            </View>

            <View className={styles.itemBody} onClick={() => handleViewDetail(item)}>
              <Text className={styles.itemKey}>{item.itemKey}</Text>
            </View>

            <View className={styles.itemFooter}>
              <Text className={styles.itemTime}>
                {item.lastErrorAt ? new Date(item.lastErrorAt).toLocaleDateString() : ''}
              </Text>
              <View className={styles.masterBtn} onClick={() => handleMarkMastered(item)}>
                <Text className={styles.masterBtnText}>已掌握</Text>
              </View>
            </View>
          </View>
        ))}

        {loading && (
          <View className={styles.loading}>
            <Text>加载中...</Text>
          </View>
        )}

        {!hasMore && items.length > 0 && (
          <View className={styles.noMore}>
            <Text>— 没有更多了 —</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default ErrorBookPage
