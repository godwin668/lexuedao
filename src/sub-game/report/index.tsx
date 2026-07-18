import React, { useState, useEffect, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import { useUserStore } from '@/store/useUserStore'
import { getLearningReport } from '@/services/api'
import styles from './index.module.scss'

interface ReportData {
  totalPractices: number
  totalDuration: number
  avgAccuracy: number
  subjectDistribution: { subject: string; count: number; color: string }[]
  weakPoints: string[]
  streakDays: number
  recommendations: string[]
}

const SUBJECT_LABELS: Record<string, string> = {
  hanzi: '语文',
  math: '数学',
  english: '英语',
}

const MOCK_REPORT: ReportData = {
  totalPractices: 48,
  totalDuration: 320,
  avgAccuracy: 87,
  subjectDistribution: [
    { subject: 'hanzi', count: 18, color: '#47B881' },
    { subject: 'math', count: 20, color: '#FF8C42' },
    { subject: 'english', count: 10, color: '#7C5CFC' },
  ],
  weakPoints: ['多位数乘法', '分数运算', '古诗默写', '英语听力'],
  streakDays: 7,
  recommendations: [
    '每天坚持练习口算，提高计算速度和准确率',
    '多听英语儿歌和故事，培养语感',
    '每天写一篇日记，提升写作能力',
    '整理错题本，定期复习薄弱知识点',
  ],
}

const ReportPage: React.FC = () => {
  const { viewingChildId, currentRole } = useUserStore()
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getLearningReport({
        childId: currentRole === 'parent' ? (viewingChildId || undefined) : undefined,
        period,
      })
      if (res && res.totalPractices !== undefined) {
        setReport(res)
      } else {
        setReport(MOCK_REPORT)
      }
    } catch {
      setReport(MOCK_REPORT)
    } finally {
      setLoading(false)
    }
  }, [period, viewingChildId, currentRole])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const maxCount = report
    ? Math.max(...report.subjectDistribution.map((d) => d.count), 1)
    : 1

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
  }

  return (
    <View className={styles.page}>
      {/* 头部 */}
      <View className={styles.header}>
        <Text className={styles.title}>📊 学习报告</Text>
        <View className={styles.periodTabs}>
          <View
            className={`${styles.periodTab} ${period === 'week' ? styles.periodTabActive : ''}`}
            onClick={() => setPeriod('week')}
          >
            <Text>本周</Text>
          </View>
          <View
            className={`${styles.periodTab} ${period === 'month' ? styles.periodTabActive : ''}`}
            onClick={() => setPeriod('month')}
          >
            <Text>本月</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View className={styles.loadingWrap}>
          <Text className={styles.loadingText}>加载中...</Text>
        </View>
      ) : report ? (
        <>
          {/* 概览卡片 */}
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>📋 学习概览</Text>
            <View className={styles.overviewGrid}>
              <View className={styles.overviewCard}>
                <Text className={styles.overviewValue}>{report.totalPractices}</Text>
                <Text className={styles.overviewLabel}>练习次数</Text>
              </View>
              <View className={styles.overviewCard}>
                <Text className={styles.overviewValue}>{formatDuration(report.totalDuration)}</Text>
                <Text className={styles.overviewLabel}>学习时长</Text>
              </View>
              <View className={styles.overviewCard}>
                <Text className={styles.overviewValue}>{report.avgAccuracy}%</Text>
                <Text className={styles.overviewLabel}>平均正确率</Text>
              </View>
              <View className={styles.overviewCard}>
                <Text className={styles.overviewValue}>🔥{report.streakDays}</Text>
                <Text className={styles.overviewLabel}>连续打卡</Text>
              </View>
            </View>
          </View>

          {/* 各科练习分布 */}
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>📈 各科练习分布</Text>
            <View className={styles.distChart}>
              {report.subjectDistribution.map((item) => {
                const percent = Math.round((item.count / maxCount) * 100)
                return (
                  <View key={item.subject} className={styles.distRow}>
                    <Text className={styles.distLabel}>
                      {SUBJECT_LABELS[item.subject] || item.subject}
                    </Text>
                    <View className={styles.distBarWrap}>
                      <View
                        className={styles.distBar}
                        style={{
                          width: `${percent}%`,
                          background: item.color,
                        }}
                      />
                    </View>
                    <Text className={styles.distCount}>{item.count}次</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* 薄弱知识点 */}
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>⚠️ 薄弱知识点</Text>
            <View className={styles.tagList}>
              {report.weakPoints.map((point, idx) => (
                <View key={idx} className={styles.tag}>
                  <Text className={styles.tagText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 改进建议 */}
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>💡 改进建议</Text>
            <View className={styles.recList}>
              {report.recommendations.map((rec, idx) => (
                <View key={idx} className={styles.recItem}>
                  <Text className={styles.recNum}>{idx + 1}</Text>
                  <Text className={styles.recText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      ) : (
        <View className={styles.emptyWrap}>
          <Text className={styles.emptyText}>暂无学习数据</Text>
        </View>
      )}
    </View>
  )
}

export default ReportPage
