/**
 * aiChat - AI 学习助手对话
 * 接入 DeepSeek 大模型
 */
const cloud = require('wx-server-sdk')
const https = require('https')
const { Client } = require('pg')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-v4-flash'

const SYSTEM_PROMPT = `你是"乐学小岛"的 AI 学习助手，专门为小学生（1-6年级）提供学习帮助。

你的特点：
- 用友好、鼓励、耐心的语气回答，像一位亲切的老师
- 回答要简洁易懂，适合小学生理解
- 多用具体例子和比喻来解释概念

乐学小岛 App 的功能模块：
- 语文：汉字书写练习、笔画笔顺、描红、测验
- 数学：口算练习、加减乘除、测验
- 英语：单词学习、拼写练习、听力训练、测验
- 对战模式：好友 PK 答题
- 排行榜：班级/全校/全国排名
- 每日挑战：完成任务领奖励
- 错题本：自动收集错题，针对性复习
- 成就系统：完成目标获得徽章
- 打卡：连续学习获得额外奖励
- VIP：解锁更多功能和 AI 智能推荐

当用户问到 App 功能相关的问题时，请结合以上信息回答，并引导他们去对应的模块练习。`

const FALLBACK_REPLY = '抱歉，AI 服务暂时不可用，请稍后再试～你也可以直接去练习模块开始学习哦！'

async function getUserId(client, openid) {
  const result = await client.query('SELECT id FROM users WHERE openid = $1', [openid])
  return result.rows.length > 0 ? result.rows[0].id : null
}

function callDeepSeek(messages, gradeInfo) {
  const systemContent = SYSTEM_PROMPT + gradeInfo

  const requestBody = JSON.stringify({
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: systemContent },
      ...messages.filter(m => m.role !== 'system'),
    ],
    temperature: 0.7,
    max_tokens: 1000,
  })

  return new Promise((resolve, reject) => {
    const url = new URL(DEEPSEEK_API_URL)
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Length': Buffer.byteLength(requestBody),
      },
      timeout: 15000,
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (result.choices && result.choices.length > 0) {
            resolve(result.choices[0].message.content)
          } else {
            reject(new Error(result.error?.message || 'DeepSeek 返回为空'))
          }
        } catch (e) {
          reject(new Error('解析 DeepSeek 响应失败'))
        }
      })
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('DeepSeek 请求超时'))
    })

    req.write(requestBody)
    req.end()
  })
}

exports.main = async (event, context) => {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
  })

  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    const { messages = [] } = event

    const userMessages = messages.filter(m => m.role === 'user')
    if (userMessages.length === 0) {
      return { code: 0, message: 'ok', data: { reply: '你好！有什么学习问题想问我吗？' } }
    }

    // 获取用户年级信息，注入到系统提示中
    let gradeInfo = ''
    try {
      await client.connect()
      const userResult = await client.query(
        'SELECT grade, nickname FROM users WHERE openid = $1',
        [openid]
      )
      if (userResult.rows.length > 0) {
        const { grade, nickname } = userResult.rows[0]
        gradeInfo = `\n\n当前学生信息：${nickname || '小朋友'}，${grade}年级。请根据年级调整回答难度和内容。`
      }
    } catch (dbErr) {
      console.warn('[aiChat] 查询用户信息失败:', dbErr.message)
    }

    // 调用 DeepSeek
    const reply = await callDeepSeek(messages, gradeInfo)

    // 保存对话记录
    try {
      const lastUserMsg = userMessages[userMessages.length - 1]
      const userId = await getUserId(client, openid)
      if (userId) {
        await client.query(
          `INSERT INTO ai_conversations (user_id, subject, role, content) VALUES ($1, $2, $3, $4)`,
          [userId, event.subject || 'general', 'user', lastUserMsg.content]
        )
        await client.query(
          `INSERT INTO ai_conversations (user_id, subject, role, content) VALUES ($1, $2, $3, $4)`,
          [userId, event.subject || 'general', 'assistant', reply]
        )
      }
    } catch (saveErr) {
      console.warn('[aiChat] 保存对话记录失败:', saveErr.message)
    }

    return { code: 0, message: 'ok', data: { reply } }
  } catch (err) {
    console.error('[aiChat] error:', err)
    return { code: 0, message: 'ok', data: { reply: FALLBACK_REPLY } }
  } finally {
    await client.end().catch(() => {})
  }
}
