import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { bindChild, getChildList } from '@/services/api'
import { useUserStore } from '@/store/useUserStore'
import styles from './index.module.scss'

const RELATIONS = [
  { value: '爸爸', label: '爸爸' },
  { value: '妈妈', label: '妈妈' },
  { value: '爷爷', label: '爷爷' },
  { value: '奶奶', label: '奶奶' },
  { value: '外公', label: '外公' },
  { value: '外婆', label: '外婆' },
]

const BindChildPage: React.FC = () => {
  const { children, setChildren } = useUserStore()
  const [childOpenid, setChildOpenid] = useState('')
  const [relation, setRelation] = useState('妈妈')
  const [loading, setLoading] = useState(false)

  const loadChildren = useCallback(async () => {
    try {
      const res = await getChildList()
      if (res) {
        setChildren(res as any)
      }
    } catch (_) {}
  }, [setChildren])

  useEffect(() => {
    loadChildren()
  }, [loadChildren])

  const handleBind = async () => {
    if (!childOpenid.trim()) {
      Taro.showToast({ title: '请输入孩子的 openid', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await bindChild({ childOpenid: childOpenid.trim(), relation })
      if (res) {
        Taro.showToast({ title: `成功绑定${(res as any).childNickname || '孩子'}`, icon: 'success' })
        setChildOpenid('')
        loadChildren()
      }
    } catch (err: any) {
      Taro.showToast({ title: err.message || '绑定失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className={styles.page}>
      {/* 已绑定孩子 */}
      {children.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>已绑定的孩子</Text>
          {children.map((child: any) => (
            <View key={child.id} className={styles.childCard}>
              <View className={styles.childAvatar}>
                <Text className={styles.childAvatarText}>
                  {(child.nickname || '小朋友')[0]}
                </Text>
              </View>
              <View className={styles.childInfo}>
                <Text className={styles.childName}>{child.nickname || '小朋友'}</Text>
                <Text className={styles.childGrade}>{child.grade}年级</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 绑定新孩子 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>绑定新孩子</Text>
        <Text className={styles.sectionDesc}>
          请输入孩子的微信 openid 进行绑定。{'\n'}
          可在孩子端「我的」页面查看 openid。
        </Text>

        <View className={styles.formGroup}>
          <Text className={styles.label}>孩子 openid</Text>
          <Input
            className={styles.input}
            value={childOpenid}
            onInput={(e) => setChildOpenid(e.detail.value)}
            placeholder="请输入孩子的 openid"
            placeholderClass={styles.placeholder}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.label}>与孩子的关系</Text>
          <View className={styles.relationList}>
            {RELATIONS.map((r) => (
              <View
                key={r.value}
                className={`${styles.relationItem} ${relation === r.value ? styles.relationActive : ''}`}
                onClick={() => setRelation(r.value)}
              >
                <Text>{r.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View
          className={`${styles.bindBtn} ${loading ? styles.bindBtnDisabled : ''}`}
          onClick={loading ? undefined : handleBind}
        >
          <Text className={styles.bindBtnText}>
            {loading ? '绑定中...' : '确认绑定'}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default BindChildPage
