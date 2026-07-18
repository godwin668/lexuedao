/**
 * getPracticeRecords - 查询练习记录（通用，三科共用）
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
      return { code: 0, message: 'success', data: { records: [], total: 0 } }
    }
    const userId = userResult.rows[0].id

    const page = event.page || 1
    const pageSize = event.pageSize || 10
    const subject = event.subject || null
    const offset = (page - 1) * pageSize

    let whereClause = 'WHERE user_id = $1'
    const params = [userId]
    let paramIdx = 2

    if (subject) {
      whereClause += ` AND subject = $${paramIdx++}`
      params.push(subject)
    }

    // 总数
    const countResult = await client.query(
      `SELECT COUNT(*) as total FROM practice_records ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].total)

    // 分页查询
    const result = await client.query(
      `SELECT id, subject, type, grade, content_json, score, accuracy, duration, created_at
       FROM practice_records ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, pageSize, offset]
    )

    const records = result.rows.map(row => ({
      id: row.id,
      character: row.content_json?.character || '',
      mode: row.type,
      strokes: row.content_json?.strokes || [],
      score: row.score,
      accuracy: row.accuracy,
      aesthetics: row.content_json?.aesthetics || 0,
      duration: row.duration,
      createdAt: row.created_at,
    }))

    return { code: 0, message: 'success', data: { records, total } }
  } catch (err) {
    console.error('[getPracticeRecords] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  } finally {
    await client.end()
  }
}
