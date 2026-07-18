/**
 * Canvas 笔画渲染工具
 * - drawGrid: 绘制米字格
 * - drawAllStrokeOutlines: 绘制标准笔画轮廓（底字）
 * - StrokeAnimationRenderer: 笔顺动画渲染器
 */

export interface RenderOptions {
  canvasWidth: number
  canvasHeight: number
  margin: number
  gridSize: number
  lineWidth?: number
  lineCap?: CanvasLineCap
  lineJoin?: CanvasLineJoin
}

/**
 * 绘制米字格（外框 + 十字中线 + 对角线虚线）
 */
export function drawGrid(
  ctx: any,
  opts: RenderOptions,
  color: string = 'rgba(0, 0, 0, 0.12)'
) {
  const w = opts.canvasWidth
  const h = opts.canvasHeight
  const m = opts.margin
  const drawW = w - m * 2
  const drawH = h - m * 2

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1

  // 外框
  ctx.strokeRect(m, m, drawW, drawH)

  // 横中线
  ctx.beginPath()
  ctx.moveTo(m, m + drawH / 2)
  ctx.lineTo(m + drawW, m + drawH / 2)
  ctx.stroke()

  // 竖中线
  ctx.beginPath()
  ctx.moveTo(m + drawW / 2, m)
  ctx.lineTo(m + drawW / 2, m + drawH)
  ctx.stroke()

  // 对角线虚线
  ctx.setLineDash([4, 8])
  ctx.lineWidth = 0.5

  ctx.beginPath()
  ctx.moveTo(m, m)
  ctx.lineTo(m + drawW, m + drawH)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(m + drawW, m)
  ctx.lineTo(m, m + drawH)
  ctx.stroke()

  ctx.setLineDash([])
  ctx.restore()
}

/**
 * 解析单条 SVG path 并绘制到 canvas
 */
function drawSvgPath(ctx: any, pathStr: string) {
  const commands = pathStr.match(/[MLQCZ][^MLQCZ]*/gi)
  if (!commands) return

  ctx.beginPath()

  for (const cmd of commands) {
    const type = cmd[0]
    const nums = cmd.slice(1).trim().split(/[\s,]+/).map(Number)

    switch (type) {
      case 'M':
        ctx.moveTo(nums[0], nums[1])
        break
      case 'L':
        ctx.lineTo(nums[0], nums[1])
        break
      case 'Q':
        ctx.quadraticCurveTo(nums[0], nums[1], nums[2], nums[3])
        break
      case 'C':
        ctx.bezierCurveTo(nums[0], nums[1], nums[2], nums[3], nums[4], nums[5])
        break
      case 'Z':
        ctx.closePath()
        break
    }
  }
}

/**
 * 绘制所有标准笔画轮廓（底字/描红底图）
 */
export function drawAllStrokeOutlines(
  ctx: any,
  strokes: string[],
  opts: RenderOptions,
  fill: boolean = false,
  color: string = 'rgba(0, 0, 0, 0.1)'
) {
  const w = opts.canvasWidth
  const h = opts.canvasHeight
  const m = opts.margin
  const gridSize = opts.gridSize
  const lineWidth = opts.lineWidth || 2
  const lineCap = opts.lineCap || 'round'
  const lineJoin = opts.lineJoin || 'round'
  const drawW = w - m * 2
  const drawH = h - m * 2
  const scale = Math.min(drawW / gridSize, drawH / gridSize)
  const offsetX = m + (drawW - gridSize * scale) / 2
  const offsetY = m + (drawH - gridSize * scale) / 2

  ctx.save()
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lineWidth / scale
  ctx.lineCap = lineCap
  ctx.lineJoin = lineJoin

  for (const pathStr of strokes) {
    drawSvgPath(ctx, pathStr)
    if (fill) {
      ctx.fill()
    }
    ctx.stroke()
  }

  ctx.restore()
}

// ========== 笔顺动画渲染器 ==========

export interface AnimationState {
  currentStrokeIndex: number
  progress: number
}

export class StrokeAnimationRenderer {
  private ctx: any
  private medians: number[][][]
  private opts: RenderOptions
  private fillColor: string = 'rgba(71, 184, 129, 0.3)'
  private strokeColor: string = 'rgba(255, 74, 74, 0.85)'
  private timerId: any = null
  private currentStrokeIndex: number = 0
  private progress: number = 0
  private completedStrokes: number[][] = []
  private onFrameCb: ((state: AnimationState) => void) | null = null
  private onCompleteCb: (() => void) | null = null

  /** 每帧绘制前调用，用于重绘背景（网格 + 底字） */
  drawBackground: (() => void) | null = null

  constructor(ctx: any, medians: number[][][], opts: RenderOptions) {
    this.ctx = ctx
    this.medians = medians
    this.opts = opts
  }

  setColors(fillColor: string, strokeColor: string) {
    this.fillColor = fillColor
    this.strokeColor = strokeColor
  }

  onAnimationFrame(cb: (state: AnimationState) => void) {
    this.onFrameCb = cb
  }

  onAnimationComplete(cb: () => void) {
    this.onCompleteCb = cb
  }

  start(intervalMs: number = 60) {
    this.currentStrokeIndex = 0
    this.progress = 0
    this.completedStrokes = []
    this.animate(intervalMs)
  }

  private animate(intervalMs: number) {
    const w = this.opts.canvasWidth
    const h = this.opts.canvasHeight
    const m = this.opts.margin
    const gridSize = this.opts.gridSize
    const drawW = w - m * 2
    const drawH = h - m * 2
    const scale = Math.min(drawW / gridSize, drawH / gridSize)
    const offsetX = m + (drawW - gridSize * scale) / 2
    const offsetY = m + (drawH - gridSize * scale) / 2

    this.timerId = setInterval(() => {
      if (this.currentStrokeIndex >= this.medians.length) {
        this.destroy()
        this.onCompleteCb?.()
        return
      }

      const currentMedian = this.medians[this.currentStrokeIndex]
      this.progress += 0.08

      // 重绘背景
      if (this.drawBackground) {
        this.drawBackground()
      }

      const ctx = this.ctx
      ctx.save()
      ctx.translate(offsetX, offsetY)
      ctx.scale(scale, scale)

      // 已完成的笔画（浅色填充）
      ctx.strokeStyle = this.fillColor
      ctx.lineWidth = 8
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      for (const stroke of this.completedStrokes) {
        ctx.beginPath()
        ctx.moveTo(stroke[0], stroke[1])
        for (let i = 2; i < stroke.length; i += 2) {
          ctx.lineTo(stroke[i], stroke[i + 1])
        }
        ctx.stroke()
      }

      // 当前动画中的笔画（高亮色）
      const endIdx = Math.min(
        Math.floor(this.progress * currentMedian.length),
        currentMedian.length
      )

      if (endIdx > 0) {
        ctx.strokeStyle = this.strokeColor
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.moveTo(currentMedian[0][0], currentMedian[0][1])
        for (let i = 1; i < endIdx; i++) {
          ctx.lineTo(currentMedian[i][0], currentMedian[i][1])
        }
        ctx.stroke()
      }

      ctx.restore()

      this.onFrameCb?.({ currentStrokeIndex: this.currentStrokeIndex, progress: this.progress })

      if (this.progress >= 1) {
        this.completedStrokes.push(currentMedian.flat())
        this.currentStrokeIndex++
        this.progress = 0
      }
    }, intervalMs)
  }

  destroy() {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }
}
