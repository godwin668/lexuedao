import React, { useState, useCallback } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { createPaymentOrder } from '@/services/api'
import styles from './index.module.scss'

interface PlanItem {
  key: string
  name: string
  price: number
  unit: string
  monthlyPrice: string
  badge?: string
  features: string[]
}

const PLANS: PlanItem[] = [
  {
    key: 'monthly',
    name: '月卡',
    price: 19.9,
    unit: '月',
    monthlyPrice: '¥19.9/月',
    features: ['无限练习次数', '全部关卡解锁', 'AI 智能推荐', '专属学习皮肤'],
  },
  {
    key: 'quarterly',
    name: '季卡',
    price: 49.9,
    unit: '季',
    monthlyPrice: '≈¥16.6/月',
    features: ['月卡全部特权', '优先客服支持', '每月学习报告', '专属成就徽章'],
  },
  {
    key: 'yearly',
    name: '年卡',
    price: 168,
    unit: '年',
    monthlyPrice: '≈¥14/月',
    badge: '推荐',
    features: ['季卡全部特权', '年度学习档案', '名师直播课', '线下活动优先'],
  },
]

const VipPage: React.FC = () => {
  const { isVip, vipExpireDate } = useUserStore()
  const [selectedPlan, setSelectedPlan] = useState('yearly')
  const [loading, setLoading] = useState(false)

  const handleSubscribe = useCallback(async () => {
    if (isVip) {
      Taro.showToast({ title: '您已是 VIP 会员', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      await createPaymentOrder({ type: 'vip', plan: selectedPlan })
      Taro.showToast({ title: '订单创建成功', icon: 'success' })
    } catch (err: any) {
      console.error('创建订单失败:', err)
      Taro.showToast({ title: err?.message || '支付暂不可用', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [selectedPlan, isVip])

  return (
    <View className={styles.page}>
      {/* 头部 */}
      <View className={styles.header}>
        <Text className={styles.title}>⭐ VIP 会员</Text>
        <Text className={styles.subtitle}>解锁全部学习功能</Text>
      </View>

      {/* VIP 特权介绍 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>🎁 VIP 特权</Text>
        <View className={styles.privilegeGrid}>
          <View className={styles.privilegeItem}>
            <Text className={styles.privilegeIcon}>♾️</Text>
            <Text className={styles.privilegeName}>无限练习</Text>
            <Text className={styles.privilegeDesc}>不限次数练习</Text>
          </View>
          <View className={styles.privilegeItem}>
            <Text className={styles.privilegeIcon}>🔓</Text>
            <Text className={styles.privilegeName}>全部关卡</Text>
            <Text className={styles.privilegeDesc}>解锁所有内容</Text>
          </View>
          <View className={styles.privilegeItem}>
            <Text className={styles.privilegeIcon}>🤖</Text>
            <Text className={styles.privilegeName}>AI 推荐</Text>
            <Text className={styles.privilegeDesc}>智能学习规划</Text>
          </View>
          <View className={styles.privilegeItem}>
            <Text className={styles.privilegeIcon}>🎨</Text>
            <Text className={styles.privilegeName}>专属皮肤</Text>
            <Text className={styles.privilegeDesc}>个性化主题</Text>
          </View>
          <View className={styles.privilegeItem}>
            <Text className={styles.privilegeIcon}>📊</Text>
            <Text className={styles.privilegeName}>学习报告</Text>
            <Text className={styles.privilegeDesc}>详细数据分析</Text>
          </View>
          <View className={styles.privilegeItem}>
            <Text className={styles.privilegeIcon}>🎖️</Text>
            <Text className={styles.privilegeName}>专属徽章</Text>
            <Text className={styles.privilegeDesc}>VIP 限定成就</Text>
          </View>
        </View>
      </View>

      {/* 订阅方案 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>💳 选择方案</Text>
        {isVip ? (
          <View className={styles.vipActiveCard}>
            <Text className={styles.vipActiveIcon}>✅</Text>
            <Text className={styles.vipActiveText}>您已是 VIP 会员</Text>
            <Text className={styles.vipActiveExpire}>到期时间：{vipExpireDate || '--'}</Text>
          </View>
        ) : (
          <View className={styles.planList}>
            {PLANS.map((plan) => (
              <View
                key={plan.key}
                className={`${styles.planCard} ${selectedPlan === plan.key ? styles.planCardActive : ''}`}
                onClick={() => setSelectedPlan(plan.key)}
              >
                {plan.badge && (
                  <View className={styles.planBadge}>
                    <Text className={styles.planBadgeText}>{plan.badge}</Text>
                  </View>
                )}
                <View className={styles.planHeader}>
                  <Text className={styles.planName}>{plan.name}</Text>
                  <View className={styles.planPriceRow}>
                    <Text className={styles.planPrice}>¥{plan.price}</Text>
                    <Text className={styles.planUnit}>/{plan.unit}</Text>
                  </View>
                  <Text className={styles.planMonthly}>{plan.monthlyPrice}</Text>
                </View>
                <View className={styles.planFeatures}>
                  {plan.features.map((feat, idx) => (
                    <View key={idx} className={styles.planFeature}>
                      <Text className={styles.featureDot}>✓</Text>
                      <Text className={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>
                {selectedPlan === plan.key && (
                  <View className={styles.planCheck}>
                    <Text className={styles.planCheckText}>已选择</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 订阅按钮 */}
      {!isVip && (
        <View className={styles.bottomArea}>
          <Button
            className={styles.subscribeBtn}
            onClick={handleSubscribe}
            loading={loading}
            disabled={loading}
          >
            立即订阅
          </Button>
          <Text className={styles.payNote}>
            订阅后将自动续费，可随时在设置中取消
          </Text>
        </View>
      )}
    </View>
  )
}

export default VipPage
