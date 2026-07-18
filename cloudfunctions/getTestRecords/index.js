/**
 * getTestRecords - 查询测试记录
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
    const offset = (page - 1) * pageSize

    const countResult = await client.query(
      `SELECT COUNT(*) as total FROM practice_records
       WHERE user_id = $1 AND type = 'test'`,
      [userId]
    )
    const total = parseInt(countResult.rows[0].total)

    const result = await client.query(
      `SELECT id, content_json, score, accuracy, duration, created_at
       FROM practice_records
       WHERE user_id = $1 AND type = 'test'
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset]
    )

    const records = result.rows.map(row => ({
      id: row.id,
      characters: row.content_json?.characters || [],
      scores: row.content_json?.scores || [],
      avgAccuracy: row.accuracy,
      totalTime: row.duration,
      createdAt: row.created_at,
    }))

    return { code: 0, message: 'success', data: { records, total } }
  } catch (err) {
    console.error('[getTestRecords] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  } finally {
    await client.end()
  }
}
