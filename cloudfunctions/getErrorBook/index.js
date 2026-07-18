/**
 * getErrorBook - 获取错题本
 */
const cloud = require('wx-server-sdk')
const { Client } = require('pg')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
  })

  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    const { subject, page = 1, pageSize = 20 } = event

    await client.connect()

    // 获取用户 ID
    const userResult = await client.query('SELECT id FROM users WHERE openid = $1', [openid])
    if (userResult.rows.length === 0) {
      return { code: 0, message: 'ok', data: { items: [], total: 0 } }
    }
    const userId = userResult.rows[0].id

    // 构建查询
    let whereClause = 'WHERE user_id = $1 AND mastered = false'
    const params = [userId]
    let paramIdx = 2

    if (subject) {
      whereClause += ` AND subject = $${paramIdx}`
      params.push(subject)
      paramIdx++
    }

    // 查询总数
    const countResult = await client.query(
      `SELECT COUNT(*) FROM error_book ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].count, 10)

    // 分页查询
    const offset = (page - 1) * pageSize
    const itemsResult = await client.query(
      `SELECT id, user_id, subject, item_key, error_count, last_error_at, mastered
       FROM error_book ${whereClause}
       ORDER BY last_error_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, pageSize, offset]
    )

    const items = itemsResult.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      subject: row.subject,
      itemKey: row.item_key,
      errorCount: row.error_count,
      lastErrorAt: row.last_error_at,
      mastered: row.mastered,
    }))

    return { code: 0, message: 'ok', data: { items, total } }
  } catch (err) {
    console.error('[getErrorBook] error:', err)
    return { code: 0, message: 'ok', data: { items: [], total: 0 } }
  } finally {
    await client.end().catch(() => {})
  }
}
