/**
 * updateRank - 更新段位分
 * 段位计算：bronze < silver < gold < platinum < diamond < king
 */
const cloud = require('wx-server-sdk')
const { Client } = require('pg')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 段位计算规则
function calculateRank(score) {
  if (score >= 2000) return { rank: 'king', name: '王者' }
  if (score >= 1000) return { rank: 'diamond', name: '钻石' }
  if (score >= 600) return { rank: 'platinum', name: '铂金' }
  if (score >= 300) return { rank: 'gold', name: '黄金' }
  if (score >= 100) return { rank: 'silver', name: '白银' }
  return { rank: 'bronze', name: '青铜' }
}

exports.main = async (event, context) => {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
  })

  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    const { subject, score } = event

    if (!subject || !['hanzi', 'math', 'english'].includes(subject)) {
      return { code: -1, message: '无效的学科，支持 hanzi/math/english' }
    }
    if (typeof score !== 'number' || score < 0) {
      return { code: -1, message: '无效的分数' }
    }

    await client.connect()

    // 获取用户 ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE openid = $1',
      [openid]
    )
    if (userResult.rows.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const userId = userResult.rows[0].id

    // 确保 user_ranks 表存在
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_ranks (
        id          BIGSERIAL PRIMARY KEY,
        user_id     BIGINT NOT NULL REFERENCES users(id),
        subject     VARCHAR(16) NOT NULL CHECK (subject IN ('hanzi','math','english')),
        season_score INT DEFAULT 0,
        rank        VARCHAR(16) DEFAULT 'bronze',
        updated_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (user_id, subject)
      )
    `)

    // 查询当前段位分
    const currentResult = await client.query(
      `SELECT season_score, rank FROM user_ranks
       WHERE user_id = $1 AND subject = $2`,
      [userId, subject]
    )

    const oldRank = currentResult.rows.length > 0 ? currentResult.rows[0].rank : null
    const oldScore = currentResult.rows.length > 0 ? currentResult.rows[0].season_score : 0

    // 新分数 = 旧分 + 本次得分
    const newScore = oldScore + score
    const { rank, name } = calculateRank(newScore)

    // 更新或插入段位记录
    if (currentResult.rows.length > 0) {
      await client.query(
        `UPDATE user_ranks
         SET season_score = $1, rank = $2, updated_at = NOW()
         WHERE user_id = $3 AND subject = $4`,
        [newScore, rank, userId, subject]
      )
    } else {
      await client.query(
        `INSERT INTO user_ranks (user_id, subject, season_score, rank)
         VALUES ($1, $2, $3, $4)`,
        [userId, subject, newScore, rank]
      )
    }

    // 判断是否升段
    const rankUp = oldRank && oldRank !== rank

    return {
      code: 0,
      message: 'ok',
      data: {
        subject,
        rank,
        rankName: name,
        seasonScore: newScore,
        scoreAdded: score,
        rankUp
      }
    }
  } catch (err) {
    console.error('[updateRank] error:', err)
    return { code: -1, message: err.message || '服务异常' }
  } finally {
    await client.end().catch(() => {})
  }
}
