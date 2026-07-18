/**
 * updateUserProfile - 更新用户信息
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

    const sets = []
    const values = []
    let idx = 1

    if (event.nickname !== undefined) {
      sets.push(`nickname = $${idx++}`)
      values.push(event.nickname)
    }
    if (event.avatarUrl !== undefined) {
      sets.push(`avatar_url = $${idx++}`)
      values.push(event.avatarUrl)
    }
    if (event.grade !== undefined) {
      sets.push(`grade = $${idx++}`)
      values.push(event.grade)
    }

    if (sets.length === 0) {
      return { code: -1, message: '没有需要更新的字段', data: null }
    }

    sets.push(`updated_at = NOW()`)
    values.push(openid)

    const result = await client.query(
      `UPDATE users SET ${sets.join(', ')} WHERE openid = $${idx}
       RETURNING id, openid, nickname, avatar_url, role, grade, created_at, updated_at`,
      values
    )

    const row = result.rows[0]
    return {
      code: 0,
      message: 'success',
      data: {
        id: row.id,
        openid: row.openid,
        nickname: row.nickname,
        avatarUrl: row.avatar_url,
        role: row.role,
        grade: row.grade,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    }
  } catch (err) {
    console.error('[updateUserProfile] error:', err)
    return { code: -1, message: err.message || '服务异常', data: null }
  } finally {
    await client.end()
  }
}
