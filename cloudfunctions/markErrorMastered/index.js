/**
 * markErrorMastered - 标记错题已掌握
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

    const { itemId } = event
    if (!itemId) {
      return { code: -1, message: '缺少 itemId' }
    }

    await client.connect()

    // 验证用户权限
    const userResult = await client.query('SELECT id FROM users WHERE openid = $1', [openid])
    if (userResult.rows.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const userId = userResult.rows[0].id

    // 更新 mastered 状态
    const result = await client.query(
      'UPDATE error_book SET mastered = true WHERE id = $1 AND user_id = $2',
      [itemId, userId]
    )

    if (result.rowCount === 0) {
      return { code: -1, message: '错题不存在或无权操作' }
    }

    return { code: 0, message: 'ok', data: null }
  } catch (err) {
    console.error('[markErrorMastered] error:', err)
    return { code: -1, message: err.message }
  } finally {
    await client.end().catch(() => {})
  }
}
