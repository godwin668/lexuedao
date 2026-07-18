/**
 * 生成 Tabbar 图标 PNG - 带形状的图标
 * 纯 Node.js 实现，无需外部依赖
 */
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

const SIZE = 81
const HALF = 40
const CENTER = 40

function createPNG(pixels) {
  const rawData = Buffer.alloc((SIZE * 4 + 1) * SIZE)
  for (let y = 0; y < SIZE; y++) {
    rawData[y * (SIZE * 4 + 1)] = 0
    for (let x = 0; x < SIZE; x++) {
      const offset = y * (SIZE * 4 + 1) + 1 + x * 4
      const p = pixels[y * SIZE + x]
      rawData[offset] = p[0]
      rawData[offset + 1] = p[1]
      rawData[offset + 2] = p[2]
      rawData[offset + 3] = p[3]
    }
  }
  const compressed = zlib.deflateSync(rawData)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(SIZE, 0)
  ihdrData.writeUInt32BE(SIZE, 4)
  ihdrData[8] = 8; ihdrData[9] = 6; ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0
  const ihdr = createChunk('IHDR', ihdrData)
  const idat = createChunk('IDAT', compressed)
  const iend = createChunk('IEND', Buffer.alloc(0))
  return Buffer.concat([signature, ihdr, idat, iend])
}

function createChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuffer = Buffer.from(type, 'ascii')
  const crcInput = Buffer.concat([typeBuffer, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcInput), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? ((crc >>> 1) ^ 0xEDB88320) : (crc >>> 1)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function blankCanvas() {
  return Array(SIZE * SIZE).fill(null).map(() => [0, 0, 0, 0])
}

function fillRect(canvas, x1, y1, x2, y2, color) {
  for (let y = Math.max(0, y1); y <= Math.min(SIZE - 1, y2); y++) {
    for (let x = Math.max(0, x1); x <= Math.min(SIZE - 1, x2); x++) {
      canvas[y * SIZE + x] = color
    }
  }
}

function fillCircle(canvas, cx, cy, r, color) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - cx, dy = y - cy
      if (dx * dx + dy * dy <= r * r) {
        canvas[y * SIZE + x] = color
      }
    }
  }
}

function fillPolygon(canvas, points, color) {
  const minX = Math.max(0, Math.min(...points.map(p => p[0])))
  const maxX = Math.min(SIZE - 1, Math.max(...points.map(p => p[0])))
  const minY = Math.max(0, Math.min(...points.map(p => p[1])))
  const maxY = Math.min(SIZE - 1, Math.max(...points.map(p => p[1])))
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pointInPolygon(x, y, points)) {
        canvas[y * SIZE + x] = color
      }
    }
  }
}

function pointInPolygon(px, py, points) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0], yi = points[i][1]
    const xj = points[j][0], yj = points[j][1]
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// 绘制线条
function drawLine(canvas, x1, y1, x2, y2, color, thickness = 3) {
  const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1)
  const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1
  let err = dx - dy, x = x1, y = y1
  while (true) {
    fillCircle(canvas, x, y, thickness, color)
    if (x === x2 && y === y2) break
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; x += sx }
    if (e2 < dx) { err += dx; y += sy }
  }
}

// ===== 首页图标：房子 =====
function drawHomeIcon(color) {
  const c = blankCanvas()
  const [r, g, b] = color
  const bg = [r, g, b, 255]
  // 屋顶三角形
  fillPolygon(c, [[40, 8], [8, 32], [72, 32]], bg)
  // 房子主体
  fillRect(c, 16, 32, 64, 68, bg)
  // 门
  fillRect(c, 32, 44, 48, 68, [255, 255, 255, 255])
  // 门把手
  fillCircle(c, 44, 56, 2, color)
  return c
}

// ===== 我的图标：人形 =====
function drawMineIcon(color) {
  const c = blankCanvas()
  const [r, g, b] = color
  const bg = [r, g, b, 255]
  // 头
  fillCircle(c, 40, 20, 12, bg)
  // 身体
  fillRect(c, 28, 36, 52, 62, bg)
  // 左臂
  fillPolygon(c, [[28, 36], [12, 50], [28, 48]], bg)
  // 右臂
  fillPolygon(c, [[52, 36], [68, 50], [52, 48]], bg)
  // 左腿
  fillRect(c, 30, 62, 38, 72, bg)
  // 右腿
  fillRect(c, 42, 62, 50, 72, bg)
  return c
}

const outDir = path.join(__dirname, '..', 'assets', 'tabbar')

// 首页 - 蓝色房子
fs.writeFileSync(path.join(outDir, 'home.png'), createPNG(drawHomeIcon([74, 144, 217])))
// 首页选中 - 深蓝房子
fs.writeFileSync(path.join(outDir, 'home-selected.png'), createPNG(drawHomeIcon([58, 123, 200])))

// 我的 - 灰色人形
fs.writeFileSync(path.join(outDir, 'mine.png'), createPNG(drawMineIcon([153, 153, 153])))
// 我的选中 - 蓝色人形
fs.writeFileSync(path.join(outDir, 'mine-selected.png'), createPNG(drawMineIcon([74, 144, 217])))

console.log('Tabbar icons generated successfully!')
console.log('Output:', outDir)
