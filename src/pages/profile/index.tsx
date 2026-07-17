import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { useGameStore } from '@/store/useGameStore'
import { UserRole, GradeLevel } from '@/types'
import styles from './index.module.scss'

const ProfilePage: React.FC = () => {
  const {
    user, gameProfile, currentRole, setCurrentRole,
    isVip, vipExpireDate, currentGrade, setCurrentGrade,
    children, viewingChildId, setViewingChildId,
  } = useUserStore()
  const { userAchievements } = useGameStore()

  const [showRoleSwitch, setShowRoleSwitch] = useState(false)

  const handleRoleSwitch = (role: UserRole) => {
    setCurrentRole(role)
    setShowRoleSwitch(false)
    if (role === 'parent') {
      Taro.showToast({ title: '已切换到家长模式', icon: 'success' })
    } else {
      Taro.showToast({ title: '已切换到学生模式', icon: 'success' })
    }
  }

  const handleSubscribe = () => {
    Taro.showToast({ title: '订阅功能开发中', icon: 'none' })
  }

  const handleShare = () => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    })
    Taro.showToast({ title: '点击右上角分享', icon: 'none' })
  }

  const gradeLabels: Record<GradeLevel, string> = {
    1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级',
  }

  return (
    <View className={styles.page}>
      {/* 用户信息 */}
      <View className={styles.header}>
        <View className={styles.avatar}>
          <Text>{user?.avatarUrl || '😊'}</Text>
        </View>
        <Text className={styles.nickname}>{user?.nickname || '小朋友'}</Text>
        <View className={styles.roleRow}>
          <Text className={styles.roleTag}>
            {currentRole === 'student' ? '👦 学生' : '👨‍👩‍ 家长'}
          </Text>
          <Text
            className={styles.switchBtn}
            onClick={() => setShowRoleSwitch(!showRoleSwitch)}
          >
            切换身份
          </Text>
        </View>

        {showRoleSwitch && (
          <View className={styles.roleSwitchPopup}>
            <View
              className={`${styles.roleOption} ${currentRole === 'student' ? styles.roleActive : ''}`}
              onClick={() => handleRoleSwitch('student')}
            >
              <Text>👦 学生模式</Text>
              <Text className={styles.roleDesc}>学习闯关、对战PK</Text>
            </View>
            <View
              className={`${styles.roleOption} ${currentRole === 'parent' ? styles.roleActive : ''}`}
              onClick={() => handleRoleSwitch('parent')}
            >
              <Text>👨‍👩‍ 家长模式</Text>
              <Text className={styles.roleDesc}>查看报告、管理订阅</Text>
            </View>
          </View>
        )}

        {/* 游戏数据 */}
        <View className={styles.gameStats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>Lv.{gameProfile?.level || 1}</Text>
            <Text className={styles.statLabel}>等级</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>💰{gameProfile?.coins || 0}</Text>
            <Text className={styles.statLabel}>金币</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>💎{gameProfile?.diamonds || 0}</Text>
            <Text className={styles.statLabel}>钻石</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{userAchievements.length}</Text>
            <Text className={styles.statLabel}>徽章</Text>
          </View>
        </View>
      </View>

      {/* 家长模式：孩子列表 */}
      {currentRole === 'parent' && children.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>👶 我的孩子</Text>
          <View className={styles.childList}>
            {children.map((child) => (
              <View
                key={child.id}
                className={`${styles.childItem} ${viewingChildId === child.id ? styles.childActive : ''}`}
                onClick={() => setViewingChildId(child.id)}
              >
                <Text>{child.avatarUrl || '😊'}</Text>
                <Text>{child.nickname}</Text>
                <Text className={styles.childGrade}>{gradeLabels[child.grade]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* VIP 订阅 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>⭐ VIP 会员</Text>
        {isVip ? (
          <View className={styles.vipCard}>
            <Text className={styles.vipStatus}>✅ 已开通 VIP</Text>
            <Text className={styles.vipExpire}>到期：{vipExpireDate || '--'}</Text>
          </View>
        ) : (
          <View className={styles.vipCard} onClick={handleSubscribe}>
            <Text className={styles.vipStatus}>🔓 开通 VIP 会员</Text>
            <Text className={styles.vipDesc}>无限练习 · 全部关卡 · 专属皮肤</Text>
            <View className={styles.vipPlans}>
              <View className={styles.vipPlan}>
                <Text className={styles.planPrice}>¥19.9</Text>
                <Text className={styles.planUnit}>/月</Text>
              </View>
              <View className={`${styles.vipPlan} ${styles.planRecommended}`}>
                <Text className={styles.planBadge}>推荐</Text>
                <Text className={styles.planPrice}>¥168</Text>
                <Text className={styles.planUnit}>/年</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 设置 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>⚙️ 设置</Text>
        <View className={styles.menuItem}>
          <Text>📖 当前年级</Text>
          <View className={styles.gradeRow}>
            {([1, 2, 3, 4, 5, 6] as GradeLevel[]).map((g) => (
              <Text
                key={g}
                className={`${styles.gradeTag} ${currentGrade === g ? styles.gradeActive : ''}`}
                onClick={() => setCurrentGrade(g)}
              >
                {g}年级
              </Text>
            ))}
          </View>
        </View>
        <View className={styles.menuItem}>
          <Text>ℹ️ 关于乐学小课堂</Text>
          <Text className={styles.arrow}>›</Text>
        </View>
      </View>

      {/* 分享 */}
      <View className={styles.shareBtn} onClick={handleShare}>
        <Text>📤 分享给好友</Text>
      </View>
    </View>
  )
}

export default ProfilePage
