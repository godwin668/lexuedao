/**
 * 笔画评分算法
 * 通过 DTW（动态时间规整）比较用户笔画与标准笔画中位线
 */

/**
 * 两点间欧氏距离
 */
function pointDistance(p1: number[], p2: number[]): number {
  const dx = p1[0] - p2[0]
  const dy = p1[1] - p2[1]
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 对点序列等距重采样到指定点数
 */
function resample(points: number[][], count: number): number[][] {
  if (points.length <= 1 || count <= 1) return points

  // 计算总长度和各段长度
  let totalLen = 0
  const segLengths: number[] = []
  for (let i = 1; i < points.length; i++) {
    const d = pointDistance(points[i - 1], points[i])
    segLengths.push(d)
    totalLen += d
  }

  if (totalLen === 0) return points

  const result: number[][] = [[...points[0]]]
  const step = totalLen / (count - 1)
  let segIdx = 0
  let segStart = 0

  for (let i = 1; i < count - 1; i++) {
    const targetDist = i * step

    while (segIdx < segLengths.length && segStart + segLengths[segIdx] < targetDist) {
      segStart += segLengths[segIdx]
      segIdx++
    }

    if (segIdx >= segLengths.length) {
      result.push([...points[points.length - 1]])
      continue
    }

    const segLen = segLengths[segIdx] || 1
    const t = (targetDist - segStart) / segLen
    const p0 = points[segIdx]
    const p1 = points[Math.min(segIdx + 1, points.length - 1)]
    result.push([
      p0[0] + (p1[0] - p0[0]) * t,
      p0[1] + (p1[1] - p0[1]) * t,
    ])
  }

  result.push([...points[points.length - 1]])
  return result
}

/**
 * 简化 DTW 距离（重采样后逐点比较）
 */
function dtwDistance(userPts: number[][], stdPts: number[][]): number {
  if (userPts.length === 0 || stdPts.length === 0) return 200

  const sampleCount = Math.min(20, Math.min(userPts.length, stdPts.length))
  const sampleUser = resample(userPts, sampleCount)
  const sampleStd = resample(stdPts, sampleCount)

  let totalDist = 0
  for (let i = 0; i < sampleCount; i++) {
    totalDist += pointDistance(sampleUser[i], sampleStd[i])
  }

  return totalDist / sampleCount
}

/**
 * 评估用户书写得分
 * @param userStrokes - 用户笔画数据 string[][]，每个笔画是 "x,y" 字符串数组（画布像素坐标）
 * @param medians - 标准笔画中位线 number[][][]（1024x1024 坐标系）
 * @returns { score: 综合分, accuracy: 笔画准确度, aesthetics: 书写美观度 }
 */
export function evaluateCharacterScore(
  userStrokes: string[][],
  medians?: number[][][]
): { score: number; accuracy: number; aesthetics: number } {
  // 无书写内容
  if (!userStrokes || userStrokes.length === 0) {
    return { score: 0, accuracy: 0, aesthetics: 0 }
  }

  // 无标准数据时基于笔画数给基础分
  if (!medians || medians.length === 0) {
    const strokeCount = userStrokes.length
    const baseScore = Math.min(70, strokeCount * 10)
    return { score: baseScore, accuracy: baseScore, aesthetics: baseScore }
  }

  // 解析用户笔画坐标
  const userPoints: number[][][] = userStrokes.map((stroke) =>
    stroke.map((pt) => {
      const [x, y] = pt.split(',').map(Number)
      return [x, y]
    })
  )

  // 计算用户笔画的包围盒
  let userMinX = Infinity, userMinY = Infinity, userMaxX = -Infinity, userMaxY = -Infinity
  for (const stroke of userPoints) {
    for (const [x, y] of stroke) {
      if (x < userMinX) userMinX = x
      if (y < userMinY) userMinY = y
      if (x > userMaxX) userMaxX = x
      if (y > userMaxY) userMaxY = y
    }
  }

  // 计算标准 medians 的包围盒
  let stdMinX = Infinity, stdMinY = Infinity, stdMaxX = -Infinity, stdMaxY = -Infinity
  for (const stroke of medians) {
    for (const [x, y] of stroke) {
      if (x < stdMinX) stdMinX = x
      if (y < stdMinY) stdMinY = y
      if (x > stdMaxX) stdMaxX = x
      if (y > stdMaxY) stdMaxY = y
    }
  }

  const userRangeX = userMaxX - userMinX || 1
  const userRangeY = userMaxY - userMinY || 1
  const stdRangeX = stdMaxX - stdMinX || 1
  const stdRangeY = stdMaxY - stdMinY || 1

  // 统一缩放到 1024 空间（取两者中较大的缩放比，保持比例一致）
  const scale = 1024 / Math.max(userRangeX, userRangeY, stdRangeX, stdRangeY)

  // 归一化用户笔画：居中到 1024 空间，Y 轴翻转（画布 Y↓ → 数据 Y↑）
  const normalizedUser: number[][][] = userPoints.map((stroke) =>
    stroke.map(([x, y]) => [
      (x - userMinX) * scale + (1024 - userRangeX * scale) / 2,
      1024 - ((y - userMinY) * scale + (1024 - userRangeY * scale) / 2),
    ])
  )

  // 归一化标准 medians：居中到 1024 空间（数据已是 Y↑，无需翻转）
  const normalizedStd: number[][][] = medians.map((stroke) =>
    stroke.map(([x, y]) => [
      (x - stdMinX) * scale + (1024 - stdRangeX * scale) / 2,
      (y - stdMinY) * scale + (1024 - stdRangeY * scale) / 2,
    ])
  )

  // 笔画数匹配度
  const strokeCountMatch =
    Math.min(userStrokes.length, medians.length) /
    Math.max(userStrokes.length, medians.length)

  // 逐笔 DTW 距离
  let totalDist = 0
  let comparedStrokes = 0

  for (let i = 0; i < Math.min(normalizedUser.length, normalizedStd.length); i++) {
    const dist = dtwDistance(normalizedUser[i], normalizedStd[i])
    totalDist += dist
    comparedStrokes++
  }

  const avgDist = comparedStrokes > 0 ? totalDist / comparedStrokes : 200

  // 距离转分数（归一化到同一 1024 空间后：<30 优秀，>200 较差）
  const accuracyScore = Math.max(0, Math.min(100, Math.round(100 - avgDist * 0.35)))

  // 美观度：准确度 + 笔画数匹配
  const aestheticsScore = Math.round(
    Math.max(0, Math.min(100, accuracyScore * 0.6 + strokeCountMatch * 40))
  )

  // 综合评分 = 准确度与美观度的加权平均
  const score = Math.round(accuracyScore * 0.5 + aestheticsScore * 0.5)

  return {
    score: Math.max(0, Math.min(100, score)),
    accuracy: Math.max(0, Math.min(100, accuracyScore)),
    aesthetics: Math.max(0, Math.min(100, aestheticsScore)),
  }
}
