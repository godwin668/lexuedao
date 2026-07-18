/**
 * savePracticeRecord - 保存练习记录（通用，三科共用）
 * 写入 practice_records 表，同时更新 user_game_profile 的经验/金币
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

    // 1. 获取用户 ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE openid = $1',
      [openid]
    )
    if (userResult.rows.length === 0) {
      return { code: -1, message: '用户不存在', data: null }
    }
    const userId = userResult.rows[0].id

    // 2. 写入练习记录
    const {
      subject = 'hanzi',
      type = 'practice',
      grade = 1,
      contentJson = {},
      score = 0,
      accuracy = 0,
      duration = 0,
    } = event

    // 计算经验值和金币
    const expGained = Math.max(1, Math.floor(score / 10))
    const coinsGained = Math.max(1, Math.floor(score / 20))

    const result = await client.query(
      `INSERT INTO practice_records (user_id, subject, type, grade, content_json, score, accuracy, duration, exp_gained, coins_gained)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, user_id, subject, type, grade, content_json, score, accuracy, duration, exp_gained, coins_gained, created_at`,
      [userId, subject, type, grade, JSON.stringify(contentJson), score, accuracy, duration, expGained, coinsGained]
    )

    // 3. 更新游戏档案
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
        character: contentJson.character || '',
        mode: type,
        strokes: contentJson.strokes || [],
        score: row.score,
        accuracy: row.accuracy,
        aesthetics: contentJson.aesthetics || 0,
        duration: row.duration,
        createdAt: row.created_at,
      },
    }
  } catch (err) {
    console.error('[savePracticeRecord] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  } finally {
    await client.end()
  }
}
