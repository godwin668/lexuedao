/**
 * 云存储服务 —— 文件上传/下载/删除统一入口
 *
 * 所有文件操作都通过这里的函数，不直接调 wx.cloud API。
 * 将来切换到其他存储方案，只需改这个文件的实现。
 */
import Taro from '@tarojs/taro'

// ============================================================
// 类型
// ============================================================

export interface UploadResult {
  fileID: string
  tempFileURL?: string
}

export interface UploadOptions {
  /** 云端路径，如 'avatars/user123.jpg' */
  cloudPath: string
  /** 本地临时文件路径 */
  filePath: string
}

// ============================================================
// 底层：环境判断
// ============================================================

const isWeapp = process.env.TARO_ENV === 'weapp'

// ============================================================
// 上传文件
// ============================================================

export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  if (!isWeapp) {
    console.warn('[Storage] 非微信环境，跳过上传')
    return { fileID: '', tempFileURL: '' }
  }

  try {
    const res = await Taro.cloud.uploadFile({
      cloudPath: options.cloudPath,
      filePath: options.filePath,
    })
    return { fileID: res.fileID }
  } catch (err: any) {
    console.error('[Storage] 上传失败:', err)
    throw new Error(err.errMsg || '文件上传失败')
  }
}

// ============================================================
// 获取临时下载链接
// ============================================================

export async function getTempFileURL(
  fileIDList: string[],
  maxAge: number = 7200,
): Promise<Map<string, string>> {
  if (!isWeapp || fileIDList.length === 0) {
    return new Map()
  }

  try {
    const res = await Taro.cloud.getTempFileURL({
      fileList: fileIDList.map(id => ({ fileID: id, maxAge })),
    })

    const urlMap = new Map<string, string>()
    for (const item of res.fileList) {
      if (item.status === 0 && item.tempFileURL) {
        urlMap.set(item.fileID, item.tempFileURL)
      }
    }
    return urlMap
  } catch (err: any) {
    console.error('[Storage] 获取临时链接失败:', err)
    return new Map()
  }
}

// ============================================================
// 删除文件
// ============================================================

export async function deleteFiles(fileIDList: string[]): Promise<string[]> {
  if (!isWeapp || fileIDList.length === 0) {
    return []
  }

  try {
    const res = await Taro.cloud.deleteFile({
      fileList: fileIDList,
    })

    const deleted: string[] = []
    for (const item of res.fileList) {
      if (item.status === 0) {
        deleted.push(item.fileID)
      }
    }
    return deleted
  } catch (err: any) {
    console.error('[Storage] 删除文件失败:', err)
    return []
  }
}

// ============================================================
// 下载文件到本地
// ============================================================

export async function downloadFile(fileID: string): Promise<string> {
  if (!isWeapp) {
    console.warn('[Storage] 非微信环境，跳过下载')
    return ''
  }

  try {
    const res = await Taro.cloud.downloadFile({ fileID })
    return res.tempFilePath
  } catch (err: any) {
    console.error('[Storage] 下载失败:', err)
    throw new Error(err.errMsg || '文件下载失败')
  }
}

// ============================================================
// 便捷方法：上传头像
// ============================================================

export async function uploadAvatar(
  userId: number,
  tempFilePath: string,
): Promise<string> {
  const ext = tempFilePath.split('.').pop() || 'jpg'
  const cloudPath = `avatars/${userId}_${Date.now()}.${ext}`
  const result = await uploadFile({ cloudPath, filePath: tempFilePath })
  return result.fileID
}

// ============================================================
// 便捷方法：上传练习截图
// ============================================================

export async function uploadPracticeImage(
  userId: number,
  subject: string,
  tempFilePath: string,
): Promise<string> {
  const ext = tempFilePath.split('.').pop() || 'png'
  const cloudPath = `practices/${subject}/${userId}_${Date.now()}.${ext}`
  const result = await uploadFile({ cloudPath, filePath: tempFilePath })
  return result.fileID
}
