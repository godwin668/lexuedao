/**
 * aiChat - AI 学习助手对话
 * 基于规则的关键词匹配回复（后续可接入大模型）
 */
const cloud = require('wx-server-sdk')
const { Client } = require('pg')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 关键词匹配规则库
const RULES = [
  {
    keywords: ['笔画', '笔顺', '怎么写', '汉字结构', '偏旁', '部首'],
    subject: 'hanzi',
    reply: '汉字书写要注意笔顺规则：先横后竖、先撇后捺、从上到下、从左到右、先外后内、先中间后两边。你可以进入「汉字练习」模块，跟着动画一笔一画练习哦！'
  },
  {
    keywords: ['加法', '减法', '乘法', '除法', '口算', '计算', '算术', '数学'],
    subject: 'math',
    reply: '数学计算的关键是多练习！建议每天做10-20道口算题，从简单到复杂逐步提升。进入「数学练习」模块，选择适合你年级的题目开始吧！'
  },
  {
    keywords: ['单词', '英语', '拼写', '听力', '发音', '词汇', 'english'],
    subject: 'english',
    reply: '学习英语单词可以试试这些方法：1）每天记5-10个新单词；2）用拼写练习巩固记忆；3）多听多读培养语感。去「英语学习」模块开始练习吧！'
  },
  {
    keywords: ['错题', '错字', '错误', '做错', '不会'],
    subject: null,
    reply: '做错的题目是最好的学习材料！建议你：1）打开错题本回顾错题；2）分析错误原因；3）针对薄弱知识点多加练习。坚持复习错题，进步会很快！'
  },
  {
    keywords: ['方法', '怎么学', '学习技巧', '提高', '进步', '成绩'],
    subject: null,
    reply: '高效学习方法推荐：1）每天坚持练习15-30分钟；2）及时复习错题；3）利用游戏化功能保持兴趣；4）设定小目标逐步达成。坚持就是胜利！'
  },
  {
    keywords: ['打卡', '连续', '坚持', '习惯'],
    subject: null,
    reply: '养成每天学习的好习惯很重要！连续打卡可以获得额外奖励哦。建议每天固定时间学习，比如放学后或晚饭前，慢慢就会形成习惯啦！'
  },
  {
    keywords: ['对战', 'PK', '比赛', '挑战', '排名'],
    subject: null,
    reply: '对战模式可以和朋友一起PK学习！进入「对战」模块，选择学科和对手，看看谁答得又快又准。赢了对战还能获得额外经验和金币！'
  },
  {
    keywords: ['等级', '经验', '金币', '钻石', '升级', '奖励'],
    subject: null,
    reply: '通过练习可以获得经验和金币，积累经验可以升级，金币可以兑换道具和装扮。连续打卡和完成成就还能获得钻石奖励哦！'
  },
  {
    keywords: ['你好', '嗨', 'hello', 'hi', '在吗'],
    subject: null,
    reply: '你好呀！我是乐学岛的学习助手，可以帮你解答学习问题、推荐练习题、分析薄弱知识点。有什么想了解的吗？'
  }
]

const FALLBACK_REPLY = '这个问题有点难到我了～你可以试试问我：某个知识点怎么学、错题怎么复习、学习方法推荐，或者直接去练习模块开始练习吧！'

function matchRules(userMessage) {
  const msg = userMessage.toLowerCase()
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (msg.includes(kw)) return rule
    }
  }
  return null
}

exports.main = async (event, context) => {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
  })

  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    const { messages = [] } = event

    // 取最后一条用户消息
    const userMessages = messages.filter(m => m.role === 'user')
    if (userMessages.length === 0) {
      return { code: 0, message: 'ok', data: { reply: '你好！有什么学习问题想问我吗？' } }
    }

    const lastUserMsg = userMessages[userMessages.length - 1].content || ''

    // 关键词匹配
    const matched = matchRules(lastUserMsg)
    if (matched) {
      return { code: 0, message: 'ok', data: { reply: matched.reply } }
    }

    // 尝试根据用户年级给出个性化回复
    await client.connect()
    const userResult = await client.query(
      'SELECT grade FROM users WHERE openid = $1',
      [openid]
    )

    if (userResult.rows.length > 0) {
      const grade = userResult.rows[0].grade
      return {
        code: 0,
        message: 'ok',
        data: {
          reply: `你目前是${grade}年级，可以试试进入对应学科的练习模块，选择适合你年级的题目开始练习。有什么具体的学习问题随时问我哦！`
        }
      }
    }

    return { code: 0, message: 'ok', data: { reply: FALLBACK_REPLY } }
  } catch (err) {
    console.error('[aiChat] error:', err)
    return { code: -1, message: err.message || '服务异常' }
  } finally {
    await client.end().catch(() => {})
  }
}
