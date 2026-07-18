import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { createTeam, joinTeam, leaveTeam, getTeamInfo } from '@/services/api'
import styles from './index.module.scss'

interface TeamMember {
  id: number
  nickname: string
}

interface TeamInfo {
  id: number
  name: string
  code: string
  captainId: number
  members: TeamMember[]
  currentStage: number
  totalStages: number
  totalScore: number
}

const TeamPage: React.FC = () => {
  const { user } = useUserStore()

  const [team, setTeam] = useState<TeamInfo | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamCode, setTeamCode] = useState('')
  const [loading, setLoading] = useState(false)

  // 加载队伍信息
  useEffect(() => {
    const loadTeam = async () => {
      try {
        const res = await getTeamInfo()
        if (res) {
          setTeam(res as TeamInfo)
        }
      } catch (_) {}
    }
    loadTeam()
  }, [])

  const handleCreateTeam = useCallback(async () => {
    if (!teamName.trim()) {
      Taro.showToast({ title: '请输入队伍名称', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const res = await createTeam(teamName.trim())
      if (res) {
        setTeam(res as TeamInfo)
        setShowCreate(false)
        setTeamName('')
        Taro.showToast({ title: '队伍创建成功！', icon: 'success' })
      }
    } catch (err: any) {
      Taro.showToast({ title: err.message || '创建失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [teamName])

  const handleJoinTeam = useCallback(async () => {
    if (!teamCode.trim()) {
      Taro.showToast({ title: '请输入队伍码', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const res = await joinTeam(teamCode.trim())
      if (res) {
        setTeam(res as TeamInfo)
        setShowJoin(false)
        setTeamCode('')
        Taro.showToast({ title: '加入队伍成功！', icon: 'success' })
      }
    } catch (err: any) {
      Taro.showToast({ title: err.message || '加入失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [teamCode])

  const handleStartChallenge = useCallback(() => {
    Taro.showToast({ title: '闯关即将开始，敬请期待！', icon: 'none' })
  }, [])

  const handleLeaveTeam = useCallback(() => {
    Taro.showModal({
      title: '提示',
      content: '确定要离开队伍吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await leaveTeam()
            setTeam(null)
            Taro.showToast({ title: '已离开队伍', icon: 'success' })
          } catch (err: any) {
            Taro.showToast({ title: err.message || '操作失败', icon: 'none' })
          }
        }
      },
    })
  }, [])

  const progressPercent = team ? Math.round((team.currentStage / team.totalStages) * 100) : 0

  return (
    <View className={styles.page}>
      {/* 头部 */}
      <View className={styles.header}>
        <Text className={styles.title}>🤝 团队竞技</Text>
        <Text className={styles.subtitle}>邀请好友组队，一起闯关学习！</Text>
      </View>

      {/* 无队伍状态 */}
      {!team && (
        <View className={styles.noTeamSection}>
          <View className={styles.introCard}>
            <Text className={styles.introIcon}>👥</Text>
            <Text className={styles.introTitle}>还没有加入队伍</Text>
            <Text className={styles.introDesc}>
              和好友一起组队闯关，互相激励，学习更有趣！
            </Text>
          </View>

          <View className={styles.actionCards}>
            <View className={styles.actionCard} onClick={() => setShowCreate(true)}>
              <Text className={styles.actionIcon}>🏗️</Text>
              <Text className={styles.actionTitle}>创建队伍</Text>
              <Text className={styles.actionDesc}>创建自己的队伍</Text>
            </View>
            <View className={styles.actionCard} onClick={() => setShowJoin(true)}>
              <Text className={styles.actionIcon}>🔗</Text>
              <Text className={styles.actionTitle}>加入队伍</Text>
              <Text className={styles.actionDesc}>输入队伍码加入</Text>
            </View>
          </View>

          {/* 创建队伍弹窗 */}
          {showCreate && (
            <View className={styles.modal}>
              <View className={styles.modalMask} onClick={() => setShowCreate(false)} />
              <View className={styles.modalContent}>
                <Text className={styles.modalTitle}>创建队伍</Text>
                <Input
                  className={styles.modalInput}
                  placeholder="请输入队伍名称"
                  value={teamName}
                  onInput={(e) => setTeamName(e.detail.value)}
                  maxlength={20}
                />
                <View className={styles.modalActions}>
                  <Button className={styles.modalCancel} onClick={() => setShowCreate(false)}>
                    取消
                  </Button>
                  <Button
                    className={styles.modalConfirm}
                    onClick={handleCreateTeam}
                    loading={loading}
                    disabled={loading}
                  >
                    创建
                  </Button>
                </View>
              </View>
            </View>
          )}

          {/* 加入队伍弹窗 */}
          {showJoin && (
            <View className={styles.modal}>
              <View className={styles.modalMask} onClick={() => setShowJoin(false)} />
              <View className={styles.modalContent}>
                <Text className={styles.modalTitle}>加入队伍</Text>
                <Input
                  className={styles.modalInput}
                  placeholder="请输入队伍码"
                  value={teamCode}
                  onInput={(e) => setTeamCode(e.detail.value)}
                  maxlength={10}
                />
                <View className={styles.modalActions}>
                  <Button className={styles.modalCancel} onClick={() => setShowJoin(false)}>
                    取消
                  </Button>
                  <Button
                    className={styles.modalConfirm}
                    onClick={handleJoinTeam}
                    loading={loading}
                    disabled={loading}
                  >
                    加入
                  </Button>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* 有队伍状态 */}
      {team && (
        <View className={styles.teamSection}>
          {/* 队伍信息 */}
          <View className={styles.teamCard}>
            <View className={styles.teamHeader}>
              <Text className={styles.teamName}>{team.name}</Text>
              <Text className={styles.teamCode}>队伍码：{team.code}</Text>
            </View>

            {/* 关卡进度 */}
            <View className={styles.progressBox}>
              <View className={styles.progressHeader}>
                <Text className={styles.progressLabel}>当前关卡进度</Text>
                <Text className={styles.progressText}>
                  第 {team.currentStage}/{team.totalStages} 关
                </Text>
              </View>
              <View className={styles.progressBar}>
                <View
                  className={styles.progressFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </View>
            </View>

            {/* 队伍总分 */}
            <View className={styles.scoreBox}>
              <Text className={styles.scoreLabel}>队伍总分</Text>
              <Text className={styles.scoreValue}>{team.totalScore}</Text>
            </View>
          </View>

          {/* 成员列表 */}
          <View className={styles.membersCard}>
            <Text className={styles.sectionTitle}>队伍成员 ({team.members.length})</Text>
            <View className={styles.memberList}>
              {team.members.map((member, idx) => (
                <View key={member.id} className={styles.memberItem}>
                  <View className={styles.memberAvatar}>
                    <View className={styles.memberAvatarPlaceholder}>
                      <Text className={styles.memberAvatarText}>
                        {member.nickname?.charAt(0) || '?'}
                      </Text>
                    </View>
                  </View>
                  <View className={styles.memberInfo}>
                    <Text className={styles.memberName}>
                      {member.nickname}
                      {member.id === user?.id && ' (我)'}
                    </Text>
                  </View>
                  {member.id === team.captainId && <Text className={styles.captainTag}>队长</Text>}
                </View>
              ))}
            </View>
          </View>

          {/* 操作按钮 */}
          <View className={styles.teamActions}>
            <Button className={styles.startBtn} onClick={handleStartChallenge}>
              开始闯关
            </Button>
            <Button className={styles.leaveBtn} onClick={handleLeaveTeam}>
              离开队伍
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}

export default TeamPage
