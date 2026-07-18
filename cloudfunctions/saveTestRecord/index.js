/**
 * saveTestRecord - 保存测试记录
 */
const cloud = require('wx-server-sdk')
const { Client } = require('pg')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
  })

  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    await client.connect()

    const userResult = await client.query(
      'SELECT id FROM users WHERE openid = $1',
      [openid]
    )
    if (userResult.rows.length === 0) {
      return { code: -1, message: '用户不存在', data: null }
    }
    const userId = userResult.rows[0].id

    const {
      subject = 'hanzi',
      grade = 1,
      characters = [],
      scores = [],
      avgAccuracy = 0,
      totalTime = 0,
    } = event

    const contentJson = { characters, scores, avgAccuracy, totalTime }
    const score = Math.round(avgAccuracy)
    const expGained = Math.max(1, Math.floor(score / 10))
    const coinsGained = Math.max(1, Math.floor(score / 20))

    const result = await client.query(
      `INSERT INTO practice_records (user_id, subject, type, grade, content_json, score, accuracy, duration, exp_gained, coins_gained)
       VALUES ($1, $2, 'test', $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_at`,
      [userId, subject, grade, JSON.stringify(contentJson), score, avgAccuracy, totalTime, expGained, coinsGained]
    )

    await client.query(
      `UPDATE user_game_profile
       SET exp = exp + $1, coins = coins + $2
       WHERE user_id = $3`,
      [expGained, coinsGained, userId]
    )

    const row = result.rows[0]
    return {
      code: 0,
      message: 'success',
      data: {
        id: row.id,
        characters,
        scores,
        avgAccuracy,
        totalTime,
        createdAt: row.created_at,
      },
    }
  } catch (err) {
    console.error('[saveTestRecord] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  } finally {
    await client.end()
  }
}
