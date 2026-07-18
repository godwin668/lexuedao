const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, '..', 'dist')

/**
 * 安全写入：内容不变则跳过
 */
function safeWrite(targetFile, content) {
  if (fs.existsSync(targetFile)) {
    const old = fs.readFileSync(targetFile, 'utf-8')
    if (old === content) return false
  }
  const dir = path.dirname(targetFile)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(targetFile, content)
  return true
}

/**
 * 从 dist/ 目录中找到带 hash 的文件，复制为无 hash 版本
 * 例如: dist/pages/home/index.abc123.js → dist/pages/home/index.js
 */
function copyHashToPlain(dirPath, prefix) {
  if (!fs.existsSync(dirPath)) return false

  const files = fs.readdirSync(dirPath)
  const hashFile = files.find(f => f.startsWith(prefix + '.') && f.endsWith('.js') && !f.endsWith('.map'))
  if (!hashFile) return false

  const srcPath = path.join(dirPath, hashFile)
  const targetPath = path.join(dirPath, prefix + '.js')
  const content = fs.readFileSync(srcPath, 'utf-8')
  return safeWrite(targetPath, content)
}

function run() {
  const appJsonPath = path.join(distDir, 'app.json')
  if (!fs.existsSync(appJsonPath)) {
    console.log('postbuild: app.json not found, skipping')
    return
  }

  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'))
  const allPages = [...(appJson.pages || [])]

  if (appJson.subPackages) {
    appJson.subPackages.forEach(sub => {
      sub.pages.forEach(p => allPages.push(sub.root + '/' + p))
    })
  }

  let fixed = 0

  // 修复所有页面 JS
  allPages.forEach(pagePath => {
    const dir = path.join(distDir, path.dirname(pagePath))
    const name = path.basename(pagePath)
    if (copyHashToPlain(dir, name)) fixed++
  })

  // 修复公共 chunk
  const rootChunks = ['app', 'comp', 'common', 'vendors', 'taro', 'runtime', 'custom-wrapper']
  let chunksFixed = 0
  rootChunks.forEach(name => {
    if (copyHashToPlain(distDir, name)) chunksFixed++
  })

  // 修复分包公共 chunk (sub-vendors)
  if (appJson.subPackages) {
    appJson.subPackages.forEach(sub => {
      const subDir = path.join(distDir, sub.root)
      if (copyHashToPlain(subDir, 'sub-vendors')) chunksFixed++
    })
  }

  if (fixed > 0 || chunksFixed > 0) {
    console.log(`  [postbuild] fixed: ${fixed} pages, ${chunksFixed} chunks`)
  }
}

run()
console.log('postbuild done.')
