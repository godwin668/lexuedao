/**
 * 压感笔刷工具
 * 基于书写速度模拟笔压效果：快→细，慢→粗
 */

export interface BrushState {
  currentWidth: number
  lastPos: { x: number; y: number } | null
  speed: number
}

const MIN_WIDTH = 2
const MAX_WIDTH = 8
const BASE_WIDTH = 4

export function createBrushState(): BrushState {
  return {
    currentWidth: BASE_WIDTH,
    lastPos: null,
    speed: 0,
  }
}

export function resetBrushState(state: BrushState) {
  state.currentWidth = BASE_WIDTH
  state.lastPos = null
  state.speed = 0
}

/**
 * 根据移动速度计算当前笔刷宽度
 * 速度越快宽度越细，模拟真实书写压感
 */
export function calcBrushWidth(
  state: BrushState,
  pos: { x: number; y: number }
): { width: number } {
  if (state.lastPos) {
    const dx = pos.x - state.lastPos.x
    const dy = pos.y - state.lastPos.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    state.speed = dist
    // 速度因子：距离越大（越快）→ 因子越小 → 笔触越细
    const speedFactor = Math.max(0.3, Math.min(1, 5 / (dist + 1)))
    state.currentWidth = MIN_WIDTH + (MAX_WIDTH - MIN_WIDTH) * speedFactor
  }
  state.lastPos = { x: pos.x, y: pos.y }
  return { width: state.currentWidth }
}
