import React, { useEffect } from 'react'
import { useDidShow, useDidHide } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import './app.scss'

function App(props) {
  useEffect(() => {
    if (process.env.TARO_ENV === 'weapp') {
      Taro.cloud.init({ env: 'lexuedao-d9gnk5dru823f8b98', traceUser: true })
    }
  }, [])

  useDidShow(() => {})

  useDidHide(() => {})

  return props.children
}

export default App
