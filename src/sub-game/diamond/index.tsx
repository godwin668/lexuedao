import React, { useState, useCallback } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { createPaymentOrder } from '@/services/api'
import { useSafeArea } from '@/hooks/useSafeArea'
import styles from './index.module.scss'

interface DiamondPackage {
  id: string
  diamonds: number
  price: number
  badge?: string
}

const PACKAGES: DiamondPackage[] = [
  { id: 'diamond_60', diamonds: 60, price: 6 },
  { id: 'diamond_180', diamonds: 180, price: 18, badge: '热门' },
  { id: 'diamond_500', diamonds: 500, price: 50, badge: '超值' },
  { id: 'diamond_1200', diamonds: 1200, price: 98, badge: '最划算' },
]

const DiamondPage: React.FC = () => {
  const { top: safeTop } = useSafeArea()
  const { gameProfile } = useUserStore()
  const [selectedPackage, setSelectedPackage] = useState('diamond_180')
  const [loading, setLoading] = useState(false)

  const handleBuy = useCallback(async () => {
    setLoading(true)
    try {
      await createPaymentOrder({ type: 'diamond', packageId: selectedPackage })
      Taro.showToast({ title: '订单创建成功', icon: 'success' })
    } catch (err: any) {
      console.error('创建订单失败:', err)
      Taro.showToast({ title: err?.message || '支付暂不可用', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [selectedPackage])

  return (
    <View className={styles.page} style={{ paddingTop: `${safeTop}px` }}>
      {/* 头部 */}
      <View className={styles.header}>
        <Text className={styles.title}>💎 钻石商城</Text>
        <View className={styles.balanceRow}>
          <Text className={styles.balanceLabel}>当前余额</Text>
          <Text className={styles.balanceValue}>💎 {gameProfile?.diamonds || 0}</Text>
        </View>
      </View>

      {/* 套餐网格 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>选择钻石套餐</Text>
        <View className={styles.packageGrid}>
          {PACKAGES.map((pkg) => (
            <View
              key={pkg.id}
              className={`${styles.packageCard} ${selectedPackage === pkg.id ? styles.packageCardActive : ''}`}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              {pkg.badge && (
                <View className={styles.packageBadge}>
                  <Text className={styles.packageBadgeText}>{pkg.badge}</Text>
                </View>
              )}
              <Text className={styles.packageDiamonds}>💎 {pkg.diamonds}</Text>
              <Text className={styles.packageLabel}>钻石</Text>
              <View className={styles.packagePriceRow}>
                <Text className={styles.packagePrice}>¥{pkg.price}</Text>
              </View>
              {selectedPackage === pkg.id && (
                <View className={styles.packageCheck}>
                  <Text className={styles.packageCheckText}>✓</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 购买说明 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>📋 购买说明</Text>
        <View className={styles.noteList}>
          <Text className={styles.noteItem}>· 钻石可用于购买道具、解锁特殊关卡</Text>
          <Text className={styles.noteItem}>· 购买后钻石立即到账，不可退款</Text>
          <Text className={styles.noteItem}>· 如遇问题请联系客服</Text>
        </View>
      </View>

      {/* 底部按钮 */}
      <View className={styles.bottomArea}>
        <Button
          className={styles.buyBtn}
          onClick={handleBuy}
          loading={loading}
          disabled={loading}
        >
          立即购买
        </Button>
      </View>
    </View>
  )
}

export default DiamondPage
