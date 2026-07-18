/**
 * getDailyChallenge - 获取每日挑战题目
 * 根据用户年级和学科生成每日挑战
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
    const subject = event.subject || 'hanzi'

    await client.connect()

    // 获取用户年级
    const userResult = await client.query(
      'SELECT id, grade FROM users WHERE openid = $1',
      [openid]
    )
    if (userResult.rows.length === 0) {
      return { code: -1, message: '用户不存在', data: null }
    }
    const { id: userId, grade } = userResult.rows[0]

    // 查询今日是否已有挑战记录
    const todayResult = await client.query(
      `SELECT id, content_json, completed, score
       FROM practice_records
       WHERE user_id = $1 AND type = 'challenge'
         AND date_trunc('day', created_at) = date_trunc('day', NOW())
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    )

    if (todayResult.rows.length > 0) {
      const row = todayResult.rows[0]
      return {
        code: 0,
        message: 'success',
        data: {
          id: row.id,
          subject,
          grade,
          questions: row.content_json?.questions || [],
          completed: row.completed || row.content_json?.completed || false,
          score: row.score,
          createdAt: row.created_at,
        },
      }
    }

    // 生成新挑战：从知识点向量表中随机选题
    const questionsResult = await client.query(
      `SELECT id, item_key, item_name, difficulty, tags, metadata_json
       FROM knowledge_vectors
       WHERE subject = $1 AND grade = $2
       ORDER BY RANDOM()
       LIMIT 5`,
      [subject, grade]
    )

    const questions = questionsResult.rows.map(q => ({
      id: q.id,
      key: q.item_key,
      name: q.item_name,
      difficulty: q.difficulty,
      tags: q.tags,
      metadata: q.metadata_json,
    }))

    return {
      code: 0,
      message: 'success',
      data: {
        id: null,
        subject,
        grade,
        questions,
        completed: false,
        score: 0,
      },
    }
  } catch (err) {
    console.error('[getDailyChallenge] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  } finally {
    await client.end()
  }
}
