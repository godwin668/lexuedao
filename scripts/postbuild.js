const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, '..', 'dist')

function fixMainPages() {
  const appJsonPath = path.join(distDir, 'app.json')
  if (!fs.existsSync(appJsonPath)) return

  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'))
  const mainPages = appJson.pages || []

  mainPages.forEach((pagePath) => {
    const jsFile = path.join(distDir, pagePath + '.js')
    if (!fs.existsSync(jsFile)) {
      fs.writeFileSync(jsFile, '')
      console.log(`  [postbuild] created: ${pagePath}.js`)
    }
  })
}

function fixCompJs() {
  // Taro 将 comp.js 打包到 dist/js/comp.[hash].js，但微信编译器期望它在 dist/comp.js
  const compJsonPath = path.join(distDir, 'comp.json')
  if (!fs.existsSync(compJsonPath)) return

  const compJsPath = path.join(distDir, 'comp.js')
  if (fs.existsSync(compJsPath)) return

  // 查找 dist/js/comp.*.js
  const jsDir = path.join(distDir, 'js')
  if (!fs.existsSync(jsDir)) return

  const files = fs.readdirSync(jsDir)
  const compFile = files.find(f => f.startsWith('comp.') && f.endsWith('.js'))
  if (compFile) {
    const content = fs.readFileSync(path.join(jsDir, compFile), 'utf-8')
    fs.writeFileSync(compJsPath, content)
    console.log(`  [postbuild] created: comp.js (from js/${compFile})`)
  }
}

function run() {
  fixMainPages()
  fixCompJs()
}

// --watch 模式：轮询 dist 目录变化，自动补充缺失文件
if (process.argv.includes('--watch')) {
  console.log('[postbuild] watching dist for changes...')
  run()

  setInterval(() => {
    run()
  }, 2000)
} else {
  run()
  console.log('postbuild done.')
}
