import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { useGameStore } from '@/store/useGameStore'
import { useUserStore } from '@/store/useUserStore'
import { getLeaderboard } from '@/services/api'
import type { LeaderboardEntry } from '@/types'
import styles from './index.module.scss'

const SUBJECTS = [
  { key: '', label: '全部' },
  { key: 'chinese', label: '语文' },
  { key: 'math', label: '数学' },
  { key: 'english', label: '英语' },
]

const SCOPES: { key: 'school' | 'national' | 'friends'; label: string }[] = [
  { key: 'school', label: '全校' },
  { key: 'national', label: '全国' },
  { key: 'friends', label: '好友' },
]

const PAGE_SIZE = 20

const LeaderboardPage: React.FC = () => {
  const { leaderboard, setLeaderboard } = useGameStore()
  const { user } = useUserStore()

  const [subject, setSubject] = useState('')
  const [scope, setScope] = useState<'school' | 'national' | 'friends'>('school')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (pageNum: number, isRefresh: boolean) => {
    if (loading) return
    setLoading(true)
    try {
      const data = await getLeaderboard({
        subject: subject || undefined,
        scope,
        page: pageNum,
        pageSize: PAGE_SIZE,
      })
      if (isRefresh || pageNum === 1) {
        setLeaderboard(data || [])
      } else {
        setLeaderboard([...leaderboard, ...(data || [])])
      }
      setHasMore((data || []).length >= PAGE_SIZE)
      setPage(pageNum)
    } catch (err: any) {
      console.error('获取排行榜失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
      // 使用模拟数据
      if (isRefresh || pageNum === 1) {
        const mockData: LeaderboardEntry[] = Array.from({ length: 15 }, (_, i) => ({
          rank: i + 1,
          userId: 1000 + i,
          nickname: `学霸${i + 1}号`,
          avatarUrl: '',
          level: Math.max(1, 15 - i),
          score: 1000 - i * 50 + Math.floor(Math.random() * 30),
        }))
        setLeaderboard(mockData)
        setHasMore(mockData.length >= PAGE_SIZE)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [subject, scope, leaderboard, loading, setLeaderboard])

  useEffect(() => {
    setPage(1)
    setLeaderboard([])
    fetchData(1, true)
  }, [subject, scope])

  usePullDownRefresh(() => {
    setRefreshing(true)
    setPage(1)
    fetchData(1, true)
    setTimeout(() => Taro.stopPullDownRefresh(), 1000)
  })

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loading) return
    fetchData(page + 1, false)
  }, [hasMore, loading, page, fetchData])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  const isMe = (entry: LeaderboardEntry) => user?.id === entry.userId

  return (
    <View className={styles.page}>
      {/* 头部 */}
      <View className={styles.header}>
        <Text className={styles.title}>🏆 排行榜</Text>
        <Text className={styles.subtitle}>看看谁是学习达人</Text>
      </View>

      {/* 学科筛选 */}
      <View className={styles.filterRow}>
        {SUBJECTS.map((s) => (
          <View
            key={s.key}
            className={`${styles.filterTag} ${subject === s.key ? styles.filterTagActive : ''}`}
            onClick={() => setSubject(s.key)}
          >
            <Text className={styles.filterTagText}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* 范围筛选 */}
      <View className={styles.scopeRow}>
        {SCOPES.map((s) => (
          <View
            key={s.key}
            className={`${styles.scopeTag} ${scope === s.key ? styles.scopeTagActive : ''}`}
            onClick={() => setScope(s.key)}
          >
            <Text className={styles.scopeTagText}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* 前三名 */}
      {leaderboard.length >= 3 && (
        <View className={styles.topThree}>
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, idx) => {
            if (!entry) return null
            const positions = [2, 1, 3]
            const rank = positions[idx]
            return (
              <View
                key={entry.userId}
                className={`${styles.topItem} ${rank === 1 ? styles.topFirst : ''}`}
              >
                <View className={styles.topAvatar}>
                  {entry.avatarUrl ? (
                    <View className={styles.topAvatarImg} style={{ backgroundImage: `url(${entry.avatarUrl})` }} />
                  ) : (
                    <View className={styles.topAvatarPlaceholder}>
                      <Text className={styles.topAvatarText}>{entry.nickname?.charAt(0) || '?'}</Text>
                    </View>
                  )}
                </View>
                <Text className={styles.topMedal}>{getRankIcon(rank)}</Text>
                <Text className={styles.topName}>{entry.nickname}</Text>
                <Text className={styles.topScore}>{entry.score}分</Text>
              </View>
            )
          })}
        </View>
      )}

      {/* 排行榜列表 */}
      <ScrollView
        className={styles.listSection}
        scrollY
        onScrollToLower={handleLoadMore}
        lowerThreshold={100}
      >
        <View className={styles.listHeader}>
          <Text className={styles.listHeaderText}>排名</Text>
          <Text className={styles.listHeaderText}>玩家</Text>
          <Text className={styles.listHeaderText}>等级</Text>
          <Text className={styles.listHeaderText}>分数</Text>
        </View>
        {leaderboard.map((entry) => {
          const rankIcon = getRankIcon(entry.rank)
          const me = isMe(entry)
          return (
            <View
              key={entry.userId}
              className={`${styles.listItem} ${me ? styles.listItemMe : ''}`}
            >
              <View className={styles.rankCell}>
                {rankIcon ? (
                  <Text className={styles.rankIcon}>{rankIcon}</Text>
                ) : (
                  <Text className={styles.rankNum}>{entry.rank}</Text>
                )}
              </View>
              <View className={styles.playerCell}>
                {entry.avatarUrl ? (
                  <View className={styles.avatarImg} style={{ backgroundImage: `url(${entry.avatarUrl})` }} />
                ) : (
                  <View className={styles.avatarPlaceholder}>
                    <Text className={styles.avatarText}>{entry.nickname?.charAt(0) || '?'}</Text>
                  </View>
                )}
                <Text className={styles.playerName}>{entry.nickname}</Text>
                {me && <Text className={styles.meTag}>我</Text>}
              </View>
              <Text className={styles.levelCell}>Lv.{entry.level}</Text>
              <Text className={styles.scoreCell}>{entry.score}</Text>
            </View>
          )
        })}
        {loading && (
          <View className={styles.loadingMore}>
            <Text className={styles.loadingText}>加载中...</Text>
          </View>
        )}
        {!hasMore && leaderboard.length > 0 && (
          <View className={styles.noMore}>
            <Text className={styles.noMoreText}>— 没有更多了 —</Text>
          </View>
        )}
        {!loading && leaderboard.length === 0 && (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无排行数据</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default LeaderboardPage
