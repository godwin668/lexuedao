import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'

interface SafeArea {
  /** 顶部安全距离：状态栏 + 导航栏高度，用于页面 header padding-top */
  top: number
  /** 底部安全距离 */
  bottom: number
  /** 状态栏高度 */
  statusBarHeight: number
  /** 导航栏高度（胶囊高度 + 上下间距） */
  navBarHeight: number
  /** 胶囊按钮信息 */
  menuButton: {
    top: number
    height: number
    width: number
  }
}

/**
 * 获取微信小程序安全区域信息
 * 精确计算状态栏 + 胶囊按钮位置，确保内容不被遮挡
 */
export function useSafeArea(): SafeArea {
  const [safeArea, setSafeArea] = useState<SafeArea>({
    top: 88, // rpx 默认值
    bottom: 0,
    statusBarHeight: 44,
    navBarHeight: 44,
    menuButton: { top: 0, height: 32, width: 87 },
  })

  useEffect(() => {
    try {
      const systemInfo = Taro.getSystemInfoSync()
      const menuButton = Taro.getMenuButtonBoundingClientRect()

      const statusBarHeight = systemInfo.statusBarHeight || 20
      // 导航栏高度 = (胶囊top - 状态栏高度) * 2 + 胶囊高度
      const navBarHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height
      // 顶部安全距离 = 状态栏 + 导航栏
      const top = statusBarHeight + navBarHeight

      setSafeArea({
        top: Math.round(top),
        bottom: systemInfo.safeArea
          ? systemInfo.screenHeight - systemInfo.safeArea.bottom
          : 0,
        statusBarHeight: Math.round(statusBarHeight),
        navBarHeight: Math.round(navBarHeight),
        menuButton: {
          top: Math.round(menuButton.top),
          height: Math.round(menuButton.height),
          width: Math.round(menuButton.width),
        },
      })
    } catch {
      // 非微信环境（H5/App）使用默认值
    }
  }, [])

  return safeArea
}
